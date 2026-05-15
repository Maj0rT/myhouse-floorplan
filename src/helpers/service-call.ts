import type { HomeAssistant, TapAction } from '../types.js';

const TOGGLE_DOMAINS = new Set([
  'light',
  'switch',
  'cover',
  'automation',
  'fan',
  'input_boolean',
  'script',
]);

export async function handleTap(
  entityId: string,
  action: TapAction,
  hass: HomeAssistant,
  fireEvent: (type: string, detail: unknown) => void,
): Promise<void> {
  if (action === 'none') return;

  if (action === 'more-info') {
    fireEvent('hass-more-info', { entityId });
    return;
  }

  const domain = entityId.split('.')[0];
  if (!TOGGLE_DOMAINS.has(domain)) {
    fireEvent('hass-more-info', { entityId });
    return;
  }

  await hass.callService(domain, 'toggle', { entity_id: entityId });
}
