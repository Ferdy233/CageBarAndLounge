import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

export function Reports() {
  const { sales } = useData();
  const { isAdmin } = useAuth();
  const [dateFilter, setDateFilter] = useState('');

  const selectedDay = useMemo(() => {
    if (dateFilter) return new Date(dateFilter);
    return new Date();
  }, [dateFilter]);
  
  const filteredSales = useMemo(() => {
    if (!dateFilter) return sales;
    return sales.filter((s) => new Date(s.createdAt).toDateString() === new Date(dateFilter).toDateString());
  }, [sales, dateFilter]);

  const paidFilteredSales = useMemo(
    () => filteredSales.filter((sale) => sale.paymentStatus === 'paid'),
    [filteredSales]
  );

  const dailyPaymentBreakdown = useMemo(() => {
    const dailySales = sales.filter(
      (sale) => new Date(sale.createdAt).toDateString() === selectedDay.toDateString()
    );

    const methods: Array<'cash' | 'momo' | 'pending'> = ['cash', 'momo', 'pending'];
    return methods.map((method) => {
      const methodSales = dailySales.filter((sale) => sale.paymentMethod === method);
      const paidMethodSales = methodSales.filter((sale) => sale.paymentStatus === 'paid');
      const pendingMethodSales = methodSales.filter((sale) => sale.paymentStatus === 'pending');

      return {
        method,
        transactions: methodSales.length,
        paidSales: paidMethodSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        paidProfit: paidMethodSales.reduce((sum, sale) => sum + sale.totalProfit, 0),
        pendingAmount: pendingMethodSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      };
    });
  }, [sales, selectedDay]);

  const methodLabel: Record<'cash' | 'momo' | 'pending', string> = {
    cash: 'Cash',
    momo: 'Mobile Money',
    pending: 'Pending',
  };
  
  const totalRevenue = paidFilteredSales.reduce((s, sale) => s + sale.totalAmount, 0);
  const totalProfit = paidFilteredSales.reduce((s, sale) => s + sale.totalProfit, 0);

  const selectedDayKey = selectedDay.toISOString().slice(0, 10);

  const exportDailyBreakdownCsv = () => {
    const headers = ['Payment Method', 'Transactions', 'Sales (Paid)', 'Profit (Paid)', 'Pending Amount'];
    const rows = dailyPaymentBreakdown.map((row) => [
      methodLabel[row.method],
      String(row.transactions),
      row.paidSales.toFixed(2),
      row.paidProfit.toFixed(2),
      row.pendingAmount.toFixed(2),
    ]);

    const csvContent = [headers, ...rows]
      .map((line) => line.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daily-payment-breakdown-${selectedDayKey}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportDailyBreakdownPdf = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const rowsHtml = dailyPaymentBreakdown
      .map(
        (row) => `
          <tr>
            <td>${methodLabel[row.method]}</td>
            <td style="text-align:right">${row.transactions}</td>
            <td style="text-align:right">${formatCurrency(row.paidSales)}</td>
            <td style="text-align:right">${formatCurrency(row.paidProfit)}</td>
            <td style="text-align:right">${formatCurrency(row.pendingAmount)}</td>
          </tr>
        `
      )
      .join('');

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Daily Payment Breakdown ${selectedDayKey}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin: 0 0 8px; font-size: 20px; }
            p { margin: 0 0 16px; color: #555; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background: #f5f5f5; text-align: left; }
          </style>
        </head>
        <body>
          <h1>Daily Payment Method Breakdown</h1>
          <p>Date: ${selectedDay.toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>Payment Method</th>
                <th style="text-align:right">Transactions</th>
                <th style="text-align:right">Sales (Paid)</th>
                <th style="text-align:right">Profit (Paid)</th>
                <th style="text-align:right">Pending Amount</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

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
              {dateFilter ? 'Revenue (Paid)' : 'Total Revenue (Paid)'} ({paidFilteredSales.length} paid)
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

      {isAdmin && (
        <Card className="glass-card">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>
                Daily Payment Method Breakdown ({selectedDay.toLocaleDateString()})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={exportDailyBreakdownCsv}>
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportDailyBreakdownPdf}>
                  Export PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Sales (Paid)</TableHead>
                  <TableHead className="text-right">Profit (Paid)</TableHead>
                  <TableHead className="text-right">Pending Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyPaymentBreakdown.map((row) => (
                  <TableRow key={row.method}>
                    <TableCell>{methodLabel[row.method]}</TableCell>
                    <TableCell className="text-right">{row.transactions}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.paidSales)}</TableCell>
                    <TableCell className="text-right text-success">{formatCurrency(row.paidProfit)}</TableCell>
                    <TableCell className="text-right text-warning">{formatCurrency(row.pendingAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>
            {dateFilter ? `Sales for ${new Date(dateFilter).toLocaleDateString()}` : 'All Sales History'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Date & Time</TableHead><TableHead>Items</TableHead><TableHead>Staff</TableHead><TableHead className="text-right">Revenue</TableHead>{isAdmin && <TableHead className="text-right">Profit</TableHead>}</TableRow></TableHeader>
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
