# Chat Service

This repository contains a mini-project assigned by my advisor in which I was assigned to developing the backend of a microservice requested by one of the organization's clients.  The backend was built with Django REST Framework and Django Channels. It includes the following key functionalities: tenant isolation and auditability. Key functionaltiies are: 
- Tenant-isolated chat threads
- Structured communication via question templates
- Real-time messaging (WebSockets via Django Channels)


## Architecture Overview
The chat service is built using Django REST Framework for APIs and Django Channels for WebSocket support. Each tenant operates within an isolated schema or database which ensures strict segregation of data. Redis serves as the channel layer backend for real-time messaging and presence tracking. All authentication tokens include a tenant identifier claim.Message and file objects contain a `tenant_id` field that is enforced through DRF permissions and Channels middleware. Here are all the details

### Real-Time Communication
- WebSocket endpoints use JWT authentication to establish a session bound to a tenant.
- A Channels layer backed by Redis enables horizontal scalability across multiple worker nodes.
- Typing indicators, read receipts, and presence notifications are emitted as lightweight events to keep latency below 1 second.

### Template Management
SOC administrators define question templates that capture structured fields (text, dropdowns, file uploads). Each template may include a JSON `schema` describing expected fields and dropdown options. Incoming structured replies are validated against this schema. When a chat is created from an incident, the template is applied and placeholders (e.g., `{device_id}`) are substituted with incident metadata.

### Message Storage & Audit
Messages are stored in an append-only model with creation timestamps and immutable hashes. Files are stored in a secure object store with SHA-256 checksums recorded for audit trails. Retention policies are applied per tenant via scheduled cleanup tasks.

### Security Considerations
- JWT-based auth with tenant-scoped claims
- AES-256 encryption at rest for database and file storage
- All WebSocket traffic upgraded via HTTPS (TLS 1.3)
- Optional per-tenant data residency settings if required


## Getting Started
This repository contains a minimal Django project skeleton for the chat service. 
To run the unit tests:

```bash
python manage.py test
```
To obtain a JWT for API or WebSocket access, POST to `/api/chat/token/` with `username` and `password`. Include the token in the `Authorization` header (`Bearer <token>`) for API calls or as the `token` query parameter for WebSocket connections.

Dependencies are listed in `requirements.txt`.
The Channels layer connects to Redis via the `REDIS_URL` environment variable.
If unset, it defaults to `redis://localhost:6379/0`.
Both file and database encryption use AES-256 keys configured via the
`FILE_ENCRYPTION_KEY` and `DB_ENCRYPTION_KEY` environment variables. If not
provided, random keys are generated at startup.

## Frontend
A React application powered by [Vite](https://vitejs.dev/) lives in the `frontend/` directory. It demonstrates basic routing and local state management for a chat interface. The frontend was built as a proof-of-concept and to test that the backend functionality works properly rather than for actual proper development (thus the lacklustre design and missing components). 

```bash
cd frontend
npm install        # install dependencies
npm run dev        # start the development server
npm run build      # build for production
```

