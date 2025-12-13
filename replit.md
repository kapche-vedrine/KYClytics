# KYClytics

## Overview

KYClytics is a full-stack web application that automates Know Your Customer (KYC) onboarding, risk scoring, and compliance review scheduling. The platform enables financial institutions to efficiently onboard clients, automatically calculate risk scores based on configurable factors (PEP status, country risk, industry risk), and manage review schedules based on risk levels.

Key features include:
- JWT-based authentication with role-based access control (ADMIN, COMPLIANCE_OFFICER)
- Client onboarding with document upload support
- Deterministic risk scoring engine with configurable weights and thresholds
- Automatic review scheduling based on risk bands (GREEN/YELLOW/RED)
- Document management with PDF report generation
- Audit logging for compliance tracking

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite build tool
- **Routing**: Wouter for client-side routing with protected route guards
- **State Management**: TanStack React Query for server state, localStorage for auth persistence
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios with interceptors for JWT token attachment and 401 handling

The frontend follows a page-based structure with reusable UI components. Authentication state is persisted in localStorage and rehydrated on app load.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Uploads**: Multer with disk storage for document handling
- **PDF Generation**: PDFKit for client report generation
- **Database Access**: Drizzle ORM with PostgreSQL dialect

The backend exposes RESTful API endpoints under `/api/` prefix with middleware for authentication and role verification.

### Data Storage
- **Database**: PostgreSQL via Neon serverless driver (@neondatabase/serverless)
- **ORM**: Drizzle ORM with schema defined in `shared/schema.ts`
- **File Storage**: Local filesystem storage in `server/uploads/` directory

### Key Data Models
- **Users**: Authentication with email/password, role-based permissions
- **Clients**: KYC profile data including risk scoring fields (PEP, country, industry, job)
- **Documents**: File metadata linked to clients with physical files stored on disk
- **RiskConfig**: Configurable weights and thresholds for risk calculations

### Risk Scoring Engine
Located in `client/src/lib/risk-engine.ts`, implements deterministic scoring:
- Base score: 0
- Additions: PEP (+30), High-risk country (+20), High-risk industry (+20), Cash-intensive job (+10)
- Bands: GREEN (0-24), YELLOW (25-44), RED (45+)
- Review periods: GREEN (24 months), YELLOW (12 months), RED (6 months)

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `@neondatabase/serverless` driver
- **Connection**: Requires `DATABASE_URL` environment variable
- **Schema Management**: Drizzle Kit for migrations (`npm run db:push`)

### Authentication
- **JWT Secret**: Configured via `JWT_SECRET` environment variable (defaults to development key)
- **Token Expiry**: 7 days

### File Storage
- **Location**: `server/uploads/{clientId}/` for client documents
- **Limits**: 15MB max file size, PDF/JPG/PNG allowed

### Build & Development
- **Vite**: Frontend build with React plugin and Tailwind CSS
- **esbuild**: Server bundling for production
- **TypeScript**: Strict mode with path aliases (@/, @shared/, @assets/)

### Third-Party UI Libraries
- Radix UI primitives for accessible components
- Recharts for dashboard visualizations
- Lucide React for icons