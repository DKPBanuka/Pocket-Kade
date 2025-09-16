
'use server';

import { suggestLineItem } from '@/ai/flows/suggest-line-item';
import type { SuggestLineItemInput, SuggestLineItemOutput } from '@/ai/flows/suggest-line-item';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import type { UserRole } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { updateUserProfileSchema, organizationSettingsSchema, organizationThemeSchema, organizationInvoiceSettingsSchema } from '@/lib/schemas';
import type * as z from 'zod';


export async function suggestLineItemAction(
  input: SuggestLineItemInput
): Promise<SuggestLineItemOutput> {
  // Add any server-side validation or logic here
  return await suggestLineItem(input);
}

export async function createInvitationAction(
  email: string,
  role: UserRole,
  tenantId: string
): Promise<{ success: boolean; error?: string; link?: string }> {
  try {
    const q = query(collection(db, 'invitations'), where('email', '==', email), where('tenantId', '==', tenantId), where('status', '==', 'pending'));
    const existing = await getDocs(q);
    if (!existing.empty) {
      return { success: false, error: 'An active invitation for this email already exists.' };
    }

    const token = crypto.randomUUID();
    await addDoc(collection(db, 'invitations'), {
      email,
      role,
      tenantId,
      token,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const link = `${origin}/accept-invitation?token=${token}`;

    return { success: true, link };
  } catch (error) {
    console.error('Error creating invitation:', error);
    return { success: false, error: 'Could not create invitation.' };
  }
}

export async function getInvitationDetailsAction(
  token: string
): Promise<{ success: boolean; error?: string; invitation?: any }> {
  try {
    const q = query(collection(db, 'invitations'), where('token', '==', token), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, error: 'Invitation not found or has already been used.' };
    }

    const invitationDoc = snapshot.docs[0];
    const invitationData = invitationDoc.data() as any;
    const invitation = { id: invitationDoc.id, ...invitationData } as { id: string; email?: string; role?: UserRole; createdAt?: any };
    
    // Check if expired (e.g., > 24 hours)
    // Safely normalize createdAt (can be Firestore Timestamp, ISO string, or missing)
    const rawCreatedAt: any = invitation.createdAt;
    let createdAt: Date | null = null;
    if (rawCreatedAt && typeof rawCreatedAt.toDate === 'function') {
      createdAt = rawCreatedAt.toDate();
    } else if (rawCreatedAt && typeof rawCreatedAt.seconds === 'number') {
      createdAt = new Date(rawCreatedAt.seconds * 1000);
    } else if (typeof rawCreatedAt === 'string') {
      const parsed = new Date(rawCreatedAt);
      if (!isNaN(parsed.getTime())) createdAt = parsed;
    }
    // If we have a valid date, enforce 24h expiry; otherwise, skip expiry check
    if (createdAt && (Date.now() - createdAt.getTime() > 24 * 60 * 60 * 1000)) {
      return { success: false, error: 'This invitation has expired.' };
    }

    return { success: true, invitation: { email: invitation.email || '', role: invitation.role || 'staff' as UserRole } };
  } catch (error) {
    console.error('Error getting invitation:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

export async function finalizeInvitationAction(
  uid: string,
  username: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
   try {
    const q = query(collection(db, 'invitations'), where('token', '==', token), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, error: 'Invitation not found or has already been used.' };
    }
    const invitationDoc = snapshot.docs[0];
    const invitationData = invitationDoc.data();

    const batch = writeBatch(db);
    
    // Set user data
    const userRef = doc(db, 'users', uid);
    batch.set(userRef, {
        username,
        email: invitationData.email,
        tenants: {
            [invitationData.tenantId]: invitationData.role,
        },
        onboardingCompleted: false, // Start the onboarding flow for the new user
        createdAt: serverTimestamp(),
    });

    // Mark invitation as completed
    batch.update(invitationDoc.ref, { status: 'completed' });

    await batch.commit();
    return { success: true };

  } catch (error) {
    console.error('Error finalizing invitation:', error);
    return { success: false, error: 'Could not complete your account setup.' };
  }
}


export async function updateUserProfileAction(
  uid: string,
  data: { username: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const validationResult = updateUserProfileSchema.safeParse(data);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.errors.map(e => e.message).join(', ') };
    }
    
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { username: validationResult.data.username });
    
    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: 'Could not update profile.' };
  }
}

