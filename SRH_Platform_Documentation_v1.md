# SRH Hall of Fame Platform Documentation

Author: Manoj Padmanabha  
Documentation update: 2026-04-02

## 1. Project Overview
The SRH Hall of Fame Platform is a web application for collecting, building, publishing, reviewing, and demonstrating student software projects.

The platform supports:
- project submission by ZIP upload or GitHub repository URL
- automatic Docker image build
- on-demand project run/stop
- public project browsing
- teacher remarks and community comments
- media upload for screenshots, demo videos, and reference files
- admin quota monitoring for operational control

The current implementation is split into:
- `Backend/`: Express API, MongoDB models, Bull queue, Docker/GCS integration
- `webui/`: React frontend used by students, faculty, admins, and public viewers

## 2. Main Goals
- Centralize academic project submissions in one portal
- Remove environment mismatch problems during evaluation
- Let projects be built and run in a predictable Docker-based workflow
- Give students a clean upload and review workflow
- Let faculty review both the project and its logs
- Let admins monitor usage, queue pressure, and quota risk

## 3. Core Features
### 3.1 Authentication and Roles
Roles currently supported:
- `viewer`: public/community user who can register, browse, run projects, and comment after login
- `student`: can upload projects, run projects, see own remarks, and access `My Projects`
- `faculty`: can upload projects, run projects, and write/publish remarks
- `admin`: full access including quota monitoring and admin-only routes

Role assignment is currently automatic during registration:
- `@stud.hochschule-heidelberg.de` -> `student`
- `@hochschule-heidelberg.de` -> `faculty`
- all other domains -> `viewer`

Admin role is currently managed manually in MongoDB.

### 3.2 Upload and Build
Supported project source inputs:
- GitHub repository URL
- ZIP archive

Supported project assets:
- project screenshots/images
- demo video
- documentation text
- resource/reference links
- resource documents (PDF, DOC, DOCX, TXT)
- teammate selection

### 3.3 Runtime
Projects are not started immediately after build. The platform uses a two-step lifecycle:
- build first
- start project later from the workspace

This is intentional because:
- it reduces unnecessary resource usage
- it gives users explicit control over runtime
- it aligns with quota-based execution limits

### 3.4 Review and Visibility
- viewers can browse published projects and add comments after login
- faculty/admin can add remarks
- only the project owner student, faculty, and admin can see remarks/build logs
- projects are visible in gallery only when status is one of:
  - `ready`
  - `running`
  - `stopped`

Failed, queued, or building projects are filtered from normal public/student project listing.

## 4. Technology Stack
### 4.1 Frontend
Location: `webui/`
- React 18
- React Router DOM 6
- Axios
- React Responsive Carousel
- custom toast provider
- CSS files per page/component

### 4.2 Backend
Location: `Backend/`
- Node.js
- Express
- Mongoose
- Bull
- WebSocket (`ws`)
- Multer
- Docker CLI integration
- Simple Git
- Unzipper
- Google Cloud Storage SDK
- Swagger docs

### 4.3 Infrastructure / External Services
- MongoDB Atlas (current development setup)
- Redis (required for Bull queue)
- Docker / Docker Compose
- Google Cloud Storage (optional but currently used for media)

## 5. Repository Structure
```text
Hall_of_Fame/
|-- Backend/
|   |-- app.js
|   |-- server.js
|   |-- config/
|   |-- controllers/
|   |-- db/
|   |-- middleware/
|   |-- queue/
|   |-- routes/
|   |-- services/
|   |-- uploads/
|   `-- package.json
|
|-- webui/
|   |-- src/
|   |-- public/
|   `-- package.json
|
|-- SRH_Platform_Documentation_v1.md
|-- Project_Documentation.pdf
`-- README.md
```

Important note:
- The root `docker-compose.yml`, `react-app/`, and `angular-app/` folders are not part of the main Hall of Fame runtime flow used by `Backend/` + `webui/`. They appear to be legacy or parallel work and should not be treated as the active deployment path for this platform.

## 6. Architecture
### 6.1 High-Level Flow
```text
User Browser
  -> React Frontend (`webui`)
  -> Express API (`Backend/server.js`)
  -> MongoDB Atlas (users, projects, remarks, comments, histories)
  -> Redis (Bull build queue)
  -> Build Worker (`Backend/queue/buildWorker.js`)
  -> Docker / Docker Compose runtime
  -> Optional Google Cloud Storage for uploaded media
