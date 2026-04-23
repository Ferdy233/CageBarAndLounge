"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { InventoryItem, Sale, Notification, User, SaleItem, StockAdjustment, Category } from '@/types';
import { apiFetchAuth, getAccessToken } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type ApiCategory = {
  id: number;
  name: string;
  created_at: string;
};

type ApiInventoryItem = {
  id: number;
  name: string;
  cost_price?: string | number;
  selling_price: string | number;
  quantity: number;
  min_stock_threshold: number;
  category: string;
  units_per_item?: number;
  is_carton?: boolean;
  created_at: string;
  updated_at: string;
};

type ApiSaleItem = {
  id: number;
  sale: number;
  item: number;
  item_name: string;
  quantity: number;
  cost_price?: string | number;
  selling_price: string | number;
};

type ApiSale = {
  id: number;
  staff: number;
  staff_id: string;
  staff_name: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  items: ApiSaleItem[];
  total_amount?: string | number;
  total_profit?: string | number;
};

type ApiSaleCreateResponse = {
  id: number;
  staff: number;
  staff_id: string;
  staff_name: string;
  created_at: string;
  items: ApiSaleItem[];
};

type ApiSaleItemCreateResponse = {
  id: number;
  sale: number;
  item: number;
  item_name: string;
  quantity: number;
  cost_price?: string | number;
  selling_price: string | number;
};

type ApiUser = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  staff_profile?: { staff_id: string; role: "admin" | "staff"; created_at: string } | null;
  date_joined: string;
};