export async function updateOrganizationAction(
  tenantId: string,
  data: z.infer<typeof organizationSettingsSchema>
): Promise<{ success: boolean; error?: string }> {
  try {
    const validationResult = organizationSettingsSchema.safeParse(data);
    if (!validationResult.success) {
       return { success: false, error: validationResult.error.errors.map(e => e.message).join(', ') };
    }

    const orgRef = doc(db, 'organizations', tenantId);
    await updateDoc(orgRef, validationResult.data);
    
    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Error updating organization:', error);
    return { success: false, error: 'Could not update organization details.' };
  }
}

export async function updateOrganizationThemeAction(
  tenantId: string,
  theme: 'light' | 'dark' | 'system'
): Promise<{ success: boolean; error?: string }> {
  try {
    const validationResult = organizationThemeSchema.safeParse({ selectedTheme: theme });
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.errors.map(e => e.message).join(', ') };
    }

    const orgRef = doc(db, 'organizations', tenantId);
    await updateDoc(orgRef, { selectedTheme: validationResult.data.selectedTheme });
    
    revalidatePath('/settings'); // Revalidates the path to ensure data consistency across the app
    return { success: true };
  } catch (error) {
    console.error('Error updating organization theme:', error);
    return { success: false, error: 'Could not update theme.' };
  }
}

export async function updateOrganizationInvoiceSettingsAction(
  tenantId: string,
  data: { invoiceTemplate?: string; invoiceColor?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const validationResult = organizationInvoiceSettingsSchema.safeParse(data);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.errors.map(e => e.message).join(', ') };
    }

    const orgRef = doc(db, 'organizations', tenantId);
    
    const orgSnap = await getDoc(orgRef);
    if (!orgSnap.exists()) {
        return { success: false, error: "Organization not found." };
    }
    const orgData = orgSnap.data();
    const recentColors: string[] = orgData.recentInvoiceColors || [];
    const newColor = validationResult.data.invoiceColor;

    let updatedRecentColors = [...recentColors];

    if (newColor && !updatedRecentColors.includes(newColor)) {
        updatedRecentColors.unshift(newColor);
        if (updatedRecentColors.length > 5) {
            updatedRecentColors = updatedRecentColors.slice(0, 5);
        }
    }

    const finalUpdateData = {
        ...validationResult.data,
        recentInvoiceColors: updatedRecentColors
    };

    await updateDoc(orgRef, finalUpdateData);
    
    revalidatePath('/invoices');
    revalidatePath('/invoice/[id]', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Error updating organization invoice settings:', error);
    return { success: false, error: 'Could not update invoice settings.' };
  }
}


export async function completeUserOnboardingAction(
  uid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { onboardingCompleted: true });
    return { success: true };
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return { success: false, error: 'Could not complete onboarding.' };
  }
}

export async function addSampleProductForTour(
  tenantId: string
): Promise<{ success: boolean; productId?: string; error?: string }> {
  if (!tenantId) {
    return { success: false, error: 'Tenant ID is required.' };
  }
  try {
    const newDocRef = await addDoc(collection(db, 'inventory'), {
      tenantId,
      name: 'Sample Product',
      category: 'Electronics',
      brand: 'TourBrand',
      quantity: 50,
      price: 1500,
      costPrice: 1000,
      reorderPoint: 10,
      status: 'Available',
      warrantyPeriod: '1 Year',
      createdAt: serverTimestamp(),
    });
    return { success: true, productId: newDocRef.id };
  } catch (error) {
    console.error('Error adding sample product:', error);
    return { success: false, error: 'Could not create sample product.' };
  }
}

export async function deleteSampleProductForTour(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  if (!productId) {
    return { success: false, error: 'Product ID is required.' };
  }
  try {
    const docRef = doc(db, 'inventory', productId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting sample product:', error);
    return { success: false, error: 'Could not delete sample product.' };
  }
}

export async function sendPasswordResetEmailAction(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    if (error.code === 'auth/user-not-found') {
        // To prevent user enumeration, we don't tell the user that the email doesn't exist.
        // The success message on the client will handle this.
        return { success: true };
    }
    return { success: false, error: 'Failed to send password reset email. Please try again later.' };
  }
}
