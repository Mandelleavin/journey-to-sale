// Scoring sprzedażowy ankiety — im więcej punktów, tym wyższa gotowość do zakupu kursu.
// Maks: 100 pkt = 100% gotowości.

export type AcquisitionPlan = "paid_ads" | "organic_social" | "unsure";

export type SurveyAnswers = {
  has_product_idea: boolean | null;
  product_idea_details?: string | null;
  has_offer: boolean | null;
  has_landing_page: boolean | null;
  biggest_problem: string;
  goal_90_days: string;
  weekly_hours: number;
  acquisition_plan: AcquisitionPlan | null;
};

export function computeReadiness(a: SurveyAnswers): { score: number; percent: number } {
  let s = 0;

  // Produkt: pomysł = 10, opisany = +10
  if (a.has_product_idea) s += 10;
  if (a.has_product_idea && (a.product_idea_details ?? "").trim().length >= 10) s += 10;

  // Oferta: 15
  if (a.has_offer) s += 15;

  // Landing: 10
  if (a.has_landing_page) s += 10;

  // Czas tygodniowy
  if (a.weekly_hours >= 10) s += 15;
  else if (a.weekly_hours >= 5) s += 10;
  else if (a.weekly_hours >= 2) s += 5;

  // Cel sformułowany
  if (a.goal_90_days.trim().length >= 5) s += 5;

  // Świadomość problemu (długość opisu)
  if (a.biggest_problem.trim().length >= 10) s += 5;

  // Sposób pozyskiwania klientów — kluczowy sygnał gotowości do inwestycji
  if (a.acquisition_plan === "paid_ads") s += 30;
  else if (a.acquisition_plan === "organic_social") s += 15;
  else if (a.acquisition_plan === "unsure") s += 5;

  const score = Math.min(100, s);
  return { score, percent: score };
}

export function readinessLabel(percent: number): { label: string; tone: "green" | "blue" | "orange" | "violet" } {
  if (percent >= 70) return { label: "Hot lead", tone: "green" };
  if (percent >= 45) return { label: "Warm", tone: "blue" };
  if (percent >= 25) return { label: "Edukacja", tone: "violet" };
  return { label: "Cold", tone: "orange" };
}
