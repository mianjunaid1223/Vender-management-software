# Vendor Application Submission Logic Improvements

## Problem
The vendor application submission was failing with a generic error "Application already exists for this vendor/email and company" without considering:

1. **Status of existing applications** - The system blocked new applications even if previous ones were rejected/expired
2. **Target company context** - Different companies should allow separate applications  
3. **Invite status handling** - Expired invites prevented valid applications when no active applications existed
4. **Error message clarity** - Generic errors didn't provide context about the actual issue

## Solution

### 1. Improved Application Validation Logic

**Before:**
```typescript
// Blocked ANY existing application regardless of status
const existingApplication = await db.collection('vendorApplications').findOne({
  $or: [
    { email, targetCompanyId: companyId },
    { vendorName, targetCompanyId: companyId }
  ]
});
```

**After:**
```typescript
// Only block ACTIVE applications (pending/approved)
const existingApplication = await db.collection('vendorApplications').findOne({
  $or: [
    { email, targetCompanyId: companyId },
    { vendorName, targetCompanyId: companyId }
  ],
  status: { $in: ['pending', 'approved'] } // Only block if there's an active application
});
```

### 2. Enhanced Error Messages

**Before:**
- Generic: "Application already exists for this vendor/email and company"

**After:**
- Context-aware messages that include company name and application status
- Additional application details in the response for debugging
- Specific messages for different scenarios:
  - `"A pending application already exists for this vendor/email and company (Company Name)"`
  - `"An approved vendor already exists for this email and company (Company Name)"`

### 3. Flexible Invite Handling

**Before:**
```typescript
// Rejected ANY non-active invite
validInvite = await db.collection('vendorInvites').findOne({ 
  _id: new ObjectId(inviteId),
  status: 'active' 
});
```

**After:**
```typescript
// Allow expired invites if they haven't been used and no active applications exist
validInvite = await db.collection('vendorInvites').findOne({ 
  _id: new ObjectId(inviteId)
});

// Additional validation for expired/used invites
if (validInvite.status !== 'active') {
  if (validInvite.used) {
    return NextResponse.json({ 
      error: 'Invitation has already been used' 
    }, { status: 400 });
  }
}
```

### 4. Consistent Status Endpoint

Updated `/api/vendor/status` to match the application logic:
- Only blocks for active applications (pending/approved)
- Provides context about previous rejected applications
- Allows resubmission after rejection

## Valid Scenarios Now Supported

1. **Resubmission after rejection** - Vendors can submit new applications if previous ones were rejected
2. **Multiple company applications** - Same vendor/email can apply to different companies
3. **Expired invite recovery** - Vendors can submit applications with expired (but unused) invites if no active applications exist
4. **Better error context** - Clear messages indicating why an application was blocked

## Example Data Handling

Given your sample data:
- Invite 1: `status: "active", used: false` - ✅ Can submit application
- Invite 2: `status: "expired", used: false` - ✅ Can submit application (if no active applications exist)
- Same email for different `companyId` - ✅ Allowed separate applications

## Testing

Created test script: `test-vendor-application-logic.js` to validate:
1. New applications are accepted
2. Duplicate applications for same company are rejected appropriately  
3. Applications for different companies are accepted
4. Error messages include proper context

## API Response Improvements

**Enhanced error responses now include:**
```json
{
  "error": "A pending application already exists for this vendor/email and company (Zstronics)",
  "existingApplication": {
    "applicationId": "VA-ABC123",
    "status": "pending", 
    "submittedAt": "2025-08-09T16:11:43.288Z",
    "companyName": "Zstronics"
  }
}
```

This provides clear context for both users and developers about why the application was blocked and what existing application caused the conflict.
