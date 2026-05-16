import '../src/floorplan-card.ts';
import '../src/floorplan-card-editor.ts';
import type { FloorplanCard } from '../src/floorplan-card.ts';
import type { FloorplanCardEditor } from '../src/floorplan-card-editor.ts';
import type { FloorplanConfig, HassEntity, HomeAssistant } from '../src/types.ts';

// SVG-Pfade als mdi-Mock. fill="currentColor" laesst die Farbe vom
// elternteil (color-property) erben — anders als Emojis, die ihre
// eigene Farbe haben und die state-color verschlucken.
const ICON_SVG: Record<string, string> = {
  'mdi:lightbulb':
    '<path d="M12 2a7 7 0 0 0-4 12.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26A7 7 0 0 0 12 2zM9 20a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1H9z"/>',
  'mdi:toggle-switch':
    '<path d="M17 7H7a5 5 0 0 0 0 10h10a5 5 0 0 0 0-10zm0 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>',
  'mdi:radiobox-marked':
    '<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm0-13a5 5 0 1 0 5 5 5 5 0 0 0-5-5z"/>',
  'mdi:gauge':
    '<path d="M12 2a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-12v5.27a2 2 0 1 0 2 0V8z"/>',
  'mdi:window-shutter':
    '<path d="M4 4h16v3H4zm0 5h16v3H4zm0 5h16v3H4zm0 5h16v2H4z"/>',
  'mdi:window-shutter-open':
    '<path d="M4 4h16v3H4zm0 5h16v2H4zm0 11v-3h16v3z"/>',
  'mdi:eye':
    '<path d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5C21.3 7.6 17 4.5 12 4.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>',
  'mdi:cctv':
    '<path d="M3 4l16 4-1 3-6-1.5-2 5L8 14l-5-1z M4 18h16v2H4z"/>',
  'mdi:help-circle-outline':
    '<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm1-5h-2v-2h2zm2.07-7.75-.9.92C13.45 8.9 13 9.5 13 11h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26a2 2 0 1 0-3.41-1.41h-2a4 4 0 1 1 7.07 2.25z"/>',
  'mdi:alert-circle':
    '<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z"/>',
};
const ICON_FALLBACK = '<circle cx="12" cy="12" r="6"/>';

