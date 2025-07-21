
'use server';

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, createInvoice, updateInvoice, deleteInvoice, updateInvoiceStatus, createCompany, updateCompany, createOrUpdateCompany } from "@/lib/data";
import { sendPaymentConfirmation } from '@/lib/email-notifications';
import { createSession, deleteSession, requireAuth } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { Invoice, Company } from "@/lib/types";
import bcrypt from 'bcryptjs';

const invoiceFormSchema = z.object({
  vendorName: z.string().min(1, "Vendor name is required."),
  invoiceAmount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
  invoiceDueDate: z.string().min(1, "Due date is required."),
  invoiceNumber: z.string().min(1, "Invoice number is required."),
  invoiceDate: z.string().min(1, "Invoice date is required."),
});

export async function addInvoice(values: z.infer<typeof invoiceFormSchema>) {
    try {
        const session = await requireAuth();
        const validatedData = invoiceFormSchema.parse(values);

        const newInvoice: Partial<Invoice> = {
            ...validatedData,
            businessId: session.businessId || session.userId,
            createdBy: session.userId,
            status: "Unpaid",
            paymentStatus: "Pending",
            subtotal: validatedData.invoiceAmount,
            totalAmount: validatedData.invoiceAmount,
            taxes: 0,
            discounts: 0,
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        const db = await getDb();
        if (!db) {
            return { success: false, message: "Database connection failed. Please check server configuration." };
        }
        await db.collection("invoices").insertOne(newInvoice);
        
        revalidatePath("/dashboard/invoices");
        return { success: true, message: "Invoice added successfully." };
    } catch (error) {
        console.error("Failed to add invoice:", error);
        if (error instanceof z.ZodError) {
             return { success: false, message: "Validation failed.", issues: error.flatten() };
        }
        return { success: false, message: "An unexpected error occurred." };
    }
}

const signupFormSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }).optional(),
});

