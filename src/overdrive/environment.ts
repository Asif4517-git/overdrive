import * as THREE from "three";
import type { Quality, TimeOfDay, TrackDef, Weather } from "./types";
import type { RoadTrack } from "./track";

export interface WorldRig {
  group: THREE.Group;
  sun: THREE.DirectionalLight;
  update: (focus: THREE.Vector3, elapsed: number, dt: number) => void;
  setRain: (rain: boolean) => void;
  dispose: () => void;
}

const makeTexture = (w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  draw(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
};

const rng = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

const terrainTexture = (def: TrackDef) =>
  makeTexture(256, 256, (ctx) => {
    const rand = rng(91);
    ctx.fillStyle = def.terrain;
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 5000; i += 1) {
      const shade = rand();
      ctx.fillStyle =
        shade > 0.55 ? "rgba(255,255,235,0.05)" : shade > 0.25 ? "rgba(0,0,0,0.12)" : "rgba(80,70,40,0.08)";
      ctx.fillRect(rand() * 256, rand() * 256, 1 + rand() * 3, 1 + rand() * 3);
    }
    if (def.theme === "coast") {
      ctx.fillStyle = "rgba(211,192,152,0.28)";
      for (let i = 0; i < 14; i += 1) ctx.fillRect(rand() * 256, rand() * 256, 20 + rand() * 50, 8 + rand() * 20);
    }
    if (def.theme === "circuit") {
      ctx.fillStyle = "rgba(120,140,80,0.16)";
      for (let i = 0; i < 6; i += 1) ctx.fillRect(0, (i / 6) * 256, 256, 12);
    }
  });

const windowTexture = (night: boolean) =>
  makeTexture(128, 256, (ctx) => {
    const rand = rng(52);
    ctx.fillStyle = night ? "#1a2029" : "#767b80";
    ctx.fillRect(0, 0, 128, 256);
    for (let y = 0; y < 32; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const lit = rand();
        if (night) {
          ctx.fillStyle = lit > 0.6 ? "rgba(255,216,150,0.85)" : "rgba(24,30,38,0.9)";
        } else {
          ctx.fillStyle = lit > 0.5 ? "rgba(180,198,210,0.65)" : "rgba(58,66,74,0.7)";
        }
        ctx.fillRect(x * 16 + 3, y * 8 + 2, 10, 4);
      }
    }
    ctx.fillStyle = "rgba(20,24,30,0.35)";
    for (let y = 0; y < 256; y += 8) ctx.fillRect(0, y, 128, 1);
  });

const skyMaterial = (def: TrackDef, time: TimeOfDay) => {
  const night = time === "night";
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: new THREE.Color(night ? "#081223" : def.skyTop) },
      uHorizon: { value: new THREE.Color(def.skyHorizon) },
      uSun: { value: new THREE.Color(time === "sunset" ? "#ffc27a" : night ? "#9fb4de" : "#fff6e2") },
      uNight: { value: night ? 1 : 0 },
      uSunDir: { value: new THREE.Vector3(0.4, 0.3, 0.8).normalize() },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uTop;
      uniform vec3 uHorizon;
      uniform vec3 uSun;
      uniform float uNight;
      uniform vec3 uSunDir;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y, -0.1, 1.0);
        vec3 col = mix(uHorizon, uTop, pow(clamp(h * 1.6, 0.0, 1.0), 0.8));
        float horizonGlow = pow(clamp(1.0 - abs(h) * 2.4, 0.0, 1.0), 2.0);
        col += uSun * horizonGlow * (uNight > 0.5 ? 0.05 : 0.22);
        float sunAmount = max(dot(normalize(vDir), normalize(uSunDir)), 0.0);
        col += uSun * pow(sunAmount, 900.0) * 2.5;
        col += uSun * pow(sunAmount, 18.0) * 0.16;
        float haze = smoothstep(0.0, 0.35, h) * (1.0 - smoothstep(0.2, 0.7, h));
        col = mix(col, uHorizon, haze * 0.28);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
};

