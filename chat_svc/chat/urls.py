from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    ChatThreadViewSet,
    MessageViewSet,
    QuestionTemplateViewSet,
    AttachmentViewSet,
    AdminThreadViewSet,
)

router = DefaultRouter()
router.register('threads', ChatThreadViewSet)
router.register('messages', MessageViewSet)
router.register('templates', QuestionTemplateViewSet)
router.register('attachments', AttachmentViewSet)

admin_router = DefaultRouter()
admin_router.register('threads', AdminThreadViewSet, basename='admin-thread')

urlpatterns = [
    *router.urls,
    path('admin/', include(admin_router.urls)),
]
