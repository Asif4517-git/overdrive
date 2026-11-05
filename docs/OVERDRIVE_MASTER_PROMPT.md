# OVERDRIVE — MASTER BUILD PROMPT v2.0
## Real Roads. Real Machines. Pure Driving.

> **How to use this prompt:** start a fresh build session and paste everything below the line. It is self-contained. The build environment must inspect its own capabilities before coding, then work milestone by milestone. The final deliverable is a playable, tested, GitHub Pages–compatible realistic driving game — not a design document, not a menu demo.

---

# 1. MISSION

You are the senior game developer, 3D graphics engineer, vehicle physics programmer, game designer, UI/UX designer, technical artist and software architect responsible for planning, building, testing, optimising and delivering **OVERDRIVE**, a realistic browser-based driving game.

**Tagline:** *Real Roads. Real Machines. Pure Driving.*

Take ownership. Inspect your real tools, make sensible decisions, build a genuinely drivable core first, then expand. Test in a browser. Fix what is broken. Do not stop at planning or at a polished main menu.

This is a **grounded, modern, premium automotive experience** — not cyberpunk, not neon, not science fiction. If a feature is too ambitious, ship a smaller functional version and document the limitation honestly.

---

# 2. NON-NEGOTIABLE ACCEPTANCE BAR

The game is only complete when:

1. A car can be driven convincingly with keyboard, gamepad and touch, with believable acceleration, braking, steering, weight transfer, gear shifts, drifting, surface grip and collisions.
2. At least one realistic environment is fully playable, with no missing assets or placeholder geometry.
3. Every game mode shown in the UI has a complete, working gameplay loop. If a mode is unfinished, remove its entry point until it works.
4. The production build is a static frontend that runs on GitHub Pages from a repository subpath with no backend, no accounts, no API keys and no server.
5. Progress, purchases, builds, records and settings survive reloads via browser-local storage.
6. Desktop runs smoothly at the target frame rate; mobile gets a simplified but playable version.
7. Test evidence exists for the major systems; known bugs and limitations are documented truthfully.
8. The creator attribution is present and accurate.

**Never ship:** fake buttons, fake multiplayer, static screens pretending to be gameplay, cube cars in the final build, copyrighted assets, trademark logos you do not have permission to use, or claims that an untested feature works.

---

# 3. PHASE 0 — INSPECT THE ENVIRONMENT AND PLAN

Before writing gameplay code, determine and report what is actually available:

- File creation and editing; terminal access; Node and npm.
- Vite, TypeScript/JavaScript, Three.js and Rapier installation.
- Local development server and production builds.
- Browser automation, console inspection and screenshots.
- Blender or other 3D authoring tools.
- Legal asset sources (public-domain, CC0, CC-BY) and audio generation.
- GitHub Pages deployment capability.

Produce a short **capability report** with:

| Capability | Available? | How you will use it / alternative |
| --- | --- | --- |
| Terminal + npm | | |
| Three.js + Rapier | | |
| Browser testing + screenshots | | |
| Blender / GLTF pipeline | | |
| Assets + audio | | |
| GitHub Pages build | | |

Then produce a concise architecture decision, milestone plan and risk list. **After that, start building immediately.** Do not spend the session explaining limitations.

---

# 4. PRODUCT IDENTITY AND ART DIRECTION

**Name:** OVERDRIVE
**Tagline:** Real Roads. Real Machines. Pure Driving.

The look must be **realistic, modern, premium, automotive and immersive**.

Research references before modelling:
- Modern automotive photography and premium driving-simulator UI.
- Real Kerala roads, towns, highways, hill roads, backwaters and monsoon conditions.
- Real circuit geometry, kerbs, barriers, pit lanes, grandstands and signage.
- Real car proportions, materials, interiors and lighting.

Visual rules:

- Physically based materials, clearcoat car paint, realistic glass, rubber, chrome, brake discs and road surfaces.
- HDRI environment lighting, ACES tone mapping, natural exposure, restrained bloom and accurate shadows.
- Asphalt with patches, repairs, tyre marks, dust and wet roughness; white/yellow markings; realistic kerbs and runoff.
- Authentic road furniture: signs, bollards, barriers, hazard markers, streetlights, signals, utility poles.
- Indian context researched properly: Malayalam/English signage, KSRTC-style buses, auto-rickshaws, lorries, roadside tea shops, churches, temples, mosques, rubber estates, coconut palms, paddy fields, laterite, backwater bridges.
- A restrained interface palette: graphite/charcoal, off-white, brushed-metal neutrals, one functional accent colour. Clean typography. No rainbow gradients, no gratuitous chrome, no neon.
- Do not use cyberpunk cities, neon grids, sci-fi vehicles or fantasy environments. This is a driving simulator, not an arcade game set in the future.

---

# 5. SCOPE STRATEGY — QUALITY OVER QUANTITY

Do not attempt to build everything at maximum size in one pass. The launch target must be small enough to finish and polished enough to be believable. Structure content in tiers.

## Tier 1 — must ship at full quality

