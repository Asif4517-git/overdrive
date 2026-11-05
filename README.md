<div align="center">

# OVERDRIVE

### Real roads. Real machines. Pure driving.

A realistic browser driving game by **Asif** — real production cars, a working gearbox, dynamic weather, six circuits and a fully rebindable control system. No installs, accounts or backend.

[![PLAY LIVE](https://img.shields.io/badge/%E2%96%B6%20PLAY%20LIVE-asif4517--git.github.io%2Foverdrive-2ea44f?style=for-the-badge&logo=googlechrome&logoColor=white)](https://asif4517-git.github.io/overdrive/)
[![SOURCE CODE](https://img.shields.io/badge/SOURCE-GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/asif4517-git/overdrive)
[![DEPLOYED WITH](https://img.shields.io/badge/DEPLOYED%20WITH-GitHub%20Pages-222222?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/asif4517-git/overdrive/actions/workflows/deploy.yml)

**Developer:** [Asif](https://asif4517-git.github.io/) · **Instagram:** [@asif_xrk](https://instagram.com/asif_xrk) · **Email:** [asifsrk4517@gmail.com](mailto:asifsrk4517@gmail.com)

</div>

> ### ▶ [Play OVERDRIVE live](https://asif4517-git.github.io/overdrive/)
> Open the link, wait for the loading screen, then press **Drive Now**. The game runs entirely in the browser. The live URL becomes active once this repository is pushed to GitHub and **Settings → Pages → Source** is set to **GitHub Actions**.

---

## Description

**OVERDRIVE** is a realistic-leaning 3D driving game built for the open web. Choose from eleven production cars, from a Maruti Suzuki Swift to a Ferrari 296 GTB, and drive six hand-built environments: a modern circuit, a tight technical track, a coastal sprint, a Munnar hillclimb, a wet Lonavala ghat road and a night street circuit in Mumbai.

The game models a real drivetrain rather than a single "speed" value: engine torque curves, gear ratios, final drive, wheel radius, aerodynamic drag, rolling resistance, brakes, weight transfer, lateral grip and weather-dependent traction all affect the car. You can drive with an automatic gearbox or a full manual with shift-up and shift-down, road-speed-derived RPM and downshift protection. The HUD reports speed, gear, RPM, fuel, damage, lap and sector times.

Every keyboard binding can be changed in **Settings → Controls**. Touch controls appear automatically on phones and tablets. All progress, lap records and preferences are saved locally in the browser; there is no backend, login, analytics or cloud storage.

**Status:** playable, browser-tested, production build passing. Vehicle bodies are original procedural 3D interpretations with per-model proportions, not licensed or scanned assets. See [Known limitations](#known-limitations).

### Developer

| | |
| --- | --- |
| **Creator / Developer** | **Asif** |
| Portfolio | <https://asif4517-git.github.io/> |
| Instagram | [@asif_xrk](https://instagram.com/asif_xrk) |
| Email | [asifsrk4517@gmail.com](mailto:asifsrk4517@gmail.com) |
| Game | OVERDRIVE — *Real roads. Real machines. Pure driving.* |

These are the only personal details represented. OVERDRIVE is an unofficial, independent project and is not affiliated with, sponsored by or endorsed by any vehicle manufacturer.

[![OVERDRIVE home screen](screenshots/od-01-home.png)](https://asif4517-git.github.io/overdrive/)

---

## Contents

- [Play live](#play-live)
- [Features](#features)
- [Vehicles](#vehicles)
- [Circuits](#circuits)
- [Game modes](#game-modes)
- [Controls](#controls)
- [How the cars and wheels are built](#how-the-cars-and-wheels-are-built)
- [Tech stack](#tech-stack)
- [Run locally](#run-locally)
- [Deploy to GitHub Pages](#deploy-to-github-pages)
- [Project structure](#project-structure)
- [Testing](#testing)
- [Known limitations](#known-limitations)
- [Repository metadata](#repository-metadata)
- [Documentation](#documentation)
- [License](#license)

---

## Play live

**Live demo:** <https://asif4517-git.github.io/overdrive/>

The deployment target assumes the repository is named **`overdrive`** under **`asif4517-git`**. If you rename the repository, update these four places:

1. `src/overdrive/site.ts` — `REPO_NAME`
2. The Play Live and Source badge links at the top of this README
3. `index.html` — `og:url`, `canonical` and the JSON-LD `url`/`sameAs`
4. `GITHUB_PAGES.md`, `REPO_DESCRIPTION.txt` and `working.txt`

The production build is a single self-contained `dist/index.html`, so it works from a project subpath, a user page root or a custom domain without a base-path change.

---

## Features

**Driving and simulation**
- Fixed 60 Hz physics independent of frame rate.
- Engine torque curve, gear ratios, final drive, wheel radius, rolling resistance, aero drag and slope force.
- Automatic and manual transmission, rev limiter, reverse, gear-dependent acceleration, downshift protection.
- Live RPM from road speed and selected gear; tachometer and gear display.
- Weight transfer, speed-sensitive steering, lateral grip, handbrake slides, counter-steer recovery.
- Wet-weather grip loss, puddles, reflections, rain spray and spray particles.
- Off-road grip and drag penalty with dust.
- Wall and car-to-car collision response with sparks, shake and audio.
- Optional mechanical damage, fuel consumption, low-fuel warnings and engine condition.
- Five AI rivals with racing lines, corner-aware speed and rubber-banding.
- Start lights, sector checkpoints, lap timing, standings, finish classification, personal bests.

**Content and interface**
- **11 vehicles** across hatchback, sedan, SUV, off-roader, performance, supercar and rally categories.
- **6 circuits** with distinct surfaces, elevation, weather and time of day.
- **4 modes:** Circuit Race, Time Trial, Sprint and Drift Attack.
- **3D garage viewer:** orbit, zoom and front/side/rear/three-quarter presets.
- Chase, wide chase, hood and right-hand-drive cockpit cameras.
- Dynamic sky, sun, clouds, day/sunset/night lighting, headlights, streetlights and stars.
- Procedural terrain, vegetation, rocks, palms, coast, hills, city blocks, guardrails, kerbs, signs, grandstands and tyre stacks.
- Synthesised engine audio, gear-shift pop, turbo, tyre squeal, wind, rain, impacts, gravel and original music with separate volume buses.
- Responsive layout, touch controls, fullscreen, quality presets and live quality switching.
- Rebindable keys, assists toggle, damage toggle, units, HUD element toggles and reset data.
- Local-only save in `localStorage`.

---

## Vehicles

All eleven cars have individual mass, torque, gear ratios, final drive, redline, grip, steering response and brake power.

| # | Vehicle | Category | Power | Drivetrain | Gearbox |
| --- | --- | --- | ---: | --- | --- |
| 1 | Maruti Suzuki Swift | Indian hatchback | 81 hp | FWD | 5-speed |
| 2 | Honda City | Indian sedan | 121 hp | FWD | 6-speed |
| 3 | Kia Seltos | Compact SUV | 115 hp | FWD | 6-speed |
| 4 | Toyota Fortuner | Full-size SUV | 201 hp | 4WD | 6-speed |
| 5 | Mahindra Thar | Off-roader | 150 hp | 4WD | 6-speed |
| 6 | BMW M3 Competition | Performance sedan | 503 hp | RWD | 8-speed |
| 7 | BMW M5 Competition | Performance sedan | 617 hp | AWD | 8-speed |
| 8 | Porsche 911 GT3 | Sports car | 502 hp | RWD | 7-speed |
| 9 | Nissan GT-R | Performance coupe | 565 hp | AWD | 6-speed |
| 10 | Ferrari 296 GTB | Supercar | 819 hp | RWD | 8-speed |
| 11 | Subaru WRX | Rally sedan | 271 hp | AWD | 6-speed |

The five supplied design references map to the **Swift**, **City**, **Fortuner**, **M3 Competition** and **296 GTB**.

---

## Circuits

| Circuit | Location | Character | Laps |
| --- | --- | --- | ---: |
| Greater Noida Speedway | Uttar Pradesh | Wide modern circuit, long straight | 3 |
| Kari Motor Speedway | Coimbatore | Tight technical national circuit | 4 |
| East Coast Road Sprint | Chennai–Puducherry | Open coastal road, golden hour | 2 |
| Munnar Hillclimb | Idukki, Kerala | Tea-estate climb, heavy elevation, mist | 2 |
| Lonavala Ghat Loop | Maharashtra | Wet monsoon hill road, reduced grip | 2 |
| Mumbai City Sprint | Mumbai | Night street circuit under sodium light | 3 |

Circuit names reference real locations. Layouts and surroundings are original interpretations built for this game, not surveyed or officially licensed reproductions.

---

## Game modes

| Mode | Description | Completion |
| --- | --- | --- |
| **Circuit Race** | Full race distance with five AI rivals, live positions and classification. | Cross the finish line |
| **Time Trial** | Solo running with lap timing and personal bests. | Complete the lap count |
| **Sprint** | One-lap, maximum-commitment event. | Cross the finish line |
| **Drift Attack** | Style run scored on drift angle and sustained slides. | Complete the session |

Best lap times and drift scores are stored per circuit. Wins and event counts are shown in Settings → Data.

---

## Controls

| Action | Default key |
| --- | --- |
| Accelerate | `W` |
| Brake / reverse | `S` |
| Steer left / right | `A` / `D` |
| Handbrake | `Space` |
| Shift up / down (manual) | `E` / `Q` |
| Camera cycle | `C` |
| Headlights | `L` |
| Look back | `B` |
| Reset to road | `R` |
| Pause | `Esc` |

Every binding is rebindable in **Settings → Controls**. Click an action, press a key, and it saves to the browser. Conflict warnings appear below the list. On touch devices, steering, throttle, brake, handbrake and manual shift buttons appear automatically.

---

## How the cars and wheels are built

The five reference renders were inspected before modelling. They define a red hatchback, a silver sedan, a white SUV, a green performance sedan and a red mid-engine supercar.

**Per-vehicle geometry.** `src/overdrive/carDesigns.ts` contains a separate specification for every car: silhouette profile coordinates, cabin and glass shapes, wheelbase, track, wheel radius and width, grille type, headlight type, wheel style and feature flags (roof rails, side steps, spare wheel, splitter, diffuser, wing, carbon roof, hood vents, side intakes). Bodies are extruded from a bevelled silhouette with wheel arches cut mathematically, not made from stacked boxes.

**Glazing and details.** Separate windscreen, rear screen and side window panes; pillars, roof panel, mirrors, door handles, shut lines, arch flares, bumpers, grilles, headlights, daytime running lights, tail lamps, brake lights, reverse lamps, indicators, exhausts and diffusers.

**Wheel hierarchy** (important for future work):

```text
root
└── steer (Group, positioned at ±track/2, wheelRadius, ±wheelbase/2)
    ├── spin (Group — rolling)
    │   ├── tyre  (CylinderGeometry rotated so axle = local X)
    │   ├── rim barrel, rim face, spokes, bolts
    │   └── outer lip
    ├── brake disc   (does not spin)
    └── brake caliper (does not spin)
```

- Front steering rotates `steer.rotation.y` only.
- Rolling rotates `spin.rotation.x` only; `setSpin(angle)` sets `-angle`.
- The tyre's axle is local **X**. Before the rebuild the code rotated the spin group on **Z**, which caused the sideways spinning. Do not reintroduce that.
- Wheel radius is taken from the per-car design and drives both the visual rolling rate (`spin += speed / wheelRadius`) and the gearing/RPM calculation.
- Wheels sit at `track / 2`, which is slightly wider than the body so the tyre is visible inside the arch.

**Garage viewer.** `src/overdrive/ui/VehicleViewer.tsx` renders a live Three.js model with studio lighting, shadows, drag-to-orbit, scroll zoom and four preset angles. The internal model studio is available at **`#models`** on the deployed site.

These models are original procedural interpretations. A photo-exact reconstruction requires authored GLB meshes; the pipeline is ready for that upgrade.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| UI | React 19, TypeScript 5.9 |
| Build | Vite 7, `vite-plugin-singlefile` |
| 3D | Three.js 0.187 |
| Styling | Tailwind CSS 4 + a custom automotive design system |
| Audio | Web Audio API (fully synthesised) |
| State | React state + `localStorage` |
| Testing | TypeScript, Puppeteer (headless Chromium) |
| Hosting | GitHub Pages via GitHub Actions |
| Backend | None |

---

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build:

```bash
npm run build      # -> dist/index.html (single self-contained file)
npm run preview    # http://localhost:4173
```

Open `dist/index.html` directly if preferred. A browser with WebGL2 is required.

---

## Deploy to GitHub Pages

The included workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and publishes the game automatically.

1. Create a **public** repository named `overdrive` at <https://github.com/new> (no README, no .gitignore).
2. From the project folder:

```bash
git init
git add .
git commit -m "OVERDRIVE — realistic browser driving game"
git branch -M main
git remote add origin https://github.com/asif4517-git/overdrive.git
git push -u origin main
```

3. Open **Settings → Pages → Source** and choose **GitHub Actions** (the workflow normally enables it automatically).
4. Watch **Actions → Deploy OVERDRIVE to GitHub Pages** finish, then open **<https://asif4517-git.github.io/overdrive/>**.

Full instructions, custom domains and troubleshooting: **[GITHUB_PAGES.md](GITHUB_PAGES.md)**.

Suggested repository metadata is in **[REPO_DESCRIPTION.txt](REPO_DESCRIPTION.txt)**. A complete handover for another developer or AI agent is in **[working.txt](working.txt)**.

---

## Project structure

```text
.github/workflows/deploy.yml    GitHub Pages build and deploy
public/.nojekyll                Disables Jekyll processing
src/
  App.tsx                       screens, persistence, race configuration
  index.css                     design system, HUD, responsive rules
  overdrive/
    types.ts                    settings, bindings, HUD and race types
    data.ts                     11 cars, 6 circuits, modes, weather
    carDesigns.ts               per-vehicle geometry specifications
    carModel.ts                 procedural bodies, interiors and wheels
    track.ts                    spline roads, kerbs, barriers, signs, wet state
    environment.ts              sky, lighting, terrain, vegetation, city, rain
    engine.ts                   fixed-step driving simulation, gearbox, AI, cameras
    audio.ts                    synthesised engine, effects and music
    site.ts                     GitHub/live URLs and attribution config
    ui/                         Home, Garage, Tracks, Settings, About, Race, Results
    ui/VehicleViewer.tsx        live 3D garage viewer
    ui/ModelStudio.tsx          internal `#models` inspection studio
  game/                         shared utilities and the earlier arcade build
  components/                   shared icons
scripts/                        browser QA scripts (Puppeteer)
docs/                           plan, handbook, testing, master prompt
screenshots/                    browser captures from this build
working.txt                     full handover for the next agent
```

---

## Testing

Verified in headless Chromium with real browser input and a deterministic simulation harness:

- Production build passes; strict TypeScript check passes with zero errors.
- All screens render with no horizontal overflow.
- 11 cars and 6 circuits present in the garage and circuit selectors.
- Key rebinding persists to `localStorage`.
- Manual gearbox and cockpit camera settings propagate into the race configuration.
- Cockpit interior shows in cockpit view and restores the exterior in chase view.
- Headlights, camera cycle and pause overlay work.
- Full Sprint event completes: classification, results screen, personal best saved.
- Wheel mechanics: four wheels, correct axles, correct track, front-only steering, rotation about X only, no Z spin, wheels attached and in ground contact.
- Mobile 390×844: no horizontal overflow, touch controls shown, HUD stays in the viewport.
- Zero console errors in final test runs.

Full evidence: **[docs/TESTING.md](docs/TESTING.md)**.

---

## Known limitations

- AI opponents only; there is no online multiplayer.
- Cars are original procedural 3D interpretations, not licensed or scanned vehicle models. They are recognisable interpretations, not photo-exact replicas.
- Circuits reference real locations but are original layouts, not surveyed reproductions.
- Collision response is arcade-stabilised, not a soft-body damage simulation.
- No pit stops, tyre wear, fuel stations or career economy yet.
- No ghost replay or photo mode.
- Cockpit interiors are simplified and shared in structure; not every car has a unique dashboard.
- Records are local to one browser profile.
- Full multi-lap races were partially validated with the automated harness; the one-lap Sprint event was validated end to end.
- Real-GPU frame rate was not benchmarked. Physics uses a fixed timestep, so low frame rates do not change handling.

---

## Repository metadata

**Suggested “About” description** (paste into the GitHub repository description field):

> Realistic browser driving game by Asif. 11 cars, manual gearbox, weather, 6 circuits and a 3D garage. React + Three.js. Live: https://asif4517-git.github.io/overdrive/ · Portfolio: https://asif4517-git.github.io/ · Instagram @asif_xrk · asifsrk4517@gmail.com

**Website:** `https://asif4517-git.github.io/overdrive/`

**Topics:** `driving-game`, `racing-game`, `threejs`, `react`, `typescript`, `vite`, `webgl`, `github-pages`, `browser-game`, `car-simulator`, `asif4517-git`

A ready-to-run metadata script is provided at `scripts/set-repo-metadata.sh`.

---

## Documentation

| File | Purpose |
| --- | --- |
| [working.txt](working.txt) | Complete handover: architecture, physics, data models, deployment, testing and next steps |
| [GITHUB_PAGES.md](GITHUB_PAGES.md) | Step-by-step Pages deployment and troubleshooting |
| [REPO_DESCRIPTION.txt](REPO_DESCRIPTION.txt) | Copy-paste repository description, topics and `gh` commands |
| [docs/TESTING.md](docs/TESTING.md) | Test matrix, evidence and limitations |
| [docs/GAME_PLATFORM_AND_PHYSICS.txt](docs/GAME_PLATFORM_AND_PHYSICS.txt) | Platform and physics handbook for reuse |
| [docs/NEON_RUSH_PLAN.txt](docs/NEON_RUSH_PLAN.txt) | Original development plan |
| [docs/OVERDRIVE_MASTER_PROMPT.md](docs/OVERDRIVE_MASTER_PROMPT.md) | Master build prompt for a larger sequel |

---

## License

No open-source licence has been chosen for this repository. All original code, models, textures and audio are © Asif. Vehicle names and marques belong to their respective owners and are used only to identify the models that inspired the in-game cars. Add a licence file before redistributing or accepting external contributions.

---

<div align="center">

**Created and developed by Asif**

[Portfolio](https://asif4517-git.github.io/) · [Instagram](https://instagram.com/asif_xrk) · [Email](mailto:asifsrk4517@gmail.com) · [Play live](https://asif4517-git.github.io/overdrive/)

</div>
