"""
URL configuration for the auth module.
"""

from django.urls import path
from . import views

app_name = 'auth'

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('refresh/', views.TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('verify/', views.VerifyTokenView.as_view(), name='verify_token'),
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
]