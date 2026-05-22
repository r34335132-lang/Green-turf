// Supabase Edge Function — deploy: supabase functions deploy visualize-grass
// Secrets: REPLICATE_API_TOKEN, optional REPLICATE_MODEL

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_MODEL = "black-forest-labs/flux-kontext-dev";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const token = Deno.env.get("REPLICATE_API_TOKEN");
    if (!token) {
      return json({ error: "REPLICATE_API_TOKEN not configured" }, 503);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const {
      spaceImageUrl,
      productId,
      productName,
      referenceImageUrl,
      prompt,
      scene,
      pileMm,
      category,
    } = body;

    if (!spaceImageUrl || !prompt) {
      return json({ error: "spaceImageUrl and prompt required" }, 400);
    }

    const model = Deno.env.get("REPLICATE_MODEL") || DEFAULT_MODEL;

    // Replicate: FLUX Kontext — edita imagen según prompt + referencia opcional
    const input: Record<string, unknown> = {
      prompt,
      input_image: spaceImageUrl,
      aspect_ratio: "match_input_image",
      output_format: "jpg",
      safety_tolerance: 2,
    };

    if (referenceImageUrl) {
      input.image_prompt = referenceImageUrl;
      input.prompt = `${prompt} Match the grass color and texture style of the reference product sample.`;
    }

    const createRes = await fetch("https://api.replicate.com/v1/models/" + model + "/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait=60",
      },
      body: JSON.stringify({ input }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("[visualize-grass] Replicate error:", errText);
      return json({ error: "Replicate failed", detail: errText }, 502);
    }

    const prediction = await createRes.json();
    let resultUrl = prediction.output;

    if (Array.isArray(resultUrl)) resultUrl = resultUrl[0];
    if (!resultUrl && prediction.urls?.get) {
      resultUrl = await pollReplicate(prediction.urls.get, token);
    }

    if (!resultUrl) {
      return json({ error: "No output image", prediction }, 502);
    }

    await supabase.from("visualization_jobs").insert({
      user_id: user.id,
      product_id: productId,
      product_name: productName,
      scene: scene || "jardin",
      pile_mm: pileMm,
      category,
      prompt_used: prompt,
      input_url: spaceImageUrl,
      result_url: resultUrl,
      provider: "replicate",
      model,
    });

    return json({ resultUrl, jobId: prediction.id });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});

async function pollReplicate(url: string, token: string, max = 30): Promise<string | null> {
  for (let i = 0; i < max; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.status === "succeeded") {
      const out = data.output;
      return Array.isArray(out) ? out[0] : out;
    }
    if (data.status === "failed") return null;
  }
  return null;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
