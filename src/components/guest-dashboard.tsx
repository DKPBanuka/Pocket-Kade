
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useInvoices } from '@/hooks/use-invoices';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InvoiceList from './invoice-list';
import WelcomeTour from './welcome-tour';
import { useLanguage } from '@/contexts/language-context';

export default function GuestDashboard() {
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Show the tour if it hasn't been seen in this session
    const hasSeenWelcome = sessionStorage.getItem('pk-welcome-seen');
    if (!hasSeenWelcome) {
      setShowWelcomeTour(true);
    }
  }, []);

  const handleWelcomeClose = () => {
    // Mark the tour as seen for this session
    sessionStorage.setItem('pk-welcome-seen', 'true');
    setShowWelcomeTour(false);
  };

  if (invoicesLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {showWelcomeTour && <WelcomeTour onClose={handleWelcomeClose} />}
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-card/50 p-12 text-center">
        <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold font-headline">Manage Invoices with Ease</h3>
        <p className="mt-2 text-sm text-muted-foreground">This is where your invoices will appear. Create, track, and manage all your billing in one place.</p>
        <Link href="/signup" passHref>
          <Button className="mt-6">Sign Up to Get Started</Button>
        </Link>
      </div>
      {invoices.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold font-headline mb-4">Sample Invoices</h2>
          <InvoiceList invoices={invoices} />
        </div>
      )}
    </div>
  );
}
