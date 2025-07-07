
"use client";

import type { Invoice, Organization, Payment } from '@/lib/types';
import { format } from 'date-fns';

interface TemplateProps {
  invoice: Invoice;
  organization: Organization | null;
  invoiceColor?: string | null;
}

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
    <div className="print-container w-full bg-white text-gray-800 font-sans text-sm shadow-lg">
      <header className="p-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded-lg">
              <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold uppercase">{organization?.name || "Company Name"}</h1>
              <p className="text-xs text-gray-500">Company Tagline Here</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-extrabold" style={{ color: color }}>INVOICE</h2>
            <div className="mt-2 text-xs">
              <p><span className="font-bold">Invoice Number:</span> {invoice.id}</p>
              <p><span className="font-bold">Invoice Date:</span> {format(new Date(invoice.createdAt), 'MMMM dd, yyyy')}</p>
            </div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold" style={{ color: color }}>INVOICE TO:</h3>
            <p className="font-bold mt-1">{invoice.customerName}</p>
            {invoice.customerPhone && <p className="text-gray-600">Phone: {invoice.customerPhone}</p>}
          </div>
        </div>
      </header>

      <main className="px-8 mt-4">
        <table className="w-full text-left">
          <thead>
            <tr style={{ backgroundColor: color }} className="text-white">
              <th className="p-3 font-bold uppercase tracking-wider text-sm w-12">No.</th>
              <th className="p-3 font-bold uppercase tracking-wider text-sm">Product Description</th>
              <th className="p-3 font-bold uppercase tracking-wider text-sm text-right">Price</th>
              <th className="p-3 font-bold uppercase tracking-wider text-sm text-center">Quantity</th>
              <th className="p-3 font-bold uppercase tracking-wider text-sm text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="p-3 text-center">{String(index + 1).padStart(2, '0')}</td>
                <td className="p-3">{item.description}</td>
                <td className="p-3 text-right">Rs.{item.price.toFixed(2)}</td>
                <td className="p-3 text-center">{item.quantity}</td>
                <td className="p-3 text-right font-medium">Rs.{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      <footer className="p-8 mt-8">
        <div className="flex justify-end">
           <div className="w-full max-w-xs space-y-2">
            {invoice.status === 'Paid' ? (
                <>
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-medium">Rs.{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between">
                        <span>{discountLabel}:</span>
                        <span className="font-medium">-Rs.{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white p-3 rounded-md" style={{ backgroundColor: color }}>
                        <span className="font-bold text-lg">TOTAL PAID:</span>
                        <span className="font-bold text-lg">Rs.{total.toFixed(2)}</span>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-medium">Rs.{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between">
                        <span>{discountLabel}:</span>
                        <span className="font-medium">-Rs.{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold" style={{ color: color }}>
                        <span className="text-lg">Total:</span>
                        <span className="text-lg">Rs.{total.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between">
                            <span>Amount Paid:</span>
                            <span className="font-medium">-Rs.{amountPaid.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between font-bold mt-1">
                            <span>Amount Due:</span>
                            <span className="font-bold">Rs.{amountDue.toFixed(2)}</span>
                        </div>
                    </div>
                </>
            )}
        </div>
        </div>
        <div className="mt-12 border-t pt-8">
          <p className="text-xs text-gray-500 mt-2">
            {organization?.invoiceThankYouMessage || 'Thank you for your business! If you have any questions about this invoice, please contact us.'}
          </p>
        </div>
        {organization?.invoiceSignature && (
            <div className="pt-12 text-right">
                <div className="border-t-2 border-gray-400 w-48 ml-auto"></div>
                <p className="mt-2 font-semibold">{organization.invoiceSignature}</p>
            </div>
        )}
      </footer>
    </div>
  );
}