```

### 6.2 Runtime Components
#### Frontend
The React frontend handles:
- login/register/profile
- upload wizard
- project gallery
- project workspace
- build logs screen
- admin quota monitor
- language switching (German default, English optional)

#### API Server
The Express API handles:
- authentication
- upload validation
- project CRUD/read routes
- enqueueing build jobs
- project run/stop
- comments/remarks
- quota/monitor APIs
- Swagger documentation

Main entrypoints:
- `Backend/server.js`
- `Backend/app.js`

#### Build Queue
Bull queue name:
- `buildQueue`

Redis is used to:
- queue build jobs
- retry failed jobs
- keep long-running build jobs locked correctly
- decouple upload request/response from actual Docker build execution

#### Build Worker
`Backend/queue/buildWorker.js`:
- connects to MongoDB
- consumes jobs from Bull
- calls `buildAndDeployProject(...)`
- updates project status/build history
- emits live log messages over WebSocket

#### WebSocket Log Stream
Worker WebSocket server default port:
- `8031`

Purpose:
- stream build/deploy logs live to the frontend build status page

## 7. Data Model
### 7.1 User Schema
File: `Backend/db/model/userSchema.js`

Fields:
- `name`
- `dob`
- `regNumber`
- `batch`
- `course`
- `email`
- `password` (bcrypt hashed)
- `role` (`viewer`, `student`, `faculty`, `admin`)
- `createdAt`

### 7.2 Project Schema
File: `Backend/db/model/projectSchema.js`

Important fields:
- owner/student data
  - `studentName`
  - `regNumber`
  - `batch`
  - `course`
  - `ownerUserId`
- project metadata
  - `projectTitle`
  - `projectTag`
  - `longDescription`
  - `githubUrl`
  - `sourceType`
  - `sourcePathOrUrl`
- deployment data
  - `imageTag`
  - `containerName`
  - `hostPort`
  - `internalPort`
  - `url`
  - `frontendService`
  - `frontendPort`
- status
  - `queued`
  - `building`
  - `ready`
  - `running`
  - `stopped`
  - `failed`
  - `build_failed`
- logs
  - `logs.build`
  - `logs.deploy`
- media and documents
  - `images`
  - `demoVideo`
  - `documentation`
  - `resourceLinks`
  - `resourceFiles`
- team
  - `teamMembers[]`
- histories
  - `buildHistory[]`
  - `startHistory[]`

### 7.3 Remarks and Comments
Additional collections/models:
- `projectRemarkSchema.js`
- `projectCommentSchema.js`

Purpose:
- teacher/admin evaluation remarks
- community and logged-in user comments

## 8. Authentication and Authorization
### 8.1 JWT
JWT auth is implemented in:
- `Backend/controllers/auth.controller.js`
- `Backend/middleware/authMiddleware.js`

Current method:
- JWT is signed using `jsonwebtoken`
- the implementation uses a shared secret (`JWT_SECRET`)
- this is a **symmetric** authentication/signing model, not asymmetric public/private key signing
- default library behavior here is HS256 unless explicitly changed

The token payload includes:
- `id`
- `role`
- `name`
- `email`
- `dob`
- `regNumber`
- `batch`
- `course`

### 8.2 Middleware
- `auth`: verifies bearer token and populates `req.user`
- `checkRole([...])`: blocks routes if role is not allowed

### 8.3 Password Protection
Passwords are **not encrypted and stored reversibly**.

Current method:
- passwords are hashed using `bcrypt`
- hashing is one-way
- bcrypt internally uses salt rounds and does not require a separate application decryption key
- plaintext passwords cannot be recovered from stored hashes

This means:
- JWT uses a configurable shared secret
- password hashes do not use a decryptable application key
- the only critical secret that must be created and stored by the deployment owner is `JWT_SECRET`

### 8.4 Secret Management Recommendation
For production or shared deployment:
- create your own `JWT_SECRET`
- create your own cloud credentials / service accounts
- store secrets outside Git

Recommended storage options:
- local development: `.env` / `development.env` on the machine only
- VM deployment: environment variables or an untracked secret file outside the repo
- cloud deployment: provider secret manager / instance environment configuration

Never commit:
- `JWT_SECRET`
- MongoDB credentials
- Redis credentials
- GCS service-account key files

### 8.5 Current Role Rules
#### Viewer
- can register/login
- can browse all visible projects
- can run/stop projects
- can comment only after login
- cannot upload
- cannot see admin monitor
- cannot create remarks

#### Student
- all viewer capabilities
- can upload projects
- can access `My Projects`
- can see own published remarks
- can see own build logs in workspace

#### Faculty
- can upload projects
- can run/stop projects
- can add/publish remarks
- can see build logs and project remarks

#### Admin
- can do everything faculty can
- can access quota monitor
- can delete projects
- can publish/unpublish any remark

## 9. Build and Runtime Method
### 9.1 Source Intake
Upload route:
- `POST /api/project/upload`

Accepted source strategies:
- GitHub repository URL
- ZIP archive

The backend stores the source type and either:
- clones the repository into `Backend/uploads/<projectId>/`
- extracts the ZIP into `Backend/uploads/<projectId>/`

### 9.2 Project Root Resolution
File: `Backend/services/projectSourceResolver.js`

Behavior:
- searches for `Dockerfile` or compose file inside extracted/cloned content
- supports nested ZIP folder structures
- ignores `.git`, `node_modules`, `__MACOSX`

Supported compose file names:
- `docker-compose.yml`
- `docker-compose.yaml`
- `compose.yml`
- `compose.yaml`

### 9.3 Build Service
File: `Backend/services/buildService.js`

Behavior:
- clears old upload workspace for the same project id
- fetches/clones/extracts project source
- resolves Docker root
- verifies presence of `Dockerfile` or compose file
- marks project as `building`
- streams command output live
- for compose projects:
  - runs `docker compose build`
  - marks project `ready`
  - does not auto-start containers
- for Dockerfile projects:
  - runs `docker build`
  - reserves a host port hint
  - stores image/container metadata
  - marks project `ready`
  - does not auto-run container
- on failure:
  - stores build log
  - marks `build_failed`

### 9.4 Why the Platform Does Not Auto-Run After Build
This is a deliberate operational design:
- build success means the project is runnable
- actual runtime is user-triggered from workspace
- this avoids wasting ports and resources
- this works better with quota enforcement

### 9.5 Run Service
File: `Backend/services/runProject.js`

Two cases are supported:
#### Single Dockerfile project
- selects a free host port using `get-port`
- removes existing old container with same name if present
- runs `docker run -d -p host:internal`
- updates project status to `running`
- stores runtime URL
- appends `startHistory`

#### Docker Compose project
- executes `docker compose up -d`
- parses compose YAML to find likely frontend service/port
- heuristically treats container ports `80`, `3000`, `5173`, or `8080` as frontend candidates
- stores `frontendService`, `frontendPort`, and public `url`
- appends `startHistory`

### 9.6 Stop Service
File: `Backend/services/stopProject.js`

Two cases are supported:
#### Docker Compose project
- runs `docker compose down`
- clears frontend URL/port
- marks status `stopped`

#### Single Dockerfile project
- stops/removes the running container
- clears `hostPort` and `url`
- marks status `stopped`

### 9.7 Stop on Logout
Route:
- `POST /api/project/stop-on-logout`

Behavior:
- looks for projects currently `running`
- checks `startHistory`
- stops projects last started by the logging-out user

Purpose:
- prevents orphan running containers after user logout

## 10. How Redis Is Used
Redis is not used as general application cache here. It is used specifically for Bull queue processing.

Current Redis responsibilities:
- hold queued build jobs
- coordinate background worker processing
- maintain retry and job lifecycle information
- prevent long-running build jobs from being marked stalled too aggressively

Queue configuration is in:
- `Backend/queue/buildQueue.js`

Important settings:
- queue name: `buildQueue`
- `lockDuration`: 30 minutes
- `stalledInterval`: 60 seconds
- retry attempts: 3
- backoff: 5000 ms
- failed jobs retained temporarily for inspection

Without Redis:
- uploads cannot be queued properly
- background builds do not work
- build worker cannot process jobs reliably

## 11. How MongoDB Is Used
MongoDB is the main persistent database.

Connection file:
- `Backend/db/dbconfig/db.js`

MongoDB stores:
- users
- projects
- build/deploy logs inside project document
- build history
- runtime start history
- teacher remarks
- project comments
- quota-related project counts derived from stored documents

Current connection style:
- MongoDB Atlas URI in environment
- DB name selected separately through `MONGODB_DATABASE`

## 12. How Google Cloud Storage Is Used
File: `Backend/services/gcsMediaService.js`

GCS is used for optional media and document storage.

What is stored in GCS:
- project images
- demo videos
- resource files

How it works:
- if `GCS_BUCKET_NAME` is set, GCS mode is enabled
- uploaded files are stored in bucket object paths such as:
  - `projects/<course>/<userId>/<filename>`
  - `projects/<course>/<userId>/resources/<filename>`
- database stores `gs://...` URIs
- on read, the backend converts those URIs into signed read URLs for the frontend