class MockHaIcon extends HTMLElement {
  static observedAttributes = ['icon'];
  connectedCallback() {
    this.render();
  }
  attributeChangedCallback() {
    this.render();
  }
  private render() {
    const icon = this.getAttribute('icon') ?? '';
    const path = ICON_SVG[icon] ?? ICON_FALLBACK;
    this.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style="display:block">${path}</svg>`;
  }
}
customElements.define('ha-icon', MockHaIcon);

const DEMO_IMAGE = buildDemoFloorplan();

function buildCameraSnapshot(label: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120">
    <rect width="160" height="120" fill="${color}"/>
    <text x="80" y="65" text-anchor="middle" font-family="system-ui" font-size="14" fill="rgba(0,0,0,0.6)">CAM ${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildDemoFloorplan(): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
      <rect x="0" y="0" width="800" height="500" fill="#f4ede1"/>
      <g fill="none" stroke="#3b3b3b" stroke-width="6" stroke-linejoin="miter">
        <rect x="20" y="20" width="760" height="460"/>
        <line x1="20" y1="240" x2="420" y2="240"/>
        <line x1="420" y1="20" x2="420" y2="480"/>
        <line x1="600" y1="240" x2="780" y2="240"/>
      </g>
      <g font-family="system-ui, sans-serif" font-size="22" fill="#666">
        <text x="220" y="130" text-anchor="middle">Wohnzimmer</text>
        <text x="220" y="370" text-anchor="middle">Küche</text>
        <text x="600" y="130" text-anchor="middle">Schlafzimmer</text>
        <text x="690" y="370" text-anchor="middle">Bad</text>
        <text x="510" y="370" text-anchor="middle">Flur</text>
      </g>
    </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const initialStates: Record<string, HassEntity> = {
  'light.kueche': {
    entity_id: 'light.kueche',
    state: 'off',
    attributes: { friendly_name: 'Küche Decke' },
  },
  'light.wohnzimmer': {
    entity_id: 'light.wohnzimmer',
    state: 'on',
    attributes: { friendly_name: 'Wohnzimmer Stehlampe' },
  },
  'switch.tv': {
    entity_id: 'switch.tv',
    state: 'off',
    attributes: { friendly_name: 'TV' },
  },
  'cover.rolladen_west': {
    entity_id: 'cover.rolladen_west',
    state: 'open',
    attributes: { friendly_name: 'Rolladen West', current_position: 80 },
  },
  'sensor.temperatur_bad': {
    entity_id: 'sensor.temperatur_bad',
    state: '21.5',
    attributes: {
      friendly_name: 'Temperatur Bad',
      unit_of_measurement: '°C',
      device_class: 'temperature',
    },
  },
  'binary_sensor.bewegung_flur': {
    entity_id: 'binary_sensor.bewegung_flur',
    state: 'off',
    attributes: { friendly_name: 'Bewegung Flur', device_class: 'motion' },
  },
  'camera.flur': {
    entity_id: 'camera.flur',
    state: 'idle',
    attributes: {
      friendly_name: 'Kamera Flur',
      entity_picture: buildCameraSnapshot('Flur', '#5a7090'),
    },
  },
};

function setStatus(msg: string): void {
  const el = document.getElementById('status');
  if (el) el.textContent = msg;
  console.info('[demo]', msg);
}

const hass: HomeAssistant = {
  states: { ...initialStates },
  callService: async (domain, service, data) => {
    const entityId = (data?.entity_id as string | undefined) ?? '';
    const entity = hass.states[entityId];
    if (!entity) {
      setStatus(`callService: ${domain}.${service}(${entityId}) — entity nicht gefunden`);
      return;
    }
    if (service === 'toggle') {
      const next = entity.state === 'on' || entity.state === 'open' ? 'off' : 'on';
      hass.states[entityId] = { ...entity, state: next };
      refreshHass();
      setStatus(`${entityId}: ${entity.state} → ${next}`);
    } else {
      setStatus(`callService: ${domain}.${service}(${entityId})`);
    }
  },
  auth: { data: { access_token: 'DEMO_TOKEN' } },
};

const initialConfig: FloorplanConfig = {
  type: 'custom:myhouse-floorplan',
  title: 'Erdgeschoss (Demo)',
  image: DEMO_IMAGE,
  markers: [
    { entity: 'light.wohnzimmer', x: 22, y: 26 },
    { entity: 'switch.tv', x: 32, y: 18 },
    { entity: 'light.kueche', x: 22, y: 74 },
    { entity: 'binary_sensor.bewegung_flur', x: 64, y: 60, label: 'Flur-Sensor' },
    { entity: 'sensor.temperatur_bad', x: 88, y: 74 },
    { entity: 'cover.rolladen_west', x: 75, y: 26 },
    { entity: 'camera.flur', x: 50, y: 50 },
  ],
};

let currentConfig: FloorplanConfig = initialConfig;

const card = document.createElement('myhouse-floorplan') as FloorplanCard;
card.hass = hass;
card.setConfig(currentConfig);
document.getElementById('card-mount')!.appendChild(card);

const editor = document.createElement('myhouse-floorplan-editor') as FloorplanCardEditor;
editor.hass = hass;
editor.setConfig(currentConfig);
document.getElementById('editor-mount')!.appendChild(editor);

editor.addEventListener('config-changed', (event) => {
  const detail = (event as CustomEvent<{ config: FloorplanConfig }>).detail;
  currentConfig = detail.config;
  card.setConfig(currentConfig);
});

function refreshHass(): void {
  const nextHass: HomeAssistant = { ...hass, states: { ...hass.states } };
  card.hass = nextHass;
  editor.hass = nextHass;
}

document.querySelectorAll<HTMLButtonElement>('.controls button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const toggle = btn.dataset.toggle;
    const set = btn.dataset.set;
    if (toggle) {
      void hass.callService('homeassistant', 'toggle', { entity_id: toggle });
    } else if (set) {
      const [entityId, state] = set.split(':');
      const entity = hass.states[entityId];
      if (entity) {
        hass.states[entityId] = { ...entity, state };
        refreshHass();
        setStatus(`${entityId}: → ${state}`);
      }
    }
  });
});

card.addEventListener('marker-click', (event) => {
  const detail = (event as CustomEvent<{ entityId?: string }>).detail;
  setStatus(`marker-click: ${detail?.entityId ?? '?'}`);
});

window.addEventListener('hass-more-info', (event) => {
  const detail = (event as CustomEvent<{ entityId?: string }>).detail;
  setStatus(`more-info: ${detail?.entityId ?? '?'}`);
});

setStatus('Demo geladen — klicke einen Marker oder Button');