**World:** one connected Kerala region with approximately 45–70 km of drivable road, four connected hubs, seamless free roam, traffic, weather, time of day, fuel stations, garages and event markers.

**Tracks:**
- 3 real-layout circuits: **Buddh International Circuit**, **Monza**, **Silverstone**.
- 2 original realistic Indian circuits: **Munnar High Range Hillclimb** and **Kuttanad Backwater Loop**.
- 1 additional urban street circuit: **Fort Kochi Monsoon Sprint**.
- 1 rally stage: **Munnar Tea Trails**.
- 1 drag strip: **NH44 Airstrip**.
- 1 handling/test pad used by the garage.

**Vehicles:** 12 cars across all required categories, each with a distinct model, interior, handling identity and sound character.

**Modes:** all eight modes functional with a complete loop (see §13).

**Systems:** driving physics, automatic and manual transmission, four cameras, weather/day-night, AI traffic, race AI, garage, tuning, visual customization, dealership, economy, career events, championships, time trial ghosts, local saves, achievements, statistics, full settings, audio and responsive UI.

## Tier 2 — expand only after Tier 1 is solid

- Nürburgring Nordschleife, Mount Panorama, Suzuka, Spa-Francorchamps, Laguna Seca, a fourth Indian circuit.
- Additional original roads: Wayanad Ghat Descent, Marari Coastal Run, Chalakudy Forest Stage, Jaisalmer Dune Rally, Himalayan Pass, Amalfi-inspired coast road, Highland-inspired stage.
- More cars, licensed photographs for showroom art, replay editor, photo mode expansions.

## Tier 3 — planned

- Online multiplayer, user-generated liveries, seasonal events, additional licensed vehicle packs.

**Rule:** if time is limited, deliver fewer cars and fewer tracks at high quality rather than the whole list at low quality. Never reduce quality without documenting it.

---

# 6. TECHNOLOGY AND ARCHITECTURE

## Stack

- **TypeScript** (strict) + **Vite**.
- **Three.js** for rendering.
- **Rapier** for rigid-body collisions.
- **React** (or a small typed component layer) for menus, HUD and settings.
- **Web Audio API** for synthesized vehicle/environment audio, with licensed samples where appropriate.
- **GLTF/GLB + Draco/Meshopt + KTX2** for 3D assets.
- **IndexedDB** (with a thin wrapper) for save data; `localStorage` only for tiny UI preferences.
- **Vitest** (or equivalent) for logic tests; **Playwright/Puppeteer** for browser tests and screenshots.
- No backend. No login. No cloud save. No mandatory network request to start driving.

## Required module boundaries

```
src/
  app/            boot, routing, state composition
  core/           fixed timestep, input, events, math, RNG
  render/         renderer, post-processing, LOD, materials, streaming
  physics/        raycast vehicle, tyres, engine, gearbox, surfaces
  vehicles/       data definitions, visual assembly, wheels, lights, interiors
  world/          road splines, terrain, biomes, props, track builder, streaming
  track/          circuit definitions, checkpoints, pit lane, start grids
  ai/             racing line, overtaking, traffic, pedestrians
  modes/          free roam, circuit, rally, drag, time trial, traffic, career, championship
  garage/         showroom, customization, tuning, dealership, test drive
  progression/    economy, unlocks, achievements, statistics, challenges
  audio/          engine synth, env audio, music, mix buses
  ui/             menus, HUD, settings, controls, accessibility, photo mode
  save/           schema, migrations, validation, import/export
  net/            interfaces only — future multiplayer boundary
```

No 2,000-line monolith. Each car, track and mode is data-driven and independently testable.

## Simulation rules

- Fixed-step physics at 60 Hz; interpolate visuals between steps.
- All tuning values live in typed vehicle/track data files, not scattered magic numbers.
- Vehicle input → physics → vehicle state → camera/render must be separable and serialisable.
- Record ghosts from fixed-step simulation snapshots, not render frames.
- Keep **player state**, **vehicle state**, **race state** and **session state** separate so a future networking layer can be added without a rewrite.

---

# 7. GITHUB PAGES COMPATIBILITY — FROM DAY ONE

The deployed game must work at `https://asif4517-git.github.io/<repo>/` and at a custom domain.

Requirements:

- Configure Vite `base: './'` (or the correct repository base). Test the built file from a subdirectory.
- All assets referenced with relative or base-aware URLs. No hard-coded `/assets/...` paths.
- Use hash routing or state-based navigation. Refreshing any screen must not 404.
- Add `.nojekyll` to the deployed output.
- Provide a GitHub Actions workflow using official Pages actions with `pages: write` and `id-token: write`.
- No secrets, private keys or environment variables required.
- Do not use a build plugin that inlines multi-megabyte GLTF/audio into one file without measuring load time. For an asset-heavy game, use lazy-loaded, hashed files under the base path.
- Keep the first playable load under a reasonable budget on a 20 Mbps connection; show a real loading screen with progress and asset names.
- Test the production build from a repository subpath before delivery.

---

# 8. TRACKS AND ROADS — NEW CONTENT PLAN