Important behavior:
- when GCS is enabled, temporary local uploaded files are deleted after successful upload to bucket
- when GCS is not enabled, files are served from `Backend/uploads/`

## 13. Required Environment Variables
Current backend env file is `Backend/config/development.env`.

Recommended complete example:

```env
# Core runtime
NODE_ENV=development
PORT=8020
WORKER_WS_PORT=8031
JWT_SECRET=change_this_secret

# Logging
LOG_LEVEL=debug
LOG_MAX_DAYS=60

# MongoDB
MONGODB_CLUSTER_URI=mongodb+srv://<username>:<password>@<cluster>/<db>?retryWrites=true&w=majority
MONGODB_DATABASE=hall_of_fame

# Redis
REDIS_URL=redis://127.0.0.1:6379

# Google Cloud Storage
GCS_PROJECT_ID=your-gcp-project-id
GCS_BUCKET_NAME=your-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=./srh-hof.json

# Student quotas (optional overrides)
QUOTA_STUDENT_UPLOADS_PER_DAY=10
QUOTA_STUDENT_QUEUED_BUILDS=3
QUOTA_STUDENT_RUNNING_PROJECTS=2
QUOTA_STUDENT_ZIP_MAX_BYTES=209715200
QUOTA_STUDENT_PROJECT_STARTS_PER_HOUR=6

# Faculty quotas (optional overrides)
QUOTA_FACULTY_UPLOADS_PER_DAY=30
QUOTA_FACULTY_QUEUED_BUILDS=10
QUOTA_FACULTY_RUNNING_PROJECTS=10
QUOTA_FACULTY_ZIP_MAX_BYTES=524288000
QUOTA_FACULTY_PROJECT_STARTS_PER_HOUR=20
```

