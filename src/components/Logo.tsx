import eggLogo from "@/assets/incumeet-egg.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { img: "h-8 w-8", text: "text-lg" },
  md: { img: "h-10 w-10", text: "text-2xl" },
  lg: { img: "h-16 w-16", text: "text-4xl md:text-5xl" },
};

export function Logo({ size = "sm", showWordmark = true, className }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src={eggLogo}
        alt="Incumeet logo"
        width={512}
        height={512}
        loading="lazy"
        className={cn(s.img, "object-contain shrink-0")}
      />
      {showWordmark && (
        <span
          className={cn(
            "font-extrabold tracking-tight leading-none text-primary lowercase",
            s.text
          )}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <span style={{ color: "hsl(41 100% 60%)" }}>i</span>ncumeet
        </span>
      )}
    </div>
  );
}
