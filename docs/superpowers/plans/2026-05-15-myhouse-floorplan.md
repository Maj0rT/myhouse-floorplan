# MyHouse Floorplan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Home Assistant Custom Lovelace Card "MyHouse Floorplan" that lets users upload a floor image, place device markers on it via drag-and-drop, see entity status visually, and toggle devices by clicking the markers.

**Architecture:** Frontend-only Custom Lovelace Card built with Lit 3 + TypeScript, bundled with Rollup, distributed via HACS. Image upload uses HA's built-in `/api/image/upload` REST endpoint. Marker positions are stored in % to be responsive.

**Tech Stack:** TypeScript 5.9, Lit 3, Rollup, Vitest + happy-dom, ESLint 9, HACS.

---

## File Structure Overview

```
ha_myhouse/
├── docs/superpowers/{specs,plans}/   # already exists
├── src/
│   ├── types.ts                       # FloorplanConfig, MarkerConfig, HassEntity, HomeAssistant
│   ├── helpers/
│   │   ├── position-math.ts           # client coords → % position (pure)
│   │   ├── state-display.ts           # entity → { icon, color, text } (pure)
│   │   ├── service-call.ts            # tap-action → hass.callService
│   │   └── image-upload.ts            # File → /api/image/upload → URL
│   ├── components/
│   │   ├── device-marker.ts           # single positioned marker (Lit)
│   │   ├── floor-image.ts             # image container + slot for markers (Lit)
│   │   └── entity-picker-panel.ts     # editor sidebar (Lit)
│   ├── floorplan-card.ts              # main read-mode card (Lit)
│   ├── floorplan-card-editor.ts       # visual editor (Lit)
│   └── index.ts                       # customElement registration + window.customCards
├── test/                              # tests live next to source (.test.ts files)
├── hacs.json                          # HACS manifest
├── package.json
├── rollup.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── eslint.config.js
├── .gitignore
└── README.md
```

---

### Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `rollup.config.mjs`
- Create: `vitest.config.ts`
- Create: `eslint.config.js`
- Create: `.gitignore`
- Create: `hacs.json`

- [ ] **Step 1: Create `.gitignore`**

```
node_modules/
dist/
coverage/
*.log
.DS_Store
.env
.env.*
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "myhouse-floorplan",
  "version": "0.1.0",
  "description": "Home Assistant Lovelace Card to display devices on a floor plan image",
  "type": "module",
  "main": "dist/myhouse-floorplan.js",
  "scripts": {
    "build": "rollup -c",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "lit": "^3.2.0"
  },
  "devDependencies": {
    "@rollup/plugin-node-resolve": "^15.3.0",
    "@rollup/plugin-typescript": "^12.1.1",
    "@rollup/plugin-terser": "^0.4.4",
    "@types/node": "^22.7.0",
    "@vitest/coverage-v8": "^2.1.0",
    "eslint": "^9.13.0",
    "happy-dom": "^15.7.0",
    "rollup": "^4.24.0",
    "tslib": "^2.7.0",
    "typescript": "^5.9.0",
    "typescript-eslint": "^8.11.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "declaration": false,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

- [ ] **Step 4: Create `rollup.config.mjs`**

```js
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/myhouse-floorplan.js',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    nodeResolve(),
    typescript({ tsconfig: './tsconfig.json' }),
    terser(),
  ],
};
```

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

- [ ] **Step 6: Create `eslint.config.js`**

```js
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    files: ['src/**/*.ts'],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  }
);
```

- [ ] **Step 7: Create `hacs.json`**

```json
{
  "name": "MyHouse Floorplan",
  "render_readme": true,
  "filename": "myhouse-floorplan.js"
}
```

- [ ] **Step 8: Install dependencies**

Run: `npm install`
Expected: Success, `node_modules/` is created.

- [ ] **Step 9: Verify build tooling works**

Run: `npm run typecheck`
Expected: PASS (no src files yet, so it does nothing — exit code 0).

Run: `npm run lint`
Expected: PASS (no src files yet — exit code 0).

- [ ] **Step 10: Commit**

```bash
git add .gitignore package.json package-lock.json tsconfig.json rollup.config.mjs vitest.config.ts eslint.config.js hacs.json
git commit -m "chore: projekt-setup mit typescript, lit, vitest, rollup"
```

---

### Task 2: Type Definitions

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Create `src/types.ts`**

```ts
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
  markers: MarkerConfig[];
}

export interface LovelaceCardEditor extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: FloorplanConfig): void;
}
```

- [ ] **Step 2: Verify types compile**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: typdefinitionen fuer config, entities und tap-actions"
```

---

### Task 3: Position Math Helper

