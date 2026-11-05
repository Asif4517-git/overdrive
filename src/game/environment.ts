import * as THREE from "three";
import type { Quality, TrackDef } from "./types";
import type { TrackModel } from "./track";
import {
  makeBillboardTexture,
  makeCanvasTexture,
  makeGlowTexture,
  makeRandom,
  makeSkylineTexture,
  makeWindowTexture,
} from "./textures";

export interface EnvironmentRig {
  group: THREE.Group;
  sun: THREE.DirectionalLight;
  update: (elapsed: number, dt: number, focus: THREE.Vector3) => void;
  setQuality: (quality: Quality) => void;
}

const buildSky = (def: TrackDef) => {
  const geometry = new THREE.SphereGeometry(1800, 32, 20);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: new THREE.Color(def.skyTop) },
      uHorizon: { value: new THREE.Color(def.skyHorizon) },
      uAccent: { value: new THREE.Color(def.accent) },
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
      uniform vec3 uAccent;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
        float horizon = smoothstep(0.35, 0.62, h) * (1.0 - smoothstep(0.58, 0.98, h));
        vec3 col = mix(uTop * 0.55, uHorizon, pow(smoothstep(0.32, 0.57, h), 1.4));
        col += uAccent * horizon * 0.14;
        col = mix(vec3(0.012, 0.012, 0.045), col, smoothstep(0.28, 0.5, h));
        float band = sin(vDir.y * 240.0 + vDir.x * 18.0) * 0.007;
        col += band * smoothstep(0.4, 0.6, h) * uAccent;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(geometry, material);
  sky.name = "sky";
  return sky;
};

const buildStars = () => {
  const rand = makeRandom(90210);
  const count = 900;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(rand() * 0.92);
    const radius = 1300 + rand() * 320;
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
    positions[i * 3 + 1] = Math.cos(phi) * radius + 120;
    positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
    const tint = rand();
    colors[i * 3] = tint > 0.75 ? 1 : 0.65;
    colors[i * 3 + 1] = tint > 0.75 ? 0.7 : 0.8;
    colors[i * 3 + 2] = 1;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 2.4,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    fog: false,
  });
  return new THREE.Points(geometry, material);
};

const buildSkylineRing = (def: TrackDef) => {
  const group = new THREE.Group();
  const texture = makeSkylineTexture(def.accent);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    fog: false,
    side: THREE.DoubleSide,
    opacity: 0.95,
  });
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2;
    const radius = 880;
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(560, 150), material);
    plane.position.set(Math.cos(angle) * radius, 28, Math.sin(angle) * radius);
    plane.rotation.y = -angle + Math.PI / 2;
    group.add(plane);
  }
  return group;
};

