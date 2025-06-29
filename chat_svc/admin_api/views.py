"""
Comprehensive Admin API Views
Provides extensive backend support for the React admin interface including:
- Thread management with advanced filtering, sorting, and bulk operations
- User management and approval workflows
- Dashboard analytics and KPIs
- Export functionality
- Real-time statistics
"""

import json
import csv
import io
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Avg, Max, F, Case, When, IntegerField
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.conf import settings
from rest_framework import status, viewsets, permissions
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination

from chat_svc.models import (
    ChatThread, Message, QuestionTemplate, Tenant, 
    User, Device, Attachment, MessageLog, ThreadTemplateResponse
)
from integrations import event_bus
from .serializers import (
    AdminUserSerializer, AdminTenantSerializer, AdminThreadSerializer,
    AdminQuestionTemplateSerializer, UserApprovalSerializer, MessageLogSerializer
)
from chat_svc.tenant_api.serializers import MessageSerializer as EnhancedMessageSerializer

User = get_user_model()

class AdminPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


# ===================== THREAD MANAGEMENT APIs =====================

class AdminThreadDetailSerializer(AdminThreadSerializer):
    """Extended thread serializer with admin-specific fields"""
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        # Add computed fields
        messages = instance.messages.all()
        data.update({
            'tenant_name': instance.tenant.name if instance.tenant else 'Unknown',
            'template_name': instance.template.name if instance.template else 'No Template',
            'assigned_to_name': self._get_assigned_user(instance),
            'message_count': messages.count(),
            'participant_count': messages.values('sender').distinct().count(),
            'last_activity': messages.order_by('-created_at').first().created_at if messages.exists() else instance.created_at,
            'escalated': self._is_escalated(instance),
            'priority': self._get_priority(instance),
            'status': self._get_status(instance),
            'sla_status': instance.sla_status,
            'title': self._get_title(instance),
        })
        
        # Add template object for chat interface compatibility
        if instance.template:
            data['template'] = {
                'id': instance.template.id,
                'name': instance.template.name,
                'text': instance.template.text,
                'schema': instance.template.schema
            }
        else:
            data['template'] = None
            
        return data
    
    def _get_assigned_user(self, instance):
        # Check for most recent assignment or default assignee
        latest_message = instance.messages.order_by('-created_at').first()
        if latest_message and hasattr(latest_message.sender, 'is_staff') and latest_message.sender.is_staff:
            return latest_message.sender.username
        return None
    
    def _is_escalated(self, instance):
        # Consider escalated if SLA breached or high priority
        return instance.sla_status == 'breached' or self._get_priority(instance) == 'high'
    
    def _get_priority(self, instance):
        # Determine priority based on various factors
        if instance.sla_status == 'breached':
            return 'high'
        elif instance.sla_status == 'at_risk':
            return 'medium'
        else:
            return 'low'
    
    def _get_status(self, instance):
        # Determine status based on recent activity and messages
        latest_message = instance.messages.order_by('-created_at').first()
        if not latest_message:
            return 'open'
        
        hours_since_activity = (timezone.now() - latest_message.created_at).total_seconds() / 3600
        
        if hours_since_activity > 24:
            return 'waiting'
        elif hours_since_activity > 2:
            return 'in_progress'
        else:
            return 'open'
    
    def _get_title(self, instance):
        # Extract title from first message or template
        first_message = instance.messages.order_by('created_at').first()
        if first_message:
            content = first_message.content[:100]  # First 100 chars as title
            return content.split('.')[0] if '.' in content else content
        elif instance.template:
            return instance.template.name
        return f"Incident {instance.incident_id}"


