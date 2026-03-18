import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogHeader, DialogTitle, Table, TableHeader, TableBody, TableRow, TableCell, TableHead, Badge, DialogTrigger } from '@/components/ui';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { InventoryItem } from '@/types';

export function Inventory() {
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, categories, refreshData } = useData();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({ name: '', costPrice: '', sellingPrice: '', quantity: '', minStockThreshold: '', category: '', unitsPerItem: '1', isCarton: false });

  const filteredInventory = inventory.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      costPrice: parseFloat(formData.costPrice),
      sellingPrice: parseFloat(formData.sellingPrice),
      quantity: parseInt(formData.quantity),
      minStockThreshold: parseInt(formData.minStockThreshold),
      category: formData.category,
      unitsPerItem: parseInt(formData.unitsPerItem),
      isCarton: formData.isCarton,
    };

    try {
      if (editItem) {
        await updateInventoryItem(editItem.id, data);
        toast({ title: 'Item updated successfully' });
        refreshData();
      } else {
        await addInventoryItem(data);
        toast({ title: 'Item added successfully' });
        refreshData();
      }
      resetForm();
    } catch (err) {
      toast({
        title: 'Operation failed',
        description: err instanceof Error ? err.message : 'Request failed',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', costPrice: '', sellingPrice: '', quantity: '', minStockThreshold: '', category: '', unitsPerItem: '1', isCarton: false });
    setEditItem(null);
    setIsAddOpen(false);
  };

  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    setFormData({
      name: item.name,
      costPrice: item.costPrice.toString(),
      sellingPrice: item.sellingPrice.toString(),
      quantity: item.quantity.toString(),
      minStockThreshold: item.minStockThreshold.toString(),
      category: item.category,
      unitsPerItem: item.unitsPerItem.toString(),
      isCarton: item.isCarton,
    });
    setIsAddOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInventoryItem(id);
      toast({ title: 'Item deleted successfully' });
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Request failed',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Inventory</h1>
          <p className="text-muted-foreground">Manage your bar inventory</p>
        </div>
        {isAdmin && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-gold text-primary-foreground"><Plus className="w-4 h-4 mr-2" />Add Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editItem ? 'Edit' : 'Add'} Item</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                  <div><Label>Cost Price (GH₵)</Label><Input type="number" step="0.01" value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })} required /></div>
                  <div><Label>Selling Price (GH₵)</Label><Input type="number" step="0.01" value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })} required /></div>
                  <div><Label>Quantity</Label><Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required /></div>
                  <div><Label>Units Per Item</Label><Input type="number" min="1" value={formData.unitsPerItem} onChange={(e) => setFormData({ ...formData, unitsPerItem: e.target.value })} required /></div>
                  <div><Label>Min Stock</Label><Input type="number" value={formData.minStockThreshold} onChange={(e) => setFormData({ ...formData, minStockThreshold: e.target.value })} required /></div>
                  <div className="col-span-2 flex items-center space-x-2">
                    <Checkbox id="isCarton" checked={formData.isCarton} onCheckedChange={(checked: boolean) => setFormData({ ...formData, isCarton: checked })} />
                    <Label htmlFor="isCarton">Sold by carton/multi-unit package</Label>
                  </div>
                  <div className="col-span-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end"><Button type="button" variant="outline" onClick={resetForm}>Cancel</Button><Button type="submit" className="gradient-gold text-primary-foreground">{editItem ? 'Update' : 'Add'}</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>

      <Card className="glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Category</TableHead>{isAdmin && <TableHead className="text-right">Cost</TableHead>}<TableHead className="text-right">Price</TableHead><TableHead className="text-right">Stock</TableHead>{isAdmin && <TableHead className="text-right">Unit Profit</TableHead>}{isAdmin && <TableHead className="text-right">Total Profit</TableHead>}{isAdmin && <TableHead className="text-right">Actions</TableHead>}</TableRow></TableHeader>
            <TableBody>
              {filteredInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium"><div className="flex items-center gap-2"><Package className="w-4 h-4 text-primary" />{item.name}</div></TableCell>
                  <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                  {isAdmin && <TableCell className="text-right">{formatCurrency(item.costPrice)}</TableCell>}
                  <TableCell className="text-right">{formatCurrency(item.isCarton ? item.sellingPrice / item.unitsPerItem : item.sellingPrice)}</TableCell>
                  <TableCell className="text-right"><Badge variant={item.quantity === 0 ? 'destructive' : item.quantity <= item.minStockThreshold ? 'secondary' : 'default'} className={item.quantity > item.minStockThreshold ? 'bg-success/20 text-success' : ''}>{item.quantity}</Badge></TableCell>
                  {isAdmin && <TableCell className="text-right text-success">{formatCurrency(item.sellingPrice - item.costPrice)}</TableCell>}
                  {isAdmin && <TableCell className="text-right text-success">{formatCurrency((item.sellingPrice - item.costPrice) * item.quantity * item.unitsPerItem)}</TableCell>}
                  {isAdmin && <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
