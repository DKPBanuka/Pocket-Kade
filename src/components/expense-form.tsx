
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { useExpenses } from '@/hooks/use-expenses';
import type { Expense, ExpenseCategory } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useLanguage } from '@/contexts/language-context';

const expenseCategories: ExpenseCategory[] = ['Rent', 'Salaries', 'Utilities', 'Marketing', 'Purchases', 'Other'];

const formSchema = z.object({
  date: z.date({ required_error: "A date is required."}),
  category: z.enum(['Rent', 'Salaries', 'Utilities', 'Marketing', 'Purchases', 'Other']),
  amount: z.coerce.number().min(0.01, 'Amount must be a positive number'),
  description: z.string().min(2, 'Description is required'),
  vendor: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  expense?: Expense;
  onFinished?: () => void;
}

export default function ExpenseForm({ expense, onFinished }: ExpenseFormProps) {
  const { addExpense, updateExpense } = useExpenses();
  const router = useRouter();
  const isEditMode = !!expense;
  const { t } = useLanguage();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditMode
        ? { 
            date: new Date(expense.date),
            category: expense.category,
            amount: expense.amount,
            description: expense.description,
            vendor: expense.vendor || '',
        }
        : { 
            date: new Date(),
            category: 'Other',
            amount: 0,
            description: '',
            vendor: '',
        },
  });

  async function onSubmit(values: ExpenseFormData) {
    const dataForDb = { ...values, date: values.date.toISOString() };
    if (isEditMode && expense) {
        await updateExpense(expense.id, dataForDb);
    } else {
        await addExpense(dataForDb);
    }
    
    if (onFinished) {
      onFinished();
    } else {
      router.push('/expenses');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="p-6 grid gap-6">
            <div className="grid md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>{t('expenses.form.date')}</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>{t('expenses.form.pick_date')}</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('expenses.form.amount')}</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} onFocus={(e) => e.target.select()} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

             <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('expenses.form.description')}</FormLabel>
                    <FormControl>
                        <Input placeholder={t('expenses.form.description_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <div className="grid md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('expenses.form.category')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={t('expenses.form.category_placeholder')} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {expenseCategories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{t(`expenses.category.${cat.toLowerCase()}`)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="vendor"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('expenses.form.vendor')}</FormLabel>
                        <FormControl>
                            <Input placeholder={t('expenses.form.vendor_placeholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isEditMode ? t('expenses.edit.saving') : t('expenses.new.saving')}
              </>
            ) : (
                isEditMode ? t('expenses.edit.save_btn') : t('expenses.new.save_btn')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
