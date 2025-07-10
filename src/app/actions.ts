'use server';

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, createVendor, updateVendor, createNotification, logAuditEvent, updateUser } from "@/lib/data";
import { Invoice, Vendor, User, Notification } from "@/lib/types";

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

        const newInvoice: Omit<Invoice, 'id'> = {
            ...validatedData,
            vendorId: 'unknown', // This should be selected from vendors
            status: "Unpaid",
            totalAmount: validatedData.invoiceAmount,
            approvalStatus: "Pending",
            createdAt: new Date(),
            updatedAt: new Date(),
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

// Enhanced Vendor Management Actions

const vendorFormSchema = z.object({
  name: z.string().min(1, "Vendor name is required."),
  email: z.string().email("Please enter a valid email."),
  phone: z.string().optional(),
  service: z.string().min(1, "Service category is required."),
  website: z.string().url().optional().or(z.literal("")),
  primaryContact: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  riskLevel: z.enum(["Low", "Medium", "High"]).default("Medium"),
});

export async function createVendorAction(values: z.infer<typeof vendorFormSchema>) {
  try {
    const validatedData = vendorFormSchema.parse(values);
    
    const vendorData = {
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone || '',
      service: validatedData.service,
      website: validatedData.website,
      primaryContact: validatedData.primaryContact,
      address: validatedData.address,
      taxId: validatedData.taxId,
      paymentTerms: validatedData.paymentTerms,
      riskLevel: validatedData.riskLevel,
      complianceStatus: 'Needs Review' as const,
      isActive: true,
      isOnboarded: false,
      performanceMetrics: {
        onTimeDeliveryRate: 0,
        qualityScore: 0,
        responseTime: 0,
        averageRating: 0,
      },
    };

    const vendorId = await createVendor(vendorData);
    
    // Create onboarding notification
    await createNotification({
      userId: 'system',
      type: 'System',
      title: 'New Vendor Added',
      message: `${vendorData.name} has been added to the system and requires onboarding completion.`,
      priority: 'Medium',
      isRead: false,
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/vendors");
    return { success: true, vendorId, message: "Vendor created successfully." };
  } catch (error) {
    console.error('Failed to create vendor:', error);
    if (error instanceof z.ZodError) {
      return { success: false, message: "Validation failed.", issues: error.flatten() };
    }
    return { success: false, message: "Failed to create vendor." };
  }
}

export async function updateVendorAction(vendorId: string, values: Partial<z.infer<typeof vendorFormSchema>>) {
  try {
    await updateVendor(vendorId, values);
    revalidatePath("/dashboard/vendors");
    return { success: true, message: "Vendor updated successfully." };
  } catch (error) {
    console.error('Failed to update vendor:', error);
    return { success: false, message: "Failed to update vendor." };
  }
}

// User Settings Actions
const userSettingsSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Please enter a valid email."),
  companyName: z.string().optional(),
  industry: z.string().optional(),
  size: z.enum(["Small", "Medium", "Large"]).optional(),
  location: z.string().optional(),
  vendorPolicies: z.string().optional(),
  operationalFocus: z.string().optional(),
});

export async function updateUserSettingsAction(userId: string, values: z.infer<typeof userSettingsSchema>) {
  try {
    const validatedData = userSettingsSchema.parse(values);
    
    const { name, email, companyName, industry, size, location, vendorPolicies, operationalFocus, ...rest } = validatedData;
    
    const businessInfo = companyName || industry || size || location || vendorPolicies || operationalFocus ? {
      companyName: companyName || '',
      industry: industry || '',
      size: size || 'Medium',
      location: location || '',
      vendorPolicies: vendorPolicies || '',
      operationalFocus: operationalFocus || '',
      priorities: [],
      complianceRequirements: [],
    } : undefined;

    await updateUser(userId, {
      name,
      email,
      businessInfo,
    });

    revalidatePath("/dashboard/settings");
    return { success: true, message: "Settings updated successfully." };
  } catch (error) {
    console.error('Failed to update user settings:', error);
    if (error instanceof z.ZodError) {
      return { success: false, message: "Validation failed.", issues: error.flatten() };
    }
    return { success: false, message: "Failed to update settings." };
  }
}

// Invoice Actions
export async function approveInvoiceAction(invoiceId: string, userId: string) {
  try {
    await logAuditEvent('invoice_approved', 'Invoice', invoiceId, { approvedBy: userId }, userId);
    
    await createNotification({
      userId: 'system',
      type: 'Invoice Due',
      title: 'Invoice Approved',
      message: `Invoice ${invoiceId} has been approved and is ready for payment.`,
      priority: 'Medium',
      isRead: false,
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/invoices");
    return { success: true, message: "Invoice approved successfully." };
  } catch (error) {
    console.error('Failed to approve invoice:', error);
    return { success: false, message: "Failed to approve invoice." };
  }
}

export async function rejectInvoiceAction(invoiceId: string, userId: string, reason: string) {
  try {
    await logAuditEvent('invoice_rejected', 'Invoice', invoiceId, { rejectedBy: userId, reason }, userId);
    
    await createNotification({
      userId: 'system',
      type: 'Invoice Due',
      title: 'Invoice Rejected',
      message: `Invoice ${invoiceId} has been rejected. Reason: ${reason}`,
      priority: 'High',
      isRead: false,
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/invoices");
    return { success: true, message: "Invoice rejected successfully." };
  } catch (error) {
    console.error('Failed to reject invoice:', error);
    return { success: false, message: "Failed to reject invoice." };
  }
}

// Performance Monitoring Actions
export async function updateVendorPerformanceAction(vendorId: string, performanceData: any) {
  try {
    const updates = {
      performanceMetrics: {
        onTimeDeliveryRate: performanceData.onTimeDeliveryRate,
        qualityScore: performanceData.qualityScore,
        responseTime: performanceData.responseTime,
        averageRating: performanceData.averageRating,
      },
      lastReviewDate: new Date(),
    };

    await updateVendor(vendorId, updates);
    
    // Create performance alert if score is low
    if (performanceData.qualityScore < 70) {
      await createNotification({
        userId: 'system',
        type: 'Performance Alert',
        title: 'Vendor Performance Issue',
        message: `Vendor performance has declined. Quality score: ${performanceData.qualityScore}%`,
        priority: 'High',
        isRead: false,
        createdAt: new Date(),
      });
    }

    revalidatePath("/dashboard/vendors");
    revalidatePath("/dashboard/analytics");
    return { success: true, message: "Performance updated successfully." };
  } catch (error) {
    console.error('Failed to update vendor performance:', error);
    return { success: false, message: "Failed to update vendor performance." };
  }
}

// Risk Management Actions
export async function updateVendorRiskAction(vendorId: string, riskLevel: 'Low' | 'Medium' | 'High', riskFactors: string[]) {
  try {
    await updateVendor(vendorId, {
      riskLevel,
      tags: riskFactors,
    });

    // Create high-risk alert
    if (riskLevel === 'High') {
      await createNotification({
        userId: 'system',
        type: 'Performance Alert',
        title: 'High Risk Vendor Identified',
        message: `Vendor has been classified as high risk. Immediate review recommended.`,
        priority: 'Critical',
        isRead: false,
        createdAt: new Date(),
      });
    }

    revalidatePath("/dashboard/vendors");
    revalidatePath("/dashboard/alerts");
    return { success: true, message: "Risk assessment updated successfully." };
  } catch (error) {
    console.error('Failed to update vendor risk:', error);
    return { success: false, message: "Failed to update vendor risk." };
  }
}

// Notification Actions
export async function markNotificationAsReadAction(notificationId: string) {
  try {
    // This would update the notification status in the database
    console.log('Marking notification as read:', notificationId);
    revalidatePath("/dashboard/alerts");
    return { success: true, message: "Notification marked as read." };
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return { success: false, message: "Failed to mark notification as read." };
  }
}

export async function dismissNotificationAction(notificationId: string) {
  try {
    // This would remove or archive the notification
    console.log('Dismissing notification:', notificationId);
    revalidatePath("/dashboard/alerts");
    return { success: true, message: "Notification dismissed." };
  } catch (error) {
    console.error('Failed to dismiss notification:', error);
    return { success: false, message: "Failed to dismiss notification." };
  }
}
