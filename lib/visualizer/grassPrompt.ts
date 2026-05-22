import { Product } from "@/data/products";

export type SceneType = "jardin" | "terraza" | "deportivo" | "rooftop";

const SCENE_HINTS: Record<SceneType, string> = {
  jardin: "residential backyard lawn, garden context, natural landscaping",
  terraza: "patio or terrace floor, outdoor living space, clean modern layout",
  deportivo: "sports field or training area, athletic surface, field markings optional",
  rooftop: "rooftop deck or urban terrace, drainage-friendly installation look",
};

/** Perfil visual único por producto — evita que la IA repita el mismo pasto */
export function buildGrassVisualProfile(product: Product) {
  const pile = product.height;
  const density =
    pile >= 40 ? "dense luxurious long pile" : pile >= 25 ? "medium plush pile" : "short neat trimmed pile";
  const tone = inferGrassTone(product);
  const useCase = product.category.toLowerCase();

  return {
    productName: product.name,
    pileMm: pile,
    category: product.category,
    density,
    tone,
    useCase,
    tags: product.tags.slice(0, 4),
    features: product.features.slice(0, 4),
    referenceImageUrl: typeof product.image === "string" ? product.image : "",
  };
}

function inferGrassTone(product: Product): string {
  const text = `${product.name} ${product.description} ${product.tags.join(" ")}`.toLowerCase();
  if (text.includes("olive") || text.includes("oliva")) return "olive-green natural tone";
  if (text.includes("sport") || text.includes("deport")) return "bright field-green athletic tone";
  if (text.includes("lux") || text.includes("premium")) return "rich emerald premium tone";
  if (text.includes("claro") || text.includes("light")) return "light fresh green tone";
  return "realistic medium emerald synthetic grass tone";
}

/** Prompt principal para modelos tipo Kontext / image-edit */
export function buildVisualizationPrompt(product: Product, scene: SceneType): string {
  const v = buildGrassVisualProfile(product);
  const sceneHint = SCENE_HINTS[scene];

  return [
    "Photorealistic outdoor photo edit.",
    `Replace ONLY the ground, lawn, dirt, gravel or bare soil with synthetic turf product "${v.productName}".`,
    `Grass specs: ${v.pileMm}mm pile height, ${v.density}, ${v.tone}, category ${v.useCase}.`,
    v.features.length ? `Features: ${v.features.join(", ")}.` : "",
    v.tags.length ? `Style tags: ${v.tags.join(", ")}.` : "",
    `Scene context: ${sceneHint}.`,
    "Keep buildings, walls, furniture, plants, sky and lighting unchanged.",
    "Natural shadows on grass, realistic blade texture, professional landscaping result.",
    "Do not add text, logos or watermarks.",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Negative prompt (modelos SD/Flux que lo soporten) */
export function buildNegativePrompt(): string {
  return "cartoon, plastic look, neon green, repeating pattern, blurry, watermark, text, deformed, indoor carpet";
}

export const SCENE_OPTIONS: { id: SceneType; label: string; icon: string }[] = [
  { id: "jardin", label: "Jardín", icon: "home" },
  { id: "terraza", label: "Terraza", icon: "layout" },
  { id: "deportivo", label: "Deportivo", icon: "target" },
  { id: "rooftop", label: "Rooftop", icon: "sun" },
];
