import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { CarSpec, Quality } from "../types";
import { createVehicleVisual } from "../carModel";

const studioEnvironment = (renderer: THREE.WebGLRenderer) => {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const scene = new THREE.Scene();
  const background = new THREE.Mesh(
    new THREE.SphereGeometry(40, 20, 14),
    new THREE.MeshBasicMaterial({ color: 0x1b1e22, side: THREE.BackSide })
  );
  scene.add(background);
  const panels: [number, number, number, number, number, number][] = [
    [-12, 10, -10, 24, 14, 0xffffff],
    [13, 7, -5, 16, 10, 0xdbe6ee],
    [0, 14, 2, 18, 6, 0xffffff],
    [-8, 4, 14, 14, 6, 0x7d8b96],
    [10, 5, 12, 10, 5, 0xffe9cf],
  ];
  panels.forEach(([x, y, z, w, h, color]) => {
    const material = new THREE.MeshBasicMaterial({ color });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    panel.position.set(x, y, z);
    panel.lookAt(0, 2, 0);
    scene.add(panel);
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshBasicMaterial({ color: 0x2b3036 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2;
  scene.add(floor);
  const texture = pmrem.fromScene(scene, 0.04).texture;
  pmrem.dispose();
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    }
  });
  return texture;
};

const studioFloorTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(256, 256, 30, 256, 256, 250);
    gradient.addColorStop(0, "#363b41");
    gradient.addColorStop(0.55, "#22262b");
    gradient.addColorStop(1, "#111315");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 1;
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
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

export type ViewerAngle = "front" | "threequarter" | "side" | "rear";

const ANGLES: Record<ViewerAngle, number> = {
  front: 0.18,
  threequarter: 0.68,
  side: Math.PI * 0.5,
  rear: Math.PI,
};

interface ViewerProps {
  car: CarSpec;
  quality: Quality;
  angle: ViewerAngle;
  autoRotate?: boolean;
  height?: number;
  onReady?: () => void;
}

export const VehicleViewer = ({ car, quality, angle, autoRotate = false, height = 420, onReady }: ViewerProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [dragging, setDragging] = useState(false);
  const userAngle = useRef(0);
  const autoRef = useRef(0);
  const zoomRef = useRef(1);
  const angleRef = useRef(angle);

  useEffect(() => {
    angleRef.current = angle;
  }, [angle]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      setError(true);
      return;
    }
    const width = Math.max(1, host.clientWidth);
    const heightPx = Math.max(1, host.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === "high" ? 2 : 1.4));
    renderer.setSize(width, heightPx);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("aria-label", `${car.make} ${car.model} interactive 3D model`);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.environment = studioEnvironment(renderer);
    scene.environmentIntensity = 0.85;
    const camera = new THREE.PerspectiveCamera(34, width / heightPx, 0.1, 100);

    const floorTexture = studioFloorTexture();
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(9, 64),
      new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.42, metalness: 0.25, envMapIntensity: 0.4 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Turntable markings.
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(3.35, 3.4, 96),
      new THREE.MeshBasicMaterial({ color: 0x5d646b, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.012;
    scene.add(ring);

    const visual = createVehicleVisual(car, { quality, isPlayer: true });
    visual.setPosition(new THREE.Vector3(0, 0, 0), 0);
    visual.setLights(true);
    visual.setBrake(false);
    visual.setSteer(0.14);
    scene.add(visual.root);

    const hemi = new THREE.HemisphereLight(0xdfe7ee, 0x22262a, 0.8);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(5, 8, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(quality === "high" ? 1024 : 512, quality === "high" ? 1024 : 512);
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -6;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc9d8e4, 0.9);
    fill.position.set(-6, 4, 3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xfff0d8, 1.1);
    rim.position.set(1, 5, -7);
    scene.add(rim);

    let frame = 0;
    let last = performance.now();
    const resize = () => {
      if (!host) return;
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    // Pointer orbit.
    let pointerDown = false;
    let startX = 0;
    let baseUser = 0;
    const onPointerDown = (event: PointerEvent) => {
      pointerDown = true;
      startX = event.clientX;
      baseUser = userAngle.current;
      setDragging(true);
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!pointerDown) return;
      userAngle.current = baseUser + (event.clientX - startX) * 0.008;
    };
    const onPointerUp = () => {
      pointerDown = false;
      setDragging(false);
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomRef.current = THREE.MathUtils.clamp(zoomRef.current + event.deltaY * 0.0012, 0.72, 1.6);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (autoRotate) autoRef.current += dt * 0.28;
      if (!pointerDown) userAngle.current *= Math.exp(-dt * 0.6);
      const target = (angleRef.current !== undefined ? ANGLES[angleRef.current] : Math.PI * 0.8) + userAngle.current + autoRef.current;
      const eased = THREE.MathUtils.lerp(camera.userData.angle ?? target, target, 1 - Math.exp(-6 * dt));
      camera.userData.angle = eased;
      const radius = 7.4 * zoomRef.current;
      camera.position.set(Math.sin(eased) * radius, 2.25 * zoomRef.current + 0.35, Math.cos(eased) * radius);
      const targetPoint = new THREE.Vector3(0, 0.62, 0);
      camera.lookAt(targetPoint);
      visual.setSpin(0);
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(loop);
    onReady?.();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      visual.dispose();
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      floorTexture.dispose();
      scene.environment?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
      scene.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [car.id, quality, autoRotate, angle]);

  return (
    <div className="relative overflow-hidden border border-[var(--line)] bg-[#0b0d0f]" style={{ height }}>
      <div ref={hostRef} className="absolute inset-0" style={{ cursor: dragging ? "grabbing" : "grab" }} />
      {error && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <div>
            <p className="text-[0.8rem] font-semibold text-white">3D preview unavailable</p>
            <p className="mt-1 text-[0.66rem] text-[var(--muted)]">Your browser could not start WebGL. The car remains selectable and drivable.</p>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
        <span className="chip chip-accent">3D model</span>
        <span className="section-label !text-[0.45rem]">Drag to orbit · scroll to zoom</span>
      </div>
    </div>
  );
};
