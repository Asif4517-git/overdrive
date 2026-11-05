# NEON RUSH — Testing Report

This report covers testing that was actually performed on the delivered build. The environment had no pre-installed browser or Blender. A headless Chromium (Chrome for Testing 148, SwiftShader WebGL2) was installed locally purely for QA, with the required shared libraries extracted into a user-space path. Tests drove the real application through Puppeteer; nothing below is simulated by mocking the game.

## Build & static checks

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | Pass, 0 errors (strict mode, `noUnusedLocals`) |
| `npm run build` | Pass — single-file `dist/index.html`, ~2.53 MB / ~1.40 MB gzip |
| Runtime dependencies | Three.js only (plus React) |
| Dev QA dependencies | `puppeteer` |

## Test inventory (all executed)

| # | Area | Method | Result |
| --- | --- | --- | --- |
| 1 | Menu render / assets | Headless screenshot + DOM audit | 12 buttons, 0 horizontal overflow, fonts `loaded` |
| 2 | Race boot | Start race, inspect engine state | Canvas 1600×900, engine instantiated, HUD present, 11 scene groups |
| 3 | Full race — Neon Mirage | Autopilot simulation of the real engine | 3 laps, 3 checkpoints, finish P1, best lap 30.07 s, results screen |
| 4 | Full race — Midnight Skyway (Spectre X) | Autopilot run | 2 laps, finish P1, 01:10.30, best lap 29.73 s, record persisted |
| 5 | Full race — Chrome Docks (Ronin Evo) | Autopilot run | 3 laps, finish P6, 02:54.53, no crash; AI competitive |
| 6 | Start line / lap semantics | Frame-by-frame lap trace | First crossing opens “LAP 01 OF 3” (no false invalid lap); sectors 1+2 clear; next lap is classified |
| 7 | Drift physics | Deterministic 60 Hz simulation | 41 drift frames, lateral slip peak 24.06 m/s, 100 style points, nitro recharge |
| 8 | Nitro | Simulation + live keyboard | 80 → 62 nitro in 0.75 s of boost, flame scale 1.15, FOV kick, 1.24× speed cap |
| 9 | Braking | Simulation | 50 m/s → 0.3 m/s in one second of braking |
| 10 | Wall collision | Forced outward impact | Car contained at offset 6.72 (half-width 7.75), camera shake 0.53, no tunnelling |
| 11 | Car collision | Circle proximity resolve | Separation and speed transfer observed during autopilot races |
| 12 | Camera modes | Programmatic mode cycling | chase 8.61 m / far 13.26 m / bumper 1.28 m follow distance, FOV 62→67 |
| 13 | Real-time clock | Live browser test | Game clock advanced and countdown completed with fixed-step simulation; acceleration reached 97 km/h under live `W` input |
| 14 | Pause / resume | Real `Escape` key + menu buttons | `.pause-scrim` visible, `paused = true`, resume sets false; options panel opens |
| 15 | Live quality | Click low/medium/high in pause | low: bloom off + shadows off; medium & high: bloom on; persisted to localStorage |
| 16 | Touch controls | Mobile viewport pointer events | GAS press added `KeyW`, release removed it; `.touch-controls` displayed flex |
| 17 | Mobile layout | 390×844, DPR 2 audit | No horizontal overflow; zero HUD panel overlaps (5 visible panels); canvas present |
| 18 | Audio | Inspect AudioContext after gesture | Context `running`, 3 engine oscillators active, music sequencer running |
| 19 | Persistence | Read localStorage after finish | `bestTimes.skyway`, `wins`, `races` written; settings saved |
| 20 | Console health | Error and pageerror listeners | 0 errors in final menu, race, results, quality, mobile and full-race runs |

## Bugs found by testing and fixed

1. **Velocity was rotated with the chassis** — lateral slip could never build, so drifting was impossible. Fixed by conserving world velocity and rotating the chassis around it. Drift now verified.
2. **Simulation bound to render rate** — under slow software rendering the countdown barely advanced. Fixed with a fixed 60 Hz accumulator; game time now tracks real time and handling is deterministic.
3. **Unbound resize handler** — `clientWidth` of undefined raised a runtime error on resize. Converted to a bound arrow.
4. **False “lap invalid” on race start** — the grid sits behind the start line. Added a `crossedLine` state so the first crossing opens lap one, with the progress update preserved to prevent a duplicate trigger.
5. **Visible headlight cone geometry** — translucent cone volumes washed out the view. Removed in favour of a real spotlight.
6. **Oversized kerbs / overexposure** — narrowed kerbs, darkened tarmac, reduced environment intensity and bloom, tuned exposure.
7. **Start camera inside the gantry** — re-framed the countdown orbit and added portrait aspect compensation.
8. **Results side panel clipped** in one capture — removed the delayed entrance animation from the two-column layout and re-verified (panel 567×554 px with all 6 rows).

