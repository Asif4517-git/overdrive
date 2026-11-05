import * as THREE from "three";
import type { TrackDef } from "./types";
import {
  makeBillboardTexture,
  makeCheckerTexture,
  makeCurbTexture,
  makeRoadTexture,
} from "./textures";

export interface TrackSample {
  pos: THREE.Vector3;
  tangent: THREE.Vector3;
  side: THREE.Vector3;
  distance: number;
  curvature: number;
}

export interface TrackModel {
  def: TrackDef;
  group: THREE.Group;
  samples: TrackSample[];
  length: number;
  width: number;
  halfWidth: number;
  minimap: { x: number; y: number }[];
  gateProgress: number[];
  startPos: THREE.Vector3;
  startHeading: number;
  nearestIndex: (position: THREE.Vector3, hint?: number) => number;
  sampleAt: (progress: number) => TrackSample;
  progressAt: (index: number) => number;
}

const UP = new THREE.Vector3(0, 1, 0);

const buildControlPoints = (def: TrackDef): THREE.Vector3[] => {
  const points: THREE.Vector3[] = [];
  const segments = 44;
  for (let i = 0; i < segments; i += 1) {
    const a = (i / segments) * Math.PI * 2;
    const radius =
      1 +
      def.harmonicA * Math.sin(3 * a + 0.55) +
      def.harmonicB * Math.cos(5 * a + 1.6) +
      def.harmonicB * 0.4 * Math.sin(7 * a - 0.4);
    const x = Math.cos(a) * def.rx * radius;
    const z = Math.sin(a) * def.rz * radius;
    const y = 1.8 + def.elevation * (0.5 + 0.5 * Math.sin(2 * a + 0.7));
    points.push(new THREE.Vector3(x, y, z));
  }
  return points;
};

const makeRibbon = (
  samples: TrackSample[],
  leftOffset: number,
  rightOffset: number,
  yOffset: number,
  vScale: number,
  doubleSided = false
): THREE.BufferGeometry => {
  const count = samples.length;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= count; i += 1) {
    const s = samples[i % count];
    const along = i === count ? samples[count - 1].distance + 2 : s.distance;
    const a = s.pos.clone().addScaledVector(s.side, leftOffset);
    const b = s.pos.clone().addScaledVector(s.side, rightOffset);
    positions.push(a.x, a.y + yOffset, a.z, b.x, b.y + yOffset, b.z);
    uvs.push(0, along / vScale, 1, along / vScale);
    if (i < count) {
      const base = i * 2;
      if (doubleSided) {
        indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
        indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
      } else {
        indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
};

const makeVerticalRibbon = (
  samples: TrackSample[],
  offset: number,
  low: number,
  high: number,
  vScale: number
): THREE.BufferGeometry => {
  const count = samples.length;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= count; i += 1) {
    const s = samples[i % count];
    const along = i === count ? samples[count - 1].distance + 2 : s.distance;
    const p = s.pos.clone().addScaledVector(s.side, offset);
    positions.push(p.x, p.y + low, p.z, p.x, p.y + high, p.z);
    uvs.push(along / vScale, 0, along / vScale, 1);
    if (i < count) {
      const base = i * 2;
      indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
};

const buildGate = (
  track: TrackSample,
  width: number,
  accent: string,
  start: boolean,
  label: string,
  subtitle: string
) => {
  const group = new THREE.Group();
  const heading = Math.atan2(track.tangent.x, track.tangent.z);
  group.position.copy(track.pos);
  group.rotation.y = heading;

  const metal = new THREE.MeshStandardMaterial({
    color: 0x11131f,
    metalness: 0.85,
    roughness: 0.32,
  });
  const glow = new THREE.MeshBasicMaterial({ color: accent, toneMapped: false });
  const steel = new THREE.MeshStandardMaterial({
    color: 0x3a4258,
    metalness: 0.9,
    roughness: 0.25,
  });

  const pillarGeometry = new THREE.BoxGeometry(0.65, 6.8, 0.65);
  const innerGlow = new THREE.BoxGeometry(0.1, 6.1, 0.78);
  const edge = width / 2 + 1.35;
  [-1, 1].forEach((dir) => {
    const pillar = new THREE.Mesh(pillarGeometry, metal);
    pillar.position.set(dir * edge, 3.4, 0);
    group.add(pillar);
    const strip = new THREE.Mesh(innerGlow, glow);
    strip.position.set(dir * (edge - 0.34), 3.2, 0);
    group.add(strip);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 1.4), steel);
    foot.position.set(dir * edge, 0.16, 0);
    group.add(foot);
  });

  const beam = new THREE.Mesh(new THREE.BoxGeometry(edge * 2 + 0.7, 0.72, 0.8), metal);
  beam.position.set(0, 6.55, 0);
  group.add(beam);
  const beamGlow = new THREE.Mesh(new THREE.BoxGeometry(edge * 2 + 0.7, 0.07, 0.86), glow);
  beamGlow.position.set(0, 6.16, 0);
  group.add(beamGlow);
  const upperGlow = new THREE.Mesh(new THREE.BoxGeometry(edge * 2 + 0.7, 0.04, 0.2), glow);
  upperGlow.position.set(0, 6.93, 0);
  group.add(upperGlow);

  if (start) {
    const signTexture = makeBillboardTexture("NEON RUSH", subtitle, accent, "#ff2ea6", 4);
    const signMaterial = new THREE.MeshBasicMaterial({
      map: signTexture,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(13, width * 0.65), 3.2), signMaterial);
    sign.position.set(0, 4.85, 0);
    group.add(sign);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(13, width * 0.65), 3.2), signMaterial);
    back.position.set(0, 4.85, -0.08);
    back.rotation.y = Math.PI;
    group.add(back);
    const light = new THREE.PointLight(new THREE.Color(accent), 60, 34, 2);
    light.position.set(0, 4.8, 0);
    group.add(light);
  } else {
    const texture = makeBillboardTexture(label, subtitle, accent, "#ffffff", 9);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.min(8.4, width * 0.5), 2.4),
      new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        toneMapped: false,
      })
    );
    sign.position.set(0, 5.0, 0);
    group.add(sign);
  }
  return group;
};