const buildGround = (def: TrackDef) => {
  const grid = makeCanvasTexture(
    512,
    512,
    (ctx) => {
      ctx.fillStyle = "#04050b";
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = "rgba(70,110,170,0.18)";
      ctx.lineWidth = 2;
      for (let i = 0; i <= 512; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }
      ctx.strokeStyle = def.accent;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 3;
      for (let i = 0; i <= 512; i += 128) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    { repeat: [80, 80] }
  );
  const material = new THREE.MeshStandardMaterial({
    map: grid,
    color: 0x3b4460,
    emissive: new THREE.Color(def.accent),
    emissiveMap: grid,
    emissiveIntensity: 0.32,
    metalness: 0.6,
    roughness: 0.55,
    envMapIntensity: 0.8,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2600, 2600), material);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.04;
  ground.receiveShadow = true;
  return ground;
};

interface TowerMatrix {
  position: THREE.Vector3;
  scale: THREE.Vector3;
  rotation: number;
  tint: THREE.Color;
}

const buildCity = (track: TrackModel, def: TrackDef, quality: Quality) => {
  const group = new THREE.Group();
  const rand = makeRandom(def.id === "mirage" ? 5512 : def.id === "skyway" ? 731 : 9901);
  const towers: TowerMatrix[] = [];
  const samples = track.samples;
  const stride = quality === "low" ? 12 : 6;
  for (let i = 0; i < samples.length; i += stride) {
    const sample = samples[i];
    for (const dir of [-1, 1]) {
      if (rand() < 0.3) continue;
      const distance = track.halfWidth + 15 + rand() * 85;
      const p = sample.pos.clone().addScaledVector(sample.side, dir * distance);
      const footprint = 9 + rand() * 17;
      const height = 22 + rand() * (def.id === "skyway" ? 90 : 145);
      towers.push({
        position: new THREE.Vector3(p.x, height / 2 - 0.2, p.z),
        scale: new THREE.Vector3(footprint, height, footprint * (0.6 + rand() * 0.8)),
        rotation: rand() * Math.PI,
        tint:
          rand() > 0.62
            ? new THREE.Color(def.accent2)
            : rand() > 0.4
              ? new THREE.Color(def.accent)
              : new THREE.Color(0x3d7dff),
      });
    }
  }
  // A distant mega-city fills the horizon without adding many draw calls.
  const farCount = quality === "low" ? 48 : 95;
  for (let i = 0; i < farCount; i += 1) {
    const angle = rand() * Math.PI * 2;
    const radius = 320 + rand() * 420;
    const height = 35 + rand() * 160;
    const footprint = 14 + rand() * 30;
    towers.push({
      position: new THREE.Vector3(Math.cos(angle) * radius, height / 2, Math.sin(angle) * radius),
      scale: new THREE.Vector3(footprint, height, footprint),
      rotation: rand() * Math.PI,
      tint: rand() > 0.5 ? new THREE.Color(def.accent) : new THREE.Color(def.accent2),
    });
  }

  const windowTextures = [
    makeWindowTexture(31, "#ffd9a0", "#a9e6ff", 7, 16),
    makeWindowTexture(74, "#ffb56b", "#7fdcff", 9, 22),
    makeWindowTexture(119, "#ff9ad5", "#9fd4ff", 6, 13),
  ];
  const towerMaterials = windowTextures.map(
    (texture) =>
      new THREE.MeshStandardMaterial({
        color: 0x0a0d18,
        metalness: 0.66,
        roughness: 0.38,
        emissive: new THREE.Color(0xffffff),
        emissiveMap: texture,
        emissiveIntensity: 1.05,
        envMapIntensity: 0.7,
      })
  );

  const batches = towerMaterials.map((material) => {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, Math.ceil(towers.length / 3) + 2);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    return mesh;
  });
  const batchCounts = [0, 0, 0];
  const dummy = new THREE.Object3D();

  const trimMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const trims = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.28, 1), trimMaterial, towers.length);
  const edges = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.2, 1, 0.2),
    new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
    towers.length * 2
  );
  let edgeIndex = 0;

  towers.forEach((tower, index) => {
    const batch = index % 3;
    dummy.position.copy(tower.position);
    dummy.scale.copy(tower.scale);
    dummy.rotation.set(0, tower.rotation, 0);
    dummy.updateMatrix();
    batches[batch].setMatrixAt(batchCounts[batch], dummy.matrix);
    batchCounts[batch] += 1;

    dummy.position.set(tower.position.x, tower.scale.y - 0.1, tower.position.z);
    dummy.scale.set(tower.scale.x * 1.025, 1, tower.scale.z * 1.025);
    dummy.rotation.set(0, tower.rotation, 0);
    dummy.updateMatrix();
    trims.setMatrixAt(index, dummy.matrix);
    trims.setColorAt(index, tower.tint);

    const cos = Math.cos(tower.rotation);
    const sin = Math.sin(tower.rotation);
    for (const corner of [-1, 1]) {
      const lx = (tower.scale.x / 2) * corner;
      const lz = (tower.scale.z / 2) * corner;
      dummy.position.set(
        tower.position.x + lx * cos - lz * sin,
        tower.position.y,
        tower.position.z + lx * sin + lz * cos
      );
      dummy.scale.set(1, tower.scale.y, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      edges.setMatrixAt(edgeIndex, dummy.matrix);
      edges.setColorAt(edgeIndex, tower.tint);
      edgeIndex += 1;
    }
  });
  batches.forEach((mesh, index) => {
    mesh.count = batchCounts[index];
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  });
  trims.instanceMatrix.needsUpdate = true;
  if (trims.instanceColor) trims.instanceColor.needsUpdate = true;
  edges.instanceMatrix.needsUpdate = true;
  if (edges.instanceColor) edges.instanceColor.needsUpdate = true;
  edges.castShadow = false;
  group.add(trims, edges);

  return group;
};

