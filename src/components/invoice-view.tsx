
"use client";

import { useState } from 'react';
import type { Invoice, LineItem, Payment, Organization } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Eye, Printer } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

interface InvoiceViewProps {
  invoice: Invoice;
  organization: Organization | null;
  TemplateToRender: React.ElementType;
}

const getWarrantyEndDate = (startDate: string, warrantyPeriod: string): string => {
    const date = new Date(startDate);
    if (warrantyPeriod === 'N/A') return 'N/A';
    
    const parts = warrantyPeriod.split(' ');
    if (parts.length !== 2) return 'N/A';

    const value = parseInt(parts[0], 10);
    const unit = parts[1];

    if (isNaN(value)) return 'N/A';

    if (unit.startsWith('Week')) {
      date.setDate(date.getDate() + value * 7);
    } else if (unit.startsWith('Month')) {
      date.setMonth(date.getMonth() + value);
    } else if (unit.startsWith('Year')) {
      date.setFullYear(date.getFullYear() + value);
    } else {
        return 'N/A';
    }
    return format(date, 'PPP');
};

export default function InvoiceView({ invoice, organization, TemplateToRender }: InvoiceViewProps) {
  const { t } = useLanguage();
  
  const handlePrint = () => {
    document.body.classList.add('printing-preview');
    window.print();
    document.body.classList.remove('printing-preview');
  };
  
  const subtotal = invoice.lineItems.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0
  );
  
  let discountAmount = 0;
  let discountLabel = '';
  if (invoice.discountType === 'percentage') {
      discountAmount = subtotal * ((invoice.discountValue || 0) / 100);
      discountLabel = `Discount (${invoice.discountValue}%)`;
  } else if (invoice.discountType === 'fixed') {
      discountAmount = invoice.discountValue || 0;
      discountLabel = 'Discount';
  }

  const total = subtotal - discountAmount;
  const amountPaid = invoice.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
  const amountDue = total - amountPaid;
  
  return (
    <>
    <Card className="w-full rounded-xl shadow-lg">
      <CardHeader className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
             <h1 className="text-2xl font-bold font-headline text-foreground">
                {organization?.name || 'Your Company Name'}
            </h1>
          </div>
          <div className="text-left sm:text-right flex-shrink-0">
            <h2 className="text-3xl font-bold font-headline text-primary">INVOICE</h2>
            <p className="text-muted-foreground mt-1">{invoice.id}</p>
             <div className="mt-2">
                 <Badge className={cn(
                    "text-xs", 
                    invoice.status === 'Paid' && 'bg-accent text-accent-foreground',
                    invoice.status === 'Unpaid' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
                    invoice.status === 'Partially Paid' && 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
                    invoice.status === 'Cancelled' && 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                 )}>
                    {invoice.status}
                </Badge>
            </div>
          </div>
        </div>
        <Separator className="my-4 sm:my-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
            <div className="flex flex-col gap-4">
                <div>
                    <p className="text-muted-foreground font-semibold">Billed To</p>
                    <p className="font-medium text-lg">{invoice.customerName}</p>
                    {invoice.customerPhone && (
                        <a href={`tel:${invoice.customerPhone}`} className="text-muted-foreground hover:underline hover:text-primary">{invoice.customerPhone}</a>
                    )}
                </div>
                 <div>
                    <p className="text-muted-foreground font-semibold">Invoice Date</p>
                    <p>{format(new Date(invoice.createdAt), 'PPP')}</p>
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 md:p-8 pt-0">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
          <TableHeader>
              <TableRow>
              <TableHead className="w-2/5 sm:w-auto">Description</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead>Warranty</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              </TableRow>
          </TableHeader>
          <TableBody>
              {invoice.lineItems.map((item: LineItem) => {
              const warrantyEndDate = getWarrantyEndDate(invoice.createdAt, item.warrantyPeriod);
              return (
              <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">Rs.{item.price.toFixed(2)}</TableCell>
                  <TableCell>
                  <p className="font-medium">{item.warrantyPeriod}</p>
                  {warrantyEndDate !== 'N/A' && (
                      <p className="text-xs text-muted-foreground">Ends: {warrantyEndDate}</p>
                  )}
                  </TableCell>
                  <TableCell className="text-right">
                  Rs.{(item.quantity * item.price).toFixed(2)}
                  </TableCell>
              </TableRow>
              )})}
          </TableBody>
          </Table>
        </div>

        <Separator className="my-4 sm:my-6" />
        <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>Rs.{subtotal.toFixed(2)}</span>
                </div>
                 {(invoice.discountValue || 0) > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                        <span>{discountLabel}</span>
                        <span>-Rs.{discountAmount.toFixed(2)}</span>
                    </div>
                 )}
                 <Separator/>
                 <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>Rs.{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                    <span>Amount Paid</span>
                    <span>-Rs.{amountPaid.toFixed(2)}</span>
                </div>
                 <Separator/>
                 <div className="flex justify-between font-bold text-lg">
                    <span>Amount Due</span>
                    <span className="text-primary">Rs.{amountDue.toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        {invoice.payments && invoice.payments.length > 0 && (
            <div className="mt-8">
                <h3 className="font-semibold mb-2">Payment History</h3>
                <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoice.payments.map((p: Payment) => (
                        <TableRow key={p.id}>
                            <TableCell>{format(new Date(p.date), 'PPP')}</TableCell>
                            <TableCell>{p.method}</TableCell>
                            <TableCell className="text-right">Rs.{p.amount.toFixed(2)}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </div>
            </div>
        )}

      </CardContent>
       <CardFooter className="p-4 sm:p-6 md:p-8 pt-0 justify-end">
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <Eye className="mr-2 h-4 w-4"/> {t('invoice.view.preview')}
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 sm:p-0">
                    <DialogHeader className="p-4 border-b">
                         <DialogTitle>Invoice Preview</DialogTitle>
                         <DialogDescription>
                            This is how your invoice will look when printed.
                         </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto bg-muted/50 p-4 sm:p-8">
                        <div className="mx-auto my-auto">
                            <TemplateToRender
                                invoice={invoice}
                                organization={organization}
                                invoiceColor={organization?.invoiceColor}
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-4 border-t bg-background rounded-b-lg sm:justify-between">
                        <span className="text-xs text-muted-foreground print-hide">Tip: Use your browser's print options to save as PDF.</span>
                        <Button onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" /> {t('invoice.view.print')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
      </CardFooter>
    </Card>
    </>
  );
}
