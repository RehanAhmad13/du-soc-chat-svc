# DU SOC Chat Service

This repository implements a secure, real-time, multi-tenant chat subsystem for the DU SOC Portal.  
Built with Django REST Framework and Django Channels, the service ensures tenant isolation, auditability, and seamless backend integration with SIEM/SOAR/ITSM tools.

## Key Features
- Tenant-isolated chat threads
- Structured communication via question templates
- Real-time messaging (WebSockets via Django Channels)
- Linked to alerts, incidents, and ITSM tickets
- Tamper-evident logs and exportable transcripts
- Mobile-ready (React Native parity)

## Architecture Overview
The chat service is built as a standalone Django project using Django REST Framework for APIs and Django Channels for WebSocket support. Each tenant operates within an isolated schema or database, ensuring strict segregation of data. Redis serves as the channel layer backend for real-time message fan-out and presence tracking.

### Tenant Isolation
- All authentication tokens include a tenant identifier claim.
- Database queries and WebSocket connections are scoped to the tenant context.
- Message and file objects contain a `tenant_id` field that is enforced through DRF permissions and Channels middleware.

### Real-Time Communication
- WebSocket endpoints use JWT authentication to establish a session bound to a tenant.
- A Channels layer backed by Redis enables horizontal scalability across multiple worker nodes.
- Typing indicators and read receipts are emitted as lightweight events to keep latency below 1 second.

### Template Management
SOC administrators define question templates that capture structured fields (text, dropdowns, file uploads). Each template may include a JSON `schema` describing expected fields and dropdown options. Incoming structured replies are validated against this schema. When a chat is created from an incident, the template is applied and placeholders (e.g., `{device_id}`) are substituted with incident metadata.

### Message Storage & Audit
Messages are stored in an append-only model with creation timestamps and immutable hashes. Files are stored in a secure object store with SHA-256 checksums recorded for audit trails. Retention policies are applied per tenant via scheduled cleanup tasks.

### Integrations
Each chat thread records the related alert or ticket identifiers. Dedicated API endpoints allow incidents to spawn chat threads which are automatically linked to their alert/incident IDs. When a message is posted the transcript is forwarded to the ITSM ticket timeline (see `update_ticket_timeline`).
The target ITSM endpoint is configured via the `ITSM_API_URL` environment variable.
SLA status for each thread is determined based on the `INCIDENT_SLA_HOURS` environment variable (default `24`).

### Deployment & Scaling
The service runs in its own container within the Kubernetes cluster. Redis Cluster is required for the Channels layer, and the app can scale out across pods without sticky sessions. TLS termination is handled at the ingress layer, with end-to-end encryption enforced.

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
