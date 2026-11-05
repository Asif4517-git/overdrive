import { useId, useMemo } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { CarId, ScreenName, TrackDef } from "../game/types";
import { getTrackPreview } from "../game/trackPreview";
import { cn } from "../utils/cn";
import {
  ArrowRight,
  CarIcon,
  ChevronIcon,
  MuteIcon,
  PlayIcon,
  InfoIcon,
  SettingsIcon,
  TrackIcon,
  VolumeIcon,
} from "./Icons";
import carVanta from "../assets/car-vanta.jpg";
import carSpectre from "../assets/car-spectre.jpg";
import carRonin from "../assets/car-ronin.jpg";

export const CAR_IMAGES: Record<CarId, string> = {
  vanta: carVanta,
  spectre: carSpectre,
  ronin: carRonin,
};

export const Logo = ({ compact = false, onClick }: { compact?: boolean; onClick?: () => void }) => {
  const content = (
    <>
      <svg
        width={compact ? 30 : 38}
        height={compact ? 34 : 44}
        viewBox="0 0 40 46"
        fill="none"
        className="logo-mark shrink-0"
        aria-hidden
      >
        <path d="M20 1 38 12v20L20 44 2 32V12Z" stroke="url(#lg1)" strokeWidth="1.4" />
        <path d="M20 7 32 14.5v15L20 38 8 29.5v-15Z" fill="rgba(49,244,255,0.06)" />
        <path d="M13 29 22 14h4l-9 15Z" fill="#31f4ff" />
        <path d="M21 32 30 17h3l-9 15Z" fill="#ff2ea6" opacity="0.85" />
        <defs>
          <linearGradient id="lg1" x1="2" y1="1" x2="38" y2="44">
            <stop stopColor="#31f4ff" />
            <stop offset="1" stopColor="#ff2ea6" />
          </linearGradient>
        </defs>
      </svg>
      <div className={compact ? "text-[20px] sm:text-[17px]" : "text-[24px]"}>
        <span className="logo-word block text-white">NEON</span>
        <span className="logo-word rush block">RUSH</span>
      </div>
    </>
  );
  if (onClick) {
    return (
      <button className="flex items-center gap-2.5 text-left" onClick={onClick} aria-label="NEON RUSH home">
        {content}
      </button>
    );
  }
  return <div className="flex items-center gap-2.5">{content}</div>;
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "magenta";
  size?: "sm" | "md" | "lg";
  trailing?: ReactNode;
  leading?: ReactNode;
}

export const Button = ({
  variant = "outline",
  size = "md",
  className,
  children,
  trailing,
  leading,
  ...props
}: ButtonProps) => (
  <button
    className={cn(
      "btn",
      variant === "primary" && "btn-primary",
      variant === "outline" && "btn-outline",
      variant === "ghost" && "btn-ghost",
      variant === "magenta" && "btn-magenta",
      size === "sm" && "px-4 py-2.5 text-[0.68rem]",
      size === "lg" && "px-7 py-4 text-[0.88rem]",
      className
    )}
    {...props}
  >
    {leading}
    {children}
    {trailing}
  </button>
);

export const PlayButton = ({
  children = "Start race",
  onClick,
  className,
}: {
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
}) => (
  <Button variant="primary" size="lg" onClick={onClick} className={className} leading={<PlayIcon size={15} />} trailing={<ArrowRight size={16} />}>
    {children}
  </Button>
);

export const StatBar = ({
  label,
  value,
  color = "#31f4ff",
  suffix,
  segments = false,
}: {
  label: string;
  value: number;
  color?: string;
  suffix?: string;
  segments?: boolean;
}) => {
  const bars = 14;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="hud-label">{label}</span>
        <span className="mono text-[0.78rem] font-semibold" style={{ color }}>
          {suffix ?? value}
        </span>
      </div>
      {segments ? (
        <div className="flex gap-[3px]">
          {Array.from({ length: bars }, (_, index) => {
            const active = (index + 1) / bars <= value / 100;
            return (
              <span
                key={index}
                className="h-[4px] flex-1 transition-colors"
                style={{ background: active ? color : "rgba(255,255,255,0.09)", boxShadow: active ? `0 0 7px ${color}66` : "none" }}
              />
            );
          })}
        </div>
      ) : (
        <div className="stat-track">
          <div className="stat-fill" style={{ width: `${value}%`, background: color, color }} />
        </div>
      )}
    </div>
  );
};

