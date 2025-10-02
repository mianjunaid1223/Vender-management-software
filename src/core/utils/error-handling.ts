// Common error handling utilities for API routes
import { NextResponse } from 'next/server';
import { createAuditLog } from '@/core/services/audit';

export type ErrorContext = {
  userId?: string;
  userRole?: string;
  vendorId?: string;
  companyId?: string;
  action?: string;
  resource?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
};

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

export function getErrorCode(error: unknown): string {
  if (error instanceof APIError && error.code) {
    return error.code;
  }
  if (error instanceof Error) {
    return error.name;
  }
  return 'UNKNOWN_ERROR';
}

export async function handleAPIError(
  error: unknown,
  context: ErrorContext = {},
  logToAudit: boolean = true
): Promise<NextResponse> {
  const errorMessage = getErrorMessage(error);
  const errorCode = getErrorCode(error);
  
  // Log to console with context
  console.error('API Error:', {
    message: errorMessage,
    code: errorCode,
    context,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });

  // Determine status code
  let statusCode = 500;
  if (error instanceof APIError) {
    statusCode = error.statusCode;
  } else if (errorMessage.includes('Unauthorized')) {
    statusCode = 401;
  } else if (errorMessage.includes('Forbidden') || errorMessage.includes('permission')) {
    statusCode = 403;
  } else if (errorMessage.includes('not found')) {
    statusCode = 404;
  } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    statusCode = 400;
  }

  // Log to audit trail if context provided
  if (logToAudit && context.userId && context.companyId) {
    try {
      await createAuditLog({
        userId: context.userId,
        userRole: (context.userRole as any) || 'unknown',
        vendorId: context.vendorId,
        companyId: context.companyId,
        action: 'error' as any,
        resource: context.resource || 'api',
        resourceId: 'error',
        newValues: {
          error: errorMessage,
          code: errorCode,
          statusCode
        },
        ipAddress: context.ipAddress || 'unknown',
        userAgent: context.userAgent || 'unknown',
        sessionId: context.sessionId || 'unknown',
        metadata: {
          errorDetails: error instanceof APIError ? error.details : undefined
        }
      });
    } catch (auditError) {
      console.error('Failed to log error to audit trail:', auditError);
    }
  }

  // Return appropriate error response
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return NextResponse.json(
    {
      error: errorMessage,
      code: errorCode,
      ...(isDevelopment && { 
        stack: error instanceof Error ? error.stack : undefined,
        details: error instanceof APIError ? error.details : undefined
      })
    },
    { status: statusCode }
  );
}

export function createErrorHandler(defaultContext: Partial<ErrorContext> = {}) {
  return (error: unknown, additionalContext: Partial<ErrorContext> = {}) => {
    return handleAPIError(error, { ...defaultContext, ...additionalContext });
  };
}

// Common validation errors
export const ValidationErrors = {
  REQUIRED_FIELD: (field: string) => new APIError(`${field} is required`, 400, 'REQUIRED_FIELD'),
  INVALID_FORMAT: (field: string) => new APIError(`${field} has invalid format`, 400, 'INVALID_FORMAT'),
  TOO_LONG: (field: string, max: number) => new APIError(`${field} exceeds maximum length of ${max}`, 400, 'TOO_LONG'),
  TOO_LARGE: (field: string, max: string) => new APIError(`${field} exceeds maximum size of ${max}`, 400, 'TOO_LARGE'),
  INVALID_RANGE: (field: string, min: number, max: number) => new APIError(`${field} must be between ${min} and ${max}`, 400, 'INVALID_RANGE'),
  UNAUTHORIZED: () => new APIError('Unauthorized access', 401, 'UNAUTHORIZED'),
  FORBIDDEN: (action?: string) => new APIError(`Forbidden: ${action || 'Access denied'}`, 403, 'FORBIDDEN'),
  NOT_FOUND: (resource?: string) => new APIError(`${resource || 'Resource'} not found`, 404, 'NOT_FOUND'),
  DUPLICATE: (field: string) => new APIError(`${field} already exists`, 409, 'DUPLICATE'),
  RATE_LIMITED: () => new APIError('Too many requests', 429, 'RATE_LIMITED')
} as const;