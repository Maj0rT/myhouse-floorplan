import { describe, it, expect, vi } from 'vitest';
import { handleTap } from './service-call.js';
import type { HomeAssistant } from '../types.js';

function makeHass(): HomeAssistant {
  return {
    states: {},
    callService: vi.fn().mockResolvedValue(undefined),
  };
}

describe('handleTap', () => {
  it('does nothing on action "none"', async () => {
    const hass = makeHass();
    const fireEvent = vi.fn();
    await handleTap('light.a', 'none', hass, fireEvent);
    expect(hass.callService).not.toHaveBeenCalled();
    expect(fireEvent).not.toHaveBeenCalled();
  });

  it('fires hass-more-info event on action "more-info"', async () => {
    const hass = makeHass();
    const fireEvent = vi.fn();
    await handleTap('sensor.a', 'more-info', hass, fireEvent);
    expect(fireEvent).toHaveBeenCalledWith('hass-more-info', { entityId: 'sensor.a' });
    expect(hass.callService).not.toHaveBeenCalled();
  });

  it('calls light.toggle on toggle for a light', async () => {
    const hass = makeHass();
    const fireEvent = vi.fn();
    await handleTap('light.kueche', 'toggle', hass, fireEvent);
    expect(hass.callService).toHaveBeenCalledWith('light', 'toggle', {
      entity_id: 'light.kueche',
    });
  });

  it('calls switch.toggle on toggle for a switch', async () => {
    const hass = makeHass();
    await handleTap('switch.x', 'toggle', hass, vi.fn());
    expect(hass.callService).toHaveBeenCalledWith('switch', 'toggle', {
      entity_id: 'switch.x',
    });
  });

  it('calls cover.toggle on toggle for a cover', async () => {
    const hass = makeHass();
    await handleTap('cover.x', 'toggle', hass, vi.fn());
    expect(hass.callService).toHaveBeenCalledWith('cover', 'toggle', {
      entity_id: 'cover.x',
    });
  });

  it('falls back to more-info for sensor on toggle', async () => {
    const hass = makeHass();
    const fireEvent = vi.fn();
    await handleTap('sensor.temp', 'toggle', hass, fireEvent);
    expect(hass.callService).not.toHaveBeenCalled();
    expect(fireEvent).toHaveBeenCalledWith('hass-more-info', { entityId: 'sensor.temp' });
  });
});
