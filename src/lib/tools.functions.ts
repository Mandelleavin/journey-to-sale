import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const TOOL_SLUGS = [
  "revenue-potential",
  "product-price",
  "ads-breakeven",
  "first-product",
] as const;
export type ToolSlug = (typeof TOOL_SLUGS)[number];

const SlugSchema = z.enum(TOOL_SLUGS);

// Plain JSON-serializable shape (loose to keep server-fn serializer happy)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonObj = Record<string, any>;

export type ToolResult = {
  id: string;
  tool_slug: string;
  inputs: JsonObj;
  outputs: JsonObj;
  created_at: string;
};

/** Zapisz wynik kalkulatora + przyznaj +10 XP raz dziennie / narzędzie. */
export const saveToolResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        tool_slug: SlugSchema,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        inputs: z.any().default({}) as z.ZodType<JsonObj>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        outputs: z.any().default({}) as z.ZodType<JsonObj>,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: row, error } = await supabase
      .from("tool_results")
      .insert({
        user_id: userId,
        tool_slug: data.tool_slug,
        inputs: data.inputs,
        outputs: data.outputs,
      })
      .select("id, tool_slug, inputs, outputs, created_at")
      .single();

    if (error || !row) {
      console.error("saveToolResult insert failed", error);
      return { ok: false, xpAwarded: 0, result: null as ToolResult | null };
    }

    let xpAwarded = 0;
    const today = new Date().toISOString().slice(0, 10);
    const reason = `tool:${data.tool_slug}:${today}`;
    const { data: existing } = await supabase
      .from("user_xp_log")
      .select("id")
      .eq("user_id", userId)
      .eq("reason", reason)
      .maybeSingle();

    if (!existing) {
      const { error: xpErr } = await supabase
        .from("user_xp_log")
        .insert({ user_id: userId, amount: 10, reason });
      if (!xpErr) xpAwarded = 10;
    }

    try {
      await supabase.rpc("update_streak", { _user_id: userId });
    } catch (e) {
      console.error("update_streak failed", e);
    }

    return {
      ok: true,
      xpAwarded,
      result: {
        id: row.id,
        tool_slug: row.tool_slug,
        inputs: (row.inputs ?? {}) as JsonObj,
        outputs: (row.outputs ?? {}) as JsonObj,
        created_at: row.created_at,
      } as ToolResult | null,
    };
  });

/** Historia wyników danego narzędzia. */
export const getToolHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        tool_slug: SlugSchema,
        limit: z.number().int().min(1).max(50).default(10),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("tool_results")
      .select("id, tool_slug, inputs, outputs, created_at")
      .eq("user_id", userId)
      .eq("tool_slug", data.tool_slug)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) {
      console.error("getToolHistory failed", error);
      return { rows: [] as ToolResult[] };
    }
    const mapped: ToolResult[] = (rows ?? []).map((r) => ({
      id: r.id,
      tool_slug: r.tool_slug,
      inputs: (r.inputs ?? {}) as JsonObj,
      outputs: (r.outputs ?? {}) as JsonObj,
      created_at: r.created_at,
    }));
    return { rows: mapped };
  });

/** Podsumowanie ile narzędzi user użył (do challenge / teaser). */
export const getToolsSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("tool_results")
      .select("tool_slug, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error("getToolsSummary failed", error);
      return { usedSlugs: [] as string[], totalUses: 0 };
    }
    const usedSlugs = Array.from(new Set((data ?? []).map((r) => r.tool_slug)));
    return { usedSlugs, totalUses: data?.length ?? 0 };
  });