const clouds = (count: number) => {
  const group = new THREE.Group();
  const texture = makeTexture(256, 128, (ctx) => {
    const rand = rng(31);
    ctx.clearRect(0, 0, 256, 128);
    for (let i = 0; i < 26; i += 1) {
      const x = 20 + rand() * 216;
      const y = 35 + rand() * 50;
      const r = 18 + rand() * 34;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(255,255,255,0.5)");
      g.addColorStop(0.7, "rgba(240,242,245,0.18)");
      g.addColorStop(1, "rgba(240,242,245,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    fog: false,
  });
  const rand = rng(64);
  for (let i = 0; i < count; i += 1) {
    const sprite = new THREE.Sprite(material);
    const angle = (i / count) * Math.PI * 2 + rand() * 0.5;
    const radius = 550 + rand() * 420;
    sprite.position.set(Math.cos(angle) * radius, 170 + rand() * 170, Math.sin(angle) * radius);
    sprite.scale.set(320 + rand() * 260, 90 + rand() * 60, 1);
    group.add(sprite);
  }
  return group;
};

const mountains = (def: TrackDef, count: number) => {
  const group = new THREE.Group();
  const rand = rng(def.id === "munnar-climb" ? 12 : def.id === "ecr-coast" ? 22 : 32);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(def.theme === "city" ? 0x4a5158 : def.theme === "coast" ? 0x6f7f72 : 0x53654a),
    roughness: 0.96,
    metalness: 0,
    flatShading: true,
  });
  const farMaterial = material.clone();
  farMaterial.color.lerp(new THREE.Color(def.skyHorizon), 0.45);
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + rand() * 0.18;
    const radius = 640 + rand() * 620;
    const height = 80 + rand() * (def.theme === "hill" ? 190 : 100);
    const width = 130 + rand() * 200;
    const geo = new THREE.ConeGeometry(width, height, 5 + Math.floor(rand() * 3), 1);
    const mesh = new THREE.Mesh(geo, rand() > 0.5 ? material : farMaterial);
    mesh.position.set(Math.cos(angle) * radius, height * 0.5 - 8, Math.sin(angle) * radius);
    mesh.rotation.y = rand() * Math.PI;
    group.add(mesh);
  }
  return group;
};

const ground = (def: TrackDef) => {
  const texture = terrainTexture(def);
  texture.repeat.set(def.theme === "city" ? 120 : 220, def.theme === "city" ? 120 : 220);
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    color: 0xffffff,
    roughness: 0.96,
    metalness: 0,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.08;
  mesh.receiveShadow = true;
  return mesh;
};

interface Vegetation {
  trunks: THREE.InstancedMesh;
  crowns: THREE.InstancedMesh;
  count: number;
}

const vegetation = (track: RoadTrack, def: TrackDef, quality: Quality): Vegetation => {
  const rand = rng(def.id.length * 977 + 13);
  const target = quality === "high" ? 620 : quality === "medium" ? 380 : 200;
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.32, 3.4, 6);
  const crownGeo =
    def.theme === "hill"
      ? new THREE.ConeGeometry(1.8, 5.4, 7)
      : new THREE.IcosahedronGeometry(2.2, 1);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.95 });
  const crownMat = new THREE.MeshStandardMaterial({
    color: def.theme === "coast" ? 0x466b3b : 0x3f5f36,
    roughness: 0.9,
    flatShading: true,
  });
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, target);
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, target * 2);
  const dummy = new THREE.Object3D();
  let count = 0;
  let crownCount = 0;
  for (let i = 0; i < target; i += 1) {
    const s = track.samples[Math.floor(rand() * track.samples.length)];
    const side = rand() > 0.5 ? 1 : -1;
    const offset = track.halfWidth + 6 + rand() * 55;
    const pos = s.pos.clone().addScaledVector(s.side, side * offset);
    const scale = 0.7 + rand() * 1.5;
    dummy.position.set(pos.x, pos.y + 1.7 * scale, pos.z);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    trunks.setMatrixAt(count, dummy.matrix);
    const crownBase = pos.y + 3.6 * scale;
    if (def.theme === "hill") {
      dummy.position.set(pos.x, crownBase + 1.6 * scale, pos.z);
      dummy.scale.setScalar(scale);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      crowns.setMatrixAt(crownCount, dummy.matrix);
      crownCount += 1;
    } else {
      for (let c = 0; c < 2; c += 1) {
        dummy.position.set(pos.x + (c === 0 ? -0.8 : 0.9) * scale, crownBase + (c === 0 ? 0.6 : 0) * scale, pos.z + (c === 0 ? 0.4 : -0.6) * scale);
        dummy.scale.setScalar(scale * (c === 0 ? 1 : 0.78));
        dummy.rotation.set(0, rand() * Math.PI, 0);
        dummy.updateMatrix();
        crowns.setMatrixAt(crownCount, dummy.matrix);
        crownCount += 1;
      }
    }
    count += 1;
  }
  trunks.count = count;
  crowns.count = crownCount;
  trunks.instanceMatrix.needsUpdate = true;
  crowns.instanceMatrix.needsUpdate = true;
  trunks.castShadow = quality === "high";
  crowns.castShadow = quality === "high";
  const group = new THREE.Group();
  group.add(trunks, crowns);
  return { trunks, crowns, count };
};