const buildStreetLights = (track: TrackModel, def: TrackDef) => {
  const group = new THREE.Group();
  const samples = track.samples;
  const stride = 10;
  const count = Math.floor(samples.length / stride) * 2;
  const poleMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a3044,
    metalness: 0.85,
    roughness: 0.3,
  });
  const poles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 6.4, 0.16), poleMaterial, count);
  const arms = new THREE.InstancedMesh(new THREE.BoxGeometry(2.2, 0.16, 0.16), poleMaterial, count);
  const heads = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.1, 0.18, 0.42),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(def.accent), toneMapped: false }),
    count
  );
  const dummy = new THREE.Object3D();
  const lightPositions: number[] = [];
  const lightColors: number[] = [];
  let index = 0;
  for (let i = 0; i < samples.length; i += stride) {
    const sample = samples[i];
    for (const dir of [-1, 1]) {
      const base = sample.pos.clone().addScaledVector(sample.side, dir * (track.halfWidth + 4.2));
      dummy.position.set(base.x, base.y + 3.2, base.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      poles.setMatrixAt(index, dummy.matrix);

      const armCenter = base.clone().addScaledVector(sample.side, -dir * 1.0);
      dummy.position.set(armCenter.x, base.y + 6.25, armCenter.z);
      dummy.rotation.set(0, Math.atan2(sample.side.x, sample.side.z), 0);
      dummy.updateMatrix();
      arms.setMatrixAt(index, dummy.matrix);

      const head = base.clone().addScaledVector(sample.side, -dir * 2.0);
      dummy.position.set(head.x, base.y + 6.14, head.z);
      dummy.rotation.set(0, Math.atan2(sample.side.x, sample.side.z), 0);
      dummy.updateMatrix();
      heads.setMatrixAt(index, dummy.matrix);

      lightPositions.push(head.x, head.y - 0.1, head.z);
      const color = new THREE.Color(dir > 0 ? def.accent : def.accent2);
      lightColors.push(color.r, color.g, color.b);
      index += 1;
    }
  }
  poles.count = index;
  arms.count = index;
  heads.count = index;
  poles.instanceMatrix.needsUpdate = true;
  arms.instanceMatrix.needsUpdate = true;
  heads.instanceMatrix.needsUpdate = true;
  group.add(poles, arms, heads);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(lightPositions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(lightColors, 3));
  const material = new THREE.PointsMaterial({
    size: 5.2,
    map: makeGlowTexture(),
    transparent: true,
    opacity: 0.6,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  group.add(new THREE.Points(geometry, material));
  return group;
};

const buildBillboards = (track: TrackModel, def: TrackDef) => {
  const group = new THREE.Group();
  const labels: [string, string][] = [
    ["NEON RUSH", "OWN THE NIGHT"],
    ["VELOCITY", "BEYOND LIMITS"],
    ["SYNTH FM", "88.8 // LIVE"],
    ["NIGHT DIVISION", "SPECTRE X"],
    ["AERO DYNAMICS", "VANTA GT"],
    ["TERMINAL 09", "NO BRAKES"],
  ];
  const rand = makeRandom(410);
  const postMaterial = new THREE.MeshStandardMaterial({
    color: 0x171b2a,
    metalness: 0.8,
    roughness: 0.35,
  });
  for (let i = 0; i < labels.length; i += 1) {
    const sample = track.samples[Math.floor(((i + 0.35) / labels.length) * track.samples.length)];
    const dir = i % 2 === 0 ? 1 : -1;
    const offset = track.halfWidth + 11 + rand() * 8;
    const height = 10 + rand() * 6;
    const base = sample.pos.clone().addScaledVector(sample.side, dir * offset);
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(17, 8.5),
      new THREE.MeshBasicMaterial({
        map: makeBillboardTexture(labels[i][0], labels[i][1], def.accent, def.accent2, i + 3),
        side: THREE.DoubleSide,
        toneMapped: false,
      })
    );
    panel.position.set(base.x, sample.pos.y + height, base.z);
    const normal = sample.side.clone().multiplyScalar(-dir);
    panel.rotation.y = Math.atan2(normal.x, normal.z);
    group.add(panel);

    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, height, 0.35), postMaterial);
      const offsetVec = new THREE.Vector3(
        Math.cos(panel.rotation.y) * side * 6.4,
        0,
        -Math.sin(panel.rotation.y) * side * 6.4
      );
      post.position.set(base.x + offsetVec.x, (sample.pos.y + height) / 2, base.z + offsetVec.z);
      group.add(post);
    }
  }
  return group;
};

