# API Testing Documentation

## Overview
This document outlines the standard procedures for testing the GigsForGigs NestJS backend endpoints via `cURL`. The backend is currently in a stubbed state, meaning it will validate requests against DTO schemas but will not persist data to a database.

## Prerequisites
1. Ensure Node.js is installed.
2. Navigate to the backend directory and start the development server:
   ```bash
   cd back-end
   npm run start:dev
   ```
3. The server runs on `http://localhost:3000`.

---

## Testing Core Endpoints

### 1. Auth Module
**Register a New User**
```bash
curl -X POST http://localhost:3000/auth/register \
-H "Content-Type: application/json" \
-d '{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123",
  "role": "client"
}'
```

**Expected Response (201 Created):**
Validates that `role` exclusively matches the `UserRole` ENUM (`client`, `gig_professional`, `manager`).

---

### 2. Tasks Module
**Create a Task**
```bash
curl -X POST http://localhost:3000/tasks \
-H "Content-Type: application/json" \
-d '{
  "title": "Build a Landing Page",
  "description": "React landing page for startup",
  "category": "Web Development",
  "budget": 500,
  "dueDate": "2026-10-31T00:00:00.000Z",
  "skills": ["React", "CSS"]
}'
```

**Expected Response (201 Created):**
Validates minimum budget constraints and enforces strict ISO 8601 date string format for `dueDate`.

---

### 3. Applications Module
**Apply to a Task**
```bash
curl -X POST http://localhost:3000/applications \
-H "Content-Type: application/json" \
-d '{
  "taskId": "task-uuid-123",
  "coverLetter": "I have 5 years experience in React.",
  "proposedRate": 450
}'
```

**Shortlist an Applicant**
```bash
curl -X PATCH http://localhost:3000/applications/app-uuid-123/shortlist \
-H "Content-Type: application/json"
```

---

### 4. Deliverables Module
**Submit a Deliverable**
```bash
curl -X POST http://localhost:3000/deliverables \
-H "Content-Type: application/json" \
-d '{
  "taskId": "task-uuid-123",
  "description": "Completed frontend files",
  "submissionPath": "/uploads/files/landing-page.zip"
}'
```

---

### 5. Payments Module
**Initiate Escrow Payment**
```bash
curl -X POST http://localhost:3000/payments \
-H "Content-Type: application/json" \
-d '{
  "taskId": "task-uuid-123",
  "deliverableId": "deliv-uuid-123",
  "payeeId": "user-uuid-456",
  "amount": 500
}'
```

**Release Escrow Funds**
```bash
curl -X PATCH http://localhost:3000/payments/pay-uuid-123/release \
-H "Content-Type: application/json"
```

---

## Validation Handling
If malformed data is submitted (e.g., negative budget or missing required fields), the global `ValidationPipe` will return a `400 Bad Request`.

**Example Malformed Request:**
```bash
curl -X POST http://localhost:3000/tasks \
-H "Content-Type: application/json" \
-d '{"title": "Missing fields task"}'
```

**Expected Error Response:**
```json
{
  "message": [
    "description must be a string",
    "category must be a string",
    "budget must not be less than 1",
    "budget must be a number conforming to the specified constraints",
    "dueDate must be a valid ISO 8601 date string",
    "each value in skills must be a string",
    "skills must be an array"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```
