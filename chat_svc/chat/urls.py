from rest_framework.routers import DefaultRouter
from .views import (
    ChatThreadViewSet,
    MessageViewSet,
    QuestionTemplateViewSet,
    AttachmentViewSet,
)

router = DefaultRouter()
router.register('threads', ChatThreadViewSet)
router.register('messages', MessageViewSet)
router.register('templates', QuestionTemplateViewSet)
router.register('attachments', AttachmentViewSet)

urlpatterns = router.urls
