'use server';

import { Invoice } from '@/shared/types/types';

export async function sendOverdueNotification(invoice: Invoice, daysOverdue: number): Promise<void> {
  try {
    console.log(`� In-app notification: Invoice #${invoice.invoiceNumber} is ${daysOverdue} days overdue`);
    // Email sending disabled - notifications are handled through dashboard alerts
    return;
  } catch (error) {
    console.error('Failed to process overdue notification:', error);
  }
}

export async function sendUpcomingPaymentNotification(invoice: Invoice, daysToDue: number): Promise<void> {
  try {
    console.log(`� In-app notification: Invoice #${invoice.invoiceNumber} due ${daysToDue === 1 ? 'tomorrow' : `in ${daysToDue} days`}`);
    // Email sending disabled - notifications are handled through dashboard alerts
    return;
  } catch (error) {
    console.error('Failed to process upcoming payment notification:', error);
  }
}

export async function sendPaymentConfirmation(invoice: Invoice): Promise<void> {
  try {
    console.log(`� In-app notification: Payment confirmed for Invoice #${invoice.invoiceNumber}`);
    // Email sending disabled - notifications are handled through dashboard alerts
    return;
  } catch (error) {
    console.error('Failed to process payment confirmation:', error);
  }
}
