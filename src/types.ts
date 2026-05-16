export interface HassEntityAttributes {
  friendly_name?: string;
  icon?: string;
  unit_of_measurement?: string;
  device_class?: string;
  current_position?: number;
  brightness?: number;
  [key: string]: unknown;
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: HassEntityAttributes;
  last_changed?: string;
  last_updated?: string;
}

export interface HassAuth {
  data?: {
    access_token?: string;
  };
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  callService: (
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>
  ) => Promise<void>;
  auth?: HassAuth;
}

export type TapAction = 'toggle' | 'more-info' | 'none';

export interface MarkerConfig {
  entity: string;
  x: number;
  y: number;
  label?: string;
  icon?: string;
  tap_action?: TapAction;
}

export interface FloorplanConfig {
  type: string;
  title?: string;
  image: string;
  aspect_ratio?: string;
  marker_background_opacity?: number;
  markers: MarkerConfig[];
}

export interface LovelaceCardEditor extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: FloorplanConfig): void;
}
