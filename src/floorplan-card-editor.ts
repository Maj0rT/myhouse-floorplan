import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FloorplanConfig, HomeAssistant, MarkerConfig } from './types.js';
import { uploadImage, ImageUploadError } from './helpers/image-upload.js';
import { clientCoordsToPercent } from './helpers/position-math.js';
import './components/entity-picker-panel.js';
import './components/floor-image.js';
import './components/device-marker.js';

@customElement('myhouse-floorplan-editor')
export class FloorplanCardEditor extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config: FloorplanConfig = {
    type: 'custom:myhouse-floorplan',
    image: '',
    markers: [],
  };
  @state() private uploadError = '';
  @state() private uploading = false;
  @state() private draggingIndex: number | null = null;

  static styles = css`
    :host {
      display: block;
      padding: 12px;
      color: var(--primary-text-color, #212121);
    }
    .section {
      margin-bottom: 16px;
    }
    .section-title {
      font-weight: 600;
      margin-bottom: 6px;
      font-size: 14px;
    }
    input[type='text'],
    input[type='search'] {
      width: 100%;
      box-sizing: border-box;
      padding: 6px 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      font-size: 13px;
    }
    .upload-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .upload-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    button {
      padding: 6px 12px;
      background: var(--primary-color, #03a9f4);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }
    button.danger {
      background: var(--error-color, #db4437);
    }
    .upload-error {
      color: var(--error-color, #db4437);
      font-size: 12px;
    }
    .marker-list {
      display: contents;
    }
    .marker-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 6px 0;
      border-bottom: 1px solid var(--divider-color, #eee);
      font-size: 13px;
    }
    .marker-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .marker-item .entity {
      flex: 1;
      font-family: monospace;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .marker-item .position {
      color: var(--secondary-text-color, #999);
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }
    .label-input {
      width: 100%;
      box-sizing: border-box;
      padding: 4px 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      font-size: 12px;
    }
    .preview {
      position: relative;
      margin-top: 8px;
      border: 1px dashed var(--divider-color, #ccc);
    }
    .empty {
      color: var(--secondary-text-color, #999);
      font-size: 13px;
      font-style: italic;
    }
    .preview-wrap {
      display: contents;
    }
  `;

  setConfig(config: FloorplanConfig): void {
    this.config = {
      ...config,
      markers: Array.isArray(config.markers) ? [...config.markers] : [],
    };
  }

  private emitChange(newConfig: FloorplanConfig): void {
    this.config = newConfig;
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private onImageInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.emitChange({ ...this.config, image: value });
  }

  private onTitleInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.emitChange({ ...this.config, title: value });
  }

  private onOpacityInput(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.emitChange({ ...this.config, marker_background_opacity: value });
  }

  private async onFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.hass) return;

    this.uploadError = '';
    this.uploading = true;
    try {
      const url = await uploadImage(file, this.hass);
      this.emitChange({ ...this.config, image: url });
    } catch (err) {
      if (err instanceof ImageUploadError) {
        this.uploadError = err.message;
      } else {
        this.uploadError = 'Unbekannter Upload-Fehler';
      }
    } finally {
      this.uploading = false;
      input.value = '';
    }
  }

  private onEntitySelected(event: CustomEvent<{ entityId: string }>): void {
    const entityId = event.detail.entityId;
    const newMarker: MarkerConfig = { entity: entityId, x: 50, y: 50 };
    this.emitChange({
      ...this.config,
      markers: [...this.config.markers, newMarker],
    });
  }

  private removeMarker(index: number): void {
    const markers = this.config.markers.filter((_, i) => i !== index);
    this.emitChange({ ...this.config, markers });
  }

  private updateMarkerLabel(index: number, label: string): void {
    const markers = this.config.markers.map((m, i) =>
      i === index ? { ...m, label } : m,
    );
    this.emitChange({ ...this.config, markers });
  }

  private suggestLabel(entityId: string): string {
    const entity = this.hass?.states[entityId];
    const friendly = entity?.attributes?.friendly_name;
    if (typeof friendly === 'string') return friendly;
    return entityId;
  }

  private startDrag(index: number, event: MouseEvent): void {
    event.preventDefault();
    this.draggingIndex = index;
    const onMove = (e: MouseEvent) => this.onDragMove(e);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      this.draggingIndex = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  private onDragMove(event: MouseEvent): void {
    if (this.draggingIndex === null) return;
    const img = this.shadowRoot?.querySelector('myhouse-floor-image') as
      | (HTMLElement & { getImageRect(): DOMRect })
      | null;
    if (!img) return;
    const rect = img.getImageRect();
    const { x, y } = clientCoordsToPercent(event.clientX, event.clientY, rect);
    const markers = this.config.markers.map((m, i) =>
      i === this.draggingIndex ? { ...m, x, y } : m,
    );
    this.emitChange({ ...this.config, markers });
  }

  private renderMarker(marker: MarkerConfig, index: number) {
    const entity = this.hass?.states[marker.entity];
    return html`
      <myhouse-device-marker
        .entity=${entity}
        .position=${{ x: marker.x, y: marker.y }}
        .label=${marker.label}
        .icon=${marker.icon ?? ''}
        edit-mode
        @mousedown=${(e: MouseEvent) => this.startDrag(index, e)}
      ></myhouse-device-marker>
    `;
  }

  render() {
    const rawOpacity = this.config.marker_background_opacity;
    const opacity =
      typeof rawOpacity === 'number' && !Number.isNaN(rawOpacity)
        ? Math.max(0, Math.min(1, rawOpacity))
        : 0.85;
    const previewStyle = `--myhouse-marker-bg-opacity: ${opacity};`;
    return html`
      <div class="section upload-section">
        <div class="section-title">Etagenbild</div>
        <input
          type="text"
          name="image"
          placeholder="Bild-URL (z.B. /local/floors/eg.png)"
          .value=${this.config.image}
          @input=${this.onImageInput}
        />
        <div class="upload-row">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            @change=${this.onFileChange}
            ?disabled=${this.uploading}
          />
          ${this.uploading ? html`<span>Hochladen...</span>` : ''}
        </div>
        ${this.uploadError
          ? html`<div class="upload-error">${this.uploadError}</div>`
          : ''}
      </div>

      <div class="section">
        <div class="section-title">Titel (optional)</div>
        <input
          type="text"
          name="title"
          .value=${this.config.title ?? ''}
          @input=${this.onTitleInput}
        />
      </div>

      <div class="section">
        <div class="section-title">
          Marker-Hintergrund Deckkraft (${Math.round(opacity * 100)}%)
        </div>
        <input
          type="range"
          name="marker_background_opacity"
          min="0"
          max="1"
          step="0.05"
          .value=${String(opacity)}
          @input=${this.onOpacityInput}
        />
      </div>

      <div class="section">
        <div class="section-title">Geraet hinzufuegen</div>
        <myhouse-entity-picker-panel
          .hass=${this.hass}
          @entity-selected=${this.onEntitySelected}
        ></myhouse-entity-picker-panel>
      </div>

      <div class="section">
        <div class="section-title">
          Platzierte Geraete (${this.config.markers.length})
        </div>
        ${this.config.markers.length === 0
          ? html`<div class="empty">
              Noch keine Geraete platziert. Waehle ein Geraet oben aus.
            </div>`
          : html`<div class="marker-list">
              ${this.config.markers.map(
                (marker, index) => html`
                  <div class="marker-item">
                    <div class="marker-row">
                      <div class="entity">${marker.entity}</div>
                      <div class="position">
                        ${marker.x.toFixed(0)}% / ${marker.y.toFixed(0)}%
                      </div>
                      <button class="remove danger" @click=${() => this.removeMarker(index)}>
                        Entfernen
                      </button>
                    </div>
                    <input
                      type="text"
                      class="label-input"
                      placeholder="Beschriftung (leer = ausblenden)"
                      .value=${marker.label ?? this.suggestLabel(marker.entity)}
                      @input=${(e: Event) =>
                        this.updateMarkerLabel(index, (e.target as HTMLInputElement).value)}
                    />
                  </div>
                `,
              )}
            </div>`}
      </div>

      <div class="preview-wrap">
        ${this.config.image
          ? html`
              <div class="section">
                <div class="section-title">Vorschau (Marker verschiebbar)</div>
                <div class="preview" style=${previewStyle}>
                  <myhouse-floor-image .src=${this.config.image}>
                    ${this.config.markers.map((m, i) => this.renderMarker(m, i))}
                  </myhouse-floor-image>
                </div>
              </div>
            `
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'myhouse-floorplan-editor': FloorplanCardEditor;
  }
}