function mapInventoryFromApi(item: ApiInventoryItem): InventoryItem {
  const rawCostPrice = item.cost_price ?? 0;
  const parsedCostPrice = typeof rawCostPrice === "string" ? parseFloat(rawCostPrice) : rawCostPrice;
  return {
    id: String(item.id),
    name: item.name,
    costPrice: parsedCostPrice,
    sellingPrice: typeof item.selling_price === "string" ? parseFloat(item.selling_price) : item.selling_price,
    quantity: item.quantity,
    minStockThreshold: item.min_stock_threshold,
    category: item.category,
    unitsPerItem: item.units_per_item ?? 1,
    isCarton: item.is_carton ?? false,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function mapUserFromApi(u: ApiUser): User {
  const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.username;
  return {
    id: String(u.id),
    name,
    staffId: u.staff_profile?.staff_id ?? u.username,
    role: u.staff_profile?.role ?? 'staff',
    createdAt: u.date_joined,
  };
}

function mapInventoryToApi(
  item: Partial<InventoryItem>
): Partial<Pick<ApiInventoryItem, "name" | "cost_price" | "selling_price" | "quantity" | "min_stock_threshold" | "category" | "units_per_item" | "is_carton">> {
  const mapped: Partial<Pick<
    ApiInventoryItem,
    "name" | "cost_price" | "selling_price" | "quantity" | "min_stock_threshold" | "category" | "units_per_item" | "is_carton"
  >> = {};

  if (item.name !== undefined) mapped.name = item.name;
  if (item.costPrice !== undefined) mapped.cost_price = item.costPrice;
  if (item.sellingPrice !== undefined) mapped.selling_price = item.sellingPrice;
  if (item.quantity !== undefined) mapped.quantity = item.quantity;
  if (item.minStockThreshold !== undefined) mapped.min_stock_threshold = item.minStockThreshold;
  if (item.category !== undefined) mapped.category = item.category;
  if (item.unitsPerItem !== undefined) mapped.units_per_item = item.unitsPerItem;
  if (item.isCarton !== undefined) mapped.is_carton = item.isCarton;

  return mapped;
}

function mapSaleItemFromApi(item: ApiSaleItem): SaleItem {
  const hasCostPrice = item.cost_price !== undefined && item.cost_price !== null;
  const rawCostPrice = item.cost_price ?? 0;
  const normalizedCostPrice = typeof rawCostPrice === "string" ? parseFloat(rawCostPrice) : rawCostPrice;
  const sellingPrice = typeof item.selling_price === "string" ? parseFloat(item.selling_price) : item.selling_price;
  const totalPrice = sellingPrice * item.quantity;
  const profit = hasCostPrice ? (sellingPrice - normalizedCostPrice) * item.quantity : 0;

  return {
    itemId: String(item.item),
    itemName: item.item_name,
    quantity: item.quantity,
    costPrice: normalizedCostPrice,
    sellingPrice,
    totalPrice,
    profit,
  };
}

function mapSaleFromApi(sale: ApiSale): Sale {
  const items = (sale.items ?? []).map(mapSaleItemFromApi);
  const totalAmount = sale.total_amount ? (typeof sale.total_amount === "string" ? parseFloat(sale.total_amount) : sale.total_amount) : items.reduce((sum, i) => sum + i.totalPrice, 0);
  const totalProfit = sale.total_profit ? (typeof sale.total_profit === "string" ? parseFloat(sale.total_profit) : sale.total_profit) : items.reduce((sum, i) => sum + i.profit, 0);

  return {
    id: String(sale.id),
    items,
    totalAmount,
    totalProfit,
    paymentMethod: sale.payment_method as 'cash' | 'momo' | 'pending',
    paymentStatus: sale.payment_status as 'paid' | 'pending',
    staffId: sale.staff_id,
    staffName: sale.staff_name,
    createdAt: sale.created_at,
  };
}

interface DataContextType {
  // Inventory
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  
  // Sales
  sales: Sale[];
  addSale: (items: SaleItem[], staffId: string, staffName: string, paymentMethod?: string, paymentStatus?: string) => Promise<void>;
  updateSalePayment: (saleId: string, paymentMethod: string, paymentStatus: string) => Promise<void>;
  
  // Notifications
  notifications: Notification[];
  markNotificationRead: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  unreadCount: number;
  
  // Users (admin only)
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  // Stock Adjustments
  stockAdjustments: StockAdjustment[];
  addStockAdjustment: (adjustment: Omit<StockAdjustment, 'id' | 'createdAt'>) => Promise<void>;

  // Categories (admin can create/delete)
  categories: Category[];
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Utilities
  refreshData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [inventory, setInventoryState] = useState<InventoryItem[]>([]);
  const [sales, setSalesState] = useState<Sale[]>([]);
  const [notifications, setNotificationsState] = useState<Notification[]>([]);
  const [users, setUsersState] = useState<User[]>([]);
  const [stockAdjustments, setStockAdjustmentsState] = useState<StockAdjustment[]>([]);
  const [categories, setCategoriesState] = useState<Category[]>([]);

  const loadInventory = useCallback(async () => {
    const items = await apiFetchAuth<ApiInventoryItem[]>("/api/inventory-items/");
    const mapped = items.map(mapInventoryFromApi);
    setInventoryState(mapped);
    return mapped;
  }, []);

  const loadSales = useCallback(async () => {
    const apiSales = await apiFetchAuth<ApiSale[]>("/api/sales/");
    const mapped = apiSales.map(mapSaleFromApi);
    setSalesState(mapped);
    return mapped;
  }, []);

  const loadUsers = useCallback(async () => {
    const apiUsers = await apiFetchAuth<ApiUser[]>("/api/users/");
    const mapped = apiUsers.map(mapUserFromApi);
    setUsersState(mapped);
    return mapped;
  }, []);

  const loadCategories = useCallback(async () => {
    const apiCategories = await apiFetchAuth<ApiCategory[]>("/api/categories/");
    const mapped: Category[] = apiCategories.map((c) => ({
      id: String(c.id),
      name: c.name,
      createdAt: c.created_at,
    }));
    setCategoriesState(mapped);
    return mapped;
  }, []);

  const refreshData = useCallback(() => {
    const token = getAccessToken();
    if (!token) {
      setInventoryState([]);
      setSalesState([]);
      setUsersState([]);
      setCategoriesState([]);
      return;
    }

    void Promise.all([
      loadInventory().catch(() => {
        setInventoryState([]);
        return [] as InventoryItem[];
      }),
      loadSales().catch(() => {
        setSalesState([]);
        return [] as Sale[];
      }),
      loadUsers().catch(() => {
        setUsersState([]);
        return [] as User[];
      }),
      loadCategories().catch(() => {
        setCategoriesState([]);
        return [] as Category[];
      }),
    ]);
  }, [loadInventory, loadSales, loadUsers, loadCategories]);

  useEffect(() => {
    if (isLoading) return;
    refreshData();
  }, [isAuthenticated, isLoading, refreshData]);

  const checkStockLevels = useCallback((items: InventoryItem[]) => {
    const newNotifications: Notification[] = [];
    
    items.forEach((item) => {
      if (item.quantity === 0) {
        newNotifications.push({
          id: crypto.randomUUID(),
          type: 'out_of_stock',
          title: 'Out of Stock',
          message: `${item.name} is completely out of stock!`,
          itemId: item.id,
          read: false,
          createdAt: new Date().toISOString(),
        });
      } else if (item.quantity <= item.minStockThreshold) {
        newNotifications.push({
          id: crypto.randomUUID(),
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${item.name} is running low (${item.quantity} remaining)`,
          itemId: item.id,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    });

    if (newNotifications.length > 0) {
      setNotificationsState((existingNotifications) => {
        const filteredNew = newNotifications.filter(
          (n) => !existingNotifications.some(
            (e) => e.itemId === n.itemId && e.type === n.type && !e.read
          )
        );

        if (filteredNew.length === 0) return existingNotifications;
        return [...filteredNew, ...existingNotifications];
      });
    }
  }, []);

  // Inventory functions
  const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await apiFetchAuth<ApiInventoryItem>("/api/inventory-items/", {
      method: "POST",
      body: mapInventoryToApi(item),
    });
    const mapped = mapInventoryFromApi(created);
    setInventoryState((prev) => {
      const updated = [...prev, mapped].sort((a, b) => a.name.localeCompare(b.name));
      checkStockLevels(updated);
      return updated;
    });
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    const updatedItem = await apiFetchAuth<ApiInventoryItem>(`/api/inventory-items/${id}/`, {
      method: "PATCH",
      body: mapInventoryToApi(updates),
    });
    const mapped = mapInventoryFromApi(updatedItem);

    setInventoryState((prev) => {
      const next = prev.map((i) => (i.id === id ? mapped : i)).sort((a, b) => a.name.localeCompare(b.name));
      checkStockLevels(next);
      return next;
    });
  };

  const deleteInventoryItem = async (id: string) => {
    await apiFetchAuth<void>(`/api/inventory-items/${id}/`, { method: "DELETE" });
    setInventoryState((prev) => {
      const next = prev.filter((i) => i.id !== id);
      checkStockLevels(next);
      return next;
    });
  };

  // Sales functions
  const addSale = async (items: SaleItem[], _staffId: string, _staffName: string, paymentMethod?: string, paymentStatus?: string) => {
    if (items.length === 0) return;

    const createdSale = await apiFetchAuth<ApiSaleCreateResponse>("/api/sales/", {
      method: "POST",
      body: {
        payment_method: paymentMethod || 'cash',
        payment_status: paymentStatus || 'paid',
      },
    });

    try {
      await Promise.all(
        items.map((i) =>
          apiFetchAuth<ApiSaleItemCreateResponse>("/api/sale-items/", {
            method: "POST",
            body: {
              sale: createdSale.id,
              item: Number(i.itemId),
              quantity: i.quantity,
              // DRF DecimalField(max_digits=10, decimal_places=2) requires controlled precision
              selling_price: Number(i.sellingPrice.toFixed(2)),
            },
          })
        )
      );
    } catch (error) {
      try {
        await apiFetchAuth<void>(`/api/sales/${createdSale.id}/`, { method: "DELETE" });
      } catch {
        // Best-effort rollback; original error is thrown below.
      }
      throw error;
    }

    refreshData();
  };

  const updateSalePayment = async (saleId: string, paymentMethod: string, paymentStatus: string) => {
    await apiFetchAuth<ApiSale>(`/api/sales/${saleId}/`, {
      method: "PATCH",
      body: {
        payment_method: paymentMethod,
        payment_status: paymentStatus,
      },
    });
    refreshData();
  };

  // Notification functions
  const markNotificationRead = async (id: string) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotificationsState(updated);
  };

  const clearNotifications = async () => {
    setNotificationsState([]);
  };

  // User management functions
  const addUser = async (user: Omit<User, 'id' | 'createdAt'>) => {
    const rawName = (user.name ?? "").trim();
    const parts = rawName.split(" ").filter(Boolean);
    const firstName = parts.length > 0 ? parts[0] : "";
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";

    await apiFetchAuth<ApiUser>("/api/users/create-staff/", {
      method: "POST",
      body: {
        username: user.staffId,
        staff_id: user.staffId,
        role: user.role,
        name: rawName,
        first_name: firstName,
        last_name: lastName,
      },
    });
    refreshData();
  };

  const updateUser = async () => {
    throw new Error("Update staff is not supported yet");
  };

  const deleteUser = async (id: string) => {
    await apiFetchAuth<void>(`/api/users/${id}/delete-staff/`, { method: "DELETE" });
    refreshData();
  };

  // Stock adjustment functions
  const addStockAdjustment = async () => {
    throw new Error("Stock adjustments API not wired yet");
  };

  // Category functions
  const addCategory = async (name: string) => {
    const created = await apiFetchAuth<ApiCategory>("/api/categories/", {
      method: "POST",
      body: { name },
    });
    setCategoriesState((prev) => [
      ...prev,
      { id: String(created.id), name: created.name, createdAt: created.created_at },
    ].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const deleteCategory = async (id: string) => {
    await apiFetchAuth<void>(`/api/categories/${id}/`, { method: "DELETE" });
    setCategoriesState((prev) => prev.filter((c) => c.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DataContext.Provider
      value={{
        inventory,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        sales,
        addSale,
        updateSalePayment,
        notifications,
        markNotificationRead,
        clearNotifications,
        unreadCount,
        users,
        addUser,
        updateUser,
        deleteUser,
        stockAdjustments,
        addStockAdjustment,
        categories,
        addCategory,
        deleteCategory,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
