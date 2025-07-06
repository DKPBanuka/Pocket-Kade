
"use client";

import Link from 'next/link';
import type { Expense } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/language-context';

function DeleteDialog({ expense, deleteExpense, asChild, children, t }: { expense: Expense; deleteExpense: (id: string) => void; asChild?: boolean; children: React.ReactNode; t: (key: string, params?: any) => string; }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild={asChild} onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('general.delete_confirm_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('expenses.delete_confirm_desc', { expenseDesc: expense.description })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('general.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteExpense(expense.id)} className="bg-destructive hover:bg-destructive/90">
            {t('general.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface ExpenseListProps {
  expenses: Expense[];
  deleteExpense: (id: string) => void;
}

export default function ExpenseList({ expenses, deleteExpense }: ExpenseListProps) {
  const { t } = useLanguage();

  if (expenses.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>{t('expenses.no_match')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop View: Table */}
      <div className="hidden md:block rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('expenses.table.date')}</TableHead>
              <TableHead>{t('expenses.table.description')}</TableHead>
              <TableHead>{t('expenses.table.category')}</TableHead>
              <TableHead className="text-right">{t('expenses.table.amount')}</TableHead>
              <TableHead className="w-[140px] text-right">{t('expenses.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{format(new Date(expense.date), 'PPP')}</TableCell>
                <TableCell className="font-medium">{expense.description}</TableCell>
                <TableCell>{t(`expenses.category.${expense.category.toLowerCase()}`)}</TableCell>
                <TableCell className="text-right">Rs.{expense.amount.toFixed(2)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Link href={`/expenses/${expense.id}/edit`} passHref>
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit Expense</span>
                    </Button>
                  </Link>
                  <DeleteDialog expense={expense} deleteExpense={deleteExpense} t={t} asChild>
                    <Button variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Expense</span>
                    </Button>
                  </DeleteDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View: Cards */}
      <div className="md:hidden space-y-3">
        {expenses.map((expense) => (
          <div key={expense.id} className="relative">
            <Link href={`/expenses/${expense.id}/edit`} className="block group">
              <Card className="transition-shadow hover:shadow-md">
                <div className="p-4">
                    <div className="flex items-center justify-between gap-4 pr-8">
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold text-base break-words">{expense.description}</p>
                            <p className="text-sm text-muted-foreground">{format(new Date(expense.date), 'PPP')}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="font-bold text-lg text-primary">Rs.{expense.amount.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{t(`expenses.category.${expense.category.toLowerCase()}`)}</p>
                        </div>
                    </div>
                </div>
              </Card>
            </Link>
            <div className="absolute top-2 right-2 z-10">
              <DeleteDialog expense={expense} deleteExpense={deleteExpense} t={t} asChild>
                  <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete Expense</span>
                  </Button>
              </DeleteDialog>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
