
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Wallet, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExpenses } from '@/hooks/use-expenses';
import ExpenseList from '@/components/expense-list';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { exportToCsv } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';

export default function ExpensesPage() {
  const { expenses, isLoading, deleteExpense } = useExpenses();
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();

  const displayedExpenses = useMemo(() => {
    let items = expenses;
    if (user?.activeRole === 'staff') {
      items = items.filter(expense => expense.createdBy === user.uid);
    }
    
    if (!searchTerm) {
      return items;
    }

    return items.filter(
      (expense) =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [expenses, searchTerm, user]);
  
  const handleExport = () => {
    const dataToExport = displayedExpenses.map(expense => ({
      id: expense.id,
      date: format(new Date(expense.date), 'yyyy-MM-dd'),
      category: expense.category,
      description: expense.description,
      vendor: expense.vendor || 'N/A',
      amount: expense.amount.toFixed(2),
      createdBy: expense.createdByName,
    }));

    const headers = {
      id: 'Expense ID',
      date: 'Date',
      category: 'Category',
      description: 'Description',
      vendor: 'Vendor',
      amount: 'Amount (Rs.)',
      createdBy: 'Recorded By',
    };

    exportToCsv(dataToExport, `expenses-${new Date().toISOString().split('T')[0]}`, headers);
  };

  const pageTitle = user?.activeRole === 'staff' ? "My Expenses" : t('expenses.title');
  const pageDesc = user?.activeRole === 'staff' ? "Manage all expenses you have created." : t('expenses.desc');


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            {pageTitle}
          </h1>
          <p className="text-muted-foreground">
            {pageDesc}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                {t('expenses.export')}
            </Button>
            <Link href="/expenses/new" passHref>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('expenses.new')}
              </Button>
            </Link>
        </div>
      </div>

       {isLoading ? (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
      ) : displayedExpenses.length > 0 ? (
        <>
          <div className="mb-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                type="text"
                placeholder={t('expenses.search_placeholder')}
                className="w-full py-3 pl-10 pr-4 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
          <ExpenseList expenses={displayedExpenses} deleteExpense={deleteExpense} />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-card/50 p-12 text-center">
          <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold font-headline">{t('expenses.no_expenses_title')}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('expenses.no_expenses_desc')}
          </p>
          <Link href="/expenses/new" passHref>
            <Button className="mt-6">
              <Plus className="mr-2 h-4 w-4" />
              {t('expenses.add_expense_btn')}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
