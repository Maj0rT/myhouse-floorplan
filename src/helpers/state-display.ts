import type { HassEntity } from '../types.js';

export interface StateDisplay {
  icon: string;
  color: string;
  text?: string;
}

const COLOR_ACTIVE = 'var(--paper-item-icon-active-color, #fdd835)';
const COLOR_INACTIVE = 'var(--paper-item-icon-color, #9e9e9e)';
const COLOR_ERROR = 'var(--error-color, #db4437)';

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
      return {
        icon: pickIcon(entity, 'mdi:gauge'),
        color: COLOR_INACTIVE,
        text,
      };
    }
    case 'cover': {
      const isOpen = state === 'open' ||
        (typeof entity.attributes?.current_position === 'number' &&
          entity.attributes.current_position > 0);
      return {
        icon: pickIcon(entity, 'mdi:window-shutter'),
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
