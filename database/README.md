# Chatbot & Voice AI Platform - Database Directory

This directory contains all PostgreSQL database schemas, DDL initialization scripts, and migration files for the platform.

## Directory Structure
```text
d:\Chatbot\
├── frontend/    # Next.js 16 Super Admin & Dashboard UI
├── backend/     # Go High-Performance API & WebSocket Engine
└── database/    # PostgreSQL Schemas & Migration Scripts
    ├── schema.sql  # Complete 9-Table Database DDL Schema
    └── README.md   # Database Documentation
```

## Running Database Migrations (PowerShell)
To execute `schema.sql` into the containerized PostgreSQL database (`chatbot_db`):

```powershell
Get-Content d:\Chatbot\database\schema.sql | docker exec -i chatbot-postgres psql -U postgres -d chatbot_db
```
