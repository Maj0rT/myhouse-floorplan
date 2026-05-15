# MyHouse Floorplan — Design-Dokument

Datum: 2026-05-15
Status: Approved (Brainstorming-Phase abgeschlossen)

## Ziel

Eine Home-Assistant-Erweiterung, mit der ein Nutzer ein Bild einer Etage hochlädt, darauf Geräte (Entities) platziert, deren Status visuell sieht und sie per Klick schalten kann. Inspiriert vom Output des "Sweet Home 3D Home Assistant Plugin", aber mit nativem File-Upload und visuellem Editor — ohne externe Software.

## Scope

### MVP

- Eine **Custom Lovelace Card** (`custom:myhouse-floorplan`)
- Reine Frontend-Implementierung (kein Python-Backend, keine HA-Integration)
- Visueller Editor mit:
  - File-Upload-Button für das Etagenbild (nutzt HAs `/api/image/upload`)
  - Liste aller platzierten Marker
  - Drag-and-Drop zum Verschieben der Marker auf dem Bild
  - Entity-Picker zum Hinzufügen neuer Marker
- Read-Mode mit:
  - Bildanzeige mit responsiver Skalierung
  - Marker mit statusabhängiger Färbung/Icon
  - Klick auf Marker schaltet das Gerät (Tap-Action konfigurierbar)
- HACS-kompatible Distribution

### Bewusst NICHT im MVP (YAGNI)

- Mehrere Etagen / Floor-Switcher (kann später als Wrapper-Card folgen)
- 3D-Ansicht
- Animationen
- Pro-Marker individuelle Größe/Skalierung (initial: global)
- Conditional Visibility
- Eigene Python-Integration für Image-Storage (HA bietet bereits eine API)

## Architektur

### Erweiterungstyp

**Custom Lovelace Card** als ES-Modul-Bundle, registriert via `customElements.define` und ausgeliefert über HACS oder manuell in `config/www/`.

Begründung:
- Keine Python-Integration nötig — niedrigere Einstiegshürde, einfachere Installation
- HA-Frontend nutzt selbst Lit + TypeScript → native Integration
- Image-Upload geht über HAs eingebaute REST-API (`/api/image/upload`)

### Tech-Stack

| Bereich | Wahl |
|---|---|
| Sprache | TypeScript 5.9 (ESM) |
| Framework | Lit 3 |
| Build | Rollup mit `@rollup/plugin-typescript` und `@rollup/plugin-node-resolve` |
| Tests | Vitest + happy-dom |
| Linting | ESLint 9 + typescript-eslint |
| Coverage-Ziel | ≥80 % gemäß globaler Richtlinie |

### Projektstruktur

```
ha_myhouse/
├── docs/superpowers/specs/        # Design-Dokumente
├── src/
│   ├── floorplan-card.ts          # Main Card (View-Mode)
│   ├── floorplan-card-editor.ts   # Visual Editor
│   ├── components/
│   │   ├── device-marker.ts       # Einzelner Marker (Status + Click)
│   │   ├── floor-image.ts         # Bild-Container, Aspect-Ratio, Resize-Handler
│   │   └── entity-picker-panel.ts # Editor-Sidebar zur Entity-Auswahl
│   ├── helpers/
│   │   ├── state-display.ts       # entity → { icon, color, text }
│   │   ├── service-call.ts        # tap-action → hass.callService
│   │   ├── image-upload.ts        # File → /api/image/upload → URL
│   │   └── position-math.ts       # Mouse-Coords → %-Position (responsive)
│   ├── types.ts                   # FloorplanConfig, MarkerConfig
│   └── index.ts                   # customElement-Registrierung
├── test/                          # Vitest-Tests (oder neben Quellcode)
├── dist/                          # Build-Output (single bundle)
├── hacs.json                      # HACS-Manifest
├── package.json
├── rollup.config.mjs
├── tsconfig.json
└── README.md
```

Jede Datei bleibt unter 500 LOC. Die Editor-Datei wird die größte und wird bei Annäherung an die Grenze in Teil-Komponenten zerlegt.

## Datenmodell

```typescript
interface FloorplanConfig {
  type: 'custom:myhouse-floorplan';
  title?: string;
  image: string;              // URL: /api/image/serve/{id}/512x512 oder /local/...
  aspect_ratio?: string;      // z.B. "16:9". Default: natürliches Bildverhältnis
  markers: MarkerConfig[];
}

interface MarkerConfig {
  entity: string;             // z.B. "light.kueche"
  x: number;                  // Position in % (0–100), responsive
  y: number;
  label?: string;             // Override des friendly_name
  icon?: string;              // mdi-Icon-Override
  tap_action?: 'toggle' | 'more-info' | 'none';  // Default: toggle
}
```

Positionen in **Prozent** statt Pixel → responsive bei Browser-Resize.

## File-Upload-Flow

