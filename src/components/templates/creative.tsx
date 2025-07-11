
"use client";

import type { Invoice, LineItem, Organization } from '@/lib/types';
import { format } from 'date-fns';
import { FileText, Feather, Phone, Mail, MapPin } from 'lucide-react';

interface TemplateProps {
  invoice: Invoice;
  organization: Organization | null;
  invoiceColor?: string | null;
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


export default function CreativeTemplate({ invoice, organization, invoiceColor }: TemplateProps) {
  const color = invoiceColor || '#0ea5e9'; // A vibrant blue

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
    <div className="w-full bg-card text-card-foreground font-sans text-sm shadow-lg">
      <header className="relative bg-muted overflow-hidden">
        <div className="absolute inset-0">
            <svg width="100%" height="100%" preserveAspectRatio="xMinYMin slice" viewBox="0 0 800 220" className="absolute inset-0 h-full w-full">
                <path d="M 0 0 L 800 0 L 800 120 Q 400 200 0 120 Z" fill={color}></path>
            </svg>
        </div>
        <div className="relative z-10 p-6 sm:p-8">
            <div className="flex justify-between items-start mb-4">
                <div className="text-primary-foreground">
                    <h1 className="text-xl sm:text-2xl font-bold font-headline">{organization?.name || 'Pocket Kade'}</h1>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-primary-foreground uppercase">Invoice</h2>
                </div>
            </div>
            
             <div className="pt-4 sm:pt-8">
                <div className="space-y-3 text-foreground text-xs sm:text-sm">
                    <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span className="text-base">{organization?.phone || '+0123 456 7895'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span className="text-base">{organization?.email || 'your-email@example.com'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span className="text-base max-w-xs">{organization?.address || 'Your Address, City, Country'}</span>
                    </div>
                </div>
            </div>
        </div>
      </header>

      <main className="p-6 sm:p-8 -mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start pt-4 mb-8 bg-card p-4 rounded-lg shadow-sm gap-4">
            <div className="text-xs">
                <p className="font-bold text-muted-foreground">Invoice Details</p>
                <p className="mt-1 text-foreground">Invoice Date: {format(new Date(invoice.createdAt), 'dd/MM/yyyy')}</p>
                <p className="text-foreground">Invoice No: {invoice.id}</p>
            </div>
            <div className="w-full sm:w-[1px] sm:bg-border sm:h-16 self-center border-t sm:border-t-0"></div>
            <div className="text-xs sm:text-right w-full sm:w-auto">
                <p className="font-bold text-muted-foreground">Bill to</p>
                <p className="font-bold text-base mt-1 text-foreground">{invoice.customerName || 'Walk-in Customer'}</p>
                {invoice.customerPhone && <p className="text-muted-foreground">{invoice.customerPhone}</p>}
            </div>
        </div>

        <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left">
            <thead>
                <tr style={{ backgroundColor: color }} className="text-primary-foreground text-xs">
                <th className="p-2 sm:p-3 font-bold uppercase tracking-wider w-12 text-center rounded-l-md">No.</th>
                <th className="p-2 sm:p-3 font-bold uppercase tracking-wider">Product Description</th>
                <th className="p-2 sm:p-3 font-bold uppercase tracking-wider text-right">Unit Price</th>
                <th className="p-2 sm:p-3 font-bold uppercase tracking-wider text-center">Qty</th>
                <th className="p-2 sm:p-3 font-bold uppercase tracking-wider">Warranty</th>
                <th className="p-2 sm:p-3 font-bold uppercase tracking-wider text-right rounded-r-md">Total</th>
                </tr>
            </thead>
            <tbody>
                {invoice.lineItems.map((item, index) => {
                    const warrantyEndDate = getWarrantyEndDate(invoice.createdAt, item.warrantyPeriod);
                    return (
                        <tr key={item.id} className="border-b border-muted/50">
                            <td className="p-2 sm:p-3 text-center font-semibold text-muted-foreground">{String(index + 1).padStart(2, '0')}</td>
                            <td className="p-2 sm:p-3 font-semibold text-foreground">{item.description}</td>
                            <td className="p-2 sm:p-3 text-right text-muted-foreground">Rs.{item.price.toFixed(2)}</td>
                            <td className="p-2 sm:p-3 text-center text-muted-foreground">{item.quantity}</td>
                            <td className="p-2 sm:p-3 text-xs">
                                <p className="font-medium">{item.warrantyPeriod}</p>
                                {warrantyEndDate !== 'N/A' && (
                                    <p className="text-muted-foreground">Ends: {warrantyEndDate}</p>
                                )}
                            </td>
                            <td className="p-2 sm:p-3 text-right font-semibold text-foreground">Rs.{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    )
                })}
            </tbody>
            </table>
        </div>
      </main>

      <footer className="px-6 sm:px-8 mt-8 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 items-end gap-4">
            <div className="text-xs space-y-4">
                 <div className="print-hide">
                    <p className="font-bold mb-1 text-foreground">Notes</p>
                    <p className="text-muted-foreground max-w-xs">{organization?.invoiceThankYouMessage || 'Please make the payment by the due date.'}</p>
                </div>
            </div>
          <div className="text-right space-y-2 text-sm text-foreground">
            {invoice.status === 'Paid' ? (
                <>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Sub Total:</span>
                        <span className="font-medium">Rs.{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                            <span>{discountLabel}:</span>
                            <span className="font-medium">-Rs.{discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="border-t border-border pt-2 mt-2">
                        <div className="flex justify-between font-bold text-lg" style={{ color }}>
                            <span>TOTAL PAID:</span>
                            <span>Rs.{total.toFixed(2)}</span>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Sub Total:</span>
                        <span className="font-medium">Rs.{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                            <span>{discountLabel}:</span>
                            <span className="font-medium">-Rs.{discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="border-t border-border pt-2 mt-2">
                        <div className="flex justify-between font-bold text-base">
                            <span>Total:</span>
                            <span>Rs.{total.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Amount Paid:</span>
                        <span className="font-medium">-Rs.{amountPaid.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-border pt-2 mt-2">
                        <div className="flex justify-between font-bold text-lg" style={{ color }}>
                            <span>AMOUNT DUE:</span>
                            <span>Rs.{amountDue.toFixed(2)}</span>
                        </div>
                    </div>
                </>
            )}
            {organization?.invoiceSignature && (
                <div className="pt-12">
                    <div className="border-t-2 border-border w-48 ml-auto"></div>
                    <p className="mt-2 font-semibold text-foreground">{organization.invoiceSignature}</p>
                    <p className="text-xs text-muted-foreground print-hide">Created by: {invoice.createdByName}</p>
                </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
