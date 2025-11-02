
# SRH Centralized Student Project Platform — Technical Documentation (v1)

**Author:** Manoj Padmanabha  
**Last Updated:** 30.10.2025

---

## 0. Executive Summary
This platform centralizes student projects. Students upload a ZIP or provide a GitHub URL; the system **builds a Docker image**, **deploys a container**, assigns a **clean URL**, and streams **logs** back to the dashboard. Build/deploy jobs are serialized and scaled via a **Redis-backed worker queue**. Containers are **kept running** (per professor’s direction); only unused images/caches are pruned. The design is on‑prem friendly and future‑ready for Kubernetes.

---
## Introduction

This project is part of SRH University’s initiative to streamline academic project management. It allows students to upload, build, and deploy their coursework automatically on a centralized platform. Professors can view deployed apps directly through URLs, reducing the need for manual setup or environment conflicts. The platform is built with Node.js, Express, React, Redis, MongoDB, and Docker for reliability and scalability.

## 1. Goals, Non-Goals, and Principles

### 1.1 Goals
- One-stop **Upload → Build → Deploy → View** for all projects.
- **Immediate feedback** with build and deploy logs.
- **Scalable** during deadline spikes (100–150+ submissions).
- **Operational continuity:** clear docs, runbooks, and handover.
- **Security & fairness:** RBAC, quotas, container isolation.
- **Persistence:** **do not delete** running containers (policy).

### 1.2 Non-Goals (MVP)
- No per-student VMs.
- No public cloud dependency (optional later).
- No auto-grading; focus on deployment and visibility.

### 1.3 Design Principles
- **Fail fast, explain clearly** (good error messages).
- **Automate the boring stuff** (URL wiring, retries).
- **Separation of concerns** (API vs Worker vs Proxy).
- **Idempotency** (retries won’t corrupt state).

---

## 2. System Overview

```
[Student/Professor Browser]
  └─HTTPS→ [Frontend (React)] ─REST/WebSocket→ [API (Express.js)]
                               ├─► MongoDB (projects, users, logs, URLs, audit)
                               ├─► Redis (build/deploy job queue)
                               └─► Nginx/Traefik (reverse proxy routes)
                                    └─► Docker Host(s): containers for student apps
```

**Future (optional):** Kubernetes (Pods, Deployments, Ingress, HPA).

---

## 3. Environments & Access

- **Environment:** On-prem SRH VM(s), Ubuntu 22.04 LTS
- **Access:** SSH (maintainers), HTTPS (users)
- **DNS:** e.g., `projects.srh.de`
- **Ports:** 22 (SSH), 80/443 (HTTP/HTTPS), 6379 (Redis internal), dynamic app ports

---

## 4. Requirements

### 4.1 Hardware
- **Minimum (single VM):** 16 vCPU, 32 GB RAM, 250 GB NVMe SSD
- **Recommended (multi-worker):** 24–32 vCPU, 64 GB RAM, 500 GB NVMe SSD

### 4.2 Software
- Docker & Docker Compose
- Node.js 20 LTS (Express backend and worker services)
- Redis 7.x
- MongoDB Atlas (preferred) or on-prem MongoDB 6.x
- Nginx (or Traefik)

### 4.3 Accounts/Permissions
- Linux sudo for installation
- DNS & TLS (Let’s Encrypt) capability
- GitHub outbound access (clone) and package registries (npm/pip/maven)

---

## 5. Data Model (MongoDB)

### 5.1 Collections
**users**
```json
{
  "_id": "uuid",
  "name": "Manoj",
  "email": "manoj@srh.de",
  "role": "student|professor|admin",
  "courses": ["ADBS-WS25"],
  "createdAt": "ISO"
}
```

