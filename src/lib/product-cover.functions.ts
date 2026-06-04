import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const COVER_CREDIT_COST = 15;

const FORMATS = [
  "ebook",
  "course",
  "workshop",
  "masterclass",
  "template",
  "checklist",
  "membership",
  "coaching",
  "other",
] as const;

const Input = z.object({
  productId: z.string().uuid(),
  brief: z.string().min(3).max(800),
  title: z.string().min(1).max(80),
  subtitle: z.string().max(120).optional(),
  format: z.enum(FORMATS).default("ebook"),
  style: z
    .enum(["modern", "elegant", "bold", "minimal", "playful"])
    .default("modern"),
});

const STYLE_HINT: Record<string, string> = {
  modern:
    "modern editorial digital product cover, clean geometric composition, soft gradients, premium tech feel, vibrant accent color, crisp typography",
  elegant:
    "elegant luxury cover, soft beige and deep navy palette, refined serif typography, subtle gold accents, sophisticated lighting",
  bold:
    "bold high-contrast cover, saturated colors, dynamic shapes, strong focal element, confident energetic vibe, heavy bold sans-serif typography",
  minimal:
    "ultra minimal cover, lots of whitespace, single iconic element, restrained palette, swiss design feel, refined geometric sans-serif typography",
  playful:
    "playful illustrated cover, friendly rounded shapes, warm pastel palette, hand-crafted feel, approachable, rounded display typography",
};

const FORMAT_HINT: Record<(typeof FORMATS)[number], string> = {
  ebook:
    "ebook cover artwork — vertical book cover layout with a clearly readable big title at the top half and small tagline below",
  course:
    "online course cover — landscape-friendly hero composition with course title prominently displayed and small subtitle, looks like a Udemy/Coursera-class banner",
  workshop:
    "live workshop poster — bold title, date-style accent, event poster vibe",
  masterclass:
    "premium masterclass cover — cinematic dark background, big elegant title, subtle gold/violet accents, looks like a MasterClass episode poster",
  template:
    "template pack cover — clean showcase of stylized template/document mockups in the background, with title overlay",
  checklist:
    "checklist/cheatsheet cover — printable feel, paper texture hint, big title and small subtitle",
  membership:
    "membership / community cover — warm welcoming composition, premium brand feel, big title",
  coaching:
    "1:1 coaching program cover — professional, trust-building, portrait-like composition, big title",
  other:
    "digital product cover — clear hierarchy with big title and small subtitle",
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

    // charge credits up-front (refund on failure)
    const { data: charged, error: cErr } = await supabaseAdmin.rpc(
      "consume_credits",
      {
        _user_id: userId,
        _amount: COVER_CREDIT_COST,
        _description: `Okładka AI: ${data.title}`,
      },
    );
    if (cErr) throw new Error(cErr.message);
    if (charged === false) {
      throw new Error(
        `Brak kredytów AI (potrzeba ${COVER_CREDIT_COST}). Doładuj pakiet w sekcji Kredyty.`,
      );
    }

    const refund = async () => {
      await supabaseAdmin.rpc("add_credits", {
        _user_id: userId,
        _amount: COVER_CREDIT_COST,
        _type: "bonus",
        _description: `Zwrot za nieudaną okładkę AI`,
        _bonus_validity_days: 30,
      });
    };

    try {
      const subtitleLine = data.subtitle?.trim()
        ? `Small subtitle text: "${data.subtitle.trim()}".`
        : "";

      const prompt = [
        `Design a stunning, professional ${FORMAT_HINT[data.format]}.`,
        `Aspect ratio 4:5 portrait.`,
        `Product brief: ${data.brief}.`,
        `BIG TITLE TEXT on the cover (must be perfectly legible, correctly spelled, no typos, no extra letters): "${data.title}".`,
        subtitleLine,
        `Visual style: ${STYLE_HINT[data.style]}.`,
        `Strong visual hierarchy: title dominates, subtitle is small and secondary.`,
        `Polish/European premium digital product aesthetic, suitable for a sales page hero.`,
        `Do NOT add any other text, no fake logos, no watermarks, no website urls, no author names. Only the provided title and (optional) subtitle text.`,
        `High quality, sharp focus, balanced composition, magazine-cover-level finish.`,
      ]
        .filter(Boolean)
        .join(" ");

      const res = await fetch(
        "https://ai.gateway.lovable.dev/v1/images/generations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image-preview",
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
        },
      );

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        await refund();
        if (res.status === 429)
          throw new Error("Limit AI — spróbuj za chwilę");
        if (res.status === 402)
          throw new Error("Brak kredytów AI po stronie platformy");
        throw new Error(`Błąd generowania: ${res.status} ${txt.slice(0, 120)}`);
      }

      const json = (await res.json()) as {
        data?: Array<{ b64_json?: string }>;
      };
      const b64 = json.data?.[0]?.b64_json;
      if (!b64) {
        await refund();
        throw new Error("AI nie zwróciło obrazu");
      }

      const buffer = Buffer.from(b64, "base64");
      const path = `${userId}/${data.productId}/cover-ai-${Date.now()}.png`;
      const { error: upErr } = await supabaseAdmin.storage
        .from("product-assets")
        .upload(path, buffer, {
          contentType: "image/png",
          upsert: true,
          cacheControl: "3600",
        });
      if (upErr) {
        await refund();
        throw new Error(upErr.message);
      }

      const { data: pub } = supabaseAdmin.storage
        .from("product-assets")
        .getPublicUrl(path);

      const { error: updErr } = await supabaseAdmin
        .from("user_products")
        .update({ cover_url: pub.publicUrl })
        .eq("id", data.productId);
      if (updErr) {
        await refund();
        throw new Error(updErr.message);
      }

      return { coverUrl: pub.publicUrl, creditsCharged: COVER_CREDIT_COST };
    } catch (e) {
      // safety net — if we somehow get here without an explicit refund
      if (e instanceof Error && !e.message.startsWith("Brak kredytów")) {
        // already refunded in branches above; no-op here
      }
      throw e;
    }
  });
