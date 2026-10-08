# crAPI – Happy Path Guide

## Purpose of This Document
crAPI (Completely Ridiculous API) is intentionally vulnerable, but new users often struggle to understand
how the application is supposed to work *before* exploring security issues.

This document explains the **happy path** — the normal, intended workflow — so users can:
- Understand application behavior
- Navigate APIs with confidence
- Clearly differentiate expected behavior vs vulnerabilities

---

## Prerequisites
Before following this guide, ensure:
- crAPI is running locally using Docker
- You can access:
  - Swagger UI (OpenAPI)
  - Postman collection (optional but recommended)

---

## Application Overview (Conceptual)
crAPI simulates a backend system for:
- User identity and authentication
- User profiles
- Mechanic services
- Orders and notifications

The happy path represents **how a legitimate user interacts with the system**.

---

## Happy Path Workflow (High Level)

1. User signs up
2. User logs in
3. User accesses their profile
4. User interacts with available APIs as intended
5. System responds with valid data and permissions

---

## Step-by-Step Happy Path

### 1. User Registration
**Goal:** Create a new user account

- Endpoint: `/identity/api/auth/signup`
- Action:
  - Provide email, username, and password
- Expected Result:
  - Successful registration confirmation

This step establishes a valid user identity in the system.

---

### 2. User Login
**Goal:** Authenticate and obtain an access token

- Example endpoint: `/identity/api/auth/signup`
- Action:
  - Login using registered credentials
- Expected Result:
  - Access token returned

This token is required for all authenticated API calls.

---

### 3. Access User Profile
**Goal:** Verify authenticated access

- Example endpoint: `/identity/api/auth/signup`
- Action:
  - Include access token in Authorization header
- Expected Result:
  - User’s own profile data is returned

This confirms authentication and authorization are working as intended.

---

### 4. Explore Available APIs
**Goal:** Understand normal system behavior

- Browse Swagger UI to view:
  - User APIs
  - Mechanic APIs
  - Order-related APIs
- Execute read-only or permitted actions

This step helps users recognize **expected responses** and permissions.

---

### 5. Normal Application Usage
**Goal:** Follow intended business logic

- Create or view resources where permitted
- Receive appropriate success or error responses
- Observe correct access controls

At this stage, users fully understand the baseline system behavior.

---

## Why This Matters
Understanding the happy path allows users to:
- Identify where behavior deviates from expectations
- Recognize insecure authorization or validation
- Learn API security concepts more effectively

This guide should be followed **before attempting any challenges or exploitation**.

---

## Next Steps
Once the happy path is clear, users can proceed to:
- `docs/challenges.md`
- `docs/challengeSolutions.md`

to explore vulnerabilities intentionally built into crAPI.
