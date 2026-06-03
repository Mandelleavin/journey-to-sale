
# Plan: Profesjonalne logo „90 Dni"

## Koncept

**Abstrakcyjna ikona + wordmark.** Ikona symbolizuje ścieżkę 90 dni — spirala / okrągły progress mark, który stopniowo się domyka (90% wypełnienia okręgu), z wewnętrznym akcentem (gwiazdka/iskra/„9"). Styl: premium, agency-grade, geometrycznie precyzyjny, jeden gradient violet→blue spójny z aplikacją.

Lockup: ikona (kwadrat) + wordmark „90 Dni" po prawej, w `font-display` (Plus Jakarta Sans, extrabold). Wariant pionowy nie potrzebny — używamy tylko poziomego.

## Wykonanie

1. **Wygenerować ikonę** jako PNG z przezroczystym tłem (`src/assets/logo-mark.png`) — abstrakcyjny symbol ścieżki 90 dni, gradient violet (`oklch(0.62 0.22 290)`) → blue (`oklch(0.62 0.18 245)`), na białym tle podczas generacji, potem przezroczyste.
   - Prompt skupiony na: minimalist abstract circular path mark, 90% arc completion, geometric precision, premium tech brand, gradient violet to blue, no text, vector-like clean edges.
   - Quality: `premium` (logo wymaga czystych linii i czytelności w małym rozmiarze).

2. **Utworzyć komponent `Logo.tsx`** w `src/components/landing/Logo.tsx`:
   - Props: `size` ("sm" | "md" | "lg"), `withWordmark` (default true).
   - Renderuje `<img>` z `logo-mark.png` + tekst „90 Dni" w `font-display font-extrabold`.
   - Używa istniejących tokenów (`text-foreground`, brak hardkodowanych kolorów).

3. **Podmienić w nawigacji landing page** (`src/components/landing/LandingPage.tsx`):
   - W komponencie `Nav()` (linie ~310-335): zastąpić obecny blok `<span><Flame /></span> 90 Dni` komponentem `<Logo />`.
   - W komponencie `Footer()` (linie ~720+): tak samo.

## Pliki

- nowy: `src/assets/logo-mark.png` (generowany)
- nowy: `src/components/landing/Logo.tsx`
- edycja: `src/components/landing/LandingPage.tsx` (Nav + Footer)

## Poza zakresem

- Favicon, OG image, warianty kolorystyczne (dark/light), ciemny wariant ikony — user wybrał tylko „nawigacja landing page".
- Nie ruszam dashboardu zalogowanego użytkownika ani Sidebar.
- Nie zmieniam routingu ani backendu.
