# Django Chat Service

A multi-tenant chat service with admin and tenant APIs, real-time WebSocket support, and comprehensive security features.

## Architecture

The service is organized into the following modules:

### Core Modules

- **`models.py`** - Shared data models for the entire application
- **`auth/`** - Dedicated authentication module with JWT utilities
- **`admin_api/`** - Admin management APIs for staff users
- **`tenant_api/`** - Tenant user APIs for regular operations  
- **`chat_api/`** - WebSocket consumers and real-time chat services
- **`integrations/`** - External integrations (Kafka, Push, Encryption, ITSM)

### Settings Structure

- **`settings/base.py`** - Common settings for all environments
- **`settings/development.py`** - Development-specific settings
- **`settings/production.py`** - Production-specific settings

## Features

### Authentication APIs (`/api/auth/`)
- JWT-based login with access and refresh tokens
- Token refresh and verification
- User profile management
- Password change functionality
- Secure logout

### Admin APIs (`/api/admin/`)
- User and tenant management
- Thread monitoring and bulk operations
- Dashboard analytics and KPIs
- System health monitoring
- Data export and reporting

### Tenant APIs (`/api/tenant/` or `/api/`)
- Chat thread management
- Message operations with file attachments
- Question template access
- Device registration for push notifications
- User profile management

### Real-time Features
- WebSocket-based real-time messaging
- Presence tracking (online/offline status)
- Typing indicators
- Read receipts
- Push notifications

### Security Features
- Multi-tenant data isolation
- JWT-based authentication
- Field-level encryption for sensitive data
- File encryption for attachments
- HTTPS enforcement in production

### Integrations
- **Kafka** - Event publishing for message lifecycle
- **FCM** - Push notifications to mobile devices
- **ITSM** - Ticket timeline updates
- **Redis** - WebSocket channel layer and presence tracking

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Environment Variables

```bash
export DJANGO_ENVIRONMENT=development
export DB_ENCRYPTION_KEY=$(python -c "import base64; print(base64.urlsafe_b64encode(b'development-key-32-chars-long!').decode())")
export FILE_ENCRYPTION_KEY=$(python -c "import base64; print(base64.urlsafe_b64encode(b'development-file-key-32-chars!').decode())")
export REDIS_URL=redis://localhost:6379/0
```

### 3. Run Migrations

```bash
python manage.py migrate
```

### 4. Create Superuser

```bash
python manage.py create_superuser --username admin --password admin123
```

### 5. Load Sample Data

```bash
# Load global question templates
python manage.py load_templates

# Load sample tenants and users
python manage.py setup_dev_data --with-messages
```

### 6. Start the Server

```bash
# HTTP server
python manage.py runserver

# For WebSocket support, use Daphne
daphne chat_svc.asgi:application -p 8000
```

## API Endpoints

### Authentication APIs
- `POST /api/auth/login/` - JWT login (returns access + refresh tokens)
- `POST /api/auth/refresh/` - Refresh access token
- `POST /api/auth/logout/` - Logout
- `POST /api/auth/verify/` - Verify token validity
- `GET /api/auth/profile/` - Get current user profile
- `POST /api/auth/change-password/` - Change password

### Admin APIs
- `GET /api/admin/dashboard/` - Dashboard statistics
- `GET /api/admin/threads/` - Thread management
- `GET /api/admin/users/` - User management  
- `POST /api/admin/users/{id}/approve/` - Approve pending user
- `GET /api/admin/tenants/` - Tenant management
- `GET /api/admin/health/` - System health monitoring

### Tenant APIs
- `POST /api/tenant/auth/login/` - Tenant user login (legacy)
- `POST /api/tenant/auth/register/` - User registration
- `GET /api/threads/` - List chat threads
- `POST /api/threads/` - Create new thread
- `GET /api/messages/` - List messages
- `POST /api/messages/` - Send message
- `GET /api/templates/` - Available question templates
- `POST /api/devices/` - Register device for push notifications

### WebSocket
- `ws://localhost:8000/ws/chat/{thread_id}/?token=<jwt_token>` - Real-time chat

## Management Commands

- `load_templates` - Load global question templates
- `load_tenants_and_users` - Load tenants and users from CSV
- `setup_dev_data` - Create development data
- `create_superuser` - Create admin user

## Environment Variables

### Required
- `DB_ENCRYPTION_KEY` - 32-byte base64 key for database encryption
- `FILE_ENCRYPTION_KEY` - 32-byte base64 key for file encryption

### Optional
- `DJANGO_ENVIRONMENT` - Environment (development/production)
- `DJANGO_SECRET_KEY` - Django secret key
- `REDIS_URL` - Redis connection URL
- `KAFKA_BOOTSTRAP_SERVERS` - Kafka servers
- `FCM_SERVER_KEY` - Firebase Cloud Messaging key
- `ITSM_API_URL` - ITSM integration URL
- `ITSM_API_TOKEN` - ITSM API token
- `INCIDENT_SLA_HOURS` - SLA threshold in hours (default: 24)

## Development

### Running Tests
```bash
python manage.py test
```

### Code Style
```bash
black .
flake8 .
```

### API Documentation
Visit `/swagger/` or `/redoc/` for interactive API documentation.

## Production Deployment

1. Set `DJANGO_ENVIRONMENT=production`
2. Configure PostgreSQL database
3. Set up Redis cluster
4. Configure proper encryption keys
5. Set allowed hosts and CORS origins
6. Use HTTPS with proper SSL certificates
7. Set up monitoring and logging

## Security Considerations

- All sensitive fields are encrypted at the database level
- File attachments are encrypted on disk
- Multi-tenant data isolation enforced at the ORM level
- JWT tokens with proper expiration
- HTTPS enforcement in production
- CORS and security headers configured

## Contributing

1. Follow the existing code structure
2. Add appropriate tests for new features
3. Update documentation for API changes
4. Ensure security best practices are followed