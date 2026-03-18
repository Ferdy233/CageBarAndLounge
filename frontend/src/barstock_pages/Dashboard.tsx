import React, { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  Package,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '@/lib/utils';

export function Dashboard() {
  const { user } = useAuth();
  const { inventory, sales, notifications } = useData();
  const isAdmin = user?.role === 'admin';

  const todayStats = useMemo(() => {
    const today = new Date().toDateString();
    const todaySales = sales.filter(
      (sale) => new Date(sale.createdAt).toDateString() === today
    );

    const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalProfit = todaySales.reduce((sum, sale) => sum + sale.totalProfit, 0);
    const totalItems = todaySales.reduce(
      (sum, sale) => sum + sale.items.reduce((s, i) => s + i.quantity, 0),
      0
    );

    return {
      revenue: totalRevenue,
      profit: totalProfit,
      salesCount: todaySales.length,
      itemsSold: totalItems,
    };
  }, [sales]);

  const inventoryStats = useMemo(() => {
    const lowStock = inventory.filter(
      (item) => item.quantity > 0 && item.quantity <= item.minStockThreshold
    );
    const outOfStock = inventory.filter((item) => item.quantity === 0);
    const totalValue = inventory.reduce(
      (sum, item) => sum + item.sellingPrice * item.quantity,
      0
    );

    return { lowStock: lowStock.length, outOfStock: outOfStock.length, totalValue };
  }, [inventory]);

  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weekData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toDateString();

      const daySales = sales.filter(
        (sale) => new Date(sale.createdAt).toDateString() === dateString
      );

      weekData.push({
        day: days[date.getDay()],
        revenue: daySales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        profit: daySales.reduce((sum, sale) => sum + sale.totalProfit, 0),
      });
    }

    return weekData;
  }, [sales]);

  const categoryData = useMemo(() => {
    const categories: { [key: string]: number } = {};
    inventory.forEach((item) => {
      const value = item.sellingPrice * item.quantity;
      categories[item.category] = (categories[item.category] || 0) + value;
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [inventory]);

  const COLORS = ['hsl(38, 92%, 50%)', 'hsl(142, 76%, 36%)', 'hsl(200, 70%, 50%)', 'hsl(280, 70%, 50%)', 'hsl(0, 72%, 51%)'];

  const unreadAlerts = notifications.filter((n) => !n.read);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold">
          Welcome back, <span className="text-gradient-gold">{user?.name}</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening at your bar today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Revenue
            </CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayStats.revenue)}</div>
            <div className="flex items-center text-xs text-success mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              {todayStats.salesCount} transactions
            </div>
          </CardContent>
        </Card>

        {isAdmin ? (
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Profit
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatCurrency(todayStats.profit)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {todayStats.itemsSold} items sold
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Items Sold
              </CardTitle>
              <ShoppingCart className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.itemsSold}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                Across {todayStats.salesCount} transactions
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inventory Value
            </CardTitle>
            <Package className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(inventoryStats.totalValue)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {inventory.length} total items
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock Alerts
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventoryStats.lowStock + inventoryStats.outOfStock}
            </div>
            <div className="flex items-center gap-2 text-xs mt-1">
              {inventoryStats.outOfStock > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {inventoryStats.outOfStock} out of stock
                </Badge>
              )}
              {inventoryStats.lowStock > 0 && (
                <Badge variant="secondary" className="text-xs bg-warning/20 text-warning">
                  {inventoryStats.lowStock} low
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue Chart */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
            <CardDescription>
              {isAdmin ? 'Revenue and profit over the last 7 days' : 'Revenue over the last 7 days'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  {isAdmin && <Bar dataKey="profit" name="Profit" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Inventory by Category</CardTitle>
            <CardDescription>Distribution by selling value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Value']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {categoryData.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{category.name}</span>
                  </div>
                  <span className="text-muted-foreground">{formatCurrency(category.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {unreadAlerts.length > 0 && (
        <Card className="glass-card border-warning/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unreadAlerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20"
                >
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                  <Badge variant={alert.type === 'out_of_stock' ? 'destructive' : 'secondary'}>
                    {alert.type === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
