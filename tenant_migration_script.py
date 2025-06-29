#!/usr/bin/env python
"""
Manual migration script to safely add tenant configuration models
"""
import os
import django
import sys
from datetime import datetime

# Setup Django
sys.path.append('/Users/rehanahmad/Desktop/CISCO/du-soc-chat-svc-main')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chat_svc.settings.development')
django.setup()

from django.utils import timezone
from chat_svc.models import Tenant, TenantConfiguration, TenantBilling, TenantTheme

def create_default_configurations():
    """Create default configurations for existing tenants"""
    print("Creating default configurations for existing tenants...")
    
    # Update existing tenants with timestamps
    for tenant in Tenant.objects.filter(created_at__isnull=True):
        tenant.created_at = timezone.now()
        tenant.updated_at = timezone.now()
        tenant.save()
        print(f"Updated timestamps for tenant: {tenant.name}")
    
    # Create default configurations
    for tenant in Tenant.objects.all():
        # Create TenantConfiguration if it doesn't exist
        config, created = TenantConfiguration.objects.get_or_create(
            tenant=tenant,
            defaults={
                'default_sla_hours': 24,
                'high_priority_sla_hours': 4,
                'medium_priority_sla_hours': 12,
                'low_priority_sla_hours': 48,
                'enable_auto_escalation': True,
                'escalation_warning_hours': 2,
                'message_retention_days': 365,
                'attachment_retention_days': 90,
                'log_retention_days': 1095,
                'enable_file_attachments': True,
                'enable_structured_replies': True,
                'enable_read_receipts': True,
                'enable_push_notifications': True,
                'enable_audit_logging': True,
                'max_attachment_size_mb': 10,
                'max_message_length': 5000,
                'rate_limit_messages_per_minute': 60,
            }
        )
        if created:
            print(f"Created configuration for tenant: {tenant.name}")
        
        # Create TenantBilling if it doesn't exist
        billing, created = TenantBilling.objects.get_or_create(
            tenant=tenant,
            defaults={
                'plan_type': 'basic',
                'billing_cycle': 'monthly',
                'status': 'trial',
                'monthly_cost': 99.00,
                'per_user_cost': 5.00,
                'setup_fee': 0.00,
                'subscription_start': timezone.now().date(),
                'next_billing_date': timezone.now().date(),
                'trial_end_date': timezone.now().date(),
                'billing_contact': tenant.contact_email or 'admin@example.com',
                'current_user_count': tenant.current_user_count,
                'current_storage_gb': 0.00,
                'monthly_message_count': 0,
            }
        )
        if created:
            print(f"Created billing for tenant: {tenant.name}")
        
        # Create TenantTheme if it doesn't exist
        theme, created = TenantTheme.objects.get_or_create(
            tenant=tenant,
            defaults={
                'company_name': tenant.name,
                'primary_color': '#1976d2',
                'secondary_color': '#dc004e',
                'accent_color': '#f57c00',
                'background_color': '#ffffff',
                'text_color': '#333333',
                'font_family': 'Roboto, sans-serif',
                'header_font_size': 16,
                'body_font_size': 14,
                'sidebar_width': 280,
                'header_height': 64,
                'border_radius': 4,
                'email_header_color': '#1976d2',
            }
        )
        if created:
            print(f"Created theme for tenant: {tenant.name}")
    
    print("Migration completed successfully!")

if __name__ == '__main__':
    create_default_configurations()