import { Link } from "@tanstack/react-router";
import logoMark from "@/assets/logo-90dni-mark.png";
import logoWordmark from "@/assets/logo-90dni-wordmark.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  withWordmark?: boolean;
  asLink?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { compact: "h-9 w-12", wordmark: "h-10 w-44" },
  md: { compact: "h-11 w-14", wordmark: "h-12 w-56" },
  lg: { compact: "h-14 w-20", wordmark: "h-16 w-72" },
};

export function Logo({
  size = "md",
  withWordmark = true,
  asLink = true,
  className = "",
}: LogoProps) {
  const s = sizeMap[size];
  const content = (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src={withWordmark ? logoWordmark : logoMark}
        alt="90 Dni"
        width={withWordmark ? 390 : 180}
        height={withWordmark ? 178 : 156}
        loading="lazy"
        className={`${withWordmark ? s.wordmark : s.compact} rounded-xl object-contain`}
      />
    </span>
  );
  if (!asLink) return content;
  return (
    <Link to="/" aria-label="90 Dni — strona główna">
      {content}
    </Link>
  );
}
