import eggLogo from "@/assets/incumeet-egg.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { img: "h-8 w-8", text: "text-lg" },
  md: { img: "h-10 w-10", text: "text-2xl" },
  lg: { img: "h-16 w-16", text: "text-4xl md:text-5xl" },
  xl: { img: "h-32 w-32 md:h-40 md:w-40", text: "text-6xl md:text-7xl" },
};

const YELLOW = "hsl(41 100% 60%)";

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
          {/* Dotless i with an egg-shaped yellow dot */}
          <span className="relative inline-block" style={{ color: YELLOW }}>
            <span>ı</span>
            <span
              aria-hidden
              className="absolute left-1/2"
              style={{
                top: "-0.08em",
                width: "0.42em",
                height: "0.55em",
                transform: "translateX(-50%) rotate(-12deg)",
                background: YELLOW,
                borderRadius: "50% 50% 48% 48% / 62% 62% 38% 38%",
              }}
            />
          </span>
          ncumeet
        </span>
      )}
    </div>
  );
}