**projects**
```json
{
  "_id": "uuid",
  "ownerId": "uuid",
  "course": "ADBS-WS25",
  "title": "Smart Campus",
  "source": { "type": "zip|github", "url": "https://github.com/..." },
  "status": "queued|building|build_failed|deploying|deploy_failed|running|archived",
  "buildStatus": "pending|success|failed",
  "deployStatus": "pending|success|failed",
  "imageTag": "srh/smart-campus:1.0",
  "containerName": "p_<uuid_short>",
  "port": 8087,
  "url": "https://projects.srh.de/ADBS-WS25/manoj/smart-campus",
  "logs": { "build": "…", "deploy": "…" },
  "createdAt": "ISO",
  "updatedAt": "ISO",
  "lastHealthCheck": "ISO"
}
```

**audit**
```json
{ "who":"uuid", "what":"deploy|redeploy|restart|archive", "projectId":"uuid", "when":"ISO" }
```

Indexes:  
- `projects.ownerId`, `projects.course`, `projects.status`, TTL (optional for logs archive).

---

## 6. API Contract (example routes)

- `POST /api/projects` — create project (ZIP upload or GitHub URL)
- `GET /api/projects/:id` — get project details + status + URLs + logs
- `POST /api/projects/:id/rebuild` — force rebuild image
- `POST /api/projects/:id/redeploy` — redeploy from existing image
- `POST /api/projects/:id/restart` — restart container
- `POST /api/projects/:id/archive` — set status=archived (container kept)
- `GET /api/projects?course=ADBS-WS25&status=running` — list/filter
- `GET /api/projects/:id/logs?type=build|deploy` — retrieve logs
- `GET /api/queue` — queue depth & worker concurrency (admin)

Auth: JWT or SRH SSO (role-based routes).

---

## 7. Job Queue Design (Redis)

- **Queue:** `buildQueue`
- **Producer:** API enqueues `{projectId, ownerId, sourceType, sourceRef}`
- **Workers:** N processes (possibly on multiple VMs)
- **Concurrency:** start at 10–15 per worker; scale cautiously
- **Idempotency:** job replays safe; detect duplicate builds by `projectId`
- **Observability:** Bull Board / custom dashboard

---

## 8. Build Pipeline (Worker)

1. **Prepare Workspace**
   - ZIP → extract to `/var/srh/workspaces/<projectId>`
   - Git → clone at requested branch/commit

2. **Stack Detection**
   - Look for `Dockerfile`
   - If missing and **allowed**, generate from template:
     - **Node/React (static):**
       ```dockerfile
       FROM node:18 AS build
       WORKDIR /app
       COPY package*.json ./
       RUN npm ci
       COPY . .
       RUN npm run build
       FROM nginx:alpine
       COPY --from=build /app/build /usr/share/nginx/html
       EXPOSE 80
       CMD ["nginx","-g","daemon off;"]
       ```
     - **Node API (Express):**
       ```dockerfile
       FROM node:18
       WORKDIR /app
       COPY package*.json ./
       RUN npm ci --only=production
       COPY . .
       EXPOSE 3000
       CMD ["node","server.js"]
       ```
     - **Python (FastAPI):**
       ```dockerfile
       FROM python:3.12-slim
       WORKDIR /app
       COPY requirements.txt .
       RUN pip install -r requirements.txt
       COPY . .
       EXPOSE 8000
       CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8000"]
       ```

3. **Build Image**
   - `docker build -t srh/<projectId>:<version> .`
   - Stream logs → `projects.logs.build`
   - On non-zero exit: `build_failed` (stop)

4. **Optionally Build FE with dynamic BE URL**
   - If project has BE first: inject `BACKEND_URL` into FE env (build-time) or `config.json` (runtime)

---
## 8.1 Dockerfile Requirements for Student Projects

To ensure the platform can automatically build and deploy student projects, each uploaded repository must include a valid Dockerfile at the root level.

Requirements:

- Must expose a port (EXPOSE 3000, EXPOSE 8000, or EXPOSE 8080).

- Must include a start command (CMD or ENTRYPOINT).

- Must install dependencies (npm install, pip install, etc.).

- Must log output to stdout.

- Should not require manual input.

Example Templates:

