const PROGRAM_COURSE_TITLES = [
  "Start: Mindset i fundamenty",
  "Pomysł: Mikro-problem",
  "Oferta: Value stack i cena",
  "Lejek: Landing, mail, checkout",
  "Pierwsze rozmowy: DM i lead magnet",
  "Reklamy: Meta Ads i ROAS",
  "Optymalizacja: A/B i dostarczalność",
  "Skalowanie: Drabinka i automatyzacja",
] as const;

const normalizeTitleKey = (title: string) =>
  title
    .trim()
    .replace(/^\d+\.\s*/, "")
    .toLocaleLowerCase("pl");

const titleNumberByKey = new Map(
  PROGRAM_COURSE_TITLES.map((title, index) => [title.toLocaleLowerCase("pl"), index + 1]),
);

export function normalizeProgramCourseTitle(title: string) {
  const cleanTitle = title.trim().replace(/^\d+\.\s*/, "");
  const number = titleNumberByKey.get(normalizeTitleKey(title));
  return number ? `${number}. ${cleanTitle}` : title;
}

export function normalizeProgramCourseRows<T extends { title: string }>(rows: T[]) {
  return rows.map((row) => ({
    ...row,
    title: normalizeProgramCourseTitle(row.title),
  }));
}
