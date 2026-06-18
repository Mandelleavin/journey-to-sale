import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const COVER_CREDIT_COST = 5;

const FORMATS = [
  "ebook",
  "course",
  "workshop",
  "masterclass",
  "template",
  "checklist",
  "membership",
  "coaching",
  "app",
  "other",
] as const;

const PRESENTATIONS = ["mockup", "flat"] as const;

const Input = z.object({
  productId: z.string().uuid(),
  brief: z.string().min(3).max(800),
  title: z.string().min(1).max(80),
  subtitle: z.string().max(120).optional(),
  format: z.enum(FORMATS).default("ebook"),
  presentation: z.enum(PRESENTATIONS).default("mockup"),
  style: z.enum(["modern", "elegant", "bold", "minimal", "playful"]).default("modern"),
});

const STYLE_HINT: Record<string, string> = {
  modern:
    "modern editorial art direction, clean geometry, soft gradients, premium technology feel, one vibrant accent color, crisp contemporary typography",
  elegant:
    "elegant premium art direction, soft beige and deep navy palette, refined serif typography, restrained gold accents, sophisticated studio lighting",
  bold: "bold high-contrast art direction, saturated colors, dynamic shapes, strong focal element, confident energy, heavy sans-serif typography",
  minimal:
    "ultra-minimal art direction, generous whitespace, one iconic element, restrained palette, Swiss design influence, refined geometric typography",
  playful:
    "playful illustrated art direction, friendly rounded shapes, warm pastel palette, polished hand-crafted feel, approachable display typography",
};

type CoverFormat = (typeof FORMATS)[number];

const FORMAT_LABEL: Record<CoverFormat, string> = {
  ebook: "ebook or PDF guide",
  course: "online course",
  workshop: "live workshop or webinar",
  masterclass: "premium masterclass",
  template: "digital template pack",
  checklist: "checklist or cheatsheet",
  membership: "membership or online community",
  coaching: "one-to-one coaching program",
  app: "digital application or SaaS product",
  other: "digital product",
};

const MOCKUP_SCENE: Record<CoverFormat, string> = {
  ebook:
    "Create a realistic premium 3D ebook product mockup: one upright book with visible spine, supported by a tablet or a small stack of pages. Put the exact title on the front cover. The scene must unmistakably look like a sellable ebook, not a loose poster.",
  course:
    "Create a premium online-course mockup shown on a laptop or desktop screen, supported by a tablet or phone. The main screen should look like a polished learning platform with abstract lesson cards and a visible course hero. Put the exact title once in the hero area; use shapes and lines instead of fake interface text.",
  workshop:
    "Create a cohesive workshop kit mockup: a presentation screen or laptop, a workbook and one small event card arranged as a premium set. Put the exact title on the primary screen or workbook. Do not invent dates, speakers or venue details.",
  masterclass:
    "Create a cinematic masterclass mockup on a large tablet or widescreen display with a premium lesson-player composition and subtle supporting workbook. Put the exact title once on the main screen; secondary interface elements must be abstract and text-free.",
  template:
    "Create a premium template bundle mockup: a laptop plus a fanned stack of elegant document or social-media layouts. Put the exact title on the main package card. Supporting templates should use abstract blocks, charts and shapes without fake words.",
  checklist:
    "Create a realistic printable checklist mockup: a clipboard or clean stack of sheets with a pen and subtle check marks. Put the exact title on the top sheet and keep all smaller content as simple lines or boxes without fake text.",
  membership:
    "Create a warm premium membership mockup on a laptop and phone, showing an abstract community dashboard with profile circles, post cards and conversation blocks. Put the exact title once in the main hero area; do not generate names, comments or interface copy.",
  coaching:
    "Create a premium coaching-program mockup using a tablet or laptop, an elegant workbook and a planning notebook. The composition should communicate trust, transformation and personal guidance. Put the exact title once on the main product surface; do not invent a coach name.",
  app: "Create a polished application mockup shown across a laptop and phone, with a coherent abstract interface tailored to the product brief. Put the exact title once as the product hero heading; render all smaller UI content as text-free blocks and icons.",
  other:
    "Create a polished digital-product bundle mockup using the most suitable combination of a product box, tablet, phone, workbook or cards based on the brief. Put the exact title once on the primary product surface.",
};

