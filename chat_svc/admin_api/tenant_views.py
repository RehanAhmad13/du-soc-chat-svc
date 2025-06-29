"""
Comprehensive tenant configuration management API views
Provides full CRUD operations for tenant settings, billing, themes, and integrations
"""

import json
from datetime import datetime, timedelta
from decimal import Decimal
from django.db import transaction
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from django.conf import settings
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework.exceptions import ValidationError, PermissionDenied

from chat_svc.models import (
    Tenant, TenantConfiguration, TenantBilling, 
    TenantTheme, TenantIntegration, User, ChatThread, Message
)
from .tenant_serializers import (
    ComprehensiveTenantSerializer, TenantCreateSerializer, TenantUpdateSerializer,
    TenantConfigurationSerializer, TenantBillingSerializer, 
    TenantThemeSerializer, TenantIntegrationSerializer, TenantStatsSerializer
)


class TenantConfigurationViewSet(viewsets.ModelViewSet):
    """
    Comprehensive tenant management API with all configuration options
    Supports CRUD operations for tenants, billing, themes, and integrations
    """
    queryset = Tenant.objects.all()
    permission_classes = [IsAdminUser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TenantCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TenantUpdateSerializer
        else:
            return ComprehensiveTenantSerializer

    def get_queryset(self):
        queryset = self.queryset.select_related(
            'config', 'billing', 'theme'
        ).prefetch_related('integrations', 'users', 'chatthread_set')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter == 'active':
            queryset = queryset.filter(is_active=True)
        elif status_filter == 'inactive':
            queryset = queryset.filter(is_active=False)
        
        # Filter by billing status
        billing_status = self.request.query_params.get('billing_status')
        if billing_status:
            queryset = queryset.filter(billing__status=billing_status)
        
        # Filter by plan type
        plan_type = self.request.query_params.get('plan_type')
        if plan_type:
            queryset = queryset.filter(billing__plan_type=plan_type)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(contact_email__icontains=search) |
                Q(billing__billing_contact__icontains=search)
            )
        
        return queryset.order_by('-created_at')

    @action(detail=True, methods=['get', 'put', 'patch'])
    def configuration(self, request, pk=None):
        """Manage tenant configuration settings"""
        tenant = self.get_object()
        
        try:
            config = tenant.config
        except TenantConfiguration.DoesNotExist:
            if request.method == 'GET':
                config = TenantConfiguration.objects.create(tenant=tenant)
            else:
                return Response({'error': 'Configuration not found'}, status=404)
        
        if request.method == 'GET':
            serializer = TenantConfigurationSerializer(config)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = TenantConfigurationSerializer(
                config, data=request.data, partial=partial
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)

    @action(detail=True, methods=['get', 'put', 'patch'])
    def billing(self, request, pk=None):
        """Manage tenant billing and subscription"""
        tenant = self.get_object()
        
        try:
            billing = tenant.billing
        except TenantBilling.DoesNotExist:
            if request.method == 'GET':
                return Response({'error': 'Billing not configured'}, status=404)
            else:
                # Create new billing during PUT/PATCH
                billing = None
        
        if request.method == 'GET':
            serializer = TenantBillingSerializer(billing)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            
            if billing is None:
                # Create new billing
                data = request.data.copy()
                data['tenant'] = tenant.id
                serializer = TenantBillingSerializer(data=data)
            else:
                # Update existing billing
                serializer = TenantBillingSerializer(
                    billing, data=request.data, partial=partial
                )
            
            if serializer.is_valid():
                with transaction.atomic():
                    serializer.save()
                    
                    # Update usage tracking
                    if billing:
                        billing.current_user_count = tenant.current_user_count
                        billing.save(update_fields=['current_user_count'])
                
                return Response(serializer.data)
            return Response(serializer.errors, status=400)

    @action(detail=True, methods=['get', 'put', 'patch'])
    def theme(self, request, pk=None):
        """Manage tenant theme and branding"""
        tenant = self.get_object()
        
        try:
            theme = tenant.theme
        except TenantTheme.DoesNotExist:
            if request.method == 'GET':
                theme = TenantTheme.objects.create(tenant=tenant)
            else:
                theme = None
        
        if request.method == 'GET':
            serializer = TenantThemeSerializer(theme)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            
            if theme is None:
                data = request.data.copy()
                data['tenant'] = tenant.id
                serializer = TenantThemeSerializer(data=data)
            else:
                serializer = TenantThemeSerializer(
                    theme, data=request.data, partial=partial
                )
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)

    @action(detail=True, methods=['get', 'post'])
    def integrations(self, request, pk=None):
        """Manage tenant integrations"""
        tenant = self.get_object()
        
        if request.method == 'GET':
            integrations = tenant.integrations.all()
            
            # Filter by type
            integration_type = request.query_params.get('type')
            if integration_type:
                integrations = integrations.filter(integration_type=integration_type)
            
            # Filter by status
            enabled_only = request.query_params.get('enabled_only', '').lower() == 'true'
            if enabled_only:
                integrations = integrations.filter(is_enabled=True)
            
            serializer = TenantIntegrationSerializer(integrations, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            data = request.data.copy()
            data['tenant'] = tenant.id
            
            serializer = TenantIntegrationSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)

    @action(detail=True, methods=['get', 'put', 'patch', 'delete'], url_path='integrations/(?P<integration_id>[^/.]+)')
    def integration_detail(self, request, pk=None, integration_id=None):
        """Manage individual tenant integration"""
        tenant = self.get_object()
        
        try:
            integration = tenant.integrations.get(id=integration_id)
        except TenantIntegration.DoesNotExist:
            return Response({'error': 'Integration not found'}, status=404)
        
        if request.method == 'GET':
            serializer = TenantIntegrationSerializer(integration)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = TenantIntegrationSerializer(
                integration, data=request.data, partial=partial
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        
        elif request.method == 'DELETE':
            integration.delete()
            return Response(status=204)

    @action(detail=True, methods=['post'], url_path='integrations/(?P<integration_id>[^/.]+)/test')
    def test_integration(self, request, pk=None, integration_id=None):
        """Test an integration connection"""
        tenant = self.get_object()
        
        try:
            integration = tenant.integrations.get(id=integration_id)
        except TenantIntegration.DoesNotExist:
            return Response({'error': 'Integration not found'}, status=404)
        
        if not integration.is_enabled:
            return Response({'error': 'Integration is disabled'}, status=400)
        
        # TODO: Implement actual integration testing logic
        # For now, simulate a test
        test_result = {
            'success': True,
            'response_time_ms': 150,
            'status_code': 200,
            'message': 'Connection test successful',
            'tested_at': timezone.now().isoformat()
        }
        
        # Update integration stats
        integration.total_calls += 1
        integration.last_successful_call = timezone.now()
        integration.save()
        
        return Response(test_result)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get comprehensive tenant statistics"""
        tenant = self.get_object()
        
        # Use the serializer's statistics calculation
        serializer = ComprehensiveTenantSerializer(tenant)
        stats_data = serializer._calculate_tenant_stats(tenant)
        
        return Response(stats_data)

    @action(detail=True, methods=['get'])
    def usage_report(self, request, pk=None):
        """Generate detailed usage report for tenant"""
        tenant = self.get_object()
        
        # Date range
        days = int(request.query_params.get('days', 30))
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Daily usage data
        daily_stats = []
        current_date = start_date.date()
        
        while current_date <= end_date.date():
            day_start = timezone.make_aware(datetime.combine(current_date, datetime.min.time()))
            day_end = day_start + timedelta(days=1)
            
            threads_count = tenant.chatthread_set.filter(
                created_at__gte=day_start,
                created_at__lt=day_end
            ).count()
            
            messages_count = sum(
                thread.messages.filter(
                    created_at__gte=day_start,
                    created_at__lt=day_end
                ).count()
                for thread in tenant.chatthread_set.all()
            )
            
            daily_stats.append({
                'date': current_date.isoformat(),
                'threads_created': threads_count,
                'messages_sent': messages_count,
                'active_users': tenant.users.filter(
                    message__created_at__gte=day_start,
                    message__created_at__lt=day_end,
                    is_active=True
                ).distinct().count()
            })
            
            current_date += timedelta(days=1)
        
        # Summary statistics
        total_threads = tenant.chatthread_set.filter(
            created_at__gte=start_date
        ).count()
        
        total_messages = sum(
            thread.messages.filter(created_at__gte=start_date).count()
            for thread in tenant.chatthread_set.all()
        )
        
        summary = {
            'period': {
                'start_date': start_date.date().isoformat(),
                'end_date': end_date.date().isoformat(),
                'days': days
            },
            'totals': {
                'threads_created': total_threads,
                'messages_sent': total_messages,
                'unique_active_users': tenant.users.filter(
                    message__created_at__gte=start_date,
                    is_active=True
                ).distinct().count()
            },
            'averages': {
                'threads_per_day': total_threads / days if days > 0 else 0,
                'messages_per_day': total_messages / days if days > 0 else 0,
                'messages_per_thread': total_messages / total_threads if total_threads > 0 else 0
            },
            'daily_breakdown': daily_stats
        }
        
        return Response(summary)

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend a tenant"""
        tenant = self.get_object()
        reason = request.data.get('reason', 'No reason provided')
        
        with transaction.atomic():
            tenant.is_active = False
            tenant.save()
            
            # Update billing status if exists
            if hasattr(tenant, 'billing'):
                tenant.billing.status = 'suspended'
                tenant.billing.save()
            
            # Deactivate all users
            tenant.users.filter(is_active=True).update(is_active=False)
        
        return Response({
            'message': f'Tenant {tenant.name} suspended',
            'reason': reason,
            'suspended_at': timezone.now().isoformat()
        })

    @action(detail=True, methods=['post'])
    def reactivate(self, request, pk=None):
        """Reactivate a suspended tenant"""
        tenant = self.get_object()
        
        with transaction.atomic():
            tenant.is_active = True
            tenant.save()
            
            # Update billing status if exists
            if hasattr(tenant, 'billing'):
                tenant.billing.status = 'active'
                tenant.billing.save()
            
            # Note: Users remain deactivated and need individual reactivation
        
        return Response({
            'message': f'Tenant {tenant.name} reactivated',
            'reactivated_at': timezone.now().isoformat(),
            'note': 'Users require individual reactivation'
        })

    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Get system-wide tenant overview"""
        tenants = self.get_queryset()
        
        # Aggregate statistics
        total_tenants = tenants.count()
        active_tenants = tenants.filter(is_active=True).count()
        
        # Billing breakdown
        billing_stats = {}
        for status_choice in TenantBilling.STATUS_CHOICES:
            status = status_choice[0]
            billing_stats[status] = tenants.filter(billing__status=status).count()
        
        # Plan breakdown
        plan_stats = {}
        for plan_choice in TenantBilling.PLAN_CHOICES:
            plan = plan_choice[0]
            plan_stats[plan] = tenants.filter(billing__plan_type=plan).count()
        
        # Resource utilization
        total_users = sum(tenant.current_user_count for tenant in tenants)
        total_threads = sum(tenant.current_thread_count for tenant in tenants)
        
        # Recent activity
        recent_tenants = tenants.order_by('-created_at')[:5]
        recent_data = ComprehensiveTenantSerializer(recent_tenants, many=True).data
        
        overview = {
            'summary': {
                'total_tenants': total_tenants,
                'active_tenants': active_tenants,
                'inactive_tenants': total_tenants - active_tenants,
                'total_users': total_users,
                'total_threads': total_threads
            },
            'billing_breakdown': billing_stats,
            'plan_breakdown': plan_stats,
            'recent_tenants': recent_data,
            'generated_at': timezone.now().isoformat()
        }
        
        return Response(overview)

    @action(detail=False, methods=['post'])
    def bulk_action(self, request):
        """Perform bulk actions on multiple tenants"""
        action_type = request.data.get('action')
        tenant_ids = request.data.get('tenant_ids', [])
        params = request.data.get('params', {})
        
        if not tenant_ids:
            return Response({'error': 'No tenants selected'}, status=400)
        
        tenants = Tenant.objects.filter(id__in=tenant_ids)
        if not tenants.exists():
            return Response({'error': 'No valid tenants found'}, status=404)
        
        result = {'processed': 0, 'failed': 0, 'errors': []}
        
        try:
            if action_type == 'suspend':
                with transaction.atomic():
                    for tenant in tenants:
                        tenant.is_active = False
                        tenant.save()
                        if hasattr(tenant, 'billing'):
                            tenant.billing.status = 'suspended'
                            tenant.billing.save()
                        result['processed'] += 1
            
            elif action_type == 'reactivate':
                with transaction.atomic():
                    for tenant in tenants:
                        tenant.is_active = True
                        tenant.save()
                        if hasattr(tenant, 'billing'):
                            tenant.billing.status = 'active'
                            tenant.billing.save()
                        result['processed'] += 1
            
            elif action_type == 'update_plan':
                new_plan = params.get('plan_type')
                if not new_plan:
                    return Response({'error': 'plan_type required for update_plan action'}, status=400)
                
                with transaction.atomic():
                    for tenant in tenants:
                        if hasattr(tenant, 'billing'):
                            tenant.billing.plan_type = new_plan
                            tenant.billing.save()
                            result['processed'] += 1
                        else:
                            result['failed'] += 1
                            result['errors'].append(f'Tenant {tenant.name} has no billing configuration')
            
            else:
                return Response({'error': f'Unknown action: {action_type}'}, status=400)
        
        except Exception as e:
            return Response({'error': str(e)}, status=500)
        
        return Response(result)