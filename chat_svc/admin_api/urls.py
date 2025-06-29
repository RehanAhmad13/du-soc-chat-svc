"""
Admin API URL Configuration
Separate URLs for comprehensive admin functionality
"""

from rest_framework.routers import DefaultRouter
from django.urls import path, include

# Import comprehensive admin API views
from .views import (
    AdminThreadViewSet,
    AdminUserViewSet,
    admin_dashboard_stats,
    manage_tenants,
    manage_templates,
    export_system_data,
    system_health,
    activity_feed,
)

# Import tenant management views
from .tenant_views import TenantConfigurationViewSet

# Comprehensive admin router
router = DefaultRouter()
router.register('threads', AdminThreadViewSet, basename='admin-threads')
router.register('users', AdminUserViewSet, basename='admin-users')
router.register('tenant-config', TenantConfigurationViewSet, basename='admin-tenant-config')

urlpatterns = [
    # ViewSet routes (threads/, users/)
    *router.urls,
    
    # Dashboard & Analytics
    path('dashboard/stats/', admin_dashboard_stats, name='admin-dashboard-stats'),
    path('system/health/', system_health, name='admin-system-health'),
    path('activity/feed/', activity_feed, name='admin-activity-feed'),
    
    # Tenant & Template Management
    path('tenants/', manage_tenants, name='admin-tenants'),
    path('templates/', manage_templates, name='admin-templates'),
    
    # Export & Reporting
    path('export/system/', export_system_data, name='admin-export-system'),
]