const buildHolograms = (def: TrackDef) => {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(def.accent2),
    wireframe: true,
    transparent: true,
    opacity: 0.5,
    toneMapped: false,
  });
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(def.accent),
    transparent: true,
    opacity: 0.6,
    toneMapped: false,
  });
  const rand = makeRandom(8231);
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2 + 0.4;
    const radius = 210 + rand() * 150;
    const shape = new THREE.Mesh(new THREE.IcosahedronGeometry(13 + rand() * 12, 1), material);
    shape.position.set(Math.cos(angle) * radius, 38 + rand() * 55, Math.sin(angle) * radius);
    shape.userData.spin = 0.1 + rand() * 0.25;
    group.add(shape);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(58 + rand() * 30, 0.34, 8, 96), ringMaterial);
    ring.position.set(Math.cos(angle + 0.4) * (radius + 45), 30 + rand() * 30, Math.sin(angle + 0.4) * (radius + 45));
    ring.rotation.x = Math.PI / 2.1;
    ring.rotation.z = rand() * Math.PI;
    ring.userData.spin = 0.04 + rand() * 0.06;
    group.add(ring);
  }
  return group;
};

const buildCrossingTraffic = (def: TrackDef) => {
  const group = new THREE.Group();
  const rand = makeRandom(773);
  const geometry = new THREE.BoxGeometry(1.8, 0.4, 0.8);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(def.accent),
    toneMapped: false,
  });
  const traffic: { mesh: THREE.Mesh; radius: number; speed: number; height: number; phase: number }[] = [];
  for (let i = 0; i < 22; i += 1) {
    const mesh = new THREE.Mesh(geometry, material.clone());
    (mesh.material as THREE.MeshBasicMaterial).color.set(i % 2 === 0 ? def.accent : def.accent2);
    mesh.scale.setScalar(0.9 + rand() * 1.4);
    group.add(mesh);
    traffic.push({
      mesh,
      radius: 130 + rand() * 260,
      speed: 8 + rand() * 22,
      height: 45 + rand() * 85,
      phase: rand() * Math.PI * 2,
    });
  }
  return {
    group,
    update: (elapsed: number) => {
      traffic.forEach((item) => {
        const angle = item.phase + elapsed * (item.speed / item.radius);
        item.mesh.position.set(Math.cos(angle) * item.radius, item.height, Math.sin(angle) * item.radius);
        item.mesh.rotation.y = -angle + (item.speed > 0 ? 0 : Math.PI);
      });
    },
  };
};

