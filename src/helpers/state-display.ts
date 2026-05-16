import type { HassEntity } from '../types.js';

export interface StateDisplay {
  icon: string;
  color: string;
  text?: string;
  hide_icon?: boolean;
}

const COLOR_ACTIVE = 'var(--paper-item-icon-active-color, #fdd835)';
const COLOR_INACTIVE = 'var(--paper-item-icon-color, #9e9e9e)';
const COLOR_ERROR = 'var(--error-color, #db4437)';
const COLOR_CAMERA = 'var(--info-color, #039be5)';

function pickIcon(entity: HassEntity, fallback: string): string {
  const attrIcon = entity.attributes?.icon;
  return typeof attrIcon === 'string' && attrIcon.length > 0 ? attrIcon : fallback;
}

export function getStateDisplay(entity: HassEntity | undefined): StateDisplay {
  if (!entity) {
    return { icon: 'mdi:help-circle-outline', color: COLOR_ERROR };
  }

  const state = entity.state;
  if (state === 'unavailable' || state === 'unknown') {
    return { icon: 'mdi:alert-circle', color: COLOR_ERROR };
  }

  const domain = entity.entity_id.split('.')[0];

  switch (domain) {
    case 'light':
      return {
        icon: pickIcon(entity, 'mdi:lightbulb'),
        color: state === 'on' ? COLOR_ACTIVE : COLOR_INACTIVE,
      };
    case 'switch':
    case 'automation':
    case 'fan':
      return {
        icon: pickIcon(entity, 'mdi:toggle-switch'),
        color: state === 'on' ? COLOR_ACTIVE : COLOR_INACTIVE,
      };
    case 'binary_sensor':
      return {
        icon: pickIcon(entity, 'mdi:radiobox-marked'),
        color: state === 'on' ? COLOR_ACTIVE : COLOR_INACTIVE,
      };
    case 'sensor': {
      const unit = entity.attributes?.unit_of_measurement;
      const text = unit ? `${state} ${unit}` : state;
      const deviceClass = entity.attributes?.device_class;
      // Bei Temperatur-Sensoren wird nur der Wert angezeigt — das icon waere
      // redundant zum aussagekraeftigen Zahlenwert + Einheit.
      const hideIcon = deviceClass === 'temperature';
      return {
        icon: pickIcon(entity, 'mdi:gauge'),
        color: COLOR_INACTIVE,
        text,
        hide_icon: hideIcon,
      };
    }
    case 'camera': {
      // Kameras sind in HA meistens im 'idle'-state — auch wenn sie aktiv
      // betriebsbereit sind. Das default-grau waere damit fast immer zu sehen
      // und zu unauffaellig. Stattdessen kraeftiges info-blau als ruhefarbe;
      // streaming/recording wird zusaetzlich gelb (active) hervorgehoben.
      const isActive = state === 'streaming' || state === 'recording';
      return {
        icon: 'mdi:cctv',
        color: isActive ? COLOR_ACTIVE : COLOR_CAMERA,
      };
    }
    case 'cover': {
      const isOpen = state === 'open' ||
        (typeof entity.attributes?.current_position === 'number' &&
          entity.attributes.current_position > 0);
      // Bewusst kein pickIcon: Manche Integrationen (z.B. Homematic) setzen
      // fest 'mdi:window-shutter' im entity.attributes.icon — egal ob offen
      // oder geschlossen. Wir leiten das icon vom state ab, damit der visuelle
      // unterschied stimmt. Ein per-marker icon-override greift weiter (im
      // device-marker).
      return {
        icon: isOpen ? 'mdi:window-shutter-open' : 'mdi:window-shutter',
        color: isOpen ? COLOR_ACTIVE : COLOR_INACTIVE,
      };
    }
    default:
      return {
        icon: pickIcon(entity, 'mdi:eye'),
        color: COLOR_INACTIVE,
      };
  }
}
