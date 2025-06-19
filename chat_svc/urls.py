from django.contrib import admin
from django.urls import path, include
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

# Swagger schema setup
schema_view = get_schema_view(
    openapi.Info(
        title="Chat Service API",
        default_version='v1',
        description="Interactive API documentation for chat microservice",
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/chat/', include('chat_svc.chat.urls')),  # 👈 all chat app endpoints live here

    # Swagger/OpenAPI UI
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
