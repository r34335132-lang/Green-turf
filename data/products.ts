import { supabase } from '@/lib/supabase';
import { APP_LIMITS } from '@/constants/limits';

export interface Product {
  id: string;
  name: string;
  category_id?: string;
  category: string;
  height: number;
  pricePerM2: number;
  description: string;
  features: string[];
  tags: string[];
  image: string; // Ahora será una URL (string) que vendrá del Bucket
  rating: number;
  reviews: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  colors: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

// 1. Obtener todas las categorías desde Supabase
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
    
  if (error) {
    console.error("Error al cargar categorías:", error.message);
    return [];
  }
  return data || [];
}

export function mapProductRow(p: Record<string, unknown>): Product {
  const categories = p.categories as { name?: string } | null | undefined;
  return {
    id: p.id as string,
    name: p.name as string,
    category_id: p.category_id as string | undefined,
    category: categories?.name || 'General',
    height: Number(p.height),
    pricePerM2: Number(p.price_per_m2),
    description: (p.description as string) || '',
    features: (p.features as string[]) || [],
    tags: (p.tags as string[]) || [],
    image: (p.image_url as string) || '',
    rating: Number(p.rating) || 0,
    reviews: 0,
    isNew: Boolean(p.is_new),
    isBestSeller: Boolean(p.is_best_seller),
    colors: [],
  };
}

// 2. Obtener productos visibles en catálogo (excluye pausados)
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories ( name )
    `)
    .or('is_paused.is.null,is_paused.eq.false')
    .order('created_at', { ascending: false })
    .limit(APP_LIMITS.maxProductsInCatalog);

  if (error) {
    console.error('[getProducts] Error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return [];
  }

  console.log('[getProducts] Productos cargados:', data?.length ?? 0);
  return (data || []).map((p) => mapProductRow(p));
}

// Admin: incluye productos pausados
export async function getAdminProducts(): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getAdminProducts] Error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw error;
  }

  console.log('[getAdminProducts] Productos cargados:', data?.length ?? 0);
  return data || [];
}

// Mantenemos los slides del Home de forma estática y local
// para que el carrusel principal cargue de inmediato.
export const HERO_SLIDES = [
  {
    id: "h1",
    title: "El lujo\ntambién\nse pisa.",
    subtitle: "Pasto sintético premium para proyectos extraordinarios",
    image: require("../assets/images/hero_rooftop.png"),
    cta: "Explorar",
  },
  {
    id: "h2",
    title: "Transforma\ncualquier\nespacio.",
    subtitle: "Colección de pasto sintético de alta gama",
    image: require("../assets/images/hero_garden.png"),
    cta: "Ver catálogo",
  },
  {
    id: "h3",
    title: "Rendimiento\nde élite.",
    subtitle: "Superficies deportivas certificadas FIFA",
    image: require("../assets/images/hero_sports.png"),
    cta: "Descubrir",
  },
];