This is a core requirement. Build a varied, realistic track roster, not a set of generic ovals. Every track needs a distinct location, surface, elevation profile, corner rhythm and mode.

## 8.1 Real-layout circuits

Reproduce layout and elevation faithfully from official maps, satellite imagery and public onboard references. Record the reference sources in `docs/tracks.md`.

| Circuit | Country | Approx. length | Layout notes | Shipping tier |
| --- | --- | --- | --- | --- |
| Buddh International Circuit | India | ~5.1 km | Long straight, banked multi-apex right, technical stadium section | Tier 1 |
| Monza | Italy | ~5.8 km | High speed, long straights, chicanes, Lesmo, Parabolica | Tier 1 |
| Silverstone | UK | ~5.9 km | Fast flowing, Copse, Maggotts/Becketts, Hangar Straight | Tier 1 |
| Madras Motor Race Track | India | ~3.7 km | Technical Indian circuit, varied corners | Tier 2 |
| Kari Motor Speedway | India | ~2.1 km | Short, tight, kart-like circuit | Tier 2 |
| Nürburgring Nordschleife | Germany | ~20.8 km | Enormous elevation and corner count — only attempt after core tracks are excellent | Tier 2/3 |
| Mount Panorama | Australia | ~6.2 km | Public-road mountain circuit | Tier 2/3 |
| Suzuka | Japan | ~5.8 km | Figure-eight, high commitment | Tier 2/3 |
| Spa-Francorchamps | Belgium | ~7.0 km | Ardennes elevation, Eau Rouge/Raidillon | Tier 2/3 |

**Licensing rule:** circuit layouts and geography may be studied, but names, logos and branding are protected. Use the real name only if you have permission; otherwise use a clearly disclosed label such as “Greater Noida Grand Circuit — unofficial layout study.” Never imply official endorsement. Verify dimensions and corner counts from official/track sources instead of guessing; mark any unverified figures.

Every circuit must include:
- Accurate start/finish, pit lane and grid boxes.
- Elevation, camber, kerbs, run-off, gravel traps, barriers and fences.
- Braking boards, marshal posts, tyre walls, grandstands, control tower and original sponsor boards.
- Realistic surface variation and track furniture.
- AI racing line, sector checkpoints, lap timing and pit/track reset points.
- Three quality levels of scenery, with the racing line never visually compromised.

## 8.2 New original circuits and point-to-point roads (India-first)

| Name | Type | Character | Approx. length | Signature feature |
| --- | --- | --- | --- | --- |
| Munnar High Range Hillclimb | Point-to-point hillclimb | Tea estates, fog, hairpins | ~14 km | 27 numbered hairpins and 700 m elevation gain |
| Kuttanad Backwater Loop | Circuit | Narrow paddy bunds, bridges | ~4.8 km | Three backwater bridges and monsoon standing water |
| Fort Kochi Monsoon Sprint | Street circuit | Colonial streets, coastal road | ~3.4 km | Wet reflective tarmac and tight harbour corners |
| Wayanad Ghat Descent | Downhill point-to-point | Laterite, rainforest, wet leaves | ~11 km | Steep braking zones and blind hairpins |
| Marari Coastal Run | Coastal point-to-point | Fishing villages, palms, sea wall | ~12 km | High-speed sea-wall section |
| Chalakudy Forest Stage | Rally stage | Gravel, logging roads | ~16 km | Crests and loose surface changes |
| Jaisalmer Dune Rally | Rally-raid stage | Sand, dunes | ~18 km | Soft-sand traction and navigation |
| Himalayan High Pass | Alpine point-to-point | Thin air, snow edges, cliffs | ~22 km | Lowest-grip, highest-risk section |
| Amalfi Coast-inspired run | International road | Sea cliffs, villages | ~12 km | Mixed narrow and fast coastal curves |
| Highland-inspired pass | International stage | Moorland, rain, open bends | ~15 km | Weather-dependent grip |

## 8.3 Drag strips

- **NH44 Airstrip** — 1,000 m closed airstrip, 400 m timing, realistic surface; day/night.
- **Santa Pod–inspired dragway** — Tier 2; licensed branding not required; accurate staging and 1/4-mile timing.
- Include a test strip for tuning acceleration and speed runs.

## 8.4 Open-world Kerala — “Kerala Coast & Highlands”

A connected region, not an empty sandbox:

- **Kochi / Fort Kochi:** urban streets, harbour roads, colonial lanes, traffic signals, markets, buses, auto-rickshaws.
- **NH corridor:** limited-access highway with toll-style sections and realistic traffic.
- **Alappuzha / Kuttanad:** narrow rural roads, paddy fields, backwater bridges, village junctions.
- **Munnar foothills:** switchbacks, tea estates, fog, wet patches, viewpoints.
- **Wayanad connection:** forest road and ghat section.
- **Sea route:** Marari–Alleppey coastal road with villages and fishing activity.

