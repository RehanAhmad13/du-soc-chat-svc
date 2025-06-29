from rest_framework.routers import DefaultRouter
from django.urls import path, include
from . import views

router = DefaultRouter()
router.register(r'templates', views.QuestionTemplateViewSet, basename='tenant-templates')
router.register(r'threads', views.ChatThreadViewSet, basename='tenant-threads')
router.register(r'messages', views.MessageViewSet, basename='tenant-messages')
router.register(r'attachments', views.AttachmentViewSet, basename='tenant-attachments')
router.register(r'devices', views.DeviceViewSet, basename='tenant-devices')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', views.ObtainJWTView.as_view(), name='tenant-login'),
    path('auth/register/', views.RegisterView.as_view(), name='tenant-register'),
]
