import type { CarSpec, ScreenName, TrackDef } from "../game/types";
import { formatTime } from "../game/data";
import { cn } from "../utils/cn";
import { ArrowRight, BoltIcon, ChevronIcon, FlagIcon, GaugeIcon, InstagramIcon, MailIcon, PortfolioIcon, TrophyIcon } from "./Icons";
import { DEVELOPER } from "../game/credits";
import { Button, CAR_IMAGES, GameHeader, StatBar, TrackMap } from "./ui";
import hero from "../assets/hero.jpg";

interface MenuProps {
  car: CarSpec;
  track: TrackDef;
  bestTime: number | null;
  muted: boolean;
  onToggleSound: () => void;
  onNavigate: (screen: ScreenName) => void;
  onStartRace: () => void;
}

export const Menu = ({ car, track, bestTime, muted, onToggleSound, onNavigate, onStartRace }: MenuProps) => (
  <div className="hero-screen scanlines flex flex-col">
    <div className="hero-bg" style={{ backgroundImage: `url(${hero})` }} />
    <div className="hero-grid" />
    <div className="relative z-20">
      <GameHeader
        current="menu"
        onNavigate={onNavigate}
        onSound={onToggleSound}
        muted={muted}
        onRace={onStartRace}
      />
    </div>

    <div className="page-container relative z-10 flex flex-1 flex-col pb-6 pt-7 sm:pt-9">
      <div className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[1fr_360px] lg:gap-14">
        <div className="max-w-2xl">
          <div className="animate-fade-up flex flex-wrap items-center gap-3">
            <span className="badge badge-cyan">
              <span className="h-1 w-1 rounded-full bg-[var(--cyan)] shadow-[0_0_8px_var(--cyan)]" />
              Synthwave arcade racing
            </span>
            <span className="badge">Sector 07 // 23:48</span>
            <button
              onClick={() => onNavigate("about")}
              className="group flex items-center gap-2 border border-white/15 bg-black/35 py-1 pl-1 pr-2.5 backdrop-blur-md transition hover:border-[var(--cyan)]/60 hover:bg-[var(--cyan)]/[0.08]"
              aria-label="Created and developed by Asif — open the About page"
            >
              <span className="grid h-6 w-6 place-items-center bg-[linear-gradient(145deg,rgba(49,244,255,0.3),rgba(255,46,166,0.25))] font-display text-[0.65rem] font-bold uppercase text-white">
                A
              </span>
              <span className="text-left">
                <span className="block font-display text-[0.5rem] uppercase leading-none tracking-[0.18em] text-[var(--muted)]">Created by</span>
                <span className="mt-0.5 block font-display text-[0.68rem] font-bold uppercase leading-none tracking-[0.1em] text-white">Asif</span>
              </span>
              <ArrowRight size={11} className="text-[var(--cyan)] transition group-hover:translate-x-0.5" />
            </button>
          </div>

          <h1 className="display mt-6 text-[clamp(3.4rem,8vw,7.5rem)] uppercase leading-[0.82] tracking-[-0.045em] text-white">
            <span className="block animate-fade-up" style={{ animationDelay: "60ms" }}>
              Own the
            </span>
            <span className="glow-magenta relative block animate-fade-up pb-2 text-[var(--magenta)]" style={{ animationDelay: "140ms" }}>
              Night.
              <span className="absolute -right-8 top-2 hidden rotate-90 text-[0.55rem] font-normal tracking-[0.45em] text-white/35 sm:block lg:-right-16">
                EST. 2087
              </span>
            </span>
          </h1>

          <p className="mt-5 max-w-lg animate-fade-up text-sm leading-relaxed text-[#b6b9d4] sm:text-[0.95rem]" style={{ animationDelay: "220ms" }}>
            Six machines. Three neon circuits. One perfect line. Strap into a 900&nbsp;bhp electric hypercar, thread the
            skyline and paint the city in light.
          </p>

          <div className="mt-7 flex animate-fade-up flex-wrap items-center gap-3" style={{ animationDelay: "300ms" }}>
            <button className="btn btn-primary px-7 py-4 text-[0.88rem]" onClick={onStartRace}>
              <FlagIcon size={17} />
              Start race
              <ArrowRight size={17} />
            </button>
            <Button size="lg" onClick={() => onNavigate("garage")} leading={null}>
              Choose machine
            </Button>
          </div>

          <div className="mt-8 grid max-w-xl animate-fade-up grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-4" style={{ animationDelay: "380ms" }}>
            {[
              { label: "Track", value: track.name, accent: track.accent },
              { label: "Laps", value: `${track.laps.toString().padStart(2, "0")} / grid`, accent: "#eef0ff" },
              { label: "Racers", value: "06 // humans", accent: "#eef0ff" },
              { label: "Your best", value: bestTime ? formatTime(bestTime) : "—:—.———", accent: "#c9ff35" },
            ].map((item) => (
              <div key={item.label} className="bg-[#090a15]/90 px-3.5 py-3 backdrop-blur-md">
                <p className="hud-label !text-[0.5rem]">{item.label}</p>
                <p className="mono mt-1 truncate text-[0.82rem] font-semibold" style={{ color: item.accent }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Developer attribution — visible above the fold on every viewport. */}
          <div className="mt-6 animate-fade-up" style={{ animationDelay: "420ms" }}>
            <div className="flex flex-col gap-3 border border-white/12 bg-[linear-gradient(110deg,rgba(12,15,31,0.92),rgba(8,9,20,0.86))] p-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:p-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="relative grid h-10 w-10 shrink-0 place-items-center border border-[var(--cyan)]/40 bg-[linear-gradient(145deg,rgba(49,244,255,0.18),rgba(255,46,166,0.14))]">
                  <span className="display text-lg uppercase text-white glow-cyan">{DEVELOPER.name.slice(0, 1)}</span>
                  <span className="absolute -bottom-px -right-px h-2 w-2 rotate-45 bg-[var(--lime)]" />
                </span>
                <div className="min-w-0">
                  <p className="hud-label !text-[0.46rem] !text-[var(--cyan)]">Created &amp; developed by</p>
                  <p className="display mt-1 truncate text-[0.95rem] uppercase leading-none text-white sm:text-base">
                    {DEVELOPER.name}
                    <span className="ml-2 font-mono text-[0.5rem] font-normal uppercase tracking-[0.16em] text-[var(--muted)] sm:text-[0.55rem]">
                      {DEVELOPER.role}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:flex-nowrap">
                <a
                  href={DEVELOPER.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1.5 border border-white/12 bg-white/[0.04] px-2.5 py-1.5 transition hover:border-[var(--cyan)]/60 hover:bg-[var(--cyan)]/[0.1]"
                  aria-label="Asif's portfolio (opens in a new tab)"
                >
                  <PortfolioIcon size={12} className="text-[var(--cyan)]" />
                  <span className="font-mono text-[0.55rem] text-white/85 group-hover:text-white">Portfolio</span>
                </a>
                <a
                  href={DEVELOPER.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1.5 border border-white/12 bg-white/[0.04] px-2.5 py-1.5 transition hover:border-[var(--magenta)]/60 hover:bg-[var(--magenta)]/[0.1]"
                  aria-label="Asif's Instagram profile (opens in a new tab)"
                >
                  <InstagramIcon size={12} className="text-[var(--magenta)]" />
                  <span className="font-mono text-[0.55rem] text-white/85 group-hover:text-white">{DEVELOPER.instagramHandle}</span>
                </a>
                <a
                  href={DEVELOPER.emailHref}
                  className="group flex min-w-0 items-center gap-1.5 border border-white/12 bg-white/[0.04] px-2.5 py-1.5 transition hover:border-[var(--lime)]/60 hover:bg-[var(--lime)]/[0.1]"
                  aria-label="Email Asif"
                >
                  <MailIcon size={12} className="text-[var(--lime)]" />
                  <span className="truncate font-mono text-[0.55rem] text-white/85 group-hover:text-white">{DEVELOPER.email}</span>
                </a>
                <button
                  onClick={() => onNavigate("about")}
                  className="btn btn-outline !px-2.5 !py-1.5 !text-[0.5rem]"
                  aria-label="Open the About developer page"
                >
                  About
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-7 hidden animate-fade-up items-center gap-5 text-[0.62rem] text-white/45 sm:flex" style={{ animationDelay: "450ms" }}>
            <span className="flex items-center gap-2">
              <span className="keycap h-6 min-w-6 !text-[0.6rem]">W</span>
              <span className="hud-label !text-[0.5rem]">Accelerate</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="keycap h-6 min-w-6 !text-[0.6rem]">A</span>
              <span className="hud-label !text-[0.5rem]">Steer</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="keycap h-6 min-w-9 !text-[0.58rem]">SHIFT</span>
              <span className="hud-label !text-[0.5rem]">Nitro</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="keycap h-6 min-w-12 !text-[0.55rem]">SPACE</span>
              <span className="hud-label !text-[0.5rem]">Drift</span>
            </span>
          </div>
        </div>

        <aside className="animate-fade-up lg:animate-[fade-up_700ms_cubic-bezier(0.22,1,0.36,1)_0.2s_both]" style={{ "--selection": track.accent } as React.CSSProperties}>
          <div className="panel panel-glow chamfer relative overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rotate-45 bg-[var(--lime)] shadow-[0_0_8px_var(--lime)]" />
                <span className="hud-label">Race briefing</span>
              </div>
              <span className="mono text-[0.62rem] font-semibold tracking-widest" style={{ color: track.accent }}>
                {track.difficulty}
              </span>
            </div>
            <div className="relative h-[196px] overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_50%_50%,rgba(40,50,100,0.45),rgba(4,5,12,0.9))]">
              <div
                className="absolute inset-0 opacity-55"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(100,140,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(100,140,255,.08) 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              />
              <div className="absolute inset-0 p-4">
                <TrackMap track={track} color={track.accent} />
              </div>
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <div>
                  <p className="hud-label !text-[0.48rem]">{track.location}</p>
                  <p className="display mt-1 text-lg uppercase leading-none text-white">{track.name}</p>
                </div>
                <button className="badge badge-cyan transition hover:bg-white/10" onClick={() => onNavigate("circuits")}>
                  Change
                  <ChevronIcon size={11} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-white/10 border-b border-white/10">
              {[
                { icon: <GaugeIcon size={13} />, label: "Length", value: track.lengthLabel },
                { icon: <BoltIcon size={13} />, label: "Turns", value: track.turns.toString().padStart(2, "0") },
                { icon: <FlagIcon size={13} />, label: "Laps", value: track.laps.toString().padStart(2, "0") },
              ].map((stat) => (
                <div key={stat.label} className="px-3 py-2.5">
                  <div className="mb-1 flex items-center gap-1.5 text-[var(--muted)]">
                    {stat.icon}
                    <span className="hud-label !text-[0.45rem]">{stat.label}</span>
                  </div>
                  <p className="mono text-[0.85rem] font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="p-4">
              <p className="hud-label mb-2.5">Selected machine</p>
              <div className="flex items-center gap-3 border border-white/10 bg-white/[0.025] p-2">
                <div className="relative h-14 w-20 shrink-0 overflow-hidden bg-black">
                  <img src={CAR_IMAGES[car.id]} alt={car.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#08090f]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="display truncate text-sm uppercase text-white">{car.name}</p>
                  <p className="mt-0.5 font-mono text-[0.58rem] uppercase tracking-wider text-[var(--muted)]">{car.klass}</p>
                </div>
                <button className="badge !px-2 hover:bg-white/10" onClick={() => onNavigate("garage")} aria-label="Change car">
                  <ChevronIcon size={12} />
                </button>
              </div>
              <div className="mt-4 space-y-2.5">
                <StatBar label="Top speed" value={car.stats.speed} color={car.accentColor} segments />
                <StatBar label="Acceleration" value={car.stats.accel} color={car.accentColor} segments />
                <StatBar label="Cornering" value={car.stats.grip} color={car.accentColor} segments />
              </div>
              <button className="btn btn-primary mt-5 w-full py-3.5" onClick={onStartRace}>
                Ignition
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-auto border-t border-white/10 pt-5">
        <div className="animate-fade-up overflow-hidden border border-white/12 bg-[linear-gradient(110deg,rgba(13,16,32,0.94),rgba(7,8,18,0.9)_60%,rgba(255,46,166,0.07))] backdrop-blur-md" style={{ animationDelay: "500ms" }}>
          <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="relative grid h-14 w-14 shrink-0 place-items-center border border-[var(--cyan)]/35 bg-[linear-gradient(145deg,rgba(49,244,255,0.16),rgba(255,46,166,0.12))] sm:h-16 sm:w-16">
                <span className="display text-2xl uppercase text-white glow-cyan sm:text-3xl">{DEVELOPER.name.slice(0, 1)}</span>
                <span className="absolute -bottom-px -right-px h-2.5 w-2.5 rotate-45 bg-[var(--lime)] shadow-[0_0_10px_var(--lime)]" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="hud-label !text-[0.5rem] !text-[var(--cyan)]">Created &amp; developed by</span>
                  <span className="hidden h-3 w-px bg-white/15 sm:block" />
                  <span className="badge !py-0.5 !text-[0.5rem]">Developer attribution</span>
                </div>
                <p className="display mt-1.5 text-xl uppercase leading-none text-white sm:text-2xl">{DEVELOPER.name}</p>
                <p className="mt-1 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-[var(--muted)] sm:text-[0.6rem]">
                  {DEVELOPER.role} <span className="mx-1.5 text-white/20">/</span> {DEVELOPER.project}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <a
                  href={DEVELOPER.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 border border-white/12 bg-white/[0.03] px-3 py-2 transition hover:border-[var(--cyan)]/55 hover:bg-[var(--cyan)]/[0.08]"
                >
                  <PortfolioIcon size={14} className="text-[var(--cyan)]" />
                  <span className="font-mono text-[0.6rem] tracking-wide text-white/80 group-hover:text-white">Portfolio</span>
                </a>
                <a
                  href={DEVELOPER.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 border border-white/12 bg-white/[0.03] px-3 py-2 transition hover:border-[var(--magenta)]/55 hover:bg-[var(--magenta)]/[0.08]"
                >
                  <InstagramIcon size={14} className="text-[var(--magenta)]" />
                  <span className="font-mono text-[0.6rem] tracking-wide text-white/80 group-hover:text-white">{DEVELOPER.instagramHandle}</span>
                </a>
                <a
                  href={DEVELOPER.emailHref}
                  className="group flex items-center gap-2 border border-white/12 bg-white/[0.03] px-3 py-2 transition hover:border-[var(--lime)]/55 hover:bg-[var(--lime)]/[0.08]"
                >
                  <MailIcon size={14} className="text-[var(--lime)]" />
                  <span className="font-mono text-[0.6rem] tracking-wide text-white/80 group-hover:text-white">{DEVELOPER.email}</span>
                </a>
              </div>
              <button
                onClick={() => onNavigate("about")}
                className="btn btn-outline shrink-0 !px-3.5 !py-2 !text-[0.58rem]"
                aria-label="Open the About developer page"
              >
                About the developer
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-black/20 px-4 py-2 sm:px-5">
            <span className="font-mono text-[0.52rem] uppercase tracking-[0.2em] text-white/30">
              © {new Date().getFullYear()} {DEVELOPER.name} — {DEVELOPER.project}. All rights reserved.
            </span>
            <span className="flex items-center gap-2 text-[0.5rem] uppercase tracking-[0.24em] text-white/30">
              <span className={cn("h-1.5 w-1.5 rounded-full", muted ? "bg-white/20" : "bg-[var(--lime)] shadow-[0_0_8px_var(--lime)]")} />
              {muted ? "Audio off" : "Audio online"}
              <span className="mx-1 h-3 w-px bg-white/15" />
              Build 1.0.7
            </span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-[0.55rem] uppercase tracking-[0.2em] text-white/30">
          <span className="flex items-center gap-2">
            <TrophyIcon size={13} className="text-[var(--lime)]" /> Season 01
          </span>
          <span className="hidden h-3 w-px bg-white/15 sm:block" />
          <span className="hidden sm:block">No downloads · runs in your browser</span>
        </div>
      </div>
    </div>
  </div>
);
