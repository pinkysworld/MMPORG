export const terrainTypes = {
  plain: {
    name: 'Grasebene',
    color: 0x3f7d3b,
    movementCost: 1,
    description: 'Weite Wiesen in der Nähe von Kvirasim.'
  },
  road: {
    name: 'Straße',
    color: 0x8b5a2b,
    movementCost: 0.7,
    description: 'Eine von Händlern frequentierte Handelsstraße.'
  },
  forest: {
    name: 'Wald',
    color: 0x1f4d1a,
    movementCost: 1.2,
    description: 'Dichte Wälder, in denen sich allerlei Getier versteckt.'
  },
  mountain: {
    name: 'Hügelkette',
    color: 0x6e6c63,
    movementCost: 1.8,
    description: 'Steile Anhöhen, die den Blick auf die Sternenspitzen freigeben.'
  },
  town: {
    name: 'Kvirasim',
    color: 0xc4a484,
    movementCost: 0.5,
    description: 'Eine kleine thorwalsche Siedlung, sicherer Hafen für Reisende.'
  },
  ruin: {
    name: 'Verfallene Sternwarte',
    color: 0x555577,
    movementCost: 1.3,
    description: 'Überreste einer Hesindetempel-Sternwarte. Es heißt, dort wache eine Sternenklinge.'
  }
};

const layout = [
  ['mountain', 'mountain', 'forest', 'forest', 'forest', 'forest', 'mountain', 'mountain', 'mountain', 'mountain'],
  ['mountain', 'forest', 'forest', 'forest', 'plain', 'forest', 'forest', 'forest', 'mountain', 'mountain'],
  ['forest', 'forest', 'plain', 'road', 'road', 'road', 'plain', 'forest', 'forest', 'mountain'],
  ['forest', 'plain', 'plain', 'road', 'town', 'road', 'plain', 'plain', 'forest', 'forest'],
  ['forest', 'plain', 'forest', 'road', 'plain', 'road', 'forest', 'plain', 'plain', 'forest'],
  ['forest', 'plain', 'forest', 'road', 'plain', 'road', 'forest', 'plain', 'ruin', 'forest'],
  ['forest', 'plain', 'plain', 'road', 'plain', 'road', 'plain', 'plain', 'forest', 'forest'],
  ['mountain', 'forest', 'forest', 'road', 'road', 'road', 'forest', 'forest', 'forest', 'mountain'],
  ['mountain', 'mountain', 'forest', 'forest', 'plain', 'forest', 'forest', 'mountain', 'mountain', 'mountain'],
  ['mountain', 'mountain', 'mountain', 'forest', 'forest', 'forest', 'mountain', 'mountain', 'mountain', 'mountain']
];

export const worldMap = {
  name: 'Rondrajs Mark',
  width: layout[0].length,
  height: layout.length,
  layout
};

export const pointsOfInterest = {
  town: {
    position: { x: 4, y: 3 },
    title: 'Kvirasim',
    description:
      'Die thorwalsche Hafenstadt Kvirasim bietet Tavernen, Händler und eine Rast für müde Helden.'
  },
  ruin: {
    position: { x: 8, y: 5 },
    title: 'Verfallene Sternwarte',
    description:
      'Eine alte Beobachtungsstätte der Hesindekirche. Gerüchten zufolge ruht hier eine Sternenklinge.'
  }
};

export function tileAt(x, y) {
  if (x < 0 || y < 0 || y >= worldMap.height || x >= worldMap.width) {
    return null;
  }
  const type = layout[y][x];
  return { key: type, ...terrainTypes[type] };
}
