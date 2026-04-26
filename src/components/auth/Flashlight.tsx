import { useEffect, useRef, useState } from "react";

/**
 * Latarka odsłaniająca treść — śledzi kursor (desktop) lub środek (mobile).
 * Renderuje overlay z radial-gradient masking.
 */
export function Flashlight({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(window.matchMedia("(min-width: 768px)").matches);
  }, []);

  useEffect(() => {
    if (!active || !isDesktop) return;
    const handler = (e: MouseEvent) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [active, isDesktop]);

  if (!active) return null;

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-500"
      style={{
        background: `radial-gradient(circle 220px at ${pos.x}% ${pos.y}%, transparent 0%, rgba(15, 13, 35, 0.92) 70%)`,
      }}
    />
  );
}
