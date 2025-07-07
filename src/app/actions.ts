
'use server';

import { suggestLineItem } from '@/ai/flows/suggest-line-item';
import type { SuggestLineItemInput, SuggestLineItemOutput } from '@/ai/flows/suggest-line-item';
import { forecastSales } from '@/ai/flows/forecast-sales-flow';
import type { SalesDataInput, SalesForecastOutput } from '@/ai/flows/forecast-sales-flow';
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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

export async function forecastSalesAction(
  input: SalesDataInput
): Promise<SalesForecastOutput> {
  return await forecastSales(input);
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
    const invitation = { id: invitationDoc.id, ...invitationDoc.data() };
    
    // Check if expired (e.g., > 24 hours)
    const createdAt = invitation.createdAt.toDate();
    if (new Date().getTime() - createdAt.getTime() > 24 * 60 * 60 * 1000) {
        return { success: false, error: 'This invitation has expired.' };
    }

    return { success: true, invitation: { email: invitation.email, role: invitation.role } };
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