- Node.js / Express

 - FROM node:18-alpine
 - WORKDIR /app
 - COPY package*.json ./
 - RUN npm ci
 - COPY . .
 - EXPOSE 3000
 - CMD ["node", "server.js"]


Python / Flask

 - FROM python:3.12-slim
 - WORKDIR /app
 - COPY requirements.txt .
 - RUN pip install -r requirements.txt
 - COPY . .
 - EXPOSE 8000
 - CMD ["python", "app.py"]


All applications must support environment variable ports:

- app.listen(process.env.PORT || 3000)

---
## 9. Deploy Pipeline (Worker)

1. **Allocate Port**
   - From range e.g., 8000–9999; ensure free (check `ss -tuln`)

2. **Run Container**
   - `docker run -d --name p_<uuid8> -p <port>:<internal> --restart unless-stopped srh/<projectId>:<version>`

3. **Health Check**
   - GET `/:health` or `/` within 30s; else `deploy_failed`

4. **Register Route (Nginx)**
   - Write site file:
     ```nginx
     location /ADBS-WS25/manoj/smart-campus/ {
       proxy_pass http://127.0.0.1:<port>/;
       proxy_set_header Host $host;
     }
     ```
   - Reload: `nginx -s reload`

5. **Persist**
   - Update MongoDB URL & status = `running`

6. **If Deploy Fails**
   - Capture `docker logs p_<uuid8>` → `projects.logs.deploy`
   - Set `deploy_failed` (keep image)
   - Provide **Retry Deploy** button

---

## 10. URL Wiring: Frontend ↔ Backend

### 10.1 Build-time injection (simple)
- Deploy BE → get URL → write `.env.production` for FE `REACT_APP_API_URL` → build FE → deploy

### 10.2 Runtime config (advanced)
- Start FE container with env `BACKEND_URL`
- Serve `/config.json` from entrypoint script
- FE fetches `/config.json` on boot

---

## 11. Concurrency, Scaling, and Sizing

- **Rule of Thumb:** 1 build ≈ 1–2 vCPU + 0.5–2 GB RAM
- Start: 1 worker × 10 concurrency
- Scale: 2 workers × 15 (≈30 parallel builds) if hardware allows
- Monitor: `htop`, `docker stats`, queue latency
- Multi-VM: Workers can live on separate VMs; share Redis/Mongo

---

## 12. Health Checks & Monitoring

- **Daily health cron:**
  - `docker ps` status, restart non-running containers
  - HTTP health probe for each project URL
- **Metrics:**
  - CPU/RAM/disk alerts (`df -h`, `docker system df`)
  - Optional: Prometheus + Grafana or Portainer
- **Queue metrics:** depth, processing rate, failures

---

## 13. Failure Handling Matrix

| Stage | Symptom | Root Cause | System Action | Student Hint |
|------|---------|------------|---------------|--------------|
| Build | `COPY failed` | Missing file path | Mark `build_failed`, log | Check Dockerfile paths |
| Build | `npm ERR!` | Dependencies | Mark failed | Commit `package.json` & lockfile |
| Build | Timeout | Long install | Increase timeout, suggest cache | Pin versions |
| Deploy | Crash on start | Wrong CMD/port | `deploy_failed`, logs | Ensure server listens on internal port |
| Deploy | 502 via proxy | Health not ready | Add wait/retry | Add `/health` endpoint |
| Runtime | High RAM | Memory leak | Alert, optional restart | Optimize app |
| Routing | 404 under subpath | FE base path | Nginx subpath rewrite | Set FE `homepage`/base URL |

---

## 14. Security & RBAC

- **Auth:** SRH SSO or JWT
- **Roles:** student (own projects), professor (course scope), admin (all)
- **Isolation:** no user access to Docker socket
- **Uploads:** ZIP size cap; optional antivirus scan
- **HTTPS:** Let’s Encrypt; HSTS; limited CORS (dashboard origin)
- **Secrets:** `.env` via root-only perms; rotate quarterly

---

## 15. Policy: Container Persistence

