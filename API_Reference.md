# Kyxun Backend — API & Architecture Contract

This document provides a comprehensive overview of the Kyxun Backend architecture, API endpoints, authentication flows, and data structures. It serves as the ultimate source of truth for frontend developers consuming the backend.

---

## 1. Project Architecture

The Kyxun backend follows a strict enterprise-grade **Controller-Service-Repository** architecture built on **Spring Boot 3.2.5** and **Java 21**.

- **Controllers (`com.kyxun.*.controller`)**: Thin layer responsible for handling HTTP requests, performing input validation via Jakarta Validation (`@Valid`), and delegating business logic to the Service layer. Controllers format all responses using the `ApiResponse` wrapper.
- **Services (`com.kyxun.*.service.impl`)**: The core business logic layer. Contains transactional boundaries, cache management (`@Cacheable`, `@CacheEvict`), and orchestrates calls to repositories or external APIs (e.g., Spring AI Gemini integration).
- **Repositories (`com.kyxun.*.repository`)**: Spring Data JPA interfaces for database operations, communicating with the **PostgreSQL** database.
- **Data Transfer Objects (DTOs)**: Used exclusively for data exchange between the client and server. Entities are **never** exposed directly to the frontend. Mappers handle conversion between Entities and DTOs.
- **Entities**: JPA domain models mapping directly to database tables (managed by Flyway migrations).

### Core Technologies
- **PostgreSQL**: Primary relational database.
- **Redis**: In-memory caching for performance (Subjects, Departments, Notifications).
- **Spring Security + JWT**: Stateless authentication.
- **Bucket4j**: Rate limiting.
- **Google Gemini (Spring AI)**: Generative AI features for study planning.

---

## 2. Global API Settings

### Base URL
All REST endpoints are prefixed with the following path:
```text
/api/v1
```

### Swagger / OpenAPI Documentation
The backend self-documents all endpoints dynamically. When running the backend locally (`npm run dev` equivalent via Maven), access the interactive UI at:
```text
http://localhost:8080/swagger-ui.html
```
You can view all detailed DTO schemas, optional fields, and try out endpoints directly from this interface.

---

## 3. Standard Formats

### 3.1. Standard Success Response
Every successful API response is wrapped in an `ApiResponse<T>` object:

```json
{
  "success": true,
  "message": "Human readable success message",
  "data": { ... payload ... },
  "timestamp": "2026-07-01T10:00:00Z"
}
```