export async function signupUser(values: z.infer<typeof signupFormSchema>) {
  const db = await getDb();
  if (!db) {
      return { success: false, message: "Database connection failed. Please check server configuration." };
  }
  
  try {
    const validatedData = signupFormSchema.parse(values);
    
    const usersCollection = db.collection("users");
    const companiesCollection = db.collection("companies");

    const existingUser = await usersCollection.findOne({ email: validatedData.email });
    if (existingUser) {
      return { success: false, message: "User with this email already exists." };
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    
    const { fullName, email, companyName } = validatedData;
    const userId = new ObjectId();
    const businessId = new ObjectId();
    
    // Create company first
    const companyData = {
      _id: businessId,
      name: companyName || `${fullName}'s Business`,
      businessType: 'Business',
      addresses: [],
      contacts: [],
      preferences: {
        defaultPaymentTerms: 'Net 30',
        defaultCurrency: 'USD',
        defaultTaxRate: 0,
        emailNotifications: true,
        invoiceReminders: true,
        contractReminders: true,
        preferredLanguage: 'en'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId.toString()
    };
    
    // Create user with business link
    const userData = { 
      _id: userId,
      name: fullName, 
      email, 
      password: hashedPassword,
      businessId: businessId.toString(),
      image: `https://placehold.co/100x100.png?text=${fullName.charAt(0)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Insert both in transaction
    await companiesCollection.insertOne(companyData);
    await usersCollection.insertOne(userData);
    
    // Create session
    await createSession(
      userId.toString(), 
      email, 
      fullName, 
      businessId.toString()
    );
    
  } catch (error) {
    console.error("Signup Error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: "Validation failed.", issues: error.flatten() };
    }
    return { success: false, message: "An unexpected error occurred during sign up." };
  }

  redirect("/dashboard");
}


const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export async function loginUser(values: z.infer<typeof loginFormSchema>) {
    const db = await getDb();
    if (!db) {
        return { success: false, message: "Database connection failed. Please check server configuration." };
    }
    
    try {
        const validatedData = loginFormSchema.parse(values);
        const usersCollection = db.collection("users");
        const user = await usersCollection.findOne({ email: validatedData.email });
        
        if (!user) {
          return { success: false, message: "Invalid email or password." };
        }
        
        // Check password
        const passwordMatch = await bcrypt.compare(validatedData.password, user.password);
        if (!passwordMatch) {
          return { success: false, message: "Invalid email or password." };
        }

        // Create session with business context
        await createSession(
          user._id.toString(),
          user.email,
          user.name,
          user.businessId
        );

    } catch (error) {
       console.error("Login Error:", error);
      if (error instanceof z.ZodError) {
        return { success: false, message: "Validation failed.", issues: error.flatten() };
      }
      return { success: false, message: "An unexpected error occurred during login." };
    }

    redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

export async function updateUserProfile(values: z.infer<typeof profileFormSchema>) {
    try {
        const session = await requireAuth();
        const validatedData = profileFormSchema.parse(values);
        const db = await getDb();
        if (!db) {
            return { success: false, message: "Database connection failed. Please check server configuration." };
        }
        
        await db.collection("users").updateOne(
            { _id: new ObjectId(session.userId) },
            { 
                $set: { 
                    name: validatedData.name,
                    updatedAt: new Date().toISOString()
                } 
            }
        );

        revalidatePath("/dashboard/profile");
        revalidatePath("/dashboard"); // To update user-nav
        return { success: true, message: "Profile updated successfully." };
    } catch (error) {
        console.error("Failed to update profile:", error);
        if (error instanceof z.ZodError) {
             return { success: false, message: "Validation failed.", issues: error.flatten() };
        }
        return { success: false, message: "An unexpected error occurred." };
    }
}

// Enhanced Invoice Management Actions
export async function createInvoiceAction(invoiceData: Partial<Invoice>) {
  try {
    const invoice = await createInvoice(invoiceData);
    
    revalidatePath('/dashboard/invoices');
    return { success: true, data: JSON.parse(JSON.stringify(invoice)) };
  } catch (error) {
    console.error('Failed to create invoice:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}

export async function updateInvoiceAction(id: string, invoiceData: Partial<Invoice>) {
  try {
    const invoice = await updateInvoice(id, invoiceData);
    
    revalidatePath('/dashboard/invoices');
    return { success: true, data: JSON.parse(JSON.stringify(invoice)) };
  } catch (error) {
    console.error('Failed to update invoice:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}

export async function deleteInvoiceAction(id: string) {
  try {
    await deleteInvoice(id);
    revalidatePath('/dashboard/invoices');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete invoice:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}

export async function updateInvoiceStatusAction(
  invoiceId: string, 
  newStatus: Invoice['status']
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: 'Database connection failed' };
  }

  try {
    const updateData: any = {
      status: newStatus,
      lastStatusUpdate: new Date(),
    };

    if (newStatus === 'Paid') {
      updateData.paidDate = new Date();
      updateData.paymentStatus = 'Paid';
    }

    const result = await db.collection('invoices').updateOne(
      { _id: new ObjectId(invoiceId) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return { success: false, error: 'Invoice not found or not updated' };
    }

    if (newStatus === 'Paid') {
      try {
        const invoice = await db.collection('invoices').findOne({ _id: new ObjectId(invoiceId) });
        if (invoice) {
          const { _id, ...invoiceData } = invoice;
          await sendPaymentConfirmation({ ...invoiceData, id: _id.toString() } as Invoice);
        }
      } catch (notificationError) {
        console.error('Failed to process payment confirmation notification:', notificationError);
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/invoices');

    return { success: true };

  } catch (error) {
    console.error('Error updating invoice status:', error);
    return { success: false, error: 'Failed to update invoice status' };
  }
}

export async function createOrUpdateCompanyAction(companyData: Partial<Company>) {
  try {
    const result = await createOrUpdateCompany(companyData);
    revalidatePath('/dashboard/company');
    revalidatePath('/dashboard');
    
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}

export async function bulkUpdateInvoiceStatusAction(
  invoiceIds: string[], 
  newStatus: Invoice['status']
): Promise<{ success: boolean; message: string; updated: number }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: 'Database connection failed', updated: 0 };
  }

  try {
    const objectIds = invoiceIds.map(id => new ObjectId(id));
    
    const updateData: any = {
      status: newStatus,
      lastStatusUpdate: new Date(),
    };

    if (newStatus === 'Paid') {
      updateData.paidDate = new Date();
      updateData.paymentStatus = 'Paid';
    }

    const result = await db.collection('invoices').updateMany(
      { _id: { $in: objectIds } },
      { $set: updateData }
    );

    if (newStatus === 'Paid' && result.modifiedCount > 0) {
      try {
        const invoices = await db.collection('invoices')
          .find({ _id: { $in: objectIds } })
          .toArray();
        
        for (const invoice of invoices) {
          const { _id, ...invoiceData } = invoice;
          await sendPaymentConfirmation({ ...invoiceData, id: _id.toString() } as Invoice);
        }
      } catch (notificationError) {
        console.error('Failed to process payment confirmation notifications:', notificationError);
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/invoices');

    return { 
      success: true, 
      message: `${result.modifiedCount} invoice(s) updated to ${newStatus}`, 
      updated: result.modifiedCount 
    };

  } catch (error) {
    console.error('Error bulk updating invoice status:', error);
    return { success: false, message: 'Failed to update invoice statuses', updated: 0 };
  }
}

export async function refreshInvoiceStatusesAction(): Promise<{ success: boolean; message: string }> {
  try {
    const { updateInvoiceStatuses } = await import('@/lib/invoice-status-manager');
    const result = await updateInvoiceStatuses();
    
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/invoices');
    
    return {
      success: true,
      message: `Status refresh complete. ${result.updated} invoices updated, ${result.alerts.length} alerts generated.`
    };
  } catch (error) {
    console.error('Error refreshing invoice statuses:', error);
    return { success: false, message: 'Failed to refresh invoice statuses' };
  }
}