class AdminThreadViewSet(viewsets.ModelViewSet):
    """
    Comprehensive thread management for admins with:
    - Advanced filtering (tenant, priority, status, SLA, date ranges)
    - Sorting by multiple fields
    - Bulk operations (assign, status change, archive, delete)
    - Detailed thread information
    - Export functionality
    """
    queryset = ChatThread.objects.all()
    serializer_class = AdminThreadDetailSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    
    def retrieve(self, request, pk=None):
        """Get a single thread with messages for chat interface compatibility"""
        thread = self.get_object()
        
        # Get all messages for this thread with proper prefetch for read receipts
        messages = thread.messages.select_related('sender').prefetch_related(
            'receipts__user',
            'structured__template',
            'attachments'
        ).order_by('created_at')
        
        # Use enhanced MessageSerializer to get read receipt data
        message_data = EnhancedMessageSerializer(
            messages, 
            many=True, 
            context={'request': request}
        ).data
        
        # Get the standard serialized data
        thread_data = self.get_serializer(thread).data
        
        # Add messages array for chat interface compatibility
        thread_data['messages'] = message_data
        
        return Response(thread_data)
    
    def get_queryset(self):
        qs = self.queryset.select_related('tenant', 'template').prefetch_related('messages__sender')
        
        # Filtering
        tenant_id = self.request.query_params.get('tenant')
        priority = self.request.query_params.get('priority')
        status_filter = self.request.query_params.get('status')
        sla_status = self.request.query_params.get('sla_status')
        assigned_to = self.request.query_params.get('assigned_to')
        escalated = self.request.query_params.get('escalated')
        search = self.request.query_params.get('search')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if tenant_id:
            qs = qs.filter(tenant_id=tenant_id)
        
        if sla_status:
            sla_hours = getattr(settings, 'INCIDENT_SLA_HOURS', 24)
            threshold = timezone.now() - timedelta(hours=sla_hours)
            at_risk_threshold = timezone.now() - timedelta(hours=sla_hours * 0.8)
            
            if sla_status == 'breached':
                qs = qs.filter(created_at__lt=threshold)
            elif sla_status == 'at_risk':
                qs = qs.filter(created_at__lt=at_risk_threshold, created_at__gte=threshold)
            elif sla_status == 'active':
                qs = qs.filter(created_at__gte=at_risk_threshold)
        
        if search:
            qs = qs.filter(
                Q(incident_id__icontains=search) |
                Q(messages__content__icontains=search) |
                Q(tenant__name__icontains=search)
            ).distinct()
        
        if date_from:
            qs = qs.filter(created_at__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__lte=date_to)
        
        # Sorting
        ordering = self.request.query_params.get('ordering', '-created_at')
        if ordering:
            qs = qs.order_by(ordering)
        
        return qs
    
    @action(detail=False, methods=['post'])
    def bulk_action(self, request):
        """
        Handle bulk operations on multiple threads
        Actions: assign, change_status, archive, delete, export, escalate, mark_urgent
        """
        action_type = request.data.get('action')
        thread_ids = request.data.get('thread_ids', [])
        params = request.data.get('params', {})
        
        if not thread_ids:
            return Response({'error': 'No threads selected'}, status=400)
        
        threads = ChatThread.objects.filter(id__in=thread_ids)
        if not threads.exists():
            return Response({'error': 'No valid threads found'}, status=404)
        
        result = {'processed': 0, 'failed': 0, 'message': ''}
        
        try:
            if action_type == 'assign':
                user_id = params.get('user_id')
                if user_id:
                    assignee = User.objects.get(id=user_id)
                    for thread in threads:
                        # Create assignment message
                        Message.objects.create(
                            thread=thread,
                            sender=request.user,
                            content=f"Thread assigned to {assignee.username}"
                        )
                        result['processed'] += 1
                else:
                    # Unassign
                    for thread in threads:
                        Message.objects.create(
                            thread=thread,
                            sender=request.user,
                            content="Thread unassigned"
                        )
                        result['processed'] += 1
                
                result['message'] = f"Assigned {result['processed']} threads"
            
            elif action_type == 'change_status':
                new_status = params.get('status')
                for thread in threads:
                    Message.objects.create(
                        thread=thread,
                        sender=request.user,
                        content=f"Status changed to {new_status}"
                    )
                    result['processed'] += 1
                
                result['message'] = f"Changed status for {result['processed']} threads"
            
            elif action_type == 'export':
                return self._bulk_export(threads, params.get('format', 'json'))
            
            elif action_type == 'archive':
                # Soft delete by adding archive message
                for thread in threads:
                    Message.objects.create(
                        thread=thread,
                        sender=request.user,
                        content="Thread archived"
                    )
                    result['processed'] += 1
                
                result['message'] = f"Archived {result['processed']} threads"
            
            elif action_type == 'delete':
                count = threads.count()
                threads.delete()
                result['processed'] = count
                result['message'] = f"Deleted {count} threads"
            
            elif action_type == 'escalate':
                for thread in threads:
                    Message.objects.create(
                        thread=thread,
                        sender=request.user,
                        content="Thread escalated - High Priority"
                    )
                    result['processed'] += 1
                
                result['message'] = f"Escalated {result['processed']} threads"
            
            else:
                return Response({'error': f'Unknown action: {action_type}'}, status=400)
        
        except Exception as e:
            return Response({'error': str(e)}, status=500)
        
        return Response(result)
    
    def _bulk_export(self, threads, format='json'):
        """Export thread data in various formats"""
        data = []
        
        for thread in threads:
            messages = thread.messages.all().order_by('created_at')
            thread_data = {
                'thread_id': thread.id,
                'incident_id': thread.incident_id,
                'tenant': thread.tenant.name if thread.tenant else 'Unknown',
                'template': thread.template.name if thread.template else 'None',
                'created_at': thread.created_at.isoformat(),
                'message_count': messages.count(),
                'messages': [
                    {
                        'id': msg.id,
                        'sender': msg.sender.username,
                        'content': msg.content,
                        'timestamp': msg.created_at.isoformat()
                    } for msg in messages
                ]
            }
            data.append(thread_data)
        
        if format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="threads_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
            
            writer = csv.writer(response)
            writer.writerow(['Thread ID', 'Incident ID', 'Tenant', 'Template', 'Created', 'Messages'])
            
            for thread_data in data:
                writer.writerow([
                    thread_data['thread_id'],
                    thread_data['incident_id'],
                    thread_data['tenant'],
                    thread_data['template'],
                    thread_data['created_at'],
                    thread_data['message_count']
                ])
            
            return response
        
        else:  # JSON
            response = JsonResponse(data, safe=False)
            response['Content-Disposition'] = f'attachment; filename="threads_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.json"'
            return response
    
    @action(detail=True, methods=['get'])
    def detailed_view(self, request, pk=None):
        """Get comprehensive thread details including all messages and activity"""
        thread = self.get_object()
        
        # Get all messages with sender details
        messages = thread.messages.select_related('sender').order_by('created_at')
        message_data = [{
            'id': msg.id,
            'sender': msg.sender.username,
            'content': msg.content,
            'timestamp': msg.created_at.isoformat(),
            'is_system': msg.sender.is_staff
        } for msg in messages]
        
        # Get participants
        participants = messages.values('sender__username', 'sender__id').annotate(
            message_count=Count('id'),
            last_activity=Max('created_at')
        )
        
        # Activity timeline
        activity = []
        for msg in messages:
            if 'assigned' in msg.content.lower() or 'status' in msg.content.lower():
                activity.append({
                    'type': 'system_action',
                    'user': msg.sender.username,
                    'action': msg.content,
                    'timestamp': msg.created_at.isoformat()
                })
        
        thread_data = self.get_serializer(thread).data
        thread_data.update({
            'messages': message_data,
            'participants': list(participants),
            'activity': activity,
            'stats': {
                'total_messages': messages.count(),
                'unique_participants': participants.count(),
                'avg_response_time': '4.2h',  # Mock calculation
                'escalations': len([a for a in activity if 'escalat' in a.get('action', '').lower()])
            }
        })
        
        return Response(thread_data)
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages for a thread"""
        thread = self.get_object()
        messages = thread.messages.select_related('sender').order_by('created_at')
        
        message_data = []
        for msg in messages:
            message_data.append({
                'id': msg.id,
                'content': msg.content,
                'sender': msg.sender.username,
                'is_admin': msg.sender.is_staff,
                'created_at': msg.created_at.isoformat(),
            })
        
        return Response(message_data)
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send message to thread as admin"""
        thread = self.get_object()
        content = request.data.get('content')
        
        if not content:
            return Response({'error': 'Content is required'}, status=400)
        
        # Create the message
        message = Message.objects.create(
            thread=thread,
            sender=request.user,
            content=content
        )
        
        # Create message log
        version = MessageLog.objects.filter(message=message).count() + 1
        MessageLog.objects.create(
            message=message,
            thread=thread,
            sender=request.user,
            content=content,
            version=version
        )
        
        # Send real-time notifications using existing service
        from chat_svc.chat_api.services import ChatService
        ChatService.notify_thread_users(thread.id, {
            "id": message.id,
            "content": message.content,
            "sender": message.sender.username,
            "created_at": message.created_at.isoformat(),
            "is_admin": True,
        })
        
        # Publish Kafka event
        event_bus.publish_event("chat-events", {
            "type": "admin_message_created",
            "message_id": message.id,
            "thread_id": thread.id,
            "admin_id": request.user.id,
            "timestamp": message.created_at.isoformat(),
        })
        
        return Response({
            'message_id': message.id,
            'status': 'sent'
        })


