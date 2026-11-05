import { useId, useMemo } from "react";
import type { ReactNode } from "react";
import type { CarSpec, ScreenName, TrackDef } from "../types";
import { BODY_IMAGES } from "../data";
import { DEVELOPER } from "../../game/credits";
import { LIVE_URL, REPO_URL, SITE } from "../site";
import {
  ArrowRight,
  CarIcon,
  FlagIcon,
  GitHubIcon,
  MuteIcon,
  PlayCircleIcon,
  SettingsIcon,
  TrackIcon,
  VolumeIcon,
} from "../../components/Icons";

export const Logo = ({
  compact = false,
  onClick,
}: {
  compact?: boolean;
  onClick?: () => void;
}) => {
  const content = (
    <>
      <span className="logo-mark" aria-hidden>
        <span>O</span>
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={`logo-word ${compact ? "text-[1.05rem]" : "text-[1.25rem]"}`}>
          OVER<span style={{ color: "var(--accent)" }}>DRIVE</span>
        </span>
        <span className="mt-0.5 hidden font-[var(--font-number)] text-[0.5rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)] sm:block">
          Real roads · real machines
        </span>
      </span>
    </>
  );
  if (onClick) {
    return (
      <button className="flex items-center gap-2.5 text-left" onClick={onClick} aria-label="OVERDRIVE home">
        {content}
      </button>
    );
  }
  return <div className="flex items-center gap-2.5">{content}</div>;
};

interface HeaderProps {
  current: ScreenName;
  muted: boolean;
  onNavigate: (screen: ScreenName) => void;
  onSound: () => void;
  onRace: () => void;
}

const LINKS: { screen: ScreenName; label: string; icon: ReactNode }[] = [
  { screen: "garage", label: "Garage", icon: <CarIcon size={14} /> },
  { screen: "tracks", label: "Circuits", icon: <TrackIcon size={14} /> },
  { screen: "settings", label: "Settings", icon: <SettingsIcon size={14} /> },
  { screen: "about", label: "About", icon: <FlagIcon size={14} /> },
];