## Visual evidence

All captures are from the delivered build in headless Chromium (`artifacts/`):

- `01-main-menu.png` — storefront
- `02-garage.png` — car selection
- `03-circuits.png` — circuit selection
- `04-countdown.png` — race start framing / start lights
- `05-race-boost.png` — nitro, HUD, standings and minimap
- `06-race-drift.png` — drift state
- `07-pause.png` — pause / options
- `08-results.png` — classification and telemetry
- `09-mobile-menu.png` — responsive menu
- `10-mobile-race.png` / `mobile-hud-final.png` — mobile HUD and touch controls

## Reproducing the tests

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173

# in another terminal, with a Chrome/Chromium available to Puppeteer:
node scripts/test-game.mjs      # end-to-end race + results
node scripts/lap-test.mjs       # lap semantics + mobile layout
node scripts/live-test.mjs      # real keyboard clock/input/audio
node scripts/dynamics-test.mjs  # boost, drift, braking, collisions
node scripts/final-qa.mjs       # tracks, quality, touch, persistence
```

In this environment Chromium needed user-space shared libraries; they were extracted into `/tmp/chromelibs` and `LD_LIBRARY_PATH` was set before running. On a normal desktop with Chrome installed, no such workaround is required.

## Limitations of this testing

- The browser ran software WebGL. Frame rate numbers are therefore not meaningful as desktop hardware benchmarks; visuals (especially bloom and shadows) may differ on real GPUs.
- Automated driving used a deterministic autopilot rather than human feel testing. Handling parameters were tuned from physics assertions and visual inspection, not large-scale playtests.
- No Safari/Firefox or physical touch-device test was possible in this environment; responsive layout and pointer events were verified in Chromium emulation.
- No online services are used, so network failure modes are limited to the Google Fonts request (fallbacks declared).


---

# OVERDRIVE UPDATE — TEST REPORT

Tested after replacing the arcade theme with the realistic build.

| Area | Method | Result |
| --- | --- | --- |
| Build | `npm run build` | Pass, single-file 2.68 MB |
| Type safety | `tsc --noEmit` strict | 0 errors |
| Home / Garage / Circuits / Settings / About | Headless Chromium screenshots + DOM assertions | Pass, 11 cars, 6 circuits, no horizontal overflow |
| Key rebinding | Click Accelerate binding, press ArrowUp, read localStorage | Persisted `ArrowUp` |
| Transmission / camera settings | Set manual + cockpit, start event, inspect engine config | Applied to race session |
| Cockpit view | Inspect player visual visibility state | Interior visible, exterior hidden; chase restores body |
| Headlights / camera cycle / pause | Real key presses | All passed, pause overlay visible |
| Sprint event | 1 lap with AI, `debugFastForward` on real physics | Finished 2nd, results rendered, personal best saved |
| Time trial / drift / circuit modes | Mode selection + configuration verified | Configured and playable; full-length races exceed headless test window |
| Weather | Rain applied | Wet surfaces, reduced grip config present |
| Damage / fuel | Inspect HUD and physics state | Both track correctly; damage optional |
| Mobile 390x844 | Emulated phone | No overflow, touch controls flex, HUD inside viewport |
| Console | Error/pageerror listeners | 0 errors |

Known issues found and fixed during this phase:
1. Cockpit steering wheel was too close to the camera -> camera pulled back/up, wheel reduced and lowered.
2. Key-rebind test appeared to fail because the test pressed the old throttle key -> test corrected; bindings themselves were correct.
3. Autopilot test harness crawled off-road -> proportional braking and stuck-recovery added.
4. AI lap counting awarded a lap on the formation crossing -> added explicit start-line crossing state.

Remaining limitations: full 2–3 lap races with the automated harness exceeded the headless execution window due to software rendering; the Sprint event was validated end-to-end instead. Real-GPU frame rate was not measured.


---

# VEHICLE REBUILD — REFERENCE-FIRST TEST

The five supplied renders were opened and inspected before modelling. They specify:
1. red Swift-style hatchback, 2. silver City-style sedan, 3. white Fortuner-style SUV,
4. green M3 Competition-style performance sedan, 5. red 296 GTB-style mid-engine supercar.

## Changes
- New `carDesigns.ts`: per-vehicle silhouette profiles (nose→tail coordinates), cabin dimensions,
  glass polygons, wheelbase, track, wheel radius/width, grille/headlight/taillight/wheel types,
  model-specific feature flags and cockpit eye point. All 11 vehicles use different data.
- New body construction: extruded, bevel-edged silhouette with mathematically cut wheel arches,
  separate curved cabin, side glazing placed outside the shell, windscreen, rear screen,
  roof panel, pillars, mirrors, handles, shut lines, arch flares, front/rear bumpers.
- Wheels rebuilt: four separate assemblies. Steering pivot is a Y-rotation group at the front axle.
  The tyre mesh is rotated so its axle is local X and rolling is rotation about X only.
  Brake disc and caliper are attached to the upright, not the spinning wheel.
- Wheel radius now drives both the rolling rate (`spin += forwardSpeed / wheelRadius`) and the
  gear/RPM calculation, instead of hard-coded body-style values.
- New 3D garage viewer with drag orbit, scroll zoom and front/side/rear/three-quarter presets.
- Internal model studio at `#models` for per-vehicle inspection.

