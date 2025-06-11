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
