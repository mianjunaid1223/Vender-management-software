# Authentication Module

This directory contains all authentication-related utilities:

- `index.ts` - Main authentication functions
- `session.ts` - Session management utilities
- `vendor-auth.ts` - Vendor-specific authentication middleware
- `encryption.ts` - Encryption and security utilities

## Usage

```typescript
import { getSession } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/auth/encryption';
```