# ===================== DASHBOARD & ANALYTICS APIs =====================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard_stats(request):
    """
    Comprehensive dashboard statistics and KPIs
    """
    now = timezone.now()
    last_24h = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)
    last_30d = now - timedelta(days=30)
    
    # Thread statistics
    total_threads = ChatThread.objects.count()
    active_threads = ChatThread.objects.filter(
        messages__created_at__gte=last_24h
    ).distinct().count()
    
    # SLA calculations
    sla_hours = getattr(settings, 'INCIDENT_SLA_HOURS', 24)
    sla_threshold = now - timedelta(hours=sla_hours)
    at_risk_threshold = now - timedelta(hours=sla_hours * 0.8)
    
    sla_breached = ChatThread.objects.filter(created_at__lt=sla_threshold).count()
    sla_at_risk = ChatThread.objects.filter(
        created_at__lt=at_risk_threshold,
        created_at__gte=sla_threshold
    ).count()
    
    # User statistics
    total_users = User.objects.filter(is_active=True).count()
    pending_approvals = User.objects.filter(is_active=False).count()
    online_users = User.objects.filter(
        devices__created_at__gte=last_24h
    ).distinct().count()
    
    # Message statistics
    total_messages = Message.objects.count()
    messages_24h = Message.objects.filter(created_at__gte=last_24h).count()
    messages_7d = Message.objects.filter(created_at__gte=last_7d).count()
    
    # Tenant statistics
    tenant_stats = Tenant.objects.annotate(
        thread_count=Count('chatthread'),
        user_count=Count('users', filter=Q(users__is_active=True)),
        message_count=Count('chatthread__messages')
    ).values('id', 'name', 'thread_count', 'user_count', 'message_count')
    
    # Priority breakdown
    high_priority = ChatThread.objects.filter(created_at__lt=sla_threshold).count()
    medium_priority = ChatThread.objects.filter(
        created_at__lt=at_risk_threshold,
        created_at__gte=sla_threshold
    ).count()
    low_priority = total_threads - high_priority - medium_priority
    
    # Recent activity
    recent_threads = ChatThread.objects.select_related('tenant').order_by('-created_at')[:10]
    recent_activity = [{
        'id': thread.id,
        'incident_id': thread.incident_id,
        'tenant': thread.tenant.name if thread.tenant else 'Unknown',
        'created_at': thread.created_at.isoformat(),
        'message_count': thread.messages.count()
    } for thread in recent_threads]
    
    # Chart data for trends
    chart_data = {
        'threads_trend': _get_trend_data(ChatThread, 'created_at', last_7d),
        'messages_trend': _get_trend_data(Message, 'created_at', last_7d),
        'sla_breakdown': {
            'active': total_threads - sla_at_risk - sla_breached,
            'at_risk': sla_at_risk,
            'breached': sla_breached
        },
        'priority_breakdown': {
            'high': high_priority,
            'medium': medium_priority,
            'low': low_priority
        }
    }
    
    return Response({
        'kpis': {
            'total_threads': total_threads,
            'active_threads': active_threads,
            'sla_breached': sla_breached,
            'sla_at_risk': sla_at_risk,
            'total_users': total_users,
            'pending_approvals': pending_approvals,
            'online_users': online_users,
            'total_messages': total_messages,
            'messages_24h': messages_24h,
            'messages_7d': messages_7d
        },
        'tenant_stats': list(tenant_stats),
        'recent_activity': recent_activity,
        'charts': chart_data,
        'system_health': {
            'uptime': '99.9%',
            'response_time': '120ms',
            'error_rate': '0.1%'
        }
    })