const rocks = (track: RoadTrack, def: TrackDef) => {
  const rand = rng(511);
  const count = def.theme === "hill" ? 140 : 60;
  const mesh = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ color: def.theme === "coast" ? 0x8b8578 : 0x6f6f66, roughness: 0.98, flatShading: true }),
    count
  );
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i += 1) {
    const s = track.samples[Math.floor(rand() * track.samples.length)];
    const side = rand() > 0.5 ? 1 : -1;
    const p = s.pos.clone().addScaledVector(s.side, side * (track.halfWidth + 3 + rand() * 30));
    const scale = 0.3 + rand() * 1.6;
    dummy.position.set(p.x, p.y + scale * 0.4, p.z);
    dummy.scale.set(scale * (1 + rand()), scale, scale * (1 + rand()));
    dummy.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
};

const sea = (def: TrackDef) => {
  if (def.theme !== "coast") return null;
  const material = new THREE.MeshStandardMaterial({
    color: 0x2b6172,
    roughness: 0.16,
    metalness: 0.55,
    envMapIntensity: 1.2,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1800, 1, 1), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(820, -2.4, 120);
  const beach = new THREE.Mesh(
    new THREE.PlaneGeometry(700, 1500),
    new THREE.MeshStandardMaterial({ color: 0xcbb98f, roughness: 0.98 })
  );
  beach.rotation.x = -Math.PI / 2;
  beach.position.set(560, -0.6, 120);
  const group = new THREE.Group();
  group.add(sea2(mesh), beach);
  return group;
};

const sea2 = (mesh: THREE.Mesh) => mesh;

const palms = (track: RoadTrack) => {
  const rand = rng(88);
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a6247, roughness: 0.95 });
  const frondMat = new THREE.MeshStandardMaterial({ color: 0x3f6b3a, roughness: 0.9, side: THREE.DoubleSide });
  for (let i = 0; i < 46; i += 1) {
    const s = track.samples[Math.floor(rand() * track.samples.length)];
    const dir = rand() > 0.5 ? 1 : -1;
    const p = s.pos.clone().addScaledVector(s.side, dir * (track.halfWidth + 6 + rand() * 30));
    const palm = new THREE.Group();
    palm.position.copy(p);
    palm.rotation.y = rand() * Math.PI * 2;
    const height = 5 + rand() * 4;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.3, height, 6), trunkMat);
    trunk.position.y = height / 2;
    trunk.rotation.z = (rand() - 0.5) * 0.25;
    palm.add(trunk);
    for (let f = 0; f < 6; f += 1) {
      const frond = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3.6, 3), frondMat);
      frond.position.set(Math.cos((f / 6) * Math.PI * 2) * 1.5, height, Math.sin((f / 6) * Math.PI * 2) * 1.5);
      frond.rotation.z = Math.PI / 2.2;
      frond.rotation.y = (f / 6) * Math.PI * 2;
      frond.scale.set(1, 1, 0.25);
      palm.add(frond);
    }
    group.add(palm);
  }
  return group;
};

