"""
Custom authentication and permission classes for JWT-based auth.
"""

import logging
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth.models import AnonymousUser

logger = logging.getLogger(__name__)


class IsAuthenticatedViaJWT(BasePermission):
    """
    Permission class that ensures the user is authenticated via JWT token.
    
    Unlike the default IsAuthenticated, this specifically checks for JWT authentication
    and rejects session-based authentication.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated via JWT."""
        # Check if user is authenticated
        if not request.user or isinstance(request.user, AnonymousUser) or not request.user.is_authenticated:
            return False
        
        # Check if JWT token was used (via Authorization header)
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            logger.debug("Request rejected: No JWT token in Authorization header")
            return False
        
        return True


class IsActiveTenant(BasePermission):
    """
    Permission class that ensures the user belongs to an active tenant.
    """
    
    def has_permission(self, request, view):
        """Check if user belongs to an active tenant."""
        user = request.user
        
        if not user or isinstance(user, AnonymousUser) or not user.is_authenticated:
            return False
        
        # Superusers bypass tenant checks
        if user.is_superuser:
            return True
        
        # Check if user has an active tenant
        if not hasattr(user, 'tenant_id') or user.tenant_id is None:
            logger.warning(f"User {user.username} has no tenant assigned")
            return False
        
        # Check if user is active
        if not user.is_active:
            logger.warning(f"User {user.username} is not active")
            return False
        
        return True


class IsStaffOrAdmin(BasePermission):
    """
    Permission class for staff or admin users.
    """
    
    def has_permission(self, request, view):
        """Check if user is staff or admin."""
        user = request.user
        
        if not user or isinstance(user, AnonymousUser) or not user.is_authenticated:
            return False
        
        return user.is_staff or user.is_superuser


class IsSuperUser(BasePermission):
    """
    Permission class that only allows superusers.
    """
    
    def has_permission(self, request, view):
        """Check if user is a superuser."""
        user = request.user
        
        if not user or isinstance(user, AnonymousUser) or not user.is_authenticated:
            return False
        
        return user.is_superuser


class IsTenantMemberOrStaff(BasePermission):
    """
    Permission class that allows tenant members or staff users.
    """
    
    def has_permission(self, request, view):
        """Check if user is a tenant member or staff."""
        user = request.user
        
        if not user or isinstance(user, AnonymousUser) or not user.is_authenticated:
            return False
        
        # Allow staff and superusers
        if user.is_staff or user.is_superuser:
            return True
        
        # Check tenant membership
        if not hasattr(user, 'tenant_id') or user.tenant_id is None:
            return False
        
        return user.is_active
    
    def has_object_permission(self, request, view, obj):
        """Check object-level permissions."""
        user = request.user
        
        # Allow staff and superusers
        if user.is_staff or user.is_superuser:
            return True
        
        # Check if object belongs to user's tenant
        if hasattr(obj, 'tenant_id'):
            return user.tenant_id == obj.tenant_id
        elif hasattr(obj, 'tenant'):
            return user.tenant_id == obj.tenant.id
        elif hasattr(obj, 'thread') and hasattr(obj.thread, 'tenant_id'):
            return user.tenant_id == obj.thread.tenant_id
        
        return False


class IsOwnerOrStaff(BasePermission):
    """
    Permission class that allows object owners or staff users.
    """
    
    def has_permission(self, request, view):
        """Allow all authenticated users to access the view."""
        user = request.user
        return user and user.is_authenticated and not isinstance(user, AnonymousUser)
    
    def has_object_permission(self, request, view, obj):
        """Check if user owns the object or is staff."""
        user = request.user
        
        # Allow staff and superusers
        if user.is_staff or user.is_superuser:
            return True
        
        # Check ownership
        if hasattr(obj, 'user'):
            return obj.user == user
        elif hasattr(obj, 'sender'):
            return obj.sender == user
        elif hasattr(obj, 'owner'):
            return obj.owner == user
        
        return False


class IsAdminOrReadOnly(BasePermission):
    """
    Permission class that allows read access to everyone,
    but write access only to admin users.
    """
    
    def has_permission(self, request, view):
        """Allow read access to all, write access to admins only."""
        user = request.user
        
        # Allow read access to authenticated users
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return user and user.is_authenticated and not isinstance(user, AnonymousUser)
        
        # Allow write access only to staff/admin
        return user and user.is_authenticated and (user.is_staff or user.is_superuser)


class JWTPermissionMixin:
    """
    Mixin class that provides JWT-specific permission checking utilities.
    """
    
    def check_jwt_auth(self, request):
        """Check if request is authenticated via JWT."""
        if not request.user or isinstance(request.user, AnonymousUser):
            raise PermissionDenied("Authentication required")
        
        if not request.user.is_authenticated:
            raise PermissionDenied("User is not authenticated")
        
        # Verify JWT token was used
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise PermissionDenied("JWT token required")
    
    def check_tenant_access(self, request, obj=None):
        """Check if user has access to tenant-specific resource."""
        user = request.user
        
        # Skip for superusers
        if user.is_superuser:
            return True
        
        if not hasattr(user, 'tenant_id') or user.tenant_id is None:
            raise PermissionDenied("User has no tenant assigned")
        
        if obj:
            # Check object-level tenant access
            if hasattr(obj, 'tenant_id'):
                if user.tenant_id != obj.tenant_id:
                    raise PermissionDenied("Access denied: different tenant")
            elif hasattr(obj, 'tenant'):
                if user.tenant_id != obj.tenant.id:
                    raise PermissionDenied("Access denied: different tenant")
        
        return True


# Commonly used permission combinations
class JWTTenantPermission(IsAuthenticatedViaJWT, IsActiveTenant):
    """Combined permission for JWT-authenticated tenant users."""
    
    def has_permission(self, request, view):
        return (
            IsAuthenticatedViaJWT.has_permission(self, request, view) and
            IsActiveTenant.has_permission(self, request, view)
        )


class StaffJWTPermission(IsAuthenticatedViaJWT, IsStaffOrAdmin):
    """Combined permission for JWT-authenticated staff users."""
    
    def has_permission(self, request, view):
        return (
            IsAuthenticatedViaJWT.has_permission(self, request, view) and
            IsStaffOrAdmin.has_permission(self, request, view)
        )