export const Header = ({ current, muted, onNavigate, onSound, onRace }: HeaderProps) => (
  <header className="site-header">
    <div className="page-container flex items-center justify-between gap-3 py-3 sm:py-3.5">
      <div className="flex min-w-0 items-center gap-7 lg:gap-9">
        <Logo compact onClick={() => onNavigate("home")} />
        <nav className="hidden items-center gap-5 lg:gap-7 md:flex">
          <button className="nav-item" data-active={current === "home"} onClick={() => onNavigate("home")}>
            Home
          </button>
          {LINKS.map((link) => (
            <button
              key={link.screen}
              className="nav-item flex items-center gap-1.5"
              data-active={current === link.screen}
              onClick={() => onNavigate(link.screen)}
            >
              {link.icon}
              {link.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden items-center gap-1.5 border border-[var(--line)] px-2.5 py-1.5 xl:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
          <span className="section-label !text-[0.5rem]">Offline · local save</span>
        </span>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="grid h-8 w-8 place-items-center border border-[var(--line)] text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-white"
          aria-label="View OVERDRIVE source on GitHub"
          title="View source on GitHub"
        >
          <GitHubIcon size={15} />
        </a>
        <button
          onClick={onSound}
          className="grid h-8 w-8 place-items-center border border-[var(--line)] text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-white"
          aria-label={muted ? "Enable sound" : "Mute sound"}
        >
          {muted ? <MuteIcon size={15} /> : <VolumeIcon size={15} />}
        </button>
        <button className="btn btn-primary btn-sm hidden sm:inline-flex" onClick={onRace}>
          Drive
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
    <div className="border-t border-[var(--line)] lg:hidden">
      <nav className="page-container grid grid-cols-5 py-1.5 text-center">
        <button
          className="flex min-w-0 flex-col items-center gap-1 py-1 text-[0.56rem] font-semibold uppercase tracking-[0.06em] text-[var(--muted)] data-[active=true]:text-white"
          data-active={current === "home"}
          onClick={() => onNavigate("home")}
        >
          <FlagIcon size={14} />
          <span className="w-full truncate">Home</span>
        </button>
        {LINKS.map((link) => (
          <button
            key={link.screen}
            className="flex min-w-0 flex-col items-center gap-1 py-1 text-[0.56rem] font-semibold uppercase tracking-[0.06em] text-[var(--muted)] data-[active=true]:text-white"
            data-active={current === link.screen}
            onClick={() => onNavigate(link.screen)}
          >
            {link.icon}
            <span className="w-full truncate">{link.label}</span>
          </button>
        ))}
      </nav>
    </div>
  </header>
);

export const Footer = ({ onNavigate }: { onNavigate: (screen: ScreenName) => void }) => (
  <footer className="page-container border-t border-[var(--line)] py-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="section-label !text-[0.52rem]">OVERDRIVE · Unofficial driving game</span>
        <span className="hidden h-3 w-px bg-[var(--line-strong)] sm:block" />
        <span className="font-[var(--font-number)] text-[0.6rem] text-[var(--muted)]">
          Created &amp; developed by <span className="text-[var(--ink)]">{DEVELOPER.name}</span>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <a
          href={LIVE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[var(--accent)] transition hover:text-white"
          title={`Play OVERDRIVE at ${LIVE_URL}`}
        >
          <PlayCircleIcon size={12} /> Play live
        </a>
        <a
          href={SITE.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[0.6rem] uppercase tracking-[0.14em] text-[var(--muted)] transition hover:text-white"
          title="View source on GitHub"
        >
          <GitHubIcon size={12} /> Source
        </a>
        <a
          href={DEVELOPER.portfolio}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.6rem] uppercase tracking-[0.14em] text-[var(--muted)] transition hover:text-white"
        >
          Portfolio ↗
        </a>
        <a
          href={DEVELOPER.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.6rem] uppercase tracking-[0.14em] text-[var(--muted)] transition hover:text-white"
        >
          {DEVELOPER.instagramHandle} ↗
        </a>
        <a
          href={DEVELOPER.emailHref}
          className="text-[0.6rem] uppercase tracking-[0.14em] text-[var(--muted)] transition hover:text-white"
        >
          Contact
        </a>
        <button className="text-[0.6rem] uppercase tracking-[0.14em] text-[var(--muted)] transition hover:text-white" onClick={() => onNavigate("about")}>
          About
        </button>
      </div>
    </div>
  </footer>
);

export const SectionTitle = ({
  index,
  eyebrow,
  title,
  description,
  right,
}: {
  index?: string;
  eyebrow: string;
  title: ReactNode;
  description?: string;
  right?: ReactNode;
}) => (
  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="animate-slide">
      <div className="mb-2 flex items-center gap-3">
        {index && <span className="mono text-[0.7rem] font-semibold tracking-[0.16em] text-[var(--accent)]">{index}</span>}
        <span className="h-px w-7 bg-[var(--accent)]/60" />
        <span className="eyebrow !text-[0.58rem]">{eyebrow}</span>
      </div>
      <h1 className="display text-[2.2rem] leading-[0.95] text-white sm:text-[2.8rem]">{title}</h1>
      {description && <p className="mt-2.5 max-w-2xl text-[0.8rem] leading-relaxed text-[var(--muted)]">{description}</p>}
    </div>
    {right && <div className="shrink-0">{right}</div>}
  </div>
);

export const carImage = (car: CarSpec) => BODY_IMAGES[car.body] ?? BODY_IMAGES.sports;

export const StatBar = ({
  label,
  value,
  suffix,
  gold,
}: {
  label: string;
  value: number;
  suffix?: string;
  gold?: boolean;
}) => (
  <div>
    <div className="mb-1 flex items-center justify-between">
      <span className="section-label !text-[0.52rem]">{label}</span>
      <span className="mono text-[0.7rem] font-semibold text-[var(--ink)]">{suffix ?? `${Math.round(value)}`}</span>
    </div>
    <div className="stat-track">
      <div className={`stat-fill ${gold ? "gold" : ""}`} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </div>
  </div>
);

export interface PreviewPath {
  path: string;
  start: { x: number; y: number };
  points: { x: number; y: number }[];
}

export const useTrackPath = (track: TrackDef): PreviewPath =>
  useMemo(() => {
    const raw: { x: number; y: number }[] = [];
    const segments = 96;
    for (let i = 0; i < segments; i += 1) {
      const a = (i / segments) * Math.PI * 2;
      const radius =
        1 +
        track.harmonicA * Math.sin(3 * a + 0.7) +
        track.harmonicB * Math.cos(5 * a + 1.9) +
        track.harmonicB * 0.45 * Math.sin(8 * a + 0.2);
      raw.push({ x: Math.cos(a) * track.rx * radius, y: Math.sin(a) * track.rz * radius });
    }
    const minX = Math.min(...raw.map((p) => p.x));
    const maxX = Math.max(...raw.map((p) => p.x));
    const minY = Math.min(...raw.map((p) => p.y));
    const maxY = Math.max(...raw.map((p) => p.y));
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    const points = raw.map((p) => ({ x: 10 + ((p.x - minX) / spanX) * 80, y: 10 + ((p.y - minY) / spanY) * 80 }));
    let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 1; i <= points.length; i += 1) {
      const current = points[i % points.length];
      const next = points[(i + 1) % points.length];
      path += ` Q ${current.x.toFixed(2)} ${current.y.toFixed(2)} ${((current.x + next.x) / 2).toFixed(2)} ${((current.y + next.y) / 2).toFixed(2)}`;
    }
    return { path: `${path} Z`, start: points[0], points };
  }, [track]);

export const TrackMap = ({
  track,
  accent,
  className = "",
  strokeWidth = 1.6,
}: {
  track: TrackDef;
  accent?: string;
  className?: string;
  strokeWidth?: number;
}) => {
  const id = useId().replace(/:/g, "");
  const preview = useTrackPath(track);
  const color = accent ?? "var(--accent)";
  return (
    <svg viewBox="0 0 100 100" className={`h-full w-full ${className}`} aria-hidden>
      <defs>
        <linearGradient id={`tg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={color} />
          <stop offset="1" stopColor="#e9e5da" />
        </linearGradient>
      </defs>
      <path d={preview.path} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={strokeWidth + 3} strokeLinejoin="round" />
      <path d={preview.path} fill="none" stroke={`url(#tg-${id})`} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <circle cx={preview.start.x} cy={preview.start.y} r="2.1" fill="#f1efe8" />
      <circle cx={preview.start.x} cy={preview.start.y} r="4.2" fill="none" stroke={color} strokeWidth="0.7" opacity="0.7" />
    </svg>
  );
};

export const KeyValue = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex items-center justify-between border-b border-white/[0.06] py-2 last:border-0">
    <span className="section-label !text-[0.52rem]">{label}</span>
    <span className="mono text-[0.75rem] font-semibold text-white">{value}</span>
  </div>
);
