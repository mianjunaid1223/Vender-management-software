# Quick Reference Guide - Vendor Management Platform

## Project Overview
**Type:** Next.js 14 + TypeScript + MongoDB  
**Target Market:** Freelancers & SMBs ($20-$65/month)  
**Status:** ✅ Phase 1 & 2 Complete - Zero TypeScript Errors

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run type check
npm run typecheck

# Start production server
npm start
```

---

## Folder Structure Quick Reference

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Public pages (login, signup)
│   ├── dashboard/         # Protected dashboard
│   ├── vendor-portal/     # Vendor portal
│   └── api/               # API routes
│
├── core/                   # Core system (auth, db, services)
├── features/              # Business features (vendors, invoices, etc.)
├── shared/                # Shared code (components, hooks, types)
└── config/                # Configuration files
```

---

## Import Path Patterns

```typescript
// Core
import { getDb } from '@/core/database/mongodb';
import { getSession } from '@/core/auth/session';

// Features
import { VendorList } from '@/features/vendors/components/vendor-list';

// Shared
import { Button } from '@/shared/components/ui/button';
import type { Vendor } from '@/shared/types/database-schema';
```

---

## Adding a New Feature

1. **Create feature directory:**
   ```
   src/features/my-feature/
   ├── components/    # UI components
   ├── lib/          # Business logic
   ├── hooks/        # Custom hooks (optional)
   └── types.ts      # Feature-specific types
   ```

2. **Add API routes:**
   ```
   src/app/api/my-feature/
   └── route.ts
   ```

3. **Add pages:**
   ```
   src/app/dashboard/my-feature/
   └── page.tsx
   ```

---

## Database Collections

1. **companies** - Company accounts
2. **users** - Company users
3. **vendors** - Vendor information
4. **vendor_users** - Vendor portal users
5. **invoices** - Invoices
6. **contracts** - Contracts
7. **notifications** - Notifications
8. **audit_logs** - Audit trail
9. **sessions** - User sessions
10. **vendor_pending_changes** - Change requests
11. **compliance_documents** - Compliance docs
12. **data_sync_queue** - Sync operations
13. **vendor_portal_access** - Access control

---

## Common Tasks

### Add a New UI Component
```typescript
// src/features/my-feature/components/my-component.tsx
'use client';

import { Button } from '@/shared/components/ui/button';

export function MyComponent() {
  return <Button>Click me</Button>;
}
```

### Add a New API Route
```typescript
// src/app/api/my-route/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '@/core/database/mongodb';

export async function GET() {
  const db = await getDb();
  const data = await db.collection('my-collection').find().toArray();
  return NextResponse.json(data);
}
```

### Add a New Page
```typescript
// src/app/dashboard/my-page/page.tsx
import { PageHeader } from '@/shared/components/page-header';

export default function MyPage() {
  return (
    <div>
      <PageHeader title="My Page" description="Description" />
      {/* Content */}
    </div>
  );
}
```

---

## Authentication Flow

### Company Users
- Login: `/login`
- Dashboard: `/dashboard`
- Auth check: `src/core/auth/auth.ts`

### Vendor Portal Users
- Login: `/vendor-portal/login`
- Dashboard: `/vendor-portal/dashboard`
- Auth check: `src/core/auth/vendor-auth.ts`

---

## Environment Variables

```env
# Database
MONGODB_URI=mongodb://...

# Auth
AUTH_SECRET=your-secret-key
SESSION_SECRET=your-session-secret

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=password

# AWS S3 (optional)
AWS_REGION=us-east-1
AWS_S3_BUCKET=bucket-name
AWS_ACCESS_KEY_ID=key
AWS_SECRET_ACCESS_KEY=secret

# Google AI (optional)
GOOGLE_GENAI_API_KEY=your-api-key
```

---

## Useful Commands

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Format code
npm run format

# Lint code
npm run lint

# Find files
find src -name "*.tsx"

# Count files
find src -name "*.ts" -o -name "*.tsx" | wc -l

# Search in code
grep -r "searchTerm" src/
```

---

## Documentation

- **README.md** - Main project documentation
- **docs/DATABASE_SCHEMA_DESIGN.md** - Database schema
- **docs/RESTRUCTURING_PLAN.md** - Restructuring details
- **docs/PHASE_2_COMPLETION.md** - Completion report

---

## Project Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Project restructuring |
| Phase 2 | ✅ Complete | Cleanup & type fixes |
| Phase 3 | 🔄 Next | Authentication enhancement |
| Phase 4+ | 📋 Planned | Feature development |

---

## Key Principles

1. **Simplicity First** - Don't over-engineer
2. **Feature-Based** - Group by business feature
3. **Type Safety** - Strong TypeScript types
4. **SMB Focus** - Target small businesses, not enterprises
5. **Clean Code** - Easy to understand and maintain

---

## Common Patterns

### Server Action
```typescript
'use server';

export async function myAction(data: MyData) {
  const db = await getDb();
  // ... logic
  return result;
}
```

### Client Component with State
```typescript
'use client';

import { useState } from 'react';

export function MyComponent() {
  const [value, setValue] = useState('');
  // ... logic
}
```

### API Route with Auth
```typescript
import { getSession } from '@/core/auth/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... logic
}
```

---

## Getting Help

1. Check documentation in `/docs`
2. Review similar features in `/src/features`
3. Look at existing components in `/src/shared/components`
4. Check type definitions in `/src/shared/types`

---

**Last Updated:** January 2025  
**Version:** 2.0  
**Status:** Production Ready (Phase 1 & 2)
