
"use client";

import type { Invoice, LineItem, Organization, Payment } from '@/lib/types';
import { format } from 'date-fns';

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


export default function ModernTemplate({ invoice, organization, invoiceColor }: TemplateProps) {
  const color = invoiceColor || '#ec4899'; // Default pink
  
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
      <header className="relative p-6 sm:p-8 text-primary-foreground" style={{ backgroundColor: color }}>
        <div className="absolute top-0 right-0 h-full w-1/2 bg-black/10" style={{ clipPath: 'polygon(25% 0, 100% 0, 100% 100%, 0% 100%)'}}></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex items-center gap-4">
                {organization?.name && (
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg flex items-center justify-center font-bold text-2xl sm:text-3xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                        {organization.name.charAt(0)}
                    </div>
                )}
                <div className="max-w-[250px]">
                    <h1 className="text-xl sm:text-2xl font-bold">{organization?.name || "Your Company"}</h1>
                    {organization?.address && <p className="text-xs mt-1 whitespace-pre-line">{organization.address}</p>}
                    {organization?.phone && <p className="text-xs mt-1">{organization.phone}</p>}
                </div>
            </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">INVOICE</h2>
            <p className="mt-1 text-sm">{invoice.id}</p>
          </div>
        </div>
      </header>

      <section className="p-6 sm:p-8 grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Billed To</h3>
          <p className="font-bold text-base text-foreground mt-1">{invoice.customerName || 'Walk-in Customer'}</p>
          {invoice.customerPhone && <p className="text-muted-foreground">{invoice.customerPhone}</p>}
        </div>
        <div className="text-left md:text-right">
          <h3 className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Invoice Date</h3>
          <p className="font-medium text-base text-foreground mt-1">{format(new Date(invoice.createdAt), 'MMMM dd, yyyy')}</p>
        </div>
      </section>

      <section className="px-6 sm:px-8">
        <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left">
            <thead>
                <tr style={{ backgroundColor: color }} className="text-primary-foreground">
                <th className="p-2 sm:p-3 font-bold uppercase tracking-wider text-xs text-center">No.</th>
                <th className="p-2 sm:p-3 font-bold uppercase tracking-wider text-xs w-5/12">Product Description</th>
                <th className="p-2 sm:p-3 font-bold uppercase tracking-wider text-xs text-right">Price</th>
                <th className="p-2 sm:p-3 font-bold uppercase tracking-wider text-xs text-center">Quantity</th>
                <th className="p-2 sm:p-3 font-bold uppercase tracking-wider text-xs">Warranty</th>
                <th className="p-2 sm:p-3 font-bold uppercase tracking-wider text-xs text-right">Total</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border">
                {invoice.lineItems.map((item, index) => {
                    const warrantyEndDate = getWarrantyEndDate(invoice.createdAt, item.warrantyPeriod);
                    return (
                        <tr key={item.id}>
                            <td className="p-2 sm:p-3 text-center text-muted-foreground">{String(index + 1).padStart(2, '0')}</td>
                            <td className="p-2 sm:p-3 font-medium text-foreground">{item.description}</td>
                            <td className="p-2 sm:p-3 text-right text-muted-foreground">Rs.{item.price.toFixed(2)}</td>
                            <td className="p-2 sm:p-3 text-center text-muted-foreground">{item.quantity}</td>
                            <td className="p-2 sm:p-3 text-xs">
                                <p className="font-medium">{item.warrantyPeriod}</p>
                                {warrantyEndDate !== 'N/A' && (
                                    <p className="text-muted-foreground">Ends: {warrantyEndDate}</p>
                                )}
                            </td>
                            <td className="p-2 sm:p-3 text-right font-medium">Rs.{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    )
                })}
            </tbody>
            </table>
        </div>
      </section>

      <section className="p-6 sm:p-8 mt-4 flex justify-end">
        <div className="w-full max-w-xs space-y-3 text-foreground">
          {invoice.status === 'Paid' ? (
              <>
                  <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Subtotal:</span>
                      <span className="font-medium">Rs.{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{discountLabel}:</span>
                          <span className="font-medium">-Rs.{discountAmount.toFixed(2)}</span>
                      </div>
                  )}
                  <hr className="my-2 border-border" />
                  <div className="flex justify-between items-center p-3 rounded-md" style={{ backgroundColor: `${color}1A`}}>
                      <span className="font-bold text-base" style={{color}}>TOTAL PAID</span>
                      <span className="font-bold text-xl" style={{color}}>Rs.{total.toFixed(2)}</span>
                  </div>
              </>
          ) : (
              <>
                  <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Subtotal:</span>
                      <span className="font-medium">Rs.{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{discountLabel}:</span>
                          <span className="font-medium">-Rs.{discountAmount.toFixed(2)}</span>
                      </div>
                  )}
                  <hr className="my-2 border-border" />
                  <div className="flex justify-between text-sm">
                      <span className="font-semibold text-foreground">Total:</span>
                      <span className="font-semibold">Rs.{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Amount Paid:</span>
                      <span className="font-medium">-Rs.{amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-md" style={{ backgroundColor: `${color}1A`}}>
                      <span className="font-bold text-base" style={{color}}>AMOUNT DUE</span>
                      <span className="font-bold text-xl" style={{color}}>Rs.{amountDue.toFixed(2)}</span>
                  </div>
              </>
          )}
        </div>
      </section>

      <footer className="mt-8 sm:mt-16 p-6 sm:p-8 text-center text-sm text-muted-foreground">
        <p className="print-hide">Created by: {invoice.createdByName}</p>
        <p className="mt-2">{organization?.invoiceThankYouMessage || 'Thank you for your business!'}</p>
        <p className="font-bold mt-1">
          {organization?.phone || 'your phone'} | {organization?.email || 'your email'}
        </p>
      </footer>
    </div>
  );
}