**Files:**
- Create: `src/helpers/position-math.ts`
- Create: `src/helpers/position-math.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/helpers/position-math.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { clientCoordsToPercent } from './position-math.js';

const rect = { left: 100, top: 50, width: 200, height: 100 };

describe('clientCoordsToPercent', () => {
  it('returns 0/0 at top-left corner', () => {
    expect(clientCoordsToPercent(100, 50, rect)).toEqual({ x: 0, y: 0 });
  });

  it('returns 50/50 at the center', () => {
    expect(clientCoordsToPercent(200, 100, rect)).toEqual({ x: 50, y: 50 });
  });

  it('returns 100/100 at bottom-right corner', () => {
    expect(clientCoordsToPercent(300, 150, rect)).toEqual({ x: 100, y: 100 });
  });

  it('clamps to 0 when click is left of the image', () => {
    expect(clientCoordsToPercent(50, 100, rect).x).toBe(0);
  });

  it('clamps to 100 when click is right of the image', () => {
    expect(clientCoordsToPercent(500, 100, rect).x).toBe(100);
  });

  it('clamps to 0 when click is above the image', () => {
    expect(clientCoordsToPercent(200, 0, rect).y).toBe(0);
  });

  it('clamps to 100 when click is below the image', () => {
    expect(clientCoordsToPercent(200, 500, rect).y).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/helpers/position-math.test.ts`
Expected: FAIL with "Cannot find module './position-math.js'".

- [ ] **Step 3: Implement `position-math.ts`**

Create `src/helpers/position-math.ts`:

```ts
export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Percent {
  x: number;
  y: number;
}

export function clientCoordsToPercent(
  clientX: number,
  clientY: number,
  rect: Rect,
): Percent {
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;
  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/helpers/position-math.test.ts`
Expected: PASS, all 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/helpers/position-math.ts src/helpers/position-math.test.ts
git commit -m "feat: position-math helper fuer responsive marker-positionen"
```

---

### Task 4: State Display Helper

**Files:**
- Create: `src/helpers/state-display.ts`
- Create: `src/helpers/state-display.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/helpers/state-display.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getStateDisplay } from './state-display.js';
import type { HassEntity } from '../types.js';

function makeEntity(id: string, state: string, attributes = {}): HassEntity {
  return { entity_id: id, state, attributes };
}

