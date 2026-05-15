import '../src/floorplan-card.ts';
import '../src/floorplan-card-editor.ts';
import type { FloorplanCard } from '../src/floorplan-card.ts';
import type { FloorplanCardEditor } from '../src/floorplan-card-editor.ts';
import type { FloorplanConfig, HassEntity, HomeAssistant } from '../src/types.ts';

const ICON_MAP: Record<string, string> = {
  'mdi:lightbulb': '💡',
  'mdi:toggle-switch': '🔌',
  'mdi:radiobox-marked': '🔘',
  'mdi:gauge': '🌡️',
  'mdi:window-shutter': '🪟',
  'mdi:eye': '👁️',
  'mdi:help-circle-outline': '❓',
  'mdi:alert-circle': '⚠️',
};

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
    this.textContent = ICON_MAP[icon] ?? '●';
  }
}
customElements.define('ha-icon', MockHaIcon);

const DEMO_IMAGE = buildDemoFloorplan();

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
    attributes: { friendly_name: 'Temperatur Bad', unit_of_measurement: '°C' },
  },
  'binary_sensor.bewegung_flur': {
    entity_id: 'binary_sensor.bewegung_flur',
    state: 'off',
    attributes: { friendly_name: 'Bewegung Flur', device_class: 'motion' },
  },
};

const hass: HomeAssistant = {
  states: { ...initialStates },
  callService: async (domain, service, data) => {
    const entityId = (data?.entity_id as string | undefined) ?? '';
    const entity = hass.states[entityId];
    if (!entity) return;
    console.info('[mock callService]', domain, service, data);
    if (service === 'toggle') {
      const next = entity.state === 'on' || entity.state === 'open' ? 'off' : 'on';
      hass.states[entityId] = { ...entity, state: next };
      refreshHass();
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
      }
    }
  });
});
