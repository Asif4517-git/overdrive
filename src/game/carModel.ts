import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Quality } from "./types";
import { makeGlowTexture } from "./textures";

export interface WheelVisual {
  steer: THREE.Group;
  spin: THREE.Group;
  front: boolean;
}

export interface CarVisual {
  root: THREE.Group;
  body: THREE.Group;
  wheels: WheelVisual[];
  brakeMaterials: THREE.MeshBasicMaterial[];
  accentMaterial: THREE.MeshBasicMaterial;
  flameGroups: THREE.Group[];
  underglow: THREE.Mesh;
  underglowMaterial: THREE.MeshBasicMaterial;
  setBoost: (amount: number) => void;
  setBrake: (braking: boolean) => void;
  setSteer: (angle: number) => void;
  setSpin: (angle: number) => void;
  setPosition: (position: THREE.Vector3, heading: number) => void;
  dispose: () => void;
}

export interface CarVisualOptions {
  bodyColor: string;
  accentColor: string;
  rimColor: string;
  roof: number;
  spoiler: number;
  quality: Quality;
  isPlayer: boolean;
}

const contactShadowTexture = makeGlowTexture;

export const createCarVisual = (options: CarVisualOptions): CarVisual => {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const track = <T extends THREE.BufferGeometry>(geometry: T): T => {
    geometries.push(geometry);
    return geometry;
  };
  const keep = <T extends THREE.Material>(material: T): T => {
    materials.push(material);
    return material;
  };

  const paint = keep(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(options.bodyColor),
      metalness: 0.52,
      roughness: 0.32,
      clearcoat: 0.7,
      clearcoatRoughness: 0.14,
      envMapIntensity: 0.85,
    })
  );
  const paintDark = keep(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(options.bodyColor).multiplyScalar(0.42),
      metalness: 0.6,
      roughness: 0.38,
      clearcoat: 0.6,
      envMapIntensity: 0.75,
    })
  );
  const carbon = keep(
    new THREE.MeshStandardMaterial({
      color: 0x090b11,
      metalness: 0.65,
      roughness: 0.48,
    })
  );
  const chrome = keep(
    new THREE.MeshStandardMaterial({
      color: 0xbcc8dc,
      metalness: 1,
      roughness: 0.16,
      envMapIntensity: 1.7,
    })
  );
  const rim = keep(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(options.rimColor),
      metalness: 0.85,
      roughness: 0.3,
      envMapIntensity: 1.0,
    })
  );
  const tyre = keep(
    new THREE.MeshStandardMaterial({
      color: 0x08090d,
      metalness: 0.15,
      roughness: 0.92,
    })
  );
  const glass = keep(
    new THREE.MeshPhysicalMaterial({
      color: 0x060d18,
      metalness: 0.9,
      roughness: 0.14,
      transparent: false,
      opacity: 1,
      envMapIntensity: 0.3,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
    })
  );
  const headlightMat = keep(
    new THREE.MeshBasicMaterial({ color: 0x86d8ff, toneMapped: false })
  );
  const accentMaterial = keep(
    new THREE.MeshBasicMaterial({ color: new THREE.Color(options.accentColor), toneMapped: false })
  );
  const redMat = keep(new THREE.MeshBasicMaterial({ color: 0xff1f45, toneMapped: false }));
  const redDim = keep(new THREE.MeshBasicMaterial({ color: 0x5c0a17, toneMapped: false }));
  const brakeMaterials = [redMat, redDim];
  const neonRed = keep(new THREE.MeshBasicMaterial({ color: 0xff365a, toneMapped: false }));
  const exhaustGlow = keep(new THREE.MeshBasicMaterial({ color: 0xff8a3d, toneMapped: false }));

  const addBox = (
    width: number,
    height: number,
    depth: number,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    radius = 0.08,
    parent: THREE.Object3D = body,
    rotation?: [number, number, number]
  ) => {
    const geometry = track(new RoundedBoxGeometry(width, height, depth, 3, Math.min(radius, height / 2.2, width / 2.2, depth / 2.2)));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    parent.add(mesh);
    return mesh;
  };

  // --- Main shell ---------------------------------------------------------
  addBox(1.86, 0.34, 3.95, paint, 0, 0.55, -0.05, 0.14);
  addBox(1.94, 0.3, 1.55, paint, 0, 0.63, -1.42, 0.14);
  addBox(1.68, 0.26, 1.25, paintDark, 0, 0.53, 1.72, 0.15);
  addBox(1.58, 0.12, 0.88, paint, 0, 0.73, 1.5, 0.08);
  addBox(1.32, 0.045, 1.02, carbon, 0, 0.8, 1.22, 0.03);
  addBox(0.08, 0.035, 2.45, accentMaterial, -0.47, 0.795, 0.12, 0.012);
  addBox(0.08, 0.035, 2.45, accentMaterial, 0.47, 0.795, 0.12, 0.012);

  // Hand-built tapered glasshouse — a low, faceted supercar canopy.
  const roofY = 1.14 + options.roof * 0.16;
  const canopy = new THREE.BufferGeometry();
  const hw = 1.5;
  const tw = 1.02;
  const frontZ = 0.78;
  const rearZ = -1.16;
  const topFrontZ = 0.1;
  const topRearZ = -0.82;
  canopy.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        -hw, 0.76, frontZ, hw, 0.76, frontZ,
        -hw - 0.03, 0.78, rearZ, hw + 0.03, 0.78, rearZ,
        -tw, roofY, topFrontZ, tw, roofY, topFrontZ,
        -tw - 0.04, roofY, topRearZ, tw + 0.04, roofY, topRearZ,
      ],
      3
    )
  );
  canopy.setIndex([
    0, 1, 5, 0, 5, 4, // windscreen
    2, 6, 7, 2, 7, 3, // rear glass
    0, 4, 6, 0, 6, 2, // left glazing
    1, 3, 7, 1, 7, 5, // right glazing
    4, 5, 7, 5, 6, 7, // roof
  ]);
  canopy.computeVertexNormals();
  geometries.push(canopy);
  const canopyMesh = new THREE.Mesh(canopy, glass);
  canopyMesh.castShadow = true;
  body.add(canopyMesh);
  // Roof spine and rolled A-pillars.
  addBox(0.78, 0.045, 0.9, paintDark, 0, roofY + 0.015, -0.36, 0.02);
  [-1, 1].forEach((dir) => {
    addBox(0.06, 0.34, 0.07, carbon, dir * 0.7, 0.93, 0.66, 0.02);
    addBox(0.05, 0.05, 1.9, accentMaterial, dir * 0.76, 0.83, -0.3, 0.01);
  });

  // Side profile and vents.
  [-1, 1].forEach((dir) => {
    addBox(0.16, 0.16, 2.55, carbon, dir * 0.97, 0.42, -0.12, 0.04);
    addBox(0.045, 0.045, 2.15, accentMaterial, dir * 1.03, 0.51, -0.1, 0.01);
    addBox(0.1, 0.3, 0.56, carbon, dir * 0.94, 0.7, 0.82, 0.03);
    addBox(0.07, 0.04, 0.9, paintDark, dir * 0.95, 0.79, -1.05, 0.01);
    // Mirrors.
    addBox(0.26, 0.06, 0.06, carbon, dir * 0.95, 1.06 + options.roof * 0.12, 0.7, 0.02);
    addBox(0.2, 0.1, 0.3, paintDark, dir * 1.08, 1.1 + options.roof * 0.12, 0.68, 0.04);
    // Wheel arch lips.
    addBox(0.2, 0.34, 0.94, paintDark, dir * 0.9, 0.75, 1.37, 0.08);
    addBox(0.2, 0.36, 0.98, paintDark, dir * 0.92, 0.77, -1.37, 0.08);
  });

  // Front splitter, intakes and headlamps.
  addBox(1.94, 0.075, 0.58, carbon, 0, 0.31, 1.95, 0.03);
  addBox(0.56, 0.17, 0.1, carbon, 0, 0.44, 2.14, 0.04);
  [-1, 1].forEach((dir) => {
    addBox(0.18, 0.07, 0.44, carbon, dir * 0.82, 0.34, 2.08, 0.02, body, [0, -dir * 0.15, 0]);
    addBox(0.5, 0.075, 0.09, headlightMat, dir * 0.52, 0.65, 2.09, 0.03);
    addBox(0.44, 0.025, 0.04, accentMaterial, dir * 0.53, 0.71, 2.1, 0.01);
    addBox(0.04, 0.16, 0.5, accentMaterial, dir * 0.91, 0.38, 1.66, 0.02);
  });
  addBox(0.92, 0.035, 0.08, accentMaterial, 0, 0.79, 2.08, 0.015);

  // Rear deck, diffuser, lights and exhausts.
  addBox(1.68, 0.05, 0.72, carbon, 0, 0.8, -1.85, 0.03);
  addBox(1.8, 0.18, 0.5, carbon, 0, 0.36, -2.03, 0.05);
  for (let i = 0; i < 5; i += 1) {
    addBox(0.05, 0.2, 0.42, paintDark, -0.6 + i * 0.3, 0.28, -2.06, 0.02);
  }
  addBox(1.46, 0.075, 0.07, redMat, 0, 0.75, -2.19, 0.03);
  [-1, 1].forEach((dir) => {
    addBox(0.09, 0.23, 0.07, neonRed, dir * 0.83, 0.73, -2.16, 0.03);
    addBox(0.12, 0.05, 0.04, accentMaterial, dir * 0.83, 0.58, -2.18, 0.01);
  });
  const exhaustPositions = [-0.58, -0.36, 0.36, 0.58];
  exhaustPositions.forEach((x) => {
    const exhaust = new THREE.Mesh(track(new THREE.CylinderGeometry(0.095, 0.11, 0.32, 14)), chrome);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(x, 0.5, -2.15);
    body.add(exhaust);
    const inner = new THREE.Mesh(track(new THREE.CircleGeometry(0.07, 12)), exhaustGlow);
    inner.position.set(x, 0.5, -2.32);
    inner.rotation.y = Math.PI;
    body.add(inner);
  });

  // Rear wing.
  const wingHeight = 0.98 + options.spoiler * 0.16;
  addBox(0.07, options.spoiler * 0.32, 0.12, carbon, -0.6, wingHeight - 0.05, -1.95, 0.02);
  addBox(0.07, options.spoiler * 0.32, 0.12, carbon, 0.6, wingHeight - 0.05, -1.95, 0.02);
  addBox(1.86, 0.06, 0.4, carbon, 0, wingHeight, -1.98, 0.03, body, [0.08, 0, 0]);
  addBox(1.83, 0.03, 0.06, accentMaterial, 0, wingHeight + 0.01, -2.16, 0.01);
  addBox(1.6, 0.05, 0.05, neonRed, 0, wingHeight + 0.06, -2.0, 0.01);

  // Cockpit silhouette.
  addBox(0.52, 0.16, 0.34, carbon, 0, 0.9, -0.45, 0.06);

  // --- Wheels -------------------------------------------------------------
  const wheels: WheelVisual[] = [];
  const tyreGeo = track(new THREE.CylinderGeometry(0.38, 0.38, 0.33, 26, 1));
  const rimGeo = track(new THREE.CylinderGeometry(0.245, 0.245, 0.345, 24));
  const spokeGeo = track(new THREE.BoxGeometry(0.35, 0.44, 0.07));
  const ringGeo = track(new THREE.TorusGeometry(0.248, 0.022, 6, 30));
  const capGeo = track(new THREE.CylinderGeometry(0.07, 0.07, 0.36, 12));
  const discGeo = track(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 20));
  const caliperGeo = track(new THREE.BoxGeometry(0.07, 0.12, 0.05));

  const wheelPositions: { z: number; front: boolean }[] = [
    { z: 1.37, front: true },
    { z: -1.37, front: false },
  ];
  [-1, 1].forEach((dir) => {
    wheelPositions.forEach(({ z, front }) => {
      const steer = new THREE.Group();
      steer.position.set(dir * 0.94, 0.4, z);
      const spin = new THREE.Group();
      steer.add(spin);
      const tire = new THREE.Mesh(tyreGeo, tyre);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      spin.add(tire);
      const rimMesh = new THREE.Mesh(rimGeo, rim);
      rimMesh.rotation.z = Math.PI / 2;
      spin.add(rimMesh);
      for (let i = 0; i < 4; i += 1) {
        const spoke = new THREE.Mesh(spokeGeo, rim);
        spoke.rotation.x = (i / 4) * Math.PI;
        spin.add(spoke);
      }
      const ring = new THREE.Mesh(ringGeo, chrome);
      ring.rotation.y = Math.PI / 2;
      spin.add(ring);
      const cap = new THREE.Mesh(capGeo, accentMaterial);
      cap.rotation.z = Math.PI / 2;
      spin.add(cap);
      const disc = new THREE.Mesh(discGeo, chrome);
      disc.rotation.z = Math.PI / 2;
      disc.position.x = dir * 0.02;
      spin.add(disc);
      const caliper = new THREE.Mesh(caliperGeo, accentMaterial);
      caliper.position.set(dir * 0.03, -0.14, 0.1);
      spin.add(caliper);
      root.add(steer);
      wheels.push({ steer, spin, front });
    });
  });

  // --- Underglow and contact shadow --------------------------------------
  const underglowMaterial = keep(
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(options.accentColor),
      map: contactShadowTexture(),
      transparent: true,
      opacity: options.isPlayer ? 0.26 : 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    })
  );
  const underglow = new THREE.Mesh(track(new THREE.PlaneGeometry(2.7, 4.4)), underglowMaterial);
  underglow.rotation.x = -Math.PI / 2;
  underglow.position.y = 0.045;
  underglow.renderOrder = 1;
  root.add(underglow);

  // --- Nitro flames -------------------------------------------------------
  const flameGroups: THREE.Group[] = [];
  const flameCore = keep(
    new THREE.MeshBasicMaterial({
      color: 0xd6feff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
  );
  const flameOuter = keep(
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(options.accentColor),
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
  );
  [-0.47, 0.47].forEach((x) => {
    const group = new THREE.Group();
    group.position.set(x, 0.5, -2.3);
    const outer = new THREE.Mesh(track(new THREE.ConeGeometry(0.16, 1.5, 12)), flameOuter);
    outer.rotation.x = -Math.PI / 2;
    outer.position.z = -0.62;
    group.add(outer);
    const core = new THREE.Mesh(track(new THREE.ConeGeometry(0.075, 0.85, 10)), flameCore);
    core.rotation.x = -Math.PI / 2;
    core.position.z = -0.32;
    group.add(core);
    group.scale.setScalar(0.001);
    body.add(group);
    flameGroups.push(group);
  });

  // Headlight beam volumes and a real spotlight for the player.
  if (options.isPlayer) {
    if (options.quality !== "low") {
      const headlight = new THREE.SpotLight(0xbdeeff, 380, 70, 0.5, 0.65, 1.4);
      headlight.position.set(0, 0.7, 2);
      const target = new THREE.Object3D();
      target.position.set(0, 0, 28);
      body.add(target);
      headlight.target = target;
      root.add(headlight);
    }
    const glow = new THREE.PointLight(new THREE.Color(options.accentColor), 7, 8, 2);
    glow.position.set(0, 0.3, -0.4);
    root.add(glow);
  }

  let spinAngle = 0;

  const setBoost = (amount: number) => {
    const boostAmount = THREE.MathUtils.clamp(amount, 0, 1);
    flameGroups.forEach((group, index) => {
      const flicker = 0.85 + Math.sin(performance.now() * 0.04 + index) * 0.2;
      group.scale.setScalar(Math.max(0.001, boostAmount * flicker * (index === 0 ? 1.1 : 0.85)));
    });
    underglowMaterial.opacity = (options.isPlayer ? 0.22 : 0.08) + boostAmount * 0.3;
  };

  const setBrake = (braking: boolean) => {
    brakeMaterials[0].color.setHex(braking ? 0xff5c7a : 0xff1f45);
    brakeMaterials[1].color.setHex(braking ? 0xff2848 : 0x5c0a17);
    redMat.color.setHex(braking ? 0xff8a9c : 0xff1f45);
  };

  const setSteer = (angle: number) => {
    wheels.forEach((wheel) => {
      if (wheel.front) wheel.steer.rotation.y = angle;
    });
  };

  const setSpin = (angle: number) => {
    spinAngle = angle;
    wheels.forEach((wheel) => {
      wheel.spin.rotation.z = spinAngle;
    });
  };

  const setPosition = (position: THREE.Vector3, heading: number) => {
    root.position.set(position.x, position.y, position.z);
    root.rotation.y = heading;
  };

  const dispose = () => {
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => {
      const map = (material as THREE.MeshBasicMaterial).map;
      if (map) map.dispose();
      material.dispose();
    });
  };

  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = child.castShadow || false;
      child.frustumCulled = true;
    }
  });

  return {
    root,
    body,
    wheels,
    brakeMaterials,
    accentMaterial,
    flameGroups,
    underglow,
    underglowMaterial,
    setBoost,
    setBrake,
    setSteer,
    setSpin,
    setPosition,
    dispose,
  };
};
