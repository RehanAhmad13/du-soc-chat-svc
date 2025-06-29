"""
Main URL configuration for Django Chat Service.
Routes requests to the appropriate API modules.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),
    
    # Authentication endpoints
    path('api/auth/', include('chat_svc.auth.urls')),            # JWT authentication
    
    # API endpoints
    path('api/admin/', include('chat_svc.admin_api.urls')),      # Admin management APIs
    path('api/tenant/', include('chat_svc.tenant_api.urls')),    # Tenant user APIs
    path('api/', include('chat_svc.tenant_api.urls')),           # Default tenant APIs (backward compatibility)
    
    # Health check endpoint
    path('health/', lambda request: HttpResponse('OK')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Optional: Add API documentation if available
try:
    from drf_yasg.views import get_schema_view
    from drf_yasg import openapi
    from rest_framework import permissions
    
    schema_view = get_schema_view(
        openapi.Info(
            title="Chat Service API",
            default_version='v1',
            description="Multi-tenant chat service with admin and tenant APIs",
            contact=openapi.Contact(email="admin@chatservice.com"),
            license=openapi.License(name="MIT License"),
        ),
        public=True,
        permission_classes=[permissions.AllowAny],
    )
    
    urlpatterns += [
        path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
        path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
        path('api/schema/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    ]
except ImportError:
    pass  # drf_yasg not installed
