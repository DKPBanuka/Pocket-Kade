
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { Customer } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { customerServerSchema } from '@/lib/schemas';

const CUSTOMERS_COLLECTION = 'customers';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.activeTenantId) {
        setIsLoading(false);
        setCustomers([]);
        return;
    };

    const q = query(
        collection(db, CUSTOMERS_COLLECTION), 
        where("tenantId", "==", user.activeTenantId),
        orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const customersData: Customer[] = snapshot.docs.map(doc => {
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

          return {
            id: doc.id,
            ...data,
            createdAt: normalizedCreatedAt,
          } as Customer;
        });
        setCustomers(customersData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Firebase snapshot error:", error);
        toast({ title: "Error loading customers", description: "Could not fetch customers from the database.", variant: "destructive" });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast, user]);

  const addCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'createdAt' | 'tenantId'>) => {
     if (!user?.activeTenantId) {
      toast({ title: "Error", description: "No active organization selected.", variant: "destructive" });
      return;
    }

    const dataWithTenant = { ...customerData, tenantId: user.activeTenantId };
    const validationResult = customerServerSchema.safeParse(dataWithTenant);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(e => e.message).join('\n');
      toast({
        title: "Invalid Customer Data",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    try {
      await addDoc(collection(db, CUSTOMERS_COLLECTION), {
        ...validationResult.data,
        createdAt: serverTimestamp(),
      });
      toast({
        title: "Customer Added",
        description: `${customerData.name} has been added.`,
      });
    } catch (error) {
      console.error("Error adding customer:", error);
      toast({ title: "Error", description: "Failed to add customer.", variant: "destructive" });
    }
  }, [toast, user]);

  const getCustomer = useCallback((id: string) => {
    return customers.find(c => c.id === id);
  }, [customers]);

  const updateCustomer = useCallback(async (id: string, updatedData: Partial<Omit<Customer, 'id' | 'createdAt' | 'tenantId'>>) => {
    const validationResult = customerServerSchema.partial().safeParse(updatedData);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(e => e.message).join('\n');
      toast({
        title: "Invalid Customer Data",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }
    
    const customerDocRef = doc(db, CUSTOMERS_COLLECTION, id);
    try {
      await updateDoc(customerDocRef, validationResult.data);
      toast({
        title: "Customer Updated",
        description: `Customer has been successfully updated.`,
      });
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({ title: "Error", description: "Failed to update customer.", variant: "destructive" });
    }
  }, [toast]);

  const deleteCustomer = useCallback(async (id: string) => {
    const customerToDelete = customers.find(c => c.id === id);
    if (!customerToDelete) return;
    try {
      await deleteDoc(doc(db, CUSTOMERS_COLLECTION, id));
      toast({
        title: "Customer Deleted",
        description: `Customer '${customerToDelete.name}' has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({ title: "Error", description: "Failed to delete customer.", variant: "destructive" });
    }
  }, [customers, toast]);

  return { customers, isLoading, addCustomer, getCustomer, updateCustomer, deleteCustomer };
}
