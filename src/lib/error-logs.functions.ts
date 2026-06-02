import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ServerErrorLogRow = {
  id: string;
  created_at: string;
  function_name: string | null;
  request_id: string | null;
  message: string;
  status: number | null;
  url: string | null;
  user_id: string | null;
};

const logInput = z.object({
  function_name: z.string().max(255).nullish(),
  request_id: z.string().max(255).nullish(),
  message: z.string().min(1).max(4000),
  status: z.number().int().nullish(),
  url: z.string().max(2000).nullish(),
  user_id: z.string().uuid().nullish(),
});

export const logServerError = createServerFn({ method: "POST" })
  .inputValidator((input) => logInput.parse(input))
  .handler(async ({ data }) => {
    try {
      await supabaseAdmin.from("server_error_logs").insert({
        function_name: data.function_name ?? null,
        request_id: data.request_id ?? null,
        message: data.message,
        status: data.status ?? null,
        url: data.url ?? null,
        user_id: data.user_id ?? null,
      });
    } catch (err) {
      console.error("logServerError insert failed", err);
    }
    return { ok: true };
  });

export const listServerErrorLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number } | undefined) => ({
    limit: Math.min(Math.max(input?.limit ?? 100, 1), 500),
  }))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    try {
      const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (!isAdmin) return { rows: [] as ServerErrorLogRow[] };

      const { data: rows, error } = await supabaseAdmin
        .from("server_error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(data.limit);
      if (error) {
        console.error("listServerErrorLogs query failed", error);
        return { rows: [] as ServerErrorLogRow[] };
      }
      return { rows: (rows ?? []) as ServerErrorLogRow[] };
    } catch (err) {
      console.error("listServerErrorLogs failed", err);
      return { rows: [] as ServerErrorLogRow[] };
    }
  });
