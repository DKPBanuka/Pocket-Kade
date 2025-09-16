
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { Supplier } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, where, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { supplierServerSchema } from '@/lib/schemas';

const SUPPLIERS_COLLECTION = 'suppliers';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.activeTenantId || user.activeRole === 'staff') {
        setIsLoading(false);
        setSuppliers([]);
        return;
    };

    const q = query(
        collection(db, SUPPLIERS_COLLECTION),
        where("tenantId", "==", user.activeTenantId),
        orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const suppliersData: Supplier[] = snapshot.docs.map(doc => {
          const data = doc.data();
          const ts = data.createdAt;
          let normalizedCreatedAt: string;

          if (ts && typeof ts.toDate === 'function') {
            normalizedCreatedAt = ts.toDate().toISOString();
          } else if (ts && typeof ts.seconds === 'number') {
            normalizedCreatedAt = new Date(ts.seconds * 1000).toISOString();
          } else if (typeof ts === 'string' && !isNaN(new Date(ts).getTime())) {
            normalizedCreatedAt = ts;
          } else {
            normalizedCreatedAt = new Date().toISOString();
          }

          return {
            id: doc.id,
            ...data,
            createdAt: normalizedCreatedAt,
          } as Supplier;
        });
        setSuppliers(suppliersData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Firebase snapshot error:", error);
        toast({ title: "Error loading suppliers", description: "Could not fetch suppliers from the database.", variant: "destructive" });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast, user]);

  const addSupplier = useCallback(async (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'tenantId'>) => {
    if (!user?.activeTenantId) {
        toast({ title: "Error", description: "No active organization selected.", variant: "destructive" });
        return;
    }

    const dataWithTenant = { ...supplierData, tenantId: user.activeTenantId };
    const validationResult = supplierServerSchema.safeParse(dataWithTenant);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(e => e.message).join('\n');
      toast({
        title: "Invalid Supplier Data",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    try {
      await addDoc(collection(db, SUPPLIERS_COLLECTION), {
        ...validationResult.data,
        createdAt: new Date().toISOString(),
      });
      toast({
        title: "Supplier Added",
        description: `${supplierData.name} has been added.`,
      });
    } catch (error) {
      console.error("Error adding supplier:", error);
      toast({ title: "Error", description: "Failed to add supplier.", variant: "destructive" });
    }
  }, [toast, user]);

  const getSupplier = useCallback((id: string) => {
    return suppliers.find(s => s.id === id);
  }, [suppliers]);

  const updateSupplier = useCallback(async (id: string, updatedData: Partial<Omit<Supplier, 'id' | 'createdAt' | 'tenantId'>>) => {
    const validationResult = supplierServerSchema.partial().safeParse(updatedData);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(e => e.message).join('\n');
      toast({
        title: "Invalid Supplier Data",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    const supplierDocRef = doc(db, SUPPLIERS_COLLECTION, id);
    try {
      const docSnap = await getDoc(supplierDocRef);
      if (docSnap.exists()) {
        const existingData = docSnap.data();
        const finalData = Object.assign({}, existingData, validationResult.data);
        await updateDoc(supplierDocRef, finalData);
        toast({
          title: "Supplier Updated",
          description: `Supplier has been successfully updated.`,
        });
      } else {
        throw new Error("Supplier document not found");
      }
    } catch (error) {
      console.error("Error updating supplier:", error);
      toast({ title: "Error", description: "Failed to update supplier.", variant: "destructive" });
    }
  }, [toast]);

  const deleteSupplier = useCallback(async (id: string) => {
    const supplierToDelete = suppliers.find(s => s.id === id);
    if (!supplierToDelete) return;
    try {
      await deleteDoc(doc(db, SUPPLIERS_COLLECTION, id));
      toast({
        title: "Supplier Deleted",
        description: `Supplier '${supplierToDelete.name}' has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast({ title: "Error", description: "Failed to delete supplier.", variant: "destructive" });
    }
  }, [suppliers, toast]);

  return { suppliers, isLoading, addSupplier, getSupplier, updateSupplier, deleteSupplier };
}
