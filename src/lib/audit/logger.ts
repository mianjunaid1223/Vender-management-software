export const auditLogger = {
  // Minimal queryLogs implementation used by the API. Returns empty array by default.
  async queryLogs(_filters: any) {
    // Implementers can extend this to query a database. Keep return shape stable for typing.
    return [] as Array<{
      _id?: string;
      entityType?: string;
      entityId?: string;
      action?: string;
      timestamp?: string | number | Date;
      userEmail?: string;
      userType?: string;
      metadata?: any;
    }>;
  }
};