Notes:
- do not commit real credentials or service-account JSON files
- `Backend/.gitignore` should ignore local key files
- the current checked-in `development.env` contains real-looking credentials and should be replaced with sanitized values before sharing

## 14. Local Service Setup
### 14.1 MongoDB
Current code expects MongoDB Atlas, but local MongoDB could also work if URI is adjusted.

Required:
- reachable MongoDB instance
- correct `MONGODB_CLUSTER_URI`
- correct `MONGODB_DATABASE`

### 14.2 Redis
Redis must be running locally or reachable by URL.

Recommended local setup on Windows:
- run Redis separately (native, WSL, Docker, or a local Redis service)

Expected URL:
- `redis://127.0.0.1:6379`

### 14.3 Docker
Docker Desktop must be installed and running.

Why Docker is required:
- build uploaded projects from Dockerfile or compose file
- run and stop project containers
- expose projects on local host ports

### 14.4 Google Cloud Storage
If media uploads should go to cloud storage:
- create/select a GCP project
- create a storage bucket
- create a service account with object write/read permission
- download service-account key JSON locally
- set `GOOGLE_APPLICATION_CREDENTIALS` to that key file path
- set `GCS_PROJECT_ID` and `GCS_BUCKET_NAME`

Recommended permission scope:
- object admin or object creator + reader, depending on policy

## 15. How to Start the Application
### 15.1 Backend API
From `Backend/`:
```bash
npm install
npm run dev:api
```

API server runs on:
- `http://localhost:8020`

### 15.2 Build Worker
From `Backend/` in a second terminal:
```bash
npm install
npm run dev:worker
```

Worker responsibilities:
- consume build queue jobs
- perform Docker build steps
- emit live logs on WebSocket

### 15.3 Frontend
From `webui/`:
```bash
npm install
npm start
```

Frontend runs on:
- `http://localhost:3000`

### 15.4 Required Startup Order
Recommended order:
1. ensure Docker is running
2. ensure Redis is running
3. ensure MongoDB is reachable
4. start backend API
5. start backend worker
6. start frontend

## 16. API and Operational Endpoints
### 16.1 Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/users/basic`

### 16.2 Projects
- `GET /api/project/all`
- `GET /api/project/details/:id`
- `GET /api/project/status/:id`
- `POST /api/project/upload`
- `POST /api/project/run/:id`
- `POST /api/project/stop/:id`
- `POST /api/project/stop-on-logout`
- `GET /api/project/:id/comments`
- `POST /api/project/:id/comments`
- `GET /api/project/:id/remarks`
- `POST /api/project/:id/remarks`
- `PATCH /api/project/remarks/:remarkId/publish`
- `DELETE /api/project/delete/:id`

