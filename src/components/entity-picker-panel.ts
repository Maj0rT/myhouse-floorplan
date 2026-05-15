import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types.js';

@customElement('myhouse-entity-picker-panel')
export class EntityPickerPanel extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @property() search = '';
  @state() private internalSearch = '';

  static styles = css`
    :host {
      display: block;
      border: 1px solid var(--divider-color, #ddd);
      border-radius: 6px;
      padding: 8px;
      max-height: 320px;
      overflow-y: auto;
      background: var(--card-background-color, #fff);
    }
    input {
      width: 100%;
      padding: 6px 8px;
      box-sizing: border-box;
      margin-bottom: 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      font-size: 14px;
    }
    .entity {
      padding: 6px 8px;
      cursor: pointer;
      border-radius: 4px;
      font-size: 13px;
    }
    .entity:hover {
      background: var(--secondary-background-color, #f0f0f0);
    }
    .id {
      color: var(--secondary-text-color, #999);
      font-size: 11px;
      font-family: monospace;
    }
    .list {
      display: contents;
    }
    .empty {
      padding: 12px;
      text-align: center;
      color: var(--secondary-text-color, #999);
      font-size: 13px;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.internalSearch = this.search;
  }

  protected willUpdate(changedProps: Map<string, unknown>): void {
    if (changedProps.has('search')) {
      this.internalSearch = this.search;
    }
  }

  private onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.internalSearch = target.value;
  }

  private select(entityId: string): void {
    this.dispatchEvent(
      new CustomEvent('entity-selected', {
        detail: { entityId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private filterEntities(): Array<{ id: string; friendly: string }> {
    if (!this.hass) return [];
    const term = this.internalSearch.toLowerCase().trim();
    return Object.values(this.hass.states)
      .map((e) => ({
        id: e.entity_id,
        friendly:
          typeof e.attributes?.friendly_name === 'string'
            ? e.attributes.friendly_name
            : e.entity_id,
      }))
      .filter(
        (e) =>
          !term ||
          e.id.toLowerCase().includes(term) ||
          e.friendly.toLowerCase().includes(term),
      )
      .sort((a, b) => a.friendly.localeCompare(b.friendly));
  }

  render() {
    const filtered = this.filterEntities();
    return html`
      <input
        type="search"
        placeholder="Entity suchen..."
        .value=${this.internalSearch}
        @input=${this.onInput}
      />
      <div class="list">
        ${filtered.length === 0
          ? html`<div class="empty">Keine Treffer</div>`
          : filtered.map(
              (e) => html`
                <div class="entity" @click=${() => this.select(e.id)}>
                  <div>${e.friendly}</div>
                  <div class="id">${e.id}</div>
                </div>
              `,
            )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'myhouse-entity-picker-panel': EntityPickerPanel;
  }
}