const cityBlocks = (track: RoadTrack, night: boolean, quality: Quality) => {
  const rand = rng(421);
  const group = new THREE.Group();
  const textures = [windowTexture(night), windowTexture(night), windowTexture(night)];
  const materials = textures.map(
    (map) =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map,
        roughness: 0.62,
        metalness: 0.18,
        emissive: new THREE.Color(night ? 0x2a2f38 : 0x000000),
        emissiveMap: map,
        emissiveIntensity: night ? 0.6 : 0,
      })
  );
  const total = quality === "high" ? 120 : quality === "medium" ? 80 : 44;
  const batches = materials.map(() => new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), materials[0], total));
  batches.forEach((b, i) => {
    b.material = materials[i];
  });
  const counts = [0, 0, 0];
  const dummy = new THREE.Object3D();
  for (let i = 0; i < total; i += 1) {
    const s = track.samples[Math.floor(rand() * track.samples.length)];
    const dir = rand() > 0.5 ? 1 : -1;
    const p = s.pos.clone().addScaledVector(s.side, dir * (track.halfWidth + 14 + rand() * 60));
    const h = 10 + rand() * 55;
    const w = 8 + rand() * 14;
    dummy.position.set(p.x, h / 2, p.z);
    dummy.scale.set(w, h, w * (0.7 + rand() * 0.8));
    dummy.rotation.set(0, rand() * Math.PI, 0);
    dummy.updateMatrix();
    const b = i % 3;
    batches[b].setMatrixAt(counts[b], dummy.matrix);
    counts[b] += 1;
  }
  batches.forEach((b, i) => {
    b.count = counts[i];
    b.instanceMatrix.needsUpdate = true;
    group.add(b);
  });
  return group;
};

const streetlights = (track: RoadTrack, def: TrackDef, night: boolean, quality: Quality) => {
  const group = new THREE.Group();
  const rand = rng(17);
  const count = Math.min(90, Math.max(28, Math.floor(track.samples.length / 14)));
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x5d6266, metalness: 0.7, roughness: 0.4 });
  const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.13, 7, 6), poleMat, count);
  const arms = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 0.11, 0.11), poleMat, count);
  const heads = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.62, 0.13, 0.3),
    new THREE.MeshStandardMaterial({
      color: night ? 0xf3e2bc : 0x8d9498,
      emissive: new THREE.Color(night ? 0xffcf85 : 0x111111),
      emissiveIntensity: night ? 1.8 : 0,
      roughness: 0.5,
    }),
    count
  );
  const dummy = new THREE.Object3D();
  let index = 0;
  for (let i = 0; i < count; i += 1) {
    const s = track.samples[Math.floor(((i + 0.25) / count) * track.samples.length)];
    const dir = rand() > 0.5 ? 1 : -1;
    const base = s.pos.clone().addScaledVector(s.side, dir * (track.halfWidth + 2.9));
    dummy.position.set(base.x, base.y + 3.5, base.z);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    poles.setMatrixAt(index, dummy.matrix);
    dummy.position.set(base.x - s.side.x * dir * 0.9, base.y + 7, base.z - s.side.z * dir * 0.9);
    dummy.rotation.set(0, Math.atan2(s.side.x, s.side.z), 0);
    dummy.updateMatrix();
    arms.setMatrixAt(index, dummy.matrix);
    dummy.position.set(base.x - s.side.x * dir * 1.8, base.y + 6.92, base.z - s.side.z * dir * 1.8);
    dummy.updateMatrix();
    heads.setMatrixAt(index, dummy.matrix);
    index += 1;
  }
  poles.count = index;
  arms.count = index;
  heads.count = index;
  [poles, arms, heads].forEach((m) => {
    m.instanceMatrix.needsUpdate = true;
    group.add(m);
  });
  if (night && quality !== "low") {
    for (let i = 0; i < 5; i += 1) {
      const s = track.samples[Math.floor((i / 5) * track.samples.length)];
      const light = new THREE.PointLight(0xffcf9a, 16, 30, 2.2);
      light.position.copy(s.pos).add(new THREE.Vector3(0, 6, 0));
      group.add(light);
    }
  }
  void def;
  return group;
};

