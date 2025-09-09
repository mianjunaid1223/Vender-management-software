# Vendor Self-Service Portal Implementation Guide

## Overview
This guide provides step-by-step instructions to implement the vendor self-service portal in your existing VMS system.

## Prerequisites
- Node.js 18+ and npm/yarn
- MongoDB Atlas connection
- Existing VMS system running

## Installation Steps

### 1. Install Additional Dependencies

```bash
npm install bcryptjs @types/bcryptjs
```

### 2. Environment Variables

Add the following to your `.env` file:

```env
# Vendor Portal Authentication
VENDOR_AUTH_SECRET=your-vendor-specific-jwt-secret-here
AUTH_SECRET=your-existing-auth-secret

# Enable vendor portal features
VENDOR_PORTAL_ENABLED=true
```

### 3. Database Schema Enhancement

Run the schema enhancement script to create new collections and indexes:

```bash
npm run schema:enhance
```

This script creates:
- `vendor_portal_access` - Portal access management
- `vendor_users` - Vendor user accounts
- `vendor_sessions` - Vendor authentication sessions
- `audit_logs` - Immutable audit trail
- `data_sync_queue` - Bidirectional data synchronization
- `compliance_documents` - Document management
- `portal_notifications` - Vendor notifications

### 4. Update Package.json Scripts

Add this script to your `package.json`:

```json
{
  "scripts": {
    "schema:enhance": "tsx src/scripts/enhance-vendor-portal-schema.ts"
  }
}
```

### 5. Create First Vendor Portal Access

Use the admin API to enable portal access for a vendor:

```bash
# Example: Enable portal access for vendor
curl -X POST http://localhost:9002/api/admin/vendor-portal-access \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "vendorId": "VENDOR_ID_HERE",
    "features": [
      "view_invoices",
      "upload_invoices", 
      "edit_profile",
      "view_contracts",
      "upload_compliance"
    ],
    "mfaRequired": false,
    "sessionTimeout": 480
  }'
```

### 6. Create Vendor User Account

Insert a vendor user document into the `vendor_users` collection:

```javascript
// MongoDB shell or script
db.vendor_users.insertOne({
  vendorId: "VENDOR_ID_HERE",
  companyId: "COMPANY_ID_HERE", 
  name: "Vendor Admin User",
  email: "admin@vendorcompany.com",
  role: "vendor_admin",
  permissions: [
    {
      resource: "invoices",
      actions: ["create", "read", "update"],
      scope: "vendor"
    },
    {
      resource: "profile", 
      actions: ["read", "update"],
      scope: "own"
    },
    {
      resource: "contracts",
      actions: ["read"],
      scope: "vendor"
    }
  ],
  isActive: true,
  lastLoginAt: null,
  mfaEnabled: false,
  passwordHash: "$2a$12$HASHED_PASSWORD_HERE", // Use bcrypt to hash
  emailVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: "system"
});
```

## Portal URLs

Once implemented, the vendor portal will be available at:

- **Login**: `http://localhost:9002/vendor-portal/login`
- **Dashboard**: `http://localhost:9002/vendor-portal/dashboard`
- **Invoices**: `http://localhost:9002/vendor-portal/invoices`
- **Contracts**: `http://localhost:9002/vendor-portal/contracts`
- **Profile**: `http://localhost:9002/vendor-portal/profile`

## Security Features

### Authentication
- JWT-based session management
- Separate session tokens for vendor users
- Configurable session timeouts
- Account lockout after failed attempts

### Authorization
- Role-based access control (vendor_admin, vendor_user)
- Feature-based permissions
- Resource-level access control
- Vendor data isolation

### Audit Logging
- Immutable audit trail for all actions
- IP address and user agent tracking
- Detailed action logging
- Security event monitoring

### Data Protection
- Vendor-scoped data access
- Company data authority precedence
- Encrypted session storage
- Secure password hashing

## API Endpoints

### Vendor Portal APIs
- `GET /api/vendor-portal/invoices` - List vendor invoices
- `GET /api/vendor-portal/invoices/[id]` - Get specific invoice
- `PATCH /api/vendor-portal/invoices/[id]` - Update invoice status
- `GET /api/vendor-portal/contracts` - List vendor contracts
- `POST /api/vendor-portal/contracts/[id]/acknowledge` - Acknowledge contract
- `GET /api/vendor-portal/profile` - Get vendor profile
- `PATCH /api/vendor-portal/profile` - Update vendor profile
- `POST /api/vendor-portal/auth/login` - Vendor login
- `POST /api/vendor-portal/auth/logout` - Vendor logout

### Admin APIs
- `POST /api/admin/vendor-portal-access` - Enable portal access
- `DELETE /api/admin/vendor-portal-access` - Disable portal access
- `GET /api/admin/audit-logs` - View audit logs

## Data Synchronization

The system includes bidirectional data sync between company and vendor portals:

1. **Vendor Updates**: Queued for company approval
2. **Company Changes**: Automatically synced to vendor view
3. **Conflict Resolution**: Company data takes precedence
4. **Audit Trail**: All changes tracked and logged

## AI Integration Hooks

The system is designed to support future AI features:

- **AI Context**: Structured data for AI analysis
- **Recommendation Engine**: Framework for AI suggestions
- **Risk Assessment**: Vendor risk scoring capabilities
- **Performance Analytics**: AI-driven vendor metrics

## Monitoring and Analytics

### Audit Dashboard
- Real-time activity monitoring
- Security event tracking
- User behavior analytics
- Resource access patterns

### Performance Metrics
- Session duration tracking
- Feature usage statistics
- Error rate monitoring
- Response time analytics

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Check VENDOR_AUTH_SECRET environment variable
   - Verify vendor user account exists and is active
   - Confirm portal access is enabled for vendor

2. **Database Connection Issues**
   - Ensure MongoDB connection string is correct
   - Verify new collections were created successfully
   - Check database permissions

3. **Authorization Errors**
   - Verify vendor permissions are correctly set
   - Check vendor-company relationship
   - Confirm feature access is enabled

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=vendor-portal:*
NODE_ENV=development
```

## Production Deployment

### Security Checklist
- [ ] Generate strong JWT secrets
- [ ] Enable HTTPS in production
- [ ] Configure rate limiting
- [ ] Set up monitoring alerts
- [ ] Review audit log retention
- [ ] Enable MFA for sensitive vendors
- [ ] Configure IP whitelisting if needed

### Performance Optimization
- [ ] Set up database connection pooling
- [ ] Enable response caching where appropriate
- [ ] Configure CDN for static assets
- [ ] Monitor database query performance
- [ ] Set up application performance monitoring

## Support

For technical support or questions:
1. Check the audit logs for error details
2. Review the middleware configuration
3. Verify database schema and indexes
4. Test API endpoints with proper authentication
5. Monitor application logs for errors
