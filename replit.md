# PayVault - Employee Salary Management System

## Overview

PayVault is a Progressive Web App (PWA) designed for managing employee salary records for Pakistani businesses. The system provides comprehensive employee management, salary tracking, and payment processing capabilities with offline support. It features a modern, data-dense interface following Material Design principles and Linear's refined aesthetics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design system

**Design System**
- Typography: Inter font family (Google Fonts) with structured hierarchy
- Spacing: Tailwind units (2, 4, 6, 8, 12, 16, 20, 24) for consistent rhythm
- Component library follows "new-york" shadcn style variant
- Theme support: Light/dark mode with CSS custom properties
- Responsive layouts with mobile-first approach

**Component Architecture**
- Modular components in `/client/src/components`
- Page-level components in `/client/src/pages`
- Shared UI components from shadcn/ui in `/client/src/components/ui`
- Custom business components: StatCard, EmployeeTable, SalaryTable, EmployeeFormModal
- Context-based authentication with AuthContext

**Key Features**
- Dashboard with statistics cards and activity feed
- Employee CRUD operations with Pakistani bank integration
- Salary payment tracking and generation
- Overtime tracking with configurable hourly rates
- Settings management for deductions and allowances
- User management with role-based access control
- Form validation using react-hook-form with Zod resolvers
- Toast notifications for user feedback

### Backend Architecture

**Technology Stack**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon serverless PostgreSQL

**API Structure**
- RESTful endpoints organized in `/server/routes.ts`
- Authentication via custom header-based system (`x-user-id`)
- Middleware for auth checking (`requireAuth`, `requireRole`)
- Storage abstraction layer (`IStorage` interface) for data operations

**Core Endpoints**
- Authentication: `/api/auth/login`, `/api/auth/me`
- Dashboard: `/api/dashboard/stats`
- Employees: `/api/employees` (GET, POST, PUT, DELETE)
- Salary: `/api/salary`, `/api/salary/generate`
- Deductions: `/api/deductions` (GET, POST, PUT, DELETE)
- Allowances: `/api/allowances` (GET, POST, PUT, DELETE)
- Overtime: `/api/overtime` (GET, POST, DELETE)
- Users: `/api/users` (GET, POST, DELETE)

**Authentication & Authorization**
- Bcrypt password hashing (bcrypt.compare for login, bcrypt.hash(10) for storage)
- User ID passed via custom header (`x-user-id`)
- Role-based access control with middleware
- Default test user: admin/admin123
- Admin password hash: $2b$10$XTwiBX3WBLckp5624AA9c.zK4rnJgzq.JnQ..fQDG.KoMpPkwTDky

### Data Storage

**Database Schema** (defined in `/shared/schema.ts`)

**Users Table**
- Primary key: UUID (auto-generated)
- Fields: username (unique), password (plain text), email, role
- Default role: "viewer"

**Employees Table**
- Primary key: Auto-incrementing integer
- Unique constraint: employeeId
- Fields: fullName, address, bankAccountNumber, iban, bankName, bankBranch, salary (real), status
- Status values: "active", "on_leave", "inactive"
- Timestamps: createdAt, updatedAt

**Salary Payments Table**
- Primary key: Auto-incrementing integer
- Foreign key: employeeId references employees(id)
- Fields: amount (real), paymentDate, month, status, paymentMethod, notes
- Status values: "pending", "paid", "failed"
- Timestamp: createdAt

**Deductions Table**
- Primary key: Auto-incrementing integer
- Fields: name, type (tax/insurance/provident_fund/loan/other), amount, percentage, isActive
- Either amount or percentage must be provided
- Timestamp: createdAt

**Allowances Table**
- Primary key: Auto-incrementing integer
- Fields: name, type (bonus/shift_premium/travel/housing/meal/other), amount, percentage, isLocationBased, minDistanceKm, isActive
- Either amount or percentage must be provided
- Timestamp: createdAt

**Employee Deductions Table**
- Primary key: Auto-incrementing integer
- Foreign keys: employeeId, deductionId
- Fields: customAmount (overrides default), isActive
- Timestamp: createdAt

**Employee Allowances Table**
- Primary key: Auto-incrementing integer
- Foreign keys: employeeId, allowanceId
- Fields: customAmount (overrides default), isActive
- Timestamp: createdAt

**Overtime Records Table**
- Primary key: Auto-incrementing integer
- Foreign key: employeeId references employees(id)
- Fields: month, hours, rate, totalAmount, notes
- Timestamp: createdAt

**Salary Breakdown Table**
- Primary key: Auto-incrementing integer
- Foreign key: salaryPaymentId references salary_payments(id)
- Fields: componentType (base/allowance/overtime/deduction), componentName, amount, calculationDetails
- Stores step-by-step calculation breakdown
- Timestamp: createdAt

**Location Logs Table**
- Primary key: Auto-incrementing integer
- Foreign key: employeeId references employees(id)
- Fields: latitude, longitude, accuracy, timestamp, purpose
- Tracks employee location for travel allowances and attendance
- Timestamp: createdAt

**ORM Approach**
- Drizzle ORM for type-safe database queries
- Zod schemas generated from Drizzle tables for validation
- Custom insert schemas with refined validation rules
- Storage abstraction pattern for testability

**Validation**
- Bank account: Minimum 8 digits, digits only
- IBAN: Pakistani format (PK + 2 digits + 20 alphanumeric)
- Employee ID: Required unique identifier
- Salary: Required positive number

### External Dependencies

**Third-Party Services**
- **Neon Database**: Serverless PostgreSQL hosting
- **Google Fonts**: Inter font family for typography

**UI Libraries**
- **Radix UI**: Headless UI primitives (dialogs, dropdowns, navigation, etc.)
- **shadcn/ui**: Pre-built accessible components
- **Lucide React**: Icon library
- **cmdk**: Command palette component

**Development Tools**
- **Vite**: Development server and build tool with HMR
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner
- **Drizzle Kit**: Database migrations and schema management

**Utility Libraries**
- **TanStack Query**: Server state management and caching
- **Wouter**: Lightweight routing
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **date-fns**: Date formatting and manipulation
- **class-variance-authority**: Component variant management
- **clsx & tailwind-merge**: Conditional CSS class handling

**Pakistan-Specific Features**
- List of 20 major Pakistani banks in dropdown
- PKR currency formatting (Intl.NumberFormat with 'en-PK' locale)
- Pakistani IBAN validation format
- Custom bank entry option for unlisted banks

**Progressive Web App (PWA)**
- Manifest file for installability (`/public/manifest.json`)
- Service worker capability (intended for offline support)
- Theme color and app icons configured
- Standalone display mode for app-like experience