
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

export default function CorporateTemplate({ invoice, organization, invoiceColor }: TemplateProps) {
  const color = invoiceColor || '#007bff'; // A default blue color

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
      <header className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-muted flex items-center justify-center rounded-lg">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold uppercase text-foreground">{organization?.name || "Company Name"}</h1>
              {organization?.address && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{organization.address}</p>}
              {organization?.phone && <p className="text-xs text-muted-foreground mt-1">{organization.phone}</p>}
            </div>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ color: color }}>INVOICE</h2>
            <div className="mt-2 text-xs text-muted-foreground">
              <p><span className="font-bold text-foreground">Invoice Number:</span> {invoice.id}</p>
              <p><span className="font-bold text-foreground">Invoice Date:</span> {format(new Date(invoice.createdAt), 'MMMM dd, yyyy')}</p>
            </div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-sm" style={{ color: color }}>INVOICE TO:</h3>
            <p className="font-bold mt-1 text-base text-foreground">{invoice.customerName}</p>
            {invoice.customerPhone && <p className="text-muted-foreground text-sm">Phone: {invoice.customerPhone}</p>}
          </div>
        </div>
      </header>

      <main className="px-6 sm:px-8 mt-4">
        <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left">
            <thead>
                <tr style={{ backgroundColor: color }} className="text-primary-foreground">
                <th className="p-2 sm:p-3 font-bold uppercase tracking-wider text-xs w-12">No.</th>
                <th className="p-2 sm:p-3 font-bold uppercase tracking-wider text-xs">Product Description</th>
                <th className="p-2 sm:p-3 font-bold uppercase tracking-wider text-xs text-right">Price</th>
                <th className="p-2 sm:p-3 font-bold uppercase tracking-wider text-xs text-center">Quantity</th>
                <th className="p-2 sm:p-3 font-bold uppercase tracking-wider text-xs">Warranty</th>
                <th className="p-2 sm:p-3 font-bold uppercase tracking-wider text-xs text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                {invoice.lineItems.map((item, index) => {
                    const warrantyEndDate = getWarrantyEndDate(invoice.createdAt, item.warrantyPeriod);
                    return (
                        <tr key={item.id} className="border-b border-border">
                            <td className="p-2 sm:p-3 text-center text-muted-foreground">{String(index + 1).padStart(2, '0')}</td>
                            <td className="p-2 sm:p-3 text-foreground">{item.description}</td>
                            <td className="p-2 sm:p-3 text-right text-muted-foreground">Rs.{item.price.toFixed(2)}</td>
                            <td className="p-2 sm:p-3 text-center text-muted-foreground">{item.quantity}</td>
                            <td className="p-2 sm:p-3 text-xs">
                                <p className="font-medium">{item.warrantyPeriod}</p>
                                {warrantyEndDate !== 'N/A' && (
                                    <p className="text-muted-foreground">Ends: {warrantyEndDate}</p>
                                )}
                            </td>
                            <td className="p-2 sm:p-3 text-right font-medium text-foreground">Rs.{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    )
                })}
            </tbody>
            </table>
        </div>
      </main>

      <footer className="p-6 sm:p-8 mt-8">
        <div className="flex justify-end">
           <div className="w-full max-w-xs space-y-2 text-foreground">
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
                    <div className="flex justify-between text-primary-foreground p-3 rounded-md" style={{ backgroundColor: color }}>
                        <span className="font-bold text-lg">TOTAL PAID:</span>
                        <span className="font-bold text-lg">Rs.{total.toFixed(2)}</span>
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
                    <div className="flex justify-between font-bold text-base" style={{ color: color }}>
                        <span>Total:</span>
                        <span>Rs.{total.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-border pt-2 mt-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Amount Paid:</span>
                            <span className="font-medium">-Rs.{amountPaid.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between font-bold text-base mt-1">
                            <span>Amount Due:</span>
                            <span className="font-bold">Rs.{amountDue.toFixed(2)}</span>
                        </div>
                    </div>
                </>
            )}
        </div>
        </div>
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-xs text-muted-foreground mt-2 print-hide">
            {organization?.invoiceThankYouMessage || 'Thank you for your business! If you have any questions about this invoice, please contact us.'}
          </p>
        </div>
        {organization?.invoiceSignature && (
            <div className="pt-12 text-right">
                <div className="border-t-2 border-border w-48 ml-auto"></div>
                <p className="mt-2 font-semibold text-foreground">{organization.invoiceSignature}</p>
                 <p className="text-xs text-muted-foreground print-hide">Created by: {invoice.createdByName}</p>
            </div>
        )}
      </footer>
    </div>
  );
}
