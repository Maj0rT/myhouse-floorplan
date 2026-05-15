import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FloorplanConfig, HomeAssistant, MarkerConfig } from './types.js';
import { handleTap } from './helpers/service-call.js';
import './components/floor-image.js';
import './components/device-marker.js';

function fireEvent(target: HTMLElement, type: string, detail: unknown): void {
  target.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
}

@customElement('myhouse-floorplan')
export class FloorplanCard extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config?: FloorplanConfig;

  static async getConfigElement(): Promise<HTMLElement> {
    await import('./floorplan-card-editor.js');
    return document.createElement('myhouse-floorplan-editor');
  }

  static getStubConfig(): FloorplanConfig {
    return {
      type: 'custom:myhouse-floorplan',
      image: '',
      markers: [],
    };
  }

  static styles = css`
    :host {
      display: block;
    }
    ha-card {
      overflow: hidden;
    }
    .title {
      padding: 12px 16px 4px;
      font-size: 18px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
    }
    .image-wrap {
      position: relative;
      width: 100%;
    }
  `;

  setConfig(config: FloorplanConfig): void {
    if (!config) {
      throw new Error('Config required');
    }
    if (!config.image || typeof config.image !== 'string') {
      throw new Error('Property "image" ist erforderlich');
    }
    if (!Array.isArray(config.markers)) {
      throw new Error('Property "markers" muss ein Array sein');
    }
    this.config = config;
  }

  getCardSize(): number {
    return 6;
  }

  private async onMarkerClick(event: CustomEvent<{ entityId?: string }>): Promise<void> {
    const entityId = event.detail?.entityId;
    if (!entityId || !this.hass || !this.config) return;

    const marker = this.config.markers.find((m) => m.entity === entityId);
    const action = marker?.tap_action ?? 'toggle';

    try {
      await handleTap(entityId, action, this.hass, (type, detail) =>
        fireEvent(this, type, detail),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Service-Call fehlgeschlagen';
      fireEvent(this, 'hass-notification', { message });
    }
  }

  private renderMarker(marker: MarkerConfig) {
    const entity = this.hass?.states[marker.entity];
    return html`
      <myhouse-device-marker
        .entity=${entity}
        .position=${{ x: marker.x, y: marker.y }}
        .label=${marker.label ?? ''}
        .icon=${marker.icon ?? ''}
      ></myhouse-device-marker>
    `;
  }

  render() {
    if (!this.config) return html``;
    const { title, image, aspect_ratio, markers } = this.config;
    return html`
      <ha-card>
        ${title ? html`<div class="title">${title}</div>` : ''}
        <div class="image-wrap" @marker-click=${this.onMarkerClick}>
          <myhouse-floor-image
            .src=${image}
            .aspectRatio=${aspect_ratio ?? ''}
          >
            ${markers.map((m) => this.renderMarker(m))}
          </myhouse-floor-image>
        </div>
      </ha-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'myhouse-floorplan': FloorplanCard;
  }
}