World requirements:
- 45–70 km of authored road network, hand-placed landmarks, not random terrain.
- Seamless streaming around the player; no loading screen within the core region.
- Fuel stations, garages, dealerships, event markers, photo spots and fast-travel points.
- Dynamic weather (clear, overcast, monsoon rain, thunderstorm, morning mist) and a 24-hour cycle.
- Traffic and pedestrians following predictable, safe rules; road signage and markings authentic where researched.
- Reference-based, documented locations. Do not claim exact geographic accuracy without comparing to real maps and references. Keep an honesty note in `docs/tracks.md`.

## 8.5 Research and authenticity rule

For every real place or circuit, maintain a reference log: source, date, what was recreated, what was approximated, confidence level. Never present invented roads as exact recreations.

---

# 9. VEHICLES AND LICENSING

## 9.1 Roster

Launch with **12 distinct, high-quality machines**, covering every required category. Prioritise quality over count.

| # | In-game model | Category | Real-world inspiration | Power | Mass | Drivetrain | 0–100 | Top speed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Kite 1.0T | Indian hatchback | Maruti Swift–inspired | ~100 hp | 1,050 kg | FWD | ~10.5 s | ~180 km/h |
| 2 | Vela 1.5 | Indian sedan | Dzire/City–inspired | ~120 hp | 1,180 kg | FWD | ~10.0 s | ~190 km/h |
| 3 | Aster MPV | MPV/family | Ertiga–inspired | ~115 hp | 1,300 kg | FWD | ~12.0 s | ~175 km/h |
| 4 | Nova X | Compact SUV | Seltos–inspired | ~140 hp | 1,500 kg | FWD | ~9.5 s | ~195 km/h |
| 5 | Terra 4x4 | Full-size SUV | Fortuner–inspired | ~200 hp | 2,100 kg | 4WD | ~9.5 s | ~190 km/h |
| 6 | Raven R3 | Sports sedan | BMW M3–inspired | ~480 hp | 1,650 kg | RWD | ~4.1 s | ~290 km/h |
| 7 | Raven R5 | Sports coupe | BMW M4–inspired | ~510 hp | 1,700 kg | RWD | ~3.9 s | ~300 km/h |
| 8 | Raven GT | High-performance sedan | BMW M5/M8–inspired | ~600 hp | 1,850 kg | AWD | ~3.5 s | ~305 km/h |
| 9 | Raven X5 | Performance SUV | BMW X5/X6–inspired | ~400 hp | 2,150 kg | AWD | ~5.6 s | ~250 km/h |
| 10 | Falcon SV | Hypercar | Original | ~1,000 hp | 1,400 kg | AWD | ~2.4 s | ~370 km/h |
| 11 | Dune Raider | Off-roader | Jeep-style original | ~300 hp | 2,200 kg | 4WD | ~7.0 s | ~190 km/h |
| 12 | Rallye R | Rally car | WRC-style original | ~300 hp | 1,230 kg | AWD | ~4.0 s | ~200 km/h |

Add a classic car (e.g. “Heritage 200”, rear-drive) as a Tier 1 bonus if quality permits.

## 9.2 Brand and asset rules

- Preferred: legally licensed, original-quality GLTF vehicle models.
- **No permission = no official badge.** Do not use BMW or other manufacturers’ names, logos or trademarks in the UI or marketing. Use distinct in-game brands with clearly documented inspiration, and state “unofficial / inspired” where appropriate.
- Never claim an unlicensed model is official.
- Keep an `ASSETS.md` manifest with source, author, licence and attribution for every model, texture, HDRI, sound and font.
- Approved sources: original work, public-domain/CC0 assets, CC-BY with correct attribution, or purchased licences. No ripped game assets.
- If a suitable model is unavailable, create a high-quality procedural model with plausible proportions, not a cube. Quality over roster size.

## 9.3 Vehicle asset quality checklist

Every car must have:
- Accurate proportions, wheelbase, track width and ride height.
- Separate wheels and tyres; correct tyre dimensions.
- Exterior details: lights, grille, mirrors, wipers, plates, badges (fictional unless licensed), exhausts.
- Interior: dashboard, steering wheel, seats, gear lever, rear-view mirror, correct cockpit eye point.
- PBR materials; working headlights, tail lights, brake lights, reverse lights, indicators and interior illumination.
- Opening doors/hood only if the animation is finished.
- At least 3 LODs plus a shadow proxy and collision hull.
- Steering-wheel and wheel rotational animation.
- Damage zones, dirt overlay and licence plate swap hooks.
- Vehicle-specific engine, exhaust and interior audio mapping.

---

# 10. DRIVING PHYSICS — SIMCADE, REALISTIC AND READABLE

Build a raycast vehicle on top of Rapier rigid bodies. Physics must feel believable and accessible, not floaty and not punishing for its own sake.

## 10.1 Vehicle model

