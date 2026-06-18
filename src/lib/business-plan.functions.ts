import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { STARTER_PLAN_FIELDS } from "@/lib/business-plan-starter-fields";
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

export type AdminPlanUserSummary = {
  user_id: string;
  full_name: string | null;
  email: string;
  granted_via: string | null;
  granted_at: string | null;
  answered_fields: number;
  completion_percent: number;
  last_answer_at: string | null;
};

export type AdminPlanSurveyAnswer = {
  field_key: string;
  label: string;
  value: PlanResponseValue;
  source: string;
  updated_at: string;
  section_id: string;
  section_title: string;
  section_emoji: string | null;
  section_position: number;
  field_position: number;
};

// ============ PUBLIC ============

export const getPlanStructure = createServerFn({ method: "GET" }).handler(async () => {
  const { supabase } = await import("@/integrations/supabase/client");
  const [{ data: sections, error: sectionsError }, { data: fields, error: fieldsError }] =
    await Promise.all([
      supabase.from("business_plan_sections").select("*").eq("is_active", true).order("position"),
      supabase.from("business_plan_fields").select("*").eq("is_active", true).order("position"),
    ]);
  if (sectionsError) throw sectionsError;
  if (fieldsError) throw fieldsError;

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

  const firstSection = out[0];
  if (firstSection) {
    const existingKeys = new Set(firstSection.fields.map((field) => field.field_key));
    for (const field of STARTER_PLAN_FIELDS) {
      if (existingKeys.has(field.field_key)) continue;
      firstSection.fields.push({
        ...field,
        section_id: firstSection.id,
        syncs_to_product_column: field.syncs_to_product_column ?? null,
      });
    }
    firstSection.fields.sort((a, b) => a.position - b.position);
  }

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
      supabase
        .from("business_plan_access")
        .select("granted_via")
        .eq("user_id", userId)
        .maybeSingle(),
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
    const verifyAccessRpc = context.supabase.rpc as unknown as (
      name: "verify_business_plan_access",
      args: { p_password: string | null; p_code: string | null },
    ) => Promise<{
      data: { ok: boolean; error?: string } | null;
      error: { message: string; code?: string } | null;
    }>;
    const { data: result, error } = await verifyAccessRpc("verify_business_plan_access", {
      p_password: data.password ?? null,
      p_code: data.code ?? null,
    });
    if (!error && result) return result;
    if (!error) throw new Error("Weryfikacja dostępu nie zwróciła wyniku.");

    const isDevelopment = process.env.NODE_ENV !== "production";
    const localPassword = process.env.BUSINESS_PLAN_TEST_PASSWORD ?? "START";
    if (isDevelopment && data.password?.trim() === localPassword) {
      return { ok: true, localOnly: true };
    }
    if (isDevelopment && error.code === "PGRST202") {
      return { ok: false, error: "Nieprawidłowe hasło." };
    }

    throw new Error(error.message);
  });

const SaveResponseInput = z.object({
  field_key: z.string().min(1).max(120),
  value: z.unknown(),
  source: z.enum(["plan", "lesson", "webinar"]).optional(),
  lesson_id: z.string().uuid().optional(),
  task_id: z.string().uuid().optional(),
});

const ALLOWED_PRODUCT_COLUMNS = new Set([
  "title",
  "subtitle",
  "target_audience",
  "problem",
  "promise",
  "result",
  "sales_headline",
  "cta_label",
]);

const STARTER_FIELD_PRODUCT_SYNC = new Map(
  STARTER_PLAN_FIELDS.flatMap((field) =>
    field.syncs_to_product_column ? [[field.field_key, field.syncs_to_product_column]] : [],
  ),
);

export const savePlanResponse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveResponseInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // upsert response
    const { error: upErr } = await supabase.from("business_plan_responses").upsert(
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
    const col = fieldRow?.syncs_to_product_column ?? STARTER_FIELD_PRODUCT_SYNC.get(data.field_key);
    if (
      col &&
      ALLOWED_PRODUCT_COLUMNS.has(col) &&
      typeof data.value === "string" &&
      data.value.trim()
    ) {
      const { data: prod } = await supabase
        .from("user_products")
        .select("id")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const patch: Record<string, string> = { [col]: data.value as string };
      if (prod) {
        await (
          supabase.from("user_products") as unknown as {
            update: (p: Record<string, string>) => {
              eq: (k: string, v: string) => Promise<unknown>;
            };
          }
        )
          .update(patch)
          .eq("id", prod.id);
      } else {
        await (
          supabase.from("user_products") as unknown as {
            insert: (p: Record<string, string>) => Promise<unknown>;
          }
        ).insert({ user_id: userId, ...patch });
      }
    }
    return { ok: true };
  });

// ============ ADMIN ============

