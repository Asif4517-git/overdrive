import type { TrackDef } from "./types";

export interface PreviewPath {
  points: { x: number; y: number }[];
  path: string;
  start: { x: number; y: number };
}

/** Lightweight 2D rendering of the same harmonics used by the 3D track builder. */
export const getTrackPreview = (def: TrackDef): PreviewPath => {
  const raw: { x: number; y: number }[] = [];
  const segments = 88;
  for (let i = 0; i < segments; i += 1) {
    const a = (i / segments) * Math.PI * 2;
    const radius =
      1 +
      def.harmonicA * Math.sin(3 * a + 0.55) +
      def.harmonicB * Math.cos(5 * a + 1.6) +
      def.harmonicB * 0.4 * Math.sin(7 * a - 0.4);
    raw.push({
      x: Math.cos(a) * def.rx * radius,
      y: Math.sin(a) * def.rz * radius,
    });
  }
  const minX = Math.min(...raw.map((point) => point.x));
  const maxX = Math.max(...raw.map((point) => point.x));
  const minY = Math.min(...raw.map((point) => point.y));
  const maxY = Math.max(...raw.map((point) => point.y));
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const points = raw.map((point) => ({
    x: 12 + ((point.x - minX) / spanX) * 76,
    y: 12 + ((point.y - minY) / spanY) * 76,
  }));
  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i <= points.length; i += 1) {
    const current = points[i % points.length];
    const next = points[(i + 1) % points.length];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    path += ` Q ${current.x.toFixed(2)} ${current.y.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`;
  }
  path += " Z";
  return { points, path, start: points[0] };
};