const tyreStacks = (track: RoadTrack) => {
  const rand = rng(301);
  const group = new THREE.Group();
  const count = 42;
  const mesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.28, 12),
    new THREE.MeshStandardMaterial({ color: 0x1e2022, roughness: 0.92 }),
    count * 3
  );
  const band = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.43, 0.43, 0.1, 12),
    new THREE.MeshStandardMaterial({ color: 0xd8d5cc, roughness: 0.8 }),
    count
  );
  const dummy = new THREE.Object3D();
  let index = 0;
  for (let i = 0; i < count; i += 1) {
    const s = track.samples[Math.floor(rand() * track.samples.length)];
    const dir = rand() > 0.5 ? 1 : -1;
    const p = s.pos.clone().addScaledVector(s.side, dir * (track.halfWidth + 1.9));
    for (let stack = 0; stack < 3; stack += 1) {
      dummy.position.set(p.x, p.y + 0.16 + stack * 0.3, p.z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      index += 1;
    }
    dummy.position.set(p.x, p.y + 0.62, p.z);
    dummy.updateMatrix();
    band.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  band.instanceMatrix.needsUpdate = true;
  group.add(mesh, band);
  return group;
};

const roadSigns = (track: RoadTrack, def: TrackDef) => {
  const group = new THREE.Group();
  const signs = [
    { text: "MUNNAR 18", kind: "green" },
    { text: "40", kind: "speed" },
    { text: "GHAT ROAD", kind: "yellow" },
    { text: "TOLL 2 KM", kind: "green" },
  ];
  signs.forEach((sign, index) => {
    const s = track.samples[Math.floor(((index + 0.4) / signs.length) * track.samples.length)];
    const dir = index % 2 === 0 ? 1 : -1;
    const p = s.pos.clone().addScaledVector(s.side, dir * (track.halfWidth + 4.4));
    const texture = makeTexture(256, 128, (ctx) => {
      if (sign.kind === "green") {
        ctx.fillStyle = "#1c5b3c";
        ctx.fillRect(0, 0, 256, 128);
        ctx.strokeStyle = "#e8e6dd";
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, 248, 120);
        ctx.fillStyle = "#f1efe7";
        ctx.font = '700 40px Arial, sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(sign.text, 128, 58);
        ctx.font = '500 20px Arial, sans-serif';
        ctx.fillText("NH 85 · KERALA", 128, 92);
      } else if (sign.kind === "speed") {
        ctx.fillStyle = "#f4f2ea";
        ctx.beginPath();
        ctx.arc(128, 64, 58, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#b3372c";
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(128, 64, 51, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#1e2124";
        ctx.font = '700 52px Arial, sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(sign.text, 128, 82);
      } else {
        ctx.fillStyle = "#d9b03c";
        ctx.fillRect(0, 0, 256, 128);
        ctx.strokeStyle = "#24262a";
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, 248, 120);
        ctx.fillStyle = "#202226";
        ctx.font = '700 34px Arial, sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(sign.text, 128, 62);
        ctx.font = '500 18px Arial, sans-serif';
        ctx.fillText("SLOW · USE LOW GEAR", 128, 94);
      }
    });
    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(sign.kind === "speed" ? 1.3 : 3.4, sign.kind === "speed" ? 1.3 : 1.7),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6, side: THREE.DoubleSide })
    );
    plaque.position.set(p.x, p.y + 2.4, p.z);
    plaque.rotation.y = Math.atan2(-s.tangent.x, -s.tangent.z);
    group.add(plaque);
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x8b9194, metalness: 0.7, roughness: 0.4 })
    );
    post.position.set(p.x, p.y + 1.2, p.z);
    group.add(post);
  });
  void def;
  return group;
};

const rainSystem = () => {
  const count = 3500;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count);
  const rand = rng(719);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (rand() - 0.5) * 120;
    positions[i * 3 + 1] = rand() * 40;
    positions[i * 3 + 2] = (rand() - 0.5) * 120;
    velocities[i] = 28 + rand() * 22;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xc8d2d8,
    size: 0.09,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.visible = false;
  return { points, velocities, positions, geometry, material, count };
};