- Mass, centre of gravity, wheelbase, track, polar inertia and aero balance per car.
- Four suspension raycasts with spring rate, damping, bump stops, travel and anti-roll bars.
- Tyre forces from a simplified Pacejka or brush model: slip angle, slip ratio, load sensitivity, combined-slip and relaxation length.
- Longitudinal forces: engine/brake torque, rolling resistance, drag and downforce.
- Weight transfer under acceleration, braking and cornering.
- Steering geometry: Ackermann influence, steering speed, self-centring and speed-sensitive lock.
- Surface-dependent grip and tyre response.
- Collision response for body, wheels and barriers; wall scrape friction; no tunneling at speed.
- Stuck/reset recovery that does not teleport the player during normal driving.

## 10.2 Surfaces

At minimum: dry asphalt, damp asphalt, wet asphalt, standing water, concrete, kerb, gravel, dirt, mud, grass, sand, snow-edge. Each surface changes grip, rolling resistance, drag, dust/sound and visual response. Rain must reduce grip and braking performance credibly.

## 10.3 Transmission and drivetrain

- Automatic and manual modes.
- Realistic gear ratios, final drive, torque curve, idle, redline, rev limiter and engine braking.
- Manual: gear up/down, clutch assist, rev matching, reverse lockout, no impossible gear changes.
- FWD, RWD and AWD layouts with configurable torque split.
- Open, limited-slip and locked differentials.
- Per-car launch behaviour and traction limits.
- Selectable assists: ABS, traction control, stability control, automatic clutch, braking assist, steering sensitivity. Provide presets: Assisted, Simcade (default), Pro.

## 10.4 Upgrade effects (must affect physics)

Engine, turbo, intake, exhaust, ECU, gearbox, diff, brakes, tyres, suspension, weight reduction and aero changes must alter actual force/torque/geometry values. Display the before/after specs and a controlled test result. An upgrade that only changes a number is a bug.

## 10.5 Damage, dirt and mechanical state

- Visual damage: scratches, dents, broken lights, cracked glass, misaligned panels where feasible.
- Mechanical consequences: reduced engine output, pulling alignment, brake imbalance, broken lights.
- Damage can be disabled completely in settings.
- Dirt accumulation on body and glass; car wash at garage.
- Fuel consumption based on engine load, with refuelling at stations and in the garage.
- Basic engine condition and service costs; do not build an opaque full mechanical simulator in v1.

## 10.6 Physics acceptance tests

Instrument and verify:
- 0–100 km/h within ±0.3 s of each car’s target.
- 100–0 km/h braking distance within a documented realistic range.
- Top speed reached on a sufficient straight without exploiting gears.
- Stable straight-line behaviour; no oscillation or random spin.
- Predictable understeer at the limit; recoverable lift-off oversteer; controllable handbrake slides.
- No wheel clipping through the road at speed or on crests.
- Heavy SUV and MPV do not behave like sports cars.
- Wet and gravel surfaces measurably reduce grip and braking.
- Gamepad, keyboard and touch produce smooth, non-digital steering.
- Fixed-step simulation stable under frame drops; vehicles do not explode on resumption.

---

# 11. CAMERA SYSTEM

Four switchable views, plus replay/photo modes:

1. **Chase** — collision-aware, smooth follow, adjustable distance, no terrain clipping.
2. **Cockpit** — per-car eye point, visible interior, steering wheel animation, mirrors, dashboard readout.
3. **Hood/bonnet** — realistic height and vibration.
4. **Cinematic** — trackside/vehicle-orbit cameras for replays and menus.

Rules:
- Switching views never resets vehicle position, speed or engine state.
- Smooth transitions between modes.
- FOV 55–70 depending on camera; speed effects subtle and toggleable.
- Look-back and free-look where practical.
- Photo mode: pause, free camera, exposure/filters, hide HUD, export screenshot.

---

# 12. GARAGE, SHOWROOM, CUSTOMISATION, DEALERSHIP

Build a real 3D environment, not a static card grid.

- Studio garage with premium lighting, reflective floor and a turntable.
- Player can orbit, inspect, open/close doors where modelled, switch cars, view specs, compare builds and test drive.
- Customisation: paint, finish, rims, tyres, spoilers, bumpers, side skirts, hoods, exhausts, interior trim, gauge styles, race seats, roll cage where appropriate, liveries and number plates.
- Livery editor: base colour, secondary colour, stripes, simple supplied decals; do not require a full free-draw texture editor unless finished.
- Tuning: engine, turbo, gearbox, diff, brakes, tyre compound, suspension, aero, weight reduction.
- Save multiple named builds per car; load, duplicate and delete.
- Dealership: browse, inspect, test drive, compare, purchase with earned currency, own and sell where appropriate.
- Show actual performance changes and a handling radar; never display fake stats.
- Economy must allow free driving without grinding, while career rewards unlock more.

---

# 13. GAME MODES — COMPLETE LOOPS

All eight modes must be functional, with an entry point, rules, completion state, rewards and persistence.

### A. Open-world free roam
Drive the connected Kerala region without mandatory races. Discover roads, hubs, fuel stations, garages, dealerships, events and photo spots. Switch vehicles, weather and time in a world settings panel. Encounter predictable traffic. Save player position and vehicle state. No loading screens while streaming the core region.

