'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Database, CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function MigrationPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [migrationResults, setMigrationResults] = useState<{
    total: number;
    updated: number;
    skipped: number;
  } | null>(null);
  const [timestampMigrationResults, setTimestampMigrationResults] = useState<{
    totalProcessed: number;
    totalUpdated: number;
    totalSkipped: number;
    collections: number;
  } | null>(null);
  const [activeMigration, setActiveMigration] = useState<'invoice' | 'timestamp' | null>(null);
  const { user } = useAuth();

  const runInvoiceMigration = async () => {
    if (!user || (user.activeRole !== 'admin' && user.activeRole !== 'owner')) {
      alert('Only admins and owners can run database migrations.');
      return;
    }

    setIsRunning(true);
    setMigrationStatus('running');
    setMigrationResults(null);
    setActiveMigration('invoice');

    try {
      // Import and run the migration function
      const { migrateInvoiceDates } = await import('@/scripts/migrate-invoice-dates');
      
      // Override console.log to capture results
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };

      await migrateInvoiceDates();

      // Restore console.log
      console.log = originalLog;

      // Parse results from logs
      const totalMatch = logs.find(log => log.includes('Found') && log.includes('total invoices'));
      const updatedMatch = logs.find(log => log.includes('Updated:'));
      const skippedMatch = logs.find(log => log.includes('Skipped:'));

      if (totalMatch && updatedMatch && skippedMatch) {
        const total = parseInt(totalMatch.match(/(\d+)/)?.[1] || '0');
        const updated = parseInt(updatedMatch.match(/(\d+)/)?.[1] || '0');
        const skipped = parseInt(skippedMatch.match(/(\d+)/)?.[1] || '0');

        setMigrationResults({ total, updated, skipped });
      }

      setMigrationStatus('completed');
    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationStatus('error');
    } finally {
      setIsRunning(false);
      setActiveMigration(null);
    }
  };

  const runTimestampMigration = async () => {
    if (!user || (user.activeRole !== 'admin' && user.activeRole !== 'owner')) {
      alert('Only admins and owners can run database migrations.');
      return;
    }

    setIsRunning(true);
    setMigrationStatus('running');
    setTimestampMigrationResults(null);
    setActiveMigration('timestamp');

    try {
      // Import and run the migration function
      const { migrateTimestamps } = await import('@/scripts/migrate-timestamps');
      
      const results = await migrateTimestamps();
      setTimestampMigrationResults(results);
      setMigrationStatus('completed');
    } catch (error) {
      console.error('Timestamp migration failed:', error);
      setMigrationStatus('error');
    } finally {
      setIsRunning(false);
      setActiveMigration(null);
    }
  };

  if (user?.activeRole !== 'admin' && user?.activeRole !== 'owner') {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          <CardTitle>Database Migration</CardTitle>
        </div>
        <CardDescription>
          Add invoiceDate field to existing invoices that don't have it
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {migrationStatus === 'idle' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This migration will add the <code>invoiceDate</code> field to existing invoices 
              that were created before this feature was added. The invoiceDate will be set 
              to the same value as createdAt for existing invoices.
            </AlertDescription>
          </Alert>
        )}

        {migrationStatus === 'running' && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Migration is running... Please wait while we update your database.
            </AlertDescription>
          </Alert>
        )}

        {migrationStatus === 'completed' && migrationResults && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Migration completed successfully!
            </AlertDescription>
          </Alert>
        )}

        {migrationStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Migration failed. Please check the console for details and try again.
            </AlertDescription>
          </Alert>
        )}

        {migrationResults && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Invoice Date Migration Results</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{migrationResults.total}</div>
                <div className="text-sm text-muted-foreground">Total Invoices</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{migrationResults.updated}</div>
                <div className="text-sm text-muted-foreground">Updated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{migrationResults.skipped}</div>
                <div className="text-sm text-muted-foreground">Already Updated</div>
              </div>
            </div>
          </div>
        )}

        {timestampMigrationResults && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Timestamp Migration Results</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{timestampMigrationResults.totalProcessed}</div>
                <div className="text-sm text-muted-foreground">Total Documents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{timestampMigrationResults.totalUpdated}</div>
                <div className="text-sm text-muted-foreground">Updated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{timestampMigrationResults.totalSkipped}</div>
                <div className="text-sm text-muted-foreground">Already Fixed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{timestampMigrationResults.collections}</div>
                <div className="text-sm text-muted-foreground">Collections</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={runInvoiceMigration} 
              disabled={isRunning}
              className="flex items-center gap-2"
              variant="outline"
            >
              {isRunning && activeMigration === 'invoice' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running Invoice Migration...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Fix Invoice Dates
                </>
              )}
            </Button>
            
            <Button 
              onClick={runTimestampMigration} 
              disabled={isRunning}
              className="flex items-center gap-2"
              variant="outline"
            >
              {isRunning && activeMigration === 'timestamp' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running Timestamp Migration...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  Fix All Timestamps
                </>
              )}
            </Button>
          </div>
          
          {migrationStatus === 'completed' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Migration Complete
            </Badge>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>Note:</strong> This migration is safe to run multiple times. 
          Invoices that already have the invoiceDate field will be skipped.</p>
        </div>
      </CardContent>
    </Card>
  );
}
