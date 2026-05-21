import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("cart").then((data) => {
      if (data) setItems(JSON.parse(data));
    });
  }, []);

  const save = useCallback((newItems: CartItem[]) => {
    setItems(newItems);
    AsyncStorage.setItem("cart", JSON.stringify(newItems));
  }, []);

  const addToCart = useCallback(
    (product: Product, area: number = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        const next = existing
          ? prev.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + 1, area: i.area + area }
                : i
            )
          : [...prev, { product, quantity: 1, area }];
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
  const totalPrice = items.reduce(
    (s, i) => s + i.product.pricePerM2 * i.area * i.quantity,
    0
  );

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
