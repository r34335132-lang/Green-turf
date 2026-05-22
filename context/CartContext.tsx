import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { APP_LIMITS, getProductPrice } from "@/constants/limits";
import { Product } from "@/data/products";

export interface CartItem {
  product: Product;
  quantity: number;
  area: number;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addToCart: (product: Product, area?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function normalizeStoredProduct(raw: unknown): Product | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const nested = p.product as Record<string, unknown> | undefined;
  const src = nested && typeof nested === "object" ? nested : p;
  if (!src.id || !src.name) return null;
  return {
    id: String(src.id),
    name: String(src.name),
    category: String(src.category || "General"),
    category_id: src.category_id as string | undefined,
    height: Number(src.height) || 0,
    pricePerM2: getProductPrice(src as { pricePerM2?: number; price_per_m2?: number; price?: number }),
    description: String(src.description || ""),
    features: Array.isArray(src.features) ? (src.features as string[]) : [],
    tags: Array.isArray(src.tags) ? (src.tags as string[]) : [],
    image: String(src.image || src.image_url || ""),
    rating: Number(src.rating) || 0,
    reviews: 0,
    colors: [],
    isNew: Boolean(src.isNew ?? src.is_new),
    isBestSeller: Boolean(src.isBestSeller ?? src.is_best_seller),
  };
}

function normalizeCartItem(raw: unknown): CartItem | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const product = normalizeStoredProduct(row.product ?? row);
  if (!product) return null;
  const area = Math.min(
    APP_LIMITS.maxCartAreaPerItem,
    Math.max(1, Number(row.area) || 1)
  );
  return {
    product,
    quantity: Math.max(1, Number(row.quantity) || 1),
    area,
  };
}

export function getCartLineTotal(item: CartItem): number {
  return getProductPrice(item.product) * item.area * item.quantity;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("cart").then((data) => {
      if (!data) return;
      try {
        const parsed = JSON.parse(data) as unknown[];
        const normalized = (Array.isArray(parsed) ? parsed : [])
          .map(normalizeCartItem)
          .filter((i): i is CartItem => i !== null)
          .slice(0, APP_LIMITS.maxCartItems);
        setItems(normalized);
        if (normalized.length !== parsed.length) {
          AsyncStorage.setItem("cart", JSON.stringify(normalized));
        }
      } catch {
        AsyncStorage.removeItem("cart");
      }
    });
  }, []);

  const save = useCallback((newItems: CartItem[]) => {
    setItems(newItems);
    AsyncStorage.setItem("cart", JSON.stringify(newItems));
  }, []);

  const addToCart = useCallback(
    (product: Product, area: number = 1) => {
      const safeArea = Math.min(
        APP_LIMITS.maxCartAreaPerItem,
        Math.max(1, Math.ceil(area))
      );
      const normalized: Product = {
        ...product,
        pricePerM2: getProductPrice(product),
      };
      setItems((prev) => {
        if (!prev.find((i) => i.product.id === normalized.id) && prev.length >= APP_LIMITS.maxCartItems) {
          Alert.alert(
            "Carrito lleno",
            `Máximo ${APP_LIMITS.maxCartItems} tipos de pasto por cotización.`
          );
          return prev;
        }
        const existing = prev.find((i) => i.product.id === normalized.id);
        const next = existing
          ? prev.map((i) =>
              i.product.id === normalized.id
                ? {
                    ...i,
                    product: normalized,
                    quantity: i.quantity + 1,
                    area: Math.min(APP_LIMITS.maxCartAreaPerItem, i.area + safeArea),
                  }
                : i
            )
          : [...prev, { product: normalized, quantity: 1, area: safeArea }].slice(
              0,
              APP_LIMITS.maxCartItems
            );
        AsyncStorage.setItem("cart", JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      const next = items.filter((i) => i.product.id !== productId);
      save(next);
    },
    [items, save]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }
      const next = items.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      );
      save(next);
    },
    [items, save, removeFromCart]
  );

  const clearCart = useCallback(() => {
    save([]);
  }, [save]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + getCartLineTotal(i), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
