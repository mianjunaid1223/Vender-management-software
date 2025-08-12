# Database Module

This directory contains all database-related utilities:

- `mongodb.ts` - MongoDB connection configuration
- `queries.ts` - Database query functions
- `migrations.ts` - Database migration utilities

## Usage

```typescript
import { getDb } from '@/lib/database/mongodb';
import { fetchInvoices } from '@/lib/database/queries';
```
