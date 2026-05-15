import { describe, it, expect, beforeEach } from 'vitest';
import './floor-image.js';
import type { FloorImage } from './floor-image.js';

async function nextRender(el: HTMLElement): Promise<void> {
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
}

describe('floor-image', () => {
  let el: FloorImage;

  beforeEach(() => {
    el = document.createElement('myhouse-floor-image') as FloorImage;
    document.body.appendChild(el);
  });

  it('renders an img element with the configured src', async () => {
    el.src = '/test.png';
    await nextRender(el);
    const img = el.shadowRoot?.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/test.png');
  });

  it('renders a placeholder if no src is set', async () => {
    el.src = '';
    await nextRender(el);
    const placeholder = el.shadowRoot?.querySelector('.placeholder');
    expect(placeholder).toBeTruthy();
  });

  it('renders an error placeholder when the image fails to load', async () => {
    el.src = '/missing.png';
    await nextRender(el);
    const img = el.shadowRoot?.querySelector('img') as HTMLImageElement;
    img.dispatchEvent(new Event('error'));
    await nextRender(el);
    const error = el.shadowRoot?.querySelector('.error');
    expect(error?.textContent).toContain('Bild nicht gefunden');
  });

  it('provides a getImageRect method returning bounding rect', async () => {
    el.src = '/test.png';
    await nextRender(el);
    const rect = el.getImageRect();
    expect(rect).toHaveProperty('left');
    expect(rect).toHaveProperty('top');
    expect(rect).toHaveProperty('width');
    expect(rect).toHaveProperty('height');
  });
});
