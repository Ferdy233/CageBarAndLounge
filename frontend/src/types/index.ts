export type UserRole = 'admin' | 'supervisor' | 'staff';

export interface User {
  id: string;
  name: string;
  staffId: string;
  role: UserRole;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  minStockThreshold: number;
  category: string;
  unitsPerItem: number;
  isCarton: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  itemId: string;
  itemName: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  totalPrice: number;
  profit: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  totalProfit: number;
  paymentMethod: 'cash' | 'momo' | 'pending';
  paymentStatus: 'paid' | 'pending';
  staffId: string;
  staffName: string;
  createdAt: string;
}

export interface DailyReport {
  date: string;
  totalRevenue: number;
  totalProfit: number;
  totalLoss: number;
  itemsSold: number;
  salesCount: number;
  topSellingItems: { name: string; quantity: number }[];
}

export interface Notification {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'general';
  title: string;
  message: string;
  itemId?: string;
  read: boolean;
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  itemId: string;
  itemName: string;
  expectedStock: number;
  actualStock: number;
  difference: number;
  adjustedBy: string;
  reason: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}
