# Authentication Module

This dedicated authentication module provides comprehensive JWT-based authentication for the Django Chat Service.

## Structure

```
auth/
├─ __init__.py
├─ apps.py                      # Django app configuration
├─ jwt_utils.py                 # JWT token creation, validation, and utilities
├─ drf_authentication.py       # DRF authentication classes
├─ middleware.py                # WebSocket authentication middleware
├─ permissions.py               # Custom permission classes
├─ views.py                     # Authentication API views
├─ urls.py                      # URL routing for auth endpoints
└─ README.md                    # This file
```

## Components

### JWT Utilities (`jwt_utils.py`)
- **`create_token(user, token_type, expires_in)`** - Create access/refresh tokens
- **`decode_token(token)`** - Decode and validate JWT tokens
- **`get_user_from_token(token)`** - Get User instance from token
- **`create_token_pair(user)`** - Create both access and refresh tokens
- **`refresh_access_token(refresh_token)`** - Generate new access token
- **`extract_token_from_header(auth_header)`** - Extract token from Authorization header
- **`is_token_valid(token)`** - Check token validity

### DRF Authentication (`drf_authentication.py`)
- **`JWTAuthentication`** - Main JWT auth class with session fallback
- **`JWTOptionalAuthentication`** - Optional auth (allows anonymous)
- **`StrictJWTAuthentication`** - JWT-only auth (no session fallback)
- **`TenantJWTAuthentication`** - JWT auth with tenant isolation

### WebSocket Middleware (`middleware.py`)
- **`JWTAuthMiddleware`** - WebSocket JWT authentication
- **`TokenAuthMiddleware`** - Alias for backward compatibility
- **`StrictJWTAuthMiddleware`** - Strict WebSocket auth (rejects unauthenticated)
- **`TenantJWTAuthMiddleware`** - WebSocket auth with tenant isolation
- **`JWTAuthMiddlewareStack(inner)`** - Convenience function for middleware stack

### Permissions (`permissions.py`)
- **`IsAuthenticatedViaJWT`** - Requires JWT authentication (not session)
- **`IsActiveTenant`** - Requires active tenant membership
- **`IsStaffOrAdmin`** - Staff or admin users only
- **`IsSuperUser`** - Superusers only
- **`IsTenantMemberOrStaff`** - Tenant members or staff
- **`IsOwnerOrStaff`** - Object owners or staff
- **`IsAdminOrReadOnly`** - Admins can write, others read-only
- **`JWTTenantPermission`** - Combined JWT + tenant permission
- **`StaffJWTPermission`** - Combined JWT + staff permission

### API Views (`views.py`)
- **`LoginView`** - JWT login with token pair generation
- **`TokenRefreshView`** - Refresh access tokens
- **`LogoutView`** - Logout endpoint
- **`VerifyTokenView`** - Token verification
- **`UserProfileView`** - Current user profile
- **`ChangePasswordView`** - Password change

## API Endpoints

All endpoints are available under `/api/auth/`:

### POST /api/auth/login/
Login with username/password, returns access and refresh tokens.

**Request:**
```json
{
    "username": "user@example.com",
    "password": "password123"
}
```

**Response:**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "username": "user@example.com",
        "email": "user@example.com",
        "tenant_id": 1,
        "tenant_name": "Acme Corp",
        "is_staff": false
    }
}
```

### POST /api/auth/refresh/
Refresh access token using refresh token.

**Request:**
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response:**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### POST /api/auth/verify/
Verify token validity.

**Request:**
```json
{
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response:**
```json
{
    "valid": true,
    "user": {
        "id": 1,
        "username": "user@example.com",
        "tenant_id": 1
    }
}
```

### GET /api/auth/profile/
Get current user profile (requires JWT auth).

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```json
{
    "id": 1,
    "username": "user@example.com",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "tenant": {
        "id": 1,
        "name": "Acme Corp"
    }
}
```

## Usage Examples

### HTTP Authentication
```python
# In your views.py
from auth.drf_authentication import JWTAuthentication
from auth.permissions import IsActiveTenant

class MyAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsActiveTenant]
```

### WebSocket Authentication
```python
# In your asgi.py
from auth.middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    "websocket": JWTAuthMiddleware(
        AuthMiddlewareStack(
            URLRouter([...])
        )
    ),
})
```

### JavaScript Client Example
```javascript
// Login
const response = await fetch('/api/auth/login/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        username: 'user@example.com',
        password: 'password123'
    })
});

const data = await response.json();
const accessToken = data.access;

// Use token in subsequent requests
const apiResponse = await fetch('/api/threads/', {
    headers: {
        'Authorization': `Bearer ${accessToken}`
    }
});

// WebSocket connection with token
const ws = new WebSocket(`ws://localhost:8000/ws/chat/123/?token=${accessToken}`);
```

## Token Structure

JWT tokens include the following claims:

```json
{
    "user_id": 1,
    "username": "user@example.com",
    "email": "user@example.com",
    "tenant_id": 1,
    "tenant_name": "Acme Corp",
    "is_staff": false,
    "is_superuser": false,
    "is_active": true,
    "token_type": "access",
    "exp": 1640995200,
    "iat": 1640991600,
    "nbf": 1640991600
}
```

## Security Features

- **Token Expiration**: Configurable token lifetimes
- **Tenant Isolation**: Automatic tenant-based access control
- **Multiple Auth Methods**: HTTP Bearer tokens, WebSocket query params
- **Session Fallback**: Optional session auth for browsable API
- **Password Validation**: Django's built-in password validators
- **HTTPS Enforcement**: Production-ready security headers