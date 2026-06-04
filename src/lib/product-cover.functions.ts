import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Input = z.object({
  productId: z.string().uuid(),
  brief: z.string().min(3).max(800),
  style: z
    .enum(["modern", "elegant", "bold", "minimal", "playful"])
    .default("modern"),
});

const STYLE_HINT: Record<string, string> = {
  modern:
    "modern editorial digital product cover, clean geometric composition, soft gradients, premium tech feel, vibrant accent color",
  elegant:
    "elegant luxury cover, soft beige and deep navy palette, refined typography space, subtle gold accents, sophisticated lighting",
  bold:
    "bold high-contrast cover, saturated colors, dynamic shapes, strong focal element, confident energetic vibe",
  minimal:
    "ultra minimal cover, lots of whitespace, single iconic element, restrained palette, swiss design feel",
  playful:
    "playful illustrated cover, friendly rounded shapes, warm pastel palette, hand-crafted feel, approachable",
};

export const generateProductCover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // verify ownership
    const { data: product, error: pErr } = await supabase
      .from("user_products")
      .select("id, user_id, title")
      .eq("id", data.productId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!product || product.user_id !== userId) {
      throw new Error("Brak dostępu do produktu");
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Brak konfiguracji AI");

    const prompt = [
      `Design a stunning portrait cover image (4:5) for a digital product.`,
      `Product brief: ${data.brief}.`,
      `Style: ${STYLE_HINT[data.style]}.`,
      `No text, no letters, no logos, no watermarks — pure visual composition only.`,
      `High quality, photographic or 3d-rendered feel, sharp focal point, balanced composition, premium poster-like aesthetic suitable as a digital product cover.`,
    ].join(" ");

    const res = await fetch(
      "https://ai.gateway.lovable.dev/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      },
    );

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Limit AI — spróbuj za chwilę");
      if (res.status === 402) throw new Error("Brak kredytów AI w workspace");
      throw new Error(`Błąd generowania: ${res.status} ${txt.slice(0, 120)}`);
    }

    const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("AI nie zwróciło obrazu");

    const buffer = Buffer.from(b64, "base64");
    const path = `${userId}/${data.productId}/cover-ai-${Date.now()}.png`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("product-assets")
      .upload(path, buffer, {
        contentType: "image/png",
        upsert: true,
        cacheControl: "3600",
      });
    if (upErr) throw new Error(upErr.message);

    const { data: pub } = supabaseAdmin.storage
      .from("product-assets")
      .getPublicUrl(path);

    const { error: updErr } = await supabaseAdmin
      .from("user_products")
      .update({ cover_url: pub.publicUrl })
      .eq("id", data.productId);
    if (updErr) throw new Error(updErr.message);

    return { coverUrl: pub.publicUrl };
  });
