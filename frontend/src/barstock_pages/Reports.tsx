import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';

export function Reports() {
  const { sales, inventory } = useData();
  const { isAdmin } = useAuth();
  const [dateFilter, setDateFilter] = useState('');
  
  const filteredSales = useMemo(() => {
    if (!dateFilter) return sales;
    return sales.filter((s) => new Date(s.createdAt).toDateString() === new Date(dateFilter).toDateString());
  }, [sales, dateFilter]);
  
  const totalRevenue = filteredSales.reduce((s, sale) => s + sale.totalAmount, 0);
  const totalProfit = filteredSales.reduce((s, sale) => s + sale.totalProfit, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-display font-bold">Reports</h1><p className="text-muted-foreground">Sales reports and analytics</p></div>
      
      <div className="flex items-center space-x-4">
        <div>
          <label htmlFor="date-filter" className="text-sm font-medium">Filter by date:</label>
          <Input
            id="date-filter"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="mt-1"
          />
        </div>
        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="mt-6 text-sm text-blue-600 hover:text-blue-800"
          >
            Clear filter
          </button>
        )}
      </div>
      
      <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {dateFilter ? 'Revenue' : 'Total Revenue'} ({filteredSales.length} transactions)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        {isAdmin && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                {dateFilter ? 'Profit' : 'Total Profit'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-success">{formatCurrency(totalProfit)}</p>
            </CardContent>
          </Card>
        )}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {dateFilter ? 'Transactions' : 'Total Transactions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{filteredSales.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>
            {dateFilter ? `Sales for ${new Date(dateFilter).toLocaleDateString()}` : 'All Sales History'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Items</TableHead><TableHead>Staff</TableHead><TableHead className="text-right">Revenue</TableHead>{isAdmin && <TableHead className="text-right">Profit</TableHead>}</TableRow></TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{sale.items.map((i) => `${i.itemName} (${i.quantity})`).join(', ')}</TableCell>
                  <TableCell>{sale.staffName}</TableCell>
                  <TableCell className="text-right">{formatCurrency(sale.totalAmount)}</TableCell>
                  {isAdmin && <TableCell className="text-right text-success">{formatCurrency(sale.totalProfit)}</TableCell>}
                </TableRow>
              ))}
              {filteredSales.length === 0 && <TableRow><TableCell colSpan={isAdmin ? 5 : 4} className="text-center text-muted-foreground py-8">{dateFilter ? 'No sales found for this date' : 'No sales recorded yet'}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