export const createTrack = (def: TrackDef): TrackModel => {
  const group = new THREE.Group();
  group.name = `track-${def.id}`;
  const points = buildControlPoints(def);
  const curve = new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.35);
  const length = curve.getLength();
  const count = Math.max(320, Math.round(length / 2.1));
  const samples: TrackSample[] = [];
  for (let i = 0; i < count; i += 1) {
    const t = i / count;
    const pos = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const side = new THREE.Vector3().crossVectors(tangent, UP).normalize();
    samples.push({
      pos,
      tangent,
      side,
      distance: t * length,
      curvature: 0,
    });
  }
  const curvatureSpan = 8 * (length / count);
  for (let i = 0; i < count; i += 1) {
    const a = samples[(i + count - 4) % count].tangent;
    const b = samples[(i + 4) % count].tangent;
    const angle = Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1));
    samples[i].curvature = angle / curvatureSpan;
  }

  const halfWidth = def.width / 2;

  // --- Road surface -------------------------------------------------------
  const roadTexture = makeRoadTexture();
  roadTexture.repeat.set(1, 1);
  const roadMaterial = new THREE.MeshStandardMaterial({
    map: roadTexture,
    color: 0x8e98b8,
    metalness: 0.24,
    roughness: 0.58,
    envMapIntensity: 0.28,
  });
  const road = new THREE.Mesh(makeRibbon(samples, -halfWidth, halfWidth, 0.02, 14), roadMaterial);
  road.receiveShadow = true;
  group.add(road);

  // --- Curbs --------------------------------------------------------------
  const curbTexture = makeCurbTexture(def.accent);
  const curbMaterial = new THREE.MeshStandardMaterial({
    map: curbTexture,
    roughness: 0.74,
    metalness: 0.12,
    emissive: new THREE.Color(def.accent),
    emissiveMap: curbTexture,
    emissiveIntensity: 0.03,
  });
  const curbs = [
    new THREE.Mesh(makeRibbon(samples, -halfWidth - 0.85, -halfWidth, 0.055, 2.2), curbMaterial),
    new THREE.Mesh(makeRibbon(samples, halfWidth, halfWidth + 0.85, 0.055, 2.2), curbMaterial),
  ];
  curbs.forEach((curb) => {
    curb.receiveShadow = true;
    group.add(curb);
  });

  // Neon edge traces.
  const accentGlow = new THREE.MeshBasicMaterial({
    color: new THREE.Color(def.accent),
    toneMapped: false,
  });
  const accent2Glow = new THREE.MeshBasicMaterial({
    color: new THREE.Color(def.accent2),
    toneMapped: false,
  });
  [-1, 1].forEach((dir) => {
    const line = new THREE.Mesh(
      makeRibbon(samples, dir * (halfWidth + 0.04), dir * (halfWidth + 0.22), 0.075, 4),
      accentGlow
    );
    group.add(line);
  });

  // --- Barriers -----------------------------------------------------------
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x0d0f1b,
    metalness: 0.78,
    roughness: 0.36,
    envMapIntensity: 0.9,
  });
  const railMaterial = new THREE.MeshStandardMaterial({
    color: 0x3b4358,
    metalness: 0.92,
    roughness: 0.24,
  });
  [-1, 1].forEach((dir) => {
    const offset = dir * (halfWidth + 2.45);
    const wall = new THREE.Mesh(makeVerticalRibbon(samples, offset, 0.02, 1.15, 3.2), wallMaterial);
    wall.material.side = THREE.DoubleSide;
    wall.castShadow = true;
    group.add(wall);
    const rail = new THREE.Mesh(makeVerticalRibbon(samples, offset + dir * 0.03, 0.62, 0.78, 3), railMaterial);
    rail.material.side = THREE.DoubleSide;
    group.add(rail);
    const neon = new THREE.Mesh(
      makeRibbon(samples, offset - 0.06, offset + 0.06, 1.18, 4),
      dir > 0 ? accent2Glow : accentGlow
    );
    group.add(neon);
    const baseGlow = new THREE.Mesh(
      makeRibbon(samples, offset - 0.05, offset + 0.05, 0.16, 4),
      dir > 0 ? accentGlow : accent2Glow
    );
    group.add(baseGlow);
  });

  // Guardrail posts.
  const postGeometry = new THREE.BoxGeometry(0.14, 1.2, 0.14);
  const postsPerSide = Math.floor(count / 6) * 2;
  const posts = new THREE.InstancedMesh(postGeometry, railMaterial, postsPerSide);
  const dummy = new THREE.Object3D();
  let postIndex = 0;
  for (let i = 0; i < count; i += 6) {
    for (const dir of [-1, 1]) {
      const s = samples[i];
      const p = s.pos.clone().addScaledVector(s.side, dir * (halfWidth + 2.48));
      dummy.position.set(p.x, p.y + 0.58, p.z);
      dummy.rotation.set(0, Math.atan2(s.tangent.x, s.tangent.z), 0);
      dummy.updateMatrix();
      posts.setMatrixAt(postIndex, dummy.matrix);
      postIndex += 1;
    }
  }
  posts.count = postIndex;
  posts.instanceMatrix.needsUpdate = true;
  posts.castShadow = false;
  group.add(posts);

  // Support columns under the elevated highway.
  const columnMaterial = new THREE.MeshStandardMaterial({
    color: 0x141726,
    roughness: 0.6,
    metalness: 0.5,
  });
  for (let i = 0; i < count; i += 22) {
    const s = samples[i];
    const height = Math.max(1, s.pos.y - 0.4);
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.8, height, 8), columnMaterial);
    column.position.set(s.pos.x, height / 2, s.pos.z);
    group.add(column);
  }

  // --- Start line and gates ----------------------------------------------
  const startLine = new THREE.Mesh(
    new THREE.PlaneGeometry(def.width - 0.6, 2.8),
    new THREE.MeshBasicMaterial({
      map: makeCheckerTexture(),
      side: THREE.DoubleSide,
      toneMapped: false,
    })
  );
  startLine.rotation.x = -Math.PI / 2;
  const startHolder = new THREE.Group();
  startHolder.position.copy(samples[0].pos);
  startHolder.rotation.y = Math.atan2(samples[0].tangent.x, samples[0].tangent.z);
  startLine.position.y = 0.075;
  startLine.receiveShadow = true;
  startHolder.add(startLine);
  group.add(startHolder);

  group.add(buildGate(samples[0], def.width, def.accent, true, "START", "START // FINISH"));
  const gateProgress = [0.34, 0.67];
  gateProgress.forEach((p, i) => {
    const sample = samples[Math.floor(p * count)];
    group.add(
      buildGate(
        sample,
        def.width,
        i === 0 ? def.accent2 : def.accent,
        false,
        `SECTOR 0${i + 1}`,
        `CHECKPOINT // ${def.name}`,
      )
    );
  });

  // Neon apex markers on the outside of the tighter corners.
  const chevronGeometry = new THREE.BoxGeometry(1.7, 0.12, 0.5);
  for (let i = 8; i < count; i += 5) {
    if (samples[i].curvature < 0.012) continue;
    const s = samples[i];
    const dir = samples[Math.min(count - 1, i + 2)].tangent.clone().sub(samples[Math.max(0, i - 2)].tangent);
    const sign = Math.sign(dir.cross(UP).dot(s.side)) || 1;
    const marker = new THREE.Mesh(chevronGeometry, accentGlow);
    const p = s.pos.clone().addScaledVector(s.side, sign * (halfWidth + 1.65));
    marker.position.set(p.x, p.y + 0.09, p.z);
    marker.rotation.y = Math.atan2(s.tangent.x, s.tangent.z) + 0.55;
    group.add(marker);
  }

  // --- Minimap ------------------------------------------------------------
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  samples.forEach(({ pos }) => {
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x);
    minZ = Math.min(minZ, pos.z);
    maxZ = Math.max(maxZ, pos.z);
  });
  const spanX = Math.max(1, maxX - minX);
  const spanZ = Math.max(1, maxZ - minZ);
  const minimap = samples.map(({ pos }) => ({
    x: 0.08 + ((pos.x - minX) / spanX) * 0.84,
    y: 0.08 + ((pos.z - minZ) / spanZ) * 0.84,
  }));

  const startHeading = Math.atan2(samples[0].tangent.x, samples[0].tangent.z);

  const sampleAt = (progress: number): TrackSample => {
    const wrapped = ((progress % 1) + 1) % 1;
    const scaled = wrapped * count;
    const i0 = Math.floor(scaled) % count;
    const i1 = (i0 + 1) % count;
    const frac = scaled - Math.floor(scaled);
    return {
      pos: samples[i0].pos.clone().lerp(samples[i1].pos, frac),
      tangent: samples[i0].tangent.clone().lerp(samples[i1].tangent, frac).normalize(),
      side: samples[i0].side.clone().lerp(samples[i1].side, frac).normalize(),
      distance: wrapped * length,
      curvature: THREE.MathUtils.lerp(samples[i0].curvature, samples[i1].curvature, frac),
    };
  };

  const nearestIndex = (position: THREE.Vector3, hint?: number): number => {
    let best = hint ?? 0;
    let bestDistance = Infinity;
    if (hint === undefined) {
      for (let i = 0; i < count; i += 1) {
        const dx = samples[i].pos.x - position.x;
        const dz = samples[i].pos.z - position.z;
        const d = dx * dx + dz * dz;
        if (d < bestDistance) {
          bestDistance = d;
          best = i;
        }
      }
      return best;
    }
    const spread = 55;
    for (let offset = -spread; offset <= spread; offset += 1) {
      const i = (hint + offset + count) % count;
      const dx = samples[i].pos.x - position.x;
      const dz = samples[i].pos.z - position.z;
      const d = dx * dx + dz * dz;
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    }
    return best;
  };

  return {
    def,
    group,
    samples,
    length,
    width: def.width,
    halfWidth,
    minimap,
    gateProgress,
    startPos: samples[0].pos.clone(),
    startHeading,
    nearestIndex,
    sampleAt,
    progressAt: (index: number) => (index % count) / count,
  };
};
