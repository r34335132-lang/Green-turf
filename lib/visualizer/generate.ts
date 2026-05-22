import { supabase } from "@/lib/supabase";
import { Product } from "@/data/products";
import { SceneType, buildGrassVisualProfile, buildVisualizationPrompt } from "./grassPrompt";

export type VisualizeResult = {
  resultUrl: string;
  promptUsed: string;
  jobId?: string;
};

export type VisualizeError = {
  code: "NO_API" | "LIMIT" | "UPLOAD" | "GENERATION" | "NETWORK";
  message: string;
};

/** Sube foto del espacio a Storage temporal */
export async function uploadSpacePhoto(localUri: string, userId: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const arrayBuffer = await new Response(blob).arrayBuffer();
  const path = `uploads/${userId}/${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from("visualizer")
    .upload(path, arrayBuffer, { contentType: "image/jpeg", upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from("visualizer").getPublicUrl(path);
  return data.publicUrl;
}

/** Llama Edge Function (API key de IA solo en servidor) */
export async function generateGrassVisualization(
  product: Product,
  spaceImageUrl: string,
  scene: SceneType
): Promise<VisualizeResult> {
  const profile = buildGrassVisualProfile(product);
  const prompt = buildVisualizationPrompt(product, scene);

  const { data, error } = await supabase.functions.invoke("visualize-grass", {
    body: {
      spaceImageUrl,
      productId: product.id,
      productName: product.name,
      referenceImageUrl: profile.referenceImageUrl,
      prompt,
      scene,
      pileMm: product.height,
      category: product.category,
    },
  });

  if (error) {
    const msg = error.message || "Error al generar visualización";
    if (msg.includes("REPLICATE") || msg.includes("not configured")) {
      throw { code: "NO_API", message: "Servicio de IA no configurado. Contacta al administrador." } as VisualizeError;
    }
    throw { code: "GENERATION", message: msg } as VisualizeError;
  }

  if (!data?.resultUrl) {
    throw {
      code: "GENERATION",
      message: data?.error || "No se recibió imagen del servidor",
    } as VisualizeError;
  }

  return {
    resultUrl: data.resultUrl,
    promptUsed: prompt,
    jobId: data.jobId,
  };
}

/** Conteo diario (tabla visualization_jobs — opcional) */
export async function getTodayVisualizationCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("visualization_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", start.toISOString());

  if (error) return 0;
  return count ?? 0;
}
