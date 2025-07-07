
"use client";

import type { Invoice, Organization, Payment } from '@/lib/types';
import { format } from 'date-fns';

interface TemplateProps {
  invoice: Invoice;
  organization: Organization | null;
  invoiceColor?: string | null;
}

export default function ModernTemplate({ invoice, organization, invoiceColor }: TemplateProps) {
  const color = invoiceColor || '#0ea5e9'; // Default blue
  
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
    <div className="print-container w-full bg-gray-50 text-gray-800 font-sans text-sm shadow-lg">
      {/* Header with colored background */}
      <header className="relative p-8 text-white" style={{ backgroundColor: color }}>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                {organization?.name && (
                    <div className="h-16 w-16 rounded-lg flex items-center justify-center text-white font-bold text-3xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                        {organization.name.charAt(0)}
                    </div>
                )}
                <div>
                    <h1 className="text-3xl font-bold">{organization?.name || "Your Company"}</h1>
                    <p className="max-w-xs whitespace-pre-line">{organization?.address}</p>
                </div>
            </div>
          <div className="text-right">
            <h2 className="text-4xl font-extrabold tracking-tight">INVOICE</h2>
            <p className="mt-1">{invoice.id}</p>
          </div>
        </div>
        {/* Curved shape */}
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gray-50" style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }}></div>
      </header>

      {/* Bill To & Date */}
      <section className="p-8 grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold text-gray-500 uppercase tracking-wider text-xs">Billed To</h3>
          <p className="font-bold text-base text-gray-900 mt-1">{invoice.customerName}</p>
          {invoice.customerPhone && <p className="text-gray-600">{invoice.customerPhone}</p>}
        </div>
        <div className="text-left md:text-right">
          <h3 className="font-semibold text-gray-500 uppercase tracking-wider text-xs">Invoice Date</h3>
          <p className="font-medium text-base text-gray-900 mt-1">{format(new Date(invoice.createdAt), 'MMMM dd, yyyy')}</p>
        </div>
      </section>

      {/* Line Items Table */}
      <section className="px-8">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2" style={{ borderColor: color }}>
              <th className="p-3 font-bold uppercase tracking-wider text-sm w-8/12">Description</th>
              <th className="p-3 font-bold uppercase tracking-wider text-sm text-center">Qty</th>
              <th className="p-3 font-bold uppercase tracking-wider text-sm text-right">Unit Price</th>
              <th className="p-3 font-bold uppercase tracking-wider text-sm text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoice.lineItems.map((item) => (
              <tr key={item.id}>
                <td className="p-3 font-medium">{item.description}</td>
                <td className="p-3 text-center">{item.quantity}</td>
                <td className="p-3 text-right">Rs.{item.price.toFixed(2)}</td>
                <td className="p-3 text-right font-medium">Rs.{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Totals Section */}
      <section className="p-8 flex justify-end">
        <div className="w-full max-w-xs space-y-3">
          {invoice.status === 'Paid' ? (
              <>
                  <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">Rs.{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                      <div className="flex justify-between">
                          <span className="text-gray-600">{discountLabel}:</span>
                          <span className="font-medium">-Rs.{discountAmount.toFixed(2)}</span>
                      </div>
                  )}
                  <hr className="my-2" />
                  <div className="flex justify-between items-center p-3 rounded-md" style={{ backgroundColor: `${color}1A`}}>
                      <span className="font-bold text-base" style={{color}}>TOTAL PAID</span>
                      <span className="font-bold text-xl" style={{color}}>Rs.{total.toFixed(2)}</span>
                  </div>
              </>
          ) : (
              <>
                  <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">Rs.{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                      <div className="flex justify-between">
                          <span className="text-gray-600">{discountLabel}:</span>
                          <span className="font-medium">-Rs.{discountAmount.toFixed(2)}</span>
                      </div>
                  )}
                  <hr className="my-2" />
                  <div className="flex justify-between">
                      <span className="font-semibold text-gray-700">Total:</span>
                      <span className="font-semibold">Rs.{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid:</span>
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

      {invoice.status !== 'Paid' && invoice.payments && invoice.payments.length > 0 && (
          <section className="px-8 mt-4 no-print">
              <h3 className="font-semibold mb-2">Payment History</h3>
              <div className="rounded-md border bg-white">
              <table className="w-full">
                  <thead className="bg-gray-100">
                      <tr>
                          <th className="p-2 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                          <th className="p-2 text-left text-xs font-semibold text-gray-600 uppercase">Method</th>
                          <th className="p-2 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                      {invoice.payments.map((p: Payment) => (
                      <tr key={p.id}>
                          <td className="p-2">{format(new Date(p.date), 'PPP')}</td>
                          <td className="p-2">{p.method}</td>
                          <td className="p-2 text-right">Rs.{p.amount.toFixed(2)}</td>
                      </tr>
                      ))}
                  </tbody>
              </table>
              </div>
          </section>
      )}

      {/* Footer */}
      <footer className="relative mt-16 p-8 pt-16 text-white text-center text-sm" style={{ backgroundColor: color }}>
        <div className="absolute top-0 left-0 w-full h-16 bg-gray-50" style={{ clipPath: 'polygon(0 100%, 0 0, 100% 0)' }}></div>
        <div className="relative">
          <p>{organization?.invoiceThankYouMessage || 'Thank you for your business!'}</p>
          <p className="font-bold mt-1">
            {organization?.phone || 'your phone'} | {organization?.email || 'your email'}
          </p>
        </div>
      </footer>
    </div>
  );
}