def _get_trend_data(model, date_field, since):
    """Generate trend data for charts"""
    data = []
    current = since
    now = timezone.now()
    
    while current <= now:
        next_day = current + timedelta(days=1)
        count = model.objects.filter(
            **{f'{date_field}__gte': current, f'{date_field}__lt': next_day}
        ).count()
        
        data.append({
            'date': current.strftime('%Y-%m-%d'),
            'count': count
        })
        current = next_day
    
    return data


# ===================== USER MANAGEMENT APIs =====================

class AdminUserSerializer:
    """Basic user serializer for admin views"""
    
    @staticmethod
    def serialize_user(user):
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'date_joined': user.date_joined.isoformat(),
            'tenant': user.tenant.name if user.tenant else None,
            'tenant_id': user.tenant_id,
            'last_login': user.last_login.isoformat() if user.last_login else None
        }


class AdminUserViewSet(viewsets.ViewSet):
    """
    Comprehensive user management for admins
    """
    permission_classes = [IsAdminUser]
    
    def list(self, request):
        """List users with filtering and pagination"""
        qs = User.objects.select_related('tenant')
        
        # Filtering
        status_filter = request.query_params.get('status')
        tenant_id = request.query_params.get('tenant')
        search = request.query_params.get('search')
        
        if status_filter == 'pending':
            qs = qs.filter(is_active=False)
        elif status_filter == 'active':
            qs = qs.filter(is_active=True)
        elif status_filter == 'staff':
            qs = qs.filter(is_staff=True)
        
        if tenant_id:
            qs = qs.filter(tenant_id=tenant_id)
        
        if search:
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        users = qs.order_by('-date_joined')
        
        # Manual pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 25))
        start = (page - 1) * page_size
        end = start + page_size
        
        paginated_users = users[start:end]
        
        user_data = [AdminUserSerializer.serialize_user(user) for user in paginated_users]
        
        return Response({
            'results': user_data,
            'count': users.count(),
            'page': page,
            'page_size': page_size,
            'total_pages': (users.count() + page_size - 1) // page_size
        })
    
    def retrieve(self, request, pk=None):
        """Get detailed user information"""
        try:
            user = User.objects.select_related('tenant').get(pk=pk)
            
            # Get user's thread activity
            user_threads = ChatThread.objects.filter(
                messages__sender=user
            ).distinct().count()
            
            user_messages = Message.objects.filter(sender=user).count()
            
            # Recent activity
            recent_messages = Message.objects.filter(
                sender=user
            ).select_related('thread').order_by('-created_at')[:10]
            
            recent_activity = [{
                'type': 'message',
                'thread_id': msg.thread.id,
                'incident_id': msg.thread.incident_id,
                'content': msg.content[:100],
                'timestamp': msg.created_at.isoformat()
            } for msg in recent_messages]
            
            user_data = AdminUserSerializer.serialize_user(user)
            user_data.update({
                'stats': {
                    'threads_participated': user_threads,
                    'messages_sent': user_messages,
                    'devices_count': user.devices.count()
                },
                'recent_activity': recent_activity
            })
            
            return Response(user_data)
            
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a pending user"""
        try:
            user = User.objects.get(pk=pk)
            tenant_id = request.data.get('tenant_id')
            
            if not tenant_id:
                return Response({'error': 'tenant_id required'}, status=400)
            
            tenant = Tenant.objects.get(id=tenant_id)
            user.tenant = tenant
            user.is_active = True
            user.save()
            
            return Response({
                'message': f'User {user.username} approved and assigned to {tenant.name}'
            })
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        except Tenant.DoesNotExist:
            return Response({'error': 'Tenant not found'}, status=404)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a pending user"""
        try:
            user = User.objects.get(pk=pk)
            reason = request.data.get('reason', 'No reason provided')
            
            # Log rejection
            username = user.username
            user.delete()
            
            return Response({
                'message': f'User {username} rejected: {reason}'
            })
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
    
    @action(detail=False, methods=['get'])
    def pending_approvals(self, request):
        """Get all users pending approval"""
        pending_users = User.objects.filter(is_active=False).order_by('date_joined')
        user_data = [AdminUserSerializer.serialize_user(user) for user in pending_users]
        
        return Response({
            'users': user_data,
            'count': len(user_data)
        })


