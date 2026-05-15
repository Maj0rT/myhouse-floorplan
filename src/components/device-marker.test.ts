import { describe, it, expect, beforeEach, vi } from 'vitest';
import './device-marker.js';
import type { DeviceMarker } from './device-marker.js';
import type { HassEntity } from '../types.js';

async function nextRender(el: HTMLElement): Promise<void> {
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
}

function makeEntity(id: string, state: string, attributes = {}): HassEntity {
  return { entity_id: id, state, attributes };
}

describe('device-marker', () => {
  let el: DeviceMarker;

  beforeEach(() => {
    el = document.createElement('myhouse-device-marker') as DeviceMarker;
    document.body.appendChild(el);
  });

  it('renders without crashing when entity is missing', async () => {
    el.entity = undefined;
    el.position = { x: 50, y: 50 };
    await nextRender(el);
    expect(el.shadowRoot?.querySelector('.marker')).toBeTruthy();
  });

  it('positions itself absolutely at the configured percent', async () => {
    el.entity = makeEntity('light.a', 'on');
    el.position = { x: 25, y: 75 };
    await nextRender(el);
    const marker = el.shadowRoot?.querySelector('.marker') as HTMLElement;
    expect(marker.style.left).toBe('25%');
    expect(marker.style.top).toBe('75%');
  });

  it('emits marker-click on click with the entity id', async () => {
    el.entity = makeEntity('light.a', 'on');
    el.position = { x: 10, y: 10 };
    await nextRender(el);
    const listener = vi.fn();
    el.addEventListener('marker-click', listener);
    const marker = el.shadowRoot?.querySelector('.marker') as HTMLElement;
    marker.click();
    expect(listener).toHaveBeenCalled();
    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(event.detail.entityId).toBe('light.a');
  });

  it('shows label override when provided', async () => {
    el.entity = makeEntity('light.a', 'on', { friendly_name: 'Kueche' });
    el.position = { x: 0, y: 0 };
    el.label = 'Custom Label';
    await nextRender(el);
    const label = el.shadowRoot?.querySelector('.label');
    expect(label?.textContent?.trim()).toBe('Custom Label');
  });

  it('shows friendly_name when label is not set', async () => {
    el.entity = makeEntity('light.a', 'on', { friendly_name: 'Kueche' });
    el.position = { x: 0, y: 0 };
    await nextRender(el);
    const label = el.shadowRoot?.querySelector('.label');
    expect(label?.textContent?.trim()).toBe('Kueche');
  });

  it('uses icon override when provided', async () => {
    el.entity = makeEntity('light.a', 'on');
    el.position = { x: 0, y: 0 };
    el.icon = 'mdi:custom-floor-icon';
    await nextRender(el);
    const haIcon = el.shadowRoot?.querySelector('ha-icon');
    expect(haIcon?.getAttribute('icon')).toBe('mdi:custom-floor-icon');
  });

  it('falls back to state-display icon when icon prop is empty', async () => {
    el.entity = makeEntity('light.a', 'on');
    el.position = { x: 0, y: 0 };
    el.icon = '';
    await nextRender(el);
    const haIcon = el.shadowRoot?.querySelector('ha-icon');
    expect(haIcon?.getAttribute('icon')).toBe('mdi:lightbulb');
  });
});
