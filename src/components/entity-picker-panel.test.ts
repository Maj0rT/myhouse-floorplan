import { describe, it, expect, beforeEach, vi } from 'vitest';
import './entity-picker-panel.js';
import type { EntityPickerPanel } from './entity-picker-panel.js';
import type { HomeAssistant } from '../types.js';

async function nextRender(el: HTMLElement): Promise<void> {
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
}

function makeHass(): HomeAssistant {
  return {
    states: {
      'light.a': { entity_id: 'light.a', state: 'on', attributes: { friendly_name: 'Lampe A' } },
      'switch.b': { entity_id: 'switch.b', state: 'off', attributes: { friendly_name: 'Schalter B' } },
      'sensor.c': { entity_id: 'sensor.c', state: '21', attributes: { friendly_name: 'Sensor C' } },
      'sensor.heizung_bad_temperature': {
        entity_id: 'sensor.heizung_bad_temperature',
        state: '21.5',
        attributes: { friendly_name: 'Heizung Badezimmer Temperatur' },
      },
      'sensor.heizung_kueche_temperature': {
        entity_id: 'sensor.heizung_kueche_temperature',
        state: '20.0',
        attributes: { friendly_name: 'Heizung Kueche Temperatur' },
      },
      'zone.home': { entity_id: 'zone.home', state: '1', attributes: { friendly_name: 'Zuhause' } },
      'person.alice': { entity_id: 'person.alice', state: 'home', attributes: { friendly_name: 'Alice' } },
      'media_player.tv': { entity_id: 'media_player.tv', state: 'idle', attributes: { friendly_name: 'Fernseher' } },
    },
    callService: vi.fn(),
  };
}

describe('entity-picker-panel', () => {
  let el: EntityPickerPanel;

  beforeEach(() => {
    el = document.createElement('myhouse-entity-picker-panel') as EntityPickerPanel;
    el.hass = makeHass();
    document.body.appendChild(el);
  });

  it('lists only entities with supported domains', async () => {
    await nextRender(el);
    const options = el.shadowRoot?.querySelectorAll('.entity');
    expect(options?.length).toBe(5);
    const texts = Array.from(options ?? []).map((o) => o.textContent ?? '');
    expect(texts.some((t) => t.includes('zone.home'))).toBe(false);
    expect(texts.some((t) => t.includes('person.alice'))).toBe(false);
    expect(texts.some((t) => t.includes('media_player.tv'))).toBe(false);
  });

  it('combines multiple search tokens with AND across id and friendly_name', async () => {
    el.search = 'temperature bad';
    await nextRender(el);
    const options = el.shadowRoot?.querySelectorAll('.entity');
    expect(options?.length).toBe(1);
    expect(options?.[0].textContent).toContain('Heizung Badezimmer');
  });

  it('returns no match if any token is missing', async () => {
    el.search = 'temperature wohnzimmer';
    await nextRender(el);
    const options = el.shadowRoot?.querySelectorAll('.entity');
    expect(options?.length).toBe(0);
  });

  it('matches across both id and friendly_name (mixed tokens)', async () => {
    el.search = 'sensor badezimmer';
    await nextRender(el);
    const options = el.shadowRoot?.querySelectorAll('.entity');
    expect(options?.length).toBe(1);
    expect(options?.[0].textContent).toContain('Heizung Badezimmer');
  });

  it('filters entities by search term', async () => {
    el.search = 'switch';
    await nextRender(el);
    const options = el.shadowRoot?.querySelectorAll('.entity');
    expect(options?.length).toBe(1);
    expect(options?.[0].textContent).toContain('Schalter B');
  });

  it('fires entity-selected when an entity is clicked', async () => {
    await nextRender(el);
    const listener = vi.fn();
    el.addEventListener('entity-selected', listener);
    const first = el.shadowRoot?.querySelector('.entity') as HTMLElement;
    first.click();
    expect(listener).toHaveBeenCalled();
    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(typeof event.detail.entityId).toBe('string');
  });

  it('updates the filter on input', async () => {
    await nextRender(el);
    const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;
    input.value = 'sensor.c';
    input.dispatchEvent(new Event('input'));
    await nextRender(el);
    const options = el.shadowRoot?.querySelectorAll('.entity');
    expect(options?.length).toBe(1);
  });
});
