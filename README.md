# KYClytics --- QA Testing Guide

## Overview

KYClytics is an automated KYC onboarding and risk intelligence platform.
This guide provides all the instructions your QA analyst needs to:

-   Install the project\
-   Run the backend\
-   Run the frontend\
-   Understand key features\
-   Perform tests\
-   Report bugs

------------------------------------------------------------------------

## 1. System Requirements

### Required

-   Node.js v18+\
-   npm\
-   Git\
-   Windows/macOS/Linux

### Optional

-   Postman\
-   VS Code

------------------------------------------------------------------------

## 2. Installation

### 2.1 Clone the repository

``` bash
git clone <REPOSITORY_URL>
cd KYClytics
```

### 2.2 Install dependencies

#### Backend:

``` bash
cd server
npm install
```

#### Frontend:

``` bash
cd client
npm install
```

------------------------------------------------------------------------

## 3. Running the Application

### 3.1 Start the Backend

``` bash
cd server
npm run dev
```

Backend URL:

    http://localhost:5000

If the port is busy:

``` bash
taskkill /F /IM node.exe
npm run dev
```

------------------------------------------------------------------------

### 3.2 Start the Frontend

``` bash
cd client
npm run dev
```

Frontend URL:

    http://localhost:5173

------------------------------------------------------------------------

## 4. Features to Test

### 4.1 User Interface

-   Homepage load\
-   Branding & layout\
-   Navigation\
-   Responsiveness (desktop/tablet/mobile)

------------------------------------------------------------------------

### 4.2 Client Onboarding Flow

Test: - Creating a client\
- Running risk scoring\
- Saving profile\
- Document upload (if enabled)

Ensure results include: - PEP status\
- Sanctions match\
- Identity match score\
- Risk level

------------------------------------------------------------------------

### 4.3 Automated Review Scheduler

Verify: - Add rule\
- Set review date\
- Reminder triggers\
- Overdue flags

------------------------------------------------------------------------

### 4.4 API Testing

#### Get all clients

    GET http://localhost:5000/api/clients

#### Create client

    POST http://localhost:5000/api/clients

Body:

``` json
{
  "firstName": "John",
  "lastName": "Doe",
  "nationality": "USA",
  "riskLevel": "low"
}
```

#### Delete client

    DELETE http://localhost:5000/api/clients/:id

------------------------------------------------------------------------

## 5. Bug Reporting Guidelines

### Format:

-   **Title**\
-   **Summary**\
-   **Steps to Reproduce**\
-   **Expected Behavior**\
-   **Actual Behavior**\
-   **Screenshots/Video**\
-   **Severity**
    -   Critical\
    -   High\
    -   Medium\
    -   Low

------------------------------------------------------------------------

## 6. Known Issues

-   None yet

------------------------------------------------------------------------

## 7. QA Completion Checklist

### Functional

-   [ ] Onboarding works\
-   [ ] Risk scoring works\
-   [ ] API working\
-   [ ] Review scheduler OK

### UI/UX

-   [ ] No broken links\
-   [ ] Mobile layout stable\
-   [ ] No console errors

### Performance

-   [ ] Loads under 3 sec

### Security

-   [ ] Input validation

------------------------------------------------------------------------

End of QA Guide.
