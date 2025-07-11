
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { InventoryItem, ShipmentData } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, increment, writeBatch, query, where, getDocs, getDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { inventoryItemServerSchema, inventoryShipmentSchema } from '@/lib/schemas';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

const INVENTORY_COLLECTION = 'inventory';
const USERS_COLLECTION = 'users';
const NOTIFICATIONS_COLLECTION = 'notifications';
const STOCK_MOVEMENTS_COLLECTION = 'stockMovements';


export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user?.activeTenantId) {
        setIsLoading(false);
        setInventory([]);
        return;
    };

    const q = query(
        collection(db, INVENTORY_COLLECTION),
        where("tenantId", "==", user.activeTenantId)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const inventoryData: InventoryItem[] = snapshot.docs.map(doc => {
          const data = doc.data();
          const ts = data.createdAt;
          let normalizedCreatedAt: string;

          if (ts && typeof ts.toDate === 'function') {
            normalizedCreatedAt = ts.toDate().toISOString();
          } else if (ts && typeof ts.seconds === 'number') {
            normalizedCreatedAt = new Date(ts.seconds * 1000).toISOString();
          } else if (typeof ts === 'string' && !isNaN(new Date(ts).getTime())) {
            normalizedCreatedAt = ts;
          } else if (doc.metadata.hasPendingWrites) {
            normalizedCreatedAt = new Date().toISOString();
          } else {
            normalizedCreatedAt = new Date().toISOString();
          }

          const item = {
            id: doc.id,
            ...data,
            createdAt: normalizedCreatedAt,
          } as InventoryItem;

          if (user.activeRole === 'staff') {
              item.costPrice = 0; // Don't expose cost price to staff
          }
          return item;
        });
        setInventory(inventoryData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setIsLoading(false);
      },
      (error) => {
        console.error("Firebase snapshot error:", error);
        toast({ title: "Error loading inventory", description: "Could not fetch inventory from the database.", variant: "destructive" });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast, user]);
  
  const addInventoryShipment = useCallback(async (shipmentData: ShipmentData) => {
    if (user?.activeRole === 'staff') {
        toast({ title: "Permission Denied", description: "You do not have permission to add shipments.", variant: "destructive" });
        return;
    }
    if (!user?.activeTenantId || !user.username) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
        return;
    }

    const validationResult = inventoryShipmentSchema.safeParse(shipmentData);
    if (!validationResult.success) {
        const errorMessage = validationResult.error.errors.map(e => e.message).join('\n');
        toast({ title: "Invalid Shipment Data", description: errorMessage, variant: "destructive" });
        return;
    }
    
    const { lineItems, transportCost = 0, otherExpenses = 0, targetProfit = 0 } = validationResult.data;

    try {
        const batch = writeBatch(db);
        const totalAdditionalExpenses = transportCost + otherExpenses;
        const totalPurchaseValue = lineItems.reduce((acc, item) => acc + item.quantity * item.unitCostPrice, 0);
        const totalLandedCost = totalPurchaseValue + totalAdditionalExpenses;
        const totalRequiredRevenue = totalLandedCost + numTargetProfit;

        for (const item of lineItems) {
            const itemTotalValue = item.quantity * item.unitCostPrice;
            const landedCost = totalPurchaseValue > 0 ? item.unitCostPrice + ((itemTotalValue / totalPurchaseValue) * totalAdditionalExpenses) / item.quantity : item.unitCostPrice;
            
            let suggestedPrice = landedCost;
            if (targetProfit > 0 && totalLandedCost > 0) {
                const profitMarginRatio = totalRequiredRevenue / totalLandedCost;
                const rawSuggestedPrice = landedCost * profitMarginRatio;
                suggestedPrice = Math.round(rawSuggestedPrice / 10) * 10;
            }

            const q = query(
                collection(db, INVENTORY_COLLECTION),
                where("tenantId", "==", user.activeTenantId),
                where("name", "==", item.name)
            );
            const existingItemsSnapshot = await getDocs(q);
            
            let docRef;
            if (!existingItemsSnapshot.empty) {
                // Item exists, update it
                docRef = existingItemsSnapshot.docs[0].ref;
                const existingItem = existingItemsSnapshot.docs[0].data() as InventoryItem;
                
                const oldTotalCost = existingItem.costPrice * existingItem.quantity;
                const newTotalCost = landedCost * item.quantity;
                const newTotalQuantity = existingItem.quantity + item.quantity;
                const newWeightedAvgCost = (oldTotalCost + newTotalCost) / newTotalQuantity;

                batch.update(docRef, {
                    quantity: increment(item.quantity),
                    costPrice: newWeightedAvgCost
                });
            } else {
                // Item does not exist, create it
                docRef = doc(collection(db, INVENTORY_COLLECTION));
                batch.set(docRef, {
                    tenantId: user.activeTenantId,
                    name: item.name,
                    quantity: item.quantity,
                    costPrice: landedCost,
                    price: suggestedPrice, // Correctly set selling price to suggested price
                    category: 'Uncategorized',
                    reorderPoint: 10,
                    status: 'Available',
                    warrantyPeriod: 'N/A',
                    brand: '',
                    createdAt: serverTimestamp(),
                });
            }
            
            // Add stock movement record
            const movementRef = doc(collection(db, STOCK_MOVEMENTS_COLLECTION));
            batch.set(movementRef, {
                inventoryItemId: docRef.id,
                tenantId: user.activeTenantId,
                type: 'addition',
                quantity: item.quantity,
                referenceId: 'Shipment',
                createdAt: serverTimestamp(),
                createdByName: user.username,
            });
        }
        
        await batch.commit();
        toast({ title: "Shipment Added", description: "Inventory has been successfully updated." });
        router.push('/inventory');

    } catch (error) {
        console.error("Error adding shipment:", error);
        toast({ title: "Error", description: "Failed to add shipment.", variant: "destructive" });
    }
}, [toast, user, router]);


  const addInventoryItem = useCallback(async (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'tenantId'>) => {
    if (user?.activeRole === 'staff') {
      toast({ title: "Permission Denied", description: "You do not have permission to add items.", variant: "destructive" });
      return;
    }
     if (!user?.activeTenantId || !user.username) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    
    const { quantity, ...dataToValidate } = { ...itemData, tenantId: user.activeTenantId };
    const validationResult = inventoryItemServerSchema.safeParse(dataToValidate);
    const quantityValidation = z.coerce.number().int().optional().safeParse(quantity);

    if (!validationResult.success || !quantityValidation.success) {
        const errors = validationResult.success ? [] : validationResult.error.errors.map(e => e.message);
        if (!quantityValidation.success) errors.push("Initial quantity must be a whole number.");
        toast({ title: "Invalid Data", description: errors.join('\n'), variant: "destructive" });
        return;
    }

    try {
      const batch = writeBatch(db);
      const newDocRef = doc(collection(db, INVENTORY_COLLECTION));
      
      batch.set(newDocRef, {
        ...validationResult.data,
        quantity: quantity || 0,
        createdAt: serverTimestamp(),
      });

      if (quantity && quantity > 0) {
        const movementRef = doc(collection(db, STOCK_MOVEMENTS_COLLECTION));
        batch.set(movementRef, {
            inventoryItemId: newDocRef.id,
            tenantId: user.activeTenantId,
            type: 'addition',
            quantity: quantity,
            referenceId: 'Initial Stock',
            createdAt: serverTimestamp(),
            createdByName: user.username,
        });
      }
      
      const usersSnapshot = await getDocs(query(collection(db, USERS_COLLECTION), where(`tenants.${user.activeTenantId}`, 'in', ['admin', 'owner'])));
      usersSnapshot.docs.forEach(userDoc => {
          if (userDoc.id !== user.uid) {
              const notificationRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
              batch.set(notificationRef, {
                  recipientUid: userDoc.id, senderName: user.username, 
                  messageKey: 'notifications.inventory.item_added', 
                  messageParams: { user: user.username, item: itemData.name },
                  link: `/inventory`, read: false, createdAt: serverTimestamp(), type: 'inventory'
              });
          }
      });

      await batch.commit();

      toast({
        title: "Item Added",
        description: `${itemData.name} has been added to inventory.`,
      });
    } catch (error) {
      console.error("Error adding inventory item:", error);
      toast({ title: "Error", description: "Failed to add inventory item.", variant: "destructive" });
    }
  }, [toast, user]);

  const getInventoryItem = useCallback((id: string) => {
    const item = inventory.find(item => item.id === id);
    if (item && user?.activeRole === 'staff') {
        item.costPrice = 0;
    }
    return item;
  }, [inventory, user]);

  const updateInventoryItem = useCallback(async (id: string, updatedData: Partial<Omit<InventoryItem, 'id' | 'quantity' | 'createdAt' | 'tenantId'>> & { addStock?: number }) => {
     if (user?.activeRole === 'staff') {
      toast({ title: "Permission Denied", description: "You do not have permission to update items.", variant: "destructive" });
      return;
    }
    if (!user?.activeTenantId || !user.username) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
        return;
    }

    const { addStock, ...restOfData } = updatedData;
    const validationResult = inventoryItemServerSchema.partial().safeParse(restOfData);
    const addStockValidation = z.coerce.number().int().optional().safeParse(addStock);

    if (!validationResult.success || !addStockValidation.success) {
        const errors = validationResult.success ? [] : validationResult.error.errors.map(e => e.message);
        if(!addStockValidation.success) errors.push("Stock to add must be a whole number.");
        toast({ title: "Invalid Data", description: errors.join('\n'), variant: "destructive" });
        return;
    }

    const itemDocRef = doc(db, INVENTORY_COLLECTION, id);
    try {
      const batch = writeBatch(db);
      
      const itemSnap = await getDoc(itemDocRef);
      if (!itemSnap.exists()) {
          toast({ title: "Error", description: "Item not found.", variant: "destructive" });
          return;
      }
      const currentItemData = itemSnap.data() as InventoryItem;

      const updatePayload: any = { ...validationResult.data };
      
      if (addStock && addStock !== 0) {
        const currentStock = currentItemData.quantity;
        if (currentStock + addStock < 0) {
            toast({ title: "Invalid Operation", description: "Not enough stock to remove.", variant: "destructive" });
            return;
        }

        updatePayload.quantity = increment(addStock);
        
        const movementRef = doc(collection(db, STOCK_MOVEMENTS_COLLECTION));
        batch.set(movementRef, {
            inventoryItemId: id,
            tenantId: user.activeTenantId,
            type: addStock > 0 ? 'addition' : 'adjustment',
            quantity: addStock,
            referenceId: 'Manual Stock Update',
            createdAt: serverTimestamp(),
            createdByName: user.username,
        });
        
        const newQuantity = currentItemData.quantity + addStock;
        if (newQuantity <= currentItemData.reorderPoint && currentItemData.quantity > currentItemData.reorderPoint) {
            const usersSnapshot = await getDocs(query(collection(db, USERS_COLLECTION), where(`tenants.${user.activeTenantId}`, 'in', ['admin', 'owner'])));
            usersSnapshot.docs.forEach(userDoc => {
                const notificationRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
                batch.set(notificationRef, {
                    recipientUid: userDoc.id, senderName: "System", 
                    messageKey: 'notifications.inventory.low_stock',
                    messageParams: { item: currentItemData.name, count: newQuantity },
                    link: `/inventory/${id}/edit`, read: false, createdAt: serverTimestamp(), type: 'low-stock'
                });
            });
        }
      }
      
      batch.update(itemDocRef, updatePayload);
      
      const usersSnapshot = await getDocs(query(collection(db, USERS_COLLECTION), where(`tenants.${user.activeTenantId}`, 'in', ['admin', 'owner'])));
      usersSnapshot.docs.forEach(userDoc => {
          if (userDoc.id !== user.uid) {
              const notificationRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
              batch.set(notificationRef, {
                  recipientUid: userDoc.id, senderName: user.username,
                  messageKey: 'notifications.inventory.item_updated',
                  messageParams: { user: user.username, item: updatedData.name || currentItemData.name },
                  link: `/inventory/${id}/edit`, read: false, createdAt: serverTimestamp(), type: 'inventory'
              });
          }
      });
      
      await batch.commit();
      
      toast({
        title: "Item Updated",
        description: `Item has been successfully updated.`,
      });
    } catch (error) {
      console.error("Error updating inventory item:", error);
      toast({ title: "Error", description: "Failed to update inventory item.", variant: "destructive" });
    }
  }, [toast, user]);


  const deleteInventoryItem = useCallback(async (id: string) => {
    if (user?.activeRole === 'staff') {
      toast({ title: "Permission Denied", description: "You do not have permission to delete items.", variant: "destructive" });
      return;
    }
    if (!user?.activeTenantId || !user.username) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
        return;
    }
    const itemToDelete = inventory.find(item => item.id === id);
    if (!itemToDelete) return;

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, INVENTORY_COLLECTION, id));
      
      const usersSnapshot = await getDocs(query(collection(db, USERS_COLLECTION), where(`tenants.${user.activeTenantId}`, 'in', ['admin', 'owner'])));
      usersSnapshot.docs.forEach(userDoc => {
          if (userDoc.id !== user.uid) {
              const notificationRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
              batch.set(notificationRef, {
                  recipientUid: userDoc.id, senderName: user.username,
                  messageKey: 'notifications.inventory.item_deleted',
                  messageParams: { user: user.username, item: itemToDelete.name },
                  link: `/inventory`, read: false, createdAt: serverTimestamp(), type: 'inventory'
              });
          }
      });

      await batch.commit();

      toast({
        title: "Item Deleted",
        description: `Item '${itemToDelete.name}' has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      toast({ title: "Error", description: "Failed to delete inventory item.", variant: "destructive" });
    }
  }, [inventory, toast, user]);
  

  return { inventory, isLoading, addInventoryItem, getInventoryItem, updateInventoryItem, deleteInventoryItem, addInventoryShipment };
}
