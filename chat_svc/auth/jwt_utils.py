"""
JWT utilities for authentication and token management.
"""

import jwt
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone

logger = logging.getLogger(__name__)

# Token types
ACCESS_TOKEN = 'access'
REFRESH_TOKEN = 'refresh'

# Default expiration times (in seconds)
ACCESS_TOKEN_LIFETIME = 3600  # 1 hour
REFRESH_TOKEN_LIFETIME = 86400 * 7  # 7 days


def create_token(user, token_type: str = ACCESS_TOKEN, expires_in: Optional[int] = None) -> str:
    """
    Create a signed JWT for the given user.
    
    Args:
        user: Django User instance
        token_type: Type of token (access or refresh)
        expires_in: Custom expiration time in seconds
    
    Returns:
        Encoded JWT token string
    """
    if expires_in is None:
        expires_in = ACCESS_TOKEN_LIFETIME if token_type == ACCESS_TOKEN else REFRESH_TOKEN_LIFETIME
    
    now = timezone.now()
    payload = {
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "tenant_id": getattr(user, "tenant_id", None),
        "tenant_name": getattr(user.tenant, "name", None) if hasattr(user, 'tenant') and user.tenant else None,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "is_active": user.is_active,
        "token_type": token_type,
        "exp": now + timedelta(seconds=expires_in),
        "iat": now,
        "nbf": now,  # Not before
    }
    
    try:
        return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    except Exception as e:
        logger.error(f"Failed to create JWT token: {e}")
        raise


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate a JWT token.
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded payload dictionary or None if invalid
    """
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=["HS256"],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_nbf": True,
                "verify_iat": True,
            }
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token has expired")
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT token: {e}")
    except Exception as e:
        logger.error(f"Unexpected error decoding JWT: {e}")
    
    return None


def get_user_from_token(token: str):
    """
    Get Django User instance from JWT token.
    
    Args:
        token: JWT token string
    
    Returns:
        User instance or None if invalid/not found
    """
    payload = decode_token(token)
    if not payload:
        return None
    
    User = get_user_model()
    try:
        user = User.objects.get(id=payload["user_id"])
        
        # Verify user is still active
        if not user.is_active:
            logger.warning(f"User {user.username} is inactive")
            return None
        
        # For non-superusers, verify tenant_id still matches
        if not user.is_superuser:
            token_tenant_id = payload.get("tenant_id")
            user_tenant_id = getattr(user, "tenant_id", None)
            
            if token_tenant_id != user_tenant_id:
                logger.warning(f"Tenant mismatch for user {user.username}: token={token_tenant_id}, user={user_tenant_id}")
                return None
        
        return user
        
    except User.DoesNotExist:
        logger.warning(f"User with ID {payload['user_id']} not found")
        return None
    except Exception as e:
        logger.error(f"Error retrieving user from token: {e}")
        return None


def create_token_pair(user) -> Dict[str, str]:
    """
    Create both access and refresh tokens for a user.
    
    Args:
        user: Django User instance
    
    Returns:
        Dictionary with 'access' and 'refresh' token keys
    """
    return {
        'access': create_token(user, ACCESS_TOKEN),
        'refresh': create_token(user, REFRESH_TOKEN),
    }


def refresh_access_token(refresh_token: str) -> Optional[str]:
    """
    Create a new access token from a valid refresh token.
    
    Args:
        refresh_token: Valid refresh token string
    
    Returns:
        New access token or None if refresh token is invalid
    """
    payload = decode_token(refresh_token)
    if not payload or payload.get('token_type') != REFRESH_TOKEN:
        return None
    
    user = get_user_from_token(refresh_token)
    if not user:
        return None
    
    return create_token(user, ACCESS_TOKEN)


def extract_token_from_header(auth_header: str) -> Optional[str]:
    """
    Extract JWT token from Authorization header.
    
    Args:
        auth_header: Authorization header value
    
    Returns:
        Token string or None if not found/invalid format
    """
    if not auth_header:
        return None
    
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None
    
    return parts[1]


def is_token_valid(token: str) -> bool:
    """
    Check if a token is valid without decoding user.
    
    Args:
        token: JWT token string
    
    Returns:
        True if token is valid, False otherwise
    """
    return decode_token(token) is not None