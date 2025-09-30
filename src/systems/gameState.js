import { createDefaultParty } from '../data/characters.js';
import { worldMap, tileAt, terrainTypes, pointsOfInterest } from '../world/mapData.js';

const encounterTable = {
  plain: [
    { name: 'Wildschwein', threat: 1, le: 18, at: 8, pa: 6, initiative: 9 },
    { name: 'Wilder Hund', threat: 1, le: 16, at: 9, pa: 5, initiative: 10 }
  ],
  forest: [
    { name: 'Goblin-Späher', threat: 2, le: 22, at: 10, pa: 7, initiative: 12 },
    { name: 'Waldspinne', threat: 2, le: 20, at: 11, pa: 6, initiative: 11 }
  ],
  mountain: [
    { name: 'Höhlentroll', threat: 3, le: 32, at: 12, pa: 8, initiative: 8 },
    { name: 'Steingargyl', threat: 4, le: 28, at: 13, pa: 9, initiative: 9 }
  ],
  road: [
    { name: 'Straßenräuber', threat: 2, le: 24, at: 11, pa: 8, initiative: 11 }
  ],
  town: [],
  ruin: [
    { name: 'Sternenklingen-Wächter', threat: 4, le: 35, at: 13, pa: 10, initiative: 12 }
  ],
  water: []
};

const baseQuests = [
  {
    id: 'kvirasim-intro',
    title: 'Willkommen in Kvirasim',
    description:
      'Sprecht mit dem Thorwaler Kapitän in Kvirasim, um mehr über die verschwundene Sternenklinge zu erfahren.',
    status: 'aktiv'
  },
  {
    id: 'sternenklinge',
    title: 'Die Sternenklinge',
    description:
      'Findet die legendäre Sternenklinge in den Ruinen der alten Sternwarte.',
    status: 'offen'
  }
];

export class GameState {
  constructor() {
    this.map = worldMap;
    this.party = createDefaultParty();
    this.party.forEach((hero) => {
      hero.combat.maxLebensenergie = hero.combat.lebensenergie;
      hero.combat.maxAstralenergie = hero.combat.astralenergie;
    });
    this.position = { x: 9, y: 4 };
    this.mode = 'exploration';
    this.logEntries = [];
    this.timeOfDay = 10;
    this.travelFatigue = 0;
    this.quests = baseQuests.map((q) => ({ ...q }));
    this.activeEncounter = null;
  }

  get currentTile() {
    return tileAt(this.position.x, this.position.y);
  }

  addLog(entry) {
    const timestamp = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    this.logEntries.unshift(`[${timestamp}] ${entry}`);
    this.logEntries = this.logEntries.slice(0, 40);
  }

  move(dx, dy) {
    const target = { x: this.position.x + dx, y: this.position.y + dy };
    const tile = tileAt(target.x, target.y);
    if (!tile) {
      this.addLog('Dort geht es nicht weiter. Eine unsichtbare Barriere hält euch auf.');
      return false;
    }

    this.position = target;
    this.travelFatigue += terrainTypes[tile.key].movementCost;
    this.advanceTime(terrainTypes[tile.key].movementCost * 0.7);

    const poi = this.pointOfInterestAt(target);
    if (poi) {
      this.addLog(`Ihr erreicht ${poi.title}. ${poi.description}`);
      this.updateQuestProgress(poi);
    } else {
      this.addLog(`Ihr bewegt euch durch ${tile.description}`);
    }

    if (this.shouldTriggerEncounter(tile.key)) {
      const enemy = this.generateEncounter(tile.key);
      this.startEncounter(enemy);
    }
    return true;
  }

  advanceTime(hours) {
    this.timeOfDay += hours;
    if (this.timeOfDay >= 24) {
      this.timeOfDay -= 24;
    }
  }

  pointOfInterestAt(position) {
    return Object.values(pointsOfInterest).find(
      (poi) => poi.position.x === position.x && poi.position.y === position.y
    );
  }

