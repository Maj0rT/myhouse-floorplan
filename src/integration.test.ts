import { describe, it, expect, beforeEach, vi } from 'vitest';
import './floorplan-card.ts';
import type { FloorplanCard } from './floorplan-card.ts';
import type { HomeAssistant, HassEntity } from './types.ts';

async function awaitUpdate(el: HTMLElement): Promise<void> {
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
}

function makeEntity(id: string, state: string): HassEntity {
  return { entity_id: id, state, attributes: {} };
}

describe('hass state update propagates to marker icon color', () => {
  let card: FloorplanCard;

  beforeEach(() => {
    card = document.createElement('myhouse-floorplan') as FloorplanCard;
    document.body.appendChild(card);
  });

  it('changes the device-marker color when entity state flips', async () => {
    const initialHass: HomeAssistant = {
      states: { 'light.a': makeEntity('light.a', 'off') },
      callService: vi.fn().mockResolvedValue(undefined),
    };
    card.hass = initialHass;
    card.setConfig({
      type: 'custom:myhouse-floorplan',
      image: '/test.png',
      markers: [{ entity: 'light.a', x: 50, y: 50 }],
    });
    await awaitUpdate(card);

    const marker = card.shadowRoot?.querySelector('myhouse-device-marker') as HTMLElement;
    expect(marker).toBeTruthy();
    await awaitUpdate(marker);

    const iconDivOff = marker.shadowRoot?.querySelector('.icon') as HTMLElement;
    const styleOff = iconDivOff.getAttribute('style') ?? '';
    const haIconOff = iconDivOff.querySelector('ha-icon')?.getAttribute('icon') ?? '';

    const nextHass: HomeAssistant = {
      ...initialHass,
      states: { 'light.a': makeEntity('light.a', 'on') },
    };
    card.hass = nextHass;
    await awaitUpdate(card);
    await awaitUpdate(marker);

    const iconDivOn = marker.shadowRoot?.querySelector('.icon') as HTMLElement;
    const styleOn = iconDivOn.getAttribute('style') ?? '';
    const haIconOn = iconDivOn.querySelector('ha-icon')?.getAttribute('icon') ?? '';

    expect({ styleOff, styleOn, haIconOff, haIconOn }).toMatchObject({
      haIconOff: 'mdi:lightbulb',
      haIconOn: 'mdi:lightbulb',
    });
    expect(styleOn).not.toBe(styleOff);
  });
});
