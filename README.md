# SRH Hall of Fame Platform

SRH Hall of Fame is a Docker-based academic project showcase platform built for SRH University. It allows students to upload projects, faculty to review them, admins to monitor platform usage, and public viewers to explore and run live projects.

## Overview

The platform supports:

- project submission using ZIP upload or GitHub repository URL
- automatic Docker-based build pipeline
- on-demand live project run and stop
- screenshots, demo videos, and reference document uploads
- teacher remarks and community comments
- admin quota monitoring and queue visibility
- multilingual UI support with German as default and English as optional

## Active Project Structure

This repository currently uses:

- `Backend/` - Express API, MongoDB models, Redis/Bull queue, Docker build/run services, GCS integration
- `webui/` - React frontend for students, faculty, admins, and viewers

## Main Features

### Authentication and Roles
Supported roles:

- `viewer` - can browse projects, view details, and comment after login
- `student` - can upload projects, manage own projects, and view own remarks/logs
- `faculty` - can review projects, upload, and publish remarks
- `admin` - can monitor quotas, inspect runtime health, and manage platform operations

### Project Workflow
- Upload project by ZIP or GitHub
- Validate project source and metadata
- Queue build in Redis/Bull
- Build Docker image automatically
- Store logs and build history
- Run project on demand
- Stop running project when needed

### Media and Documentation
- screenshot uploads
- demo video uploads
- resource/reference links
- documentation notes
- project team metadata

## Technology Stack

### Frontend
- React
- React Router DOM
- Axios
- CSS modules / custom styling

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- Redis
- Bull Queue
- JWT authentication
- bcrypt password hashing

### Infrastructure
- Docker / Docker Compose
- Google Cloud Storage (current media storage)
- MongoDB Atlas (current DB setup)

## How to Start the Application

Open 3 terminals from the repository root.

### 1. Start Backend API
```bash
cd Backend
npm install
npm run dev:api
2. Start Background Worker
cd Backend
npm install
npm run dev:worker
3. Start Frontend
cd webui
npm install
npm start
