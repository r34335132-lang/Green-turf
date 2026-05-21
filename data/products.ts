import { supabase } from '@/lib/supabase';

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

// 2. Obtener todos los productos desde Supabase
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories ( name )
    `);

  if (error) {
    console.error("Error al cargar productos:", error.message);
    return [];
  }

  // Mapeamos los datos de SQL a la estructura que espera tu interfaz en React Native
  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    category: p.categories?.name || 'General',
    height: p.height,
    pricePerM2: p.price_per_m2,
    description: p.description,
    features: p.features || [],
    tags: p.tags || [],
    image: p.image_url, // Aquí inyectamos la URL del Bucket
    rating: Number(p.rating),
    reviews: 0, // Dato por defecto hasta que agregues sistema de reseñas
    isNew: p.is_new,
    isBestSeller: p.is_best_seller,
    colors: p.colors || [],
  }));
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