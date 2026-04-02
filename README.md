# SRH Hall of Fame Platform

SRH Hall of Fame is a Docker-based academic project showcase platform for SRH students, faculty, admins, and public viewers.

The platform supports:
- project upload by ZIP or GitHub repository
- automatic Docker build processing
- on-demand run and stop of live projects
- screenshots, demo videos, and reference document uploads
- teacher remarks and public comments
- admin quota monitoring and queue visibility

## Main Documentation
The complete software project documentation is available here:

- `SRH_Platform_Documentation_v1.md`

That document covers:
- architecture and repository structure
- technology stack
- MongoDB, Redis, Docker, and GCS usage
- required environment variables
- how to start backend, worker, and frontend
- upload, build, run, and stop flow
- role-based usage for viewer, student, faculty, and admin
- quota monitoring and build log behavior

## Reference Material
Additional reference material in this repository:

- `Project_Documentation.pdf`

## Main Runtime Folders
- `Backend/` - Express API, queue worker, DB models, Docker build/run services
- `webui/` - React frontend

## Quick Start
See Section 15 and Section 26 in `SRH_Platform_Documentation_v1.md`.