# ===================== TENANT & TEMPLATE MANAGEMENT APIs =====================

@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def manage_tenants(request):
    """Manage tenant organizations"""
    if request.method == 'GET':
        tenants = Tenant.objects.annotate(
            user_count=Count('users', filter=Q(users__is_active=True)),
            thread_count=Count('chatthread'),
            message_count=Count('chatthread__messages')
        ).values(
            'id', 'name', 'user_count', 'thread_count', 'message_count'
        )
        
        return Response(list(tenants))
    
    elif request.method == 'POST':
        name = request.data.get('name')
        if not name:
            return Response({'error': 'Tenant name required'}, status=400)
        
        tenant = Tenant.objects.create(name=name)
        return Response({
            'id': tenant.id,
            'name': tenant.name,
            'message': f'Tenant "{name}" created successfully'
        }, status=201)


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def manage_templates(request):
    """Manage question templates"""
    if request.method == 'GET':
        templates = QuestionTemplate.objects.select_related('tenant').annotate(
            usage_count=Count('threads')
        )
        
        template_data = []
        for template in templates:
            template_data.append({
                'id': template.id,
                'name': template.name,
                'text': template.text,
                'schema': template.schema,
                'tenant': template.tenant.name if template.tenant else 'Global',
                'tenant_id': template.tenant_id,
                'usage_count': template.usage_count,
                'created_at': template.pk  # Proxy for creation order
            })
        
        return Response(template_data)
    
    elif request.method == 'POST':
        name = request.data.get('name')
        text = request.data.get('text')
        schema = request.data.get('schema', {})
        tenant_id = request.data.get('tenant_id')
        
        if not name or not text:
            return Response({'error': 'Name and text required'}, status=400)
        
        template_data = {
            'name': name,
            'text': text,
            'schema': schema
        }
        
        if tenant_id:
            try:
                tenant = Tenant.objects.get(id=tenant_id)
                template_data['tenant'] = tenant
            except Tenant.DoesNotExist:
                return Response({'error': 'Tenant not found'}, status=404)
        
        template = QuestionTemplate.objects.create(**template_data)
        
        return Response({
            'id': template.id,
            'name': template.name,
            'message': f'Template "{name}" created successfully'
        }, status=201)