### 16.3 Admin Quota Monitor
- `GET /api/admin/quotas/limits`
- `GET /api/admin/quotas/users/:userId/usage`
- `GET /api/admin/quotas/users/:userId/summary`
- `GET /api/admin/quotas/projects/:projectId/usage`
- `GET /api/admin/quotas/overview`

### 16.4 Swagger
- `http://localhost:8020/api-docs`

### 16.5 Queue Monitor
Bull Board is mounted at:
- `http://localhost:8020/admin/queues`

## 17. Frontend Usage Guide
### 17.1 Public / Viewer Flow
Without login:
- open landing page
- browse projects
- open project detail pages
- run or stop projects

With viewer login:
- all of the above
- add comments
- access profile page
- switch language between German and English

### 17.2 Student Flow
A student can:
- register/login
- upload a project
- choose teammates from same course/batch
- add screenshots, demo video, documentation, resource links/files
- watch build logs after upload
- open workspace after build
- start/stop project runtime
- view own remarks from faculty/admin
- access `My Projects`

Upload wizard steps:
1. General Info
2. Assets & Media
3. Review & Submit

### 17.3 Faculty Flow
Faculty can:
- upload projects
- browse all visible projects
- start/stop projects
- view build logs
- add remarks
- publish/unpublish remarks for students

### 17.4 Admin Flow
Admin can:
- access all faculty capabilities
- access quota monitor
- inspect queue and quota pressure
- delete projects
- manage remark visibility

## 18. Admin Monitor Explanation
The admin monitor aggregates quota and runtime pressure.

Main cards:
- Tracked Users: total student/faculty users included in overview
- Queued/Building: total jobs/projects in waiting or build phase
- Running Projects: total currently running project containers

Course quota health:
- shows running projects vs total projects per course
- current implementation focuses on ACS and ADS

User quota risk table:
- `Uploads 24h`: project uploads in last 24 hours
- `Queue Load`: queued + building projects for that user
- `Running`: currently running projects owned by that user
- `Risk`: max percentage utilization among quota dimensions

Risk is informational. It does not directly mean upload is blocked unless a hard quota limit is actually exceeded.

## 19. Quota System
Implemented in:
- `Backend/services/quotaService.js`

Quota dimensions:
- uploads per day
- queued builds
- running projects
- zip file max size
- project starts per hour

Behavior:
- admins are effectively unlimited
- faculty have higher limits
- students have lower limits

Default limits if env is not set:
- student uploads/day: 10
- student queued builds: 3
- student running projects: 2
- student starts/hour: 6
- student max zip size: 200 MB
- faculty uploads/day: 30
- faculty queued builds: 10
- faculty running projects: 10
- faculty starts/hour: 20
- faculty max zip size: 500 MB

## 20. Upload Validation Rules
Current upload validation includes:
- either GitHub URL or ZIP, not both
- strict GitHub repo URL format
- required title and description
- at least one selected technology
- ZIP/file/image/video/resource validation on frontend
- teammate must match student/course/batch rules

Frontend also stores upload drafts in localStorage with expiration.

## 21. Build Logs and Failure Handling
### 21.1 Build Logs
Logs are stored in:
- `project.logs.build`
- `project.logs.deploy`

They are visible in:
- build status page during active processing
- project workspace build-log tab for owner student/faculty/admin

### 21.2 Failure Flow
When build fails:
- project status becomes `build_failed`
- logs are stored in DB
- build history entry is added
- frontend can return the user back to upload with prior text metadata restored

## 22. Language System
The frontend uses a simple app-level language preference system.

Current behavior:
- default language: German
- optional language: English
- navbar language switch updates page labels on converted pages
- user-created project content is not translated automatically

Important principle:
- application UI text changes with language
- user-uploaded titles, descriptions, documentation, links, and comments remain in original language entered by the user

## 23. Known Implementation Notes
- `JWT_SECRET` currently falls back to a weak default in code. This should be replaced with a real env value in all environments.
- `run/:id` and `stop/:id` are currently public to support public runtime viewing. This should be reviewed if stricter runtime control is required later.
- the current `development.env` does not include `REDIS_URL` or `JWT_SECRET` even though code expects them; these should be added.
- the checked-in development env contains live-looking secrets and should be sanitized.
- root-level `docker-compose.yml` does not represent the current Hall of Fame runtime architecture.
- GCS is currently being used as a temporary/practical media backend and can later be replaced by:
  - a VM-mounted storage path
  - another GCP storage design
  - AWS S3
  - Azure Blob Storage
  - any S3-compatible object storage

