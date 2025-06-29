"""
Authentication views for JWT-based auth system.
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import AnonymousUser
from .jwt_utils import create_token_pair, refresh_access_token, get_user_from_token
from .permissions import IsAuthenticatedViaJWT

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class TokenRefreshSerializer(serializers.Serializer):
    """Serializer for token refresh."""
    refresh = serializers.CharField()


class LoginView(APIView):
    """
    JWT-based login endpoint.
    
    Returns both access and refresh tokens.
    """
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = authenticate(
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"]
        )
        
        if not user:
            return Response(
                {"detail": "Invalid credentials"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.is_active:
            return Response(
                {"detail": "Account is deactivated"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create token pair
        tokens = create_token_pair(user)
        
        return Response({
            "access": tokens['access'],
            "refresh": tokens['refresh'],
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "tenant_id": getattr(user, 'tenant_id', None),
                "tenant_name": getattr(user.tenant, 'name', None) if hasattr(user, 'tenant') and user.tenant else None,
                "date_joined": user.date_joined.isoformat(),
                "last_login": user.last_login.isoformat() if user.last_login else None,
            }
        })


class TokenRefreshView(APIView):
    """
    Token refresh endpoint.
    
    Use refresh token to get a new access token.
    """
    permission_classes = [AllowAny]
    serializer_class = TokenRefreshSerializer
    
    def post(self, request):
        serializer = TokenRefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        refresh_token = serializer.validated_data["refresh"]
        access_token = refresh_access_token(refresh_token)
        
        if not access_token:
            return Response(
                {"detail": "Invalid or expired refresh token"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        return Response({
            "access": access_token
        })


class LogoutView(APIView):
    """
    Logout endpoint.
    
    Currently just a placeholder since JWT tokens are stateless.
    In a production system, you might want to implement token blacklisting.
    """
    permission_classes = [IsAuthenticatedViaJWT]
    
    def post(self, request):
        # In a production system, you would blacklist the token here
        # For now, just return success
        return Response({
            "detail": "Successfully logged out"
        })


class VerifyTokenView(APIView):
    """
    Token verification endpoint.
    
    Verifies if the provided token is valid and returns user info.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response(
                {"detail": "Token is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = get_user_from_token(token)
        if not user:
            return Response(
                {"detail": "Invalid or expired token"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        return Response({
            "valid": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "tenant_id": getattr(user, 'tenant_id', None),
                "tenant_name": getattr(user.tenant, 'name', None) if hasattr(user, 'tenant') and user.tenant else None,
            }
        })


class UserProfileView(APIView):
    """
    Current user profile endpoint.
    
    Returns detailed information about the authenticated user.
    """
    permission_classes = [IsAuthenticatedViaJWT]
    
    def get(self, request):
        user = request.user
        
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "is_active": user.is_active,
            "date_joined": user.date_joined.isoformat(),
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "tenant": {
                "id": user.tenant.id if hasattr(user, 'tenant') and user.tenant else None,
                "name": user.tenant.name if hasattr(user, 'tenant') and user.tenant else None,
            } if hasattr(user, 'tenant') and user.tenant else None,
        })


class ChangePasswordView(APIView):
    """
    Change password endpoint for authenticated users.
    """
    permission_classes = [IsAuthenticatedViaJWT]
    
    def post(self, request):
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response(
                {"detail": "Both current_password and new_password are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        
        # Verify current password
        if not user.check_password(current_password):
            return Response(
                {"detail": "Current password is incorrect"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response({
            "detail": "Password changed successfully"
        })