# Project Restructuring Plan - SMB Focus

## Overview
Restructuring the Vendor Management Platform from enterprise-grade to SMB-focused architecture, maintaining simplicity while keeping core features robust.

## Current Structure Analysis
✅ **What's Working:**
- Feature-based organization (vendors, invoices, contracts)
- Separation of core, features, and shared code
- TypeScript type safety
- Clear separation of admin and vendor portal

❌ **What Needs Improvement:**
- Over-complex folder nesting
- Empty/unused component files
- Inconsistent import paths
- Mix of enterprise patterns with SMB needs
- Some files in wrong locations

## Target Structure

```
vmp/
├── src/
│   ├── app/                          # Next.js 14 App Router
│   │   ├── (auth)/                   # Public auth pages
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── dashboard/                # Protected business dashboard
│   │   │   ├── page.tsx              # Dashboard home
│   │   │   ├── layout.tsx            # Dashboard layout
│   │   │   ├── vendors/              # Vendor management
│   │   │   ├── invoices/             # Invoice management
│   │   │   ├── contracts/            # Contract management
│   │   │   ├── analytics/            # Reports & analytics
│   │   │   ├── settings/             # Account settings
│   │   │   └── profile/              # User profile
│   │   ├── vendor-portal/            # Vendor self-service portal
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   └── invoices/
│   │   ├── api/                      # API routes
│   │   │   ├── auth/                 # Authentication APIs
│   │   │   ├── vendors/              # Vendor APIs
│   │   │   ├── invoices/             # Invoice APIs
│   │   │   ├── contracts/            # Contract APIs
│   │   │   └── vendor-portal/        # Portal APIs
│   │   ├── globals.css
│   │   └── layout.tsx
│   │
│   ├── core/                         # Core system functionality
│   │   ├── auth/                     # Authentication & authorization
│   │   │   ├── auth.ts               # Main auth logic
│   │   │   ├── vendor-auth.ts        # Vendor portal auth
│   │   │   ├── permissions.ts        # Permission system
│   │   │   └── session.ts            # Session management
│   │   ├── database/                 # Database layer
│   │   │   ├── mongodb.ts            # MongoDB connection
│   │   │   ├── queries.ts            # Common queries
│   │   │   └── models.ts             # Data models
│   │   ├── services/                 # Business services
│   │   │   ├── email.ts              # Email service
│   │   │   ├── pdf.ts                # PDF generation
│   │   │   ├── audit.ts              # Audit logging
│   │   │   └── notifications.ts      # Notifications
│   │   └── utils/                    # Core utilities
│   │       ├── validation.ts         # Input validation
│   │       ├── formatting.ts         # Data formatting
│   │       ├── date.ts               # Date utilities
│   │       └── helpers.ts            # General helpers
│   │
│   ├── features/                     # Feature modules
│   │   ├── vendors/                  # Vendor management
│   │   │   ├── components/           # UI components
│   │   │   ├── hooks/                # Custom hooks
│   │   │   ├── lib/                  # Business logic
│   │   │   └── types.ts              # Feature types
│   │   ├── invoices/                 # Invoice management
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── types.ts
│   │   ├── contracts/                # Contract management
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── types.ts
│   │   ├── dashboard/                # Dashboard feature
│   │   │   ├── components/
│   │   │   └── lib/
│   │   └── vendor-portal/            # Vendor portal feature
│   │       ├── components/
│   │       ├── hooks/
│   │       └── lib/
│   │
│   ├── shared/                       # Shared resources
│   │   ├── components/               # Shared UI components
│   │   │   ├── ui/                   # Base UI (shadcn)
│   │   │   ├── forms/                # Form components
│   │   │   ├── layout/               # Layout components
│   │   │   └── feedback/             # Loading, errors, etc
│   │   ├── hooks/                    # Shared hooks
│   │   │   ├── use-toast.ts
│   │   │   ├── use-session.ts
│   │   │   └── use-api.ts
│   │   ├── lib/                      # Shared utilities
│   │   │   ├── api-client.ts         # API client
│   │   │   ├── constants.ts          # Constants
│   │   │   └── utils.ts              # Utilities
│   │   └── types/                    # Shared TypeScript types
│   │       ├── database-schema.ts    # DB schema types
│   │       ├── api.ts                # API types
│   │       └── common.ts             # Common types
│   │
│   ├── config/                       # Configuration
│   │   ├── site.ts                   # Site config
│   │   ├── navigation.ts             # Nav config
│   │   └── features.ts               # Feature flags
│   │
│   └── ai/                           # AI features (optional)
│       ├── genkit.ts                 # AI setup
│       └── flows/                    # AI flows
│
├── docs/                             # Documentation
│   ├── USER_GUIDE.md
│   ├── API.md
│   ├── DATABASE_SCHEMA_DESIGN.md
│   ├── DEVELOPMENT.md
│   └── DEPLOYMENT.md
│
├── scripts/                          # Utility scripts
│   ├── setup-db.ts
│   ├── seed-data.ts
│   └── migrate.ts
│
├── public/                           # Static assets
│   ├── images/
│   └── fonts/
│
├── .env.example                      # Environment template
├── .gitignore
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Key Principles

### 1. Simplicity First
- Flat structure where possible
- Clear naming conventions
- No over-engineering
- Practical patterns

### 2. Feature Organization
- Each feature is self-contained
- Components live with features
- Shared code in `/shared`
- Core systems in `/core`

### 3. Type Safety
- Strong TypeScript throughout
- Clear type definitions
- No `any` types
- Proper interfaces

### 4. Developer Experience
- Easy to navigate
- Clear file purposes
- Logical grouping
- Quick to understand

## Migration Steps

### Phase 1: Core Structure ✅ (Completed)
- ✅ Created `/core` for auth, database, services
- ✅ Created `/features` for domain logic
- ✅ Created `/shared` for reusable code
- ✅ Moved UI components to `/shared/components/ui`

### Phase 2: Cleanup (Current)
- Remove empty component files
- Delete unused scripts
- Consolidate duplicate code
- Fix remaining type issues

### Phase 3: Documentation Update
- Update README for SMB focus
- Create simple user guides
- Document API clearly
- Add quick start guide

### Phase 4: Final Polish
- Run type checks
- Fix any remaining errors
- Optimize imports
- Clean up comments

## Files to Remove

### Empty/Unused Components
- `/src/features/vendor-portal/components/invoice-upload.tsx` (empty)
- `/src/features/vendor-portal/components/stat-card.tsx` (empty)
- `/src/features/vendor-portal/components/vendor-portal-error-handler.tsx` (empty)
- `/src/features/auth/components/auth-components.tsx` (placeholder)

### Duplicate/Legacy Files
- Check for duplicate type definitions
- Remove unused scripts in `/scripts`
- Clean up old migration scripts

## Import Path Standards

```typescript
// Core imports
import { getDb } from '@/core/database/mongodb';
import { getSession } from '@/core/auth/session';
import { sendEmail } from '@/core/services/email';

// Feature imports
import { VendorList } from '@/features/vendors/components/vendor-list';
import { getVendorData } from '@/features/vendors/lib/vendor-data';

// Shared imports
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import { formatCurrency } from '@/shared/lib/utils';

// Type imports
import type { Vendor } from '@/shared/types/database-schema';
```

## Success Criteria

✅ **Structure**
- Clear, logical folder organization
- No deeply nested folders (max 3 levels)
- Feature-based grouping
- Consistent naming

✅ **Code Quality**
- Zero TypeScript errors
- No unused imports
- Consistent formatting
- Clear comments

✅ **Performance**
- Fast page loads
- Optimized queries
- Efficient imports
- Small bundle size

✅ **Developer Experience**
- Easy to find files
- Clear file purposes
- Simple to add features
- Well documented

## Next Steps

1. **Complete cleanup** - Remove unused files
2. **Fix type errors** - Resolve remaining 11 errors
3. **Update imports** - Ensure consistency
4. **Run tests** - Verify everything works
5. **Document changes** - Update guides

---

*Focusing on simplicity and maintainability for SMB use case*