import { GameState } from './systems/gameState.js';
import { Renderer3D } from './systems/renderer3d.js';
import { UIController } from './ui/uiController.js';
import { CombatSystem } from './systems/combat.js';
import { worldMap, terrainTypes } from './world/mapData.js';

class Game {
  constructor() {
    this.gameState = new GameState();
    this.renderer = new Renderer3D(document.getElementById('three-container'));
    this.ui = new UIController(this.gameState);
    this.combatSystem = new CombatSystem(this.gameState, (state) => this.onCombatUpdate(state));
    this.movementLocked = false;
  }

  init() {
    this.renderer.buildWorld(worldMap, terrainTypes);
    this.renderer.updatePartyPosition(this.gameState.position, worldMap);
    this.renderer.highlightTile(this.gameState.position, worldMap);
    this.renderer.start();

    this.registerInputs();
    this.ui.bindRest(() => this.handleRest());
    this.ui.bindCamp(() => this.handleCamp());
    this.ui.setCombatActionHandler((payload) => this.handleCombatAction(payload));

    this.refreshUI();
    this.gameState.addLog('Willkommen in Aventurien! Die Jagd nach der Sternenklinge beginnt.');
    this.refreshUI();
  }

  registerInputs() {
    const keyMap = {
      ArrowUp: { dx: 0, dy: -1 },
      ArrowDown: { dx: 0, dy: 1 },
      ArrowLeft: { dx: -1, dy: 0 },
      ArrowRight: { dx: 1, dy: 0 },
      w: { dx: 0, dy: -1 },
      s: { dx: 0, dy: 1 },
      a: { dx: -1, dy: 0 },
      d: { dx: 1, dy: 0 }
    };

    window.addEventListener('keydown', (event) => {
      if (this.gameState.mode !== 'exploration') return;
      const move = keyMap[event.key];
      if (move) {
        event.preventDefault();
        this.moveParty(move.dx, move.dy);
      }
    });
  }

  moveParty(dx, dy) {
    if (this.movementLocked) return;
    const moved = this.gameState.move(dx, dy);
    if (moved) {
      this.renderer.updatePartyPosition(this.gameState.position, worldMap);
      this.renderer.highlightTile(this.gameState.position, worldMap);
    }
    this.refreshUI();
    if (this.gameState.mode === 'combat') {
      this.enterCombat();
    }
  }

  refreshUI(combatState = null) {
    if (this.gameState.mode === 'exploration') {
      this.ui.setMode('exploration');
      this.ui.renderExplorationActions(this.buildExplorationActions());
      this.ui.renderAll();
    } else {
      this.ui.setMode('combat');
      this.ui.renderAll(combatState);
    }
  }

  buildExplorationActions() {
    const tile = this.gameState.currentTile;
    const actions = [
      {
        label: 'Umsehen',
        onClick: () => {
          this.gameState.addLog(`Ihr schaut euch aufmerksam um: ${tile.description}`);
          this.refreshUI();
        }
      },
      {
        label: 'Karte prüfen',
        onClick: () => {
          this.gameState.addLog(`Ihr befindet euch bei (${this.gameState.position.x + 1}, ${
            this.gameState.position.y + 1
          }) von ${this.gameState.map.width}×${this.gameState.map.height} Feldern.`);
          this.refreshUI();
        }
      }
    ];

    if (tile.key === 'forest') {
      actions.push({
        label: 'Spuren lesen',
        onClick: () => {
          const roll = Math.random();
          if (roll > 0.6) {
            this.gameState.addLog('Fenvarien entdeckt frische Spuren – vielleicht Goblins in der Nähe.');
          } else {
            this.gameState.addLog('Ihr findet nur verwilderte Tierpfade.');
          }
          this.refreshUI();
        }
      });
    }

    if (tile.key === 'town') {
      actions.push({
        label: 'Taverne besuchen',
        onClick: () => {
          this.gameState.addLog('In der Taverne erfahrt ihr Gerüchte über Räuber, die gen Osten zogen.');
          this.gameState.rest();
          this.refreshUI();
        }
      });
    }

    if (tile.key === 'ruin') {
      actions.push({
        label: 'Ruinen erforschen',
        onClick: () => {
          this.gameState.addLog('Zwischen den Sternsteinen glitzert tatsächlich eine Klinge – das Artefakt ist nah.');
          this.refreshUI();
        }
      });
    }

    return actions;
  }

  handleRest() {
    if (this.gameState.mode !== 'exploration') return;
    this.gameState.rest();
    this.refreshUI();
  }

  handleCamp() {
    if (this.gameState.mode !== 'exploration') return;
    this.gameState.camp();
    this.refreshUI();
  }

  enterCombat() {
    this.movementLocked = true;
    this.ui.setMode('combat');
    this.refreshUI();
    this.combatSystem.start(this.gameState.activeEncounter);
  }

  onCombatUpdate(state) {
    this.refreshUI(state);
    if (state?.finished) {
      setTimeout(() => {
        this.exitCombat();
      }, 800);
    }
  }

  handleCombatAction({ type, heroId, targetId }) {
    if (type === 'attack') {
      this.combatSystem.performHeroAction('attack', heroId, targetId);
    } else if (type === 'cast') {
      this.combatSystem.performHeroAction('cast', heroId, targetId);
    } else if (type === 'defend') {
      this.combatSystem.performHeroAction('defend', heroId);
    }
  }

  exitCombat() {
    this.movementLocked = false;
    this.ui.setMode('exploration');
    this.refreshUI();
  }
}

const game = new Game();
game.init();
