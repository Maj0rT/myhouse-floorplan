import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HassEntity } from '../types.js';
import { getStateDisplay, type StateDisplay } from '../helpers/state-display.js';

export interface Position {
  x: number;
  y: number;
}

@customElement('myhouse-device-marker')
export class DeviceMarker extends LitElement {
  @property({ attribute: false }) entity?: HassEntity;
  @property({ attribute: false }) position: Position = { x: 0, y: 0 };
  @property() label?: string;
  @property() icon?: string;
  @property({ type: Boolean, attribute: 'edit-mode' }) editMode = false;

  @state() private display: StateDisplay = getStateDisplay(undefined);

  static styles = css`
    :host {
      display: contents;
    }
    .marker {
      position: absolute;
      transform: translate(-50%, -50%);
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.85);
      border-radius: 50%;
      padding: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      transition: transform 0.1s ease;
    }
    .marker:hover {
      transform: translate(-50%, -50%) scale(1.1);
    }
    .marker.edit {
      cursor: move;
      border: 2px dashed var(--primary-color, #03a9f4);
    }
    .icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    .icon ha-icon {
      --mdc-icon-size: 24px;
    }
    .label {
      font-size: 11px;
      color: var(--primary-text-color, #212121);
      background: rgba(255, 255, 255, 0.9);
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .text {
      font-size: 12px;
      font-weight: 600;
    }
  `;

  protected willUpdate(changed: PropertyValues): void {
    if (changed.has('entity')) {
      this.display = getStateDisplay(this.entity);
    }
  }

  private handleClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.editMode) return;
    this.dispatchEvent(
      new CustomEvent('marker-click', {
        detail: { entityId: this.entity?.entity_id },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private resolveLabel(): string {
    if (this.label !== undefined) return this.label;
    const friendly = this.entity?.attributes?.friendly_name;
    if (typeof friendly === 'string') return friendly;
    return this.entity?.entity_id ?? '';
  }

  render() {
    const cssLeft = `${this.position.x}%`;
    const cssTop = `${this.position.y}%`;
    const labelText = this.resolveLabel();
    const iconToShow = this.icon && this.icon.length > 0 ? this.icon : this.display.icon;
    return html`
      <div
        class="marker ${this.editMode ? 'edit' : ''}"
        style="left: ${cssLeft}; top: ${cssTop};"
        @click=${this.handleClick}
        role="button"
        tabindex="0"
      >
        <div class="icon" style="color: ${this.display.color};">
          <ha-icon icon=${iconToShow}></ha-icon>
        </div>
        ${this.display.text
          ? html`<div class="text">${this.display.text}</div>`
          : ''}
        ${labelText
          ? html`<div class="label">${labelText}</div>`
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'myhouse-device-marker': DeviceMarker;
  }
}
