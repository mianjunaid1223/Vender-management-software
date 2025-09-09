# Vendor Self-Service Portal - Technical Architecture

## Overview
This document outlines the technical architecture for implementing a vendor self-service portal within the existing VMS system.

## Design Principles
1. **Modular Integration**: Portal integrates as additional routes/APIs within existing Next.js app
2. **Data Authority**: Company data always takes precedence over vendor-submitted data
3. **Security First**: Role-based access control with audit trails for all actions
4. **Scalable Foundation**: Built to support future AI-driven features and microservices
5. **Zero Breaking Changes**: Extends existing schema without major refactoring

## System Architecture

### Portal Integration Strategy
```
Domain Structure:
├── /dashboard (Company Admin Portal - Existing)
├── /vendor-portal (New Vendor Self-Service Portal)
│   ├── /auth (Vendor Authentication)
│   ├── /dashboard (Vendor Dashboard)
│   ├── /profile (Vendor Profile Management)
│   ├── /invoices (Invoice Management)
│   ├── /contracts (Contract Viewing/Management)
│   ├── /compliance (Compliance Document Upload)
│   └── /support (Help & Support)
└── /api
    ├── /vendor-portal (New Vendor Portal APIs)
    └── /admin (Existing Company APIs)
```

### Authentication & Authorization Architecture

#### Multi-Role Authentication System
```typescript
// Enhanced User Types
type UserRole = 'company_admin' | 'company_user' | 'vendor_admin' | 'vendor_user';

type AuthContext = {
  user: User;
  role: UserRole;
  permissions: Permission[];
  companyId: string;
  vendorId?: string; // Only for vendor users
  portalAccess: PortalAccess;
}

type PortalAccess = {
  enabled: boolean;
  features: PortalFeature[];
  restrictions: AccessRestriction[];
  mfaRequired: boolean;
  lastLogin?: string;
  sessionExpiry: number;
}
```

#### Security Layers
1. **Route Protection**: Middleware-based role verification
2. **API Authorization**: Request-level permission checking
3. **Data Isolation**: Automatic vendor-scoped data filtering
4. **Session Management**: Secure JWT with refresh tokens
5. **MFA Support**: Optional two-factor authentication
6. **Audit Logging**: Immutable action tracking

### Data Flow Architecture

#### Bidirectional Data Sync
```
Company System ←→ Shared Data Layer ←→ Vendor Portal
     ↓                    ↓                   ↓
  [Higher Authority]  [Sync Logic]      [Limited Access]
```

#### Data Authority Matrix
| Data Type | Company Authority | Vendor Contribution | Sync Logic |
|-----------|-------------------|---------------------|------------|
| Vendor Profile | Core fields | Contact updates | Company approves |
| Invoices | Full control | Upload/status updates | Company validates |
| Contracts | Full control | Acknowledgment/signatures | Company creates |
| Compliance | Requirements | Document uploads | Company reviews |

### Schema Enhancement Strategy

#### New Collections
1. **vendor_portal_access** - Portal access management
2. **audit_logs** - Immutable action tracking
3. **vendor_sessions** - Vendor authentication sessions
4. **data_sync_queue** - Bidirectional sync management
5. **portal_notifications** - Vendor-specific notifications

#### Enhanced Existing Collections
- **vendors**: Add portal access fields
- **users**: Add vendor role support
- **invoices**: Add vendor interaction fields
- **contracts**: Add vendor acknowledgment fields

## Next Steps
1. Implement authentication system
2. Create data access layer
3. Build audit logging system
4. Develop portal UI components
5. Add AI integration hooks