## Wheel assertions (headless Chromium, live gameplay)

| Check | Result |
| --- | --- |
| Four wheel assemblies | Pass |
| All wheels attached to the vehicle root | Pass |
| Two front / two rear | Pass |
| Wheel centre height equals tyre radius (ground contact) | Pass |
| Front axle at +wheelbase/2, rear at −wheelbase/2 | Pass |
| Track width consistent left/right | Pass |
| Front wheels steer on Y | Pass |
| Rear wheels do not steer | Pass |
| Rolling rotation is about local X | Pass |
| No rotation about Z (the previous sideways-spin bug) | Pass |
| Spin angle changes with vehicle speed | Pass |
| Console errors | 0 |

## Remaining limitation (stated honestly)

The models are now individually proportioned, arch-cut, glazed procedural meshes with distinct
silhouettes, grilles, lights and features. They are **recognisable class/model interpretations**, not
photoreal replicas of the reference renders, and not licensed CAD or scanned meshes. Producing a
true photo-matched reconstruction requires proper vehicle mesh assets authored in Blender, which is
not available in this environment. The geometry pipeline is ready to accept GLB meshes per car if
licensed or authored models are later supplied.


---

# GITHUB HOSTING & METADATA VERIFICATION

Performed on the production build (`dist/index.html`), served at the site root
and at a simulated GitHub Pages subpath `/overdrive/`.

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | Pass, 0 errors |
| `npm run build` | Pass, single-file build |
| Workflow YAML parses | Pass — `Deploy OVERDRIVE to GitHub Pages`, jobs `build` + `deploy`, 8 build steps, `contents: read`, `pages: write`, `id-token: write` |
| Workflow triggers | Pass — `push` to `main` and `workflow_dispatch` |
| `index.html` author/creator/developer | Pass — Asif |
| Canonical, `og:url` and JSON-LD URL | Pass — `https://asif4517-git.github.io/overdrive/` |
| JSON-LD author | Pass — Asif, portfolio URL, email, Instagram |
| Header GitHub link | Pass — exact repo URL, `target`, `rel="noopener noreferrer"` |
| Footer Play Live and Source | Pass — exact live and repo URLs, safe rel |
| About page Play Live/Source/portfolio/Instagram/email | Pass — all present and exact |
| Unsafe external links on About | Pass — none missing `noopener` |
| Settings → Data & about attribution | Pass — name and all three contact links |
| Mobile 390×844 | Pass — no horizontal overflow, GitHub link present, footer links present, scrollable |
| `#models` studio | Pass — 11 car buttons, canvas, no overflow |
| Production build from `/overdrive/` subpath | Pass — game booted, canvas and HUD created, zero page errors |
| Repository description / topics file | Pass — `REPO_DESCRIPTION.txt` present, description 258 characters (limit 350) |
| Metadata helper script | Pass — `bash -n scripts/set-repo-metadata.sh` |

**Not performed:** the actual GitHub repository creation and Pages deployment.
This environment has no GitHub account access or credentials, so the workflow has
not been run on GitHub here. The live URL is the intended target and must be
confirmed after the first push.
