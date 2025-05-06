// trilateration.ts
import { anchorPositions } from "./config";

export interface Point { x: number; y: number; }

/**
 * Perform 2D trilateration using distances from at least 3 anchors.
 * This implementation uses the first three available anchors.
 * Returns null if the geometry is degenerate.
 */
export function trilaterate(distances: { [anchorId: number]: number }): Point | null {
  const anchors = Object.keys(distances).map(Number);
  if (anchors.length < 3) {
    return null; // Need at least three anchors
  }
  
  // Use the first three anchors
  const [a1, a2, a3] = anchors;
  const p1 = anchorPositions[a1];
  const p2 = anchorPositions[a2];
  const p3 = anchorPositions[a3];
  const r1 = distances[a1];
  const r2 = distances[a2];
  const r3 = distances[a3];

  // Form linear equations by subtracting circle equations
  const A = 2 * (p2.x - p1.x);
  const B = 2 * (p2.y - p1.y);
  const C = r1 * r1 - r2 * r2 + (p2.x * p2.x - p1.x * p1.x) + (p2.y * p2.y - p1.y * p1.y);
  const D = 2 * (p3.x - p1.x);
  const E = 2 * (p3.y - p1.y);
  const F = r1 * r1 - r3 * r3 + (p3.x * p3.x - p1.x * p1.x) + (p3.y * p3.y - p1.y * p1.y);
  
  const denom = (A * E - B * D);
  if (denom === 0) return null; // Degenerate case
  const x = (C * E - B * F) / denom;
  const y = (A * F - C * D) / denom;
  return { x, y };
}