### B. Circuit racing
Standing or rolling starts; practice, qualifying optional, race. 8–12 AI opponents, tyre/strategy not required in v1. Live positions, lap timing, sectors, flags where implemented, finish and classification. Grid boxes, pit lane, false-start handling, recovery. Best lap and race records saved per car and circuit.

### C. Rally
Point-to-point stages with surface changes, co-driver pacenotes (text + optional audio), split timing, stage results and service/repair between stages. Dirt, gravel, mud, wet and tarmac must feel different. Rally car setup matters.

### D. Drag racing
Staging, Christmas tree, reaction time, launch control where fitted, manual or automatic, wheelspin, 60 ft / 1/8 mile / 1/4 mile timing and trap speed. Show invalid runs. Save personal bests per car and setup.

### E. Time trials
Solo sessions, sector splits, personal bests, ghost recording and playback (fixed-step snapshots), ghost import/export as a compact local file. Local leaderboards per track/car/setup. No fake online leaderboard.

### F. Traffic driving
Dedicated traffic routes and normal free-roam driving. AI traffic follows lanes, keeps distance, obeys signals and indicator logic; pedestrians stay on footpaths and crossings. No random obstacle spawning in the driving line. Include near-miss/clean-driving scoring only if it is implemented and tested.

### G. Career
A structured sequence of events across categories. Start with accessible cars; earn currency, XP and unlocks; buy and upgrade vehicles; complete driving challenges and championships. A career map or event list with filters. Career progression saved and resumable. Free play always available.

### H. Championships
Multiple rounds, points system, consistent AI fields, standings and final rewards. Race weekends with practice/qualifying where practical. Points tables and tie-break rules documented. Championship state saved.

**Mode quality rule:** if a mode cannot be completed, hide it. A polished free roam, circuit, time trial and career is better than eight broken tiles.

---

# 14. ENVIRONMENT, WEATHER, TRAFFIC AND PEDESTRIANS

- 24-hour day/night cycle with headlights, streetlights, interior lights and realistic exposure adaptation.
- Dynamic weather: clear, overcast, light rain, monsoon downpour, thunderstorm, morning mist. Transitions take time.
- Wet road visuals and physics: darker asphalt, reflections, puddles, spray, wipers, reduced grip, longer braking, aquaplaning in deep water where practical.
- Dirt accumulation and car washes.
- AI traffic: route-based, lane discipline, hazard awareness, signals, buses/lorries/auto-rickshaws; no constant collisions; performance-culled at distance.
- Pedestrians: sidewalks, crossings, safe idle groups; never spawn in the road; predictable.
- Authentic environmental audio: wind, rain, thunder, traffic, horns, birds, crowds, road noise.
- Environmental storytelling through real-world details, not clutter.
- Maintain reference folders for Kerala locations and road furniture. Validate proportions against maps/satellite imagery.
- Keep an honesty note: identify which locations are faithful studies and which are inspired composites.

---

# 15. AUDIO

- Per-vehicle engine sound built from synthesized layers or licensed samples: idle, low load, high load, redline, overrun, exhaust, turbo, transmission whine, blow-off.
- RPM and throttle-responsive; gear-shift and backfire events; different character for hatchback, sedan, MPV, SUV, sports, supercar, rally and classic.
- Interior versus exterior filtering; camera-distance attenuation.
- Tyre and surface audio: asphalt, wet, gravel, dirt, sand, kerb; wind at speed; rain and thunder.
- Collision, scrape, suspension and damage sounds.
- Traffic horns, pedestrians and environment ambience.
- Optional original or licensed music with master/music/SFX controls; no copyrighted music without permission.
- Audio starts only after user interaction; handle suspended contexts; provide mute/resume; cleanly dispose audio on exiting a session.
- Add a mix page with sliders and a test sound button.

---

# 16. UI / UX AND HUD

Design a premium, restrained automotive interface. Consistent spacing, real hierarchy, readable numerals, keyboard and controller navigation, focus states.

Required screens:
- Boot/loading with real progress.
- Main menu with live 3D scene and selected car, not a static background.
- Mode select with descriptions and working entry points.
- World map with hubs, events, filter and player position.
- Garage/showroom, customisation, tuning, dealership.
- Career map, event details, championships and standings.
- Profile: stats, achievements, records, garage value, play time.
- Settings: graphics, audio, controls, assists, HUD, units, accessibility, save management.
- About/Credits.
- Race HUD and pause menu.
- Results/classification and replay/photo mode.

HUD requirements:
- Speed, RPM, gear, fuel, engine condition, minimap, lap/position/time/delta, sector splits, checkpoints, damage, pacenotes in rally, drag timers.
- Configurable layout presets and toggles for individual elements; safe areas for ultrawide and mobile.
- Readable in rain/night; avoid covering the apex or brake markers at speed.
- Pause menu with resume, restart, options, reset to track, quit to menu.
- Accessibility: text scale, contrast, colour-blind-safe indicators, reduced motion, hold vs toggle, steering sensitivity, remappable keys/controller, touch control layout.

No fake buttons. Every interactive element must have a real action. Provide appropriate empty states.