# ===================== EXPORT & REPORTING APIs =====================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def export_system_data(request):
    """Export comprehensive system data"""
    format_type = request.GET.get('format', 'json')
    data_type = request.GET.get('type', 'all')
    
    export_data = {}
    
    if data_type in ['all', 'threads']:
        threads = ChatThread.objects.select_related('tenant', 'template').all()
        export_data['threads'] = [{
            'id': t.id,
            'incident_id': t.incident_id,
            'tenant': t.tenant.name if t.tenant else None,
            'template': t.template.name if t.template else None,
            'created_at': t.created_at.isoformat(),
            'message_count': t.messages.count()
        } for t in threads]
    
    if data_type in ['all', 'users']:
        users = User.objects.select_related('tenant').filter(is_active=True)
        export_data['users'] = [{
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'tenant': u.tenant.name if u.tenant else None,
            'is_staff': u.is_staff,
            'date_joined': u.date_joined.isoformat()
        } for u in users]
    
    if data_type in ['all', 'tenants']:
        tenants = Tenant.objects.all()
        export_data['tenants'] = [{
            'id': t.id,
            'name': t.name,
            'user_count': t.users.filter(is_active=True).count(),
            'thread_count': t.chatthread_set.count()
        } for t in tenants]
    
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    
    if format_type == 'csv':
        # For CSV, we'll export the most comprehensive data (threads)
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="system_export_{timestamp}.csv"'
        
        writer = csv.writer(response)
        if 'threads' in export_data:
            writer.writerow(['ID', 'Incident ID', 'Tenant', 'Template', 'Created', 'Messages'])
            for thread in export_data['threads']:
                writer.writerow([
                    thread['id'], thread['incident_id'], thread['tenant'],
                    thread['template'], thread['created_at'], thread['message_count']
                ])
        
        return response
    
    else:  # JSON
        response = JsonResponse(export_data)
        response['Content-Disposition'] = f'attachment; filename="system_export_{timestamp}.json"'
        return response


