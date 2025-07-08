
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { Expense } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { expenseServerSchema } from '@/lib/schemas';

const EXPENSES_COLLECTION = 'expenses';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.activeTenantId) {
        setIsLoading(false);
        setExpenses([]);
        return;
    };

    const q = query(
        collection(db, EXPENSES_COLLECTION),
        where("tenantId", "==", user.activeTenantId),
        orderBy("date", "desc")
    );
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const expensesData: Expense[] = snapshot.docs.map(doc => {
          const data = doc.data();
          
          const normalizeTimestamp = (ts: any): string => {
            if (!ts) return new Date().toISOString();
            if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
            if (typeof ts.seconds === 'number') return new Date(ts.seconds * 1000).toISOString();
            if (typeof ts === 'string' && !isNaN(new Date(ts).getTime())) return ts;
            if (doc.metadata.hasPendingWrites) return new Date().toISOString();
            return new Date().toISOString();
          }

          return {
            id: doc.id,
            ...data,
            createdAt: normalizeTimestamp(data.createdAt),
            date: normalizeTimestamp(data.date),
          } as Expense;
        });
        setExpenses(expensesData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Firebase snapshot error:", error);
        toast({ title: "Error loading expenses", description: "Could not fetch expenses from the database.", variant: "destructive" });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast, user]);
  
  const addExpense = useCallback(async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'createdBy' | 'createdByName' | 'tenantId'>) => {
     if (!user?.activeTenantId || !user.username) {
      toast({ title: "Error", description: "No active organization selected.", variant: "destructive" });
      return;
    }
    
    const dataToValidate = { 
        ...expenseData, 
        tenantId: user.activeTenantId,
        createdBy: user.uid,
        createdByName: user.username,
    };
    
    const validationResult = expenseServerSchema.safeParse(dataToValidate);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(e => e.message).join('\n');
      toast({ title: "Invalid Expense Data", description: errorMessage, variant: "destructive" });
      return;
    }

    try {
      await addDoc(collection(db, EXPENSES_COLLECTION), {
        ...validationResult.data,
        date: new Date(validationResult.data.date), // Store as Firestore timestamp
        createdAt: serverTimestamp(),
      });
      toast({ title: "Expense Added", description: `The expense has been added.` });
    } catch (error) {
      console.error("Error adding expense:", error);
      toast({ title: "Error", description: "Failed to add expense.", variant: "destructive" });
    }
  }, [toast, user]);

  const getExpense = useCallback((id: string) => {
    return expenses.find(e => e.id === id);
  }, [expenses]);

  const updateExpense = useCallback(async (id: string, updatedData: Partial<Omit<Expense, 'id' | 'createdAt' | 'createdBy' | 'createdByName' | 'tenantId'>>) => {
    if (!user?.activeTenantId) {
      toast({ title: "Error", description: "No active organization selected.", variant: "destructive" });
      return;
    }

    const existingExpense = expenses.find(e => e.id === id);
    if (!existingExpense) {
      toast({ title: "Error", description: "Expense not found.", variant: "destructive" });
      return;
    }
    
    const validationResult = expenseServerSchema.partial().safeParse(updatedData);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(e => e.message).join('\n');
      toast({ title: "Invalid Expense Data", description: errorMessage, variant: "destructive" });
      return;
    }
    
    const expenseDocRef = doc(db, EXPENSES_COLLECTION, id);
    try {
      const finalDataToUpdate: any = { ...validationResult.data };
      
      if (finalDataToUpdate.date) {
        finalDataToUpdate.date = new Date(finalDataToUpdate.date);
      }
      
      await updateDoc(expenseDocRef, finalDataToUpdate);
      toast({ title: "Expense Updated", description: `Expense has been successfully updated.` });
    } catch (error) {
      console.error("Error updating expense:", error);
      toast({ title: "Error", description: "Failed to update expense.", variant: "destructive" });
    }
  }, [expenses, toast, user]);

  const deleteExpense = useCallback(async (id: string) => {
    const expenseToDelete = expenses.find(e => e.id === id);
    if (!expenseToDelete) return;
    try {
      await deleteDoc(doc(db, EXPENSES_COLLECTION, id));
      toast({ title: "Expense Deleted", description: `Expense has been deleted.` });
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({ title: "Error", description: "Failed to delete expense.", variant: "destructive" });
    }
  }, [expenses, toast]);

  return { expenses, isLoading, addExpense, getExpense, updateExpense, deleteExpense };
}