export const createEnvironment = (
  track: TrackModel,
  scene: THREE.Scene,
  quality: Quality
): EnvironmentRig => {
  const group = new THREE.Group();
  group.name = "environment";
  const def = track.def;
  group.add(buildSky(def));
  group.add(buildStars());
  group.add(buildSkylineRing(def));
  group.add(buildGround(def));
  group.add(buildCity(track, def, quality));
  group.add(buildStreetLights(track, def));
  group.add(buildBillboards(track, def));
  group.add(buildHolograms(def));
  const traffic = buildCrossingTraffic(def);
  group.add(traffic.group);

  const moon = new THREE.Mesh(
    new THREE.CircleGeometry(34, 48),
    new THREE.MeshBasicMaterial({ color: 0xdfe8ff, fog: false, toneMapped: false })
  );
  moon.position.set(-620, 420, -900);
  moon.lookAt(0, 40, 0);
  group.add(moon);
  const moonGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture(),
      color: new THREE.Color(def.accent),
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    })
  );
  moonGlow.scale.setScalar(300);
  moonGlow.position.copy(moon.position);
  group.add(moonGlow);

  const sun = new THREE.DirectionalLight(0xb7c9ff, 2.1);
  sun.position.set(-120, 180, 90);
  sun.castShadow = quality !== "low";
  sun.shadow.mapSize.set(quality === "high" ? 2048 : 1024, quality === "high" ? 2048 : 1024);
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 340;
  sun.shadow.camera.left = -70;
  sun.shadow.camera.right = 70;
  sun.shadow.camera.top = 70;
  sun.shadow.camera.bottom = -70;
  sun.shadow.bias = -0.0005;
  group.add(sun);
  group.add(sun.target);

  const hemi = new THREE.HemisphereLight(0x5c4bb5, 0x05060b, 0.9);
  group.add(hemi);
  const ambient = new THREE.AmbientLight(0x2a2350, 1.1);
  group.add(ambient);

  // A few coloured fill lights make the car paint read against the dark city.
  for (let i = 0; i < 3; i += 1) {
    const light = new THREE.PointLight(
      new THREE.Color(i % 2 === 0 ? def.accent : def.accent2),
      26,
      70,
      2
    );
    const sample = track.samples[Math.floor(((i + 0.3) / 3) * track.samples.length)];
    const p = sample.pos.clone().addScaledVector(sample.side, (i % 2 === 0 ? 1 : -1) * (track.halfWidth + 3));
    light.position.set(p.x, sample.pos.y + 4, p.z);
    group.add(light);
  }

  // Ambient hazard pulses at a couple of corners.
  const beacons: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i += 1) {
    const sample = track.samples[Math.floor((i / 8) * track.samples.length)];
    const p = sample.pos.clone().addScaledVector(sample.side, (i % 2 === 0 ? 1 : -1) * (track.halfWidth + 2.9));
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xff6a2a, toneMapped: false })
    );
    beacon.position.set(p.x, p.y + 1.35, p.z);
    group.add(beacon);
    beacons.push(beacon);
  }

  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.frustumCulled = true;
    }
  });

  scene.fog = new THREE.FogExp2(new THREE.Color(def.fogColor), 0.00115);
  scene.add(group);

  const update = (elapsed: number, dt: number, focus: THREE.Vector3) => {
    sun.position.set(focus.x - 120, focus.y + 180, focus.z + 90);
    sun.target.position.set(focus.x, focus.y, focus.z);
    moonGlow.material.opacity = 0.34 + Math.sin(elapsed * 0.4) * 0.05;
    traffic.update(elapsed);
    group.children.forEach((child) => {
      if (child.userData.spin) {
        child.rotation.y += child.userData.spin * dt;
        child.rotation.x += child.userData.spin * 0.3 * dt;
      }
    });
    beacons.forEach((beacon, index) => {
      const material = beacon.material as THREE.MeshBasicMaterial;
      material.color.setHSL((0.03 + Math.sin(elapsed * 1.5 + index) * 0.03) % 1, 1, 0.55);
    });
  };

  const setQuality = (next: Quality) => {
    sun.castShadow = next !== "low";
    sun.shadow.mapSize.set(next === "low" ? 512 : next === "medium" ? 1024 : 2048, next === "low" ? 512 : next === "medium" ? 1024 : 2048);
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
  };

  return { group, sun, update, setQuality };
};
