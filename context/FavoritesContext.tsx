import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { Product } from "@/data/products";

const STORAGE_KEY = "favorite_product_ids";

interface FavoritesContextType {
  favoriteIds: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (product: Product) => void;
  isLoaded: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            setFavoriteIds(parsed.filter((id): id is string => typeof id === "string"));
          }
        } catch {
          setFavoriteIds([]);
        }
      } else {
        const legacy = await AsyncStorage.getItem("favorites");
        if (legacy) {
          try {
            const parsed = JSON.parse(legacy);
            if (Array.isArray(parsed)) {
              const ids = parsed
                .map((item) => (typeof item === "string" ? item : item?.id))
                .filter((id): id is string => typeof id === "string");
              setFavoriteIds(ids);
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
              await AsyncStorage.removeItem("favorites");
            }
          } catch {
            setFavoriteIds([]);
          }
        }
      }
      setIsLoaded(true);
    })();
  }, []);

  const persist = useCallback((ids: string[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, []);

  const isFavorite = useCallback(
    (id: string) => favoriteIds.includes(id),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    (product: Product) => {
      setFavoriteIds((prev) => {
        const next = prev.includes(product.id)
          ? prev.filter((id) => id !== product.id)
          : [...prev, product.id];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite, isLoaded }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
