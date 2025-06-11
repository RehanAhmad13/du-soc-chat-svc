from rest_framework.routers import DefaultRouter
from .views import ChatThreadViewSet, MessageViewSet

router = DefaultRouter()
router.register('threads', ChatThreadViewSet)
router.register('messages', MessageViewSet)

urlpatterns = router.urls