async function assertAdmin(ctx: {
  supabase: ReturnType<typeof Object>;
  userId: string;
}): Promise<void> {
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
    const { data, error } = await context.supabase
      .from("business_plan_settings")
      .select("global_password, is_open, updated_at")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
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
    const { error } = await context.supabase
      .from("business_plan_settings")
      .update({
        global_password: data.global_password || null,
        is_open: data.is_open,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListAccessCodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { data, error } = await context.supabase
      .from("business_plan_access_codes")
      .select("id, code, note, used_by_user_id, used_at, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
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
    const rows = Array.from({ length: data.count }, () => ({
      code: randomCode(),
      note: data.note ?? null,
    }));
    const { error } = await context.supabase.from("business_plan_access_codes").insert(rows);
    if (error) throw new Error(error.message);
    return { ok: true, count: rows.length };
  });

export const adminDeleteAccessCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { error } = await context.supabase
      .from("business_plan_access_codes")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminGetPlanAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const supabase = context.supabase;
    const [{ count: usersWithAccess }, { count: totalResponses }, { data: byField }] =
      await Promise.all([
        supabase.from("business_plan_access").select("user_id", { count: "exact", head: true }),
        supabase
          .from("business_plan_responses")
          .select("field_key", { count: "exact", head: true }),
        supabase.from("business_plan_responses").select("field_key"),
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

export const adminListPlanUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const supabase = context.supabase;
    const [
      { data: responses, error: responsesError },
      { data: access, error: accessError },
      { count: totalFields, error: fieldsError },
    ] = await Promise.all([
      supabase.from("business_plan_responses").select("user_id,field_key,value,updated_at"),
      supabase
        .from("business_plan_access")
        .select("user_id,granted_via,granted_at")
        .order("granted_at", { ascending: false }),
      supabase
        .from("business_plan_fields")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
    ]);
    if (responsesError) throw new Error(responsesError.message);
    if (accessError) throw new Error(accessError.message);
    if (fieldsError) throw new Error(fieldsError.message);

    const userIds = Array.from(
      new Set([
        ...(responses ?? []).map((row) => row.user_id),
        ...(access ?? []).map((row) => row.user_id),
      ]),
    );
    if (userIds.length === 0) return { users: [] as AdminPlanUserSummary[] };

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id,full_name,email")
      .in("id", userIds);
    if (profilesError) throw new Error(profilesError.message);

    const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const accessById = new Map((access ?? []).map((row) => [row.user_id, row]));
    const answersById = new Map<string, Set<string>>();
    const lastAnswerById = new Map<string, string>();

    for (const response of responses ?? []) {
      const value = response.value;
      const hasAnswer = Array.isArray(value)
        ? value.length > 0
        : value !== null && value !== undefined && String(value).trim() !== "";
      if (!hasAnswer) continue;

      const answered = answersById.get(response.user_id) ?? new Set<string>();
      answered.add(response.field_key);
      answersById.set(response.user_id, answered);
      const previous = lastAnswerById.get(response.user_id);
      if (!previous || response.updated_at > previous) {
        lastAnswerById.set(response.user_id, response.updated_at);
      }
    }

    const fieldCount = totalFields ?? 0;
    const users: AdminPlanUserSummary[] = userIds.map((userId) => {
      const profile = profilesById.get(userId);
      const accessRow = accessById.get(userId);
      const answeredFields = answersById.get(userId)?.size ?? 0;
      return {
        user_id: userId,
        full_name: profile?.full_name ?? null,
        email: profile?.email ?? "Brak adresu e-mail",
        granted_via: accessRow?.granted_via ?? null,
        granted_at: accessRow?.granted_at ?? null,
        answered_fields: answeredFields,
        completion_percent: fieldCount ? Math.round((answeredFields / fieldCount) * 100) : 0,
        last_answer_at: lastAnswerById.get(userId) ?? null,
      };
    });

    users.sort((a, b) =>
      (b.last_answer_at ?? b.granted_at ?? "").localeCompare(
        a.last_answer_at ?? a.granted_at ?? "",
      ),
    );
    return { users };
  });

export const adminGetPlanUserSurvey = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const supabase = context.supabase;
    const [
      { data: profile, error: profileError },
      { data: responses, error: responsesError },
      { data: fields, error: fieldsError },
      { data: sections, error: sectionsError },
    ] = await Promise.all([
      supabase.from("profiles").select("id,full_name,email").eq("id", data.userId).maybeSingle(),
      supabase
        .from("business_plan_responses")
        .select("field_key,value,source,updated_at")
        .eq("user_id", data.userId),
      supabase
        .from("business_plan_fields")
        .select("field_key,label,section_id,position")
        .eq("is_active", true),
      supabase
        .from("business_plan_sections")
        .select("id,title,emoji,position")
        .eq("is_active", true),
    ]);
    if (profileError) throw new Error(profileError.message);
    if (responsesError) throw new Error(responsesError.message);
    if (fieldsError) throw new Error(fieldsError.message);
    if (sectionsError) throw new Error(sectionsError.message);

    const fieldsByKey = new Map((fields ?? []).map((field) => [field.field_key, field]));
    const sectionsById = new Map((sections ?? []).map((section) => [section.id, section]));
    const firstSection = [...(sections ?? [])].sort((a, b) => a.position - b.position)[0];
    if (firstSection) {
      for (const field of STARTER_PLAN_FIELDS) {
        if (!fieldsByKey.has(field.field_key)) {
          fieldsByKey.set(field.field_key, {
            field_key: field.field_key,
            label: field.label,
            section_id: firstSection.id,
            position: field.position,
          });
        }
      }
    }
    const answers: AdminPlanSurveyAnswer[] = (responses ?? []).map((response) => {
      const field = fieldsByKey.get(response.field_key);
      const section = field ? sectionsById.get(field.section_id) : null;
      return {
        field_key: response.field_key,
        label: field?.label ?? response.field_key,
        value: response.value as PlanResponseValue,
        source: response.source,
        updated_at: response.updated_at,
        section_id: field?.section_id ?? "other",
        section_title: section?.title ?? "Pozostałe odpowiedzi",
        section_emoji: section?.emoji ?? null,
        section_position: section?.position ?? 999,
        field_position: field?.position ?? 999,
      };
    });
    answers.sort(
      (a, b) => a.section_position - b.section_position || a.field_position - b.field_position,
    );

    return {
      user: {
        user_id: data.userId,
        full_name: profile?.full_name ?? null,
        email: profile?.email ?? "Brak adresu e-mail",
      },
      answers,
    };
  });
