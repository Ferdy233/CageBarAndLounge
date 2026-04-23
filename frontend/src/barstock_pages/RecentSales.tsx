import React from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function RecentSales() {
  const { sales, updateSalePayment } = useData();
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const handleMarkAsPaid = async (saleId: string) => {
    try {
      await updateSalePayment(saleId, 'cash', 'paid');
      toast({ title: 'Payment marked as paid' });
    } catch (err) {
      toast({
        title: 'Failed to update payment',
        description: err instanceof Error ? err.message : 'Request failed',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Recent Sales</h1>
        <p className="text-muted-foreground">View and manage recent transactions</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Latest Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                {isAdmin && <TableHead className="text-right">Profit</TableHead>}
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.slice(0, 20).map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{sale.items.map((i) => `${i.itemName} (${i.quantity})`).join(', ')}</TableCell>
                  <TableCell>{sale.staffName}</TableCell>
                  <TableCell>
                    <Badge variant={sale.paymentMethod === 'cash' ? 'default' : sale.paymentMethod === 'momo' ? 'secondary' : 'outline'}>
                      {sale.paymentMethod === 'cash' ? 'Cash' : sale.paymentMethod === 'momo' ? 'Mobile Money' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sale.paymentStatus === 'paid' ? 'default' : 'destructive'}>
                      {sale.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(sale.totalAmount)}</TableCell>
                  {isAdmin && <TableCell className="text-right text-success">{formatCurrency(sale.totalProfit)}</TableCell>}
                  {isAdmin && (
                    <TableCell className="text-right">
                      {sale.paymentStatus === 'pending' ? (
                        <Button size="sm" onClick={() => handleMarkAsPaid(sale.id)}>Mark as Paid</Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 6} className="text-center text-muted-foreground py-8">
                    No sales yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
