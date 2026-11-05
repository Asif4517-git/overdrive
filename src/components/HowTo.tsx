import type { ScreenName } from "../game/types";
import { ArrowRight, BoltIcon, DriftIcon, FlagIcon, GaugeIcon, InfoIcon } from "./Icons";
import { GameHeader, PageHeading } from "./ui";

interface HowToProps {
  muted: boolean;
  onToggleSound: () => void;
  onNavigate: (screen: ScreenName) => void;
  onStartRace: () => void;
}

const CONTROLS: { keys: string[]; label: string; detail: string; icon: React.ReactNode }[] = [
  { keys: ["W", "↑"], label: "Accelerate", detail: "Electric torque is instant. Squeeze on exit, never mid-corner.", icon: <GaugeIcon size={18} /> },
  { keys: ["S", "↓"], label: "Brake / Reverse", detail: "Brake hard in a straight line. Hold below 5 km/h to reverse.", icon: <FlagIcon size={18} /> },
  { keys: ["A", "D"], label: "Steer", detail: "Progressive steering. The front axle bites harder under power.", icon: <ArrowRight size={18} /> },
  { keys: ["SPACE"], label: "Handbrake / Drift", detail: "Break traction, rotate the rear, catch it with opposite lock.", icon: <DriftIcon size={18} /> },
  { keys: ["SHIFT"], label: "Nitro boost", detail: "Instant overboost. Drifting recharges the bottle much faster.", icon: <BoltIcon size={18} /> },
  { keys: ["ESC"], label: "Pause", detail: "Freeze the clock, adjust audio, restart or return to the city.", icon: <InfoIcon size={18} /> },
];

export const HowTo = ({ muted, onToggleSound, onNavigate, onStartRace }: HowToProps) => (
  <div className="screen scanlines">
    <div className="screen-grid" />
    <div className="relative z-10">
      <GameHeader current="howto" onNavigate={onNavigate} onSound={onToggleSound} muted={muted} onRace={onStartRace} />
      <main className="page-container pb-14 pt-7">
        <PageHeading
          index="04 / 04"
          eyebrow="Driver briefing"
          title={
            <>
              How to <span className="text-[var(--lime)]">hunt</span> an apex
            </>
          }
          description="NEON RUSH is a pick-up-and-play arcade racer with a hidden layer of drift craft. Finish the countdown, send it into turn one and let the nitro do the talking."
          right={
            <button className="btn btn-primary" onClick={onStartRace}>
              Take the grid
              <ArrowRight size={16} />
            </button>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="panel chamfer p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="hud-label">Control protocol</span>
              <span className="mono text-[0.6rem] tracking-widest text-[var(--muted)]">KEYBOARD / TOUCH</span>
            </div>
            <div className="mt-2 divide-y divide-white/[0.06]">
              {CONTROLS.map((control) => (
                <div key={control.label} className="flex items-center gap-3 py-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center border border-white/10 bg-white/[0.03] text-[var(--cyan)]">
                    {control.icon}
                  </span>
                  <div className="w-[92px] shrink-0">
                    <p className="display text-[0.76rem] uppercase text-white">{control.label}</p>
                  </div>
                  <div className="flex min-w-[110px] shrink-0 gap-1">
                    {control.keys.map((key) => (
                      <kbd key={key} className="keycap">
                        {key}
                      </kbd>
                    ))}
                  </div>
                  <p className="hidden flex-1 text-[0.68rem] leading-relaxed text-[var(--muted)] sm:block">{control.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3 border border-white/10 bg-white/[0.02] p-3">
              <span className="badge badge-cyan">C</span>
              <p className="text-[0.68rem] leading-relaxed text-[var(--muted)]">
                Cycle camera: chase / wide chase / bumper. <span className="text-white/75">R</span> repositions your car if you get beached.
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className="panel chamfer p-5">
              <span className="hud-label">The racing line</span>
              <h2 className="display mt-1 text-xl uppercase text-white">Fast is smooth. Smooth is fast.</h2>
              <div className="mt-3 space-y-3 text-[0.74rem] leading-relaxed text-[var(--muted)]">
                <p>
                  <span className="text-[var(--cyan)]">01 / BRAKE:</span> finish all braking before turn-in. The barrier is
                  unforgiving, but a clean kiss of the curb costs almost nothing.
                </p>
                <p>
                  <span className="text-[var(--cyan)]">02 / ROTATE:</span> tap the handbrake to break the rear loose, then apply
                  throttle. The chassis retains its momentum, so the car slides while your nose points at the exit.
                </p>
                <p>
                  <span className="text-[var(--cyan)]">03 / CATCH:</span> counter-steer gently against the slide. Holding drift
                  charges your nitro. Longer, cleaner slides award more style points.
                </p>
                <p>
                  <span className="text-[var(--cyan)]">04 / DEPLOY:</span> only use nitro on straights or to close a gap. It is a
                  limited resource — but drifting refills it.
                </p>
              </div>
            </div>

            <div className="panel chamfer grid grid-cols-2 gap-px overflow-hidden border-white/10 bg-white/10 p-0">
              {[
                ["01", "Two sector gates", "Every lap must pass both checkpoints.", "var(--cyan)"],
                ["02", "Six racers", "Five AI rivals with adaptive pace.", "var(--magenta)"],
                ["03", "Finish top", "Win the race to claim the crown.", "var(--lime)"],
                ["04", "Beat your best", "Records save automatically.", "var(--amber)"],
              ].map(([index, title, copy, color]) => (
                <div key={index as string} className="bg-[#090a15] p-3.5">
                  <span className="mono text-[0.6rem] font-semibold" style={{ color: color as string }}>
                    {index}
                  </span>
                  <p className="display mt-1 text-[0.8rem] uppercase text-white">{title}</p>
                  <p className="mt-1 text-[0.62rem] leading-relaxed text-[var(--muted)]">{copy}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 border border-[var(--lime)]/25 bg-[var(--lime)]/[0.04] p-4">
              <BoltIcon size={20} className="text-[var(--lime)]" />
              <p className="text-[0.7rem] leading-relaxed text-[#cfd8b0]">
                Tip: tap nitro immediately after a clean corner exit. The overboost carries for nearly two seconds — enough
                to steal a place before the next braking zone.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>
);
