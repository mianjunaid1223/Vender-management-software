import { getDb } from '@/lib/database/queries';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const db = await getDb();
    
    // Create test invoices with overdue dates
    const overdueInvoices = [
      {
        invoiceNumber: "INV-2025-001",
        invoiceDate: "2025-06-01",
        invoiceDueDate: "2025-06-30", // 11 days overdue
        seller: {
          name: "Your Company Inc.",
          address: {
            street: "100 Business St",
            city: "San Francisco",
            state: "CA",
            zipCode: "94105",
            country: "US"
          },
          email: "billing@yourcompany.com",
          phone: "555-123-4567",
          taxId: "12-3456789"
        },
        buyer: {
          name: "TechCorp Solutions",
          address: {
            street: "456 Innovation Ave",
            city: "New York",
            state: "NY",
            zipCode: "10001",
            country: "US"
          },
          email: "contact@techcorp.com",
          phone: "234-567-8901",
          taxId: "98-7654321",
          contactPerson: "Alice Johnson"
        },
        items: [
          {
            id: "item-1",
            description: "Software Development Services - June 2025",
            quantity: 1,
            unitPrice: 3500,
            total: 3500
          }
        ],
        subtotal: 3500,
        taxes: 315,
        discounts: 0,
        totalAmount: 3815,
        invoiceAmount: 3815,
        status: "Unpaid",
        paymentStatus: "Pending",
        paymentTerms: "Net 30",
        paymentMethod: "Bank Transfer",
        vendorId: "VEN-002",
        vendorName: "TechCorp Solutions",
        contractId: "CON-002",
        createdAt: "2025-06-01T10:00:00Z",
        updatedAt: "2025-06-01T10:00:00Z",
        createdBy: "user-1"
      },
      {
        invoiceNumber: "INV-2025-002", 
        invoiceDate: "2025-05-15",
        invoiceDueDate: "2025-06-15", // 26 days overdue
        seller: {
          name: "Your Company Inc.",
          address: {
            street: "100 Business St",
            city: "San Francisco", 
            state: "CA",
            zipCode: "94105",
            country: "US"
          },
          email: "billing@yourcompany.com",
          phone: "555-123-4567",
          taxId: "12-3456789"
        },
        buyer: {
          name: "Design Studio Pro",
          address: {
            street: "789 Creative Blvd",
            city: "Los Angeles",
            state: "CA", 
            zipCode: "90210",
            country: "US"
          },
          email: "billing@designstudio.com",
          phone: "345-678-9012",
          taxId: "11-2233445",
          contactPerson: "Bob Wilson"
        },
        items: [
          {
            id: "item-1",
            description: "UI/UX Design Services - May 2025",
            quantity: 1,
            unitPrice: 2800,
            total: 2800
          }
        ],
        subtotal: 2800,
        taxes: 252,
        discounts: 0,
        totalAmount: 3052,
        invoiceAmount: 3052,
        status: "Unpaid",
        paymentStatus: "Pending", 
        paymentTerms: "Net 30",
        paymentMethod: "Credit Card",
        vendorId: "VEN-003",
        vendorName: "Design Studio Pro",
        contractId: "CON-003",
        createdAt: "2025-05-15T10:00:00Z",
        updatedAt: "2025-05-15T10:00:00Z",
        createdBy: "user-1"
      },
      {
        invoiceNumber: "INV-2025-003",
        invoiceDate: "2025-07-05", 
        invoiceDueDate: "2025-07-10", // 1 day overdue
        seller: {
          name: "Your Company Inc.",
          address: {
            street: "100 Business St",
            city: "San Francisco",
            state: "CA",
            zipCode: "94105", 
            country: "US"
          },
          email: "billing@yourcompany.com",
          phone: "555-123-4567",
          taxId: "12-3456789"
        },
        buyer: {
          name: "StartupXYZ",
          address: {
            street: "321 Startup Lane",
            city: "Austin",
            state: "TX",
            zipCode: "78701",
            country: "US"
          },
          email: "finance@startupxyz.com",
          phone: "456-789-0123",
          taxId: "55-6677889",
          contactPerson: "Carol Davis"
        },
        items: [
          {
            id: "item-1",
            description: "Consulting Services - July 2025",
            quantity: 1,
            unitPrice: 1500,
            total: 1500
          }
        ],
        subtotal: 1500,
        taxes: 135,
        discounts: 0,
        totalAmount: 1635,
        invoiceAmount: 1635,
        status: "Unpaid",
        paymentStatus: "Pending",
        paymentTerms: "Net 30",
        paymentMethod: "Bank Transfer",
        vendorId: "VEN-004", 
        vendorName: "StartupXYZ",
        contractId: "CON-004",
        createdAt: "2025-07-05T10:00:00Z",
        updatedAt: "2025-07-05T10:00:00Z",
        createdBy: "user-1"
      }
    ];

    const result = await db.collection('invoices').insertMany(overdueInvoices);
    
    return NextResponse.json({
      success: true,
      insertedCount: result.insertedCount,
      message: `Successfully inserted ${result.insertedCount} overdue invoices`
    });
    
  } catch (error) {
    console.error('Error adding overdue invoices:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
