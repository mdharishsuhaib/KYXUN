# KYXUN – AI Academic Copilot

`KYXUN` `AI Academic Copilot` `STUDY PLANNER`

**Full-Stack AI-Powered Academic Planning Platform**

<a><img src="logo.png" width="20" height="20" alt="Kyxun Logo" align="center"></a> &nbsp;Kyxun: [https://kyxun.mdharishsuhaib.workers.dev](https://kyxun.mdharishsuhaib.workers.dev)

⭐ Star us on GitHub · 🐛 Report Bug · ✨ Request Feature

---

## Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [API Reference](#api-reference)
- [Authentication Flow](#authentication-flow)
- [AI Integration](#ai-integration)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## Overview

KYXUN is a full-stack AI academic copilot that transforms student panic into a structured, personalised survival plan. It supports secure JWT-based authentication, per-user data isolation, subject/semester/exam tracking, and AI-generated study plans powered by Google Gemini.

The platform is structured around two primary modes of interaction:

- **Planner Mode** – create subjects, semesters, courses, tasks and exams, and track progress through a unified academic dashboard
- **Copilot Mode** – upload a syllabus and get an AI-generated study plan, exam readiness dashboard, previous-paper analyzer, viva simulator, and flashcard generator

---

## Key Features

- Secure user registration and login with BCrypt password hashing
- JWT-based stateless authentication with short-lived access tokens and long-lived refresh tokens
- Complete data isolation — every query is scoped to the authenticated user
- Department → Course → Semester → Subject hierarchy for academic organisation
- Task management with priority levels, due dates, and status tracking (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- Examination tracking across SEMESTER_EXAM, MODEL_EXAM, INTERNAL_ASSESSMENT, VIVA, PRACTICAL and ASSIGNMENT types, with marks recording
- Calendar and study-session scheduling for lectures, exams, and focused study blocks
- AI-generated study plans via Spring AI + Google Gemini, built from an uploaded syllabus
- Exam Readiness Dashboard — readiness, coverage, recovery, and execution-load scoring
- Previous Year Question Paper Analyzer — keyword-frequency analysis to surface likely repeated topics
- AI Viva Simulator — warm-up, core, and pressure questions with coach-answer reveal
- Flashcard Generator — recall cards built from must-study and skip topics
- File uploads and downloads for syllabi and study material
- Real-time notifications and an analytics dashboard with aggregated academic stats
- Redis caching for high-traffic reference data (subjects, departments, notifications)
- Rate limiting via Bucket4j to protect the API from abuse
- Password reset via emailed tokens (Spring Mail)

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | React framework, routing & SSR |
| React 19 | UI library |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| Framer Motion | Animations |
| Supabase JS | Auth/session helpers |
| Google Generative AI SDK | Client-side AI calls |
| lucide-react | Icons |
| mammoth / pdf-parse | Syllabus document parsing |

### Backend

| Technology | Purpose |
|---|---|
| Java 21 | Language runtime |
| Spring Boot 3.2.5 | REST API framework |
| Spring Security + JWT (jjwt) | Stateless authentication |
| Spring Data JPA | ORM / persistence |
| Flyway | Database migrations |
| Spring AI (Vertex AI Gemini) | AI study-plan generation |
| Redis | Caching layer |
| Bucket4j | Rate limiting |
| Spring Mail | Transactional email (password reset) |
| MapStruct + Lombok | Entity↔DTO mapping, boilerplate reduction |
| springdoc-openapi | Swagger / OpenAPI documentation |

### Database

| Technology | Purpose |
|---|---|
| PostgreSQL | Primary relational database |
| Redis | In-memory cache for reference data |

### Deployment

| Service | Purpose |
|---|---|
| Cloudflare Workers (OpenNext) | Frontend hosting with auto-deploy |
| Docker / Docker Compose | Backend, PostgreSQL & Redis containers |
| Supabase | Managed PostgreSQL / auth helpers |

---

## System Architecture

- **Backend**: Spring Boot REST API in `Backend/src/main/java/com/kyxun/` following a strict **Controller → Service → Repository** pattern
- **Auth layer**: `security/jwt/JWTService.java`, `security/filter/JwtAuthenticationFilter.java`, and `security/handler/JwtAuthenticationEntryPoint.java`
- **Frontend**: Next.js + TypeScript App Router app in `Frontend/src/app/`
- **State management**: React hooks + `lib/store.ts`, with route groups for `(workspace)` (dashboard, subjects, plan, chats, library, progress, settings)
- **Data Transfer**: DTOs only — entities are never exposed directly to the frontend; MapStruct mappers convert between them
- **Caching**: `@Cacheable` / `@CacheEvict` on Subjects, Departments, and Notifications via Redis

### Data Flow

1. User registers/logs in → backend issues a signed JWT `accessToken` and `refreshToken`
2. `JwtAuthenticationFilter` decodes the token on every request and sets the authenticated principal
3. Frontend attaches `Authorization: Bearer <token>` on every API call
4. All queries are filtered by the authenticated `user_id` → full per-user data isolation
5. On `401`/`403`, the frontend silently calls `/api/v1/auth/refresh-token` to obtain a new access token

---

## Repository Structure

```
KYXUN/
├── Backend/                          # Java 21 + Spring Boot 3.2.5 backend
│   ├── src/main/java/com/kyxun/
│   │   ├── authentication/           # Register, login, JWT issuance
│   │   ├── user/                     # User profile management
│   │   ├── security/                 # JWT filter, entry point, rate limiting
│   │   ├── department/               # Department CRUD
│   │   ├── course/                   # Course CRUD
│   │   ├── semester/                 # Semester CRUD
│   │   ├── subject/                  # Subject CRUD
│   │   ├── task/                     # Task/assignment CRUD
│   │   ├── examination/              # Exam scheduling & results
│   │   ├── calendar/                 # Calendar events (lectures, exams, study blocks)
│   │   ├── planner/                  # AI-assisted study planner
│   │   ├── ai/                       # Spring AI / Gemini integration
│   │   ├── analytics/                # Aggregated dashboard stats
│   │   ├── notification/             # User notifications
│   │   ├── files/                    # File upload/download
│   │   ├── email/                    # Password reset emails
│   │   └── common/                   # Shared config, DTOs, exceptions, pagination
│   ├── src/main/resources/
│   │   ├── db/migration/             # Flyway SQL migrations (V1–V11)
│   │   └── application*.yml          # Environment-specific config
│   ├── Dockerfile
│   ├── docker-compose.yml            # Postgres + Redis + backend
│   └── pom.xml
├── Frontend/                         # Next.js 16 + TypeScript frontend
│   ├── src/app/
│   │   ├── (workspace)/              # Authenticated app shell
│   │   │   ├── dashboard/            # Overview dashboard
│   │   │   ├── subjects/             # Subject management
│   │   │   ├── plan/                 # AI study-plan generation + copilot suite
│   │   │   ├── chats/                # AI chat
│   │   │   ├── library/              # Uploaded materials
│   │   │   └── progress/             # Progress tracking
│   │   ├── login/ · signup/ · reset-password/
│   │   └── api/                      # Next.js route handlers (analyze, chat, viva)
│   ├── src/components/academic/      # ReadinessDashboard, PaperAnalyzer, VivaSimulator, FlashcardGenerator
│   ├── src/lib/                      # academic.ts (domain logic), services, pipeline
│   ├── wrangler.jsonc                # Cloudflare Workers config
│   └── package.json
└── API_Reference.md                  # Full API & architecture contract
```

---

## Prerequisites

- Java 21 (JDK) and Maven (or the bundled `mvnw`)
- Node.js 18+ and npm
- Docker & Docker Compose (recommended for local Postgres + Redis)
- A Google Vertex AI / Gemini API project (for AI features)
- A Cloudflare account for frontend hosting

---

## Quick Start

Clone and install both frontend and backend in a few commands:

```bash
git clone https://github.com/mdharishsuhaib/KYXUN.git
cd KYXUN
cd Frontend && npm install
cd ../Backend && ./mvnw clean install
```

Bring up Postgres + Redis + backend with Docker Compose:

```bash
cd Backend
docker-compose up -d
```

Open:
- **Backend health**: `http://localhost:8080/actuator/health`
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **Frontend**: `http://localhost:3000`

---

## Backend Setup

### Step 1: Configure Environment Variables

Copy the example config and fill in your own values:

```bash
cd Backend/src/main/resources
cp application-example.yml application-dev.yml
```

Set the following environment variables (or edit `application-dev.yml` directly):

```
DB_URL=jdbc:postgresql://localhost:5432/kyxun_db
DB_USERNAME=postgres
DB_PASSWORD=your_password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret
GMAIL_USERNAME=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
VERTEX_PROJECT_ID=your_gcp_project_id
VERTEX_LOCATION=us-central1
FRONTEND_URL=http://localhost:3000
FILE_UPLOAD_DIR=./uploads
```

### Step 2: Run Database Migrations

Flyway runs automatically on startup and applies all migrations in `Backend/src/main/resources/db/migration/` (`V1` through `V11`) against the configured PostgreSQL database.

### Step 3: Run the Backend

```bash
cd Backend
./mvnw spring-boot:run
```

Backend will run on: `http://localhost:8080`

Health check:

```bash
curl http://localhost:8080/actuator/health
```

Expected response:

```json
{ "status": "UP" }
```

---

## Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

Default URL: `http://localhost:3000`

Build for production:

```bash
npm run build
```

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

---

## API Reference

Base URL: `/api/v1`

All protected endpoints require `Authorization: Bearer <accessToken>`

Every successful response is wrapped in a standard envelope:

```json
{
  "success": true,
  "message": "Human readable success message",
  "data": { },
  "timestamp": "2026-07-01T10:00:00Z"
}
```

List endpoints return a paginated `data` payload (`page`, `size`, `sortBy`, `sortDir` query params supported).

### 1) POST `/api/v1/auth/register`

Register a new user.

### 2) POST `/api/v1/auth/login`

Login and receive `accessToken` + `refreshToken`.

### 3) POST `/api/v1/auth/refresh-token`

Exchange a valid `refreshToken` for a new `accessToken`.

### 4) Subjects, Departments, Courses, Semesters

`POST` / `GET` / `PUT` on `/api/v1/subjects`, `/api/v1/departments`, `/api/v1/courses`, `/api/v1/semesters`.

### 5) Tasks

`POST /api/v1/tasks`, `GET /api/v1/tasks`, `GET /api/v1/tasks/status/{status}`, `PATCH /api/v1/tasks/{id}/complete`, `PATCH /api/v1/tasks/{id}/incomplete`.

### 6) Examinations

`POST /api/v1/examinations`, `GET /api/v1/examinations/upcoming`, `PATCH /api/v1/examinations/{id}/result?marksObtained=X`.

### 7) Calendar & Planner

`POST` / `GET` on `/api/v1/calendar` and `/api/v1/planner`.

### 8) AI

`POST /api/v1/ai/suggest`, `GET /api/v1/examinations/{id}/predict-topics?examType=...`.

### 9) Files

`POST /api/v1/files/upload`, `GET /api/v1/files/download/{id}`, `DELETE /api/v1/files/{id}`.

### 10) Notifications & Analytics

`GET /api/v1/notifications`, `GET /api/v1/notifications/unread/count`, `GET /api/v1/analytics/dashboard`.

> Full request/response payloads, DTO schemas, and error formats are documented in [`API_Reference.md`](./API_Reference.md) and the live Swagger UI.

---

## Authentication Flow

1. User registers — password hashed with BCrypt — stored in PostgreSQL `users` table
2. User logs in — backend validates credentials and signs a JWT `accessToken` (short-lived) and `refreshToken` (long-lived)
3. Tokens are returned to the frontend and stored client-side
4. Every subsequent request attaches `Authorization: Bearer <accessToken>`
5. `JwtAuthenticationFilter` verifies the token and sets `SecurityContext` → all queries filtered by the authenticated user's ID
6. On `401`/`403`, the frontend calls `/api/v1/auth/refresh-token` to silently obtain a new access token
7. On logout, client-side tokens are cleared to prevent data leakage between accounts

---

## AI Integration

KYXUN uses **Spring AI** with **Google Vertex AI Gemini** on the backend, and the **Google Generative AI SDK** on the frontend, to power:

- Syllabus-to-study-plan generation (`/plan`)
- Exam Readiness Dashboard — readiness, coverage, recovery, and execution-load scoring derived from the generated plan
- Previous Year Question Paper Analyzer — keyword-frequency matching against plan topics, no external dependency
- AI Viva Simulator — warm-up, core, and pressure question generation with a coach-answer reveal
- Flashcard Generator — recall cards from must-study and skip topics
- AI topic suggestions and exam topic prediction via `/api/v1/ai/suggest` and `/api/v1/examinations/{id}/predict-topics`

---

## Database Schema

### users

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY |
| first_name | VARCHAR(100) | NOT NULL |
| last_name | VARCHAR(100) | — |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password | VARCHAR(255) | BCrypt hashed |
| profile_picture_url | TEXT | — |
| role | VARCHAR(30) | DEFAULT 'STUDENT' |
| phone_number | VARCHAR(20) | — |
| refresh_token | VARCHAR(500) | — |
| email_verified | BOOLEAN | DEFAULT FALSE |
| account_enabled | BOOLEAN | DEFAULT TRUE |
| created_at / updated_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP |

### subjects

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY |
| user_id | UUID | FK → users(id), CASCADE |
| name | VARCHAR(150) | NOT NULL, UNIQUE per user |
| description | TEXT | — |

### tasks

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY |
| user_id | UUID | FK → users(id) |
| subject_id | UUID | FK → subjects(id) |
| title | VARCHAR(255) | NOT NULL |
| due_date | TIMESTAMPTZ | — |
| estimated_minutes | INTEGER | > 0 |
| priority | SMALLINT | 1–4 |
| status | VARCHAR(20) | PENDING / IN_PROGRESS / COMPLETED / CANCELLED |
| completed_at | TIMESTAMPTZ | — |

### examinations

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY |
| user_id | UUID | FK → users(id) |
| subject_id | UUID | FK → subjects(id) |
| semester_id | UUID | FK → semesters(id), SET NULL |
| title | VARCHAR(150) | NOT NULL |
| exam_type | VARCHAR(30) | SEMESTER_EXAM / MODEL_EXAM / INTERNAL_ASSESSMENT / VIVA / PRACTICAL / ASSIGNMENT |
| exam_date | DATE | NOT NULL |
| start_time / end_time | TIME | — |
| venue | VARCHAR(255) | — |
| max_marks / passing_marks / marks_obtained | INTEGER | marks_obtained ≤ max_marks |

Other tables managed by Flyway: `semesters`, `courses`, `departments`, `calendar_events`, `study_sessions`, `notifications`, `file_records`, `password_reset_tokens`. See `Backend/src/main/resources/db/migration/` (`V1`–`V11`) for full DDL.

---

## Troubleshooting

**Backend fails to start / Flyway migration error**

Ensure PostgreSQL is running and `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` are correct. Check migration history with:

```sql
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC;
```

**"401 Unauthorized" on every request**

Confirm the frontend is sending `Authorization: Bearer <accessToken>` and that `JWT_SECRET` matches between token issuance and validation.

**AI endpoints returning errors**

Verify `VERTEX_PROJECT_ID` and `VERTEX_LOCATION` are set and that the service account has access to the Gemini model in Vertex AI.

**Redis connection refused**

Confirm the `redis` container is healthy (`docker-compose ps`) and `REDIS_HOST` / `REDIS_PORT` are reachable from the backend.

**Frontend build fails on Cloudflare — "Missing script: build"**

Ensure `Frontend/package.json` is the one being built (contains `"build": "next build"`) and that `wrangler.jsonc` points `main` to `.open-next/worker.js`.

---

## Future Improvements

- Recurring task/exam scheduling
- Export study plans and transcripts as PDF
- Push notifications (web + mobile)
- Deeper LMS integrations (Google Classroom, Moodle)
- Collaborative study groups and shared subjects
- Dark mode support

---

## Author

**Mohammed Harish Suhaib M**

GitHub: [mdharishsuhaib](https://github.com/mdharishsuhaib)

---

## License

MIT License

Copyright (c) 2026 Mohammed Harish Suhaib M

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

> ⭐ If you found KYXUN useful, please consider giving it a star on GitHub!
