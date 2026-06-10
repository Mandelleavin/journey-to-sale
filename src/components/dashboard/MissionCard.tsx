import { useState } from "react";
import { Target, Zap, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SketchArrow, SketchUnderline, SketchStar } from "./Sketch";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  description?: string;
  xpReward?: number;
  unlocked?: boolean;
  onAction?: () => void;
  upcoming?: string[];
};

type Section = {
  key: string;
  emoji: string;
  label: string;
  body: string;
};

// Markers in order of appearance in lesson instructions
const MARKERS: { emoji: string; label: string; key: string }[] = [
  { emoji: "🎯", label: "Cel", key: "cel" },
  { emoji: "📝", label: "Kroki", key: "kroki" },
  { emoji: "✅", label: "Kryteria zaliczenia", key: "kryteria" },
  { emoji: "💡", label: "Przykład", key: "przyklad" },
  { emoji: "📤", label: "Co wysłać", key: "wyslac" },
  { emoji: "📌", label: "Wskazówki", key: "wskazowki" },
];

function parseInstructions(text?: string): { sections: Section[]; raw: string | null } {
  if (!text) return { sections: [], raw: null };
  const cleaned = text.replace(/\r\n/g, "\n").trim();

  // Build a regex that finds each marker emoji
  const found: { idx: number; m: (typeof MARKERS)[number] }[] = [];
  for (const m of MARKERS) {
    const idx = cleaned.indexOf(m.emoji);
    if (idx >= 0) found.push({ idx, m });
  }
  if (found.length === 0) return { sections: [], raw: cleaned };
  found.sort((a, b) => a.idx - b.idx);

  const sections: Section[] = [];
  for (let i = 0; i < found.length; i++) {
    const start = found[i].idx + found[i].m.emoji.length;
    const end = i + 1 < found.length ? found[i + 1].idx : cleaned.length;
    let body = cleaned.slice(start, end).trim();
    // strip leading label words like "CEL", "KROKI", "KRYTERIA ZALICZENIA"...
    body = body.replace(
      /^(CEL|KROKI|KRYTERIA(?:\s+ZALICZENIA)?|PRZYK[ŁL]AD|CO\s+WYS[ŁL]A[ĆC]|WSKAZÓWKI)[\s:—-]*/i,
      "",
    );
    sections.push({
      key: found[i].m.key,
      emoji: found[i].m.emoji,
      label: found[i].m.label,
      body,
    });
  }
  return { sections, raw: null };
}

function formatLines(body: string): { type: "list" | "para"; items: string[] } {
  // Split into logical items: bullets (•) or numbered "1.", "2."
  // First split on bullet "•" or numbered patterns
  const hasBullets = /•|^\s*\d+\.\s/m.test(body);
  if (!hasBullets) {
    return { type: "para", items: [body.trim()] };
  }
  // Normalize: insert newlines before bullets and numbers
  const normalized = body
    .replace(/•/g, "\n• ")
    .replace(/(\s)(\d+\.)\s/g, "\n$2 ");
  const items = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => l.replace(/^•\s*/, "").replace(/^\d+\.\s*/, ""));
  return { type: "list", items };
}

export function MissionCard({
  title = "Napisz propozycję swojego produktu online",
  description,
  xpReward = 120,
  unlocked = true,
  onAction,
  upcoming = ["Napisz ofertę", "Stwórz stronę", "Przygotuj kampanię"],
}: Props) {
  const [open, setOpen] = useState(false);
  const { sections, raw } = parseInstructions(description);
  const cel = sections.find((s) => s.key === "cel");
  const others = sections.filter((s) => s.key !== "cel");

  return (
    <div className="relative grid lg:grid-cols-[1fr_280px] gap-4">
      <div className="relative bg-card rounded-2xl p-6 border border-border shadow-card overflow-hidden">
        <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-violet-soft opacity-60 blur-2xl" />
        <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-blue-soft opacity-60 blur-2xl" />

        <div className="relative">
          <div className="inline-block">
            <span className="font-hand text-violet text-xl font-bold uppercase tracking-wide">
              Twoja misja na dziś
            </span>
            <SketchUnderline className="w-44 h-3 -mt-1" />
          </div>

          <div className="mt-4 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-violet grid place-items-center shrink-0 shadow-glow">
              <Target className="w-7 h-7 text-primary-foreground" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-extrabold text-xl md:text-2xl text-foreground leading-tight">
                {title}
              </h2>

              {/* CEL highlight */}
              {cel && (
                <div className="mt-3 rounded-xl bg-gradient-to-br from-violet-soft/60 to-blue-soft/40 border border-violet/20 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet">
                    <span>🎯</span> Cel
                  </div>
                  <p className="text-sm text-foreground mt-1 leading-snug font-medium">
                    {cel.body}
                  </p>
                </div>
              )}

              {/* Fallback if no structured sections */}
              {!cel && raw && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{raw}</p>
              )}
            </div>
          </div>

          {/* Expandable details */}
          {others.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-violet hover:text-violet/80 transition-colors"
              >
                {open ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" /> Ukryj szczegóły
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" /> Pokaż szczegóły zadania
                  </>
                )}
              </button>

              {open && (
                <div className="mt-3 grid sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  {others.map((s) => {
                    const { type, items } = formatLines(s.body);
                    return (
                      <div
                        key={s.key}
                        className={cn(
                          "rounded-xl border border-border bg-background/60 p-3",
                          s.key === "kryteria" && "border-green/30 bg-green-soft/30",
                          s.key === "przyklad" && "border-orange/30 bg-orange-soft/30",
                          s.key === "wyslac" && "border-blue/30 bg-blue-soft/30 sm:col-span-2",
                        )}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                          <span>{s.emoji}</span> {s.label}
                        </div>
                        {type === "list" ? (
                          <ul className="mt-1.5 space-y-1">
                            {items.map((it, i) => (
                              <li
                                key={i}
                                className="text-xs text-foreground/85 leading-snug flex gap-1.5"
                              >
                                <span className="text-violet font-bold shrink-0">›</span>
                                <span>{it}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-1.5 text-xs text-foreground/85 leading-snug whitespace-pre-wrap">
                            {items[0]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <Button
              onClick={onAction}
              disabled={!unlocked}
              className="bg-gradient-violet text-primary-foreground shadow-glow hover:opacity-95 hover:bg-gradient-violet rounded-xl px-5 h-11 font-bold uppercase tracking-wide text-xs"
            >
              {unlocked ? (
                "Wykonaj zadanie"
              ) : (
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Zablokowane
                </span>
              )}
            </Button>
            <div className="inline-flex items-center gap-1.5 px-3 h-11 rounded-xl bg-green-soft border border-green/20 text-green font-bold text-sm">
              <Zap className="w-4 h-4 fill-green" />+{xpReward} XP
            </div>
            <div className="hidden md:block relative ml-auto">
              <SketchArrow direction="right" className="w-24 h-12 -rotate-12" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="sticky-note float-slow rounded-md p-5 relative">
          <SketchStar className="absolute -top-3 -right-2 w-7 h-7" />
          <div className="font-hand font-bold text-2xl text-ink leading-none">Nie zapomnij!</div>
          <ul className="mt-3 space-y-2">
            {upcoming.slice(0, 3).map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm text-ink/85 font-medium">
                <span className="w-4 h-4 rounded border-2 border-ink/40" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
