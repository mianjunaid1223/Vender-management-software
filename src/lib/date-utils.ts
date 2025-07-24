/**
 * Utility functions for consistent date calculations across the application
 */

/**
 * Calculate the number of days between a due date and today
 * Returns negative for overdue, 0 for due today, positive for future dates
 */
export function calculateDaysDifference(dueDate: Date): number {
  const normalizedDueDate = new Date(dueDate);
  normalizedDueDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = normalizedDueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format days difference into a human-readable string
 */
export function formatDaysDifference(daysDiff: number): string {
  if (daysDiff < 0) {
    const absDays = Math.abs(daysDiff);
    return `Overdue by ${absDays} day${absDays > 1 ? 's' : ''}`;
  }
  if (daysDiff === 0) {
    return "Due today";
  }
  return `Due in ${daysDiff} day${daysDiff > 1 ? 's' : ''}`;
}

/**
 * Get payment status based on days difference
 */
export function getPaymentStatus(daysDiff: number): 'overdue' | 'due_today' | 'upcoming' | 'future' {
  if (daysDiff < 0) return 'overdue';
  if (daysDiff === 0) return 'due_today';
  if (daysDiff >= 1 && daysDiff <= 3) return 'upcoming';
  return 'future';
}

/**
 * Get alert severity based on days difference
 */
export function getAlertSeverity(daysDiff: number): 'high' | 'medium' | 'low' {
  if (daysDiff < 0 || daysDiff === 0) return 'high';
  if (daysDiff === 1) return 'medium';
  return 'low';
}