### 3.2. Error Response Format
In the event of an error (e.g., Validation Failure, 404 Not Found, 500 Internal Error), the API returns a structured `ApiError` object:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    "Title must not exceed 255 characters",
    "Subject ID is required"
  ],
  "path": "/api/v1/tasks",
  "timestamp": "2026-07-01T10:00:00Z"
}
```

### 3.3. Pagination Format
Endpoints that return lists of data (e.g., `GET /api/v1/tasks`) use pagination. The `data` property of the `ApiResponse` will contain a `PagedResponse<T>` object:

```json
{
  "content": [
    { ... item 1 ... },
    { ... item 2 ... }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 25,
  "totalPages": 3,
  "last": false
}
```
**Pagination Query Parameters:**
- `page` (default: 0) - The zero-indexed page number.
- `size` (default: 10) - The number of items per page.
- `sortBy` (default: "createdAt") - Field to sort by.
- `sortDir` (default: "desc") - Sort direction (`asc` or `desc`).

---

## 4. Authentication & Security

### 4.1. JWT Authentication Flow
1. **Login/Register**: Client sends credentials to `POST /api/v1/auth/login` or `/register`.
2. **Tokens Issued**: Server returns both an `accessToken` (short-lived, usually 24h) and a `refreshToken` (long-lived, e.g., 7 days).
3. **Authorization Header**: For all subsequent protected routes, the client must include the Access Token in the HTTP headers:
   ```http
   Authorization: Bearer <your_access_token>
   ```

### 4.2. Refresh Token Flow
When the `accessToken` expires, the API will return a `401 Unauthorized` or `403 Forbidden`. The client should then silently call the refresh endpoint to obtain a new access token:
- **Endpoint**: `POST /api/v1/auth/refresh-token`
- **Request Body**:
  ```json
  {
    "refreshToken": "your_long_lived_refresh_token"
  }
  ```
- **Response**: A new `AuthenticationResponse` containing fresh tokens.

### 4.3. Validation Rules
- **Passwords**: Must be properly hashed by the backend. The frontend should enforce minimum length (e.g., 8 chars).
- **Strings**: Use `@NotBlank` (no empty/whitespace strings) and `@Size(max = 255)` for titles, descriptions, etc.
- **Dates**: Sent and received in ISO-8601 format (e.g., `"2026-07-10T23:59:00Z"`).

---

## 5. Core Entities & API Contracts

### 5.1. File Uploads
Files are stored securely. 
- **Upload File**: `POST /api/v1/files/upload` (Requires `multipart/form-data` with a `file` field). Returns a `FileResponse` DTO containing the `id` and `url`.
- **Download File**: `GET /api/v1/files/download/{id}` (Returns raw binary stream).
- **Delete File**: `DELETE /api/v1/files/{id}`.

### 5.2. Departments & Courses & Semesters
Hierarchical structure for academic grouping:
- **Departments**: `POST /api/v1/departments`, `GET /api/v1/departments`, `PUT /api/v1/departments/{id}`
- **Courses**: `POST /api/v1/courses`, `GET /api/v1/courses`
- **Semesters**: `POST /api/v1/semesters`, `GET /api/v1/semesters/{id}`

### 5.3. Subjects
- **Endpoints**: `POST /api/v1/subjects`, `GET /api/v1/subjects`, `PUT /api/v1/subjects/{id}`
- **DTO**: Contains `name`, `code`, `credits`, `colorCode`, `semesterId`.

### 5.4. Tasks (Assignments & Todos)
- **Endpoints**:
  - `POST /api/v1/tasks` (Create task)
  - `GET /api/v1/tasks` (Paginated list)
  - `GET /api/v1/tasks/status/{status}` (e.g., PENDING, COMPLETED)
  - `PATCH /api/v1/tasks/{id}/complete` (Mark as done)
  - `PATCH /api/v1/tasks/{id}/incomplete` (Mark as pending)
- **DTO**: `title`, `description`, `subjectId`, `dueDate`, `estimatedMinutes`, `priority` (LOW, MEDIUM, HIGH).

### 5.5. Examinations
- **Endpoints**:
  - `POST /api/v1/examinations` (Create exam)
  - `GET /api/v1/examinations/upcoming` (Get upcoming exams)
  - `PATCH /api/v1/examinations/{id}/result?marksObtained=X` (Record scores, uses Query Param).
- **Enum Types**: `INTERNAL_ASSESSMENT`, `SEMESTER_EXAM`, `PRACTICAL`, etc.

### 5.6. Calendar & Study Planner
- **Calendar**: `POST /api/v1/calendar`, `GET /api/v1/calendar`. Manages all events (Lectures, Exams, Study blocks). Event types include `OTHER`, `LECTURE`, `EXAM`.
- **Planner**: `POST /api/v1/planner`, `GET /api/v1/planner`.

### 5.7. AI Integrations (Gemini)
- **Suggest Study Topics**: `POST /api/v1/ai/suggest`
  ```json
  { "prompt": "Explain Binary Trees", "context": "Data Structures" }
  ```
- **Predict Exam Topics**: `GET /api/v1/examinations/{id}/predict-topics?examType=INTERNAL_ASSESSMENT`

### 5.8. Notifications & Analytics
- **Notifications**: `GET /api/v1/notifications` (Fetches paginated user notifications), `GET /api/v1/notifications/unread/count`
- **Analytics**: `GET /api/v1/analytics/dashboard` (Returns real-time aggregated stats like total tasks, upcoming exams, study hours).

---

## Conclusion for UI Integration
When building the Frontend, adhere to these principles:
1. Always parse `ApiResponse<T>` to extract the `data` payload.
2. Check `success === false` or HTTP status codes `400`/`500` to parse the `ApiError` format and display the `message` (or `details` array) in toast notifications.
3. Use an interceptor (like Axios interceptors) to automatically attach the `Authorization: Bearer <token>` header, and to catch `401` errors for automatic token refreshes via `/refresh-token`.
