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
  @state() private cameraStreamEntityId: string | null = null;

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
    .modal-host {
      display: contents;
    }
    .camera-modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
    }
    .camera-modal-content {
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      border-radius: 8px;
      width: 85vw;
      max-width: 85vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }
    .camera-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px 8px 16px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
    }
    .camera-modal-title {
      font-weight: 500;
      font-size: 16px;
    }
    .camera-modal-close {
      background: transparent;
      border: none;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      color: var(--primary-text-color, #212121);
      padding: 4px 8px;
      border-radius: 4px;
    }
    .camera-modal-close:hover {
      background: var(--secondary-background-color, #f0f0f0);
    }
    .camera-stream {
      width: 100%;
      max-height: calc(90vh - 60px);
      display: block;
    }
    .camera-stream-error {
      padding: 24px;
      text-align: center;
      color: var(--error-color, #db4437);
      font-size: 14px;
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

    // Kameras: bei tap_action 'toggle' (default) zeigen wir den live-stream
    // als eigenes popup statt ueber HAs more-info-dialog.
    if (entityId.startsWith('camera.') && action === 'toggle') {
      this.cameraStreamEntityId = entityId;
      return;
    }

    try {
      await handleTap(entityId, action, this.hass, (type, detail) =>
        fireEvent(this, type, detail),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Service-Call fehlgeschlagen';
      fireEvent(this, 'hass-notification', { message });
    }
  }

  private closeCameraStream(): void {
    this.cameraStreamEntityId = null;
  }

  private onCameraModalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeCameraStream();
    }
  }

  private renderCameraStream() {
    if (!this.cameraStreamEntityId) return '';
    const entity = this.hass?.states[this.cameraStreamEntityId];
    const friendly = entity?.attributes?.friendly_name;
    const title =
      typeof friendly === 'string' && friendly.length > 0
        ? friendly
        : this.cameraStreamEntityId;
    return html`
      <div
        class="camera-modal"
        role="dialog"
        tabindex="-1"
        @click=${this.closeCameraStream}
        @keydown=${this.onCameraModalKeydown}
      >
        <div class="camera-modal-content" @click=${(e: Event) => e.stopPropagation()}>
          <div class="camera-modal-header">
            <span class="camera-modal-title">${title}</span>
            <button
              class="camera-modal-close"
              aria-label="Schliessen"
              @click=${this.closeCameraStream}
            >
              ✕
            </button>
          </div>
          ${entity
            ? html`<ha-camera-stream
                class="camera-stream"
                .hass=${this.hass}
                .stateObj=${entity}
                allow-exoplayer
                controls
              ></ha-camera-stream>`
            : html`<div class="camera-stream-error">
                Camera-Entity nicht gefunden.
              </div>`}
        </div>
      </div>
    `;
  }

  private renderMarker(marker: MarkerConfig) {
    const entity = this.hass?.states[marker.entity];
    return html`
      <myhouse-device-marker
        .entity=${entity}
        .position=${{ x: marker.x, y: marker.y }}
        .label=${marker.label}
        .icon=${marker.icon ?? ''}
        .backgroundOpacity=${marker.background_opacity}
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
      <div class="modal-host">${this.renderCameraStream()}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'myhouse-floorplan': FloorplanCard;
  }
}
