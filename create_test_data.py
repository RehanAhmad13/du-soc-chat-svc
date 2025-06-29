#!/usr/bin/env python
"""
Create test data for tenant management
"""
import os
import django
import sys
from datetime import datetime, date

# Setup Django
sys.path.append('/Users/rehanahmad/Desktop/CISCO/du-soc-chat-svc-main')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chat_svc.settings.development')
django.setup()

from django.utils import timezone
from chat_svc.models import Tenant, TenantConfiguration, TenantBilling, TenantTheme, User

def create_test_data():
    """Create test tenants with configurations"""
    print("Creating test data...")
    
    # Create or update existing tenants
    tenants_data = [
        {
            'name': 'ACME Corporation',
            'contact_email': 'admin@acme.com',
            'contact_phone': '+1-555-0123',
            'billing_address': '123 Main St, Anytown, USA',
            'timezone': 'America/New_York',
            'max_users': 100,
            'max_concurrent_threads': 50,
        },
        {
            'name': 'TechStart Inc',
            'contact_email': 'support@techstart.com', 
            'contact_phone': '+1-555-0456',
            'billing_address': '456 Tech Ave, Silicon Valley, CA',
            'timezone': 'America/Los_Angeles',
            'max_users': 50,
            'max_concurrent_threads': 25,
        },
        {
            'name': 'Global Security Ltd',
            'contact_email': 'security@globalsec.com',
            'contact_phone': '+44-20-1234-5678', 
            'billing_address': '789 Security Blvd, London, UK',
            'timezone': 'Europe/London',
            'max_users': 200,
            'max_concurrent_threads': 100,
        }
    ]
    
    for tenant_data in tenants_data:
        tenant, created = Tenant.objects.get_or_create(
            name=tenant_data['name'],
            defaults=tenant_data
        )
        
        if not created:
            # Update existing tenant
            for key, value in tenant_data.items():
                setattr(tenant, key, value)
            tenant.save()
        
        print(f"{'Created' if created else 'Updated'} tenant: {tenant.name}")
        
        # Create TenantConfiguration
        config, created = TenantConfiguration.objects.get_or_create(
            tenant=tenant,
            defaults={
                'default_sla_hours': 24,
                'high_priority_sla_hours': 4,
                'medium_priority_sla_hours': 12,
                'low_priority_sla_hours': 48,
                'enable_auto_escalation': True,
                'escalation_warning_hours': 2,
                'escalation_email': tenant.contact_email,
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
        
        # Create TenantBilling
        billing, created = TenantBilling.objects.get_or_create(
            tenant=tenant,
            defaults={
                'plan_type': 'professional' if 'Global' in tenant.name else 'basic',
                'billing_cycle': 'monthly',
                'status': 'active',
                'monthly_cost': 199.00 if 'Global' in tenant.name else 99.00,
                'per_user_cost': 5.00,
                'setup_fee': 0.00,
                'subscription_start': date.today(),
                'next_billing_date': date.today(),
                'billing_contact': tenant.contact_email,
                'current_user_count': 0,
                'current_storage_gb': 0.00,
                'monthly_message_count': 0,
            }
        )
        
        # Create TenantTheme
        theme_colors = {
            'ACME Corporation': '#1976d2',
            'TechStart Inc': '#4caf50', 
            'Global Security Ltd': '#f44336'
        }
        
        theme, created = TenantTheme.objects.get_or_create(
            tenant=tenant,
            defaults={
                'company_name': tenant.name,
                'primary_color': theme_colors.get(tenant.name, '#1976d2'),
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
                'email_header_color': theme_colors.get(tenant.name, '#1976d2'),
                'email_footer_text': f'© 2024 {tenant.name}. All rights reserved.',
            }
        )
        
        print(f"  - Configuration: {'created' if config else 'exists'}")
        print(f"  - Billing: {'created' if billing else 'exists'}")
        print(f"  - Theme: {'created' if theme else 'exists'}")
    
    print(f"\nTest data creation completed!")
    print(f"Total tenants: {Tenant.objects.count()}")

if __name__ == '__main__':
    create_test_data()