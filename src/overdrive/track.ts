import * as THREE from "three";
import type { TrackDef } from "./types";

export interface RoadSample {
  pos: THREE.Vector3;
  tangent: THREE.Vector3;
  side: THREE.Vector3;
  distance: number;
  curvature: number;
}

export interface RoadTrack {
  def: TrackDef;
  group: THREE.Group;
  samples: RoadSample[];
  length: number;
  width: number;
  halfWidth: number;
  minimap: { x: number; y: number }[];
  startHeading: number;
  startPos: THREE.Vector3;
  nearestIndex: (pos: THREE.Vector3, hint?: number) => number;
  sampleAt: (progress: number) => RoadSample;
  setWet: (wet: boolean) => void;
  dispose: () => void;
}

const UP = new THREE.Vector3(0, 1, 0);

const canvasTexture = (
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
  repeat?: [number, number]
) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  draw(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  if (repeat) texture.repeat.set(repeat[0], repeat[1]);
  return texture;
};

export const roadTexture = () =>
  canvasTexture(256, 512, (ctx) => {
    const rand = (() => {
      let seed = 1337;
      return () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
    })();
    ctx.fillStyle = "#3b3d40";
    ctx.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 9000; i += 1) {
      const shade = 42 + Math.floor(rand() * 42);
      ctx.fillStyle = `rgba(${shade},${shade},${shade + 2},${0.16 + rand() * 0.35})`;
      const size = rand() * 2.4 + 0.4;
      ctx.fillRect(rand() * 256, rand() * 512, size, size);
    }
    // Coarse aggregate patches and repaired seams.
    for (let i = 0; i < 16; i += 1) {
      ctx.fillStyle = `rgba(28,29,31,${0.12 + rand() * 0.22})`;
      ctx.fillRect(rand() * 256, rand() * 512, 16 + rand() * 70, 3 + rand() * 18);
    }
    ctx.strokeStyle = "rgba(22,23,25,0.5)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath();
      const y = rand() * 512;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(70, y + 12, 170, y - 16, 256, y + 6);
      ctx.stroke();
    }
    // Tyre rubber down the racing line.
    const wear = ctx.createLinearGradient(0, 0, 256, 0);
    wear.addColorStop(0, "rgba(0,0,0,0)");
    wear.addColorStop(0.24, "rgba(0,0,0,0.28)");
    wear.addColorStop(0.5, "rgba(0,0,0,0.04)");
    wear.addColorStop(0.76, "rgba(0,0,0,0.28)");
    wear.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = wear;
    ctx.fillRect(0, 0, 256, 512);
    // Solid white edge lines and dashed white centre line.
    ctx.fillStyle = "rgba(236,236,232,0.92)";
    ctx.fillRect(12, 0, 5, 512);
    ctx.fillRect(239, 0, 5, 512);
    for (let y = 0; y < 512; y += 150) {
      ctx.fillStyle = "rgba(238,238,232,0.85)";
      ctx.fillRect(125, y + 20, 5, 78);
    }
    ctx.fillStyle = "rgba(214,178,84,0.6)";
    ctx.fillRect(11, 0, 7, 512);
    ctx.fillRect(238, 0, 7, 512);
    ctx.fillStyle = "rgba(236,236,232,0.92)";
    ctx.fillRect(12, 0, 5, 512);
    ctx.fillRect(239, 0, 5, 512);
  });

const kerbTexture = () =>
  canvasTexture(64, 64, (ctx) => {
    ctx.fillStyle = "#d9d7cf";
    ctx.fillRect(0, 0, 64, 32);
    ctx.fillStyle = "#b3372c";
    ctx.fillRect(0, 32, 64, 32);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    for (let i = 0; i < 64; i += 16) ctx.fillRect(i, 30, 2, 4);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 62, 64, 2);
  });