describe('getStateDisplay', () => {
  it('returns unavailable display when entity is undefined', () => {
    const result = getStateDisplay(undefined);
    expect(result.icon).toBe('mdi:help-circle-outline');
    expect(result.color).toContain('error');
  });

  it('returns unavailable display when state is unavailable', () => {
    const result = getStateDisplay(makeEntity('light.a', 'unavailable'));
    expect(result.icon).toBe('mdi:alert-circle');
    expect(result.color).toContain('error');
  });

  it('returns on color for light in on state', () => {
    const result = getStateDisplay(makeEntity('light.a', 'on'));
    expect(result.icon).toBe('mdi:lightbulb');
    expect(result.color).toContain('active');
  });

  it('returns off color for light in off state', () => {
    const result = getStateDisplay(makeEntity('light.a', 'off'));
    expect(result.color).not.toContain('active');
  });

  it('uses custom icon from entity attributes', () => {
    const result = getStateDisplay(makeEntity('light.a', 'on', { icon: 'mdi:custom' }));
    expect(result.icon).toBe('mdi:custom');
  });

  it('returns switch icon for switch domain', () => {
    const result = getStateDisplay(makeEntity('switch.a', 'on'));
    expect(result.icon).toBe('mdi:toggle-switch');
  });

  it('returns binary_sensor icon and state-based color', () => {
    const onResult = getStateDisplay(makeEntity('binary_sensor.a', 'on'));
    expect(onResult.icon).toBe('mdi:radiobox-marked');
    expect(onResult.color).toContain('active');

    const offResult = getStateDisplay(makeEntity('binary_sensor.a', 'off'));
    expect(offResult.color).not.toContain('active');
  });

  it('returns sensor text with unit', () => {
    const result = getStateDisplay(
      makeEntity('sensor.temp', '21.5', { unit_of_measurement: '°C' })
    );
    expect(result.text).toBe('21.5 °C');
  });

  it('returns sensor text without unit when none', () => {
    const result = getStateDisplay(makeEntity('sensor.count', '42'));
    expect(result.text).toBe('42');
  });

  it('returns cover icon and on color when open', () => {
    const result = getStateDisplay(makeEntity('cover.a', 'open'));
    expect(result.icon).toBe('mdi:window-shutter');
    expect(result.color).toContain('active');
  });

  it('returns cover off color when closed', () => {
    const result = getStateDisplay(makeEntity('cover.a', 'closed'));
    expect(result.color).not.toContain('active');
  });

  it('falls back for unknown domain', () => {
    const result = getStateDisplay(makeEntity('weird.thing', 'foo'));
    expect(result.icon).toBe('mdi:eye');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/helpers/state-display.test.ts`
Expected: FAIL with "Cannot find module './state-display.js'".

- [ ] **Step 3: Implement `state-display.ts`**

Create `src/helpers/state-display.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/helpers/state-display.test.ts`
Expected: PASS, all 12 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/helpers/state-display.ts src/helpers/state-display.test.ts
git commit -m "feat: state-display helper fuer entity-status visualisierung"
```

---

### Task 5: Service Call Helper

**Files:**
- Create: `src/helpers/service-call.ts`
- Create: `src/helpers/service-call.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/helpers/service-call.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { handleTap } from './service-call.js';
import type { HomeAssistant } from '../types.js';

function makeHass(): HomeAssistant {
  return {
    states: {},
    callService: vi.fn().mockResolvedValue(undefined),
  };
}

describe('handleTap', () => {
  it('does nothing on action "none"', async () => {
    const hass = makeHass();
    const fireEvent = vi.fn();
    await handleTap('light.a', 'none', hass, fireEvent);
    expect(hass.callService).not.toHaveBeenCalled();
    expect(fireEvent).not.toHaveBeenCalled();
  });

  it('fires hass-more-info event on action "more-info"', async () => {
    const hass = makeHass();
    const fireEvent = vi.fn();
    await handleTap('sensor.a', 'more-info', hass, fireEvent);
    expect(fireEvent).toHaveBeenCalledWith('hass-more-info', { entityId: 'sensor.a' });
    expect(hass.callService).not.toHaveBeenCalled();
  });

  it('calls light.toggle on toggle for a light', async () => {
    const hass = makeHass();
    const fireEvent = vi.fn();
    await handleTap('light.kueche', 'toggle', hass, fireEvent);
    expect(hass.callService).toHaveBeenCalledWith('light', 'toggle', {
      entity_id: 'light.kueche',
    });
  });

  it('calls switch.toggle on toggle for a switch', async () => {
    const hass = makeHass();
    await handleTap('switch.x', 'toggle', hass, vi.fn());
    expect(hass.callService).toHaveBeenCalledWith('switch', 'toggle', {
      entity_id: 'switch.x',
    });
  });

  it('calls cover.toggle on toggle for a cover', async () => {
    const hass = makeHass();
    await handleTap('cover.x', 'toggle', hass, vi.fn());
    expect(hass.callService).toHaveBeenCalledWith('cover', 'toggle', {
      entity_id: 'cover.x',
    });
  });

  it('falls back to more-info for sensor on toggle', async () => {
    const hass = makeHass();
    const fireEvent = vi.fn();
    await handleTap('sensor.temp', 'toggle', hass, fireEvent);
    expect(hass.callService).not.toHaveBeenCalled();
    expect(fireEvent).toHaveBeenCalledWith('hass-more-info', { entityId: 'sensor.temp' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/helpers/service-call.test.ts`
Expected: FAIL with "Cannot find module './service-call.js'".

- [ ] **Step 3: Implement `service-call.ts`**

Create `src/helpers/service-call.ts`:

```ts
import type { HomeAssistant, TapAction } from '../types.js';

const TOGGLE_DOMAINS = new Set([
  'light',
  'switch',
  'cover',
  'automation',
  'fan',
  'input_boolean',
  'script',
]);

export async function handleTap(
  entityId: string,
  action: TapAction,
  hass: HomeAssistant,
  fireEvent: (type: string, detail: unknown) => void,
): Promise<void> {
  if (action === 'none') return;

  if (action === 'more-info') {
    fireEvent('hass-more-info', { entityId });
    return;
  }

  const domain = entityId.split('.')[0];
  if (!TOGGLE_DOMAINS.has(domain)) {
    fireEvent('hass-more-info', { entityId });
    return;
  }

  await hass.callService(domain, 'toggle', { entity_id: entityId });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/helpers/service-call.test.ts`
Expected: PASS, all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/helpers/service-call.ts src/helpers/service-call.test.ts
git commit -m "feat: service-call helper fuer tap-action dispatch"
```

---

### Task 6: Image Upload Helper

**Files:**
- Create: `src/helpers/image-upload.ts`
- Create: `src/helpers/image-upload.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/helpers/image-upload.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  uploadImage,
  ImageUploadError,
  MAX_FILE_SIZE,
  ALLOWED_TYPES,
} from './image-upload.js';
import type { HomeAssistant } from '../types.js';

function makeHass(token = 'TEST-TOKEN'): HomeAssistant {
  return {
    states: {},
    callService: vi.fn(),
    auth: { data: { access_token: token } },
  };
}

function makeFile(name: string, type: string, size: number): File {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

describe('uploadImage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects unsupported file types', async () => {
    const file = makeFile('a.gif', 'image/gif', 100);
    await expect(uploadImage(file, makeHass())).rejects.toBeInstanceOf(ImageUploadError);
    await expect(uploadImage(file, makeHass())).rejects.toMatchObject({ code: 'bad-type' });
  });

  it('rejects files larger than the max', async () => {
    const file = makeFile('a.png', 'image/png', MAX_FILE_SIZE + 1);
    await expect(uploadImage(file, makeHass())).rejects.toMatchObject({ code: 'too-large' });
  });

  it('posts the file with auth header and returns the serve URL', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'abc-123' }), { status: 200 })
    );

    const file = makeFile('a.png', 'image/png', 1000);
    const url = await uploadImage(file, makeHass('TOK-XYZ'));

    expect(url).toBe('/api/image/serve/abc-123/original');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, options] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe('/api/image/upload');
    expect((options as RequestInit).method).toBe('POST');
    const headers = (options as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer TOK-XYZ');
    expect((options as RequestInit).body).toBeInstanceOf(FormData);
  });

  it('throws upload-failed on non-2xx response', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(new Response('nope', { status: 500 }));
    const file = makeFile('a.png', 'image/png', 1000);
    await expect(uploadImage(file, makeHass())).rejects.toMatchObject({
      code: 'upload-failed',
    });
  });

  it('exports ALLOWED_TYPES with the three expected types', () => {
    expect(ALLOWED_TYPES).toEqual(['image/png', 'image/jpeg', 'image/webp']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/helpers/image-upload.test.ts`
Expected: FAIL with "Cannot find module './image-upload.js'".

- [ ] **Step 3: Implement `image-upload.ts`**

Create `src/helpers/image-upload.ts`:

```ts
import type { HomeAssistant } from '../types.js';

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export type ImageUploadErrorCode = 'bad-type' | 'too-large' | 'upload-failed';

export class ImageUploadError extends Error {
  constructor(public readonly code: ImageUploadErrorCode, message: string) {
    super(message);
    this.name = 'ImageUploadError';
  }
}

export async function uploadImage(file: File, hass: HomeAssistant): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ImageUploadError(
      'bad-type',
      `Dateityp ${file.type} nicht erlaubt. Erlaubt: ${ALLOWED_TYPES.join(', ')}`,
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new ImageUploadError(
      'too-large',
      `Datei zu gross (max. ${MAX_FILE_SIZE / 1024 / 1024} MB)`,
    );
  }

  const formData = new FormData();
  formData.append('file', file);

  const token = hass.auth?.data?.access_token ?? '';
  const response = await fetch('/api/image/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    throw new ImageUploadError(
      'upload-failed',
      `Upload fehlgeschlagen: HTTP ${response.status}`,
    );
  }

  const data = (await response.json()) as { id: string };
  return `/api/image/serve/${data.id}/original`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/helpers/image-upload.test.ts`
Expected: PASS, all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/helpers/image-upload.ts src/helpers/image-upload.test.ts
git commit -m "feat: image-upload helper mit dateityp- und groessenpruefung"
```

---

### Task 7: Device Marker Component

**Files:**
- Create: `src/components/device-marker.ts`
- Create: `src/components/device-marker.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/components/device-marker.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import './device-marker.js';
import type { DeviceMarker } from './device-marker.js';
import type { HassEntity } from '../types.js';

async function nextRender(el: HTMLElement): Promise<void> {
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
}

function makeEntity(id: string, state: string, attributes = {}): HassEntity {
  return { entity_id: id, state, attributes };
}

describe('device-marker', () => {
  let el: DeviceMarker;

  beforeEach(() => {
    el = document.createElement('myhouse-device-marker') as DeviceMarker;
    document.body.appendChild(el);
  });

  it('renders without crashing when entity is missing', async () => {
    el.entity = undefined;
    el.position = { x: 50, y: 50 };
    await nextRender(el);
    expect(el.shadowRoot?.querySelector('.marker')).toBeTruthy();
  });

  it('positions itself absolutely at the configured percent', async () => {
    el.entity = makeEntity('light.a', 'on');
    el.position = { x: 25, y: 75 };
    await nextRender(el);
    const marker = el.shadowRoot?.querySelector('.marker') as HTMLElement;
    expect(marker.style.left).toBe('25%');
    expect(marker.style.top).toBe('75%');
  });

  it('emits marker-click on click with the entity id', async () => {
    el.entity = makeEntity('light.a', 'on');
    el.position = { x: 10, y: 10 };
    await nextRender(el);
    const listener = vi.fn();
    el.addEventListener('marker-click', listener);
    const marker = el.shadowRoot?.querySelector('.marker') as HTMLElement;
    marker.click();
    expect(listener).toHaveBeenCalled();
    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(event.detail.entityId).toBe('light.a');
  });

  it('shows label override when provided', async () => {
    el.entity = makeEntity('light.a', 'on', { friendly_name: 'Kueche' });
    el.position = { x: 0, y: 0 };
    el.label = 'Custom Label';
    await nextRender(el);
    const label = el.shadowRoot?.querySelector('.label');
    expect(label?.textContent?.trim()).toBe('Custom Label');
  });

  it('shows friendly_name when label is not set', async () => {
    el.entity = makeEntity('light.a', 'on', { friendly_name: 'Kueche' });
    el.position = { x: 0, y: 0 };
    await nextRender(el);
    const label = el.shadowRoot?.querySelector('.label');
    expect(label?.textContent?.trim()).toBe('Kueche');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/device-marker.test.ts`
Expected: FAIL with "Cannot find module './device-marker.js'".

- [ ] **Step 3: Implement `device-marker.ts`**

Create `src/components/device-marker.ts`:

```ts
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
  @property({ type: Boolean, attribute: 'edit-mode' }) editMode = false;

  @state() private display: StateDisplay = { icon: 'mdi:help', color: '#999' };

  static styles = css`
    :host {
      position: absolute;
      pointer-events: none;
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

  protected updated(changed: PropertyValues): void {
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
    if (this.label) return this.label;
    const friendly = this.entity?.attributes?.friendly_name;
    if (typeof friendly === 'string') return friendly;
    return this.entity?.entity_id ?? '';
  }

  render() {
    const cssLeft = `${this.position.x}%`;
    const cssTop = `${this.position.y}%`;
    const labelText = this.resolveLabel();
    return html`
      <div
        class="marker ${this.editMode ? 'edit' : ''}"
        style="left: ${cssLeft}; top: ${cssTop};"
        @click=${this.handleClick}
        role="button"
        tabindex="0"
      >
        <div class="icon" style="color: ${this.display.color};">
          <ha-icon icon=${this.display.icon}></ha-icon>
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/device-marker.test.ts`
Expected: PASS, all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/device-marker.ts src/components/device-marker.test.ts
git commit -m "feat: device-marker komponente mit position und click-event"
```

---

### Task 8: Floor Image Component

**Files:**
- Create: `src/components/floor-image.ts`
- Create: `src/components/floor-image.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/components/floor-image.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/floor-image.test.ts`
Expected: FAIL with "Cannot find module './floor-image.js'".

- [ ] **Step 3: Implement `floor-image.ts`**

Create `src/components/floor-image.ts`:

```ts
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
      return html`<div class="placeholder">Kein Bild ausgewaehlt</div>`;
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/floor-image.test.ts`
Expected: PASS, all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/floor-image.ts src/components/floor-image.test.ts
git commit -m "feat: floor-image wrapper mit slot und fehler-fallback"
```

---

### Task 9: Floorplan Card (View Mode)

**Files:**
- Create: `src/floorplan-card.ts`
- Create: `src/floorplan-card.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/floorplan-card.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import './floorplan-card.js';
import type { FloorplanCard } from './floorplan-card.js';
import type { FloorplanConfig, HomeAssistant } from './types.js';

async function nextRender(el: HTMLElement): Promise<void> {
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
}

function makeHass(): HomeAssistant {
  return {
    states: {
      'light.kueche': {
        entity_id: 'light.kueche',
        state: 'on',
        attributes: { friendly_name: 'Kueche' },
      },
      'switch.tv': {
        entity_id: 'switch.tv',
        state: 'off',
        attributes: { friendly_name: 'TV' },
      },
    },
    callService: vi.fn().mockResolvedValue(undefined),
  };
}

describe('floorplan-card', () => {
  let el: FloorplanCard;

  beforeEach(() => {
    el = document.createElement('myhouse-floorplan-card') as FloorplanCard;
    document.body.appendChild(el);
  });

  it('throws if config has no image', () => {
    expect(() =>
      el.setConfig({
        type: 'custom:myhouse-floorplan',
        markers: [],
        image: '',
      } as FloorplanConfig),
    ).toThrow();
  });

  it('renders markers for configured entities', async () => {
    const config: FloorplanConfig = {
      type: 'custom:myhouse-floorplan',
      image: '/test.png',
      markers: [
        { entity: 'light.kueche', x: 10, y: 20 },
        { entity: 'switch.tv', x: 30, y: 40 },
      ],
    };
    el.hass = makeHass();
    el.setConfig(config);
    await nextRender(el);
    const markers = el.shadowRoot?.querySelectorAll('myhouse-device-marker');
    expect(markers?.length).toBe(2);
  });

  it('renders the title when provided', async () => {
    el.setConfig({
      type: 'custom:myhouse-floorplan',
      image: '/test.png',
      title: 'Erdgeschoss',
      markers: [],
    });
    await nextRender(el);
    const title = el.shadowRoot?.querySelector('.title');
    expect(title?.textContent?.trim()).toBe('Erdgeschoss');
  });

  it('calls hass service when a marker is clicked', async () => {
    const hass = makeHass();
    el.hass = hass;
    el.setConfig({
      type: 'custom:myhouse-floorplan',
      image: '/test.png',
      markers: [{ entity: 'light.kueche', x: 10, y: 20 }],
    });
    await nextRender(el);
    el.dispatchEvent(
      new CustomEvent('marker-click', {
        detail: { entityId: 'light.kueche' },
      }),
    );
    expect(hass.callService).toHaveBeenCalledWith('light', 'toggle', {
      entity_id: 'light.kueche',
    });
  });

  it('exposes getCardSize for lovelace', () => {
    expect(typeof el.getCardSize).toBe('function');
    expect(el.getCardSize()).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/floorplan-card.test.ts`
Expected: FAIL with "Cannot find module './floorplan-card.js'".

- [ ] **Step 3: Implement `floorplan-card.ts`**

Create `src/floorplan-card.ts`:

```ts
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FloorplanConfig, HomeAssistant, MarkerConfig } from './types.js';
import { handleTap } from './helpers/service-call.js';
import './components/floor-image.js';
import './components/device-marker.js';

function fireEvent(target: HTMLElement, type: string, detail: unknown): void {
  target.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
}

@customElement('myhouse-floorplan-card')
export class FloorplanCard extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config?: FloorplanConfig;

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
    'myhouse-floorplan-card': FloorplanCard;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/floorplan-card.test.ts`
Expected: PASS, all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/floorplan-card.ts src/floorplan-card.test.ts
git commit -m "feat: floorplan-card view-mode mit markern und tap-actions"
```

---

### Task 10: Entity Picker Panel

**Files:**
- Create: `src/components/entity-picker-panel.ts`
- Create: `src/components/entity-picker-panel.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/components/entity-picker-panel.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import './entity-picker-panel.js';
import type { EntityPickerPanel } from './entity-picker-panel.js';
import type { HomeAssistant } from '../types.js';

async function nextRender(el: HTMLElement): Promise<void> {
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
}

function makeHass(): HomeAssistant {
  return {
    states: {
      'light.a': { entity_id: 'light.a', state: 'on', attributes: { friendly_name: 'Lampe A' } },
      'switch.b': { entity_id: 'switch.b', state: 'off', attributes: { friendly_name: 'Schalter B' } },
      'sensor.c': { entity_id: 'sensor.c', state: '21', attributes: { friendly_name: 'Sensor C' } },
    },
    callService: vi.fn(),
  };
}

describe('entity-picker-panel', () => {
  let el: EntityPickerPanel;

  beforeEach(() => {
    el = document.createElement('myhouse-entity-picker-panel') as EntityPickerPanel;
    el.hass = makeHass();
    document.body.appendChild(el);
  });

  it('lists all entities by default', async () => {
    await nextRender(el);
    const options = el.shadowRoot?.querySelectorAll('.entity');
    expect(options?.length).toBe(3);
  });

  it('filters entities by search term', async () => {
    el.search = 'switch';
    await nextRender(el);
    const options = el.shadowRoot?.querySelectorAll('.entity');
    expect(options?.length).toBe(1);
    expect(options?.[0].textContent).toContain('Schalter B');
  });

  it('fires entity-selected when an entity is clicked', async () => {
    await nextRender(el);
    const listener = vi.fn();
    el.addEventListener('entity-selected', listener);
    const first = el.shadowRoot?.querySelector('.entity') as HTMLElement;
    first.click();
    expect(listener).toHaveBeenCalled();
    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(typeof event.detail.entityId).toBe('string');
  });

  it('updates the filter on input', async () => {
    await nextRender(el);
    const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;
    input.value = 'sensor';
    input.dispatchEvent(new Event('input'));
    await nextRender(el);
    const options = el.shadowRoot?.querySelectorAll('.entity');
    expect(options?.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/entity-picker-panel.test.ts`
Expected: FAIL with "Cannot find module './entity-picker-panel.js'".

- [ ] **Step 3: Implement `entity-picker-panel.ts`**

Create `src/components/entity-picker-panel.ts`:

```ts
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
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'myhouse-entity-picker-panel': EntityPickerPanel;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/entity-picker-panel.test.ts`
Expected: PASS, all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/entity-picker-panel.ts src/components/entity-picker-panel.test.ts
git commit -m "feat: entity-picker-panel mit suchfilter"
```

---

### Task 11: Floorplan Card Editor

**Files:**
- Create: `src/floorplan-card-editor.ts`
- Create: `src/floorplan-card-editor.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/floorplan-card-editor.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import './floorplan-card-editor.js';
import type { FloorplanCardEditor } from './floorplan-card-editor.js';
import type { FloorplanConfig, HomeAssistant } from './types.js';

async function nextRender(el: HTMLElement): Promise<void> {
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
}

function makeHass(): HomeAssistant {
  return {
    states: {
      'light.a': { entity_id: 'light.a', state: 'on', attributes: { friendly_name: 'A' } },
    },
    callService: vi.fn(),
    auth: { data: { access_token: 'TOK' } },
  };
}

describe('floorplan-card-editor', () => {
  let el: FloorplanCardEditor;

  beforeEach(() => {
    el = document.createElement('myhouse-floorplan-card-editor') as FloorplanCardEditor;
    el.hass = makeHass();
    document.body.appendChild(el);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders an image-upload section', async () => {
    el.setConfig({ type: 'custom:myhouse-floorplan', image: '', markers: [] });
    await nextRender(el);
    const upload = el.shadowRoot?.querySelector('.upload-section');
    expect(upload).toBeTruthy();
  });

  it('lists current markers from config', async () => {
    const config: FloorplanConfig = {
      type: 'custom:myhouse-floorplan',
      image: '/test.png',
      markers: [{ entity: 'light.a', x: 10, y: 20 }],
    };
    el.setConfig(config);
    await nextRender(el);
    const items = el.shadowRoot?.querySelectorAll('.marker-item');
    expect(items?.length).toBe(1);
  });

  it('emits config-changed when image-url is edited', async () => {
    el.setConfig({ type: 'custom:myhouse-floorplan', image: '', markers: [] });
    await nextRender(el);
    const listener = vi.fn();
    el.addEventListener('config-changed', listener);
    const input = el.shadowRoot?.querySelector('input[name="image"]') as HTMLInputElement;
    input.value = '/foo.png';
    input.dispatchEvent(new Event('input'));
    expect(listener).toHaveBeenCalled();
    const detail = (listener.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.config.image).toBe('/foo.png');
  });

  it('emits config-changed when entity is selected from picker', async () => {
    el.setConfig({ type: 'custom:myhouse-floorplan', image: '/test.png', markers: [] });
    await nextRender(el);
    const listener = vi.fn();
    el.addEventListener('config-changed', listener);
    el.shadowRoot
      ?.querySelector('myhouse-entity-picker-panel')
      ?.dispatchEvent(
        new CustomEvent('entity-selected', {
          detail: { entityId: 'light.a' },
          bubbles: true,
          composed: true,
        }),
      );
    expect(listener).toHaveBeenCalled();
    const detail = (listener.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.config.markers).toHaveLength(1);
    expect(detail.config.markers[0].entity).toBe('light.a');
  });

  it('removes a marker when its remove button is clicked', async () => {
    el.setConfig({
      type: 'custom:myhouse-floorplan',
      image: '/test.png',
      markers: [{ entity: 'light.a', x: 10, y: 20 }],
    });
    await nextRender(el);
    const listener = vi.fn();
    el.addEventListener('config-changed', listener);
    const btn = el.shadowRoot?.querySelector('.marker-item .remove') as HTMLButtonElement;
    btn.click();
    expect(listener).toHaveBeenCalled();
    const detail = (listener.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.config.markers).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/floorplan-card-editor.test.ts`
Expected: FAIL with "Cannot find module './floorplan-card-editor.js'".

- [ ] **Step 3: Implement `floorplan-card-editor.ts`**

Create `src/floorplan-card-editor.ts`:

```ts
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FloorplanConfig, HomeAssistant, MarkerConfig } from './types.js';
import { uploadImage, ImageUploadError } from './helpers/image-upload.js';
import { clientCoordsToPercent } from './helpers/position-math.js';
import './components/entity-picker-panel.js';
import './components/floor-image.js';
import './components/device-marker.js';

@customElement('myhouse-floorplan-card-editor')
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
    .marker-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
      border-bottom: 1px solid var(--divider-color, #eee);
      font-size: 13px;
    }
    .marker-item .entity {
      flex: 1;
      font-family: monospace;
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
        .label=${marker.label ?? ''}
        edit-mode
        @mousedown=${(e: MouseEvent) => this.startDrag(index, e)}
      ></myhouse-device-marker>
    `;
  }

  render() {
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
          : this.config.markers.map(
              (marker, index) => html`
                <div class="marker-item">
                  <div class="entity">${marker.entity}</div>
                  <div>x: ${marker.x.toFixed(0)}%, y: ${marker.y.toFixed(0)}%</div>
                  <button class="remove danger" @click=${() => this.removeMarker(index)}>
                    Entfernen
                  </button>
                </div>
              `,
            )}
      </div>

      ${this.config.image
        ? html`
            <div class="section">
              <div class="section-title">Vorschau (Marker verschiebbar)</div>
              <div class="preview">
                <myhouse-floor-image .src=${this.config.image}>
                  ${this.config.markers.map((m, i) => this.renderMarker(m, i))}
                </myhouse-floor-image>
              </div>
            </div>
          `
        : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'myhouse-floorplan-card-editor': FloorplanCardEditor;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/floorplan-card-editor.test.ts`
Expected: PASS, all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/floorplan-card-editor.ts src/floorplan-card-editor.test.ts
git commit -m "feat: floorplan-card-editor mit upload und drag-and-drop"
```

---

### Task 12: Card Registration + Editor Link

**Files:**
- Create: `src/index.ts`
- Modify: `src/floorplan-card.ts` (add static getConfigElement)

- [ ] **Step 1: Modify `floorplan-card.ts` to expose its editor**

In `src/floorplan-card.ts`, change the class to add a `getConfigElement` static method and a stub `getStubConfig`. Find the existing class definition:

```ts
@customElement('myhouse-floorplan-card')
export class FloorplanCard extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config?: FloorplanConfig;
```

Replace with:

```ts
@customElement('myhouse-floorplan-card')
export class FloorplanCard extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config?: FloorplanConfig;

  static async getConfigElement(): Promise<HTMLElement> {
    await import('./floorplan-card-editor.js');
    return document.createElement('myhouse-floorplan-card-editor');
  }

  static getStubConfig(): FloorplanConfig {
    return {
      type: 'custom:myhouse-floorplan',
      image: '',
      markers: [],
    };
  }
```

- [ ] **Step 2: Create `src/index.ts`**

```ts
import './floorplan-card.js';

interface CustomCardEntry {
  type: string;
  name: string;
  description: string;
  preview?: boolean;
}

interface WindowWithCustomCards extends Window {
  customCards?: CustomCardEntry[];
}

const w = window as WindowWithCustomCards;
w.customCards = w.customCards || [];
w.customCards.push({
  type: 'myhouse-floorplan',
  name: 'MyHouse Floorplan',
  description: 'Platziere Geraete auf einem Etagenbild und steuere sie per Klick.',
  preview: true,
});

// eslint-disable-next-line no-console
console.info(
  '%c MyHouse Floorplan %c v0.1.0 ',
  'color: white; background: #03a9f4; font-weight: 700;',
  'color: #03a9f4; background: white; font-weight: 700;',
);
```

- [ ] **Step 3: Verify build works**

Run: `npm run build`
Expected: PASS, creates `dist/myhouse-floorplan.js` and source map.

- [ ] **Step 4: Verify all tests still pass**

Run: `npm test`
Expected: PASS, all tests across all files green.

- [ ] **Step 5: Verify typecheck and lint clean**

Run: `npm run typecheck && npm run lint`
Expected: PASS for both.

- [ ] **Step 6: Commit**

```bash
git add src/index.ts src/floorplan-card.ts
git commit -m "feat: card-registrierung und editor-verknuepfung"
```

---

### Task 13: HACS Manifest Polish + README

**Files:**
- Modify: `hacs.json` (already exists)
- Create: `README.md`

- [ ] **Step 1: Verify `hacs.json` is correct**

The file from Task 1 should already read:

```json
{
  "name": "MyHouse Floorplan",
  "render_readme": true,
  "filename": "myhouse-floorplan.js"
}
```

If it differs, update to exactly match the above.

- [ ] **Step 2: Create `README.md`**

```markdown
# MyHouse Floorplan

Eine Home-Assistant-Lovelace-Karte, mit der du ein Bild einer Etage hochlaedst und darauf einzelne Geraete platzierst. Die Karte zeigt den Status jedes Geraets visuell an und erlaubt das Schalten per Klick.

## Funktionen

- Bild-Upload direkt aus dem Lovelace-Editor (kein Zugriff auf das Dateisystem noetig)
- Drag-and-Drop zum Platzieren der Geraete auf dem Bild
- Statusanzeige fuer `light`, `switch`, `binary_sensor`, `sensor`, `cover`
- Klick auf einen Marker schaltet das Geraet (oder oeffnet die more-info-Ansicht)
- Responsive: Marker-Positionen sind in % gespeichert

## Installation

### Via HACS

1. HACS oeffnen → "Frontend"
2. "+ Explore & Download Repositories" → Custom Repo hinzufuegen mit dieser URL
3. Karte installieren und Browser-Cache leeren

### Manuell

1. `dist/myhouse-floorplan.js` nach `config/www/myhouse-floorplan.js` kopieren
2. Unter `Konfiguration → Lovelace Dashboards → Ressourcen` neue Ressource hinzufuegen:
   - URL: `/local/myhouse-floorplan.js`
   - Typ: `JavaScript-Modul`
3. Browser-Cache leeren

## Konfiguration

```yaml
type: custom:myhouse-floorplan
title: Erdgeschoss
image: /api/image/serve/abc-123/original
markers:
  - entity: light.kueche
    x: 25
    y: 40
  - entity: switch.tv
    x: 60
    y: 70
    label: Wohnzimmer-TV
    tap_action: more-info
```

| Property | Typ | Default | Beschreibung |
|---|---|---|---|
| `image` | string | — | URL zum Etagenbild. Wird vom Editor automatisch nach Upload gefuellt. |
| `title` | string | — | Optionaler Titel oben auf der Karte. |
| `aspect_ratio` | string | — | z.B. `16:9`. Standard: natuerliches Bildverhaeltnis. |
| `markers` | array | `[]` | Liste der platzierten Geraete. |
| `markers[].entity` | string | — | Entity-ID. |
| `markers[].x` | number | — | Position in % (0–100). |
| `markers[].y` | number | — | Position in % (0–100). |
| `markers[].label` | string | `friendly_name` | Beschriftung am Marker. |
| `markers[].icon` | string | nach Domain | mdi-Icon-Override. |
| `markers[].tap_action` | `toggle` \| `more-info` \| `none` | `toggle` | Aktion beim Klick. |

## Entwicklung

```bash
npm install
npm run build         # Build erzeugt dist/myhouse-floorplan.js
npm test              # Vitest unit-tests
npm run test:coverage # Coverage-report
npm run lint
npm run typecheck
```

## Lizenz

MIT
```

- [ ] **Step 3: Final smoke check**

Run: `npm run build && npm test && npm run lint && npm run typecheck`
Expected: All pass.

- [ ] **Step 4: Verify the bundle contents**

Run: `ls -lh dist/myhouse-floorplan.js`
Expected: File exists, size is reasonable (typically 30–80 KB minified).

- [ ] **Step 5: Commit**

```bash
git add README.md hacs.json
git commit -m "docs: readme mit installations- und konfigurations-anleitung"
```

---

## Verification Checklist (Run After All Tasks)

After all tasks, verify:

- [ ] `npm test` → all tests green
- [ ] `npm run test:coverage` → ≥80 % statement/branch/function/line coverage
- [ ] `npm run lint` → no errors
- [ ] `npm run typecheck` → no errors
- [ ] `npm run build` → `dist/myhouse-floorplan.js` exists
- [ ] Git log shows one commit per task (13 commits total)
- [ ] `README.md` contains installation and config docs
- [ ] `hacs.json` is present and valid