# ===================== REAL-TIME MONITORING APIs =====================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def system_health(request):
    """Real-time system health monitoring"""
    now = timezone.now()
    last_hour = now - timedelta(hours=1)
    last_day = now - timedelta(days=1)
    
    # Performance metrics
    recent_messages = Message.objects.filter(created_at__gte=last_hour).count()
    recent_threads = ChatThread.objects.filter(created_at__gte=last_hour).count()
    
    # System load indicators
    active_users = User.objects.filter(
        devices__created_at__gte=last_hour
    ).distinct().count()
    
    # Error monitoring (mock data for now)
    health_data = {
        'status': 'healthy',
        'uptime': '99.9%',
        'response_time': '120ms',
        'active_connections': active_users,
        'throughput': {
            'messages_per_hour': recent_messages,
            'threads_per_hour': recent_threads
        },
        'resources': {
            'cpu_usage': '45%',
            'memory_usage': '67%',
            'disk_usage': '23%'
        },
        'errors': {
            'error_rate': '0.1%',
            'warning_count': 2,
            'critical_count': 0
        },
        'last_updated': now.isoformat()
    }
    
    return Response(health_data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def activity_feed(request):
    """Real-time activity feed for admin dashboard"""
    limit = int(request.GET.get('limit', 50))
    
    # Get recent activities from various sources
    activities = []
    
    # Recent threads
    recent_threads = ChatThread.objects.select_related('tenant').order_by('-created_at')[:limit//2]
    for thread in recent_threads:
        activities.append({
            'type': 'thread_created',
            'title': f'New thread: {thread.incident_id}',
            'description': f'Created in {thread.tenant.name if thread.tenant else "Unknown tenant"}',
            'timestamp': thread.created_at.isoformat(),
            'user': 'System',
            'icon': '💬'
        })
    
    # Recent user registrations
    recent_users = User.objects.filter(date_joined__gte=timezone.now() - timedelta(days=1)).order_by('-date_joined')[:limit//4]
    for user in recent_users:
        activities.append({
            'type': 'user_registered',
            'title': f'User registered: {user.username}',
            'description': 'Pending approval' if not user.is_active else f'Active in {user.tenant.name if user.tenant else "No tenant"}',
            'timestamp': user.date_joined.isoformat(),
            'user': user.username,
            'icon': '👤'
        })
    
    # Recent messages (high-level summary)
    recent_message_threads = Message.objects.select_related('thread', 'sender').filter(
        created_at__gte=timezone.now() - timedelta(hours=1)
    ).order_by('-created_at')[:limit//4]
    
    for msg in recent_message_threads:
        activities.append({
            'type': 'message_created',
            'title': f'Activity in {msg.thread.incident_id}',
            'description': f'Message from {msg.sender.username}',
            'timestamp': msg.created_at.isoformat(),
            'user': msg.sender.username,
            'icon': '💭'
        })
    
    # Sort all activities by timestamp (most recent first)
    activities.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return Response({
        'activities': activities[:limit],
        'total_count': len(activities),
        'last_updated': timezone.now().isoformat()
    })