import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { CarSpec, Quality } from "./types";
import { CAR_DESIGNS } from "./carDesigns";
import type { CarDesign } from "./carDesigns";

export interface VehicleVisual {
  root: THREE.Group;
  body: THREE.Group;
  wheels: {
    steer: THREE.Group;
    spin: THREE.Group;
    front: boolean;
    side: -1 | 1;
    baseY: number;
  }[];
  interior: THREE.Group;
  brakeMaterials: THREE.MeshBasicMaterial[];
  headlightMaterial: THREE.MeshStandardMaterial;
  reverseMaterial: THREE.MeshBasicMaterial;
  setLights: (on: boolean) => void;
  setBrake: (braking: boolean) => void;
  setSteer: (angle: number) => void;
  setSpin: (angle: number) => void;
  setPosition: (pos: THREE.Vector3, heading: number) => void;
  showInterior: (visible: boolean) => void;
  wheelState: () => {
    front: boolean;
    side: number;
    steerY: number;
    spinX: number;
    contactY: number;
    radius: number;
    position: [number, number, number];
  }[];
  wheelRadius: number;
  cockpit: THREE.Vector3;
  design: CarDesign;
  dispose: () => void;
}

const shadowTexture = (() => {
  let cached: THREE.Texture | null = null;
  return () => {
    if (cached) return cached;
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(64, 128, 4, 64, 128, 120);
      gradient.addColorStop(0, "rgba(0,0,0,0.72)");
      gradient.addColorStop(0.55, "rgba(0,0,0,0.36)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 256);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    cached = texture;
    return texture;
  };
})();

const grilleTexture = (style: CarDesign["grille"], accent: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.fillStyle = "#111315";
  ctx.fillRect(0, 0, 256, 128);
  if (style === "hex") {
    ctx.strokeStyle = "#3a3f43";
    ctx.lineWidth = 2;
    for (let y = -8; y < 140; y += 14) {
      for (let x = -8; x < 264; x += 22) {
        const offset = (Math.floor(y / 14) % 2) * 11;
        ctx.beginPath();
        for (let i = 0; i < 6; i += 1) {
          const angle = (Math.PI / 3) * i + Math.PI / 6;
          const px = x + offset + Math.cos(angle) * 9;
          const py = y + Math.sin(angle) * 9;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  } else if (style === "slats" || style === "chromeBar") {
    for (let y = 8; y < 128; y += 18) {
      ctx.fillStyle = "#24272a";
      ctx.fillRect(0, y, 256, 9);
      ctx.fillStyle = "rgba(196,199,200,0.85)";
      ctx.fillRect(0, y, 256, 2);
    }
  } else if (style === "kidney") {
    ctx.fillStyle = "#0d0f10";
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = "#2d3134";
    ctx.lineWidth = 3;
    for (let x = 6; x < 256; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 128);
      ctx.stroke();
    }
  } else {
    ctx.strokeStyle = "rgba(180,184,186,0.25)";
    ctx.lineWidth = 1;
    for (let x = 0; x < 256; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 40, 128);
      ctx.stroke();
    }
  }
  void accent;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

const lineMaterial = new THREE.LineBasicMaterial({ color: 0x14171a });

export const createVehicleVisual = (car: CarSpec, options: { quality: Quality; isPlayer: boolean }): VehicleVisual => {
  void options.quality;
  const design = CAR_DESIGNS[car.id];
  const root = new THREE.Group();
  const chassis = new THREE.Group();
  const exterior = new THREE.Group();
  const interior = new THREE.Group();
  chassis.add(exterior, interior);
  interior.visible = false;
  root.add(chassis);
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const track = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const keep = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const paint = keep(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(car.color),
      metalness: car.body === "offroad" || car.body === "suv" ? 0.42 : 0.62,
      roughness: car.body === "offroad" || car.body === "suv" ? 0.36 : 0.26,
      clearcoat: 0.95,
      clearcoatRoughness: 0.07,
      envMapIntensity: 1.05,
    })
  );
  const paintDark = keep(
    new THREE.MeshStandardMaterial({ color: new THREE.Color(car.color).multiplyScalar(0.42), metalness: 0.5, roughness: 0.42 })
  );
  const carbon = keep(new THREE.MeshStandardMaterial({ color: 0x141618, metalness: 0.55, roughness: 0.36 }));
  const matteBlack = keep(new THREE.MeshStandardMaterial({ color: 0x1b1e21, metalness: 0.2, roughness: 0.78 }));
  const cladding = keep(new THREE.MeshStandardMaterial({ color: 0x232629, roughness: 0.88, metalness: 0.08 }));
  const chrome = keep(new THREE.MeshStandardMaterial({ color: 0xc3c8cb, metalness: 0.98, roughness: 0.12, envMapIntensity: 1.5 }));
  const glass = keep(
    new THREE.MeshPhysicalMaterial({
      color: 0x101a22,
      metalness: 0.7,
      roughness: 0.07,
      clearcoat: 1,
      envMapIntensity: 0.85,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    })
  );
  const tyre = keep(new THREE.MeshStandardMaterial({ color: 0x121416, roughness: 0.95, metalness: 0.02 }));
  const rimMetal = keep(new THREE.MeshStandardMaterial({ color: new THREE.Color(car.wheelColor), metalness: 0.9, roughness: 0.3, envMapIntensity: 1.1 }));
  const rimBright = keep(new THREE.MeshStandardMaterial({ color: 0xa8adb0, metalness: 0.95, roughness: 0.22, envMapIntensity: 1.2 }));
  const disc = keep(new THREE.MeshStandardMaterial({ color: 0x8d9194, metalness: 0.95, roughness: 0.4 }));
  const caliper = keep(new THREE.MeshStandardMaterial({ color: new THREE.Color(design.caliperColor), metalness: 0.6, roughness: 0.35 }));
  const headlightMaterial = keep(
    new THREE.MeshStandardMaterial({
      color: 0xdfe8ec,
      emissive: new THREE.Color(0xf6f9ff),
      emissiveIntensity: 0.55,
      metalness: 0.4,
      roughness: 0.18,
    })
  );
  const drlMaterial = keep(new THREE.MeshBasicMaterial({ color: 0xf3f7ff, toneMapped: false }));
  const tailMaterial = keep(
    new THREE.MeshStandardMaterial({
      color: 0x7c1718,
      emissive: new THREE.Color(0xff2418),
      emissiveIntensity: 0.45,
      roughness: 0.24,
      metalness: 0.25,
    })
  );
  const brakeMaterials: THREE.MeshBasicMaterial[] = [
    keep(new THREE.MeshBasicMaterial({ color: 0x5c1010 })),
    keep(new THREE.MeshBasicMaterial({ color: 0x300808 })),
  ];
  const reverseMaterial = keep(new THREE.MeshBasicMaterial({ color: 0xd6d8d4 }));
  const indicatorMaterial = keep(new THREE.MeshBasicMaterial({ color: 0x9a6b16 }));
  const interiorMat = keep(new THREE.MeshStandardMaterial({ color: 0x2c3034, roughness: 0.9 }));
  const seatMat = keep(new THREE.MeshStandardMaterial({ color: 0x3a3d40, roughness: 0.92 }));
  const screenMat = keep(new THREE.MeshBasicMaterial({ color: 0x38464e }));
  const accentMat = keep(new THREE.MeshBasicMaterial({ color: new THREE.Color(car.accent), toneMapped: false }));

  const L = design.length;
  const W = design.width;
  const wheelR = design.wheelRadius;
  const lowerY = design.lowerY;
  const box = (
    w: number,
    h: number,
    d: number,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    radius = 0.05,
    parent: THREE.Object3D = exterior,
    rotation?: [number, number, number]
  ) => {
    const geo = track(new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 2.3, h / 2.3, d / 2.3)));
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // ---------------- Body shell: extruded silhouette with wheel arches ------
  const topCurve = new THREE.SplineCurve(design.top.map(([z, y]) => new THREE.Vector2(z, y)));
  const topPoints = topCurve.getPoints(84);
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(design.top[0][0], lowerY);
  bodyShape.lineTo(topPoints[0].x, topPoints[0].y);
  for (let i = 1; i < topPoints.length; i += 1) bodyShape.lineTo(topPoints[i].x, topPoints[i].y);
  bodyShape.lineTo(topPoints[topPoints.length - 1].x, lowerY);

  const archPoints = (wheelZ: number) => {
    const dx = Math.sqrt(Math.max(0.001, design.archRadius * design.archRadius - (lowerY - wheelR) ** 2));
    const startAngle = Math.atan2(lowerY - wheelR, -dx);
    const endAngle = Math.atan2(lowerY - wheelR, dx);
    const points: [number, number][] = [];
    const steps = 22;
    for (let i = 0; i <= steps; i += 1) {
      const angle = startAngle + (endAngle - startAngle) * (i / steps);
      points.push([wheelZ + Math.cos(angle) * design.archRadius, wheelR + Math.sin(angle) * design.archRadius]);
    }
    return points;
  };
  fromRearToFront(bodyShape, [
    archPoints(design.rearWheelZ),
    archPoints(design.frontWheelZ),
  ], lowerY);
  bodyShape.closePath();

  const bodyDepth = W * 0.93;
  const bodyGeo = track(
    new THREE.ExtrudeGeometry(bodyShape, {
      depth: bodyDepth,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.022,
      bevelThickness: 0.03,
      curveSegments: 8,
    })
  );
  bodyGeo.rotateY(-Math.PI / 2);
  bodyGeo.translate(bodyDepth / 2, 0, 0);
  bodyGeo.computeVertexNormals();
  const bodyMesh = new THREE.Mesh(bodyGeo, paint);
  bodyMesh.castShadow = true;
  exterior.add(bodyMesh);

  // Rocker / sill between the arches.
  const rockerZ = (design.rearWheelZ + design.frontWheelZ) / 2;
  const rockerLength = Math.abs(design.frontWheelZ - design.rearWheelZ) - design.archRadius * 2;
  box(W - 0.02, 0.11, rockerLength, design.darkCladding ? cladding : carbon, 0, lowerY + 0.04, rockerZ, 0.02);

  // Subtle shoulder character line.
  [-1, 1].forEach((side) => {
    box(0.012, 0.018, L * 0.62, matteBlack, side * (W / 2 + 0.001), design.beltY - 0.15, 0, 0.004);
  });

  // ---------------- Cabin, glass and roof ---------------------------------
  const cabinWidth = design.cabin.width;
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(design.cabin.frontZ, design.beltY - 0.03);
  cabinShape.quadraticCurveTo(design.cabin.frontZ - 0.08, design.beltY + (design.cabin.roofY - design.beltY) * 0.62, design.cabin.roofFrontZ, design.cabin.roofY);
  cabinShape.lineTo(design.cabin.roofRearZ, design.cabin.roofY);
  cabinShape.quadraticCurveTo(design.cabin.rearZ + 0.12, design.beltY + (design.cabin.roofY - design.beltY) * 0.48, design.cabin.rearZ, design.beltY - 0.03);
  cabinShape.closePath();
  const cabinGeo = track(
    new THREE.ExtrudeGeometry(cabinShape, {
      depth: cabinWidth,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.02,
      bevelThickness: 0.022,
      curveSegments: 10,
    })
  );
  cabinGeo.rotateY(-Math.PI / 2);
  cabinGeo.translate(cabinWidth / 2, 0, 0);
  cabinGeo.computeVertexNormals();
  const cabin = new THREE.Mesh(cabinGeo, paint);
  cabin.castShadow = true;
  exterior.add(cabin);

  const sidePanel = (points: [number, number][], side: -1 | 1, material: THREE.Material, offset = 0.004) => {
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i += 1) shape.lineTo(points[i][0], points[i][1]);
    shape.closePath();
    const geo = track(new THREE.ShapeGeometry(shape));
    const mesh = new THREE.Mesh(geo, material);
    if (side === 1) {
      mesh.rotation.y = Math.PI / 2;
      mesh.scale.x = -1;
    } else {
      mesh.rotation.y = -Math.PI / 2;
    }
    mesh.position.x = side * (cabinWidth / 2 + offset + 0.018);
    exterior.add(mesh);
    return mesh;
  };

  const glassTrim: [number, number][][] = [];
  const glassBacking = keep(new THREE.MeshBasicMaterial({ color: 0x181f25, side: THREE.DoubleSide }));
  sidePanel(design.glassFront, 1, glassBacking, 0.006);
  sidePanel(design.glassFront, -1, glassBacking, 0.006);
  sidePanel(design.glassFront, 1, glass);
  sidePanel(design.glassFront, -1, glass);
  glassTrim.push(design.glassFront);
  if (design.glassRear) {
    sidePanel(design.glassRear, 1, glassBacking, 0.006);
    sidePanel(design.glassRear, -1, glassBacking, 0.006);
    sidePanel(design.glassRear, 1, glass);
    sidePanel(design.glassRear, -1, glass);
    glassTrim.push(design.glassRear);
  }

  // Black window surrounds.
  glassTrim.forEach((points) => {
    [-1, 1].forEach((side) => {
      const loopPoints = points.map(
        ([z, y]) => new THREE.Vector3(side * (cabinWidth / 2 + 0.008), y, z)
      );
      loopPoints.push(loopPoints[0].clone());
      const geo = track(new THREE.BufferGeometry().setFromPoints(loopPoints));
      exterior.add(new THREE.Line(geo, lineMaterial));
    });
  });

  const glassQuad = (front: boolean) => {
    const yBottom = design.beltY + 0.035;
    const yTop = design.cabin.roofY - 0.025;
    const inset = cabinWidth / 2 - 0.09;
    const bottomZ = front ? design.cabin.frontZ - 0.05 : design.cabin.rearZ + 0.05;
    const topZ = front ? design.cabin.roofFrontZ + 0.03 : design.cabin.roofRearZ - 0.03;
    const verts = [
      -inset, yBottom, bottomZ,
      inset, yBottom, bottomZ,
      inset, yTop, topZ,
      -inset, yTop, topZ,
    ];
    const geo = track(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(front ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, glass);
    exterior.add(mesh);
  };
  glassQuad(true);
  glassQuad(false);

  // Roof panel, optionally carbon.
  const roofMat = design.features.carbonRoof ? carbon : paint;
  const roof = box(
    cabinWidth * 0.9,
    0.045,
    Math.abs(design.cabin.roofRearZ - design.cabin.roofFrontZ) * 0.92,
    roofMat,
    0,
    design.cabin.roofY + 0.02,
    (design.cabin.roofFrontZ + design.cabin.roofRearZ) / 2,
    0.035
  );
  roof.castShadow = true;

  // Pillars between the glass panes.
  if (design.features.blackPillar) {
    const pillar = geometryPillar(design, cabinWidth);
    [-1, 1].forEach((side) => {
      const mesh = new THREE.Mesh(track(new THREE.BoxGeometry(0.05, design.cabin.roofY - design.beltY + 0.1, 0.1)), carbon);
      mesh.position.set(side * (cabinWidth / 2 - 0.02), (design.beltY + design.cabin.roofY) / 2, pillar.z);
      mesh.rotation.x = pillar.tilt;
      exterior.add(mesh);
    });
  }
  if (design.glassRear) {
    const bZ = (design.glassFront[3][0] + design.glassRear[0][0]) / 2;
    [-1, 1].forEach((side) => {
      box(0.045, design.cabin.roofY - design.beltY - 0.02, 0.075, carbon, side * (cabinWidth / 2 - 0.005), (design.beltY + design.cabin.roofY) / 2 - 0.03, bZ, 0.01);
    });
  }

  // Door shut lines, handles, mirrors.
  [-1, 1].forEach((side) => {
    const x = side * (W / 2 + 0.004);
    const seam1 = design.cabin.frontZ - 0.02;
    const seam2 = design.glassFront[3][0];
    box(0.012, design.beltY - lowerY - 0.06, 0.014, carbon, x, (design.beltY + lowerY) / 2, seam1, 0.004);
    box(0.012, design.beltY - lowerY - 0.06, 0.014, carbon, x, (design.beltY + lowerY) / 2, seam2, 0.004);
    box(0.014, 0.008, Math.abs(seam1 - seam2), carbon, x, design.beltY - 0.12, (seam1 + seam2) / 2, 0.004);
    box(0.03, 0.035, 0.22, design.features.chromeTrim ? chrome : paintDark, side * (W / 2 + 0.02), design.beltY - 0.17, (seam1 + seam2) / 2 - 0.12, 0.012);
    box(0.03, 0.032, 0.2, design.features.chromeTrim ? chrome : paintDark, side * (W / 2 + 0.02), design.beltY - 0.17, design.glassRear ? design.glassRear[3][0] - 0.25 : -1.2, 0.012);
    // Mirror.
    box(0.06, 0.035, 0.1, carbon, side * (W / 2 + 0.03), design.beltY + 0.01, design.cabin.frontZ - 0.1, 0.01);
    box(0.17, 0.09, 0.15, paint, side * (W / 2 + 0.12), design.beltY + 0.03, design.cabin.frontZ - 0.12, 0.03);
    box(0.13, 0.065, 0.012, glass, side * (W / 2 + 0.12), design.beltY + 0.03, design.cabin.frontZ - 0.2, 0.01);
  });

  // ---------------- Wheel arch flares ------------------------------------
  const flareMaterial = design.darkCladding ? cladding : paint;
  [design.frontWheelZ, design.rearWheelZ].forEach((wheelZ) => {
    [-1, 1].forEach((side) => {
      const geo = track(new THREE.TorusGeometry(design.archRadius + 0.005, design.darkCladding ? 0.04 : 0.026, 6, 26, Math.PI));
      const flare = new THREE.Mesh(geo, flareMaterial);
      flare.rotation.y = side * (Math.PI / 2);
      flare.position.set(side * (bodyDepth / 2 + 0.012), wheelR, wheelZ);
      flare.castShadow = true;
      exterior.add(flare);
    });
  });

  // ---------------- Front end --------------------------------------------
  const noseZ = design.top[0][0];
  const tailZ = design.top[design.top.length - 1][0];
  const noseY = design.top[0][1];
  const rearY = design.top[design.top.length - 1][1];
  const grilleMat = keep(
    new THREE.MeshStandardMaterial({
      map: grilleTexture(design.grille, car.accent),
      metalness: 0.5,
      roughness: 0.55,
      color: 0xffffff,
    })
  );

  if (design.grille === "kidney") {
    const grilleCenterY = (noseY + design.beltY) / 2;
    [-1, 1].forEach((side) => {
      box(0.34, 0.4, 0.07, design.features.blackGrille ? carbon : matteBlack, side * 0.21, grilleCenterY, noseZ - 0.012, 0.075);
      box(0.31, 0.36, 0.03, grilleMat, side * 0.21, grilleCenterY, noseZ + 0.026, 0.04);
      for (let i = 0; i < 4; i += 1) {
        box(0.29, 0.012, 0.012, chrome, side * 0.21, grilleCenterY - 0.13 + i * 0.085, noseZ + 0.045, 0.003);
      }
    });
    box(0.9, 0.05, 0.16, carbon, 0, noseY - 0.28, noseZ - 0.02, 0.02);
  } else {
    const gWidth = design.grille === "round" ? W * 0.62 : W * 0.6;
    box(gWidth + 0.06, 0.34, 0.06, design.features.blackGrille ? carbon : matteBlack, 0, (noseY + design.beltY) / 2 - 0.04, noseZ - 0.01, 0.05);
    box(gWidth, 0.28, 0.05, grilleMat, 0, (noseY + design.beltY) / 2 - 0.04, noseZ + 0.025, 0.03);
    if (design.grille === "chromeBar" || design.features.chromeTrim) {
      box(gWidth + 0.1, 0.045, 0.05, chrome, 0, (noseY + design.beltY) / 2 + 0.14, noseZ + 0.03, 0.015);
    }
  }
  if (design.features.splitter) {
    box(W * 0.98, 0.045, 0.32, carbon, 0, lowerY + 0.005, noseZ - 0.12, 0.015);
  }
  box(W * 0.96, 0.26, 0.22, paint, 0, lowerY + 0.18, noseZ - 0.02, 0.07);
  [-1, 1].forEach((side) => {
    box(0.22, 0.14, 0.18, carbon, side * W * 0.33, lowerY + 0.13, noseZ - 0.09, 0.03);
    if (design.features.foglights) {
      const fog = new THREE.Mesh(track(new THREE.CylinderGeometry(0.055, 0.055, 0.03, 16)), drlMaterial);
      fog.rotation.x = Math.PI / 2;
      fog.position.set(side * W * 0.33, lowerY + 0.15, noseZ + 0.005);
      exterior.add(fog);
    }
  });

  const headlight = (side: number) => {
    const x = side * W * 0.335;
    const y = noseY - 0.06;
    if (design.headlights === "round") {
      const ring = new THREE.Mesh(track(new THREE.TorusGeometry(0.105, 0.014, 8, 24)), chrome);
      ring.position.set(x, y, noseZ + 0.005);
      exterior.add(ring);
      const lens = new THREE.Mesh(track(new THREE.CylinderGeometry(0.095, 0.095, 0.04, 24)), headlightMaterial);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(x, y, noseZ + 0.005);
      exterior.add(lens);
      return;
    }
    const slim = design.headlights === "slim" || design.headlights === "led";
    box(slim ? 0.52 : 0.46, slim ? 0.1 : 0.14, 0.09, headlightMaterial, x, y, noseZ - 0.01, 0.025, exterior, [0, side * -0.12, 0]);
    box(slim ? 0.4 : 0.34, slim ? 0.022 : 0.032, 0.035, drlMaterial, x, y - (slim ? 0.02 : 0.03), noseZ + 0.03, 0.01, exterior, [0, side * -0.12, 0]);
    if (design.headlights === "led") {
      for (let i = 0; i < 4; i += 1) {
        box(0.055, 0.055, 0.035, drlMaterial, x - 0.15 + i * 0.1, y + 0.015, noseZ + 0.045, 0.01);
      }
    }
  };
  headlight(-1);
  headlight(1);

  if (design.features.sideIntakes) {
    [-1, 1].forEach((side) => {
      box(0.05, 0.2, 0.5, carbon, side * (W / 2 + 0.005), design.beltY - 0.25, design.cabin.rearZ + 0.1, 0.02);
      box(0.02, 0.14, 0.34, matteBlack, side * (W / 2 + 0.03), design.beltY - 0.25, design.cabin.rearZ + 0.1, 0.01);
    });
  }
  if (design.features.hoodVents) {
    [-1, 1].forEach((side) => {
      box(0.24, 0.016, 0.4, carbon, side * 0.4, noseY + 0.006, design.cabin.frontZ + 0.55, 0.02);
    });
  }
  if (design.features.hoodScoop) {
    box(0.46, 0.09, 0.44, paintDark, 0, noseY + 0.045, design.cabin.frontZ + 0.42, 0.04);
    box(0.36, 0.03, 0.06, matteBlack, 0, noseY + 0.075, design.cabin.frontZ + 0.64, 0.01);
  }

  // ---------------- Rear end ---------------------------------------------
  box(W * 0.97, 0.24, 0.2, paint, 0, lowerY + 0.2, tailZ + 0.04, 0.06);
  const tailY = rearY - 0.06;
  [-1, 1].forEach((side) => {
    const x = side * W * 0.33;
    if (design.taillights === "quad") {
      [0, 1].forEach((i) => {
        const lens = new THREE.Mesh(track(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 20)), tailMaterial);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(x + side * (i === 0 ? -0.11 : 0.11), tailY, tailZ + 0.01);
        exterior.add(lens);
      });
    } else {
      const slim = design.taillights === "slim";
      box(slim ? 0.48 : 0.4, slim ? 0.075 : 0.12, 0.07, tailMaterial, x, tailY, tailZ + 0.015, 0.025, exterior, [0, side * 0.1, 0]);
      box(0.34, 0.035, 0.04, brakeMaterials[0], x, tailY - 0.045, tailZ + 0.045, 0.01);
    }
    box(0.1, 0.055, 0.03, reverseMaterial, side * W * 0.12, design.beltY - 0.35, tailZ + 0.055, 0.01);
    box(0.07, 0.045, 0.03, indicatorMaterial, side * W * 0.44, design.beltY - 0.38, tailZ + 0.05, 0.01);
  });
  if (design.features.diffuser) {
    box(W * 0.86, 0.13, 0.24, carbon, 0, lowerY + 0.02, tailZ + 0.09, 0.025);
    for (let i = -2; i <= 2; i += 1) {
      box(0.025, 0.12, 0.22, matteBlack, i * W * 0.14, lowerY + 0.015, tailZ + 0.1, 0.005);
    }
  }
  const exhaustCount = design.features.quadExhaust ? 4 : design.features.twinExhaust || car.body === "suv" || car.body === "super" ? 2 : 0;
  for (let i = 0; i < exhaustCount; i += 1) {
    const pipe = new THREE.Mesh(track(new THREE.CylinderGeometry(0.055, 0.06, 0.16, 12)), chrome);
    pipe.rotation.x = Math.PI / 2;
    const spread = exhaustCount === 4 ? 0.26 : 0.4;
    pipe.position.set((i - (exhaustCount - 1) / 2) * spread * 2, lowerY + 0.12, tailZ + 0.07);
    exterior.add(pipe);
  }
  if (design.features.bigWing) {
    const wingY = design.cabin.roofY + 0.13;
    [-1, 1].forEach((side) => {
      box(0.05, 0.28, 0.16, carbon, side * W * 0.32, wingY - 0.14, tailZ - 0.12, 0.01);
    });
    box(W * 0.86, 0.045, 0.36, carbon, 0, wingY, tailZ - 0.16, 0.015);
    box(W * 0.86, 0.02, 0.05, accentMat, 0, wingY + 0.035, tailZ - 0.3, 0.005);
  } else if (design.features.lipSpoiler) {
    box(W * 0.72, 0.035, 0.18, design.features.carbonRoof ? carbon : paint, 0, rearY + 0.01, tailZ + 0.16, 0.015);
  }
  box(0.42, 0.1, 0.02, new THREE.MeshStandardMaterial({ color: 0xe9e6dc, roughness: 0.7 }), 0, lowerY + 0.16, tailZ - 0.02, 0.01);

  if (design.features.roofRails) {
    [-1, 1].forEach((side) => {
      box(0.045, 0.055, Math.abs(design.cabin.roofRearZ - design.cabin.roofFrontZ) * 0.9, matteBlack, side * (cabinWidth * 0.38), design.cabin.roofY + 0.06, (design.cabin.roofFrontZ + design.cabin.roofRearZ) / 2, 0.015);
    });
  }
  if (design.features.sideSteps) {
    [-1, 1].forEach((side) => {
      box(0.2, 0.055, 1.9, matteBlack, side * (W / 2 + 0.05), lowerY - 0.03, 0, 0.015);
    });
  }
  if (design.features.spareWheel) {
    const spare = new THREE.Mesh(track(new THREE.CylinderGeometry(wheelR * 0.98, wheelR * 0.98, 0.24, 26)), tyre);
    spare.rotation.x = Math.PI / 2;
    spare.position.set(0, lowerY + wheelR * 0.9, tailZ - 0.2);
    exterior.add(spare);
    const spareRim = new THREE.Mesh(track(new THREE.CylinderGeometry(wheelR * 0.55, wheelR * 0.55, 0.26, 20)), rimMetal);
    spareRim.rotation.x = Math.PI / 2;
    spareRim.position.copy(spare.position);
    exterior.add(spareRim);
  }
  if (design.features.antenna) {
    const antenna = new THREE.Mesh(track(new THREE.CylinderGeometry(0.012, 0.006, 0.34, 6)), matteBlack);
    antenna.position.set(0, design.cabin.roofY + 0.19, design.cabin.roofRearZ + 0.16);
    antenna.rotation.x = 0.18;
    exterior.add(antenna);
  }

  // ---------------- Shadow ------------------------------------------------
  const shadowMat = keep(
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, opacity: 0.55, depthWrite: false })
  );
  const shadow = new THREE.Mesh(track(new THREE.PlaneGeometry(W * 1.5, design.shadowLength * 1.06)), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  root.add(shadow);

  // ---------------- Wheels -------------------------------------------------
  const wheels: VehicleVisual["wheels"] = [];
  const wheelAssembly = (side: -1 | 1, front: boolean) => {
    const steer = new THREE.Group();
    steer.position.set(side * (design.track / 2), wheelR, front ? design.frontWheelZ : design.rearWheelZ);
    const spin = new THREE.Group();
    steer.add(spin);
    root.add(steer);

    // Tyre geometry is rotated so its axle is the local X axis. Rolling is
    // therefore rotation about X — never Z.
    const tyreGeo = track(new THREE.CylinderGeometry(wheelR, wheelR, design.wheelWidth, 32));
    tyreGeo.rotateZ(Math.PI / 2);
    const tyreMesh = new THREE.Mesh(tyreGeo, tyre);
    tyreMesh.castShadow = true;
    spin.add(tyreMesh);
    if (design.wheelStyle === "offroad") {
      for (let i = 0; i < 18; i += 1) {
        const lug = new THREE.Mesh(track(new THREE.BoxGeometry(design.wheelWidth + 0.02, 0.045, 0.07)), tyre);
        lug.rotation.x = (i / 18) * Math.PI * 2;
        lug.position.y = Math.cos((i / 18) * Math.PI * 2) * (wheelR - 0.01);
        lug.position.z = Math.sin((i / 18) * Math.PI * 2) * (wheelR - 0.01);
        lug.rotation.x = -(i / 18) * Math.PI * 2;
        spin.add(lug);
      }
    }

    const rimRadius = wheelR * 0.66;
    const barrel = new THREE.Mesh(track(new THREE.CylinderGeometry(rimRadius, rimRadius, design.wheelWidth * 0.86, 28)), rimMetal);
    barrel.geometry.rotateZ(Math.PI / 2);
    spin.add(barrel);
    const face = new THREE.Mesh(track(new THREE.CylinderGeometry(rimRadius * 0.97, rimRadius * 0.97, 0.018, 28)), rimMetal);
    face.geometry.rotateZ(Math.PI / 2);
    face.position.x = side * (design.wheelWidth * 0.5);
    spin.add(face);

    const spokeCount =
      design.wheelStyle === "multi5"
        ? 5
        : design.wheelStyle === "multi10"
          ? 10
          : design.wheelStyle === "twin5"
            ? 10
            : design.wheelStyle === "turbine"
              ? 12
              : 5;
    for (let i = 0; i < spokeCount; i += 1) {
      const angle = (i / spokeCount) * Math.PI * 2;
      const spokeLength = rimRadius * 0.82;
      const spoke = new THREE.Mesh(track(new THREE.BoxGeometry(0.032, spokeLength, rimRadius * (design.wheelStyle === "multi5" || design.wheelStyle === "twin5" ? 0.2 : 0.12))), rimBright);
      spoke.position.set(side * (design.wheelWidth * 0.52), Math.cos(angle) * (spokeLength / 2 + 0.015), Math.sin(angle) * (spokeLength / 2 + 0.015));
      spoke.rotation.x = -angle;
      if (design.wheelStyle === "twin5") spoke.rotation.x += 0.07;
      spin.add(spoke);
    }
    if (design.wheelStyle !== "centerlock") {
      for (let i = 0; i < 5; i += 1) {
        const bolt = new THREE.Mesh(track(new THREE.CylinderGeometry(0.014, 0.014, 0.015, 8)), chrome);
        bolt.rotation.z = Math.PI / 2;
        const boltAngle = (i / 5) * Math.PI * 2;
        bolt.position.set(side * (design.wheelWidth * 0.47), Math.cos(boltAngle) * rimRadius * 0.3, Math.sin(boltAngle) * rimRadius * 0.3);
        spin.add(bolt);
      }
    } else {
      const nut = new THREE.Mesh(track(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 6)), accentMat);
      nut.geometry.rotateZ(Math.PI / 2);
      nut.position.x = side * (design.wheelWidth * 0.48);
      spin.add(nut);
    }
    // Rim outer lip.
    const lip = new THREE.Mesh(track(new THREE.TorusGeometry(rimRadius * 0.98, 0.016, 6, 30)), rimMetal);
    lip.rotation.y = Math.PI / 2;
    lip.position.x = side * (design.wheelWidth * 0.52);
    spin.add(lip);

    // Brake disc and caliper stay with the upright (they do not spin).
    const brakeDisc = new THREE.Mesh(track(new THREE.CylinderGeometry(rimRadius * 0.82, rimRadius * 0.82, 0.018, 22)), disc);
    brakeDisc.geometry.rotateZ(Math.PI / 2);
    brakeDisc.position.x = side * (design.wheelWidth * 0.1);
    steer.add(brakeDisc);
    const brakeCaliper = new THREE.Mesh(track(new RoundedBoxGeometry(0.07, 0.12, 0.06, 2, 0.02)), caliper);
    brakeCaliper.position.set(side * (design.wheelWidth * 0.12), wheelR * 0.28, -wheelR * 0.42);
    steer.add(brakeCaliper);

    // Small inner fender, kept behind the wheel so it never occludes it.
    const liner = new THREE.Mesh(track(new THREE.CylinderGeometry(design.archRadius - 0.03, design.archRadius - 0.03, 0.04, 16, 1, true, 0, Math.PI)), matteBlack);
    liner.geometry.rotateZ(Math.PI / 2);
    liner.position.set(side * (bodyDepth / 2 - 0.06), wheelR, front ? design.frontWheelZ : design.rearWheelZ);
    liner.material.side = THREE.DoubleSide;
    exterior.add(liner);

    wheels.push({ steer, spin, front, side, baseY: wheelR });
  };
  wheelAssembly(-1, true);
  wheelAssembly(1, true);
  wheelAssembly(-1, false);
  wheelAssembly(1, false);

  // ---------------- Cockpit interior --------------------------------------
  const eye = design.cockpit;
  const dashZ = design.cabin.frontZ - 0.45;
  const dash = new THREE.Mesh(track(new THREE.BoxGeometry(cabinWidth - 0.18, 0.12, 0.32)), interiorMat);
  dash.position.set(0, design.beltY - 0.02, dashZ);
  interior.add(dash);
  const topPad = new THREE.Mesh(track(new THREE.BoxGeometry(cabinWidth - 0.26, 0.045, 0.2)), interiorMat);
  topPad.position.set(0, design.beltY + 0.05, dashZ - 0.01);
  interior.add(topPad);
  const cluster = new THREE.Mesh(track(new THREE.BoxGeometry(0.3, 0.1, 0.02)), screenMat);
  cluster.position.set(eye.x, design.beltY + 0.08, dashZ - 0.14);
  cluster.rotation.x = -0.28;
  interior.add(cluster);
  const wheelRing = new THREE.Mesh(track(new THREE.TorusGeometry(0.14, 0.017, 8, 26)), interiorMat);
  wheelRing.position.set(eye.x, design.beltY - 0.13, dashZ - 0.3);
  wheelRing.rotation.x = -0.22;
  interior.add(wheelRing);
  for (let i = 0; i < 3; i += 1) {
    const spoke = new THREE.Mesh(track(new THREE.BoxGeometry(0.24, 0.015, 0.015)), matteBlack);
    spoke.position.copy(wheelRing.position);
    spoke.rotation.z = (i / 3) * Math.PI;
    spoke.rotation.x = -0.22;
    interior.add(spoke);
  }
  [-0.34, 0.34].forEach((x) => {
    const seat = new THREE.Mesh(track(new THREE.BoxGeometry(0.44, 0.1, 0.46)), seatMat);
    seat.position.set(x, design.beltY - 0.26, dashZ - 0.6);
    interior.add(seat);
    const back = new THREE.Mesh(track(new THREE.BoxGeometry(0.44, 0.56, 0.12)), seatMat);
    back.position.set(x, design.beltY + 0.01, dashZ - 0.84);
    back.rotation.x = -0.12;
    interior.add(back);
  });
  const consoleMesh = new THREE.Mesh(track(new THREE.BoxGeometry(0.2, 0.22, 0.7)), interiorMat);
  consoleMesh.position.set(0, design.beltY - 0.2, dashZ - 0.34);
  interior.add(consoleMesh);
  const shifter = new THREE.Mesh(track(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8)), matteBlack);
  shifter.position.set(0, design.beltY - 0.08, dashZ - 0.2);
  interior.add(shifter);
  const mirror = new THREE.Mesh(track(new THREE.BoxGeometry(0.24, 0.055, 0.025)), screenMat);
  mirror.position.set(0, design.cabin.roofY - 0.12, dashZ + 0.02);
  interior.add(mirror);
  [-1, 1].forEach((side) => {
    const pillar = new THREE.Mesh(track(new THREE.BoxGeometry(0.05, design.cabin.roofY - design.beltY, 0.05)), interiorMat);
    pillar.position.set(side * (cabinWidth / 2 - 0.05), (design.beltY + design.cabin.roofY) / 2 + 0.08, dashZ + 0.04);
    pillar.rotation.x = -0.25;
    interior.add(pillar);
  });

  // Headlights for the player only, to limit expensive spot lights.
  const spot = new THREE.SpotLight(0xfff1d6, 0, 95, 0.5, 0.65, 1.2);
  spot.position.set(0, noseY + 0.1, noseZ - 0.1);
  const target = new THREE.Object3D();
  target.position.set(0, 0.2, noseZ + 16);
  root.add(target);
  spot.target = target;
  root.add(spot);

  const setLights = (on: boolean) => {
    headlightMaterial.emissiveIntensity = on ? 2.1 : 0.55;
    drlMaterial.color.setHex(on ? 0xffffff : 0xd5e0e6);
    spot.intensity = options.isPlayer && on ? 160 : 0;
    tailMaterial.emissiveIntensity = on ? 0.7 : 0.45;
  };
  const setBrake = (braking: boolean) => {
    brakeMaterials[0].color.setHex(braking ? 0xff3b2c : 0x5c1010);
    brakeMaterials[1].color.setHex(braking ? 0xff5040 : 0x300808);
    tailMaterial.emissiveIntensity = braking ? 1.7 : 0.5;
  };
  const setSteer = (angle: number) => {
    wheels.forEach((wheel) => {
      if (wheel.front) wheel.steer.rotation.y = angle;
    });
  };
  const setSpin = (angle: number) => {
    // Tyre axle is X. Rolling must be about X.
    wheels.forEach((wheel) => {
      wheel.spin.rotation.x = -angle;
    });
  };
  const setPosition = (pos: THREE.Vector3, heading: number) => {
    root.position.set(pos.x, pos.y, pos.z);
    root.rotation.y = heading;
  };
  const showInterior = (visible: boolean) => {
    interior.visible = visible;
    exterior.visible = !visible;
  };
  const wheelState = () =>
    wheels.map((wheel) => {
      const world = new THREE.Vector3();
      wheel.steer.getWorldPosition(world);
      return {
        front: wheel.front,
        side: wheel.side,
        steerY: +wheel.steer.rotation.y.toFixed(4),
        spinX: +wheel.spin.rotation.x.toFixed(4),
        contactY: +(world.y - design.wheelRadius).toFixed(4),
        radius: design.wheelRadius,
        position: [world.x, world.y, world.z] as [number, number, number],
      };
    });

  return {
    root,
    body: chassis,
    wheels,
    interior,
    brakeMaterials,
    headlightMaterial,
    reverseMaterial,
    setLights,
    setBrake,
    setSteer,
    setSpin,
    setPosition,
    showInterior,
    wheelState,
    wheelRadius: design.wheelRadius,
    cockpit: new THREE.Vector3(eye.x, eye.y, eye.z),
    design,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
};

const geometryPillar = (design: CarDesign, cabinWidth: number) => {
  void cabinWidth;
  return { z: design.cabin.frontZ - 0.32, tilt: -0.3 };
};

/** Fill the bottom of a car silhouette with arch cut-outs, rear → front. */
function fromRearToFront(shape: THREE.Shape, arches: [number, number][][], _sill: number) {
  const ordered = [...arches].sort((a, b) => a[0][0] - b[0][0]);
  ordered.forEach((arc) => {
    const first = arc[0];
    shape.lineTo(first[0], first[1]);
    for (let i = 1; i < arc.length; i += 1) {
      shape.lineTo(arc[i][0], arc[i][1]);
    }
  });
  const lastArc = ordered[ordered.length - 1];
  void lastArc;
}
