export interface Product {
  id: string;
  name: string;
  category: Category;
  height: number;
  pricePerM2: number;
  description: string;
  features: string[];
  tags: string[];
  image: string;
  rating: number;
  reviews: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  colors: string[];
}

export type Category =
  | "Deportivo"
  | "Residencial"
  | "Jardín"
  | "Decorativo"
  | "Canchas"
  | "Roof Garden"
  | "Pet Friendly";

export const CATEGORIES: { id: Category; icon: string; label: string }[] = [
  { id: "Deportivo", icon: "activity", label: "Deportivo" },
  { id: "Residencial", icon: "home", label: "Residencial" },
  { id: "Jardín", icon: "sun", label: "Jardín" },
  { id: "Decorativo", icon: "star", label: "Decorativo" },
  { id: "Canchas", icon: "target", label: "Canchas" },
  { id: "Roof Garden", icon: "cloud", label: "Roof Garden" },
  { id: "Pet Friendly", icon: "heart", label: "Pet Friendly" },
];

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Summit Pro",
    category: "Deportivo",
    height: 50,
    pricePerM2: 180,
    description:
      "El pasto sintético de alto rendimiento para atletas profesionales. Diseñado para soportar las condiciones más exigentes con una superficie de juego perfecta.",
    features: [
      "Drenaje ultra rápido",
      "Resistente a UV",
      "Certificado FIFA Quality",
      "Durabilidad 15+ años",
    ],
    tags: ["Profesional", "Alta resistencia", "FIFA"],
    image: require("../assets/images/hero_sports.png"),
    rating: 4.9,
    reviews: 128,
    isBestSeller: true,
    colors: ["#2D7A00", "#4CAF00", "#6DBE00"],
  },
  {
    id: "p2",
    name: "Urban Lux",
    category: "Residencial",
    height: 40,
    pricePerM2: 220,
    description:
      "La experiencia premium para jardines residenciales. Apariencia natural impresionante con una suavidad inigualable al tacto.",
    features: [
      "Ultra suave al tacto",
      "Color natural permanente",
      "Sin mantenimiento",
      "Garantía 10 años",
    ],
    tags: ["Premium", "Natural", "Soft Touch"],
    image: require("../assets/images/hero_garden.png"),
    rating: 4.8,
    reviews: 94,
    isNew: false,
    colors: ["#3D8B00", "#5CAB00", "#6DBE00"],
  },
  {
    id: "p3",
    name: "Skyline Terrace",
    category: "Roof Garden",
    height: 30,
    pricePerM2: 200,
    description:
      "Transformá tu terraza en un oasis urbano. Peso ultra ligero, resistente al viento y a las condiciones climáticas extremas.",
    features: [
      "Peso ultraligero",
      "Resistente al viento",
      "Impermeable total",
      "Instalación fácil",
    ],
    tags: ["Terraza", "Ligero", "Urban"],
    image: require("../assets/images/hero_rooftop.png"),
    rating: 4.7,
    reviews: 67,
    isNew: true,
    colors: ["#4A9B00", "#5FAF00", "#6DBE00"],
  },
  {
    id: "p4",
    name: "PetSafe Plus",
    category: "Pet Friendly",
    height: 38,
    pricePerM2: 210,
    description:
      "El paraíso de tus mascotas. Diseñado especialmente con materiales no tóxicos, antibacteriales y de fácil limpieza.",
    features: [
      "No tóxico certificado",
      "Antibacterial",
      "Fácil limpieza",
      "Antideslizante",
    ],
    tags: ["Mascotas", "Seguro", "Antibacterial"],
    image: require("../assets/images/category_pet.png"),
    rating: 4.9,
    reviews: 156,
    isBestSeller: true,
    colors: ["#3D9B00", "#58B800", "#6DBE00"],
  },
  {
    id: "p5",
    name: "Deco Wave",
    category: "Decorativo",
    height: 25,
    pricePerM2: 240,
    description:
      "Arte que se pisa. Pasto decorativo de diseño con texturas únicas para interiores y exteriores de lujo.",
    features: [
      "Diseño exclusivo",
      "Textura 3D única",
      "Interior/Exterior",
      "Colores personalizables",
    ],
    tags: ["Exclusivo", "Diseño", "Arte"],
    image: require("../assets/images/category_decorative.png"),
    rating: 4.6,
    reviews: 43,
    isNew: true,
    colors: ["#6DBE00", "#89D400", "#A5F000"],
  },
  {
    id: "p6",
    name: "Villa Premium",
    category: "Residencial",
    height: 45,
    pricePerM2: 250,
    description:
      "El estándar más alto en jardines residenciales de lujo. Cada fibra diseñada para replicar la perfección del pasto natural.",
    features: [
      "Fibra cuádruple",
      "Máxima densidad",
      "Color multi-tono",
      "Garantía 15 años",
    ],
    tags: ["Ultra Premium", "Lujo", "Top Tier"],
    image: require("../assets/images/hero_garden.png"),
    rating: 5.0,
    reviews: 38,
    isNew: true,
    colors: ["#2D7A00", "#4CAF00", "#6DBE00"],
  },
  {
    id: "p7",
    name: "Champion Field",
    category: "Canchas",
    height: 60,
    pricePerM2: 160,
    description:
      "La superficie de juego favorita de entrenadores y jugadores profesionales. Amortiguación óptima y tracción perfecta.",
    features: [
      "Amortiguación deportiva",
      "Tracción profesional",
      "Alta densidad",
      "Certificado FIFA",
    ],
    tags: ["Fútbol", "Profesional", "Cancha"],
    image: require("../assets/images/hero_sports.png"),
    rating: 4.8,
    reviews: 211,
    isBestSeller: true,
    colors: ["#1A6B00", "#2D8A00", "#4AAF00"],
  },
  {
    id: "p8",
    name: "Garden Elite",
    category: "Jardín",
    height: 35,
    pricePerM2: 195,
    description:
      "La solución perfecta para jardines que lucen impecables durante todo el año, sin importar el clima.",
    features: [
      "Todo clima",
      "Resistente heladas",
      "Drenaje natural",
      "Anti-hongos",
    ],
    tags: ["Jardín", "Todo clima", "Natural"],
    image: require("../assets/images/category_terrace.png"),
    rating: 4.7,
    reviews: 89,
    colors: ["#3D8B00", "#5CAB00", "#72C800"],
  },
];

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
