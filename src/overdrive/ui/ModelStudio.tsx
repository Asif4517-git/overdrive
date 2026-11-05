import { useState } from "react";
import type { CarId, Quality } from "../types";
import { CARS } from "../data";
import { CAR_DESIGNS } from "../carDesigns";
import { VehicleViewer } from "./VehicleViewer";
import type { ViewerAngle } from "./VehicleViewer";
import { ArrowLeft, CarIcon } from "../../components/Icons";

/**
 * Internal model studio. Open with #models.
 * Used to inspect every vehicle from four angles during QA.
 */
export const ModelStudio = () => {
  const [carId, setCarId] = useState<CarId>("swift");
  const [angle, setAngle] = useState<ViewerAngle>("threequarter");
  const [quality, setQuality] = useState<Quality>("high");
  const car = CARS.find((item) => item.id === carId) ?? CARS[0];
  const design = CAR_DESIGNS[car.id];

  return (
    <div className="screen">
      <header className="site-header">
        <div className="page-container flex items-center justify-between gap-3 py-3.5">
          <div className="flex items-center gap-3">
            <a href="#" className="btn btn-outline btn-sm">
              <ArrowLeft size={13} /> Back to game
            </a>
            <div>
              <p className="display text-[1.1rem] leading-none text-white">Model studio</p>
              <p className="mt-0.5 font-[var(--font-number)] text-[0.55rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                {CARS.length} vehicles · QA view
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {(["low", "medium", "high"] as Quality[]).map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`border px-2.5 py-1 text-[0.56rem] font-semibold uppercase tracking-[0.08em] ${
                  quality === q ? "border-[var(--accent)] text-white" : "border-[var(--line)] text-[var(--muted)]"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="page-container grid gap-4 py-5 lg:grid-cols-[260px_1fr]">
        <aside className="panel h-fit">
          <div className="panel-header">
            <span className="section-label">Vehicles</span>
            <CarIcon size={14} className="text-[var(--muted)]" />
          </div>
          <div className="max-h-[72vh] overflow-y-auto p-1.5">
            {CARS.map((item) => (
              <button
                key={item.id}
                onClick={() => setCarId(item.id)}
                className="mb-1 flex w-full items-center justify-between border border-transparent px-2.5 py-2 text-left transition hover:bg-white/5"
                style={item.id === car.id ? { borderColor: "var(--accent)", background: "rgba(224,75,42,0.08)" } : undefined}
              >
                <span>
                  <span className="block font-[var(--font-number)] text-[0.52rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                    {item.make}
                  </span>
                  <span className="block text-[0.74rem] font-semibold text-white">{item.model}</span>
                </span>
                <span className="mono text-[0.58rem] text-[var(--muted)]">{item.power} hp</span>
              </button>
            ))}
          </div>
        </aside>
        <section className="flex flex-col gap-3">
          <div className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-3 py-2.5">
              <div>
                <span className="display text-[1.2rem] leading-none text-white">{car.make} {car.model}</span>
                <span className="ml-2 chip chip-muted">{car.category}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(["front", "threequarter", "side", "rear"] as ViewerAngle[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => setAngle(option)}
                    className={`border px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.08em] ${
                      angle === option ? "border-[var(--accent)] bg-[rgba(224,75,42,0.14)] text-white" : "border-[var(--line)] text-[var(--muted)]"
                    }`}
                  >
                    {option === "threequarter" ? "3/4" : option}
                  </button>
                ))}
              </div>
            </div>
            <VehicleViewer key={`${car.id}-${quality}`} car={car} quality={quality} angle={angle} height={520} />
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            {[
              ["Length", `${design.length.toFixed(2)} m`],
              ["Width", `${design.width.toFixed(2)} m`],
              ["Wheelbase", `${design.wheelbase.toFixed(2)} m`],
              ["Wheels", `${design.wheelStyle} · R${Math.round(design.wheelRadius * 1000)}`],
            ].map(([label, value]) => (
              <div key={label} className="panel px-3 py-2">
                <p className="section-label !text-[0.44rem]">{label}</p>
                <p className="mono mt-1 text-[0.74rem] font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
          <p className="text-[0.62rem] leading-relaxed text-[var(--muted)]">
            Every body is generated from a per-model silhouette profile with extruded, bevel-edged panels and cut wheel
            arches. Wheels are separate assemblies: steering pivots on Y at the front axle, rolling is rotation about X on
            each wheel's own axle. Interior, lights, mirrors, handles, shut lines and model-specific features are built
            independently for each vehicle.
          </p>
        </section>
      </main>
    </div>
  );
};
