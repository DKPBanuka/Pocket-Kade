/**
 * Database Migration Script: Add invoiceDate field to existing invoices
 * 
 * This script will:
 * 1. Find all existing invoices without invoiceDate field
 * 2. Set invoiceDate = createdAt for those invoices
 * 3. Update the database
 */

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

interface InvoiceData {
  id: string;
  createdAt: any;
  invoiceDate?: string;
  [key: string]: any;
}

export async function migrateInvoiceDates() {
  console.log('🚀 Starting invoice date migration...');
  
  try {
    // Get all invoices from the database
    const invoicesRef = collection(db, 'invoices');
    const snapshot = await getDocs(invoicesRef);
    
    const invoicesToUpdate: InvoiceData[] = [];
    let processedCount = 0;
    let updatedCount = 0;
    
    // Process each invoice
    snapshot.forEach((doc) => {
      const data = doc.data() as InvoiceData;
      processedCount++;
      
      // Check if invoiceDate field is missing
      if (!data.invoiceDate) {
        invoicesToUpdate.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    console.log(`📊 Found ${processedCount} total invoices`);
    console.log(`📝 Found ${invoicesToUpdate.length} invoices without invoiceDate field`);
    
    if (invoicesToUpdate.length === 0) {
      console.log('✅ All invoices already have invoiceDate field. Migration not needed.');
      return;
    }
    
    // Update invoices without invoiceDate
    for (const invoice of invoicesToUpdate) {
      try {
        const invoiceRef = doc(db, 'invoices', invoice.id);
        
        // Convert createdAt to ISO string
        let invoiceDate: string;
        if (invoice.createdAt && typeof invoice.createdAt.toDate === 'function') {
          invoiceDate = invoice.createdAt.toDate().toISOString();
        } else if (invoice.createdAt && typeof invoice.createdAt.seconds === 'number') {
          invoiceDate = new Date(invoice.createdAt.seconds * 1000).toISOString();
        } else if (typeof invoice.createdAt === 'string') {
          invoiceDate = invoice.createdAt;
        } else {
          // Fallback to current date
          invoiceDate = new Date().toISOString();
        }
        
        await updateDoc(invoiceRef, {
          invoiceDate: invoiceDate
        });
        
        updatedCount++;
        console.log(`✅ Updated invoice ${invoice.id} with invoiceDate: ${invoiceDate}`);
        
      } catch (error) {
        console.error(`❌ Failed to update invoice ${invoice.id}:`, error);
      }
    }
    
    console.log(`🎉 Migration completed!`);
    console.log(`📊 Processed: ${processedCount} invoices`);
    console.log(`✅ Updated: ${updatedCount} invoices`);
    console.log(`⏭️ Skipped: ${processedCount - updatedCount} invoices (already had invoiceDate)`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Function to run migration from browser console
export function runMigrationFromConsole() {
  console.log('🔧 Running invoice date migration...');
  migrateInvoiceDates()
    .then(() => {
      console.log('✅ Migration completed successfully!');
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
    });
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).migrateInvoiceDates = runMigrationFromConsole;
}

