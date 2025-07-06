
"use client";

import Link from 'next/link';
import type { Customer } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Phone, Mail } from 'lucide-react';
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
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

interface CustomerListProps {
  customers: Customer[];
  deleteCustomer: (id: string) => void;
}

function DeleteDialog({ customer, deleteCustomer, asChild, children }: { customer: Customer; deleteCustomer: (id: string) => void; asChild?: boolean; children: React.ReactNode; }) {
  const { t } = useLanguage();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild={asChild} onClick={(e) => { e.stopPropagation(); }}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('customers.edit.delete_confirm_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('customers.edit.delete_confirm_desc', { customerName: customer.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('general.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteCustomer(customer.id)} className="bg-destructive hover:bg-destructive/90">
            {t('general.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function CustomerList({ customers, deleteCustomer }: CustomerListProps) {
  const { t } = useLanguage();
  if (customers.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>{t('customers.no_match')}</p>
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
              <TableHead>{t('customers.table.name')}</TableHead>
              <TableHead>{t('customers.table.phone')}</TableHead>
              <TableHead>{t('customers.table.email')}</TableHead>
              <TableHead className="w-[140px] text-right">{t('customers.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id} className="cursor-pointer" onClick={() => window.location.href = `/customers/${customer.id}`}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>
                  {customer.phone ? <a href={`tel:${customer.phone}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>{customer.phone}</a> : <span className="text-muted-foreground">N/A</span>}
                </TableCell>
                <TableCell>
                  {customer.email ? <a href={`mailto:${customer.email}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>{customer.email}</a> : <span className="text-muted-foreground">N/A</span>}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Link href={`/customers/${customer.id}/edit`} passHref onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit Customer</span>
                    </Button>
                  </Link>
                  <DeleteDialog customer={customer} deleteCustomer={deleteCustomer} asChild>
                    <Button variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Customer</span>
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
        {customers.map((customer) => (
          <div key={customer.id} className="relative">
            <Link href={`/customers/${customer.id}`} className="block group">
                <Card className="transition-shadow group-hover:shadow-md">
                    <CardContent className="p-4">
                        <p className="font-semibold text-base pr-10">{customer.name}</p>
                        <div className="text-sm text-muted-foreground mt-2 space-y-1">
                            {customer.phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{customer.phone}</span>
                            </div>
                            )}
                            {customer.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>{customer.email}</span>
                            </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </Link>
            <div className="absolute top-2 right-2 z-10">
                <DeleteDialog customer={customer} deleteCustomer={deleteCustomer} asChild>
                    <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Customer</span>
                    </Button>
                </DeleteDialog>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
