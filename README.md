# Vendor Management Platform (VMP)# Vendor Management Platform (VMP)



**Simple, Powerful Vendor Management for Small Businesses & Freelancers****Enterprise-grade Multi-tenant Vendor Management System with AI Integration**



A modern, affordable vendor management solution built for freelancers and small-to-medium businesses. Manage vendors, track invoices, and organize contracts - all in one place.## 🏗️ Platform Architecture Overview



---The Vendor Management Platform is a comprehensive enterprise solution built on Next.js 14 with TypeScript, featuring a multi-tenant architecture, secure vendor portal, AI-powered insights, and robust audit logging.



## 💡 What is VMP?### 🎯 Core Purpose

- **Primary**: Streamline vendor relationship management for enterprises

VMP is a subscription-based platform ($20-$65/month) that helps small businesses and freelancers:- **Secondary**: Enable secure vendor self-service through dedicated portals

- ✅ **Track vendors** - Keep all vendor info organized in one place- **Tertiary**: Provide AI-driven insights and automation for vendor operations

- ✅ **Manage invoices** - Create, send, and track invoices easily

- ✅ **Handle contracts** - Store and manage vendor contracts---

- ✅ **Vendor portal** - Give vendors secure access to their invoices and contracts

- ✅ **Stay organized** - Never lose track of vendor relationships again## 📋 Table of Contents



