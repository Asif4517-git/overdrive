import type { ReactNode } from "react";
import { DEVELOPER } from "../game/credits";
import type { ScreenName } from "../game/types";
import { cn } from "../utils/cn";
import {
  ArrowRight,
  BoltIcon,
  CarIcon,
  CheckIcon,
  FlagIcon,
  FullscreenIcon,
  GaugeIcon,
  MailIcon,
  PortfolioIcon,
  SparkIcon,
} from "./Icons";
import { Button, GameHeader, PageHeading, TrackMap } from "./ui";
import { getTrack } from "../game/data";

interface AboutProps {
  muted: boolean;
  onToggleSound: () => void;
  onNavigate: (screen: ScreenName) => void;
  onStartRace: () => void;
  onOpenSettings: () => void;
}

const ContactCard = ({
  label,
  value,
  href,
  icon,
  accent,
  external = true,
}: {
  label: string;
  value: string;
  href: string;
  icon: ReactNode;
  accent: string;
  external?: boolean;
}) => (
  <a
    href={href}
    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    className="group flex items-center gap-3 border border-white/10 bg-white/[0.02] p-3.5 transition hover:border-white/25 hover:bg-white/[0.05]"
    style={{ borderLeftWidth: "2px", borderLeftColor: accent }}
  >
    <span className="grid h-9 w-9 shrink-0 place-items-center border border-white/10 bg-black/30" style={{ color: accent }}>
      {icon}
    </span>
    <span className="min-w-0 flex-1">
      <span className="hud-label block !text-[0.45rem]">{label}</span>
      <span className="mt-0.5 block truncate font-mono text-[0.74rem] text-white">{value}</span>
    </span>
    <ArrowRight size={14} className="shrink-0 -rotate-45 text-white/25 transition group-hover:text-white" />
  </a>
);

const DidYouKnow = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <div className="flex items-start gap-2">
    <span className="mt-0.5 shrink-0 text-[var(--cyan)]">{icon}</span>
    <p className="text-[0.7rem] leading-relaxed text-[var(--muted)]">{children}</p>
  </div>
);

