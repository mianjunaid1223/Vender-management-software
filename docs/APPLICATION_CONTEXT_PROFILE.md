# VendorVerse Application Context Profile

## Application Overview

**VendorVerse** is a comprehensive vendor management ecosystem built with Next.js 15 that streamlines vendor relationships, invoice processing, and contract management with AI-powered insights.

### Key Purpose
- Manage complete vendor lifecycle from onboarding to performance tracking
- Automate invoice processing with AI data extraction  
- Handle contract management with expiration tracking and renewals
- Provide business insights through AI-driven analytics
- Enable vendor self-service through dedicated portal

## Core Workflow

### 1. Company Setup
```
Register Company → Set Business Profile → Configure Preferences → Invite Team
```

### 2. Vendor Management
```
Send Invite/Receive Application → Vendor Onboarding (4 steps) → Review & Approve → Vendor Portal Access
```

### 3. Invoice Processing  
```
Upload/Create Invoice → AI Data Extraction → Review & Validate → Payment Tracking → Insights
```

### 4. Contract Management
```
Create Contract (4 steps) → Set Milestones & KPIs → Track Performance → Renewal Management
```

## Technical Architecture

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB, JWT Authentication
- **AI Integration**: Google AI/Genkit for invoice processing and insights
- **Email Service**: Nodemailer for notifications
- **Multi-tenant**: Complete data isolation by companyId

## Key Features Summary

| Module | Primary Functions | AI Integration |
|--------|------------------|----------------|
| **Vendor Management** | Onboarding, profiles, performance tracking | Vendor performance insights |
| **Invoice Processing** | Upload, AI extraction, payment tracking | Data extraction, spending analysis |
| **Contract Management** | Lifecycle management, renewals, KPIs | Renewal recommendations |
| **Company Management** | Profile, preferences, multi-tenant setup | Business optimization advice |
| **Vendor Portal** | Self-service access for vendors | N/A |
| **Analytics Dashboard** | Real-time KPIs and business metrics | Predictive insights |

## Database Collections

- **companies**: Multi-tenant company profiles and preferences
- **vendors**: Vendor information and relationship data  
- **contracts**: Contract lifecycle and performance tracking
- **invoices**: Invoice processing and payment management
- **vendorApplications**: Application submissions and approvals
- **users**: Authentication and access control

## AI Capabilities

- **Invoice Data Extraction**: Automatically extract amount, dates, vendor info from PDFs
- **Spending Insights**: Analyze patterns and trends across vendors
- **Performance Analytics**: Track vendor KPIs and contract performance  
- **Business Recommendations**: Context-aware suggestions for optimization
- **Predictive Analytics**: Forecast renewals, spending, and vendor relationships

## Security & Compliance

- JWT-based authentication with session management
- Multi-tenant data isolation (companyId filtering)
- Input validation and sanitization (Zod schemas)
- Role-based access control
- Secure vendor portal access (PIN/token based)

## Development & Deployment

- **Development**: `npm run dev` on port 9002 with Turbopack
- **Build**: `npm run build` for production optimization
- **Database**: MongoDB with connection string configuration
- **Environment**: Configurable via environment variables
- **Deployment**: Optimized for Vercel, supports Docker and cloud platforms

## Business Value

- **Efficiency**: Reduces manual vendor management overhead by 60-80%
- **Insights**: AI-powered analytics provide actionable business intelligence
- **Compliance**: Automated contract tracking and renewal management
- **Scalability**: Multi-tenant architecture supports business growth
- **Integration**: API-first design enables future integrations with accounting/ERP systems

---

*Generated automatically from repository analysis - Last updated: 2024-01-15*