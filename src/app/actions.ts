
'use server';

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, createInvoice, updateInvoice, deleteInvoice, updateInvoiceStatus, createCompany, updateCompany, createOrUpdateCompany } from "@/lib/data";
import { sendPaymentConfirmation } from '@/lib/email-notifications';
import { ObjectId } from 'mongodb';
import { Invoice, Company } from "@/lib/types";

const invoiceFormSchema = z.object({
  vendorName: z.string().min(1, "Vendor name is required."),
  invoiceAmount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
  invoiceDueDate: z.string().min(1, "Due date is required."),
  invoiceNumber: z.string().min(1, "Invoice number is required."),
  invoiceDate: z.string().min(1, "Invoice date is required."),
});

export async function addInvoice(values: z.infer<typeof invoiceFormSchema>) {
    try {
        const validatedData = invoiceFormSchema.parse(values);

        const newInvoice: Partial<Invoice> = {
            ...validatedData,
            status: "Unpaid",
            paymentStatus: "Pending",
            subtotal: validatedData.invoiceAmount,
            totalAmount: validatedData.invoiceAmount,
            taxes: 0,
            discounts: 0,
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'user-1'
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
});

export async function signupUser(values: z.infer<typeof signupFormSchema>) {
  const db = await getDb();
  if (!db) {
      return { success: false, message: "Database connection failed. Please check server configuration." };
  }
  
  try {
    const validatedData = signupFormSchema.parse(values);
    
    const usersCollection = db.collection("users");

    const existingUser = await usersCollection.findOne({ email: validatedData.email });
    if (existingUser) {
      return { success: false, message: "User with this email already exists." };
    }
    
    // In a real app, you would hash the password
    const { fullName, email, password } = validatedData;
    await usersCollection.insertOne({ name: fullName, email, password, image: `https://placehold.co/100x100.png?text=${fullName.charAt(0)}` });
    
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
        
        // In a real app, you would compare hashed passwords
        if (!user || user.password !== validatedData.password) {
          return { success: false, message: "Invalid email or password." };
        }

    } catch (error) {
       console.error("Login Error:", error);
      if (error instanceof z.ZodError) {
        return { success: false, message: "Validation failed.", issues: error.flatten() };
      }
      return { success: false, message: "An unexpected error occurred during login." };
    }

    redirect("/dashboard");
}

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

export async function updateUserProfile(values: z.infer<typeof profileFormSchema>) {
    try {
        const validatedData = profileFormSchema.parse(values);
        const db = await getDb();
        if (!db) {
            return { success: false, message: "Database connection failed. Please check server configuration." };
        }
        
        // In a real app, this would come from a session. For now, we update the first user found.
        const currentUser = await db.collection("users").findOne({});
        if (!currentUser) {
            return { success: false, message: "User not found." };
        }

        await db.collection("users").updateOne(
            { _id: currentUser._id },
            { $set: { name: validatedData.name } }
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
