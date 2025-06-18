from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    ChatThreadViewSet,
    ObtainJWTView,
    MessageViewSet,
    QuestionTemplateViewSet,
    AttachmentViewSet,
    DeviceViewSet,
    AdminThreadViewSet,
    RegisterView,
    manage_pending_users,
)

router = DefaultRouter()
router.register('threads', ChatThreadViewSet)
router.register('messages', MessageViewSet)
router.register('templates', QuestionTemplateViewSet)
router.register('attachments', AttachmentViewSet)
router.register('devices', DeviceViewSet, basename='device')

admin_router = DefaultRouter()
admin_router.register('threads', AdminThreadViewSet, basename='admin-thread')

urlpatterns = [
    *router.urls,
    path('token/', ObtainJWTView.as_view(), name='token'),
    path('register/', RegisterView.as_view(), name='register'),

    # Admin API routes
    path('admin/', include(admin_router.urls)),                      # All admin viewsets
    path('admin/approve-user-action/', manage_pending_users, name='approve-user'),  # Separate endpoint
]
