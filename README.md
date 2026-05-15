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
npm run dev           # Standalone-Demo unter http://localhost:5173/
npm run build         # Build erzeugt dist/myhouse-floorplan.js
npm test              # Vitest unit-tests
npm run test:coverage # Coverage-report
npm run lint
npm run typecheck
```

## Standalone-Demo

Die Karte laesst sich ohne Home Assistant testen — `npm run dev` startet einen Vite-Server mit einer Demo-Seite (`demo/index.html`), die Mock-Versionen von `ha-card` und `ha-icon` bereitstellt und ein paar Test-Entities (Lampen, Schalter, Sensor, Rolladen) anlegt. Du siehst View-Card und Editor nebeneinander, kannst Marker verschieben, und ueber Buttons im Header die Entity-States umschalten. Datei-Upload geht nicht (echte HA-API fehlt) — Image-URL-Eingabe funktioniert aber.

## Lizenz

MIT