## 24. Troubleshooting Guide
### 24.1 Login fails with valid-looking user
Check:
- user exists in MongoDB
- password matches the bcrypt hash
- correct email domain was used during registration
- `JWT_SECRET` is set consistently for the running backend instance

### 24.2 Upload fails before build starts
Check:
- title, description, and technology stack are filled
- GitHub URL is in valid repository format
- ZIP file contains a valid Docker-based project
- file type and size rules are not violated

### 24.3 Media upload fails
Check:
- `GCS_PROJECT_ID` is correct
- `GCS_BUCKET_NAME` is correct
- `GOOGLE_APPLICATION_CREDENTIALS` points to a valid service-account key
- the service account has object create/read permission on the bucket

### 24.4 Build worker is not processing jobs
Check:
- Redis is running and reachable through `REDIS_URL`
- worker terminal is started with `npm run dev:worker`
- Bull Board shows jobs arriving

### 24.5 Project build succeeds but runtime does not start
Check:
- Docker Desktop is running
- the uploaded project really exposes a runnable service
- compose file or Dockerfile is at the resolved project root
- no host port conflict exists

### 24.6 Admin monitor shows unexpected queue/risk values
Check:
- worker is running
- project statuses are updating correctly in MongoDB
- quota defaults or optional `QUOTA_*` env overrides are set as expected

## 25. Recommended Setup Checklist
Before running locally, confirm:
- Docker Desktop is running
- Redis is reachable at `REDIS_URL`
- MongoDB Atlas URI is valid
- GCS bucket/key file is configured if cloud media is desired
- `JWT_SECRET` is set
- API terminal is running
- worker terminal is running
- frontend terminal is running

## 26. Suggested Future Improvements
- add `.env.example` files for backend and frontend
- move secret management to a safer environment strategy
- tighten runtime permissions if public run/stop becomes a concern
- add automated tests for upload, build, and comment flows
- add deployment runbooks for production hosting
- add object lifecycle policy for GCS media if storage growth becomes an issue
- add analytics and richer admin dashboards
- replace hardcoded fallback auth secret with mandatory secret boot validation

## 27. Quick Start Summary
From repository root, open three terminals:

Terminal 1:
```bash
cd Backend
npm install
npm run dev:api
```

Terminal 2:
```bash
cd Backend
npm install
npm run dev:worker
```

Terminal 3:
```bash
cd webui
npm install
npm start
```

Then open:
- frontend: `http://localhost:3000`
- backend API: `http://localhost:8020`
- swagger: `http://localhost:8020/api-docs`
- bull board: `http://localhost:8020/admin/queues`

## 28. Demo / Development Login Accounts
These accounts were created during development testing and should be treated as non-production demo credentials only.

Students:
- `student1@stud.hochschule-heidelberg.de` / `test@123`
- `student2@stud.hochschule-heidelberg.de` / `test@123`
- `student3@stud.hochschule-heidelberg.de` / `test@123`
- `student4@stud.hochschule-heidelberg.de` / `test@123`

Faculty:
- `teacher1@hochschule-heidelberg.de` / `test@123`
- `teacher2@hochschule-heidelberg.de` / `test@123`

Admin:
- `admin1@hochschule-heidelberg.de` / `admin@123`

Important:
- these should not be used for production deployment
- production should use institution-managed accounts or recreated secure accounts
- passwords should be reset or replaced before any real rollout

## 29. Role-Based Usage Summary
### Viewer
- browse and run projects
- comment after login

### Student
- upload
- manage own projects
- see own remarks and build logs

### Faculty
- upload
- comment
- add/publish remarks
- inspect build logs

### Admin
- monitor quotas
- inspect all projects
- delete projects
- full review access

## 30. Reference Files Used
This documentation was aligned against:
- `Project_Documentation.pdf` (existing root reference)
- `SRH_Platform_Documentation_v1.md` (previous markdown draft)
- current backend/frontend source code in this repository

## 31. Contact / Ownership
Platform ownership:
- SRH University / SRH academic project platform context

Primary implementation author and technical contact for this repository version:
- Manoj Padmanabha

Contact role:
- repository implementation owner
- technical handover / setup contact for this build

Repository:
- `https://github.com/hshdacs/Hall_of_Fame.git`

Deployment note:
- GCS in the current version is a temporary and practical cloud-media solution used during development/testing
- the architecture is portable and can be moved to another cloud provider or VM-based storage model later
