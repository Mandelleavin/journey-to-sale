import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type {
  RecommendedTool,
  ToolCategory,
  ToolFaq,
  ToolFeature,
  ToolPricing,
} from "./recommended-tools-data";

type Row = Record<string, unknown>;

function mapTool(r: Row): RecommendedTool {
  return {
    slug: String(r.slug),
    name: String(r.name),
    tagline: String(r.tagline ?? ""),
    shortDescription: String(r.short_description ?? ""),
    longDescription: String(r.long_description ?? ""),
    category: String(r.category_slug),
    url: String(r.url ?? ""),
    gold: Boolean(r.gold),
    perk: (r.perk as string | null) ?? null,
    letter: String(r.letter ?? "?"),
    gradient: String(r.gradient ?? "from-violet-500 to-fuchsia-500"),
    tags: (r.tags as string[]) ?? [],
    rating: Number(r.rating ?? 0),
    reviewsCount: Number(r.reviews_count ?? 0),
    usedBy: Number(r.used_by ?? 0),
    launchedYear: r.launched_year != null ? Number(r.launched_year) : null,
    website: (r.website as string | null) ?? null,
    pros: (r.pros as string[]) ?? [],
    cons: (r.cons as string[]) ?? [],
    bestFor: (r.best_for as string[]) ?? [],
    features: (r.features as ToolFeature[]) ?? [],
    pricing: (r.pricing as ToolPricing[]) ?? [],
    faq: (r.faq as ToolFaq[]) ?? [],
    alternatives: (r.alternatives as string[]) ?? [],
    position: Number(r.position ?? 0),
    isPublished: Boolean(r.is_published ?? true),
  };
}

function mapCategory(r: Row): ToolCategory {
  return {
    slug: String(r.slug),
    name: String(r.name),
    description: String(r.description ?? ""),
    emoji: String(r.emoji ?? "✨"),
    gradient: String(r.gradient ?? "from-violet-500 to-fuchsia-500"),
    position: Number(r.position ?? 0),
  };
}

// ============ PUBLIC ============

export const listRecommendedTools = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: cats, error: cErr }, { data: tools, error: tErr }] = await Promise.all([
    supabaseAdmin
      .from("recommended_tool_categories")
      .select("*")
      .order("position", { ascending: true }),
    supabaseAdmin
      .from("recommended_tools")
      .select("*")
      .eq("is_published", true)
      .order("position", { ascending: true }),
  ]);
  if (cErr) throw cErr;
  if (tErr) throw tErr;
  return {
    categories: (cats ?? []).map(mapCategory),
    tools: (tools ?? []).map(mapTool),
  };
});

export const getRecommendedToolBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("recommended_tools")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    return row ? mapTool(row as Row) : null;
  });

// ============ ADMIN ============

const featureSchema = z.object({ title: z.string().min(1).max(200), description: z.string().max(1000).default("") });
const pricingSchema = z.object({
  plan: z.string().min(1).max(120),
  price: z.string().min(1).max(120),
  note: z.string().max(200).optional(),
});
const faqSchema = z.object({ q: z.string().min(1).max(300), a: z.string().min(1).max(2000) });