export const createWorld = (
  track: RoadTrack,
  def: TrackDef,
  scene: THREE.Scene,
  quality: Quality,
  weather: Weather,
  timeOfDay: TimeOfDay
): WorldRig => {
  const group = new THREE.Group();
  const night = timeOfDay === "night";
  const wet = weather === "rain" || weather === "overcast";
  const cloudy = weather === "overcast" || weather === "rain";

  const sky = new THREE.Mesh(new THREE.SphereGeometry(2100, 32, 20), skyMaterial(def, timeOfDay));
  (sky.material as THREE.ShaderMaterial).uniforms.uSunDir.value.set(
    timeOfDay === "sunset" ? -0.55 : night ? 0.55 : 0.35,
    timeOfDay === "sunset" ? -0.05 : night ? 0.7 : 0.75,
    timeOfDay === "sunset" ? -0.85 : 0.45
  );
  group.add(sky);
  group.add(ground(def));
  group.add(mountains(def, quality === "high" ? 26 : 16));
  const cloudLayer = clouds(cloudy ? 22 : 12);
  group.add(cloudLayer);
  const vegetationRig = vegetation(track, def, quality);
  group.add(vegetationRig.trunks.parent ?? vegetationRig.trunks);
  group.add(vegetationRig.crowns);
  group.add(rocks(track, def));
  const seaMesh = sea(def);
  if (seaMesh) group.add(seaMesh);
  if (def.theme === "coast") group.add(palms(track));
  if (def.theme === "city") group.add(cityBlocks(track, night, quality));
  if (def.theme === "city" || def.theme === "circuit" || night) group.add(streetlights(track, def, night, quality));
  if (def.theme === "circuit") group.add(tyreStacks(track));
  group.add(roadSigns(track, def));

  if (night) {
    const rand = rng(101);
    const starGeo = new THREE.BufferGeometry();
    const starCount = 900;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(rand() * 0.9);
      const r = 1700;
      starPos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      starPos[i * 3 + 1] = Math.cos(phi) * r + 90;
      starPos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xdfe8ff, size: 2, sizeAttenuation: true, transparent: true, opacity: 0.8, fog: false })
    );
    group.add(stars);
  }

  const sun = new THREE.DirectionalLight(
    timeOfDay === "sunset" ? 0xffc07a : night ? 0xa6bce8 : cloudy ? 0xdfe6ea : 0xfff2db,
    night ? 0.32 : timeOfDay === "sunset" ? 2.0 : cloudy ? 1.25 : 2.6
  );
  sun.castShadow = quality !== "low";
  sun.shadow.mapSize.set(quality === "high" ? 2048 : 1024, quality === "high" ? 2048 : 1024);
  sun.shadow.camera.left = -90;
  sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 90;
  sun.shadow.camera.bottom = -90;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 420;
  sun.shadow.bias = -0.0004;
  const sunOffset =
    timeOfDay === "sunset" ? new THREE.Vector3(-260, 70, -240) : night ? new THREE.Vector3(180, 260, 120) : new THREE.Vector3(160, 300, 120);
  sun.position.copy(sunOffset);
  group.add(sun);
  group.add(sun.target);

  const hemi = new THREE.HemisphereLight(
    new THREE.Color(def.skyHorizon),
    new THREE.Color(def.terrain),
    night ? 0.28 : cloudy ? 0.7 : 0.55
  );
  group.add(hemi);
  const ambient = new THREE.AmbientLight(night ? 0x2b3446 : 0xffffff, night ? 0.35 : 0.28);
  group.add(ambient);

  const rain = rainSystem();
  group.add(rain.points);
  rain.points.visible = weather === "rain";

  scene.fog = new THREE.FogExp2(new THREE.Color(def.fog), wet || cloudilyFog(weather) ? 0.0018 : night ? 0.0012 : 0.0007);
  scene.background = new THREE.Color(def.skyHorizon);
  scene.add(group);

  const update = (focus: THREE.Vector3, elapsed: number, dt: number) => {
    sun.position.set(focus.x + sunOffset.x, focus.y + sunOffset.y, focus.z + sunOffset.z);
    sun.target.position.copy(focus);
    sun.target.updateMatrixWorld();
    cloudLayer.children.forEach((child, i) => {
      child.position.x += dt * (1.2 + (i % 5) * 0.35);
      if (child.position.x > 1100) child.position.x = -1100;
    });
    if (rain.points.visible) {
      rain.points.position.set(focus.x, focus.y, focus.z);
      for (let i = 0; i < rain.count; i += 1) {
        rain.positions[i * 3 + 1] -= rain.velocities[i] * dt;
        rain.positions[i * 3] -= 5 * dt;
        if (rain.positions[i * 3 + 1] < 0) {
          rain.positions[i * 3 + 1] = 38;
          rain.positions[i * 3] = (Math.random() - 0.5) * 120;
          rain.positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
        }
      }
      (rain.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    }
    if (def.theme === "coast") {
      const seaMeshGroup = seaMesh;
      if (seaMeshGroup) {
        seaMeshGroup.children[0].position.y = -2.4 + Math.sin(elapsed * 0.5) * 0.06;
      }
    }
  };

  const setRain = (on: boolean) => {
    rain.points.visible = on;
  };

  const dispose = () => {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.Sprite) {
        child.geometry?.dispose();
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          if (mat) {
            const map = (mat as THREE.MeshStandardMaterial).map;
            if (map) map.dispose();
            mat.dispose();
          }
        });
      }
    });
  };

  return { group, sun, update, setRain, dispose };
};

const cloudilyFog = (weather: Weather) => weather === "overcast" || weather === "rain";
