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

  it('opens the camera-stream modal when a camera marker is clicked', async () => {
    const hass: HomeAssistant = {
      states: {
        'camera.flur': {
          entity_id: 'camera.flur',
          state: 'idle',
          attributes: {
            friendly_name: 'Kamera Flur',
            entity_picture: '/api/camera_proxy/camera.flur?token=tok1',
          },
        },
      },
      callService: vi.fn().mockResolvedValue(undefined),
    };
    el.hass = hass;
    el.setConfig({
      type: 'custom:myhouse-floorplan',
      image: '/test.png',
      markers: [{ entity: 'camera.flur', x: 10, y: 10 }],
    });
    await nextRender(el);

    const marker = el.shadowRoot?.querySelector('myhouse-device-marker') as HTMLElement;
    marker.dispatchEvent(
      new CustomEvent('marker-click', {
        detail: { entityId: 'camera.flur' },
        bubbles: true,
        composed: true,
      }),
    );
    await nextRender(el);

    const modal = el.shadowRoot?.querySelector('.camera-modal');
    expect(modal).toBeTruthy();
    const stream = el.shadowRoot?.querySelector(
      'ha-camera-stream',
    ) as HTMLElement & { stateObj?: { entity_id?: string } };
    expect(stream).toBeTruthy();
    expect(stream.stateObj?.entity_id).toBe('camera.flur');
    expect(hass.callService).not.toHaveBeenCalled();
  });

  it('closes the camera-stream modal when the close button is clicked', async () => {
    const hass: HomeAssistant = {
      states: {
        'camera.a': {
          entity_id: 'camera.a',
          state: 'idle',
          attributes: { entity_picture: '/api/camera_proxy/camera.a' },
        },
      },
      callService: vi.fn(),
    };
    el.hass = hass;
    el.setConfig({
      type: 'custom:myhouse-floorplan',
      image: '/test.png',
      markers: [{ entity: 'camera.a', x: 0, y: 0 }],
    });
    await nextRender(el);

    const marker = el.shadowRoot?.querySelector('myhouse-device-marker') as HTMLElement;
    marker.dispatchEvent(
      new CustomEvent('marker-click', {
        detail: { entityId: 'camera.a' },
        bubbles: true,
        composed: true,
      }),
    );
    await nextRender(el);
    expect(el.shadowRoot?.querySelector('.camera-modal')).toBeTruthy();

    const closeBtn = el.shadowRoot?.querySelector('.camera-modal-close') as HTMLButtonElement;
    closeBtn.click();
    await nextRender(el);
    expect(el.shadowRoot?.querySelector('.camera-modal')).toBeNull();
  });

  it('passes background_opacity from each marker through to the device-marker', async () => {
    el.hass = makeHass();
    el.setConfig({
      type: 'custom:myhouse-floorplan',
      image: '/test.png',
      markers: [
        { entity: 'light.kueche', x: 10, y: 20, background_opacity: 0.4 },
        { entity: 'switch.tv', x: 30, y: 40 },
      ],
    });
    await nextRender(el);
    const markers = el.shadowRoot?.querySelectorAll(
      'myhouse-device-marker',
    ) as NodeListOf<HTMLElement & { backgroundOpacity?: number }>;
    await (markers[0] as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    await (markers[1] as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(markers[0].backgroundOpacity).toBe(0.4);
    expect(markers[1].backgroundOpacity).toBeUndefined();
    const style0 = markers[0].shadowRoot?.querySelector('.marker')?.getAttribute('style') ?? '';
    const style1 = markers[1].shadowRoot?.querySelector('.marker')?.getAttribute('style') ?? '';
    expect(style0).toContain('--myhouse-marker-bg-opacity: 0.4');
    expect(style1).toContain('--myhouse-marker-bg-opacity: 0.85');
  });
});
