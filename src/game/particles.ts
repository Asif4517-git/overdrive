import * as THREE from "three";

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
  gravity: number;
  drag: number;
}

const vertexShader = `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vAlpha = aAlpha;
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (280.0 / max(1.0, -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dist = length(uv);
    float soft = smoothstep(0.5, 0.04, dist);
    if (vAlpha <= 0.001 || soft <= 0.001) discard;
    gl_FragColor = vec4(vColor, soft * vAlpha);
  }
`;

export class ParticlePool {
  readonly points: THREE.Points;
  private particles: Particle[];
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private alphas: Float32Array;
  private cursor = 0;
  private max: number;

  constructor(max: number, additive = true) {
    this.max = max;
    this.particles = Array.from({ length: max }, () => ({
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      life: 0,
      maxLife: 1,
      size: 0.2,
      color: new THREE.Color(0xffffff),
      gravity: 0,
      drag: 0.96,
    }));
    this.positions = new Float32Array(max * 3);
    this.colors = new Float32Array(max * 3);
    this.sizes = new Float32Array(max);
    this.alphas = new Float32Array(max);
    for (let i = 0; i < max; i += 1) {
      this.positions[i * 3 + 1] = -1000;
      this.alphas[i] = 0;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(this.sizes, 1));
    geometry.setAttribute("aAlpha", new THREE.BufferAttribute(this.alphas, 1));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(this.colors, 3));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4000);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(geometry, material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 4;
  }

  spawn(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    options: {
      size?: number;
      life?: number;
      color?: THREE.ColorRepresentation;
      gravity?: number;
      drag?: number;
    } = {}
  ) {
    const index = this.cursor;
    this.cursor = (this.cursor + 1) % this.max;
    const particle = this.particles[index];
    particle.position.copy(position);
    particle.velocity.copy(velocity);
    particle.maxLife = options.life ?? 0.8;
    particle.life = particle.maxLife;
    particle.size = options.size ?? 0.35;
    particle.color.set(options.color ?? 0xffffff);
    particle.gravity = options.gravity ?? 0;
    particle.drag = options.drag ?? 0.94;
  }

  update(dt: number) {
    const positionAttr = this.points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const colorAttr = this.points.geometry.getAttribute("aColor") as THREE.BufferAttribute;
    const sizeAttr = this.points.geometry.getAttribute("aSize") as THREE.BufferAttribute;
    const alphaAttr = this.points.geometry.getAttribute("aAlpha") as THREE.BufferAttribute;
    for (let i = 0; i < this.max; i += 1) {
      const particle = this.particles[i];
      if (particle.life <= 0) {
        this.alphas[i] = 0;
        continue;
      }
      particle.life -= dt;
      const fraction = Math.max(0, particle.life / particle.maxLife);
      particle.velocity.y -= particle.gravity * dt;
      particle.velocity.multiplyScalar(Math.pow(particle.drag, dt * 60));
      particle.position.addScaledVector(particle.velocity, dt);
      this.positions[i * 3] = particle.position.x;
      this.positions[i * 3 + 1] = particle.position.y;
      this.positions[i * 3 + 2] = particle.position.z;
      this.colors[i * 3] = particle.color.r;
      this.colors[i * 3 + 1] = particle.color.g;
      this.colors[i * 3 + 2] = particle.color.b;
      this.sizes[i] = particle.size * (0.65 + fraction * 0.8);
      this.alphas[i] = fraction * fraction;
    }
    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
  }

  clear() {
    this.particles.forEach((particle) => {
      particle.life = 0;
    });
    this.alphas.fill(0);
  }

  dispose() {
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}