1. Im Editor klickt der Nutzer auf "Bild auswählen".
2. Ein verstecktes `<input type="file" accept="image/*">` wird geöffnet.
3. Beim Datei-Pick erstellt `image-upload.ts` ein `FormData` und postet an `POST /api/image/upload` mit dem `Authorization: Bearer <token>`-Header aus `hass.connection.options.auth`.
4. HA antwortet mit `{ id, filename, content_type, ... }`.
5. Die resultierende URL `/api/image/serve/{id}/original` wird in die Card-Config geschrieben.
6. Validierungen:
   - Max-Dateigröße: 10 MB (clientseitig vor Upload prüfen → Fehlermeldung)
   - Erlaubte Typen: `image/png`, `image/jpeg`, `image/webp`
   - Upload-Fehler: User-feedback via Banner im Editor; ursprüngliche Config bleibt erhalten

## Komponenten-Verantwortlichkeiten

- **`floorplan-card.ts`**: Read-only Anzeige. Property `hass: HomeAssistant`, `config: FloorplanConfig`. Rendert `<floor-image>` mit Slot für Marker. Empfängt Click-Events von Markern und delegiert an `service-call`.
- **`floorplan-card-editor.ts`**: Setzt das Lovelace-Editor-Interface (`setConfig`, `configChanged`-Event) um. Enthält File-Upload-Button, Marker-Liste, Drag-Handler.
- **`device-marker.ts`**: Props `entity`, `state`, `position`. Render: positionierter Button mit Icon. Click → `marker-click`-Event. Im Editor-Modus: drag-handler zum Verschieben.
- **`floor-image.ts`**: Wrapper um das `<img>`, hält die Slot-Children (Marker) per absolute Position. Liefert `getBoundingClientRect()` für Position-Math.
- **`state-display.ts`** (pure): Mapping `HassEntity → { icon, color, text }`. Unterstützt: `light`, `switch`, `binary_sensor`, `sensor`, `cover`.
- **`service-call.ts`** (pure): `tapAction(entity, action, hass)` → `hass.callService`. Domain-Mapping: light/switch/cover → `*.toggle`; sensor → `more-info` (event auf window).
- **`image-upload.ts`**: `uploadImage(file, hass) → Promise<string>` (gibt resultierende URL zurück). Sentinel-Errors für die UI.
- **`position-math.ts`** (pure): `clientCoordsToPercent(event, rect) → { x, y }`. Clamping auf [0, 100].

## Status-Visualisierung

| Domain | Anzeige |
|---|---|
| `light` | Lampen-Icon, Farbe: an = gelb, aus = grau, unavailable = rot |
| `switch` | Schalter-Icon, gleich wie Light |
| `binary_sensor` | Sensor-Icon, Farbe nach `device_class` (motion = orange wenn aktiv) |
| `sensor` | Wert als Text-Badge unter Icon, Einheit aus `unit_of_measurement` |
| `cover` | Rollladen-Icon, Farbe nach Position (offen/zu) |

Default-Tap-Action: `toggle` für light/switch/cover, `more-info` für sensoren.

## Error-Handling

- **Bild lädt nicht**: `<img>` `error`-Event → Placeholder mit Pfad + "Bild nicht gefunden". Editor weiter benutzbar (URL/Upload tauschbar).
- **Entity unbekannt** (`hass.states[entity] === undefined`): Marker grau mit Warn-Icon und Tooltip "Entity nicht gefunden".
- **Service-Call schlägt fehl**: `hass.callService`-Promise abfangen → HA-Notification via `fire-event('hass-notification', { message })`.
- **Image-Upload schlägt fehl**: Banner im Editor mit Fehlertext, keine Config-Änderung.

Alle Fehler im Frontend werden via `console.error` geloggt (Frontend, kein Backend-Logger-Pflicht).

## Testing-Strategie

- **`state-display.ts`** (pure): Vollständige Mappings pro Domain, ≥95 % Coverage
- **`service-call.ts`** (pure): Mock `hass.callService`, alle Domains durch
- **`position-math.ts`** (pure): Edge-Cases (Click ausserhalb, Resize)
- **`image-upload.ts`**: Mock `fetch`, Erfolgs- und Fehler-Pfade
- **`device-marker.ts`**: Vitest + happy-dom, Render-Snapshot + Click-Event
- **`floorplan-card.ts`**: Integration-Test mit Mock-hass, prüft Re-Render bei state-change
- **`floorplan-card-editor.ts`**: Editor-Interaktions-Tests (Marker hinzufügen/verschieben)

Ziel: ≥80 % Statement-Coverage.

Bestehende Tests werden bei späteren Code-Änderungen nicht automatisch angepasst — Fehlschläge werden gemeldet (globale Richtlinie).

## Build & Distribution

- `npm run build` → `dist/myhouse-floorplan.js` (single ES-Modul-Bundle)
- HACS-Manifest (`hacs.json`) referenziert das Bundle
- README mit Installations-Anleitung (HACS + manuell)
- Versionierung via `package.json` + Git-Tags

## Security (relevante Punkte)

- Image-Upload nutzt HAs eigene Authentifizierung (Token aus `hass.connection`) — keine eigenen Credentials
- Keine eigenen Secrets im Code
- Input-Validierung: Dateityp + Dateigröße vor Upload
- XSS-Schutz: Alle User-Inputs (label, icon) werden via Lit-Templates gerendert → automatisches Escaping
- Kein eval, kein dynamischer Code

## Offene Punkte für Implementation

Keine — alle Designentscheidungen sind in diesem Dokument festgehalten. Die Implementation kann direkt mit dem Plan beginnen.
