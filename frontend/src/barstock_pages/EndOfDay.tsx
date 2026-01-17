"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Send, CheckCircle, DollarSign, TrendingUp, ShoppingCart, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiFetchAuth } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface EODPreview {
  date: string;
  total_sales: number;
  total_profit: number;
  total_transactions: number;
  items_sold: number;
}

interface EODReport {
  id: number;
  date: string;
  submitted_by_name: string;
  total_sales: string;
  total_profit: string;
  total_transactions: number;
  items_sold: number;
  notes: string;
  email_sent: boolean;
  created_at: string;
}

interface TodayStatus {
  submitted: boolean;
  report?: EODReport;
  preview?: EODPreview;
}

export function EndOfDay() {
  const { canSubmitEOD } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<TodayStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTodayStatus();
  }, []);

  const loadTodayStatus = async () => {
    try {
      const data = await apiFetchAuth<TodayStatus>('/api/eod-reports/today/');
      setStatus(data);
    } catch (err) {
      toast({
        title: 'Failed to load status',
        description: err instanceof Error ? err.message : 'Request failed',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmitEOD) return;

    setIsSubmitting(true);
    try {
      await apiFetchAuth<EODReport>('/api/eod-reports/submit/', {
        method: 'POST',
        body: { notes },
      });
      toast({
        title: 'End of Day Report Submitted',
        description: 'The report has been saved and emailed to admin(s).',
      });
      await loadTodayStatus();
    } catch (err) {
      toast({
        title: 'Submission failed',
        description: err instanceof Error ? err.message : 'Request failed',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const preview = status?.preview;
  const report = status?.report;
  const isSubmitted = status?.submitted ?? false;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6" />
          End of Day Report
        </h1>
        <p className="text-muted-foreground">Submit daily sales summary</p>
      </div>

      {isSubmitted && report ? (
        <Card className="glass-card border-success/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle className="w-5 h-5" />
              Report Submitted
            </CardTitle>
            <CardDescription>
              Submitted by {report.submitted_by_name} on {new Date(report.created_at).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <DollarSign className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-lg font-bold">{formatCurrency(parseFloat(report.total_sales))}</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <TrendingUp className="w-5 h-5 mx-auto mb-1 text-success" />
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className="text-lg font-bold text-success">{formatCurrency(parseFloat(report.total_profit))}</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <ShoppingCart className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-lg font-bold">{report.total_transactions}</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Package className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-sm text-muted-foreground">Items Sold</p>
                <p className="text-lg font-bold">{report.items_sold}</p>
              </div>
            </div>
            {report.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes:</p>
                <p className="text-sm">{report.notes}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Badge variant={report.email_sent ? 'default' : 'secondary'}>
                {report.email_sent ? 'Email Sent' : 'Email Pending'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Today's Summary</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <DollarSign className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-lg font-bold">{formatCurrency(preview?.total_sales ?? 0)}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <TrendingUp className="w-5 h-5 mx-auto mb-1 text-success" />
                  <p className="text-sm text-muted-foreground">Total Profit</p>
                  <p className="text-lg font-bold text-success">{formatCurrency(preview?.total_profit ?? 0)}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <ShoppingCart className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-lg font-bold">{preview?.total_transactions ?? 0}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Package className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-sm text-muted-foreground">Items Sold</p>
                  <p className="text-lg font-bold">{preview?.items_sold ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {canSubmitEOD && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Submit Report</CardTitle>
                <CardDescription>
                  Add any notes and submit the end of day report. This will be emailed to admin(s).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any observations, issues, or notes for the day..."
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full gradient-gold text-primary-foreground"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Submitting...' : 'Submit End of Day Report'}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
