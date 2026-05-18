import { LitElement, html, css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

@customElement('myhouse-floor-image')
export class FloorImage extends LitElement {
  @property() src = '';
  @property() aspectRatio?: string;

  @state() private loadError = false;

  @query('img') private imgEl?: HTMLImageElement;

  static styles = css`
    :host {
      display: block;
      position: relative;
      width: 100%;
    }
    .container {
      position: relative;
      width: 100%;
    }
    img {
      display: block;
      width: 100%;
      height: auto;
      user-select: none;
      -webkit-user-drag: none;
    }
    .placeholder,
    .error {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      aspect-ratio: 16 / 9;
      background: var(--secondary-background-color, #eaeaea);
      color: var(--secondary-text-color, #555);
      font-size: 14px;
      text-align: center;
      padding: 16px;
      box-sizing: border-box;
    }
    .error {
      background: var(--error-color, #db4437);
      color: white;
    }
    ::slotted(*) {
      pointer-events: auto;
    }
  `;

  getImageRect(): DOMRect {
    if (this.imgEl) {
      return this.imgEl.getBoundingClientRect();
    }
    return this.getBoundingClientRect();
  }

  private onError(): void {
    this.loadError = true;
  }

  private onLoad(): void {
    this.loadError = false;
  }

  render() {
    if (!this.src) {
      return html`<div class="placeholder">
        Bitte ein Etagenbild auswaehlen (im Karten-Editor hochladen)
      </div>`;
    }
    const style = this.aspectRatio
      ? `aspect-ratio: ${this.aspectRatio.replace(':', ' / ')};`
      : '';
    return html`
      <div class="container" style=${style}>
        <img
          src=${this.src}
          alt="Floor plan"
          @error=${this.onError}
          @load=${this.onLoad}
        />
        ${this.loadError
          ? html`<div class="error">
              Bild nicht gefunden: ${this.src}
            </div>`
          : ''}
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'myhouse-floor-image': FloorImage;
  }
}
