
'use server';

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, createInvoice, updateInvoice, deleteInvoice, updateInvoiceStatus, createCompany, updateCompany, createOrUpdateCompany } from "@/lib/data";
import { sendPaymentConfirmation } from '@/lib/email-notifications';
import { ObjectId } from 'mongodb';
import { Invoice, Company } from "@/lib/types";
import { createSession, deleteSession } from "@/lib/auth"; // Updated import

// --- Form Schemas ---

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const companyRegistrationSchema = z.object({
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  industry: z.string().min(1, { message: "Please select an industry." }),
  businessType: z.string().min(1, { message: "Please select a business type." }),
  taxId: z.string().optional(),
  legalId: z.string().optional(),
  primaryAddress: z.object({
    street: z.string().min(1, { message: "Street address is required." }),
    city: z.string().min(1, { message: "City is required." }),
    state: z.string().min(1, { message: "State is required." }),
    zipCode: z.string().min(1, { message: "ZIP code is required." }),
    country: z.string().min(1, { message: "Country is required." }),
  }),
  websiteUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")),
  userFullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  primaryContactEmail: z.string().email({ message: "Please enter a valid email." }),
  userPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
});


// --- Authentication Actions ---

export async function loginUser(prevState: any, formData: FormData) {
  const validatedFields = loginFormSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;
  const db = await getDb();
  
  try {
    const user = await db.collection("users").findOne({ email });

    if (!user || user.password !== password) {
      return { message: "Invalid email or password." };
    }

    await createSession(user._id.toString());
    
  } catch (error) {
    if (error instanceof Error && error.name === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error("Login Error:", error);
    return { message: "An unexpected error occurred. Please try again." };
  }

  redirect("/dashboard");
}


export async function registerCompany(prevState: any, formData: FormData) {
  const validatedFields = companyRegistrationSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { 
      companyName, industry, businessType, taxId, legalId, primaryAddress, 
      websiteUrl, userFullName, primaryContactEmail, userPassword 
  } = validatedFields.data;

  const db = await getDb();
  const usersCollection = db.collection("users");
  const companiesCollection = db.collection("companies");

  try {
    const existingUser = await usersCollection.findOne({ email: primaryContactEmail });
    if (existingUser) {
      return { message: "A user with this email already exists." };
    }

    const session = db.client.startSession();
    let newUserId: ObjectId;

    await session.withTransaction(async () => {
      // Step 1: Create the company first to get its ID
      const newCompany = {
        name: companyName,
        industry,
        businessType,
        taxId,
        legalId,
        addresses: [primaryAddress],
        primaryAddress,
        website: websiteUrl || "",
        contacts: [{
          id: new ObjectId().toString(),
          name: userFullName,
          email: primaryContactEmail,
          phone: "",
          isPrimary: true,
          role: 'Administrator'
        }],
        preferences: { defaultPaymentTerms: 'Net 30', defaultCurrency: 'USD' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: '', // Placeholder, will be updated shortly
      };
      const companyResult = await companiesCollection.insertOne(newCompany, { session });
      const companyId = companyResult.insertedId.toString();

      // Set the companyId on the company document itself for consistent querying
      await companiesCollection.updateOne(
        { _id: companyResult.insertedId },
        { $set: { companyId: companyId } },
        { session }
      );
      
      // Step 2: Create the user and assign them the new company's ID
      const userResult = await usersCollection.insertOne({
        name: userFullName,
        email: primaryContactEmail,
        password: userPassword,
        companyId: companyId, // Assign the new company's ID
        image: `https://placehold.co/100x100.png?text=${userFullName.charAt(0)}`,
        role: "admin",
        createdAt: new Date().toISOString()
      }, { session });
      
      newUserId = userResult.insertedId;

      // Step 3: Update the company's 'createdBy' field with the new user's ID
      await companiesCollection.updateOne(
        { _id: companyResult.insertedId },
        { $set: { createdBy: newUserId.toString() } },
        { session }
      );
    });
    
    await session.endSession();
    
    // Create session for the new user
    await createSession(newUserId!.toString());

  } catch (error) {
    if (error instanceof Error && error.name === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error("Company Registration Error:", error);
    return { message: "Registration failed. Please try again." };
  }
  
  redirect("/dashboard");
}


export async function logoutUser() {
  await deleteSession();
  redirect("/");
}


// --- Other Actions (Unchanged) ---

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
        
        const currentUser = await db.collection("users").findOne({});
        if (!currentUser) {
            return { success: false, message: "User not found." };
        }

        await db.collection("users").updateOne(
            { _id: currentUser._id },
            { $set: { name: validatedData.name } }
        );

        revalidatePath("/dashboard/profile");
        revalidatePath("/dashboard");
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


    