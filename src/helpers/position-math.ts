export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Percent {
  x: number;
  y: number;
}

export function clientCoordsToPercent(
  clientX: number,
  clientY: number,
  rect: Rect,
): Percent {
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;
  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
  };
}
