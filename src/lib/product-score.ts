// Deterministyczny Produkt Score 0–100. Liczy się z wypełnionych pól.

export type ProductRow = {
  title?: string | null;
  subtitle?: string | null;
  promise?: string | null;
  target_audience?: string | null;
  problem?: string | null;
  result?: string | null;
  product_type?: string | null;
  status?: string | null;
  cover_url?: string | null;
  price_draft?: number | string | null;
  sales_headline?: string | null;
  sales_subtitle?: string | null;
  benefits?: unknown[] | null;
  agenda?: unknown[] | null;
  bonuses?: unknown[] | null;
  faq?: unknown[] | null;
  cta_label?: string | null;
  publish_checklist?: Record<string, boolean> | null;
};

export type PackageRow = {
  id: string;
  name?: string | null;
  price?: number | string | null;
  is_featured?: boolean | null;
};

export type MaterialRow = {
  id: string;
  kind?: string | null;
  file_url?: string | null;
  external_link?: string | null;
};

export const PUBLISH_CHECKLIST_ITEMS: { key: string; label: string }[] = [
  { key: "name", label: "Mam nazwę produktu" },
  { key: "promise", label: "Mam obietnicę" },
  { key: "audience", label: "Mam opis grupy docelowej" },
  { key: "agenda", label: "Mam agendę" },
  { key: "price", label: "Mam cenę" },
  { key: "packages", label: "Mam pakiety" },
  { key: "materials", label: "Mam materiały produktu" },
  { key: "sales_page", label: "Mam stronę sprzedażową" },
  { key: "promo_posts", label: "Mam posty promocyjne" },
  { key: "promo_emails", label: "Mam maile sprzedażowe" },
  { key: "payment_link", label: "Mam link do płatności" },
];

const txt = (v?: string | null) => (v ?? "").trim().length > 0;
const arr = (v?: unknown[] | null, min = 1) => Array.isArray(v) && v.length >= min;

export type ScoreBreakdown = {
  label: string;
  earned: number;
  max: number;
  done: boolean;
  hint: string;
};

export function computeProductScore(
  p: ProductRow,
  packages: PackageRow[],
  materials: MaterialRow[],
): { score: number; breakdown: ScoreBreakdown[]; nextStep: { stage: number; hint: string } } {
  const b: ScoreBreakdown[] = [];

  // FUNDAMENT 35
  b.push({ label: "Nazwa produktu", max: 5, earned: txt(p.title) && p.title !== "Mój produkt" ? 5 : 0, done: txt(p.title) && p.title !== "Mój produkt", hint: "Nadaj produktowi nazwę" });
  b.push({ label: "Dla kogo jest produkt", max: 5, earned: txt(p.target_audience) ? 5 : 0, done: txt(p.target_audience), hint: "Opisz grupę docelową" });
  b.push({ label: "Problem klienta", max: 5, earned: txt(p.problem) ? 5 : 0, done: txt(p.problem), hint: "Opisz problem, który rozwiązujesz" });
  b.push({ label: "Główna obietnica", max: 10, earned: txt(p.promise) ? 10 : 0, done: txt(p.promise), hint: "Dodaj mocną obietnicę produktu" });
  b.push({ label: "Efekt dla klienta", max: 5, earned: txt(p.result) ? 5 : 0, done: txt(p.result), hint: "Opisz efekt po przejściu produktu" });
  b.push({ label: "Typ produktu", max: 3, earned: txt(p.product_type) ? 3 : 0, done: txt(p.product_type), hint: "Wybierz typ produktu" });
  b.push({ label: "Cena robocza", max: 2, earned: p.price_draft != null && Number(p.price_draft) > 0 ? 2 : 0, done: p.price_draft != null && Number(p.price_draft) > 0, hint: "Ustaw cenę roboczą" });

  // OFERTA 25
  b.push({ label: "Nagłówek sprzedażowy", max: 5, earned: txt(p.sales_headline) ? 5 : 0, done: txt(p.sales_headline), hint: "Dodaj nagłówek sprzedażowy" });
  b.push({ label: "Lista korzyści (≥3)", max: 5, earned: arr(p.benefits, 3) ? 5 : 0, done: arr(p.benefits, 3), hint: "Dodaj minimum 3 korzyści" });
  b.push({ label: "Agenda (≥3)", max: 5, earned: arr(p.agenda, 3) ? 5 : 0, done: arr(p.agenda, 3), hint: "Dodaj minimum 3 punkty agendy" });
  b.push({ label: "Bonusy (≥1)", max: 3, earned: arr(p.bonuses, 1) ? 3 : 0, done: arr(p.bonuses, 1), hint: "Dodaj bonus" });
  b.push({ label: "FAQ (≥3)", max: 5, earned: arr(p.faq, 3) ? 5 : 0, done: arr(p.faq, 3), hint: "Dodaj 3 odpowiedzi FAQ" });
  b.push({ label: "CTA", max: 2, earned: txt(p.cta_label) ? 2 : 0, done: txt(p.cta_label), hint: "Ustaw etykietę CTA" });

  // PAKIETY 15
  b.push({ label: "Min. 1 pakiet", max: 5, earned: packages.length >= 1 ? 5 : 0, done: packages.length >= 1, hint: "Dodaj pierwszy pakiet" });
  b.push({ label: "Min. 2 pakiety", max: 5, earned: packages.length >= 2 ? 5 : 0, done: packages.length >= 2, hint: "Dodaj drugi pakiet" });
  b.push({ label: "Polecany pakiet", max: 5, earned: packages.some((x) => x.is_featured) ? 5 : 0, done: packages.some((x) => x.is_featured), hint: "Oznacz polecany pakiet" });

  // MATERIAŁY 15
  b.push({ label: "Okładka", max: 5, earned: txt(p.cover_url) ? 5 : 0, done: txt(p.cover_url), hint: "Wgraj okładkę produktu" });
  b.push({ label: "Min. 3 materiały", max: 10, earned: materials.length >= 3 ? 10 : 0, done: materials.length >= 3, hint: "Dodaj minimum 3 materiały" });

  // PUBLIKACJA 10
  const checked = Object.values(p.publish_checklist ?? {}).filter(Boolean).length;
  const pubEarned = Math.min(10, checked);
  b.push({ label: `Publikacja (${checked}/${PUBLISH_CHECKLIST_ITEMS.length})`, max: 10, earned: pubEarned, done: checked >= PUBLISH_CHECKLIST_ITEMS.length, hint: "Odhacz pozycje przed publikacją" });

  const score = b.reduce((a, x) => a + x.earned, 0);

  // Następny krok: pierwszy nieukończony w kolejności
  const nextIdx = b.findIndex((x) => !x.done);
  const nextStep = nextIdx === -1
    ? { stage: 5, hint: "Wszystko gotowe — czas publikować!" }
    : { stage: nextIdx < 7 ? 1 : nextIdx < 13 ? 2 : nextIdx < 16 ? 3 : nextIdx < 18 ? 4 : 5, hint: b[nextIdx].hint };

  return { score, breakdown: b, nextStep };
}

export const PLAN_PRODUCT_LIMITS: Record<string, number> = {
  start: 1,
  pro: 2,
  vip: 3,
};
