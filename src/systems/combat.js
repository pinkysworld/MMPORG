export class CombatSystem {
  constructor(gameState, onUpdate) {
    this.gameState = gameState;
    this.onUpdate = onUpdate;
    this.encounter = null;
    this.turnOrder = [];
    this.activeIndex = 0;
    this.waitingForInput = false;
    this.round = 1;
  }

  start(encounter) {
    this.encounter = encounter;
    this.round = 1;
    this.buildTurnOrder();
    this.activeIndex = 0;
    this.waitingForInput = false;
    this.advanceTurn();
  }

  buildTurnOrder() {
    const heroes = this.gameState.party
      .filter((hero) => hero.combat.lebensenergie > 0)
      .map((hero) => ({ type: 'hero', id: hero.id, initiative: hero.combat.initiative }));

    const enemies = this.encounter.members
      .filter((enemy) => enemy.currentLe > 0)
      .map((enemy) => ({ type: 'enemy', id: enemy.id, initiative: enemy.initiative }));

    this.turnOrder = [...heroes, ...enemies].sort((a, b) => b.initiative - a.initiative);
    if (this.turnOrder.length === 0) {
      this.turnOrder = heroes.length > 0 ? heroes : enemies;
    }
  }

  advanceTurn() {
    this.cleanup();
    if (!this.encounter) return;

    if (this.turnOrder.length === 0) {
      this.round += 1;
      this.buildTurnOrder();
      this.activeIndex = 0;
    }

    if (this.turnOrder.length === 0) {
      return;
    }

    if (this.activeIndex >= this.turnOrder.length) {
      this.activeIndex = 0;
      this.round += 1;
    }

    const actor = this.turnOrder[this.activeIndex];
    const actorData = this.getActor(actor);

    if (!actorData || actorData.hp <= 0) {
      this.activeIndex += 1;
      return this.advanceTurn();
    }

    if (actor.type === 'hero') {
      this.waitingForInput = true;
      this.emitUpdate({ activeCombatant: actorData });
    } else {
      this.waitingForInput = false;
      this.emitUpdate({ activeCombatant: actorData });
      setTimeout(() => {
        this.performEnemyTurn(actorData);
      }, 500);
    }
  }

  performHeroAction(action, heroId, targetId) {
    if (!this.waitingForInput) return;
    const hero = this.gameState.party.find((h) => h.id === heroId);
    if (!hero || hero.combat.lebensenergie <= 0) return;

    if (action === 'attack') {
      const target = this.encounter.members.find((enemy) => enemy.id === targetId);
      if (!target || target.currentLe <= 0) return;
      this.resolveHeroAttack(hero, target);
    } else if (action === 'cast') {
      const target = this.encounter.members.find((enemy) => enemy.id === targetId);
      if (!target || target.currentLe <= 0) return;
      this.resolveHeroSpell(hero, target);
    } else if (action === 'defend') {
      hero.combat.tempDefense = (hero.combat.tempDefense || 0) + 2;
      this.gameState.addLog(`${hero.name} verteidigt sich und sammelt Kräfte.`);
    }

    this.waitingForInput = false;
    this.nextTurn();
  }

  performEnemyTurn(enemy) {
    const target = this.chooseRandomHero();
    if (!target) {
      this.handleVictory();
      return;
    }

    const attackRoll = enemy.at + this.roll(6);
    const defenseRoll = target.combat.pa + this.roll(6) + (target.combat.tempDefense || 0);

    if (attackRoll > defenseRoll) {
      const damage = Math.max(3, Math.round(enemy.threat * 3 + Math.random() * 4));
      target.combat.lebensenergie = Math.max(target.combat.lebensenergie - damage, 0);
      this.gameState.addLog(
        `${enemy.name} trifft ${target.name} für ${damage} Schaden (${target.combat.lebensenergie}/${target.combat.maxLebensenergie} LE).`
      );
      if (target.combat.lebensenergie <= 0) {
        this.gameState.addLog(`${target.name} geht zu Boden!`);
      }
    } else {
      this.gameState.addLog(`${enemy.name} verfehlt ${target.name}.`);
    }

    this.nextTurn();
  }

  resolveHeroAttack(hero, target) {
    const attackRoll = hero.combat.at + this.roll(6);
    const defenseRoll = target.pa + this.roll(6);
    if (attackRoll > defenseRoll) {
      const damage = Math.max(4, Math.round(hero.attributes.koerperkraft / 2 + this.roll(6) / 2));
      target.currentLe = Math.max(target.currentLe - damage, 0);
      this.gameState.addLog(
        `${hero.name} trifft ${target.name} mit ${hero.combat.waffe} für ${damage} Schaden (${target.currentLe}/${target.le} LE).`
      );
      if (target.currentLe <= 0) {
        this.gameState.addLog(`${target.name} ist besiegt!`);
      }
    } else {
      this.gameState.addLog(`${hero.name} verfehlt ${target.name}.`);
    }
  }

  resolveHeroSpell(hero, target) {
    if (hero.combat.astralenergie < 4) {
      this.gameState.addLog(`${hero.name} fehlt es an Astralenergie für einen Zauber.`);
      return this.resolveHeroAttack(hero, target);
    }
    hero.combat.astralenergie = Math.max(hero.combat.astralenergie - 4, 0);
    const spellPower = hero.attributes.klugheit + this.roll(6);
    const resistance = target.pa + this.roll(6);
    if (spellPower >= resistance) {
      const damage = Math.max(6, Math.round(hero.attributes.intuition / 1.5 + this.roll(6)));
      target.currentLe = Math.max(target.currentLe - damage, 0);
      this.gameState.addLog(
        `${hero.name} schleudert einen Zauber und fügt ${target.name} ${damage} magischen Schaden zu (${target.currentLe}/${target.le} LE).`
      );
      if (target.currentLe <= 0) {
        this.gameState.addLog(`${target.name} zerfällt zu Sternenstaub.`);
      }
    } else {
      this.gameState.addLog(`${hero.name}s Zauber verfliegt wirkungslos.`);
    }
  }

  chooseRandomHero() {
    const living = this.gameState.party.filter((hero) => hero.combat.lebensenergie > 0);
    if (living.length === 0) return null;
    return living[Math.floor(Math.random() * living.length)];
  }

  getActor(actor) {
    if (actor.type === 'hero') {
      const hero = this.gameState.party.find((h) => h.id === actor.id);
      if (!hero) return null;
      return {
        type: 'hero',
        id: hero.id,
        name: hero.name,
        hp: hero.combat.lebensenergie,
        maxHp: hero.combat.maxLebensenergie,
        initiative: hero.combat.initiative
      };
    }
    const enemy = this.encounter.members.find((e) => e.id === actor.id);
    if (!enemy) return null;
    return {
      type: 'enemy',
      id: enemy.id,
      name: enemy.name,
      hp: enemy.currentLe,
      maxHp: enemy.le,
      initiative: enemy.initiative
    };
  }

  nextTurn() {
    this.cleanup();
    if (!this.encounter) return;

    this.activeIndex += 1;
    if (this.activeIndex >= this.turnOrder.length) {
      this.activeIndex = 0;
      this.round += 1;
    }
    this.advanceTurn();
  }

  cleanup() {
    if (!this.encounter) return;
    this.gameState.party.forEach((hero) => {
      if (hero.combat.tempDefense) {
        hero.combat.tempDefense = Math.max(hero.combat.tempDefense - 1, 0);
      }
    });

    this.encounter.members = this.encounter.members.filter((enemy) => enemy.currentLe > 0);

    if (this.encounter.members.length === 0) {
      this.handleVictory();
      return;
    }

    const partyAlive = this.gameState.party.some((hero) => hero.combat.lebensenergie > 0);
    if (!partyAlive) {
      this.handleDefeat();
    }
  }

  handleVictory() {
    this.gameState.endEncounter(true);
    this.emitUpdate({ finished: true, outcome: 'victory' });
    this.encounter = null;
  }

  handleDefeat() {
    this.gameState.endEncounter(false);
    this.emitUpdate({ finished: true, outcome: 'defeat' });
    this.encounter = null;
  }

  emitUpdate(extra = {}) {
    if (typeof this.onUpdate === 'function') {
      this.onUpdate({
        round: this.round,
        turnOrder: this.turnOrder,
        activeIndex: this.activeIndex,
        waitingForInput: this.waitingForInput,
        encounter: this.encounter,
        ...extra
      });
    }
  }

  roll(max) {
    return Math.floor(Math.random() * max) + 1;
  }
}
