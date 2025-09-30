export class UIController {
  constructor(gameState) {
    this.gameState = gameState;
    this.elements = {
      party: document.getElementById('party-panel'),
      log: document.getElementById('log-entries'),
      actions: document.getElementById('action-buttons'),
      quests: document.getElementById('quest-list'),
      location: document.getElementById('location-name'),
      travelMode: document.getElementById('travel-mode'),
      restButton: document.getElementById('rest-button'),
      campButton: document.getElementById('camp-button')
    };
    this.currentMode = 'exploration';
  }

  setMode(mode) {
    this.currentMode = mode;
    if (mode === 'combat') {
      this.elements.actions.classList.add('combat');
    } else {
      this.elements.actions.classList.remove('combat');
    }
  }

  renderAll(combatState = null) {
    this.renderParty();
    this.renderLog();
    this.renderQuests();
    this.renderLocation();

    if (this.currentMode === 'combat' && combatState) {
      this.renderCombatActions(combatState);
    }
  }

  renderParty() {
    const fatigue = Math.round(this.gameState.travelFatigue * 10) / 10;
    const time = Math.floor(this.gameState.timeOfDay) % 24;
    const minutes = Math.round((this.gameState.timeOfDay % 1) * 60)
      .toString()
      .padStart(2, '0');

    const header = `<div class="party-summary">
      <p><strong>Zeit:</strong> ${time}:${minutes} Uhr · <strong>Erschöpfung:</strong> ${fatigue}</p>
    </div>`;

    const cards = this.gameState.party
      .map((hero) => {
        const le = `${hero.combat.lebensenergie}/${hero.combat.maxLebensenergie}`;
        const ae = `${hero.combat.astralenergie}/${hero.combat.maxAstralenergie}`;
        return `<div class="hero-card">
          <h3>${hero.name} <span class="profession">(${hero.profession})</span></h3>
          <p class="description">${hero.description}</p>
          <div class="attributes">
            <span>Mut: ${hero.attributes.mut}</span>
            <span>IN: ${hero.attributes.intuition}</span>
            <span>KL: ${hero.attributes.klugheit}</span>
            <span>CH: ${hero.attributes.charisma}</span>
          </div>
          <p>LE: ${le} · AE: ${ae}</p>
          <p>AT: ${hero.combat.at} · PA: ${hero.combat.pa} · INI: ${hero.combat.initiative}</p>
          <p>Waffe: ${hero.combat.waffe} · Rüstung: RS ${hero.combat.ruestung}</p>
        </div>`;
      })
      .join('');

    this.elements.party.innerHTML = header + cards;
  }

  renderLog() {
    this.elements.log.innerHTML = this.gameState.logEntries
      .map((entry) => `<p>${entry}</p>`)
      .join('');
  }

  renderQuests() {
    this.elements.quests.innerHTML = this.gameState.quests
      .map(
        (quest) =>
          `<li class="quest quest-${quest.status}">
            <strong>${quest.title}</strong>
            <p>${quest.description}</p>
            <span class="status">Status: ${quest.status}</span>
          </li>`
      )
      .join('');
  }

  renderLocation() {
    const tile = this.gameState.currentTile;
    if (!tile) return;
    this.elements.location.textContent = `${tile.name} (${this.gameState.map.name})`;
    const mode = this.currentMode === 'combat' ? 'Kampfbereit' : 'Unterwegs';
    this.elements.travelMode.textContent = `Modus: ${mode}`;
  }

  renderExplorationActions(actions) {
    this.elements.actions.innerHTML = '';
    actions.forEach((action) => {
      const button = document.createElement('button');
      button.textContent = action.label;
      button.addEventListener('click', action.onClick);
      this.elements.actions.appendChild(button);
    });
  }

  renderCombatActions(state) {
    this.elements.actions.innerHTML = '';
    if (!state || !state.waitingForInput) {
      this.elements.actions.innerHTML = '<p>Die Gegner agieren...</p>';
      return;
    }

    const actor = state.activeCombatant;
    const header = document.createElement('p');
    header.innerHTML = `<strong>${actor.name}</strong> ist am Zug.`;
    this.elements.actions.appendChild(header);

    const enemies = state.encounter?.members || [];

    const attackButton = document.createElement('button');
    attackButton.textContent = 'Angreifen';
    attackButton.addEventListener('click', () => {
      const target = this.chooseTarget(enemies);
      if (target && this.onCombatAction) {
        this.onCombatAction({ type: 'attack', targetId: target.id, heroId: actor.id });
      }
    });
    this.elements.actions.appendChild(attackButton);

    const spellButton = document.createElement('button');
    spellButton.textContent = 'Zauber wirken';
    spellButton.addEventListener('click', () => {
      const target = this.chooseTarget(enemies);
      if (target && this.onCombatAction) {
        this.onCombatAction({ type: 'cast', targetId: target.id, heroId: actor.id });
      }
    });
    this.elements.actions.appendChild(spellButton);

    const defendButton = document.createElement('button');
    defendButton.textContent = 'Verteidigen';
    defendButton.addEventListener('click', () => {
      if (this.onCombatAction) {
        this.onCombatAction({ type: 'defend', heroId: actor.id });
      }
    });
    this.elements.actions.appendChild(defendButton);

    const list = document.createElement('div');
    list.className = 'enemy-list';
    list.innerHTML = enemies
      .map(
        (enemy) =>
          `<p>${enemy.name} – LE ${enemy.currentLe}/${enemy.le} · INI ${enemy.initiative}</p>`
      )
      .join('');
    this.elements.actions.appendChild(list);
  }

  chooseTarget(enemies) {
    const alive = enemies.filter((enemy) => enemy.currentLe > 0);
    if (alive.length === 0) return null;
    if (alive.length === 1) return alive[0];
    const index = Math.floor(Math.random() * alive.length);
    return alive[index];
  }

  bindRest(handler) {
    this.elements.restButton.addEventListener('click', handler);
  }

  bindCamp(handler) {
    this.elements.campButton.addEventListener('click', handler);
  }

  setCombatActionHandler(handler) {
    this.onCombatAction = handler;
  }
}
