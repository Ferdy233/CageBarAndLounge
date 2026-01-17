import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function StockAdjustments() {
  const { stockAdjustments } = useData();

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-display font-bold">Stock Adjustments</h1><p className="text-muted-foreground">Track inventory discrepancies</p></div>
      
      <Card className="glass-card">
        <CardHeader><CardTitle>Adjustment History</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Item</TableHead><TableHead className="text-right">Expected</TableHead><TableHead className="text-right">Actual</TableHead><TableHead className="text-right">Difference</TableHead><TableHead>Reason</TableHead></TableRow></TableHeader>
            <TableBody>
              {stockAdjustments.map((adj) => (
                <TableRow key={adj.id}>
                  <TableCell>{new Date(adj.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{adj.itemName}</TableCell>
                  <TableCell className="text-right">{adj.expectedStock}</TableCell>
                  <TableCell className="text-right">{adj.actualStock}</TableCell>
                  <TableCell className="text-right"><Badge variant={adj.difference < 0 ? 'destructive' : 'secondary'}>{adj.difference}</Badge></TableCell>
                  <TableCell>{adj.reason}</TableCell>
                </TableRow>
              ))}
              {stockAdjustments.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No adjustments recorded</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
