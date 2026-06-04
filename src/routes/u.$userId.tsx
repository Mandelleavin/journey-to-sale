import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Flame,
  Zap,
  Calendar,
  Package,
  ClipboardList,
  Link as LinkIcon,
  Mail,
  Phone,
  ExternalLink,
  Lock,
} from "lucide-react";

export const Route = createFileRoute("/u/$userId")({
  component: PublicProfile,
});

type ProfileRow = {
  full_name: string | null;
  created_at: string;
  email: string | null;
  avatar_url: string | null;
  social_link: string | null;
  phone: string | null;
};

type ProductRow = {
  id: string;
  title: string | null;
  subtitle: string | null;
  promise: string | null;
  target_audience: string | null;
  problem: string | null;
  result: string | null;
  cover_url: string | null;
  status: string | null;
  product_type: string | null;
  price_draft: number | null;
  updated_at: string;
};

type SurveyRow = {
  goal_90_days: string | null;
  biggest_problem: string | null;
  weekly_hours: number | null;
  has_offer: boolean | null;
  has_landing_page: boolean | null;
  has_product_idea: boolean | null;
  product_idea_details: string | null;
  acquisition_plan: string | null;
  readiness_percent: number;
  updated_at: string;
};

function PublicProfile() {
  const { userId } = Route.useParams();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [survey, setSurvey] = useState<SurveyRow | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      let admin = false;
      if (auth.user) {
        const { data: roleOk } = await supabase.rpc("has_role", {
          _user_id: auth.user.id,
          _role: "admin",
        });
        admin = Boolean(roleOk);
      }
      setIsAdmin(admin);

      const [{ data: p }, { data: xp }, { data: st }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, created_at, email, avatar_url, social_link, phone")
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("user_xp_log").select("amount").eq("user_id", userId),
        supabase.rpc("get_public_user_streak", { _user_id: userId }),
      ]);
      setProfile((p as ProfileRow) ?? null);
      setTotalXp((xp ?? []).reduce((s, r) => s + r.amount, 0));
      setStreak(typeof st === "number" ? st : 0);

      if (admin) {
        const [{ data: prod }, { data: surv }] = await Promise.all([
          supabase
            .from("user_products")
            .select(
              "id, title, subtitle, promise, target_audience, problem, result, cover_url, status, product_type, price_draft, updated_at",
            )
            .eq("user_id", userId)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("survey_responses")
            .select(
              "goal_90_days, biggest_problem, weekly_hours, has_offer, has_landing_page, has_product_idea, product_idea_details, acquisition_plan, readiness_percent, updated_at",
            )
            .eq("user_id", userId)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        setProduct((prod as ProductRow) ?? null);
        setSurvey((surv as SurveyRow) ?? null);
      }
    })();
  }, [userId]);

  const level = Math.floor(totalXp / 500) + 1;
  const day = profile?.created_at
    ? Math.max(
        1,
        Math.min(
          90,
          Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000) + 1,
        ),
      )
    : 1;

  const socialUrl = profile?.social_link
    ? profile.social_link.startsWith("http")
      ? profile.social_link
      : `https://${profile.social_link}`
    : null;

  const yesNo = (v: boolean | null) =>
    v === true ? "Tak" : v === false ? "Nie" : "—";

  return (
    <PageShell title={profile?.full_name ?? "Profil"} subtitle="Profil publiczny uczestnika">
      <Link
        to="/"
        className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <ArrowLeft className="w-3 h-3" /> Wróć
      </Link>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-soft">
          <Zap className="w-5 h-5 text-violet mx-auto" />
          <div className="font-display font-extrabold text-xl">{totalXp}</div>
          <div className="text-xs text-muted-foreground">XP · Level {level}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-soft">
          <Flame className="w-5 h-5 text-orange mx-auto" />
          <div className="font-display font-extrabold text-xl">{streak}</div>
          <div className="text-xs text-muted-foreground">dni serii</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-soft">
          <Calendar className="w-5 h-5 text-blue mx-auto" />
          <div className="font-display font-extrabold text-xl">{day}/90</div>
          <div className="text-xs text-muted-foreground">dzień ścieżki</div>
        </div>
      </div>

      {isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mt-2">
            <Lock className="w-3.5 h-3.5 text-violet" />
            <span className="text-xs font-bold uppercase tracking-wide text-violet">
              Widok administratora
            </span>
          </div>

          {/* Kontakt + socials */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-3">
            <h3 className="font-display font-extrabold text-lg flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-violet" /> Kontakt i social media
            </h3>
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-semibold break-all">{profile?.email ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Telefon:</span>
                <span className="font-semibold">{profile?.phone ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Social:</span>
                {socialUrl ? (
                  <a
                    href={socialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-violet hover:underline break-all"
                  >
                    {profile?.social_link}
                  </a>
                ) : (
                  <span className="font-semibold">—</span>
                )}
              </div>
            </div>
          </section>

          {/* Produkt */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-3">
            <h3 className="font-display font-extrabold text-lg flex items-center gap-2">
              <Package className="w-4 h-4 text-blue" /> Produkt użytkownika
            </h3>
            {product ? (
              <div className="flex gap-4">
                {product.cover_url ? (
                  <img
                    src={product.cover_url}
                    alt={product.title ?? "Produkt"}
                    className="w-28 h-36 object-cover rounded-xl border border-border shrink-0"
                  />
                ) : (
                  <div className="w-28 h-36 rounded-xl bg-muted flex items-center justify-center text-xs text-muted-foreground shrink-0">
                    brak okładki
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-display font-extrabold text-base truncate">
                      {product.title || "—"}
                    </div>
                    {product.status && (
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-soft/40 text-violet">
                        {product.status}
                      </span>
                    )}
                    {product.product_type && (
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-soft/40 text-blue">
                        {product.product_type}
                      </span>
                    )}
                  </div>
                  {product.subtitle && (
                    <div className="text-sm text-muted-foreground">{product.subtitle}</div>
                  )}
                  {product.promise && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Obietnica:</span>{" "}
                      <span className="font-medium">{product.promise}</span>
                    </div>
                  )}
                  {product.target_audience && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Dla kogo:</span>{" "}
                      <span className="font-medium">{product.target_audience}</span>
                    </div>
                  )}
                  {product.problem && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Problem:</span>{" "}
                      <span className="font-medium">{product.problem}</span>
                    </div>
                  )}
                  {product.result && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Rezultat:</span>{" "}
                      <span className="font-medium">{product.result}</span>
                    </div>
                  )}
                  {product.price_draft != null && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Cena (szkic):</span>{" "}
                      <span className="font-semibold">{product.price_draft} zł</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Brak produktu.</div>
            )}
          </section>

          {/* Ankieta */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-3">
            <h3 className="font-display font-extrabold text-lg flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-orange" /> Ankieta startowa
              {survey && (
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-orange-soft/40 text-orange">
                  Gotowość: {survey.readiness_percent}%
                </span>
              )}
            </h3>
            {survey ? (
              <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Field label="Cel na 90 dni" value={survey.goal_90_days} full />
                <Field label="Największy problem" value={survey.biggest_problem} full />
                <Field label="Godzin / tydzień" value={survey.weekly_hours?.toString() ?? null} />
                <Field label="Ma plan pozyskiwania" value={survey.acquisition_plan} />
                <Field label="Ma ofertę" value={yesNo(survey.has_offer)} />
                <Field label="Ma landing page" value={yesNo(survey.has_landing_page)} />
                <Field label="Ma pomysł na produkt" value={yesNo(survey.has_product_idea)} />
                <Field
                  label="Szczegóły pomysłu"
                  value={survey.product_idea_details}
                  full
                />
              </dl>
            ) : (
              <div className="text-sm text-muted-foreground">Ankieta niewypełniona.</div>
            )}
          </section>
        </div>
      )}
    </PageShell>
  );
}

function Field({
  label,
  value,
  full,
}: {
  label: string;
  value: string | null | undefined;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
        {label}
      </dt>
      <dd className="text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}