export const About = ({ muted, onToggleSound, onNavigate, onStartRace, onOpenSettings }: AboutProps) => {
  const track = getTrack("mirage");
  return (
    <div className="screen scanlines">
      <div className="screen-grid" />
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(circle at 80% 8%, rgba(255,46,166,0.14), transparent 42%), radial-gradient(circle at 8% 65%, rgba(49,244,255,0.1), transparent 40%)",
        }}
      />
      <div className="relative z-10">
        <GameHeader current="about" onNavigate={onNavigate} onSound={onToggleSound} muted={muted} onRace={onStartRace} />
        <main className="page-container pb-14 pt-7">
          <PageHeading
            index="ABOUT"
            eyebrow="Developer / credits"
            title={
              <>
                Built by <span className="glow-cyan text-[var(--cyan)]">{DEVELOPER.name}</span>
              </>
            }
            description={`${DEVELOPER.name} is the creator and developer of ${DEVELOPER.project} — this browser-based 3D arcade racing game.`}
            right={
              <a
                href={DEVELOPER.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary hidden sm:inline-flex"
              >
                <PortfolioIcon size={15} />
                View portfolio
                <ArrowRight size={15} />
              </a>
            }
          />

          <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="flex flex-col gap-4">
              <div className="panel chamfer overflow-hidden p-0">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rotate-45 bg-[var(--cyan)] shadow-[0_0_8px_var(--cyan)]" />
                    <span className="hud-label">The developer</span>
                  </div>
                  <span className="badge badge-cyan">{DEVELOPER.role}</span>
                </div>
                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start">
                  <div className="flex h-[86px] w-[86px] shrink-0 items-center justify-center border border-[var(--cyan)]/30 bg-[linear-gradient(145deg,rgba(49,244,255,0.16),rgba(255,46,166,0.14))]">
                    <span className="display text-4xl uppercase text-white glow-cyan">{DEVELOPER.name.slice(0, 1)}</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="display text-3xl uppercase leading-none text-white">{DEVELOPER.name}</h2>
                    <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--cyan)]">{DEVELOPER.role}</p>
                    <p className="mt-3 text-[0.8rem] leading-relaxed text-[#c1c5df]">
                      {DEVELOPER.name} created and developed <span className="text-white">{DEVELOPER.project}</span> — from the
                      arcade driving physics and procedural cars to the neon city, race presentation and synthesised audio.
                    </p>
                    <p className="mt-2 text-[0.7rem] leading-relaxed text-[var(--muted)]">
                      The information on this page is supplied directly by the developer. No other personal details, achievements
                      or credentials are listed.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px border-t border-white/10 bg-white/10 sm:grid-cols-3">
                  {[
                    ["Project", DEVELOPER.project],
                    ["Role", "Creator / Developer"],
                    ["Platform", "WebGL / Browser"],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-[#090a15] px-3 py-2.5">
                      <p className="hud-label !text-[0.44rem]">{label}</p>
                      <p className="mono mt-1 text-[0.7rem] font-semibold text-white/85">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel chamfer p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="hud-label">Contact & links</span>
                  <span className="mono text-[0.55rem] uppercase tracking-[0.18em] text-white/30">Verified details</span>
                </div>
                <div className="mt-3 grid gap-2">
                  <ContactCard
                    label="Portfolio"
                    value={DEVELOPER.portfolioLabel}
                    href={DEVELOPER.portfolio}
                    icon={<PortfolioIcon size={16} />}
                    accent="var(--cyan)"
                  />
                  <ContactCard
                    label="Instagram"
                    value={DEVELOPER.instagramHandle}
                    href={DEVELOPER.instagram}
                    icon={<InstagramIcon size={16} />}
                    accent="var(--magenta)"
                  />
                  <ContactCard
                    label="Email"
                    value={DEVELOPER.email}
                    href={DEVELOPER.emailHref}
                    icon={<MailIcon size={16} />}
                    accent="var(--lime)"
                    external={false}
                  />
                </div>
                <div className="mt-3 sm:hidden">
                  <Button variant="primary" className="w-full" onClick={() => { window.open(DEVELOPER.portfolio, "_blank", "noopener,noreferrer"); }}>
                    Open portfolio
                  </Button>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="panel chamfer relative overflow-hidden p-5">
                <div className="pointer-events-none absolute inset-0 opacity-30">
                  <TrackMap track={track} color={track.accent} showLabels={false} />
                </div>
                <div className="relative">
                  <span className="badge badge-magenta">
                    <FlagIcon size={11} /> About the game
                  </span>
                  <h2 className="display mt-3 text-2xl uppercase leading-none text-white">
                    NEON RUSH
                  </h2>
                  <p className="mt-2 text-[0.78rem] leading-relaxed text-[#b9bdd8]">
                    A synthwave arcade racer set in a neon city after dark. Three circuits, three hypercars, five AI rivals and
                    one perfect line. Drift to recharge nitro, thread the barriers and hunt the top step of the podium.
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden border border-white/10 bg-white/10">
                    {[
                      { icon: <GaugeIcon size={12} />, label: "Circuits", value: "03" },
                      { icon: <CarIcon size={12} />, label: "Cars", value: "03" },
                      { icon: <FlagIcon size={12} />, label: "Rivals", value: "05" },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-[#090a15] px-2.5 py-2">
                        <div className="flex items-center gap-1 text-[var(--muted)]">
                          {stat.icon}
                          <span className="hud-label !text-[0.42rem]">{stat.label}</span>
                        </div>
                        <p className="mono mt-1 text-[0.78rem] font-semibold text-white">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="primary" onClick={onStartRace}>
                      Race now
                      <ArrowRight size={14} />
                    </Button>
                    <Button size="sm" onClick={() => onNavigate("garage")} leading={<CarIcon size={13} />}>
                      Garage
                    </Button>
                    <Button size="sm" onClick={() => onNavigate("circuits")} leading={<FlagIcon size={13} />}>
                      Circuits
                    </Button>
                  </div>
                </div>
              </div>

              <div className="panel chamfer p-5">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <SparkIcon size={15} className="text-[var(--magenta)]" />
                  <span className="hud-label">Built for the browser</span>
                </div>
                <div className="mt-3 space-y-3">
                  <DidYouKnow icon={<BoltIcon size={13} />}>
                    Procedural Three.js world — cars, circuits, city and effects are generated in code.
                  </DidYouKnow>
                  <DidYouKnow icon={<GaugeIcon size={13} />}>
                    Custom arcade physics with momentum-based drifting and a handbrake rotation model.
                  </DidYouKnow>
                  <DidYouKnow icon={<SparkIcon size={13} />}>
                    Synthesised Web Audio engine and synthwave soundtrack — no audio downloads.
                  </DidYouKnow>
                  <DidYouKnow icon={<FullscreenIcon size={13} />}>
                    Responsive interface with keyboard and touch controls, plus three graphics presets.
                  </DidYouKnow>
                </div>
              </div>

              <div className="flex flex-col gap-2 border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center border border-white/10 text-[var(--lime)]">
                    <CheckIcon size={14} />
                  </span>
                  <div>
                    <p className="hud-label text-white">Attribution</p>
                    <p className="mt-0.5 text-[0.65rem] text-[var(--muted)]">
                      {DEVELOPER.project} · created &amp; developed by {DEVELOPER.name}
                    </p>
                  </div>
                </div>
                <button
                  className="btn btn-outline !px-3.5 !py-2 !text-[0.6rem]"
                  onClick={onOpenSettings}
                >
                  Open settings
                  <ArrowRight size={13} />
                </button>
              </div>

              <p className={cn("mono text-center text-[0.55rem] uppercase tracking-[0.22em] text-white/25")}>
                © {new Date().getFullYear()} {DEVELOPER.name} — {DEVELOPER.project}
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

const InstagramIcon = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={className} aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);
