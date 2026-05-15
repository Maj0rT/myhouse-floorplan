import { describe, it, expect } from 'vitest';
import { clientCoordsToPercent } from './position-math.js';

const rect = { left: 100, top: 50, width: 200, height: 100 };

describe('clientCoordsToPercent', () => {
  it('returns 0/0 at top-left corner', () => {
    expect(clientCoordsToPercent(100, 50, rect)).toEqual({ x: 0, y: 0 });
  });

  it('returns 50/50 at the center', () => {
    expect(clientCoordsToPercent(200, 100, rect)).toEqual({ x: 50, y: 50 });
  });

  it('returns 100/100 at bottom-right corner', () => {
    expect(clientCoordsToPercent(300, 150, rect)).toEqual({ x: 100, y: 100 });
  });

  it('clamps to 0 when click is left of the image', () => {
    expect(clientCoordsToPercent(50, 100, rect).x).toBe(0);
  });

  it('clamps to 100 when click is right of the image', () => {
    expect(clientCoordsToPercent(500, 100, rect).x).toBe(100);
  });

  it('clamps to 0 when click is above the image', () => {
    expect(clientCoordsToPercent(200, 0, rect).y).toBe(0);
  });

  it('clamps to 100 when click is below the image', () => {
    expect(clientCoordsToPercent(200, 500, rect).y).toBe(100);
  });
});