  updateQuestProgress(poi) {
    if (poi.title === 'Kvirasim') {
      this.markQuestComplete('kvirasim-intro');
      this.activateQuest('sternenklinge');
      this.addLog('Der Kapitän berichtet von Räubern, die Richtung Sternwarte aufgebrochen sind.');
    }
    if (poi.title === 'Verfallene Sternwarte') {
      this.markQuestComplete('sternenklinge');
      this.addLog('Zwischen den Ruinen findet ihr die schimmernde Sternenklinge. Aventurien ist gerettet!');
    }
  }

  markQuestComplete(id) {
    const quest = this.quests.find((q) => q.id === id);
    if (quest && quest.status !== 'abgeschlossen') {
      quest.status = 'abgeschlossen';
    }
  }

  activateQuest(id) {
    const quest = this.quests.find((q) => q.id === id);
    if (quest && quest.status === 'offen') {
      quest.status = 'aktiv';
    }
  }

  shouldTriggerEncounter(tileKey) {
    if (this.mode !== 'exploration') return false;
    if (!encounterTable[tileKey] || encounterTable[tileKey].length === 0) return false;
    const fatigueFactor = Math.min(this.travelFatigue / 10, 0.25);
    const baseChance = tileKey === 'road' ? 0.08 : tileKey === 'town' ? 0 : 0.18;
    const roll = Math.random();
    return roll < baseChance + fatigueFactor;
  }

  generateEncounter(tileKey) {
    const table = encounterTable[tileKey] || encounterTable.plain;
    const template = table[Math.floor(Math.random() * table.length)];
    const size = 1 + Math.round(Math.random());
    return {
      name: template.name,
      members: Array.from({ length: size }, (_, index) => ({
        id: `${template.name}-${index}`,
        ...template,
        currentLe: template.le,
        morale: 10
      }))
    };
  }

  startEncounter(enemy) {
    this.mode = 'combat';
    this.activeEncounter = enemy;
    this.addLog(`Ein Kampf beginnt! ${enemy.members.length}x ${enemy.name} stellen sich euch.`);
  }

  endEncounter(victory) {
    if (victory) {
      const reward = 15 + Math.round(Math.random() * 10);
      this.party.forEach((hero) => {
        hero.experience += reward;
        hero.combat.lebensenergie = Math.min(
          hero.combat.maxLebensenergie,
          hero.combat.lebensenergie + Math.round(hero.combat.maxLebensenergie * 0.25)
        );
      });
      this.addLog(`Der Kampf ist vorbei. Jeder Held erhält ${reward} Abenteuerpunkte.`);
    } else {
      this.addLog('Die Gruppe zieht sich gezeichnet vom Kampf zurück.');
    }
    this.mode = 'exploration';
    this.activeEncounter = null;
    this.travelFatigue = Math.max(this.travelFatigue - 2, 0);
  }

  rest() {
    this.travelFatigue = Math.max(this.travelFatigue - 4, 0);
    this.party.forEach((hero) => {
      hero.combat.lebensenergie = Math.min(
        hero.combat.maxLebensenergie,
        hero.combat.lebensenergie + 6
      );
      hero.combat.astralenergie = Math.min(
        hero.combat.maxAstralenergie,
        hero.combat.astralenergie + 4
      );
    });
    this.advanceTime(2);
    this.addLog('Die Gruppe ruht sich aus und regeneriert Kräfte.');
  }

  camp() {
    this.travelFatigue = Math.max(this.travelFatigue - 6, 0);
    this.party.forEach((hero) => {
      hero.combat.lebensenergie = hero.combat.maxLebensenergie;
      hero.combat.astralenergie = hero.combat.maxAstralenergie;
    });
    this.advanceTime(8);
    this.addLog('Ihr schlagt ein Lager auf. Nach einer erholsamen Nacht seid ihr wieder voller Tatendrang.');
  }
}