const FLAT_SCENE: Record<CoverFormat, string> = {
  ebook:
    "Design a flat vertical ebook cover, ready to use as the front cover. Do not show a book, device, room or product mockup.",
  course:
    "Design a flat premium online-course key visual with a strong central concept and clear title hierarchy. Do not show devices or a product mockup.",
  workshop:
    "Design a flat workshop or webinar poster with an energetic focal point. Do not invent dates, speakers or venue information.",
  masterclass:
    "Design a flat cinematic masterclass poster with premium lighting and a strong editorial composition.",
  template:
    "Design a flat cover graphic for a digital template bundle, using a refined grid and abstract layout previews without fake text.",
  checklist:
    "Design a flat cover for a printable checklist or cheatsheet, with subtle check-mark and document motifs.",
  membership:
    "Design a flat welcoming membership or community key visual with a premium brand feel and abstract connection motifs.",
  coaching:
    "Design a flat premium coaching-program key visual that communicates trust, clarity and transformation without using a fake person or coach identity.",
  app: "Design a flat launch graphic for a digital application, using abstract interface motifs and a strong product title.",
  other: "Design a flat premium cover graphic for the digital product described in the brief.",
};

function buildProductCoverPrompt(data: z.infer<typeof Input>) {
  const scene =
    data.presentation === "mockup" ? MOCKUP_SCENE[data.format] : FLAT_SCENE[data.format];
  const subtitleInstruction = data.subtitle?.trim()
    ? `Render this subtitle exactly once, smaller than the title: "${data.subtitle.trim()}".`
    : "Do not add a subtitle.";

  return [
    "Create one polished commercial product thumbnail for a Polish creator's sales page.",
    "The final image must have a 4:5 portrait aspect ratio and fill the entire canvas.",
    `Product format: ${FORMAT_LABEL[data.format]}.`,
    `Presentation: ${data.presentation === "mockup" ? "realistic premium product mockup" : "flat cover artwork"}.`,
    `Scene direction: ${scene}`,
    `Product context: "${data.brief.trim()}". Use this context to choose relevant colors, symbols, props and imagery.`,
    `Render this Polish title exactly once, with correct spelling and clear Polish characters: "${data.title.trim()}".`,
    subtitleInstruction,
    `Visual direction: ${STYLE_HINT[data.style]}.`,
    "Keep a strong hierarchy: the title is the dominant text, the subtitle is secondary, and the product remains recognizable at thumbnail size.",
    "Use one coherent visual concept rather than a collage of unrelated stock elements.",
    "No extra words, random letters, lorem ipsum, dates, prices, author names, logos, badges, URLs, signatures or watermarks.",
    "Any small interface, page or document details must be represented by abstract lines, blocks and icons, never illegible pseudo-text.",
    "Professional studio-quality lighting, realistic materials where relevant, clean edges, balanced spacing, premium sales-page finish.",
  ].join("\n");
}

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

    const { data: result, error } = await supabase.functions.invoke("generate-ai", {
      body: {
        operation: "product_cover",
        product_id: data.productId,
        title: data.title,
        prompt: buildProductCoverPrompt(data),
      },
    });

    if (error) {
      let message = error.message || "Nie udało się wygenerować grafiki";
      const context = (error as { context?: Response }).context;
      if (context) {
        try {
          const payload = (await context.json()) as { error?: string };
          if (payload.error) message = payload.error;
        } catch {
          // Supabase can return an empty response for transport errors.
        }
      }
      throw new Error(message);
    }

    if (!result?.ok || !result.cover_url) {
      throw new Error(result?.error || "AI nie zwróciło obrazu");
    }

    return {
      coverUrl: result.cover_url as string,
      creditsCharged: Number(result.credits_used) || COVER_CREDIT_COST,
    };
  });