- **Do not delete** running containers (per professor).  
- Nightly **prune unused images only**:
  ```bash
  docker image prune -af
  ```
- Metadata marks `archived` without stopping containers.
- Manual stop/restart available via admin dashboard (optional).

---

## 16. Backups & DR (Disaster Recovery)

- **MongoDB Atlas:** daily snapshots; weekly export to SRH storage
- **Config:** Git repo for Nginx templates, worker scripts (sans secrets)
- **Images:** optional push to local/remote registry
- **Restore Runbook:**
  1. Restore MongoDB snapshot
  2. Recreate Nginx configs from repo templates
  3. Pull images (if registry used) or rebuild from repo/ZIP
  4. Start workers; queue resumes

---

## 17. Operations Runbooks

### 17.1 Provision a New Course
1. Create course namespace path in URLs
2. Add course to professor account
3. (Optional) Pre-create Nginx prefix block

### 17.2 Onboard a New Worker VM
1. Install Docker, Node/Python, Redis client
2. Pull worker code; set `.env` (REDIS_URL, MONGO_URL)
3. Start worker with `pm2`/`systemd`
4. Verify via `/api/queue`

### 17.3 Rotate Secrets
1. Generate new JWT/DB creds
2. Update secrets on API + workers
3. Rolling restart services

### 17.4 Restart a Stuck Project
1. `docker ps | grep <container>`
2. `docker logs <container>`
3. `docker restart <container>`
4. Mark action in `audit`

---

## 18. Troubleshooting

- **“Build never starts”** → Check Redis availability and worker logs
- **“Port already in use”** → Use next free port; expand range
- **“502 Bad Gateway”** → App path vs proxy path; check base URL
- **“Disk full”** → `docker system df`, image prune, extend volume
- **“Git clone fails”** → Network/SSH keys; allowlist GitHub

---

## 19. Roadmap

- v1: MVP, live logs, retry, container persistence
- v1.1: Bull Board, health dashboard, admin restart tools
- v1.2: Runtime config.json for FE↔BE linking
- v2: Multi-VM workers; quotas; professor analytics
- v3: Kubernetes migration (Pods, Ingress, HPA)

---

## 20. Handover Checklist

- [ ] Access: SSH, repo URLs, DNS, TLS
- [ ] Secrets: `.env` samples, rotation policy
- [ ] Diagrams & configs: Nginx, worker scripts
- [ ] Accounts: MongoDB Atlas, error dashboards
- [ ] Runbooks: this document + quickstart guide
- [ ] Contact list: IT, course leads

---

## 21. Quickstart (Admin)

```bash
# 1) Install Docker, Redis, Node/Python, Nginx
# 2) Clone repos (api, worker, frontend)
# 3) Set environment files (.env*)

# 4) Start services (example Docker Compose skeleton)
version: "3.8"
services:
  api:
    build: ./api
    env_file: ./api/.env
    ports: ["8080:8080"]
    depends_on: [redis, mongo, nginx]
  worker:
    build: ./worker
    env_file: ./worker/.env
    depends_on: [redis, mongo]
  redis:
    image: redis:7-alpine
  mongo:
    image: mongo:6
    volumes: ["mongo_data:/data/db"]
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    ports: ["80:80","443:443"]
volumes: { mongo_data: {} }

# 5) Test: upload small project → watch logs → open URL
```

---

## 22. Glossary
- **Worker:** background process handling builds/deploys.
- **Queue depth:** number of pending jobs.
- **Health check:** HTTP endpoint used to verify service readiness.
- **Archive:** metadata state; container is kept running per policy.

---

## 23. Contacts
- **Primary Maintainer:** Manoj Padmanabha (mjgowda27g@gmail.com)
- **SRH IT:** (add email)
- **Professor:** Peter Dillinger (Peter.Dillinger@srh-hochschulen.de)

## 24. License & Repository Info

This project is maintained by SRH Hochschule Heidelberg for educational use.
License: MIT License (or as per SRH internal policy).
Repository URL: https://github.com/hshdacs/Hall_of_Fame.git
