import { describe, it, expect, beforeEach, vi } from 'vitest';
import './floorplan-card.js';
import type { FloorplanCard } from './floorplan-card.js';
import type { FloorplanConfig, HomeAssistant } from './types.js';

async function nextRender(el: HTMLElement): Promise<void> {
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
}

function makeHass(): HomeAssistant {
  return {
    states: {
      'light.kueche': {
        entity_id: 'light.kueche',
        state: 'on',
        attributes: { friendly_name: 'Kueche' },
      },
      'switch.tv': {
        entity_id: 'switch.tv',
        state: 'off',
        attributes: { friendly_name: 'TV' },
      },
    },
    callService: vi.fn().mockResolvedValue(undefined),
  };
}

describe('floorplan-card', () => {
  let el: FloorplanCard;

  beforeEach(() => {
    el = document.createElement('myhouse-floorplan') as FloorplanCard;
    document.body.appendChild(el);
  });

  it('throws if config has no image', () => {
    expect(() =>
      el.setConfig({
        type: 'custom:myhouse-floorplan',
        markers: [],
        image: '',
      } as FloorplanConfig),
    ).toThrow();
  });

  it('renders markers for configured entities', async () => {
    const config: FloorplanConfig = {
      type: 'custom:myhouse-floorplan',
      image: '/test.png',
      markers: [
        { entity: 'light.kueche', x: 10, y: 20 },
        { entity: 'switch.tv', x: 30, y: 40 },
      ],
    };
    el.hass = makeHass();
    el.setConfig(config);
    await nextRender(el);
    const markers = el.shadowRoot?.querySelectorAll('myhouse-device-marker');
    expect(markers?.length).toBe(2);
  });

  it('renders the title when provided', async () => {
    el.setConfig({
      type: 'custom:myhouse-floorplan',
      image: '/test.png',
      title: 'Erdgeschoss',
      markers: [],
    });
    await nextRender(el);
    const title = el.shadowRoot?.querySelector('.title');
    expect(title?.textContent?.trim()).toBe('Erdgeschoss');
  });

  it('calls hass service when a marker is clicked', async () => {
    const hass = makeHass();
    el.hass = hass;
    el.setConfig({
      type: 'custom:myhouse-floorplan',
      image: '/test.png',
      markers: [{ entity: 'light.kueche', x: 10, y: 20 }],
    });
    await nextRender(el);
    const marker = el.shadowRoot?.querySelector('myhouse-device-marker') as HTMLElement;
    marker.dispatchEvent(
      new CustomEvent('marker-click', {
        detail: { entityId: 'light.kueche' },
        bubbles: true,
        composed: true,
      }),
    );
    await Promise.resolve();
    expect(hass.callService).toHaveBeenCalledWith('light', 'toggle', {
      entity_id: 'light.kueche',
    });
  });

  it('exposes getCardSize for lovelace', () => {
    expect(typeof el.getCardSize).toBe('function');
    expect(el.getCardSize()).toBeGreaterThan(0);
  });

  it('applies marker_background_opacity as CSS variable on ha-card', async () => {
    el.setConfig({
      type: 'custom:myhouse-floorplan',
      image: '/test.png',
      marker_background_opacity: 0.5,
      markers: [],
    });
    await nextRender(el);
    const haCard = el.shadowRoot?.querySelector('ha-card') as HTMLElement;
    expect(haCard.getAttribute('style') ?? '').toContain('--myhouse-marker-bg-opacity: 0.5');
  });

  it('falls back to default opacity 0.85 when not configured', async () => {
    el.setConfig({
      type: 'custom:myhouse-floorplan',
      image: '/test.png',
      markers: [],
    });
    await nextRender(el);
    const haCard = el.shadowRoot?.querySelector('ha-card') as HTMLElement;
    expect(haCard.getAttribute('style') ?? '').toContain('--myhouse-marker-bg-opacity: 0.85');
  });

  it('clamps opacity to the [0, 1] range', async () => {
    el.setConfig({
      type: 'custom:myhouse-floorplan',
      image: '/test.png',
      marker_background_opacity: 5,
      markers: [],
    });
    await nextRender(el);
    const haCard = el.shadowRoot?.querySelector('ha-card') as HTMLElement;
    expect(haCard.getAttribute('style') ?? '').toContain('--myhouse-marker-bg-opacity: 1');
  });
});