---

# 17. CONTROLS

Keyboard defaults (feel free to add alternatives, document them):

- Accelerate: `W` / `↑`
- Brake/reverse: `S` / `↓`
- Steer: `A` `D` / `←` `→`
- Handbrake: `Space`
- Gear up/down (manual): `Shift` / `Ctrl`
- Clutch (optional): `Left Alt`
- Camera cycle: `C`
- Look back: `B`
- Headlights: `L`
- Wipers: `R`
- Horn: `H`
- Reset to road: `Delete` or documented key
- Pause: `Esc`

Gamepad: analogue steering and triggers, gear buttons, camera, handbrake, pause, full menu navigation, vibration where supported, deadzone/linearity settings.

Touch: configurable steering (wheel or left/right), throttle/brake, handbrake, gear up/down, camera, pause. Large, translucent controls that do not obscure the road. Mobile layout tested.

Controsl menu: remapping, sensitivity, deadzones, toggles, reset to defaults, input-device detection, test feedback.

---

# 18. PERFORMANCE AND PLATFORM BUDGETS

Targets (document actual results):
- Desktop 1080p, 60 fps on a mid-range discrete GPU (GTX 1060/RX 580 class) at High.
- Desktop Integrated/Low: stable 30–60 fps at reduced settings.
- Mobile mid-range: 30 fps target with Low profile, fewer cars/traffic, shorter draw distance, reduced shadows and post effects.
- Physics CPU < 4 ms per step; total frame under 16.7 ms desktop.
- Draw calls < 1,500; visible triangles < 2.5 M; texture memory < 1 GB.
- Assets compressed (Draco/Meshopt/KTX2), LODs with crossfade, instancing for repeated props, occlusion/frustum culling, pooled particles, no per-frame allocations in hot paths.
- Quality presets: Low, Medium, High, Ultra. Settings for resolution scale, shadows, textures, draw distance, anti-aliasing, effects, motion blur, bloom, crowd/traffic density.
- Adaptive resolution optional; frame limiter; pause when tab hidden.
- Loading screen with real progress and no long blank screens.
- Test on a low-end profile, not just maximum quality.

---

# 19. SAVE SYSTEM AND PROGRESSION

Use IndexedDB for the main save, with a versioned schema and migrations. Save:

- Player profile, settings, assists, controls, HUD config.
- Currency, XP, level, career progress, event completion.
- Owned vehicles, tunes, custom builds, paint/livery, installed parts, damage and fuel state.
- Records: best laps, drag times, rally stage times, ghosts (bounded size), achievements, statistics.
- Open-world position and selected vehicle.
- Settings including graphics and audio.

Requirements:
- Validate parsed saves; recover safely from corruption with a user-visible message.
- Export/import save as a JSON file.
- Reset save requires confirmation.
- Autosave at meaningful checkpoints; never mid-physics-step.
- Explain that clearing browser data deletes progress.
- Optional storage persistence request.
- Do not require accounts or a backend.
- Achievements and daily challenges must not fake online connectivity; generate offline from a local date seed and label them clearly as local.

---

# 20. FUTURE MULTIPLAYER — PREPARE, DO NOT IMPLEMENT

Do not build online multiplayer now. Do not add fake lobby or multiplayer UI.

But keep:
- Serializable vehicle state, player state, race state and inputs.
- Fixed tick and deterministic ghost format.
- Command/input abstraction so a network layer can replay inputs.
- Session/race state separated from rendering and UI.
- An interface stub (`net/`) with documented data shapes, not a fake service.

Document this boundary in `docs/ARCHITECTURE.md`.

---

# 21. ASSET AND LICENSING RULES

- Record every asset’s source, author, licence and attribution in `ASSETS.md`.
- Preferred sources: original procedural work, CC0, public domain, CC-BY with attribution, purchased/licensed packs.
- No ripped models, textures, music, logos or trademarks.
- HDRI/lighting from CC0 sources with metadata.
- Fonts must permit web embedding; include licence files.
- Remove unused assets from the production build.
- If a model cannot be legally sourced, model an original equivalent with a distinct name and disclose the inspiration.
- Do not use a real brand’s logo on an unlicensed car. Do not claim endorsement.

---

# 22. TESTING — PROVE IT WORKS

Test the real game, not just the code.

## Automated

- Unit tests: gear logic, engine torque, save migrations/validation, checkpoint ordering, currency transactions, upgrade deltas.
- Integration: boot → select car → drive → pause → results → save → reload.
- Browser: Playwright/Puppeteer with WebGL; console errors asserted empty; screenshots captured for the main screens and a race.
- Simulated telemetry assertions for 0–100, braking, top speed, surface grip and collisions.
- Production build served from a repository subpath and tested there.
- CI workflow building the project on every push.

## Manual / exploratory

