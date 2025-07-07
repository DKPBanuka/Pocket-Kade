
"use client";

import type { Invoice, Organization } from '@/lib/types';
import { format } from 'date-fns';
import { FileText, Feather } from 'lucide-react';

interface TemplateProps {
  invoice: Invoice;
  organization: Organization | null;
  invoiceColor?: string | null;
}

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
    <div className="print-container w-full bg-white text-gray-700 font-sans text-sm shadow-lg">
      <header className="relative bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <div className="absolute inset-0">
            <svg width="100%" height="100%" preserveAspectRatio="xMinYMin slice" viewBox="0 0 800 220" className="absolute inset-0 h-full w-full">
                <path d="M 0 0 L 0 120 Q 150 200, 350 140 T 650 160 Q 800 170, 800 140 L 800 0 Z" fill={color}></path>
            </svg>
        </div>
        <div className="relative z-10 p-8">
            <div className="flex justify-between items-start mb-4">
                <div className="text-white">
                     <div className="flex items-center justify-center gap-2 drop-shadow-sm">
                        <div className="relative">
                            <FileText className="h-7 w-7" />
                            <Feather className="absolute -bottom-1 -right-2 h-4 w-4 opacity-80" />
                        </div>
                        <span className="text-xl font-bold font-headline">
                            Pocket <span className="text-2xl">කඩේ</span>
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-5xl font-extrabold tracking-tight text-white uppercase">Invoice</h2>
                </div>
            </div>
            
             <div className="grid grid-cols-2 gap-8 items-start pt-8">
                <div className="space-y-1 text-xs text-yellow-100">
                     <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        <span>{organization?.phone || '+0123 456 7895'}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <span>{organization?.email || 'your-email@example.com'}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span className="max-w-xs">{organization?.address || 'Your Address, City, Country'}</span>
                    </div>
                </div>
                <div></div>
            </div>
        </div>
      </header>

      <main className="p-8 -mt-8">
        <div className="flex justify-between items-start pt-4 mb-8 bg-white p-4 rounded-lg shadow-sm">
            <div className="text-xs">
                <p className="font-bold text-gray-500">Invoice Details</p>
                <p className="mt-1">Invoice Date: {format(new Date(invoice.createdAt), 'dd/MM/yyyy')}</p>
                <p>Due Date: {format(new Date(), 'dd/MM/yyyy')}</p>
                <p>Invoice No: {invoice.id}</p>
            </div>
            <div className="w-[1px] bg-gray-200 h-16 self-center"></div>
            <div className="text-xs text-right">
                <p className="font-bold text-gray-500">Bill to</p>
                <p className="font-bold text-base mt-1">{invoice.customerName}</p>
                {invoice.customerPhone && <p>{invoice.customerPhone}</p>}
            </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr style={{ backgroundColor: color }} className="text-white text-xs">
              <th className="p-3 font-bold uppercase tracking-wider w-12 text-center rounded-l-md">No.</th>
              <th className="p-3 font-bold uppercase tracking-wider">Product Description</th>
              <th className="p-3 font-bold uppercase tracking-wider text-right">Unit Price</th>
              <th className="p-3 font-bold uppercase tracking-wider text-center">Qty</th>
              <th className="p-3 font-bold uppercase tracking-wider text-right rounded-r-md">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="p-3 text-center font-semibold text-gray-500">{String(index + 1).padStart(2, '0')}</td>
                <td className="p-3 font-semibold">{item.description}</td>
                <td className="p-3 text-right">Rs.{item.price.toFixed(2)}</td>
                <td className="p-3 text-center">{item.quantity}</td>
                <td className="p-3 text-right font-semibold">Rs.{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      <footer className="px-8 mt-8 pb-8">
        <div className="grid grid-cols-2 items-end">
            <div className="text-xs space-y-4">
                 <div>
                    <p className="font-bold mb-1">Notes</p>
                    <p className="text-gray-500 max-w-xs">{organization?.invoiceThankYouMessage || 'Please make the payment by the due date.'}</p>
                </div>
            </div>
          <div className="text-right space-y-2">
            {invoice.status === 'Paid' ? (
                <>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Sub Total:</span>
                        <span className="font-medium">Rs.{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">{discountLabel}:</span>
                            <span className="font-medium">-Rs.{discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="flex justify-between font-bold text-lg" style={{ color }}>
                            <span>TOTAL PAID:</span>
                            <span>Rs.{total.toFixed(2)}</span>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Sub Total:</span>
                        <span className="font-medium">Rs.{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">{discountLabel}:</span>
                            <span className="font-medium">-Rs.{discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="flex justify-between font-bold text-base">
                            <span>Total:</span>
                            <span>Rs.{total.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Amount Paid:</span>
                        <span className="font-medium">-Rs.{amountPaid.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="flex justify-between font-bold text-lg" style={{ color }}>
                            <span>AMOUNT DUE:</span>
                            <span>Rs.{amountDue.toFixed(2)}</span>
                        </div>
                    </div>
                </>
            )}
            {organization?.invoiceSignature && (
                <div className="pt-12">
                    <div className="border-t-2 border-gray-400 w-48 ml-auto"></div>
                    <p className="mt-2 font-semibold">{organization.invoiceSignature}</p>
                </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
