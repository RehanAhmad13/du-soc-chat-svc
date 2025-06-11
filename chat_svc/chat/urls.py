from rest_framework.routers import DefaultRouter
from .views import ChatThreadViewSet, MessageViewSet, QuestionTemplateViewSet

router = DefaultRouter()
router.register('threads', ChatThreadViewSet)
router.register('messages', MessageViewSet)
router.register('templates', QuestionTemplateViewSet)

urlpatterns = router.urls
