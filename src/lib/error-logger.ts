import { logServerError } from "./error-logs.functions";
import { supabase } from "@/integrations/supabase/client";

/**
 * Parses a TanStack server function URL of the form
 * `/_serverFn/<base64(JSON({file, export}))>` and returns the export name.
 */
function parseServerFnUrl(url: string): { fn: string | null; requestId: string | null } {
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://x");
    const match = u.pathname.match(/\/_serverFn\/([A-Za-z0-9_\-=]+)/);
    if (!match) return { fn: null, requestId: u.pathname };
    const requestId = match[1];
    try {
      const decoded = JSON.parse(
        atob(requestId.replace(/-/g, "+").replace(/_/g, "/")),
      ) as { file?: string; export?: string };
      const exp = decoded.export?.replace(/_createServerFn_handler$/, "") ?? null;
      return { fn: exp, requestId };
    } catch {
      return { fn: null, requestId };
    }
  } catch {
    return { fn: null, requestId: null };
  }
}

export async function captureServerError(error: unknown, extra?: { url?: string }) {
  try {
    let message = "Unknown error";
    let status: number | null = null;
    let url = extra?.url ?? null;

    if (error instanceof Response) {
      status = error.status;
      url = error.url || url;
      try {
        message = (await error.clone().text()).slice(0, 2000) || `HTTP ${error.status}`;
      } catch {
        message = `HTTP ${error.status}`;
      }
    } else if (error instanceof Error) {
      message = error.message || error.name;
      // TanStack wraps responses; try to extract URL
      const anyErr = error as unknown as { response?: Response; url?: string };
      if (anyErr.response instanceof Response) {
        status = anyErr.response.status;
        url = anyErr.response.url || url;
      }
      if (typeof anyErr.url === "string") url = anyErr.url;
    } else if (typeof error === "string") {
      message = error;
    } else {
      try {
        message = JSON.stringify(error).slice(0, 2000);
      } catch {
        message = String(error);
      }
    }

    const { fn, requestId } = url ? parseServerFnUrl(url) : { fn: null, requestId: null };

    // Only log when it actually looks like a server function failure
    if (!url || !url.includes("/_serverFn/")) return;

    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id ?? null;

    await logServerError({
      data: {
        function_name: fn,
        request_id: requestId,
        message,
        status,
        url,
        user_id: userId,
      },
    });
  } catch (err) {
    console.error("captureServerError failed", err);
  }
}
