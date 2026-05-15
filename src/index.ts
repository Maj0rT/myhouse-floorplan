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

console.info(
  '%c MyHouse Floorplan %c v0.1.0 ',
  'color: white; background: #03a9f4; font-weight: 700;',
  'color: #03a9f4; background: white; font-weight: 700;',
);
