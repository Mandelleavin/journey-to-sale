// Edge function: Generator AI - sprawdza kredyty, woła Lovable AI Gateway, zapisuje historię.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QUALITY_MULTIPLIER: Record<string, number> = {
  fast: 1,
  pro: 1.5,
  premium: 2,
};

const QUALITY_MODEL: Record<string, string> = {
  fast: "google/gemini-3-flash-preview",
  pro: "google/gemini-3-flash-preview",
  premium: "google/gemini-2.5-pro",
};

const PRODUCT_COVER_CREDIT_COST = 5;
const DEFAULT_OPENAI_IMAGE_MODEL = "gpt-image-1-mini";
const DEFAULT_OPENAI_IMAGE_SIZE = "1024x1536";
const DEFAULT_OPENAI_IMAGE_QUALITY = "low";

type AiRuntimeSettings = {
  openai_api_key?: string | null;
  lovable_api_key?: string | null;
  openai_image_model?: string | null;
  openai_image_size?: string | null;
  openai_image_quality?: string | null;
};

function renderTemplate(tpl: string, data: Record<string, unknown>): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => String(data[k] ?? ""));
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function generateProductCover({
  admin,
  openaiKey,
  lovableKey,
  aiSettings,
  userId,
  body,
}: {
  admin: ReturnType<typeof createClient>;
  openaiKey?: string;
  lovableKey?: string;
  aiSettings?: AiRuntimeSettings | null;
  userId: string;
  body: Record<string, unknown>;
}) {
  const productId = typeof body.product_id === "string" ? body.product_id : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const creditCost = PRODUCT_COVER_CREDIT_COST;

  if (!productId || !title || prompt.length < 20 || prompt.length > 8_000) {
    return jsonResponse({ error: "Nieprawidłowe dane generatora okładki" }, 400);
  }

  const { data: product, error: productError } = await admin
    .from("user_products")
    .select("id, user_id")
    .eq("id", productId)
    .maybeSingle();

  if (productError) return jsonResponse({ error: productError.message }, 500);
  if (!product || product.user_id !== userId) {
    return jsonResponse({ error: "Brak dostępu do produktu" }, 403);
  }

  const { data: available, error: creditsError } = await admin.rpc("get_available_credits", {
    _user_id: userId,
  });
  if (creditsError) return jsonResponse({ error: creditsError.message }, 500);
  if ((available ?? 0) < creditCost) {
    return jsonResponse(
      {
        error: `Brak kredytów AI (potrzeba ${creditCost})`,
        required: creditCost,
        available: available ?? 0,
      },
      402,
    );
  }

  if (!openaiKey && !lovableKey) {
    return jsonResponse(
      {
        error:
          "Brak konfiguracji AI. Dodaj OPENAI_API_KEY w Supabase Edge Functions albo LOVABLE_API_KEY jako fallback.",
      },
      500,
    );
  }

  const imageProvider = openaiKey ? "openai" : "lovable";
  const imageModel =
    imageProvider === "openai"
      ? Deno.env.get("OPENAI_IMAGE_MODEL") ||
        aiSettings?.openai_image_model ||
        DEFAULT_OPENAI_IMAGE_MODEL
      : "google/gemini-3-pro-image-preview";
  const aiResponse =
    imageProvider === "openai"
      ? await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: imageModel,
            prompt,
            size:
              Deno.env.get("OPENAI_IMAGE_SIZE") ||
              aiSettings?.openai_image_size ||
              DEFAULT_OPENAI_IMAGE_SIZE,
            quality:
              Deno.env.get("OPENAI_IMAGE_QUALITY") ||
              aiSettings?.openai_image_quality ||
              DEFAULT_OPENAI_IMAGE_QUALITY,
            n: 1,
          }),
        })
      : await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: imageModel,
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
        });

  if (!aiResponse.ok) {
    const details = await aiResponse.text().catch(() => "");
    console.error("Product cover AI error:", imageProvider, aiResponse.status, details);
    if (aiResponse.status === 429) {
      return jsonResponse({ error: "Limit AI - spróbuj ponownie za chwilę" }, 429);
    }
    if (aiResponse.status === 402) {
      return jsonResponse({ error: "Konto AI platformy wymaga doładowania" }, 402);
    }
    if (aiResponse.status === 401) {
      return jsonResponse({ error: "Nieprawidłowy klucz API dla generowania AI" }, 500);
    }
    return jsonResponse({ error: `Błąd generowania obrazu (${aiResponse.status})` }, 500);
  }

  const aiData = (await aiResponse.json()) as {
    data?: Array<{ b64_json?: string }>;
  };
  const base64 = aiData.data?.[0]?.b64_json;
  if (!base64) return jsonResponse({ error: "AI nie zwróciło obrazu" }, 500);

  const path = `${userId}/${productId}/cover-ai-${Date.now()}.png`;
  const { error: uploadError } = await admin.storage
    .from("product-assets")
    .upload(path, decodeBase64(base64), {
      contentType: "image/png",
      upsert: false,
      cacheControl: "3600",
    });
  if (uploadError) return jsonResponse({ error: uploadError.message }, 500);

  const { data: publicData } = admin.storage.from("product-assets").getPublicUrl(path);

  const { data: consumed, error: consumeError } = await admin.rpc("consume_credits", {
    _user_id: userId,
    _amount: creditCost,
    _description: `Okładka AI: ${title}`,
    _generation_id: null,
  });
  if (consumeError || consumed === false) {
    await admin.storage.from("product-assets").remove([path]);
    return jsonResponse({ error: consumeError?.message || "Nie udało się pobrać kredytów" }, 402);
  }

  const { error: updateError } = await admin
    .from("user_products")
    .update({ cover_url: publicData.publicUrl })
    .eq("id", productId)
    .eq("user_id", userId);

  if (updateError) {
    await admin.rpc("add_credits", {
      _user_id: userId,
      _amount: creditCost,
      _type: "bonus",
      _description: "Zwrot za nieudaną okładkę AI",
      _bonus_validity_days: 30,
    });
    await admin.storage.from("product-assets").remove([path]);
    return jsonResponse({ error: updateError.message }, 500);
  }

  await admin.from("ai_generation_history").insert({
    user_id: userId,
    generator_slug: "product-cover",
    input_data: { product_id: productId, title },
    output_data: publicData.publicUrl,
    credits_used: creditCost,
    quality_mode: imageProvider === "openai" ? "fast" : "premium",
    model: imageModel,
  });

  return jsonResponse({
    ok: true,
    cover_url: publicData.publicUrl,
    credits_used: creditCost,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "Wymagane logowanie" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    let openaiKey = Deno.env.get("OPENAI_API_KEY") || "";
    let lovableKey = Deno.env.get("LOVABLE_API_KEY") || "";

    // Klient z tokenem usera (do RLS)
    const userClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: auth } },
      },
    );
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Nieautoryzowany" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Klient admin (do zużycia kredytów + zapisu historii bez ograniczeń)
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: aiSettings } = await admin
      .from("ai_settings")
      .select(
        "openai_api_key, lovable_api_key, openai_image_model, openai_image_size, openai_image_quality",
      )
      .maybeSingle();

    openaiKey = openaiKey || aiSettings?.openai_api_key || "";
    lovableKey = lovableKey || aiSettings?.lovable_api_key || "";

    const body = (await req.json()) as Record<string, unknown>;

    if (body.operation === "product_cover") {
      return await generateProductCover({
        admin,
        openaiKey,
        lovableKey,
        aiSettings,
        userId: user.id,
        body,
      });
    }

    const {
      generator_slug,
      input_data,
      quality_mode = "fast",
      revision_type,
    } = body as {
      generator_slug: string;
      input_data: Record<string, unknown>;
      quality_mode?: "fast" | "pro" | "premium";
      revision_type?: string;
    };

    if (!lovableKey) {
      return new Response(
        JSON.stringify({
          error:
            "Brak konfiguracji AI dla generatorów tekstowych. Dodaj LOVABLE_API_KEY w Supabase Edge Functions.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Pobierz generator
    const { data: gen, error: genErr } = await admin
      .from("ai_generators")
      .select("*")
      .eq("slug", generator_slug)
      .eq("status", "active")
      .maybeSingle();

    if (genErr || !gen) {
      return new Response(JSON.stringify({ error: "Generator nie istnieje lub jest nieaktywny" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Koszt: bazowy * mnożnik trybu (jeśli wspierany)
    const multiplier = gen.supports_quality_modes ? (QUALITY_MULTIPLIER[quality_mode] ?? 1) : 1;
    const baseCredits = revision_type ? revisionCost(revision_type) : gen.credit_cost;
    const creditsToConsume = Math.ceil(baseCredits * multiplier);

    // Sprawdź dostępność
    const { data: avail } = await admin.rpc("get_available_credits", { _user_id: user.id });
    if ((avail ?? 0) < creditsToConsume) {
      return new Response(
        JSON.stringify({
          error: "Brak wystarczających kredytów",
          required: creditsToConsume,
          available: avail ?? 0,
        }),
        {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Złóż prompt
    const systemPrompt = gen.system_prompt;
    const userPrompt = revision_type
      ? `${revisionInstructions(revision_type)}\n\nOryginalna treść:\n${input_data.original_text ?? ""}`
      : renderTemplate(gen.user_prompt_template, input_data);

    const model = gen.supports_quality_modes
      ? (QUALITY_MODEL[quality_mode] ?? gen.model)
      : gen.model;

    // Wołaj Lovable AI
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: Math.max(Number(gen.max_output_tokens) || 0, 4000),
        temperature: Number(gen.temperature),
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, txt);
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Zbyt wiele zapytań. Spróbuj ponownie za chwilę." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Konto AI wymaga doładowania." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({ error: `Błąd modelu AI (${aiRes.status}): ${txt.slice(0, 200)}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const aiData = await aiRes.json();
    const output = aiData.choices?.[0]?.message?.content ?? "";
    if (!output || !output.trim()) {
      console.error("AI returned empty output:", JSON.stringify(aiData).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "Model AI zwrócił pustą odpowiedź. Spróbuj ponownie." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Zapisz historię
    const { data: hist } = await admin
      .from("ai_generation_history")
      .insert({
        user_id: user.id,
        generator_slug: revision_type ? `${gen.slug}:revision:${revision_type}` : gen.slug,
        generator_id: gen.id,
        input_data,
        output_data: output,
        credits_used: creditsToConsume,
        quality_mode,
        model,
      })
      .select("id")
      .single();

    // Zużyj kredyty
    const { data: consumed } = await admin.rpc("consume_credits", {
      _user_id: user.id,
      _amount: creditsToConsume,
      _description: revision_type
        ? `Poprawka: ${revision_type} (${gen.name})`
        : `Generator: ${gen.name} (${quality_mode})`,
      _generation_id: hist?.id ?? null,
    });

    if (!consumed) {
      // Mało prawdopodobne (sprawdziliśmy wyżej), ale na wszelki wypadek
      return new Response(JSON.stringify({ error: "Nie udało się pobrać kredytów" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        output,
        credits_used: creditsToConsume,
        generation_id: hist?.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("generate-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

function revisionCost(type: string): number {
  const map: Record<string, number> = {
    shorten: 5,
    more_sales: 8,
    more_expert: 8,
    alternatives: 15,
    improve_headline: 5,
    stronger_cta: 5,
    expand: 10,
    target_change: 12,
  };
  return map[type] ?? 5;
}

function revisionInstructions(type: string): string {
  const map: Record<string, string> = {
    shorten: "Skróć poniższą treść zachowując kluczowe elementy. Zwróć tylko skróconą wersję.",
    more_sales:
      "Przepisz poniższą treść tak, by była bardziej sprzedażowa, mocniejsza i z silniejszymi CTA.",
    more_expert: "Przepisz poniższą treść w bardziej eksperckim, profesjonalnym tonie.",
    alternatives: "Stwórz 3 alternatywne wersje poniższej treści, każda z innym podejściem.",
    improve_headline: "Zaproponuj 5 mocniejszych nagłówków dla poniższej treści.",
    stronger_cta: "Wzmocnij CTA w poniższej treści. Zwróć całą treść z nowym CTA.",
    expand: "Rozwiń poniższą treść dodając więcej konkretów, przykładów i argumentów.",
    target_change: "Dopasuj poniższą treść do innej grupy docelowej (podanej w treści).",
  };
  return map[type] ?? "Popraw poniższą treść.";
}