---1. [System Architecture](#-system-architecture)

2. [Security Framework](#-security-framework)

## 🎯 Perfect For3. [Multi-Tenant Design](#-multi-tenant-design)

4. [API Standards](#-api-standards)

- **Freelancers** managing multiple clients and subcontractors5. [Database Schema](#-database-schema)

- **Small businesses** (1-50 employees) with vendor relationships6. [Authentication & Authorization](#-authentication--authorization)

- **Consultants** tracking project vendors and expenses7. [Vendor Portal System](#-vendor-portal-system)

- **Agencies** managing creative and service providers8. [AI Integration](#-ai-integration)

- **Contractors** coordinating with suppliers9. [Development Standards](#-development-standards)

10. [Deployment & Operations](#-deployment--operations)

---11. [Future AI Agent Guidelines](#-future-ai-agent-guidelines)



## 💰 Pricing Tiers---



### Starter ($20/month)## 🏛️ System Architecture

- Up to 10 vendors

- 50 invoices/month### Technology Stack

- Basic vendor portal```

- Email supportFrontend:           Next.js 14 (App Router), React 18, TypeScript

Styling:           Tailwind CSS, Shadcn/ui Components

### Professional ($45/month)Backend:           Next.js API Routes (Server Actions)

- Up to 50 vendorsDatabase:          MongoDB (Primary), MongoDB Atlas (Cloud)

- 200 invoices/monthAuthentication:    Custom JWT + bcrypt (Multi-tenant aware)

- Full vendor portal with custom brandingAI/ML:             Google Genkit, Custom AI Flows

- Priority supportFile Storage:      Local/Cloud Storage (Configurable)

- Contract managementDeployment:        Docker, Cloud Platforms

- Basic analytics```



### Business ($65/month)### 📁 Project Structure

- Unlimited vendors```

- Unlimited invoicessrc/

- Advanced vendor portal├── app/                          # Next.js 14 App Router

- Dedicated support│   ├── (auth)/                  # Authentication routes

- Advanced analytics│   ├── dashboard/               # Company admin interface

- Multi-user access (up to 5 users)│   ├── vendor-portal/           # Vendor self-service portal

- API access│   ├── api/                     # API endpoints

│   │   ├── admin/              # Admin operations

---│   │   ├── vendor-portal/      # Vendor portal APIs

│   │   └── vendors/            # Vendor management APIs

## 🚀 Quick Start│   └── globals.css

├── components/                   # Reusable UI components

```bash│   ├── ui/                     # Base UI components (Shadcn)

# 1. Install dependencies│   ├── dashboard/              # Company dashboard components

npm install│   └── vendor-portal/          # Vendor portal components

├── lib/                         # Core business logic

# 2. Set up environment│   ├── auth/                   # Authentication system

cp .env.example .env.local│   ├── data/                   # Data access layer

# Edit .env.local with your MongoDB URL│   ├── types/                  # TypeScript definitions

│   └── utils.ts                # Utility functions

# 3. Run development server├── ai/                          # AI integration layer

npm run dev│   ├── flows/                  # AI workflow definitions

# Open http://localhost:3000│   └── genkit.ts               # AI configuration

└── scripts/                     # Database migrations & utilities

# 4. Build for production```

npm run build

npm start---

```

## 🔒 Security Framework

---

### Security Principles

## 📁 Project Structure1. **Zero Trust Architecture**: Every request validated

2. **Defense in Depth**: Multiple security layers

```3. **Least Privilege**: Minimal access rights

vmp/4. **Audit Everything**: Comprehensive logging

├── src/

│   ├── app/              # Next.js pages & API routes### Security Implementations

│   ├── core/             # Core logic (auth, database)

│   ├── features/         # Feature modules (vendors, invoices)#### 1. IDOR Protection

│   ├── shared/           # Shared components & utilities```typescript

│   └── config/           # Configuration files// ✅ Secure: Session-derived data access

├── docs/                 # Documentationexport async function getMyInvoices(): Promise<Invoice[]> {

├── scripts/              # Database scripts  const session = await getVendorSession();

└── public/               # Static assets  return getVendorScopedData('invoices', session.vendorId, session.companyId);

```}



---// ❌ Vulnerable: Caller-supplied parameters

export function getVendorInvoices(vendorId: string, companyId: string) {

## 🎨 Key Features  // Potential IDOR vulnerability

}

### For Business Owners```

- 📊 **Dashboard** - See everything at a glance

- 👥 **Vendor Management** - Add, edit, search vendors#### 2. Input Validation

- 📄 **Invoice Creation** - Professional invoice templates```typescript

- 📧 **Email Invoices** - Send directly from platform// ObjectId validation pattern

- 💰 **Payment Tracking** - Track paid/pending/overdueif (!ObjectId.isValid(invoiceId)) {

- 📑 **Contract Storage** - Keep contracts organized  throw new Error('Invalid invoice ID');

}

### For Vendors (Portal)

- 🔐 **Secure Login** - Protected access to their data// Scope assertion pattern

- 👁️ **View Invoices** - See all their invoicesfunction assertVendorScope(session: VendorUser, vendorId: string, companyId: string) {

- 📥 **Download PDFs** - Get invoices as PDFs  if (session.vendorId !== vendorId || session.companyId !== companyId) {

- ✏️ **Update Profile** - Keep info current    throw new Error('Forbidden: Access denied');

- 💬 **Messages** - Communicate with business  }

}

---```



## 🛠️ Tech Stack#### 3. JWT Security

```typescript

```// Algorithm constraint (prevents algorithm confusion attacks)

Frontend:     Next.js 14, React, TypeScript, Tailwind CSSconst payload = await jwtVerify(token, secretKey, {

Backend:      Next.js API Routes  algorithms: ['HS256']

Database:     MongoDB});

Auth:         JWT + bcrypt

Deployment:   Vercel, Railway, Docker// Secret validation

```if (!vendorSecretKey) {

  throw new Error('VENDOR_AUTH_SECRET or AUTH_SECRET is required');

---}

```

## 📚 Documentation

#### 4. Audit Logging

- [User Guide](./docs/USER_GUIDE.md) - How to use VMP```typescript

- [API Docs](./docs/API.md) - API reference// Security-conscious audit logging (no sensitive data)

- [Database Schema](./docs/DATABASE_SCHEMA_DESIGN.md) - DB structureawait createAuditLog({

- [Development Guide](./docs/DEVELOPMENT.md) - For developers  userId: session.id,

  action: 'login',

---  resource: 'session',

  resourceId: insertedId.toString(), // DB ID, not JWT token

## 🤝 Contributing  ipAddress,

  userAgent,

1. Fork the repo  sessionId: insertedId.toString()

2. Create a feature branch});

3. Make your changes```

4. Test thoroughly

5. Submit a pull request---



---## 🏢 Multi-Tenant Design



## 📄 License### Tenant Isolation Strategy

- **Database Level**: Single database with tenant-scoped queries

MIT License - See LICENSE file- **Application Level**: Tenant context in every request

- **Security Level**: Cross-tenant access prevention

---

### Tenant Context Flow

**Built with ❤️ for small businesses**```typescript

User Request → Authentication → Tenant Context → Data Scoping → Response

*Simple tools for serious business*```

### Multi-Tenant Data Patterns
```typescript
// Every data model includes companyId
interface Invoice {
  id: string;
  companyId: string;  // Tenant isolation
  vendorId: string;
  // ... other fields
}

// Tenant-scoped queries
const invoices = await db.collection('invoices').find({
  companyId: session.companyId,  // Always include tenant filter
  vendorId: session.vendorId
});
```

---

## 🔌 API Standards

### RESTful API Design

#### Endpoint Patterns
```
Company Admin APIs:
GET    /api/vendors                    # List vendors
POST   /api/vendors                    # Create vendor
GET    /api/vendors/{id}               # Get vendor
PUT    /api/vendors/{id}               # Update vendor
DELETE /api/vendors/{id}               # Delete vendor

Vendor Portal APIs:
GET    /api/vendor-portal/invoices     # Get my invoices
GET    /api/vendor-portal/contracts    # Get my contracts
GET    /api/vendor-portal/profile      # Get my profile
PATCH  /api/vendor-portal/profile      # Update my profile
```

#### Response Standards
```typescript
// Success Response
{
  "success": true,
  "data": { /* response data */ },
  "timestamp": "2025-09-21T10:30:00Z"
}

// Error Response
{
  "success": false,
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-09-21T10:30:00Z"
}
```

### API Security Patterns
```typescript
// Standard API route structure
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await getVendorSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Authorization check
    const hasPermission = await checkPermission(session, 'read');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Session-derived data access (IDOR protection)
    const data = await getMyData();

    // 4. Response
    return NextResponse.json({ success: true, data });
  } catch (error) {
    // 5. Error handling
    return handleAPIError(error);
  }
}
```

---

## 🗄️ Database Schema

### Core Collections

#### 1. Companies (Tenants)
```typescript
{
  _id: ObjectId,
  name: string,
  email: string,
  plan: 'free' | 'pro' | 'enterprise',
  settings: {
    // Company-specific configurations
  },
  vendorPortalAccess: [
    {
      vendorId: string,
      enabled: boolean,
      features: { /* feature flags */ },
      expiresAt?: Date,
      createdAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. Users (Company Employees)
```typescript
{
  _id: ObjectId,
  companyId: string,          // Tenant isolation
  name: string,
  email: string,
  password: string,           // bcrypt hashed
  role: 'company_admin' | 'company_user',
  isActive: boolean,
  lastLoginAt?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. Vendors
```typescript
{
  _id: ObjectId,
  companyId: string,          // Tenant isolation
  name: string,
  email: string,
  phone: string,
  service: string,
  address?: InvoiceAddress,
  status: 'Active' | 'Inactive' | 'Pending',
  tags: string[],
  rating?: number,
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. Vendor Users (Portal Access)
```typescript
{
  _id: ObjectId,
  vendorId: string,
  companyId: string,          // Tenant isolation
  name: string,
  email: string,
  passwordHash: string,       // bcrypt hashed
  role: 'vendor_admin' | 'vendor_user',
  permissions: Permission[],
  isActive: boolean,
  mfaEnabled: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### 5. Invoices
```typescript
{
  _id: ObjectId,
  companyId: string,          // Tenant isolation
  vendorId: string,
  invoiceNumber: string,
  invoiceDate: Date,
  invoiceDueDate: Date,
  seller: InvoiceEntity,
  buyer: InvoiceEntity,
  items: InvoiceItem[],
  totalAmount: number,
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue',
  paymentStatus: 'Pending' | 'Paid',
  vendorStatus?: 'acknowledged' | 'in_progress' | 'completed',
  vendorNotes?: string,
  createdAt: Date,
  updatedAt: Date
}
```

#### 6. Contracts
```typescript
{
  _id: ObjectId,
  companyId: string,          // Tenant isolation
  title: string,
  partyA: ContractParty,      // Can be vendor or company
  partyB: ContractParty,      // Can be vendor or company
  startDate: Date,
  endDate: Date,
  value: number,
  status: ContractStatus,
  type: ContractType,
  milestones: ContractMilestone[],
  vendorAcknowledgment?: {
    acknowledged: boolean,
    acknowledgedAt: Date,
    notes?: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### 7. Vendor Sessions
```typescript
{
  _id: ObjectId,
  userId: string,
  vendorId: string,
  companyId: string,
  sessionToken: string,       // JWT token
  refreshToken: string,
  expiresAt: Date,
  refreshExpiresAt: Date,
  ipAddress: string,
  userAgent: string,
  isActive: boolean,
  lastActivityAt: Date,
  createdAt: Date
}
```

#### 8. Audit Logs
```typescript
{
  _id: ObjectId,
  userId: string,
  userRole: UserRole,
  vendorId?: string,
  companyId: string,          // Tenant isolation
  action: AuditAction,
  resource: string,
  resourceId: string,         // DB document ID (never JWT tokens)
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
  ipAddress: string,
  userAgent: string,
  timestamp: Date,
  sessionId: string,
  metadata?: Record<string, any>
}
```

### Database Indexes
```javascript
// Performance indexes
db.invoices.createIndex({ companyId: 1, vendorId: 1, createdAt: -1 });
db.contracts.createIndex({ companyId: 1, "partyA.id": 1, "partyB.id": 1 });
db.vendors.createIndex({ companyId: 1, status: 1 });
db.users.createIndex({ companyId: 1, email: 1 }, { unique: true });

// TTL indexes for session cleanup
db.vendor_sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Security indexes
db.audit_logs.createIndex({ companyId: 1, timestamp: -1 });
db.audit_logs.createIndex({ userId: 1, action: 1, timestamp: -1 });
```

---

## 🔐 Authentication & Authorization

### Company Authentication
```typescript
// Traditional session-based auth for company users
const session = await getSession();
if (!session) redirect('/login');
```

### Vendor Portal Authentication
```typescript
// JWT-based auth for vendor portal
const vendorSession = await getVendorSession();
if (!vendorSession) redirect('/vendor-portal/login');
```

### Permission System
```typescript
// Feature-based permissions
interface VendorPortalAccess {
  vendorId: string;
  enabled: boolean;
  features: {
    invoiceManagement: boolean;
    contractManagement: boolean;
    profileManagement: boolean;
    communicationTools: boolean;
    complianceTracking: boolean;
    // Granular permissions
    canViewInvoices: boolean;
    canUploadInvoices: boolean;
    canViewContracts: boolean;
    canSignContracts: boolean;
  };
  restrictions: AccessRestriction[];
  expiresAt?: Date;
}
```

### Session Management
```typescript
// Session creation with security measures
export async function createVendorSession(
  userId: string,
  vendorId: string, 
  companyId: string,
  ipAddress: string,
  userAgent: string
): Promise<{ sessionToken: string; refreshToken: string }> {
  // Create JWT with limited lifetime
  const sessionData = {
    userId, vendorId, companyId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor((Date.now() + VENDOR_SESSION_TIMEOUT) / 1000)
  };
  
  const sessionToken = await new SignJWT(sessionData)
    .setProtectedHeader({ alg: 'HS256' })
    .sign(vendorKey);
    
  // Store in database for revocation capability
  const { insertedId } = await db.collection('vendor_sessions').insertOne({
    userId, vendorId, companyId,
    sessionToken, refreshToken,
    expiresAt: new Date(Date.now() + VENDOR_SESSION_TIMEOUT),
    isActive: true,
    ipAddress, userAgent,
    createdAt: new Date()
  });
  
  // Audit log with DB ID (not JWT token)
  await createAuditLog({
    userId, action: 'login',
    resourceId: insertedId.toString(),
    sessionId: insertedId.toString()
  });
  
  return { sessionToken, refreshToken };
}
```

---

## 🏪 Vendor Portal System

### Portal Architecture
The vendor portal is a secure, feature-rich interface that allows vendors to:
- Manage their profile and business information
- View and respond to invoices
- Access and acknowledge contracts
- Upload compliance documents
- Communicate with the purchasing company

### Feature Management
```typescript
// Dynamic feature access based on company settings
const hasInvoiceAccess = portalAccess.features.canViewInvoices;
const hasContractAccess = portalAccess.features.canViewContracts;
```

### Security Model
1. **Separate Authentication**: Independent from company auth
2. **Granular Permissions**: Feature-level access control
3. **Session Isolation**: Vendor sessions separate from company sessions
4. **Audit Logging**: All vendor actions logged

### Data Access Patterns
```typescript
// Session-derived data access (IDOR-safe)
export async function getMyInvoices(): Promise<Invoice[]> {
  const session = await getVendorSession();
  if (!session) throw new Error('Unauthorized');
  
  return getVendorScopedData('invoices', session.vendorId, session.companyId);
}

// Legacy pattern (deprecated but IDOR-protected)
export async function getVendorInvoices(vendorId: string, companyId: string) {
  const session = await getVendorSession();
  assertVendorScope(session, vendorId, companyId); // Security check
  // ... rest of function
}
```

---

## 🤖 AI Integration

### AI Architecture
```
User Input → AI Flow → LLM Processing → Structured Output → Application Logic
```

### AI Components

#### 1. Genkit Integration
```typescript
// AI configuration
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
```

#### 2. AI Flows
```typescript
// Vendor assistance flow
export const vendorAssistantFlow = ai.defineFlow(
  'vendorAssistant',
  vendorAssistantPrompt,
  async ({ userId, query, context }) => {
    // AI processing logic
    return processVendorQuery(userId, query, context);
  }
);
```

#### 3. AI-Powered Features
- **Invoice Analysis**: Automated invoice data extraction
- **Contract Review**: AI-assisted contract analysis
- **Vendor Insights**: Performance analytics and recommendations
- **Compliance Monitoring**: Automated compliance status tracking

---

## 💻 Development Standards

### Code Organization Principles

#### 1. Separation of Concerns
```
/lib/auth/     - Authentication logic
/lib/data/     - Data access layer
/lib/types/    - Type definitions
/components/   - UI components
/app/api/      - API endpoints
```

#### 2. Security-First Development
- All functions validate input
- Session-derived data access preferred
- Comprehensive audit logging
- Defense against common vulnerabilities (IDOR, XSS, SQL injection)

#### 3. TypeScript Standards
```typescript
// Strict type definitions
interface Invoice {
  id: string;
  companyId: string;
  vendorId: string;
  // ... all fields typed
}

// Proper error handling
try {
  const data = await riskyOperation();
  return { success: true, data };
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error('Operation failed');
}
```

#### 4. Database Interaction Patterns
```typescript
// Always include tenant scoping
const invoices = await db.collection('invoices').find({
  companyId: session.companyId,  // Required for multi-tenancy
  vendorId: session.vendorId,    // Required for vendor isolation
  // ... other filters
});

// ObjectId validation
if (!ObjectId.isValid(invoiceId)) {
  throw new Error('Invalid invoice ID');
}
```

### Testing Standards
```typescript
// Unit tests for business logic
describe('Vendor Data Access', () => {
  test('should enforce vendor scope', async () => {
    const session = mockVendorSession();
    await expect(
      getVendorInvoices('different-vendor', session.companyId)
    ).rejects.toThrow('Forbidden');
  });
});

// Integration tests for API endpoints
describe('Vendor Portal API', () => {
  test('GET /api/vendor-portal/invoices', async () => {
    const response = await request(app)
      .get('/api/vendor-portal/invoices')
      .set('Cookie', vendorSessionCookie);
    
    expect(response.status).toBe(200);
    expect(response.body.invoices).toBeDefined();
  });
});
```

---

## 🚀 Deployment & Operations

### Environment Configuration
```bash
# Required Environment Variables
NODE_ENV=production
DATABASE_URL=mongodb://...
AUTH_SECRET=your-strong-secret-key
VENDOR_AUTH_SECRET=vendor-specific-secret

# Optional Configuration
UPLOAD_PATH=/uploads
MAX_FILE_SIZE=10MB
SESSION_TIMEOUT=28800000  # 8 hours
```

### Docker Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Database Operations
```bash
# Migration scripts
npm run migrate:passwords    # Migrate plain text passwords to bcrypt
npm run migrate:multi-tenant # Set up multi-tenant data structure
npm run seed:database       # Seed with sample data

# Backup and maintenance
mongodump --uri="$DATABASE_URL" --out=backup/
```

### Performance Monitoring
- Database query performance tracking
- API response time monitoring
- User session analytics
- Error rate monitoring

---

## 🤖 Future AI Agent Guidelines

### AI Agent Development Principles

#### 1. Security-First Approach
```typescript
// Always use session-derived functions
✅ const invoices = await getMyInvoices();
❌ const invoices = await getVendorInvoices(vendorId, companyId);

// Always validate ObjectIds
✅ if (!ObjectId.isValid(id)) return null;
❌ const doc = await db.findOne({ _id: new ObjectId(id) });

// Always include tenant scoping
✅ const query = { companyId: session.companyId, vendorId: session.vendorId };
❌ const query = { vendorId: vendorId }; // Missing tenant isolation
```

#### 2. Multi-Tenant Awareness
```typescript
// Every data operation must include companyId
const scopedQuery = {
  companyId: session.companyId,  // REQUIRED
  // ... other filters
};

// Cross-tenant data access is forbidden
if (requestedCompanyId !== session.companyId) {
  throw new Error('Cross-tenant access denied');
}
```

#### 3. API Development Standards
```typescript
// Standard API route structure for AI agents to follow
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication (REQUIRED)
    const session = await getVendorSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Input validation (REQUIRED)
    const body = await request.json();
    if (!body.invoiceId || !ObjectId.isValid(body.invoiceId)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // 3. Authorization check (if needed)
    const hasPermission = await checkPermission(session, 'write');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Business logic with session-derived functions
    const result = await updateMyInvoiceStatus(body.invoiceId, body.status);

    // 5. Audit logging (REQUIRED for sensitive operations)
    await createAuditLog({
      userId: session.id,
      action: 'update',
      resource: 'invoice',
      resourceId: body.invoiceId,
      // ... other audit fields
    });

    // 6. Response
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    // 7. Error handling (REQUIRED)
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### 4. Database Operation Patterns
```typescript
// Pattern for reading data (AI agents should follow this)
async function readVendorData(collection: string) {
  const session = await getVendorSession();
  if (!session) throw new Error('Unauthorized');

  const db = await getDb();
  return await db.collection(collection).find({
    companyId: session.companyId,  // Tenant isolation
    vendorId: session.vendorId,    // Vendor isolation
    // ... additional filters
  }).toArray();
}

// Pattern for writing data
async function writeVendorData(collection: string, data: any) {
  const session = await getVendorSession();
  if (!session) throw new Error('Unauthorized');

  const db = await getDb();
  const result = await db.collection(collection).insertOne({
    ...data,
    companyId: session.companyId,  // Always include tenant
    vendorId: session.vendorId,    // Always include vendor
    createdAt: new Date(),
    createdBy: session.id
  });

  // Audit log for data creation
  await createAuditLog({
    userId: session.id,
    action: 'create',
    resource: collection,
    resourceId: result.insertedId.toString(),
    newValues: data
  });

  return result;
}
```

#### 5. Component Development Guidelines
```typescript
// Secure component pattern
export function VendorInvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        // Use session-derived API endpoints
        const response = await fetch('/api/vendor-portal/invoices');
        if (!response.ok) {
          throw new Error('Failed to fetch invoices');
        }
        const data = await response.json();
        setInvoices(data.invoices);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchInvoices();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      {invoices.map(invoice => (
        <InvoiceCard key={invoice.id} invoice={invoice} />
      ))}
    </div>
  );
}
```

### AI Agent Code Review Checklist

When an AI agent creates or modifies code, ensure:

#### Security Checklist
- [ ] All API routes include authentication checks
- [ ] Session-derived functions are used instead of parameter-based ones
- [ ] ObjectId validation is performed before database operations
- [ ] Tenant scoping (companyId) is included in all queries
- [ ] IDOR protection is implemented
- [ ] Sensitive data is not logged in audit trails
- [ ] Error messages don't leak sensitive information

#### Multi-Tenancy Checklist
- [ ] All data operations include companyId filtering
- [ ] Cross-tenant access is prevented
- [ ] Vendor isolation is maintained
- [ ] Session context is properly validated

#### Code Quality Checklist
- [ ] TypeScript types are properly defined
- [ ] Error handling is comprehensive
- [ ] Functions have clear, single responsibilities
- [ ] Code follows existing patterns and conventions
- [ ] Deprecation warnings are added to legacy functions

#### Testing Checklist
- [ ] Unit tests cover security scenarios
- [ ] Integration tests validate API endpoints
- [ ] Error cases are tested
- [ ] Multi-tenant scenarios are validated

### Common Anti-Patterns to Avoid

```typescript
// ❌ DON'T: Trust caller-supplied IDs
export async function getVendorData(vendorId: string, companyId: string) {
  // Vulnerable to IDOR attacks
}

// ❌ DON'T: Skip ObjectId validation
const doc = await db.findOne({ _id: new ObjectId(invalidId) }); // Throws error

// ❌ DON'T: Forget tenant scoping
const invoices = await db.collection('invoices').find({ vendorId }); // Cross-tenant leak

// ❌ DON'T: Log sensitive data
await createAuditLog({
  resourceId: sessionToken, // Don't log JWT tokens
  oldValues: { password: hashedPassword } // Don't log passwords
});

// ❌ DON'T: Use as any without documentation
const result = updateData as any; // Avoid type bypassing

// ❌ DON'T: Hardcode tenant/vendor IDs
const companyId = 'company-123'; // Always derive from session
```

### Best Practices for AI Agents

1. **Always Start with Security**: Every function should begin with authentication and authorization checks
2. **Use Session Context**: Derive all scope from authenticated session rather than trusting parameters
3. **Validate Everything**: Input validation, ObjectId validation, business rule validation
4. **Audit Important Actions**: Log all data modifications and security-sensitive operations
5. **Follow Existing Patterns**: Use established patterns for consistency and security
6. **Test Security Scenarios**: Always test authorization failures and edge cases
7. **Document Security Decisions**: Explain why certain security measures are in place

---

## 📝 Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/vendor-dashboard-v2

# Run development server
npm run dev

# Run tests
npm run test
npm run test:security

# Type checking
npm run type-check
```

### 2. Security Review Process
1. **Static Analysis**: TypeScript strict mode compliance
2. **Security Scan**: Check for common vulnerabilities
3. **Code Review**: Peer review focusing on security
4. **Testing**: Security-focused integration tests

### 3. Database Migrations
```bash
# Run migrations
npm run migrate

# Verify data integrity
npm run verify:data-integrity

# Backup before major changes
npm run backup:production
```

---

## 🔮 Future Roadmap

### Short Term (Next 3 months)
- [ ] Complete vendor portal feature parity
- [ ] Implement advanced AI insights
- [ ] Add real-time notifications
- [ ] Enhance mobile responsiveness

### Medium Term (3-6 months)
- [ ] Multi-language support
- [ ] Advanced reporting dashboard
- [ ] API rate limiting and quotas
- [ ] SSO integration

### Long Term (6+ months)
- [ ] Machine learning-powered vendor scoring
- [ ] Blockchain integration for contract verification
- [ ] Advanced workflow automation
- [ ] Third-party integrations (ERP, accounting systems)

---

## 📞 Support & Maintenance

### Monitoring & Alerts
- Application performance monitoring
- Database performance tracking
- Security incident detection
- User experience analytics

### Backup & Recovery
- Automated daily database backups
- Point-in-time recovery capability
- Disaster recovery procedures
- Data retention policies

### Security Maintenance
- Regular security audits
- Dependency vulnerability scanning
- Penetration testing
- Security awareness training

---

## 📚 Additional Resources

### Documentation
- [API Documentation](./docs/API.md)
- [Security Guide](./docs/SECURITY.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Contributing Guidelines](./docs/CONTRIBUTING.md)

### Key Files for AI Agents
- `src/lib/data/vendor-data.ts` - Secure data access patterns
- `src/lib/auth/vendor-auth.ts` - Authentication implementation
- `src/lib/types/` - TypeScript type definitions
- `src/app/api/vendor-portal/` - API endpoint examples

---

**Last Updated**: September 21, 2025  
**Version**: 2.0.0  
**Maintainers**: Development Team  
**License**: MIT

---

*This README serves as a comprehensive guide for developers and AI agents working on the Vendor Management Platform. It should be updated as the system evolves to maintain accuracy and usefulness.*
