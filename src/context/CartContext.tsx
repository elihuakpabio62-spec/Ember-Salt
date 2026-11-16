import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_STORE_SETTINGS } from '@/src/data/showcaseCatalog';
import { fetchStoreSettings } from '@/src/services/menuService';
import type { CartItem, FoodItem, StoreSettings } from '@/src/types';

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  isModalOpen: boolean;
  storeSettings: StoreSettings;
  refreshStoreSettings: () => Promise<void>;
  addToBag: (food: FoodItem, quantity?: number) => void;
  orderNowSingle: (food: FoodItem) => void;
  updateQuantity: (foodId: string, quantity: number) => void;
  removeItem: (foodId: string) => void;
  clearBag: () => void;
  openModal: () => void;
  closeModal: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  const refreshStoreSettings = useCallback(async () => {
    try {
      const settings = await fetchStoreSettings();
      setStoreSettings(settings);
    } catch {
      // Keep default settings if network fetch fails
    }
  }, []);

  useEffect(() => {
    refreshStoreSettings();
  }, [refreshStoreSettings]);

  const addToBag = useCallback((food: FoodItem, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((entry) => entry.food.id === food.id);
      if (existing) {
        return prev.map((entry) =>
          entry.food.id === food.id
            ? { ...entry, quantity: entry.quantity + quantity }
            : entry
        );
      }
      return [...prev, { food, quantity }];
    });
  }, []);

  const orderNowSingle = useCallback((food: FoodItem) => {
    setItems((prev) => {
      const existing = prev.find((entry) => entry.food.id === food.id);
      if (existing) return prev;
      return [...prev, { food, quantity: 1 }];
    });
    setIsModalOpen(true);
  }, []);

  const updateQuantity = useCallback((foodId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((entry) => entry.food.id !== foodId));
      return;
    }
    setItems((prev) =>
      prev.map((entry) => (entry.food.id === foodId ? { ...entry, quantity } : entry))
    );
  }, []);

  const removeItem = useCallback((foodId: string) => {
    setItems((prev) => prev.filter((entry) => entry.food.id !== foodId));
  }, []);

  const clearBag = useCallback(() => {
    setItems([]);
  }, []);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const totalItems = useMemo(
    () => items.reduce((sum, entry) => sum + entry.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, entry) => sum + entry.food.price * entry.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        isModalOpen,
        storeSettings,
        refreshStoreSettings,
        addToBag,
        orderNowSingle,
        updateQuantity,
        removeItem,
        clearBag,
        openModal,
        closeModal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
