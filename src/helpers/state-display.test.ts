import { describe, it, expect } from 'vitest';
import { getStateDisplay } from './state-display.js';
import type { HassEntity } from '../types.js';

function makeEntity(id: string, state: string, attributes = {}): HassEntity {
  return { entity_id: id, state, attributes };
}

describe('getStateDisplay', () => {
  it('returns unavailable display when entity is undefined', () => {
    const result = getStateDisplay(undefined);
    expect(result.icon).toBe('mdi:help-circle-outline');
    expect(result.color).toContain('error');
  });

  it('returns unavailable display when state is unavailable', () => {
    const result = getStateDisplay(makeEntity('light.a', 'unavailable'));
    expect(result.icon).toBe('mdi:alert-circle');
    expect(result.color).toContain('error');
  });

  it('returns on color for light in on state', () => {
    const result = getStateDisplay(makeEntity('light.a', 'on'));
    expect(result.icon).toBe('mdi:lightbulb');
    expect(result.color).toContain('active');
  });

  it('returns off color for light in off state', () => {
    const result = getStateDisplay(makeEntity('light.a', 'off'));
    expect(result.color).not.toContain('active');
  });

  it('uses custom icon from entity attributes', () => {
    const result = getStateDisplay(makeEntity('light.a', 'on', { icon: 'mdi:custom' }));
    expect(result.icon).toBe('mdi:custom');
  });

  it('returns switch icon for switch domain', () => {
    const result = getStateDisplay(makeEntity('switch.a', 'on'));
    expect(result.icon).toBe('mdi:toggle-switch');
  });

  it('returns binary_sensor icon and state-based color', () => {
    const onResult = getStateDisplay(makeEntity('binary_sensor.a', 'on'));
    expect(onResult.icon).toBe('mdi:radiobox-marked');
    expect(onResult.color).toContain('active');

    const offResult = getStateDisplay(makeEntity('binary_sensor.a', 'off'));
    expect(offResult.color).not.toContain('active');
  });

  it('returns sensor text with unit', () => {
    const result = getStateDisplay(
      makeEntity('sensor.temp', '21.5', { unit_of_measurement: '°C' })
    );
    expect(result.text).toBe('21.5 °C');
  });

  it('returns sensor text without unit when none', () => {
    const result = getStateDisplay(makeEntity('sensor.count', '42'));
    expect(result.text).toBe('42');
  });

  it('returns open shutter icon and on color when cover is open', () => {
    const result = getStateDisplay(makeEntity('cover.a', 'open'));
    expect(result.icon).toBe('mdi:window-shutter-open');
    expect(result.color).toContain('active');
  });

  it('returns closed shutter icon and off color when cover is closed', () => {
    const result = getStateDisplay(makeEntity('cover.a', 'closed'));
    expect(result.icon).toBe('mdi:window-shutter');
    expect(result.color).not.toContain('active');
  });

  it('uses open icon for cover with position > 0 even if state is "closed"', () => {
    const result = getStateDisplay(
      makeEntity('cover.a', 'closed', { current_position: 50 }),
    );
    expect(result.icon).toBe('mdi:window-shutter-open');
    expect(result.color).toContain('active');
  });

  it('ignores entity.attributes.icon for cover (homematic sets static window-shutter)', () => {
    const result = getStateDisplay(
      makeEntity('cover.a', 'open', { icon: 'mdi:window-shutter' }),
    );
    expect(result.icon).toBe('mdi:window-shutter-open');
  });

  it('falls back for unknown domain', () => {
    const result = getStateDisplay(makeEntity('weird.thing', 'foo'));
    expect(result.icon).toBe('mdi:eye');
  });
});
