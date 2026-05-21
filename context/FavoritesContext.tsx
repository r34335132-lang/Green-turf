import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { Product } from "@/data/products";

interface FavoritesContextType {
  favorites: Product[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (product: Product) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("favorites").then((data) => {
      if (data) setFavorites(JSON.parse(data));
    });
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (product: Product) => {
      setFavorites((prev) => {
        const next = prev.some((f) => f.id === product.id)
          ? prev.filter((f) => f.id !== product.id)
          : [...prev, product];
        AsyncStorage.setItem("favorites", JSON.stringify(next));
        return next;
      });
    },
    []
  );

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
