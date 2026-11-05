import type { ReactNode } from "react";
import type { ScreenName } from "../types";
import { DEVELOPER } from "../../game/credits";
import {
  ArrowRight,
  CameraIcon,
  CarIcon,
  CheckIcon,
  FlagIcon,
  GaugeIcon,
  GearIcon,
  InstagramIcon,
  KeyIcon,
  ExternalLinkIcon,
  GitHubIcon,
  MailIcon,
  PlayCircleIcon,
  PortfolioIcon,
  TrophyIcon,
  WeatherIcon,
} from "../../components/Icons";
import { Footer, Header, SectionTitle } from "./common";
import { LIVE_URL, REPO_URL, SITE } from "../site";

interface AboutProps {
  muted: boolean;
  onNavigate: (screen: ScreenName) => void;
  onSound: () => void;
  onStart: () => void;
}

const Contact = ({
  label,
  value,
  href,
  icon,
  external = true,
}: {
  label: string;
  value: string;
  href: string;
  icon: ReactNode;
  external?: boolean;
}) => (
  <a
    href={href}
    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    className="group flex items-center gap-3 border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-3 transition hover:border-[var(--line-strong)] hover:bg-white/[0.05]"
  >
    <span className="grid h-9 w-9 shrink-0 place-items-center border border-[var(--line)] text-[var(--accent)]">{icon}</span>
    <span className="min-w-0 flex-1">
      <span className="section-label block !text-[0.44rem]">{label}</span>
      <span className="mt-0.5 block truncate font-[var(--font-number)] text-[0.75rem] text-white">{value}</span>
    </span>
    <ArrowRight size={13} className="shrink-0 -rotate-45 text-[var(--muted)] transition group-hover:text-white" />
  </a>
);

const Feature = ({ icon, title, text }: { icon: ReactNode; title: string; text: string }) => (
  <div className="border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-3">
    <span className="text-[var(--accent)]">{icon}</span>
    <p className="mt-2 text-[0.74rem] font-semibold text-white">{title}</p>
    <p className="mt-1 text-[0.64rem] leading-relaxed text-[var(--muted)]">{text}</p>
  </div>
);

