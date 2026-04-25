import { cn } from "@/lib/utils";

// Hand-drawn arrow that curves down-right
export function SketchArrow({
  className,
  direction = "right",
}: {
  className?: string;
  direction?: "right" | "left" | "down" | "down-left" | "down-right";
}) {
  const paths: Record<string, string> = {
    right: "M5 30 Q 40 10 70 25 T 130 28",
    left: "M130 30 Q 90 10 60 25 T 5 28",
    down: "M30 5 Q 10 30 25 50 T 28 95",
    "down-left": "M120 5 Q 80 30 60 60 T 10 95",
    "down-right": "M5 5 Q 40 30 60 60 T 130 95",
  };
  const heads: Record<string, JSX.Element> = {
    right: <polyline points="115,18 130,28 118,40" />,
    left: <polyline points="20,18 5,28 17,40" />,
    down: <polyline points="18,82 28,95 38,82" />,
    "down-left": <polyline points="18,80 10,95 22,92" />,
    "down-right": <polyline points="118,80 130,95 122,92" />,
  };
  return (
    <svg
      viewBox="0 0 140 100"
      className={cn("text-sketch", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[direction]} />
      {heads[direction]}
    </svg>
  );
}

export function SketchStar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("text-orange", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 L13.5 9 L20 10 L15 14 L16.5 20 L12 16.5 L7.5 20 L9 14 L4 10 L10.5 9 Z" />
    </svg>
  );
}

export function SketchCrown({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 22"
      className={cn(className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 18 L5 6 L10 12 L14 4 L18 12 L23 6 L25 18 Z" fill="oklch(0.85 0.15 90)" stroke="oklch(0.55 0.18 60)" />
      <circle cx="5" cy="6" r="1.2" fill="oklch(0.62 0.18 25)" />
      <circle cx="14" cy="4" r="1.2" fill="oklch(0.62 0.18 25)" />
      <circle cx="23" cy="6" r="1.2" fill="oklch(0.62 0.18 25)" />
    </svg>
  );
}

export function SketchUnderline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 14"
      className={cn("text-sketch", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M3 8 Q 50 2 100 6 T 197 5" />
    </svg>
  );
}
