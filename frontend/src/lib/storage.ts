import { InventoryItem, Notification, Sale, StockAdjustment, User } from "@/types";

const STORAGE_KEYS = {
  USERS: "bar_lounge_users",
  CURRENT_USER: "bar_lounge_current_user",
  INVENTORY: "bar_lounge_inventory",
  SALES: "bar_lounge_sales",
  NOTIFICATIONS: "bar_lounge_notifications",
  STOCK_ADJUSTMENTS: "bar_lounge_stock_adjustments",
} as const;

function getItem<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === "undefined") return defaultValue;
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getUsers(): User[] {
  return getItem<User[]>(STORAGE_KEYS.USERS, getDefaultUsers());
}

export function setUsers(users: User[]): void {
  setItem(STORAGE_KEYS.USERS, users);
}

export function getCurrentUser(): User | null {
  return getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
}

export function setCurrentUser(user: User | null): void {
  setItem(STORAGE_KEYS.CURRENT_USER, user);
}

export function getDefaultUsers(): User[] {
  return [
    {
      id: "1",
      name: "Admin",
      staffId: "ADMIN001",
      role: "admin",
      createdAt: new Date().toISOString(),
    },
  ];
}

export function getInventory(): InventoryItem[] {
  return getItem<InventoryItem[]>(STORAGE_KEYS.INVENTORY, getDefaultInventory());
}

export function setInventory(inventory: InventoryItem[]): void {
  setItem(STORAGE_KEYS.INVENTORY, inventory);
}

export function getDefaultInventory(): InventoryItem[] {
  return [
    {
      id: "1",
      name: "Hennessy VS",
      costPrice: 35,
      sellingPrice: 55,
      quantity: 24,
      minStockThreshold: 5,
      category: "Spirits",
      unitsPerItem: 1,
      isCarton: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Johnnie Walker Black",
      costPrice: 28,
      sellingPrice: 45,
      quantity: 18,
      minStockThreshold: 5,
      category: "Spirits",
      unitsPerItem: 1,
      isCarton: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "3",
      name: "Grey Goose Vodka",
      costPrice: 30,
      sellingPrice: 50,
      quantity: 12,
      minStockThreshold: 4,
      category: "Spirits",
      unitsPerItem: 1,
      isCarton: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "4",
      name: "Moet Champagne",
      costPrice: 40,
      sellingPrice: 75,
      quantity: 8,
      minStockThreshold: 3,
      category: "Champagne",
      unitsPerItem: 1,
      isCarton: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "5",
      name: "Corona Extra",
      costPrice: 2,
      sellingPrice: 5,
      quantity: 48,
      minStockThreshold: 12,
      category: "Beer",
      unitsPerItem: 1,
      isCarton: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function getSales(): Sale[] {
  return getItem<Sale[]>(STORAGE_KEYS.SALES, []);
}

export function setSales(sales: Sale[]): void {
  setItem(STORAGE_KEYS.SALES, sales);
}

export function getNotifications(): Notification[] {
  return getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
}

export function setNotifications(notifications: Notification[]): void {
  setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
}

export function getStockAdjustments(): StockAdjustment[] {
  return getItem<StockAdjustment[]>(STORAGE_KEYS.STOCK_ADJUSTMENTS, []);
}

export function setStockAdjustments(adjustments: StockAdjustment[]): void {
  setItem(STORAGE_KEYS.STOCK_ADJUSTMENTS, adjustments);
}

export function initializeStorage(): void {
  if (typeof window === "undefined") return;
  if (!window.localStorage.getItem(STORAGE_KEYS.USERS)) {
    setUsers(getDefaultUsers());
  }
  if (!window.localStorage.getItem(STORAGE_KEYS.INVENTORY)) {
    setInventory(getDefaultInventory());
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
