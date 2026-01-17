import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function StaffManagement() {
  const { users, addUser, deleteUser } = useData();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', staffId: '', role: 'staff' as 'admin' | 'supervisor' | 'staff' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addUser(formData);
      toast({ title: 'Staff member added', description: `${formData.name} has been added.` });
      setFormData({ name: '', staffId: '', role: 'staff' });
      setIsOpen(false);
    } catch (err) {
      toast({
        title: 'Not supported yet',
        description: err instanceof Error ? err.message : 'Staff creation is not enabled on the backend yet.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteUser(id);
      toast({ title: 'Staff removed', description: `${name} has been removed.` });
    } catch (err) {
      toast({
        title: 'Not supported yet',
        description: err instanceof Error ? err.message : 'Staff deletion is not enabled on the backend yet.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div><h1 className="text-2xl font-display font-bold">Staff Management</h1><p className="text-muted-foreground">Manage staff accounts</p></div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild><Button className="gradient-gold text-primary-foreground"><Plus className="w-4 h-4 mr-2" />Add Staff</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div><Label>Staff ID</Label><Input value={formData.staffId} onChange={(e) => setFormData({ ...formData, staffId: e.target.value })} required /></div>
              <div><Label>Role</Label><Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as 'admin' | 'supervisor' | 'staff' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="staff">Staff</SelectItem><SelectItem value="supervisor">Supervisor</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></div>
              <p className="text-sm text-muted-foreground">Default password: Staff ID</p>
              <Button type="submit" className="w-full gradient-gold text-primary-foreground">Add Staff</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Staff Members</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Staff ID</TableHead><TableHead>Role</TableHead><TableHead>Joined</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.staffId}</TableCell>
                  <TableCell><Badge variant={user.role === 'admin' ? 'default' : user.role === 'supervisor' ? 'outline' : 'secondary'} className={user.role === 'admin' ? 'bg-primary text-primary-foreground' : user.role === 'supervisor' ? 'border-amber-500 text-amber-600' : ''}>{user.role}</Badge></TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">{user.role !== 'admin' && <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id, user.name)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
