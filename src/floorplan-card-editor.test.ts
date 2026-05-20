import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import './floorplan-card-editor.js';
import type { FloorplanCardEditor } from './floorplan-card-editor.js';
import type { FloorplanConfig, HomeAssistant } from './types.js';

async function nextRender(el: HTMLElement): Promise<void> {
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
}

function makeHass(): HomeAssistant {
  return {
    states: {
      'light.a': { entity_id: 'light.a', state: 'on', attributes: { friendly_name: 'A' } },
    },
    callService: vi.fn(),
    auth: { data: { access_token: 'TOK' } },
  };
}

describe('floorplan-card-editor', () => {
  let el: FloorplanCardEditor;

  beforeEach(() => {
    el = document.createElement('myhouse-floorplan-editor') as FloorplanCardEditor;
    el.hass = makeHass();
    document.body.appendChild(el);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders an image-upload section', async () => {
    el.setConfig({ type: 'custom:myhouse-floorplan', image: '', markers: [] });
    await nextRender(el);
    const upload = el.shadowRoot?.querySelector('.upload-section');
    expect(upload).toBeTruthy();
  });

  it('lists current markers from config', async () => {
    const config: FloorplanConfig = {
      type: 'custom:myhouse-floorplan',
      image: '/test.png',
      markers: [{ entity: 'light.a', x: 10, y: 20 }],
    };
    el.setConfig(config);
    await nextRender(el);
    const items = el.shadowRoot?.querySelectorAll('.marker-item');
    expect(items?.length).toBe(1);
  });

  it('emits config-changed when image-url is edited', async () => {
    el.setConfig({ type: 'custom:myhouse-floorplan', image: '', markers: [] });
    await nextRender(el);
    const listener = vi.fn();
    el.addEventListener('config-changed', listener);
    const input = el.shadowRoot?.querySelector('input[name="image"]') as HTMLInputElement;
    input.value = '/foo.png';
    input.dispatchEvent(new Event('input'));
    expect(listener).toHaveBeenCalled();
    const detail = (listener.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.config.image).toBe('/foo.png');
  });

  it('emits config-changed when entity is selected from picker', async () => {
    el.setConfig({ type: 'custom:myhouse-floorplan', image: '/test.png', markers: [] });
    await nextRender(el);
    const listener = vi.fn();
    el.addEventListener('config-changed', listener);
    el.shadowRoot
      ?.querySelector('myhouse-entity-picker-panel')
      ?.dispatchEvent(
        new CustomEvent('entity-selected', {
          detail: { entityId: 'light.a' },
          bubbles: true,
          composed: true,
        }),
      );
    expect(listener).toHaveBeenCalled();
    const detail = (listener.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.config.markers).toHaveLength(1);
    expect(detail.config.markers[0].entity).toBe('light.a');
  });

  it('removes a marker when its remove button is clicked', async () => {
    el.setConfig({
      type: 'custom:myhouse-floorplan',
      image: '/test.png',
      markers: [{ entity: 'light.a', x: 10, y: 20 }],
    });
    await nextRender(el);
    const listener = vi.fn();
    el.addEventListener('config-changed', listener);
    const btn = el.shadowRoot?.querySelector('.marker-item .remove') as HTMLButtonElement;
    btn.click();
    expect(listener).toHaveBeenCalled();
    const detail = (listener.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.config.markers).toHaveLength(0);
  });

  it('removes a marker in the preview when Delete is pressed', async () => {
    el.setConfig({
      type: 'custom:myhouse-floorplan',
      image: '/test.png',
      markers: [
        { entity: 'light.a', x: 10, y: 20 },
        { entity: 'switch.b', x: 30, y: 40 },
      ],
    });
    await nextRender(el);
    const listener = vi.fn();
    el.addEventListener('config-changed', listener);

    const markers = el.shadowRoot?.querySelectorAll(
      'myhouse-device-marker',
    ) as NodeListOf<HTMLElement>;
    markers[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, composed: true }),
    );

    expect(listener).toHaveBeenCalled();
    const detail = (listener.mock.calls.at(-1)![0] as CustomEvent).detail;
    expect(detail.config.markers).toHaveLength(1);
    expect(detail.config.markers[0].entity).toBe('switch.b');
  });

  it('updates marker position on drag', async () => {
    el.setConfig({
      type: 'custom:myhouse-floorplan',
      image: '/test.png',
      markers: [{ entity: 'light.a', x: 10, y: 20 }],
    });
    await nextRender(el);

    const floorImage = el.shadowRoot?.querySelector('myhouse-floor-image') as
      | (HTMLElement & { getImageRect(): DOMRect })
      | null;
    if (!floorImage) throw new Error('floor-image not rendered');
    floorImage.getImageRect = () =>
      ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect;

    const listener = vi.fn();
    el.addEventListener('config-changed', listener);

    const previewMarker = el.shadowRoot?.querySelectorAll(
      'myhouse-device-marker',
    )[0] as HTMLElement;
    const downEvent = new PointerEvent('pointerdown', {
      bubbles: true,
      composed: true,
      pointerId: 1,
    });
    previewMarker.dispatchEvent(downEvent);
    window.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 100, clientY: 50, pointerId: 1 }),
    );
    window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));

    const lastCall = listener.mock.calls.at(-1);
    expect(lastCall).toBeDefined();
    const detail = (lastCall![0] as CustomEvent).detail;
    expect(detail.config.markers[0].x).toBe(50);
    expect(detail.config.markers[0].y).toBe(50);
  });
});
