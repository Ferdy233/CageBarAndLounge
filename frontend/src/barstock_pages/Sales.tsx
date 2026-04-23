import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { SaleItem } from '@/types';

export function Sales() {
  const { inventory, addSale, sales } = useData();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [search, setSearch] = useState('');

  const filteredInventory = inventory.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()) && item.quantity > 0);

  const addToCart = (itemId: string) => {
    const item = inventory.find((i) => i.id === itemId);
    if (!item) return;
    
    const existing = cart.find((c) => c.itemId === itemId);
    const currentQty = existing?.quantity || 0;
    if (currentQty >= item.quantity) {
      toast({ title: 'Not enough stock', variant: 'destructive' });
      return;
    }

    const unitSellingPrice = item.isCarton ? item.sellingPrice / item.unitsPerItem : item.sellingPrice;
    const unitCostPrice = item.isCarton ? item.costPrice / item.unitsPerItem : item.costPrice;

    if (existing) {
      setCart(cart.map((c) => c.itemId === itemId ? { ...c, quantity: c.quantity + 1, totalPrice: (c.quantity + 1) * unitSellingPrice, profit: (c.quantity + 1) * (unitSellingPrice - unitCostPrice) } : c));
    } else {
      setCart([...cart, { itemId, itemName: item.name, quantity: 1, costPrice: unitCostPrice, sellingPrice: unitSellingPrice, totalPrice: unitSellingPrice, profit: unitSellingPrice - unitCostPrice }]);
    }
  };

  const updateQty = (itemId: string, delta: number) => {
    setCart(cart.map((c) => {
      if (c.itemId !== itemId) return c;
      const newQty = Math.max(0, c.quantity + delta);
      return newQty === 0 ? null : { ...c, quantity: newQty, totalPrice: newQty * c.sellingPrice, profit: newQty * (c.sellingPrice - c.costPrice) };
    }).filter(Boolean) as SaleItem[]);
  };

  const completeSale = async () => {
    if (cart.length === 0) return;
    try {
      await addSale(cart, '', '');
      setCart([]);
      toast({ title: 'Sale completed!', description: `Total: ${formatCurrency(cart.reduce((s, i) => s + i.totalPrice, 0))}` });
    } catch (err) {
      toast({
        title: 'Sale failed',
        description: err instanceof Error ? err.message : 'Request failed',
        variant: 'destructive',
      });
    }
  };

  const cartTotal = cart.reduce((s, i) => s + i.totalPrice, 0);
  const cartProfit = cart.reduce((s, i) => s + i.profit, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-display font-bold">Point of Sale</h1><p className="text-muted-foreground">Record new sales</p></div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredInventory.map((item) => (
              <Card key={item.id} className="glass-card cursor-pointer hover:border-primary/50 transition-colors" onClick={() => addToCart(item.id)}>
                <CardContent className="p-4">
                  <p className="font-medium truncate">{item.name}</p>
                  <div className="flex justify-between mt-2"><span className="text-primary font-bold">{formatCurrency(item.isCarton ? item.sellingPrice / item.unitsPerItem : item.sellingPrice)}</span><Badge variant="secondary">{item.quantity}</Badge></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="glass-card h-fit">
          <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" />Cart ({cart.length})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? <p className="text-muted-foreground text-center py-8">Cart is empty</p> : (
              <>
                {cart.map((item) => (
                  <div key={item.itemId} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                    <div><p className="font-medium text-sm">{item.itemName}</p><p className="text-xs text-muted-foreground">{formatCurrency(item.sellingPrice)} × {item.quantity}</p></div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(item.itemId, -1)}><Minus className="w-3 h-3" /></Button>
                      <span className="w-6 text-center">{item.quantity}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(item.itemId, 1)}><Plus className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between"><span>Total</span><span className="font-bold">{formatCurrency(cartTotal)}</span></div>
                  {isAdmin && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Profit</span><span className="text-success">{formatCurrency(cartProfit)}</span></div>}
                </div>
                <Button className="w-full gradient-gold text-primary-foreground" onClick={completeSale}>Complete Sale</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>Recent Sales</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Date & Time</TableHead><TableHead>Items</TableHead><TableHead>Staff</TableHead><TableHead className="text-right">Total</TableHead>{isAdmin && <TableHead className="text-right">Profit</TableHead>}</TableRow></TableHeader>
            <TableBody>
              {sales.slice(0, 10).map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{sale.items.map((i) => `${i.itemName} (${i.quantity})`).join(', ')}</TableCell>
                  <TableCell>{sale.staffName}</TableCell>
                  <TableCell className="text-right">{formatCurrency(sale.totalAmount)}</TableCell>
                  {isAdmin && <TableCell className="text-right text-success">{formatCurrency(sale.totalProfit)}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
