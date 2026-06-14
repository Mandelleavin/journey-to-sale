import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type PlanFieldInputType =
  | "text"
  | "textarea"
  | "checkbox_group"
  | "single_choice"
  | "url"
  | "url_list";

export type PlanFieldOption = { value: string; label: string };

export type PlanField = {
  id: string;
  section_id: string;
  field_key: string;
  label: string;
  help_text: string | null;
  input_type: PlanFieldInputType;
  options: PlanFieldOption[];
  placeholder: string | null;
  syncs_to_product_column: string | null;
  position: number;
};

export type PlanSection = {
  id: string;
  key: string;
  title: string;
  emoji: string | null;
  description: string | null;
  position: number;
  fields: PlanField[];
};

export type PlanResponseValue = string | number | boolean | null | string[];

export type PlanResponse = {
  field_key: string;
  value: PlanResponseValue;
  source: string;
  updated_at: string;
  last_lesson_id: string | null;
  last_task_id: string | null;
};

// ============ PUBLIC ============

export const getPlanStructure = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: sections }, { data: fields }] = await Promise.all([
    supabaseAdmin
      .from("business_plan_sections")
      .select("*")
      .eq("is_active", true)
      .order("position"),
    supabaseAdmin
      .from("business_plan_fields")
      .select("*")
      .eq("is_active", true)
      .order("position"),
  ]);
  const out: PlanSection[] = (sections ?? []).map((s) => ({
    id: s.id,
    key: s.key,
    title: s.title,
    emoji: s.emoji,
    description: s.description,
    position: s.position,
    fields: (fields ?? [])
      .filter((f) => f.section_id === s.id)
      .map((f) => ({
        id: f.id,
        section_id: f.section_id,
        field_key: f.field_key,
        label: f.label,
        help_text: f.help_text,
        input_type: f.input_type as PlanFieldInputType,
        options: (f.options as PlanFieldOption[]) ?? [],
        placeholder: f.placeholder,
        syncs_to_product_column: f.syncs_to_product_column,
        position: f.position,
      })),
  }));
  return { sections: out };
});

// ============ USER (auth) ============

export const getMyPlanState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [respRes, accRes] = await Promise.all([
      supabase
        .from("business_plan_responses")
        .select("field_key,value,source,updated_at,last_lesson_id,last_task_id")
        .eq("user_id", userId),
      supabase.from("business_plan_access").select("granted_via").eq("user_id", userId).maybeSingle(),
    ]);
    return {
      hasAccess: !!accRes.data,
      responses: (respRes.data ?? []) as PlanResponse[],
    };
  });

const VerifyAccessInput = z.object({
  password: z.string().trim().min(1).max(200).optional(),
  code: z.string().trim().min(1).max(200).optional(),
});

export const verifyPlanAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => VerifyAccessInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.code) {
      const { data: codeRow } = await supabaseAdmin
        .from("business_plan_access_codes")
        .select("id, used_by_user_id")
        .eq("code", data.code)
        .maybeSingle();
      if (!codeRow) return { ok: false, error: "Nieprawidłowy kod" };
      if (codeRow.used_by_user_id && codeRow.used_by_user_id !== userId) {
        return { ok: false, error: "Kod został już wykorzystany" };
      }
      await supabaseAdmin
        .from("business_plan_access_codes")
        .update({ used_by_user_id: userId, used_at: new Date().toISOString() })
        .eq("id", codeRow.id);
      await supabaseAdmin
        .from("business_plan_access")
        .upsert({ user_id: userId, granted_via: "code", code_id: codeRow.id });
      return { ok: true };
    }

    if (data.password) {
      const { data: settings } = await supabaseAdmin
        .from("business_plan_settings")
        .select("global_password, is_open")
        .eq("id", 1)
        .maybeSingle();
      if (!settings?.is_open) return { ok: false, error: "Dostęp obecnie zamknięty" };
      if (!settings.global_password) {
        return { ok: false, error: "Hasło webinaru nie jest jeszcze ustawione" };
      }
      if (settings.global_password.trim() !== data.password.trim()) {
        return { ok: false, error: "Nieprawidłowe hasło" };
      }
      await supabaseAdmin
        .from("business_plan_access")
        .upsert({ user_id: userId, granted_via: "password" });
      return { ok: true };
    }

    return { ok: false, error: "Podaj hasło lub kod" };
  });

