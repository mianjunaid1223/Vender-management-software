// Application-wide configuration constants
// These values can be overridden by environment variables where appropriate

export const FILE_UPLOAD = {
  MAX_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
  ALLOWED_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png'
  ],
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'public/uploads'
} as const;

export const SESSION = {
  VENDOR_TIMEOUT: parseInt(process.env.VENDOR_SESSION_TIMEOUT || '28800000'), // 8 hours default
  COMPANY_TIMEOUT: parseInt(process.env.COMPANY_SESSION_TIMEOUT || '28800000'), // 8 hours default
  REFRESH_THRESHOLD: parseInt(process.env.SESSION_REFRESH_THRESHOLD || '3600000') // 1 hour default
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: parseInt(process.env.DEFAULT_PAGE_LIMIT || '10'),
  MAX_LIMIT: parseInt(process.env.MAX_PAGE_LIMIT || '100'),
  AUDIT_LOG_LIMIT: parseInt(process.env.AUDIT_LOG_LIMIT || '100'),
  AUDIT_LOG_MAX_LIMIT: parseInt(process.env.AUDIT_LOG_MAX_LIMIT || '1000')
} as const;

export const VALIDATION = {
  INVOICE_NUMBER_MAX_LENGTH: parseInt(process.env.INVOICE_NUMBER_MAX_LENGTH || '100'),
  DESCRIPTION_MAX_LENGTH: parseInt(process.env.DESCRIPTION_MAX_LENGTH || '1000'),
  MAX_AMOUNT: parseFloat(process.env.MAX_INVOICE_AMOUNT || '999999999.99'),
  PASSWORD_MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
  PASSWORD_SALT_ROUNDS: parseInt(process.env.PASSWORD_SALT_ROUNDS || '12')
} as const;

export const SECURITY = {
  JWT_EXPIRY: process.env.JWT_EXPIRY || '8h',
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
  LOCKOUT_DURATION: parseInt(process.env.LOCKOUT_DURATION || '900000') // 15 minutes default
} as const;

export const EMAIL = {
  FROM_ADDRESS: process.env.EMAIL_FROM || 'noreply@vendormanagement.com',
  RESEND_API_URL: 'https://api.resend.com/emails',
  SMTP_TIMEOUT: parseInt(process.env.SMTP_TIMEOUT || '10000') // 10 seconds default
} as const;

export const DATABASE = {
  CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'), // 30 seconds
  OPERATION_TIMEOUT: parseInt(process.env.DB_OPERATION_TIMEOUT || '15000'), // 15 seconds
  MAX_POOL_SIZE: parseInt(process.env.DB_MAX_POOL_SIZE || '10')
} as const;