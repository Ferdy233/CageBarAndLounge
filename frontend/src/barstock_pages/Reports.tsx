import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';

export function Reports() {
  const { sales, inventory } = useData();
  const { isAdmin } = useAuth();
  
  const today = new Date().toDateString();
  const todaySales = sales.filter((s) => new Date(s.createdAt).toDateString() === today);
  const totalRevenue = todaySales.reduce((s, sale) => s + sale.totalAmount, 0);
  const totalProfit = todaySales.reduce((s, sale) => s + sale.totalProfit, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-display font-bold">Reports</h1><p className="text-muted-foreground">Daily sales reports</p></div>
      
      <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
        <Card className="glass-card"><CardHeader><CardTitle className="text-sm text-muted-foreground">Today's Revenue</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p></CardContent></Card>
        {isAdmin && <Card className="glass-card"><CardHeader><CardTitle className="text-sm text-muted-foreground">Today's Profit</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-success">{formatCurrency(totalProfit)}</p></CardContent></Card>}
        <Card className="glass-card"><CardHeader><CardTitle className="text-sm text-muted-foreground">Transactions</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{todaySales.length}</p></CardContent></Card>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>Today's Sales Details</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Items</TableHead><TableHead>Staff</TableHead><TableHead className="text-right">Revenue</TableHead>{isAdmin && <TableHead className="text-right">Profit</TableHead>}</TableRow></TableHeader>
            <TableBody>
              {todaySales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{new Date(sale.createdAt).toLocaleTimeString()}</TableCell>
                  <TableCell>{sale.items.map((i) => `${i.itemName} (${i.quantity})`).join(', ')}</TableCell>
                  <TableCell>{sale.staffName}</TableCell>
                  <TableCell className="text-right">{formatCurrency(sale.totalAmount)}</TableCell>
                  {isAdmin && <TableCell className="text-right text-success">{formatCurrency(sale.totalProfit)}</TableCell>}
                </TableRow>
              ))}
              {todaySales.length === 0 && <TableRow><TableCell colSpan={isAdmin ? 5 : 4} className="text-center text-muted-foreground py-8">No sales today</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