- Drive each car category and note handling differences.
- Test every track and mode end-to-end.
- Test automatic and manual gearboxes, all cameras, assists on/off, damage on/off.
- Test weather transitions, wet grip, night headlights, traffic and pedestrians.
- Buy, upgrade, tune, save, reload and verify effects.
- Test gamepad, keyboard, touch (mobile viewport) and control remapping.
- Test pause/restart/quit, finish, retry, records and reset save.
- Test low, medium, high, ultra settings and a low-end profile.
- Check loading, first-run flow, invalid save handling, and browser storage warnings.

## Evidence

Create `docs/TESTING.md` with:
- Environment used.
- Test matrix with pass/fail and notes.
- Screenshots from the real build.
- Performance measurements labelled with hardware/method.
- Console output.
- Bugs found and fixed.
- Remaining bugs and limitations.

**Never claim a feature is tested if it was not.** A menu existing is not proof a mode works.

---

# 23. DELIVERY AND DOCUMENTATION

Deliver:

```
README.md                  setup, controls, features, screenshots, limitations
docs/ARCHITECTURE.md       module map, data flow, save schema, net boundary
docs/TRACKS.md             track roster, reference sources, accuracy notes
docs/PHYSICS.md            vehicle model, tuning, validation results
docs/TESTING.md            test matrix, evidence, known bugs
docs/DEPLOY.md             GitHub Pages deployment in detail
docs/OVERDRIVE_MASTER_PROMPT.md   this prompt
ASSETS.md                  licences and attributions
CHANGELOG.md
.github/workflows/deploy.yml
```

Include a **feature completion report** with honest categories:

1. Fully implemented and tested.
2. Implemented but not fully tested.
3. Partially implemented.
4. Planned / not started.

State limitations plainly: missing assets, approximate locations, simplified physics, cut modes, performance caveats.

---

# 24. CREATOR ATTRIBUTION

Include a professional **About / Credits** screen and a creator line in the README. Use these details exactly:

- **Creator / Developer:** Asif
- **Portfolio:** https://asif4517-git.github.io/
- **Instagram:** @asif_xrk — https://instagram.com/asif_xrk
- **Email:** asifsrk4517@gmail.com

Requirements:
- The home page and About/Credits screen credit Asif as creator/developer.
- Links work and external links open safely (`target="_blank"` with `rel="noopener noreferrer"`).
- Do not invent additional personal details, credentials, achievements or roles.
- Include attribution in page metadata (`author`, `creator`, `description`) and in the README.
- Keep the credit consistent with the premium visual design.

---

# 25. DEVELOPMENT WORKFLOW AND MILESTONE GATES

Work in vertical slices. Each milestone must end with a playable, tested build.

**M0 — Recon and plan**
Capability report; architecture; asset plan; milestone plan; risk register. No endless discussion.

**M1 — Driving vertical slice (gate: must feel good)**
One car, one road, physics, four cameras, HUD, pause, audio stub, keyboard/gamepad/touch. 60 fps target. Test and tune before adding content.

**M2 — Vehicle systems**
5 cars across categories, distinct handling, automatic/manual transmission, audio variation, basics of garage/customisation, loading pipeline and LODs.

**M3 — World slice**
One connected Kerala region section with realistic roads, landmarks, weather, day/night, traffic, fuel/garage points, streaming and performance validation.

**M4 — Track pack**
Tier 1 circuits, hillclimb, backwater loop, street sprint, rally stage and drag strip. Checkpoints, AI, timing, grids, pit/reset.

**M5 — Modes and progression**
All eight modes playable; economy, career, championships, records, achievements, local saves, garage and dealership.

**M6 — Polish**
Lighting, interiors, damage, dirt, rain, audio mix, HUD/UX, accessibility, loading, mobile, quality presets, optimisation.

**M7 — QA and release**
Full automated and browser testing, production build, Pages subpath test, screenshots, docs, completion report, known issues.

**Gate rule:** do not start a new milestone while the previous one has a critical driving or boot bug. Do not trade the core driving experience for menu work.

---

# 26. DEFINITION OF DONE

The delivery is done only if all of the following are true:

- A new player can load the game, understand the controls and drive within one minute.
- Driving feels consistent and believable; different car categories behave differently.
- At least the Tier 1 world, tracks, cars and all eight modes work end-to-end.
- All visible buttons do something real.
- No placeholder assets in the shipping build.
- Gameplay state saves and reloads; upgrades and purchases persist.
- The production build runs from a GitHub Pages subpath with no console errors.
- Performance passes agreed budgets on the target profiles, or limitations are documented.
- `docs/TESTING.md` contains real evidence and honest results.
- About/Credits bears the correct attribution.

---

# 27. FINAL INSTRUCTIONS

1. Start with the environment report, plan and a **playable driving vertical slice**.
2. Prioritise, in order: driving feel → vehicle physics → realistic graphics → garage/vehicle collection → believable open world → working modes → customisation/progression → audio → performance → deployment.
3. Do not let menus consume the time required for the driving model.
4. Do not fake features, assets, licences, test results or performance.
5. When a feature must be cut, cut it visibly, document it, and preserve a polished core.
6. Build, test, profile, fix and continue without waiting for permission.
7. Deliver a game that actually runs on the open web, with a clear path to GitHub Pages.

**Start now.**