const toolInputSchema = z.object({
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, "Slug: małe litery, cyfry i myślniki."),
  originalSlug: z.string().optional(),
  name: z.string().min(1).max(120),
  tagline: z.string().max(200).default(""),
  shortDescription: z.string().max(400).default(""),
  longDescription: z.string().max(4000).default(""),
  category: z.string().min(1).max(80),
  url: z.string().url().max(500),
  gold: z.boolean().default(false),
  perk: z.string().max(300).nullable().optional(),
  letter: z.string().min(1).max(4),
  gradient: z.string().min(1).max(120),
  tags: z.array(z.string().min(1).max(50)).max(20).default([]),
  rating: z.number().min(0).max(5),
  reviewsCount: z.number().int().min(0).max(10_000_000),
  usedBy: z.number().int().min(0).max(10_000_000),
  launchedYear: z.number().int().min(1900).max(2100).nullable().optional(),
  website: z.string().max(200).nullable().optional(),
  pros: z.array(z.string().min(1).max(400)).max(20).default([]),
  cons: z.array(z.string().min(1).max(400)).max(20).default([]),
  bestFor: z.array(z.string().min(1).max(400)).max(20).default([]),
  features: z.array(featureSchema).max(20).default([]),
  pricing: z.array(pricingSchema).max(20).default([]),
  faq: z.array(faqSchema).max(30).default([]),
  alternatives: z.array(z.string().min(1).max(80)).max(20).default([]),
  position: z.number().int().min(0).max(10_000).default(0),
  isPublished: z.boolean().default(true),
});

export type ToolInput = z.infer<typeof toolInputSchema>;

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw error;
  if (!data) throw new Error("Forbidden");
}

export const upsertRecommendedTool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ToolInput) => toolInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const row = {
      slug: data.slug,
      name: data.name,
      tagline: data.tagline,
      short_description: data.shortDescription,
      long_description: data.longDescription,
      category_slug: data.category,
      url: data.url,
      gold: data.gold,
      perk: data.perk ?? null,
      letter: data.letter,
      gradient: data.gradient,
      tags: data.tags,
      rating: data.rating,
      reviews_count: data.reviewsCount,
      used_by: data.usedBy,
      launched_year: data.launchedYear ?? null,
      website: data.website ?? null,
      pros: data.pros,
      cons: data.cons,
      best_for: data.bestFor,
      features: data.features,
      pricing: data.pricing,
      faq: data.faq,
      alternatives: data.alternatives,
      position: data.position,
      is_published: data.isPublished,
    };

    if (data.originalSlug && data.originalSlug !== data.slug) {
      const { error } = await supabaseAdmin
        .from("recommended_tools")
        .update(row)
        .eq("slug", data.originalSlug);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from("recommended_tools")
        .upsert(row, { onConflict: "slug" });
      if (error) throw error;
    }
    return { ok: true };
  });

export const deleteRecommendedTool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string().min(1).max(80) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("recommended_tools").delete().eq("slug", data.slug);
    if (error) throw error;
    return { ok: true };
  });

// Admin list (includes unpublished)
export const adminListRecommendedTools = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: cats, error: cErr }, { data: tools, error: tErr }] = await Promise.all([
      supabaseAdmin.from("recommended_tool_categories").select("*").order("position"),
      supabaseAdmin.from("recommended_tools").select("*").order("category_slug").order("position"),
    ]);
    if (cErr) throw cErr;
    if (tErr) throw tErr;
    return {
      categories: (cats ?? []).map(mapCategory),
      tools: (tools ?? []).map(mapTool),
    };
  });

const categoryInputSchema = z.object({
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  originalSlug: z.string().optional(),
  name: z.string().min(1).max(120),
  description: z.string().max(400).default(""),
  emoji: z.string().min(1).max(10),
  gradient: z.string().min(1).max(120),
  position: z.number().int().min(0).max(1000).default(0),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const upsertToolCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CategoryInput) => categoryInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = {
      slug: data.slug,
      name: data.name,
      description: data.description,
      emoji: data.emoji,
      gradient: data.gradient,
      position: data.position,
    };
    if (data.originalSlug && data.originalSlug !== data.slug) {
      const { error } = await supabaseAdmin
        .from("recommended_tool_categories")
        .update(row)
        .eq("slug", data.originalSlug);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from("recommended_tool_categories")
        .upsert(row, { onConflict: "slug" });
      if (error) throw error;
    }
    return { ok: true };
  });

export const deleteToolCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string().min(1).max(80) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("recommended_tool_categories")
      .delete()
      .eq("slug", data.slug);
    if (error) throw error;
    return { ok: true };
  });
