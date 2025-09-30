# Das Schwarze Auge: Sternenklingen (Browser-RPG)

Dieses Projekt ist ein liebevoll gestaltetes, browserbasiertes Retro-RPG im Stil klassischer "Das Schwarze Auge"-Computerspiele wie **Sternenschweif**. Es kombiniert eine taktische Kampfverwaltung mit einer einfachen 3D-Überlandkarte.

## Features

- **3D-Reisekarte** auf Basis von [Three.js](https://threejs.org/) mit Markierungen für Orte und Ruinen
- **Heldenverwaltung** mit vorgefertigten DSA-inspirierten Klassen, Talenten und Kampfwerten
- **Zufallsbegegnungen** abhängig vom Terrain, inklusive rundenbasiertem Kampfsystem
- **Quest-Logbuch** mit dynamischen Statusänderungen
- **Kontextabhängige Aktionen** wie Spurenlesen im Wald oder Tavernenkontakte in Kvirasim
- **Regeneration und Lager** zur Verwaltung von Lebens- und Astralenergie

## Schnellstart

1. Repository klonen oder Dateien herunterladen.
2. Einen lokalen Webserver im Projektwurzelverzeichnis starten, z. B. mit `npx serve` oder `python -m http.server`.
3. Die Anwendung unter `http://localhost:3000` (bzw. dem ausgegebenen Port) aufrufen und `index.html` laden.

> Tipp: Beim direkten Öffnen der `index.html` per Doppelklick funktioniert das Spiel ebenfalls, solange der Browser den Import externer Module über `file://` zulässt.

## Steuerung

- **Bewegen:** Pfeiltasten oder WASD
- **Rasten:** Button „Rasten“ (schnelle Regeneration)
- **Lager aufschlagen:** Button „Lager aufschlagen“ (volle Regeneration, kostet Zeit)
- **Kampfaktionen:** Buttons im Aktionsfeld während eines Kampfes

## Projektstruktur

```
MMPORG/
├── index.html           # Haupteinstieg
├── styles.css           # Look & Feel im Retro-Stil
├── src/
│   ├── main.js          # Spiel-Controller
│   ├── data/
│   │   ├── classes.js   # DSA-Heldenklassen & Werte
│   │   └── characters.js# Standardgruppe
│   ├── systems/
│   │   ├── combat.js    # Rundenbasiertes Kampfsystem
│   │   ├── gameState.js # Spielzustände & Logik
│   │   └── renderer3d.js# Three.js-Szenenaufbau
│   ├── ui/
│   │   └── uiController.js
│   └── world/
│       └── mapData.js   # Karte & Orte Aventuriens
└── README.md
```

## Weiterentwicklung

- Neue Karten lassen sich in `src/world/mapData.js` definieren.
- Weitere Heldenklassen oder Spezialfähigkeiten können in `src/data/classes.js` ergänzt werden.
- Für mehr grafische Vielfalt können in `renderer3d.js` zusätzliche Meshes oder Texturen eingebunden werden.

Viel Spaß in Aventurien und möge eure Heldengruppe die Sternenklinge sichern!
