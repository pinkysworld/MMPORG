import { heroClasses, deriveCombatStats } from './classes.js';

function generateId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildHero(key, overrides = {}) {
  const heroClass = heroClasses[key];
  const nameSuggestions = {
    krieger: ['Alrik vom Greifenpass', 'Geron Eisenfaust'],
    magier: ['Rondraia Lichtblick', 'Hesindian Foliant'],
    waldlaeufer: ['Fiana Blattwind', 'Jasper Pfadfinder'],
    geweiht: ['Ankusch Alveraniar', 'Tsaiane Morgenstern']
  };

  const attributes = { ...heroClass.baseAttributes, ...overrides.attributes };
  const stats = deriveCombatStats(attributes);

  return {
    id: generateId(key),
    name: overrides.name || nameSuggestions[key][0],
    profession: heroClass.name,
    description: heroClass.description,
    attributes,
    combat: {
      ...stats,
      initiative: Math.round((attributes.intuition + attributes.gewandtheit) / 2),
      ruestung: overrides.ruestung ?? 2,
      waffe: overrides.waffe || (key === 'magier' ? 'Stab des Elements' : 'Langschwert'),
      lebensenergie: stats.le,
      astralenergie: stats.ae
    },
    skills: heroClass.skills,
    inventory: overrides.inventory || ['Brotzeit', 'Wasser', 'Heiltrank'],
    experience: overrides.experience || 0
  };
}

export function createDefaultParty() {
  return [
    buildHero('krieger'),
    buildHero('magier', { name: 'Hesindea Zauberkundig', ruestung: 1 }),
    buildHero('waldlaeufer', {
      name: 'Fenvarien Blattfährte',
      inventory: ['Seil', 'Dietrich', 'Heiltrank']
    }),
    buildHero('geweiht', { name: 'Seraia von Lichtquell', ruestung: 3 })
  ];
}