export const About = ({ muted, onNavigate, onSound, onStart }: AboutProps) => (
  <div className="screen">
    <Header current="about" muted={muted} onNavigate={onNavigate} onSound={onSound} onRace={onStart} />
    <main className="page-container pb-14 pt-7">
      <SectionTitle
        index="04"
        eyebrow="Credits & project"
        title={
          <>
            Built by <span className="text-[var(--accent)]">{DEVELOPER.name}</span>
          </>
        }
        description={`${DEVELOPER.name} created and developed OVERDRIVE, a browser-based realistic driving game.`}
        right={
          <div className="flex flex-wrap gap-2">
            <a
              href={LIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              title={`Play OVERDRIVE at ${LIVE_URL}`}
            >
              <PlayCircleIcon size={13} /> Play live <ExternalLinkIcon size={11} />
            </a>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
              <GitHubIcon size={13} /> Source
            </a>
            <a href={DEVELOPER.portfolio} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
              <PortfolioIcon size={13} /> Portfolio
            </a>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="panel p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="grid h-20 w-20 shrink-0 place-items-center border border-[var(--line-strong)] bg-[linear-gradient(145deg,#262a2e,#121417)]">
              <span className="display text-[2.4rem] leading-none text-white">{DEVELOPER.name.slice(0, 1)}</span>
            </div>
            <div className="min-w-0">
              <h2 className="display text-[1.8rem] leading-none text-white">{DEVELOPER.name}</h2>
              <p className="mt-1 font-[var(--font-number)] text-[0.62rem] uppercase tracking-[0.2em] text-[var(--accent)]">{DEVELOPER.role}</p>
              <p className="mt-3 text-[0.78rem] leading-relaxed text-[#c5c7c5]">
                {DEVELOPER.name} is the creator and developer of OVERDRIVE. The game was designed, programmed, modelled,
                scored and tested as an independent browser project.
              </p>
              <p className="mt-2 text-[0.68rem] leading-relaxed text-[var(--muted)]">
                Only the contact details supplied by the developer are listed here. No other personal details,
                achievements or credentials are represented.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            <Contact label="Portfolio" value="asif4517-git.github.io" href={DEVELOPER.portfolio} icon={<PortfolioIcon size={15} />} />
            <Contact label="Instagram" value={DEVELOPER.instagramHandle} href={DEVELOPER.instagram} icon={<InstagramIcon size={15} />} />
            <Contact label="Email" value={DEVELOPER.email} href={DEVELOPER.emailHref} icon={<MailIcon size={15} />} external={false} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-px border border-[var(--line)] bg-[var(--line)]">
            {[
              ["Project", "OVERDRIVE"],
              ["Role", "Creator / Developer"],
              ["Platform", "WebGL · browser"],
            ].map(([label, value]) => (
              <div key={label} className="bg-[#111316] px-2.5 py-2">
                <p className="section-label !text-[0.42rem]">{label}</p>
                <p className="mono mt-1 text-[0.68rem] font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 border-l-2 border-[var(--gold)] bg-[rgba(201,164,104,0.06)] px-3 py-2.5">
            <p className="section-label !text-[0.46rem]">Vehicle & location notice</p>
            <p className="mt-1 text-[0.66rem] leading-relaxed text-[var(--muted)]">
              Vehicle names identify real production models for context. OVERDRIVE is an unofficial, independent project
              and is not affiliated with, sponsored by or endorsed by any car manufacturer or motorsport venue. All 3D
              models, textures, road layouts, sounds and music are originally generated in code. Specifications are
              approximate published figures. Circuit names reference real locations; layouts are original interpretations,
              not official reproductions.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="panel p-5">
            <span className="section-label">About the game</span>
            <h3 className="display mt-1 text-[1.7rem] leading-none text-white">Real roads. Real machines. Pure driving.</h3>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-[#c2c4c2]">
              A realistic-leaning browser driving game with a proper gearbox, engine torque model, four cameras,
              changing weather and six varied environments. Drive a Maruti Suzuki Swift, a Toyota Fortuner, a BMW M3
              Competition or a Ferrari 296 GTB — each with its own mass, ratios and grip ceiling.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Feature icon={<GearIcon size={15} />} title="Real gearbox" text="Manual or automatic, torque curve, rev limiter, reverse and engine braking." />
              <Feature icon={<GaugeIcon size={15} />} title="Simcade physics" text="Weight transfer, lateral grip, handbrake slides and off-track surfaces." />
              <Feature icon={<WeatherIcon size={15} />} title="Weather & time" text="Monsoon rain reduces grip and lengthens braking. Night lights the road." />
              <Feature icon={<CameraIcon size={15} />} title="Four cameras" text="Chase, wide, hood and a right-hand-drive cockpit with interior." />
              <Feature icon={<KeyIcon size={15} />} title="Rebindable keys" text="Every action can be mapped to a different key and saved locally." />
              <Feature icon={<CarIcon size={15} />} title="Eleven machines" text="Indian hatchbacks and SUVs, performance cars, rally and supercar." />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip chip-muted"><FlagIcon size={10} /> 6 circuits</span>
              <span className="chip chip-muted"><TrophyIcon size={10} /> Race · time trial · sprint · drift</span>
              <span className="chip chip-muted"><CheckIcon size={10} /> Offline save</span>
            </div>
          </div>

          <div className="panel p-5">
            <span className="section-label">Controls</span>
            <div className="mt-2 grid grid-cols-2 gap-x-4">
              {[
                ["Accelerate", "W"],
                ["Brake / reverse", "S"],
                ["Steer", "A / D"],
                ["Handbrake", "Space"],
                ["Shift up / down", "E / Q"],
                ["Camera", "C"],
                ["Headlights", "L"],
                ["Pause", "Esc"],
              ].map(([action, key]) => (
                <div key={action} className="flex items-center justify-between border-b border-white/[0.06] py-1.5">
                  <span className="text-[0.65rem] text-[var(--muted)]">{action}</span>
                  <span className="keycap">{key}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[0.62rem] leading-relaxed text-[var(--muted)]">
              Every binding can be changed in Settings → Controls. Manual gearbox must be enabled to use the shift keys.
            </p>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
              <span className="section-label">Open source & hosting</span>
              <GitHubIcon size={14} className="text-[var(--muted)]" />
            </div>
            <p className="mt-2 text-[0.7rem] leading-relaxed text-[var(--muted)]">
              OVERDRIVE is a static browser application. The full source is public on GitHub and the playable build is
              published automatically to GitHub Pages by a GitHub Actions workflow on every push to <code className="text-white">main</code>.
            </p>
            <div className="mt-3 grid gap-1.5">
              <a
                href={LIVE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 border border-[var(--line)] px-2.5 py-2 transition hover:border-[var(--line-strong)] hover:bg-white/[0.04]"
              >
                <span className="min-w-0">
                  <span className="section-label block !text-[0.42rem]">Play live</span>
                  <span className="mt-0.5 block truncate font-[var(--font-number)] text-[0.66rem] text-white">{LIVE_URL}</span>
                </span>
                <ExternalLinkIcon size={12} className="shrink-0 text-[var(--accent)]" />
              </a>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 border border-[var(--line)] px-2.5 py-2 transition hover:border-[var(--line-strong)] hover:bg-white/[0.04]"
              >
                <span className="min-w-0">
                  <span className="section-label block !text-[0.42rem]">Source code</span>
                  <span className="mt-0.5 block truncate font-[var(--font-number)] text-[0.66rem] text-white">{REPO_URL}</span>
                </span>
                <ExternalLinkIcon size={12} className="shrink-0 text-[var(--muted)]" />
              </a>
            </div>
            <p className="mt-2 text-[0.6rem] leading-relaxed text-[var(--muted)]">
              Repository: <span className="text-white">{SITE.owner}/{SITE.repo}</span>. No backend, database, API key or
              account is required to play.
            </p>
          </div>

          <div className="panel p-5">
            <span className="section-label">Technology & privacy</span>
            <p className="mt-1.5 text-[0.7rem] leading-relaxed text-[var(--muted)]">
              React, TypeScript, Vite and Three.js. Cars and environments are procedurally modelled and generated at
              runtime; audio is synthesised with the Web Audio API. No backend, account, analytics or cloud storage.
              Progress lives in your browser&apos;s localStorage and can be erased in Settings → Data. Refreshing the page
              is always safe.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn btn-primary btn-sm" onClick={onStart}>
                <FlagIcon size={12} /> Drive now
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => onNavigate("settings")}>
                Settings
              </button>
            </div>
          </div>
        </section>
      </div>
      <p className="mt-4 text-center font-[var(--font-number)] text-[0.58rem] uppercase tracking-[0.2em] text-[var(--muted)]">
        © {new Date().getFullYear()} {DEVELOPER.name} · OVERDRIVE
      </p>
    </main>
    <Footer onNavigate={onNavigate} />
  </div>
);
