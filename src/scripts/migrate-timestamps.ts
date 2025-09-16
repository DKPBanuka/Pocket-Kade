/**
 * Database Migration Script: Fix timestamp inconsistencies
 * 
 * This script will:
 * 1. Find all documents with pending serverTimestamp() writes
 * 2. Convert them to proper ISO string timestamps
 * 3. Update the database with consistent timestamps
 */

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, where, writeBatch } from 'firebase/firestore';

interface DocumentData {
  id: string;
  createdAt: any;
  [key: string]: any;
}

const COLLECTIONS_TO_MIGRATE = [
  'invoices',
  'inventory', 
  'customers',
  'suppliers',
  'expenses',
  'returns',
  'stockMovements',
  'notifications',
  'organizations',
  'users'
];

export async function migrateTimestamps() {
  console.log('🚀 Starting timestamp migration...');
  
  try {
    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    
    for (const collectionName of COLLECTIONS_TO_MIGRATE) {
      console.log(`\n📁 Processing collection: ${collectionName}`);
      
      try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        const documentsToUpdate: DocumentData[] = [];
        let collectionProcessed = 0;
        let collectionUpdated = 0;
        let collectionSkipped = 0;
        
        // Process each document
        snapshot.forEach((doc) => {
          const data = doc.data() as DocumentData;
          collectionProcessed++;
          totalProcessed++;
          
          // Check if createdAt needs migration
          if (needsTimestampMigration(data.createdAt)) {
            documentsToUpdate.push({
              id: doc.id,
              ...data
            });
          } else {
            collectionSkipped++;
            totalSkipped++;
          }
        });
        
        console.log(`📊 Found ${collectionProcessed} total documents`);
        console.log(`📝 Found ${documentsToUpdate.length} documents needing timestamp migration`);
        
        if (documentsToUpdate.length === 0) {
          console.log(`✅ All documents in ${collectionName} already have proper timestamps.`);
          continue;
        }
        
        // Update documents in batches
        const batch = writeBatch(db);
        let batchCount = 0;
        const BATCH_SIZE = 500; // Firestore batch limit
        
        for (const document of documentsToUpdate) {
          try {
            const docRef = doc(db, collectionName, document.id);
            
            // Convert createdAt to ISO string
            let newTimestamp: string;
            if (document.createdAt && typeof document.createdAt.toDate === 'function') {
              newTimestamp = document.createdAt.toDate().toISOString();
            } else if (document.createdAt && typeof document.createdAt.seconds === 'number') {
              newTimestamp = new Date(document.createdAt.seconds * 1000).toISOString();
            } else if (typeof document.createdAt === 'string') {
              newTimestamp = document.createdAt;
            } else {
              // Fallback to current date
              newTimestamp = new Date().toISOString();
            }
            
            batch.update(docRef, {
              createdAt: newTimestamp
            });
            
            batchCount++;
            collectionUpdated++;
            totalUpdated++;
            
            // Commit batch when it reaches the limit
            if (batchCount >= BATCH_SIZE) {
              await batch.commit();
              console.log(`✅ Committed batch of ${batchCount} documents`);
              batchCount = 0;
            }
            
          } catch (error) {
            console.error(`❌ Failed to update document ${document.id}:`, error);
          }
        }
        
        // Commit remaining documents
        if (batchCount > 0) {
          await batch.commit();
          console.log(`✅ Committed final batch of ${batchCount} documents`);
        }
        
        console.log(`✅ Collection ${collectionName} completed:`);
        console.log(`   📊 Processed: ${collectionProcessed} documents`);
        console.log(`   ✅ Updated: ${collectionUpdated} documents`);
        console.log(`   ⏭️ Skipped: ${collectionSkipped} documents`);
        
      } catch (error) {
        console.error(`❌ Failed to process collection ${collectionName}:`, error);
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Total Processed: ${totalProcessed} documents`);
    console.log(`✅ Total Updated: ${totalUpdated} documents`);
    console.log(`⏭️ Total Skipped: ${totalSkipped} documents`);
    
    return {
      totalProcessed,
      totalUpdated,
      totalSkipped,
      collections: COLLECTIONS_TO_MIGRATE.length
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

function needsTimestampMigration(timestamp: any): boolean {
  // Check if timestamp is a pending serverTimestamp
  if (timestamp && typeof timestamp === 'object') {
    if (timestamp._methodName === 'serverTimestamp') {
      return true;
    }
    // Check if it's a Firestore Timestamp that needs conversion
    if (typeof timestamp.toDate === 'function') {
      return true;
    }
    // Check if it's a timestamp with seconds property
    if (typeof timestamp.seconds === 'number') {
      return true;
    }
  }
  
  // If it's already a string, check if it's valid
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    return isNaN(date.getTime());
  }
  
  return false;
}

// Function to run migration from browser console
export function runTimestampMigrationFromConsole() {
  console.log('🔧 Running timestamp migration...');
  migrateTimestamps()
    .then((results) => {
      console.log('✅ Timestamp migration completed successfully!');
      console.log('Results:', results);
    })
    .catch((error) => {
      console.error('❌ Timestamp migration failed:', error);
    });
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).migrateTimestamps = runTimestampMigrationFromConsole;
}

