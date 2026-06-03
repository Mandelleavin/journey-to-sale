import { useEffect, useLayoutEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tourSteps, type TourStep } from "./steps";

type Rect = { top: number; left: number; width: number; height: number } | null;

type Props = {
  open: boolean;
  onClose: (completed: boolean) => void;
};

const PADDING = 10;

function useTargetRect(selector: string | null, open: boolean, step: number): Rect {
  const [rect, setRect] = useState<Rect>(null);

  useLayoutEffect(() => {
    if (!open || !selector) {
      setRect(null);
      return;
    }
    let raf = 0;
    const measure = () => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setRect({
          top: r.top - PADDING,
          left: r.left - PADDING,
          width: r.width + PADDING * 2,
          height: r.height + PADDING * 2,
        });
      });
    };
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    const interval = window.setInterval(measure, 400); // catch late mounts
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      window.clearInterval(interval);
    };
  }, [selector, open, step]);

  return rect;
}

function computeTooltipPosition(
  rect: Rect,
  placement: TourStep["placement"],
): { top: number; left: number; transform: string; centered: boolean } {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;

  if (!rect) {
    return {
      top: vh / 2,
      left: vw / 2,
      transform: "translate(-50%, -50%)",
      centered: true,
    };
  }

  const tooltipW = Math.min(360, vw - 24);
  const tooltipH = 240;
  const cx = rect.left + rect.width / 2;
  const spaceBottom = vh - (rect.top + rect.height);
  const spaceTop = rect.top;

  let pos: "top" | "bottom" = "bottom";
  if (placement === "top") pos = "top";
  else if (placement === "bottom") pos = "bottom";
  else pos = spaceBottom >= tooltipH + 24 || spaceBottom >= spaceTop ? "bottom" : "top";

  const top =
    pos === "bottom" ? rect.top + rect.height + 12 : rect.top - 12;
  let left = cx;
  // clamp horizontally
  const halfW = tooltipW / 2;
  if (left - halfW < 12) left = 12 + halfW;
  if (left + halfW > vw - 12) left = vw - 12 - halfW;

  return {
    top,
    left,
    transform: pos === "bottom" ? "translate(-50%, 0)" : "translate(-50%, -100%)",
    centered: false,
  };
}

export function OnboardingTour({ open, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const step = tourSteps[index];
  const rect = useTargetRect(step?.target ?? null, open, index);

  // reset to first step whenever opened
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i >= tourSteps.length - 1) {
        onClose(true);
        return i;
      }
      return i + 1;
    });
  }, [onClose]);

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const skip = useCallback(() => onClose(false), [onClose]);

  // keyboard
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, prev, skip]);

  // lock scroll
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const tip = computeTooltipPosition(rect, step.placement);
  const Icon = step.icon;
  const isLast = index === tourSteps.length - 1;
  const isFirst = index === 0;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="tour-root"
        className="fixed inset-0 z-[100]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        aria-live="polite"
        role="dialog"
        aria-modal="true"
      >
        {/* Overlay with spotlight cutout via SVG mask */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {rect && (
                <motion.rect
                  initial={false}
                  animate={{
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                  }}
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                  rx={16}
                  ry={16}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(10, 6, 30, 0.72)"
            mask="url(#tour-mask)"
          />
        </svg>

        {/* Click-catcher (skip on overlay click) */}
        <button
          aria-label="Pomiń wprowadzenie"
          onClick={skip}
          className="absolute inset-0 w-full h-full cursor-default"
        />

        {/* Spotlight border glow */}
        {rect && (
          <motion.div
            initial={false}
            animate={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="absolute rounded-2xl ring-2 ring-violet pointer-events-none shadow-glow"
          />
        )}

        {/* Tooltip / modal card */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          style={{
            position: "absolute",
            top: tip.top,
            left: tip.left,
            transform: tip.transform,
            width: "min(360px, calc(100vw - 24px))",
          }}
          className={cn(
            "bg-card rounded-2xl border border-border shadow-2xl p-5",
            "pointer-events-auto",
          )}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-violet grid place-items-center text-primary-foreground shadow-glow">
              <Icon className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Krok {index + 1} z {tourSteps.length}
                </span>
                <button
                  onClick={skip}
                  aria-label="Zamknij"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-display font-extrabold text-base text-foreground mt-1 leading-tight">
                {step.title}
              </h3>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            {step.body}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {tourSteps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                aria-label={`Przejdź do kroku ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index
                    ? "w-6 bg-violet"
                    : i < index
                      ? "w-1.5 bg-violet/60"
                      : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={skip}
              className="text-xs text-muted-foreground"
            >
              Pomiń
            </Button>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <Button variant="outline" size="sm" onClick={prev}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Wstecz
                </Button>
              )}
              <Button
                size="sm"
                onClick={next}
                className="bg-gradient-violet text-primary-foreground shadow-glow"
              >
                {isLast ? "Zaczynamy" : "Dalej"}
                {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