const SaveResponseInput = z.object({
  field_key: z.string().min(1).max(120),
  value: z.unknown(),
  source: z.enum(["plan", "lesson", "webinar"]).optional(),
  lesson_id: z.string().uuid().optional(),
  task_id: z.string().uuid().optional(),
});

const ALLOWED_PRODUCT_COLUMNS = new Set([
  "target_audience",
  "problem",
  "promise",
  "result",
  "sales_headline",
]);

export const savePlanResponse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveResponseInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // upsert response
    const { error: upErr } = await supabase
      .from("business_plan_responses")
      .upsert(
        {
          user_id: userId,
          field_key: data.field_key,
          value: data.value as never,
          source: data.source ?? "plan",
          last_lesson_id: data.lesson_id ?? null,
          last_task_id: data.task_id ?? null,
        },
        { onConflict: "user_id,field_key" },
      );
    if (upErr) throw new Error(upErr.message);

    // optional sync to user_products
    const { data: fieldRow } = await supabase
      .from("business_plan_fields")
      .select("syncs_to_product_column")
      .eq("field_key", data.field_key)
      .maybeSingle();
    const col = fieldRow?.syncs_to_product_column;
    if (col && ALLOWED_PRODUCT_COLUMNS.has(col) && typeof data.value === "string" && data.value.trim()) {
      const { data: prod } = await supabase
        .from("user_products")
        .select("id")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const patch: Record<string, string> = { [col]: data.value as string };
      if (prod) {
        await (supabase.from("user_products") as unknown as {
          update: (p: Record<string, string>) => { eq: (k: string, v: string) => Promise<unknown> };
        })
          .update(patch)
          .eq("id", prod.id);
      } else {
        await (supabase.from("user_products") as unknown as {
          insert: (p: Record<string, string>) => Promise<unknown>;
        }).insert({ user_id: userId, ...patch });
      }
    }
    return { ok: true };
  });

// ============ ADMIN ============

async function assertAdmin(ctx: { supabase: ReturnType<typeof Object>; userId: string }): Promise<void> {
  const supabase = ctx.supabase as unknown as {
    rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: boolean | null }>;
  };
  const { data } = await supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const adminGetPlanSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("business_plan_settings")
      .select("global_password, is_open, updated_at")
      .eq("id", 1)
      .maybeSingle();
    return data ?? { global_password: null, is_open: true, updated_at: null };
  });

const AdminUpdateSettingsInput = z.object({
  global_password: z.string().trim().max(200).nullable(),
  is_open: z.boolean(),
});

export const adminUpdatePlanSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AdminUpdateSettingsInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("business_plan_settings")
      .update({
        global_password: data.global_password || null,
        is_open: data.is_open,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    return { ok: true };
  });

export const adminListAccessCodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("business_plan_access_codes")
      .select("id, code, note, used_by_user_id, used_at, created_at")
      .order("created_at", { ascending: false });
    return { codes: data ?? [] };
  });

const AdminCreateCodesInput = z.object({
  count: z.number().int().min(1).max(100),
  note: z.string().trim().max(200).optional(),
});

function randomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export const adminCreateAccessCodes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AdminCreateCodesInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = Array.from({ length: data.count }, () => ({
      code: randomCode(),
      note: data.note ?? null,
    }));
    await supabaseAdmin.from("business_plan_access_codes").insert(rows);
    return { ok: true, count: rows.length };
  });

export const adminDeleteAccessCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("business_plan_access_codes").delete().eq("id", data.id);
    return { ok: true };
  });

export const adminGetPlanAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ count: usersWithAccess }, { count: totalResponses }, { data: byField }] =
      await Promise.all([
        supabaseAdmin.from("business_plan_access").select("user_id", { count: "exact", head: true }),
        supabaseAdmin
          .from("business_plan_responses")
          .select("field_key", { count: "exact", head: true }),
        supabaseAdmin.from("business_plan_responses").select("field_key"),
      ]);
    const tally: Record<string, number> = {};
    for (const r of byField ?? []) {
      const k = (r as { field_key: string }).field_key;
      tally[k] = (tally[k] ?? 0) + 1;
    }
    return {
      usersWithAccess: usersWithAccess ?? 0,
      totalResponses: totalResponses ?? 0,
      perField: tally,
    };
  });
