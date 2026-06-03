
# Plan: Odświeżenie strony głównej (landing dla niezalogowanych)

Celem jest podniesienie jakości wizualnej i marketingowej `LandingPage` (`src/components/landing/LandingPage.tsx`) — to ten widok zobaczy każdy niezalogowany użytkownik wchodzący na `/`.

## 1. Hero z animacją (header strony)

Nowy hero zastąpi obecną statyczną sekcję otwierającą:

- **Animowane tło**: warstwa gradient mesh + Particles (MagicUI) lub Animated Grid Pattern + delikatne kuleczki/meteors, by oddać dynamikę „startupowej energii".
- **Aurora/Gradient Text** w headline („Zbuduj swój pierwszy biznes online w 90 dni"), z subtelnym przesuwaniem koloru.
- **Typing/Word Rotate** w pod-nagłówku rotujący produkty: „ebook → kurs → SaaS → mentoring → newsletter".
- **Floating product cards** — 3-4 mini-karty produktów (Ebook, Kurs, SaaS) lewitujące wokół centralnego mockupu z parallax na scroll/mouse (framer-motion `useMotionValue`).
- **Animowany licznik** „2 137 osób w drodze do 1. sprzedaży" (count-up przy wejściu do viewportu).
- **Border Beam** wokół głównego CTA „Zacznij za darmo".
- **Logo wall / trust bar** pod hero: „Jak w Forbes / My Company / Business Insider" + 5★ średnia 4.9.

Animacje robione w framer-motion (już w projekcie) + komponenty MagicUI (instalacja manualna wg dokumentacji).

## 2. Lepiej wyglądające sekcje

Refaktor istniejących sekcji w jednolity rytm „bento + glow + reveal on scroll":

1. **„8 produktów które możesz zbudować"** — bento grid (różne rozmiary kart), Magic Card spotlight na hover, kolorowy glow per produkt.
2. **„90-dniowa ścieżka"** — pozioma oś czasu z animowaną linią postępu rysującą się na scroll (SVG `pathLength`), kropki etapów pulsują, aktywny etap z Border Beam.
3. **„6 generatorów AI"** — karty z ikoną w gradiencie, hover tilt 3D, krótkie demo (animowany pasek „generuję...") + tag „oszczędza X h/tydz".
4. **„Jak to działa (3 kroki)"** — Animated Beam łączący 3 kroki (Pomysł → Produkt → Sprzedaż).
5. **Porównanie „Sam vs z 90 Dni"** — dwie kolumny z animowanym wjazdem i kontrastem (czerwone X vs zielone ✓).
6. **Testimoniale** — karuzela z auto-scrollem (marquee), karty z avatarem, XP, paskiem postępu.
7. **Cennik (start / pro / vip)** — wyróżniony „PRO" z Border Beam, badge „Najczęstszy wybór", lista benefitów z animowanym check-in.
8. **FAQ** — accordion z miękkim fade.
9. **Final CTA** — pełnoekranowy gradient + Meteors + duży przycisk z shimmer.

Wspólne: spójne tokeny (`--gradient-violet`, `shadow-card`), nagłówki w `font-display`, sekcje z `reveal` (już użyte), generous spacing.

## 3. Marketing — copy i konwersja

- **Headline** mocniejszy, korzyść + ramy czasowe: „Twój pierwszy biznes online w 90 dni — z AI, planem i mentorem".
- **Sub** z konkretnym obiektem: „Codzienny plan zadań, 6 generatorów AI i ścieżka 90 dni. Bez teorii. Bez kodu. Z wynikiem."
- **3 bullet pod hero**: ⏱ 30 min dziennie · 🎯 1. sprzedaż w 30–60 dni · 🤖 AI robi 70% pracy.
- **Lead magnet**: „Pobierz darmowy plan na pierwsze 7 dni (PDF)" — formularz e-mail (zapisuje do `leads` jeśli jest, inaczej tylko toast + scroll do CTA). Tylko frontend, jeśli tabeli nie ma — zostawiam tylko CTA do rejestracji.
- **Social proof**: licznik użytkowników, gwiazdki, 3 testimoniale, logo wall.
- **Trust signals** przy cenniku: „Anuluj kiedy chcesz · 14 dni gwarancji · Płatność szyfrowana".
- **Sticky bottom CTA bar** na mobile po przescrollowaniu hero („Zacznij za darmo →").
- **SEO**: tytuł `<60 znaków`, meta description `<160`, JSON-LD `Organization`/`Product`, jeden `<h1>`, alt-y, lazy loading obrazów.

## 4. Pliki do zmian

- `src/components/landing/LandingPage.tsx` — rozbicie na mniejsze komponenty.
- Nowe: `src/components/landing/HeroAnimated.tsx`, `ProductsBento.tsx`, `TimelinePath.tsx`, `AiToolsGrid.tsx`, `HowItWorks.tsx`, `Comparison.tsx`, `TestimonialsMarquee.tsx`, `PricingSection.tsx`, `FaqSection.tsx`, `FinalCta.tsx`, `StickyCtaMobile.tsx`.
- `src/styles.css` — ewentualne nowe gradienty/keyframes (aurora, meteors fallback) jeśli MagicUI ich nie dostarczy.
- Instalacja komponentów MagicUI (manualnie, kopiowane pliki) używanych w hero/sekcjach.
- `src/routes/__root.tsx` — meta tagi SEO dla landing (head w `/` route).

## 5. Sekcja techniczna

- Zachowuję obecny routing — `Index` nadal renderuje `<LandingPage />` dla `!user`.
- Animacje: framer-motion (już zainstalowane). MagicUI komponenty dodaję jako lokalne pliki w `src/components/magicui/*` (Aurora Text, Border Beam, Meteors, Animated Beam, Marquee, Particles, Word Rotate) — bez nowego npm package, tylko zależności już obecne (`motion`).
- Wszystkie kolory przez tokeny z `src/styles.css` (`--violet`, `--gradient-violet`, `--shadow-card`), bez hardkodowanych `text-white`/`bg-black`.
- `prefers-reduced-motion` respektowany — wyłączam ciężkie animacje (Particles, Meteors).
- Mobile-first: hero animacje uproszczone na <md (mniej cząsteczek, brak parallax).
- Nie dotykam dashboardu zalogowanego (linie 172-295 w `index.tsx`).

## Zakres poza tym planem

- Nie zmieniam backendu, server functions, auth ani migracji.
- Nie tworzę nowych tabel (lead magnet tylko jeśli istnieje już sensowna tabela — w razie braku zostaje wizualny CTA).
- Nie ruszam reszty aplikacji (dashboard, narzędzia, admin).
