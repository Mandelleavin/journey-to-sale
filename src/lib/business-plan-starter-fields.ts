export type StarterPlanFieldDefinition = {
  id: string;
  field_key: string;
  label: string;
  help_text: string;
  input_type: "text" | "textarea";
  options: [];
  placeholder: string;
  position: number;
  syncs_to_product_column?: string | null;
};

export const STARTER_PRODUCT_FIELD_KEYS = new Set([
  "starter_product_title",
  "starter_product_subtitle",
  "starter_product_offer",
  "starter_product_promise",
  "starter_pricing_packages",
  "starter_target_customer",
  "starter_transformation_before",
  "starter_transformation_after",
  "starter_product_cta",
]);

export const STARTER_PLAN_FIELDS: StarterPlanFieldDefinition[] = [
  {
    id: "00000000-0000-4000-8000-000000000090",
    field_key: "goal_90_days",
    label: "Jaki konkretny rezultat osiągniesz w ciągu 12 tygodni?",
    help_text:
      "Zapisz jeden mierzalny wynik, np. gotowy kurs i 10 pierwszych klientów. Unikaj ogólnego celu typu „rozwinę biznes”.",
    input_type: "textarea",
    options: [],
    placeholder: "Za 12 tygodni mam opublikowany kurs i minimum 10 płacących klientów...",
    position: -20,
  },
  {
    id: "00000000-0000-4000-8000-000000000091",
    field_key: "weekly_work_rhythm",
    label: "Kiedy dokładnie będziesz pracować nad swoim biznesem każdego tygodnia?",
    help_text:
      "Ustal konkretne dni, godziny i plan minimum na trudniejszy tydzień. Dzięki temu działanie nie zależy wyłącznie od motywacji.",
    input_type: "textarea",
    options: [],
    placeholder: "Poniedziałek, środa i piątek 18:00-19:30. Plan minimum: 30 minut w środę...",
    position: -19,
  },
  {
    id: "00000000-0000-4000-8000-000000000092",
    field_key: "starter_product_title",
    label: "Nazwa produktu",
    help_text:
      "Wpisz roboczą, konkretną nazwę produktu. Nie musi być finalna. Ma jasno mówić, jaki efekt klient dostanie i w jakim obszarze.",
    input_type: "text",
    options: [],
    placeholder: "Jak Stworzyć i Sprzedać Swój Produkt Cyfrowy w 90 Dni",
    position: 100,
    syncs_to_product_column: "title",
  },
  {
    id: "00000000-0000-4000-8000-000000000093",
    field_key: "starter_product_subtitle",
    label: "Podtytuł produktu",
    help_text:
      "Dopisz jedno zdanie, które wyjaśnia typ produktu i główną wartość. Możesz wskazać, czy to ebook, kurs, aplikacja, mentoring, społeczność albo newsletter.",
    input_type: "textarea",
    options: [],
    placeholder:
      "Zamień swoją wiedzę, pasję lub pomysł w produkt online, który możesz zacząć sprzedawać.",
    position: 101,
    syncs_to_product_column: "subtitle",
  },
  {
    id: "00000000-0000-4000-8000-000000000094",
    field_key: "starter_product_offer",
    label: "Oferta produktu",
    help_text:
      "Opisz krótko, co klient dostaje w środku: moduły, materiały, wsparcie, szablony, narzędzia, konsultacje lub dostęp do aplikacji.",
    input_type: "textarea",
    options: [],
    placeholder:
      "Plan 90 dni, lekcje krok po kroku, zadania po każdej lekcji, generatory AI, szablony landing page, maile i wsparcie...",
    position: 102,
    syncs_to_product_column: "sales_headline",
  },
  {
    id: "00000000-0000-4000-8000-000000000095",
    field_key: "starter_product_promise",
    label: "Obietnica produktu",
    help_text:
      "Napisz, co klient osiągnie i w jakim czasie. Najlepiej połącz efekt, czas i warunek działania.",
    input_type: "textarea",
    options: [],
    placeholder:
      "W 90 dni zbudujesz pierwszy produkt cyfrowy, stronę sprzedażową i plan zdobycia pierwszych klientów online.",
    position: 103,
    syncs_to_product_column: "promise",
  },
  {
    id: "00000000-0000-4000-8000-000000000096",
    field_key: "starter_pricing_packages",
    label: "Orientacyjne pakiety cenowe i zawartość",
    help_text:
      "Rozpisz 2-3 pakiety. Dla każdego podaj cenę, dla kogo jest i co zawiera. Na tym etapie ceny mogą być robocze.",
    input_type: "textarea",
    options: [],
    placeholder:
      "START 297 zł/mies. - aplikacja, lekcje, zadania, 80 kredytów AI. PRO 497 zł - pełne generatory, szablony, audyt pomysłu. VIP - konsultacje, audyty i priorytetowe wsparcie.",
    position: 104,
  },
  {
    id: "00000000-0000-4000-8000-000000000097",
    field_key: "starter_target_customer",
    label: "Dla kogo to jest?",
    help_text:
      "Opisz konkretną grupę ludzi, ich sytuację i powód zakupu. Unikaj zbyt szerokiego opisu typu „dla każdego”.",
    input_type: "textarea",
    options: [],
    placeholder:
      "Dla osób, które chcą zbudować dodatkowy biznes online, zarabiać na swojej wiedzy i stworzyć pierwszy ebook, kurs, aplikację lub usługę.",
    position: 105,
    syncs_to_product_column: "target_audience",
  },
  {
    id: "00000000-0000-4000-8000-000000000098",
    field_key: "starter_transformation_before",
    label: "Transformacja: przed",
    help_text:
      "Opisz punkt startowy klienta: chaos, brak planu, brak produktu, brak sprzedaży, dużo pomysłów bez wdrożenia.",
    input_type: "textarea",
    options: [],
    placeholder: "Mam chaos, pomysł w głowie i nie wiem, co zrobić najpierw.",
    position: 106,
  },
  {
    id: "00000000-0000-4000-8000-000000000099",
    field_key: "starter_transformation_after",
    label: "Transformacja: po",
    help_text:
      "Opisz stan po przejściu programu: gotowy produkt, oferta, strona, pierwsze rozmowy, pierwsi klienci albo jasny plan sprzedaży.",
    input_type: "textarea",
    options: [],
    placeholder: "Mam produkt, stronę sprzedażową, plan działania i pierwszych klientów.",
    position: 107,
    syncs_to_product_column: "result",
  },
  {
    id: "00000000-0000-4000-8000-000000000100",
    field_key: "starter_product_cta",
    label: "CTA: wezwanie do działania",
    help_text:
      "Wpisz jedno krótkie wezwanie, które ma kierować użytkownika do najważniejszej akcji. Najlepiej użyj czasownika i konkretu.",
    input_type: "text",
    options: [],
    placeholder: "Rozpocznij budowę swojego produktu",
    position: 108,
    syncs_to_product_column: "cta_label",
  },
];

const STARTER_PLANNING_LESSON_IDS = new Set(["c6ef72cb-3304-4595-ada8-06f357095456"]);

export function isStarterPlanningLesson(lessonId: string) {
  return STARTER_PLANNING_LESSON_IDS.has(lessonId);
}

export function isMindsetStarterModule(title: string | null | undefined) {
  if (!title) return false;
  return /^(?:0|1)(?:[.:\s-]|$)/.test(title.trim()) && /mindset|fundament|start/i.test(title);
}