export const TrackMap = ({
  track,
  color,
  className,
  strokeWidth = 1.5,
  showLabels = true,
}: {
  track: TrackDef;
  color?: string;
  className?: string;
  strokeWidth?: number;
  showLabels?: boolean;
}) => {
  const id = useId().replace(/:/g, "");
  const preview = useMemo(() => getTrackPreview(track), [track]);
  const accent = color ?? track.accent;
  return (
    <svg viewBox="0 0 100 100" className={cn("h-full w-full", className)} aria-hidden>
      <defs>
        <filter id={`glow-${id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={accent} />
          <stop offset="1" stopColor={track.accent2} />
        </linearGradient>
      </defs>
      {Array.from({ length: 5 }, (_, i) => (
        <line key={`v${i}`} x1={20 + i * 15} y1="8" x2={20 + i * 15} y2="92" stroke="rgba(130,160,255,0.07)" strokeWidth="0.4" />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <line key={`h${i}`} x1="8" y1={20 + i * 15} x2="92" y2={20 + i * 15} stroke="rgba(130,160,255,0.07)" strokeWidth="0.4" />
      ))}
      <path d={preview.path} fill="none" stroke="rgba(0,0,0,0.7)" strokeWidth={strokeWidth + 5} strokeLinejoin="round" />
      <path d={preview.path} fill="none" stroke={`url(#grad-${id})`} strokeWidth={strokeWidth + 1.4} strokeLinejoin="round" opacity="0.28" />
      <path
        d={preview.path}
        fill="none"
        stroke={accent}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        filter={`url(#glow-${id})`}
      />
      <circle cx={preview.points[22].x} cy={preview.points[22].y} r="1.8" fill={track.accent2} />
      <circle cx={preview.points[55].x} cy={preview.points[55].y} r="1.8" fill={track.accent} />
      <g transform={`translate(${preview.start.x} ${preview.start.y})`}>
        <rect x="-2" y="-2" width="4" height="4" fill="#ffffff" transform="rotate(45)" />
        <circle r="5.5" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.55" />
      </g>
      {showLabels && (
        <text x="8" y="96" fill="rgba(180,195,235,0.55)" fontSize="3.4" fontFamily="Rajdhani, sans-serif" letterSpacing="0.5">
          {track.location}
        </text>
      )}
    </svg>
  );
};

interface GameHeaderProps {
  current: ScreenName;
  onNavigate: (screen: ScreenName) => void;
  onSound: () => void;
  muted: boolean;
  onRace: () => void;
  rightSlot?: ReactNode;
}

export const GameHeader = ({ current, onNavigate, onSound, muted, onRace, rightSlot }: GameHeaderProps) => {
  const links: { label: string; screen: ScreenName; icon: ReactNode }[] = [
    { label: "Garage", screen: "garage", icon: <CarIcon size={15} /> },
    { label: "Circuits", screen: "circuits", icon: <TrackIcon size={15} /> },
    { label: "Settings", screen: "settings", icon: <SettingsIcon size={15} /> },
    { label: "About", screen: "about", icon: <InfoIcon size={15} /> },
  ];
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#05040d]/85 backdrop-blur-xl">
      <div className="page-container flex items-center justify-between gap-3 py-3.5 sm:gap-4 sm:py-4">
        <div className="flex min-w-0 items-center gap-6 lg:gap-8">
          <Logo compact onClick={() => onNavigate("menu")} />
          <nav className="hidden items-center gap-5 lg:flex lg:gap-6">
            {links.map((link) => (
              <button
                key={link.screen}
                className="nav-link flex items-center gap-2 whitespace-nowrap"
                data-active={current === link.screen}
                onClick={() => onNavigate(link.screen)}
              >
                {link.icon}
                {link.label}
              </button>
            ))}
            <button
              className="nav-link whitespace-nowrap"
              data-active={current === "howto"}
              onClick={() => onNavigate("howto")}
            >
              How to play
            </button>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          {rightSlot}
          <div className="hidden items-center gap-2 border border-white/10 px-2.5 py-1.5 lg:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--lime)] shadow-[0_0_8px_var(--lime)]" />
            <span className="hud-label !text-[0.52rem]">Solo grid</span>
          </div>
          <button
            onClick={() => onNavigate("howto")}
            className="grid h-9 w-9 place-items-center border border-white/10 text-[var(--muted)] transition hover:border-white/30 hover:text-white lg:hidden"
            aria-label="How to play and controls"
            title="How to play and controls"
          >
            <InfoIcon size={16} />
          </button>
          <button
            onClick={onSound}
            className="grid h-9 w-9 place-items-center border border-white/10 text-[var(--muted)] transition hover:border-white/30 hover:text-white"
            aria-label={muted ? "Enable sound" : "Mute sound"}
          >
            {muted ? <MuteIcon size={16} /> : <VolumeIcon size={16} />}
          </button>
          <div className="hidden sm:block">
            <Button size="sm" variant="primary" onClick={onRace}>
              Race
              <ChevronIcon size={13} />
            </Button>
          </div>
        </div>
      </div>
      <div className="border-t border-white/[0.06] lg:hidden">
        <nav className="page-container grid grid-cols-4 items-center gap-1 py-2 text-center">
          {links.map((link) => (
            <button
              key={link.screen}
              className="flex min-w-0 flex-col items-center gap-1 py-1 font-display text-[0.56rem] uppercase tracking-[0.06em] text-[var(--muted)] transition hover:text-white data-[active=true]:text-white"
              data-active={current === link.screen}
              onClick={() => onNavigate(link.screen)}
              aria-label={link.label}
            >
              {link.icon}
              <span className="block w-full truncate text-center">{link.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export const PageHeading = ({
  index,
  eyebrow,
  title,
  description,
  right,
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  description?: string;
  right?: ReactNode;
}) => (
  <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="animate-slide-right">
      <div className="mb-2 flex items-center gap-3">
        <span className="mono text-[0.7rem] font-semibold tracking-[0.2em] text-[var(--cyan)]">{index}</span>
        <span className="h-px w-8 bg-[var(--cyan)]/50" />
        <span className="eyebrow">{eyebrow}</span>
      </div>
      <h1 className="display text-4xl uppercase leading-[0.92] text-white sm:text-5xl">{title}</h1>
      {description && <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted)]">{description}</p>}
    </div>
    {right && <div className="shrink-0">{right}</div>}
  </div>
);

export const MiniRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] py-2 last:border-0">
    <span className="hud-label !text-[0.55rem]">{label}</span>
    <span className="mono text-sm font-semibold text-white">{value}</span>
  </div>
);