const checkerTexture = () =>
  canvasTexture(
    256,
    64,
    (ctx) => {
      const cell = 16;
      for (let y = 0; y < 4; y += 1) {
        for (let x = 0; x < 16; x += 1) {
          ctx.fillStyle = (x + y) % 2 === 0 ? "#f2f0e8" : "#18191b";
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    },
    [1, 1]
  );

const ribbon = (
  samples: RoadSample[],
  left: number,
  right: number,
  yOff: number,
  vScale: number,
  doubleSided = false
) => {
  const count = samples.length;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= count; i += 1) {
    const s = samples[i % count];
    const along = i === count ? samples[count - 1].distance + 2 : s.distance;
    const a = s.pos.clone().addScaledVector(s.side, left);
    const b = s.pos.clone().addScaledVector(s.side, right);
    pos.push(a.x, a.y + yOff, a.z, b.x, b.y + yOff, b.z);
    uv.push(0, along / vScale, 1, along / vScale);
    if (i < count) {
      const base = i * 2;
      idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      if (doubleSided) idx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
};

const verticalRibbon = (samples: RoadSample[], offset: number, low: number, high: number, vScale: number) => {
  const count = samples.length;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= count; i += 1) {
    const s = samples[i % count];
    const along = i === count ? samples[count - 1].distance + 2 : s.distance;
    const p = s.pos.clone().addScaledVector(s.side, offset);
    pos.push(p.x, p.y + low, p.z, p.x, p.y + high, p.z);
    uv.push(along / vScale, 0, along / vScale, 1);
    if (i < count) {
      const base = i * 2;
      idx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
};

const bannerTexture = (title: string, subtitle: string) =>
  canvasTexture(512, 128, (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 512, 0);
    gradient.addColorStop(0, "#15181c");
    gradient.addColorStop(0.5, "#22262b");
    gradient.addColorStop(1, "#15181c");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = "#d9d7cf";
    ctx.fillRect(0, 0, 512, 3);
    ctx.fillRect(0, 125, 512, 3);
    ctx.font = 'italic 700 46px "Arial Narrow", Arial, sans-serif';
    ctx.fillStyle = "#f0eee6";
    ctx.textAlign = "center";
    ctx.fillText(title.toUpperCase(), 256, 62);
    ctx.font = '600 18px Arial, sans-serif';
    ctx.fillStyle = "#c9a24d";
    ctx.fillText(subtitle.toUpperCase(), 256, 96);
    for (let i = 0; i < 24; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? "#e7e4da" : "#1a1c1f";
      ctx.fillRect(214 + i * 4, 104, 4, 8);
    }
  });

export const createRoadTrack = (def: TrackDef): RoadTrack => {
  const group = new THREE.Group();
  group.name = `track-${def.id}`;
  const points: THREE.Vector3[] = [];
  const control = 48;
  for (let i = 0; i < control; i += 1) {
    const a = (i / control) * Math.PI * 2;
    const radius =
      1 +
      def.harmonicA * Math.sin(3 * a + 0.7) +
      def.harmonicB * Math.cos(5 * a + 1.9) +
      def.harmonicB * 0.45 * Math.sin(8 * a + 0.2);
    points.push(
      new THREE.Vector3(
        Math.cos(a) * def.rx * radius,
        2 + def.elevation * (0.5 + 0.5 * Math.sin(2 * a + 0.5)) * (def.theme === "hill" ? 1 : 0.5),
        Math.sin(a) * def.rz * radius
      )
    );
  }
  const curve = new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.4);
  const length = curve.getLength();
  const count = Math.min(1400, Math.max(380, Math.round(length / 2.4)));
  const samples: RoadSample[] = [];
  for (let i = 0; i < count; i += 1) {
    const t = i / count;
    const pos = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const side = new THREE.Vector3().crossVectors(tangent, UP).normalize();
    samples.push({ pos, tangent, side, distance: t * length, curvature: 0 });
  }
  const span = 8 * (length / count);
  for (let i = 0; i < count; i += 1) {
    const a = samples[(i + count - 4) % count].tangent;
    const b = samples[(i + 4) % count].tangent;
    samples[i].curvature = Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1)) / span;
  }

  const halfWidth = def.width / 2;

  // ---- Asphalt ---------------------------------------------------------
  const asphalt = new THREE.MeshStandardMaterial({
    map: roadTexture(),
    color: 0xffffff,
    roughness: 0.86,
    metalness: 0.04,
    envMapIntensity: 0.35,
  });
  const road = new THREE.Mesh(ribbon(samples, -halfWidth, halfWidth, 0.02, 16), asphalt);
  road.receiveShadow = true;
  group.add(road);

  // Shoulders / run-off.
  const shoulderMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(def.terrain).multiplyScalar(1.05),
    roughness: 0.95,
    metalness: 0,
  });
  [-1, 1].forEach((dir) => {
    const shoulder = new THREE.Mesh(
      ribbon(samples, dir * halfWidth, dir * (halfWidth + 2.2), -0.02, 12),
      shoulderMat
    );
    shoulder.receiveShadow = true;
    group.add(shoulder);
  });

  // ---- Kerbs -----------------------------------------------------------
  const kerbMat = new THREE.MeshStandardMaterial({
    map: kerbTexture(),
    roughness: 0.7,
    metalness: 0.05,
  });
  const curbs: THREE.Mesh[] = [];
  [-1, 1].forEach((dir) => {
    const curb = new THREE.Mesh(ribbon(samples, dir * halfWidth, dir * (halfWidth + 0.85), 0.055, 2.2), kerbMat);
    curb.receiveShadow = true;
    curbs.push(curb);
    group.add(curb);
  });

  // ---- Guardrails ------------------------------------------------------
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x9aa0a4,
    roughness: 0.42,
    metalness: 0.82,
    envMapIntensity: 0.8,
  });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x4a4f53, roughness: 0.6, metalness: 0.6 });
  const rails: THREE.Mesh[] = [];
  [-1, 1].forEach((dir) => {
    const rail = new THREE.Mesh(verticalRibbon(samples, dir * (halfWidth + 2.5), 0.55, 0.82, 3), railMat);
    rail.material.side = THREE.DoubleSide;
    rails.push(rail);
    group.add(rail);
    const lower = new THREE.Mesh(verticalRibbon(samples, dir * (halfWidth + 2.5), 0.3, 0.44, 3), railMat);
    lower.material.side = THREE.DoubleSide;
    rails.push(lower);
    group.add(lower);
  });
  const postGeo = new THREE.BoxGeometry(0.12, 0.95, 0.12);
  const postCount = Math.floor(count / 5) * 2;
  const posts = new THREE.InstancedMesh(postGeo, postMat, postCount);
  const dummy = new THREE.Object3D();
  let postIndex = 0;
  for (let i = 0; i < count; i += 5) {
    [-1, 1].forEach((dir) => {
      if (postIndex >= postCount) return;
      const s = samples[i];
      const p = s.pos.clone().addScaledVector(s.side, dir * (halfWidth + 2.5));
      dummy.position.set(p.x, p.y + 0.48, p.z);
      dummy.rotation.set(0, Math.atan2(s.tangent.x, s.tangent.z), 0);
      dummy.updateMatrix();
      posts.setMatrixAt(postIndex, dummy.matrix);
      postIndex += 1;
    });
  }
  posts.count = postIndex;
  posts.instanceMatrix.needsUpdate = true;
  group.add(posts);

  // Reflector posts.
  const reflectorMat = new THREE.MeshStandardMaterial({ color: 0xd9d7cf, roughness: 0.5 });
  const reflectors = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.75, 0.1), reflectorMat, Math.floor(count / 9) * 2);
  let reflectorIndex = 0;
  for (let i = 0; i < count; i += 9) {
    [-1, 1].forEach((dir) => {
      if (reflectorIndex >= reflectors.count) return;
      const s = samples[i];
      const p = s.pos.clone().addScaledVector(s.side, dir * (halfWidth + 1.7));
      dummy.position.set(p.x, p.y + 0.37, p.z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      reflectors.setMatrixAt(reflectorIndex, dummy.matrix);
      reflectorIndex += 1;
    });
  }
  reflectors.count = reflectorIndex;
  reflectors.instanceMatrix.needsUpdate = true;
  group.add(reflectors);

  // ---- Start line, grid and gantry -------------------------------------
  const start = samples[0];
  const heading = Math.atan2(start.tangent.x, start.tangent.z);
  const line = new THREE.Mesh(
    new THREE.PlaneGeometry(def.width - 0.4, 2.4),
    new THREE.MeshStandardMaterial({
      map: checkerTexture(),
      roughness: 0.6,
      metalness: 0.05,
      side: THREE.DoubleSide,
    })
  );
  line.rotation.x = -Math.PI / 2;
  const lineHolder = new THREE.Group();
  lineHolder.position.copy(start.pos);
  lineHolder.rotation.y = heading;
  line.position.y = 0.07;
  lineHolder.add(line);
  for (let g = 0; g < 6; g += 1) {
    const box = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 0.16),
      new THREE.MeshBasicMaterial({ color: 0xe9e7df, toneMapped: false, transparent: true, opacity: 0.7 })
    );
    box.rotation.x = -Math.PI / 2;
    box.position.set(g % 2 === 0 ? -3.2 : 3.2, 0.08, -8 - g * 7);
    lineHolder.add(box);
  }
  group.add(lineHolder);

  const gantry = new THREE.Group();
  gantry.position.copy(start.pos);
  gantry.rotation.y = heading;
  const steel = new THREE.MeshStandardMaterial({ color: 0x6d7377, metalness: 0.75, roughness: 0.4 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x2b3034, metalness: 0.6, roughness: 0.5 });
  const spanW = def.width + 5;
  [-1, 1].forEach((dir) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.7, 6.4, 0.7), steel);
    leg.position.set(dir * spanW * 0.5, 3.2, 0);
    leg.castShadow = true;
    gantry.add(leg);
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 1.5), darkSteel);
    base.position.set(dir * spanW * 0.5, 0.18, 0);
    gantry.add(base);
  });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(spanW + 1.2, 1.7, 0.5), darkSteel);
  beam.position.set(0, 6.2, 0);
  gantry.add(beam);
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(spanW - 1, 1.45),
    new THREE.MeshBasicMaterial({
      map: bannerTexture("OVERDRIVE", `${def.name} · ${def.location}`),
      toneMapped: false,
      side: THREE.DoubleSide,
    })
  );
  banner.position.set(0, 6.2, 0.28);
  gantry.add(banner);
  const bannerBack = banner.clone();
  bannerBack.position.z = -0.28;
  bannerBack.rotation.y = Math.PI;
  gantry.add(bannerBack);
  group.add(gantry);

  // ---- Checkpoint arches ----------------------------------------------
  const checkpoint = (progress: number, label: string) => {
    const s = samples[Math.floor(progress * count)];
    const arch = new THREE.Group();
    arch.position.copy(s.pos);
    arch.rotation.y = Math.atan2(s.tangent.x, s.tangent.z);
    const material = new THREE.MeshStandardMaterial({ color: 0x8b9194, metalness: 0.6, roughness: 0.45 });
    [-1, 1].forEach((dir) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.2, 0.22), material);
      post.position.set(dir * (halfWidth + 1.2), 1.6, 0);
      arch.add(post);
    });
    const top = new THREE.Mesh(new THREE.BoxGeometry(def.width + 2.6, 0.18, 0.22), material);
    top.position.y = 3.2;
    arch.add(top);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 0.9),
      new THREE.MeshBasicMaterial({
        map: bannerTexture(label, "SECTOR"),
        side: THREE.DoubleSide,
        toneMapped: false,
      })
    );
    sign.position.set(0, 3.75, 0);
    arch.add(sign);
    group.add(arch);
  };
  checkpoint(0.34, "CHECKPOINT 1");
  checkpoint(0.67, "CHECKPOINT 2");

  const startPos = samples[count - 4].pos.clone();
  const startHeading = Math.atan2(samples[count - 4].tangent.x, samples[count - 4].tangent.z);

  // ---- Grandstands and pit wall for permanent circuits ----------------
  if (def.theme === "circuit") {
    const standMat = new THREE.MeshStandardMaterial({ color: 0x9ba0a3, roughness: 0.7, metalness: 0.25 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x36424d, roughness: 0.8 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x60707e, metalness: 0.7, roughness: 0.2 });
    for (let s = 0; s < 3; s += 1) {
      const index = Math.floor(((s + 0.35) / 3) * count);
      const sample = samples[index];
      const side = s % 2 === 0 ? 1 : -1;
      const base = sample.pos.clone().addScaledVector(sample.side, side * (halfWidth + 14));
      const stand = new THREE.Group();
      stand.position.copy(base);
      stand.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z) + (side > 0 ? Math.PI : 0);
      const body = new THREE.Mesh(new THREE.BoxGeometry(30, 3.2, 9), standMat);
      body.position.y = 1.6;
      body.castShadow = true;
      stand.add(body);
      const seats = new THREE.Mesh(new THREE.BoxGeometry(30, 0.6, 7), seatMat);
      seats.position.set(0, 3.4, -0.6);
      stand.add(seats);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(31, 0.25, 10), new THREE.MeshStandardMaterial({ color: 0xe4e2da, roughness: 0.5 }));
      roof.position.y = 6.2;
      roof.castShadow = true;
      stand.add(roof);
      [-1, 1].forEach((dir) => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3, 0.22), steel);
        pillar.position.set(dir * 14, 4.7, 4.2);
        stand.add(pillar);
      });
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(30, 1.6, 3), glassMat);
      cabin.position.set(0, 7.1, 0);
      stand.add(cabin);
      group.add(stand);
    }
    const pitWall = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 11, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xd9d7cf, roughness: 0.65 })
    );
    const pitSample = samples[Math.floor(count * 0.06)];
    pitWall.position.copy(pitSample.pos).addScaledVector(pitSample.side, halfWidth + 7);
    pitWall.position.y += 1.1;
    pitWall.rotation.y = Math.atan2(pitSample.tangent.x, pitSample.tangent.z);
    group.add(pitWall);
  }

  // ---- Braking distance boards ----------------------------------------
  const boardMat = new THREE.MeshStandardMaterial({
    map: canvasTexture(128, 128, (ctx) => {
      ctx.fillStyle = "#efede5";
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = "#22262a";
      ctx.fillRect(6, 6, 116, 116);
      ctx.fillStyle = "#efede5";
      ctx.fillRect(14, 14, 100, 100);
      ctx.fillStyle = "#b3372c";
      ctx.font = '700 70px "Arial Narrow", Arial, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("70", 64, 92);
    }),
    roughness: 0.6,
  });
  for (let i = 0; i < count; i += 37) {
    const s = samples[i];
    const dir = i % 2 === 0 ? 1 : -1;
    const p = s.pos.clone().addScaledVector(s.side, dir * (halfWidth + 3.4));
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), boardMat);
    board.position.set(p.x, p.y + 1.1, p.z);
    board.rotation.y = Math.atan2(-s.tangent.x, -s.tangent.z);
    group.add(board);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), postMat);
    post.position.set(p.x, p.y + 0.35, p.z);
    group.add(post);
  }

  // ---- Wet-weather puddles --------------------------------------------
  const puddleMat = new THREE.MeshStandardMaterial({
    color: 0x7e8d98,
    metalness: 0.9,
    roughness: 0.08,
    transparent: true,
    opacity: 0.5,
    envMapIntensity: 1.4,
    depthWrite: false,
  });
  const puddles = new THREE.Group();
  const puddleRand = (() => {
    let seed = 77;
    return () => {
      seed = (seed * 48271) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  })();
  for (let i = 0; i < 90; i += 1) {
    const s = samples[Math.floor(puddleRand() * count)];
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.7 + puddleRand() * 2.2, 14), puddleMat);
    const offset = (puddleRand() - 0.5) * (def.width - 2.5);
    const p = s.pos.clone().addScaledVector(s.side, offset);
    puddle.position.set(p.x, p.y + 0.065, p.z);
    puddle.rotation.x = -Math.PI / 2;
    puddle.scale.y = 0.35 + puddleRand() * 0.5;
    puddle.rotation.z = puddleRand() * Math.PI;
    puddles.add(puddle);
  }
  puddles.visible = false;
  group.add(puddles);

  // ---- Minimap --------------------------------------------------------
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

  const sampleAt = (progress: number): RoadSample => {
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

  const nearestIndex = (pos: THREE.Vector3, hint?: number): number => {
    let best = hint ?? 0;
    let bestDistance = Infinity;
    if (hint === undefined) {
      for (let i = 0; i < count; i += 1) {
        const dx = samples[i].pos.x - pos.x;
        const dz = samples[i].pos.z - pos.z;
        const d = dx * dx + dz * dz;
        if (d < bestDistance) {
          bestDistance = d;
          best = i;
        }
      }
      return best;
    }
    for (let offset = -60; offset <= 60; offset += 1) {
      const i = (hint + offset + count) % count;
      const dx = samples[i].pos.x - pos.x;
      const dz = samples[i].pos.z - pos.z;
      const d = dx * dx + dz * dz;
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    }
    return best;
  };

  let wet = false;
  const setWet = (next: boolean) => {
    wet = next;
    puddles.visible = wet;
    asphalt.color.set(wet ? 0x9aa3ab : 0xffffff);
    asphalt.roughness = wet ? 0.34 : 0.86;
    asphalt.metalness = wet ? 0.35 : 0.04;
    asphalt.envMapIntensity = wet ? 1.1 : 0.35;
    kerbMat.color.set(wet ? 0xaab0b5 : 0xffffff);
    shoulderMat.color.set(new THREE.Color(def.terrain).multiplyScalar(wet ? 0.62 : 1.05));
    asphalt.needsUpdate = true;
    kerbMat.needsUpdate = true;
    shoulderMat.needsUpdate = true;
    rails.forEach((rail) => {
      (rail.material as THREE.MeshStandardMaterial).roughness = wet ? 0.24 : 0.42;
    });
  };

  return {
    def,
    group,
    samples,
    length,
    width: def.width,
    halfWidth,
    minimap,
    startHeading,
    startPos,
    nearestIndex,
    sampleAt,
    setWet,
    dispose: () => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m) => m.dispose());
        }
      });
    },
  };
};
