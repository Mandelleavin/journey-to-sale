import { Link } from "@tanstack/react-router";
import logoMark from "@/assets/logo-mark.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  withWordmark?: boolean;
  asLink?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { box: "w-7 h-7", text: "text-base" },
  md: { box: "w-9 h-9", text: "text-lg" },
  lg: { box: "w-12 h-12", text: "text-2xl" },
};

export function Logo({ size = "md", withWordmark = true, asLink = true, className = "" }: LogoProps) {
  const s = sizeMap[size];
  const content = (
    <span className={`flex items-center gap-2 font-display font-extrabold tracking-tight ${className}`}>
      <img
        src={logoMark}
        alt="90 Dni"
        width={64}
        height={64}
        loading="lazy"
        className={`${s.box} object-contain`}
      />
      {withWordmark && <span className={`${s.text} text-foreground`}>90 Dni</span>}
    </span>
  );
  if (!asLink) return content;
  return <Link to="/" aria-label="90 Dni — strona główna">{content}</Link>;
}
