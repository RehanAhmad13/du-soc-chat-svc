"""
SLA Service for tenant configuration and enforcement
Handles SLA monitoring, escalation, and enforcement based on tenant settings
"""

from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.db.models import Q
from chat_svc.models import ChatThread, TenantConfiguration, Message
from integrations import event_bus, push
import logging

logger = logging.getLogger(__name__)


class SLAService:
    """Service for managing SLA compliance and enforcement"""
    
    @classmethod
    def get_sla_hours_for_thread(cls, thread):
        """Get SLA hours for a specific thread based on tenant configuration"""
        try:
            config = thread.tenant.config
            # For now, use default SLA. In the future, this could be based on
            # thread priority, template type, or other factors
            return config.default_sla_hours
        except (AttributeError, TenantConfiguration.DoesNotExist):
            # Fallback to global setting
            return getattr(settings, 'INCIDENT_SLA_HOURS', 24)
    
    @classmethod
    def get_thread_sla_status(cls, thread):
        """Get detailed SLA status for a thread"""
        sla_hours = cls.get_sla_hours_for_thread(thread)
        
        # Calculate thresholds
        sla_deadline = thread.created_at + timedelta(hours=sla_hours)
        warning_threshold = thread.created_at + timedelta(hours=sla_hours * 0.8)
        
        now = timezone.now()
        
        if now > sla_deadline:
            return {
                'status': 'breached',
                'hours_overdue': (now - sla_deadline).total_seconds() / 3600,
                'deadline': sla_deadline,
                'warning_threshold': warning_threshold
            }
        elif now > warning_threshold:
            return {
                'status': 'at_risk',
                'hours_remaining': (sla_deadline - now).total_seconds() / 3600,
                'deadline': sla_deadline,
                'warning_threshold': warning_threshold
            }
        else:
            return {
                'status': 'active',
                'hours_remaining': (sla_deadline - now).total_seconds() / 3600,
                'deadline': sla_deadline,
                'warning_threshold': warning_threshold
            }
    
    @classmethod
    def check_all_sla_violations(cls):
        """Check all active threads for SLA violations and trigger actions"""
        violations = []
        warnings = []
        
        # Get all active threads
        active_threads = ChatThread.objects.select_related('tenant', 'tenant__config').all()
        
        for thread in active_threads:
            sla_status = cls.get_thread_sla_status(thread)
            
            if sla_status['status'] == 'breached':
                violations.append({
                    'thread': thread,
                    'status': sla_status,
                    'tenant': thread.tenant
                })
                cls._handle_sla_breach(thread, sla_status)
            
            elif sla_status['status'] == 'at_risk':
                warnings.append({
                    'thread': thread,
                    'status': sla_status,
                    'tenant': thread.tenant
                })
                cls._handle_sla_warning(thread, sla_status)
        
        logger.info(f"SLA Check completed: {len(violations)} violations, {len(warnings)} warnings")
        
        return {
            'violations': violations,
            'warnings': warnings,
            'total_threads_checked': active_threads.count()
        }
    
    @classmethod
    def _handle_sla_breach(cls, thread, sla_status):
        """Handle SLA breach - escalation and notifications"""
        try:
            config = thread.tenant.config
            
            # Create escalation message
            escalation_message = f"SLA BREACH: Thread {thread.incident_id} exceeded SLA by {sla_status['hours_overdue']:.1f} hours"
            
            # Add system message to thread
            from chat_svc.models import User
            system_user = User.objects.filter(is_staff=True).first()
            if system_user:
                Message.objects.create(
                    thread=thread,
                    sender=system_user,
                    content=escalation_message
                )
            
            # Send escalation email if configured
            if config.escalation_email:
                cls._send_escalation_email(thread, sla_status, config.escalation_email)
            
            # Publish escalation event
            event_bus.publish_event("sla-events", {
                "type": "sla_breach",
                "thread_id": thread.id,
                "tenant_id": thread.tenant_id,
                "incident_id": thread.incident_id,
                "hours_overdue": sla_status['hours_overdue'],
                "deadline": sla_status['deadline'].isoformat(),
                "escalation_level": "critical"
            })
            
            logger.warning(f"SLA breach handled for thread {thread.incident_id}")
            
        except Exception as e:
            logger.error(f"Failed to handle SLA breach for thread {thread.incident_id}: {e}")
    
    @classmethod
    def _handle_sla_warning(cls, thread, sla_status):
        """Handle SLA warning - notifications and alerts"""
        try:
            config = thread.tenant.config
            
            # Only send warning if escalation is enabled and within warning threshold
            if not config.enable_auto_escalation:
                return
            
            hours_remaining = sla_status['hours_remaining']
            warning_hours = config.escalation_warning_hours
            
            if hours_remaining <= warning_hours:
                # Create warning message
                warning_message = f"SLA WARNING: Thread {thread.incident_id} approaching SLA deadline in {hours_remaining:.1f} hours"
                
                # Add system message to thread
                from chat_svc.models import User
                system_user = User.objects.filter(is_staff=True).first()
                if system_user:
                    Message.objects.create(
                        thread=thread,
                        sender=system_user,
                        content=warning_message
                    )
                
                # Send push notifications to tenant users
                from chat_svc.models import Device
                tokens = Device.objects.filter(
                    user__tenant_id=thread.tenant_id,
                    user__is_staff=True
                ).values_list("token", flat=True)
                
                if tokens:
                    push.send_push(
                        tokens, 
                        "SLA Warning", 
                        f"Thread {thread.incident_id} approaching deadline"
                    )
                
                # Publish warning event
                event_bus.publish_event("sla-events", {
                    "type": "sla_warning",
                    "thread_id": thread.id,
                    "tenant_id": thread.tenant_id,
                    "incident_id": thread.incident_id,
                    "hours_remaining": hours_remaining,
                    "deadline": sla_status['deadline'].isoformat(),
                    "escalation_level": "warning"
                })
                
                logger.info(f"SLA warning sent for thread {thread.incident_id}")
            
        except Exception as e:
            logger.error(f"Failed to handle SLA warning for thread {thread.incident_id}: {e}")
    
    @classmethod
    def _send_escalation_email(cls, thread, sla_status, email):
        """Send escalation email notification"""
        try:
            # This would integrate with your email service
            # For now, we'll just log it
            logger.info(f"Escalation email would be sent to {email} for thread {thread.incident_id}")
            
            # TODO: Implement actual email sending using Django's email backend
            # or integrate with your email service
            
        except Exception as e:
            logger.error(f"Failed to send escalation email: {e}")
    
    @classmethod
    def get_tenant_sla_report(cls, tenant, days=30):
        """Generate SLA performance report for a tenant"""
        from django.db.models import Count, Avg
        
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Get threads created in the period
        threads = tenant.chatthread_set.filter(created_at__gte=cutoff_date)
        
        total_threads = threads.count()
        if total_threads == 0:
            return {
                'total_threads': 0,
                'sla_compliance_rate': 100.0,
                'breached_threads': 0,
                'at_risk_threads': 0,
                'avg_resolution_time': 0,
                'period_days': days
            }
        
        # Calculate SLA compliance
        breached_count = 0
        at_risk_count = 0
        resolution_times = []
        
        for thread in threads:
            sla_status = cls.get_thread_sla_status(thread)
            
            if sla_status['status'] == 'breached':
                breached_count += 1
            elif sla_status['status'] == 'at_risk':
                at_risk_count += 1
            
            # Calculate resolution time if thread has messages
            last_message = thread.messages.order_by('-created_at').first()
            if last_message:
                resolution_time = (last_message.created_at - thread.created_at).total_seconds() / 3600
                resolution_times.append(resolution_time)
        
        # Calculate metrics
        compliance_rate = ((total_threads - breached_count) / total_threads) * 100
        avg_resolution_time = sum(resolution_times) / len(resolution_times) if resolution_times else 0
        
        return {
            'total_threads': total_threads,
            'sla_compliance_rate': round(compliance_rate, 2),
            'breached_threads': breached_count,
            'at_risk_threads': at_risk_count,
            'avg_resolution_time': round(avg_resolution_time, 2),
            'period_days': days,
            'report_generated_at': timezone.now().isoformat()
        }
    
    @classmethod
    def update_thread_priority(cls, thread, priority):
        """Update thread priority and recalculate SLA"""
        # This would be extended to support priority-based SLA
        # For now, we'll just log the change
        logger.info(f"Thread {thread.incident_id} priority updated to {priority}")
        
        # Future implementation could:
        # 1. Update thread priority field
        # 2. Recalculate SLA based on new priority
        # 3. Send notifications if SLA status changes
        
        return cls.get_thread_sla_status(thread)