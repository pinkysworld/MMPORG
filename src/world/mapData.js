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
  },
  water: {
    name: 'Fjordbucht',
    color: 0x1f4a7a,
    movementCost: 2.4,
    description: 'Kaltes Küstenwasser mit Nebelschwaden und schwankenden Booten.'
  }
};

const layout = [
  [
    'mountain',
    'mountain',
    'mountain',
    'mountain',
    'mountain',
    'mountain',
    'mountain',
    'mountain',
    'mountain',
    'mountain',
    'mountain',
    'mountain',
    'mountain',
    'mountain',
    'mountain',
    'mountain'
  ],
  [
    'mountain',
    'forest',
    'forest',
    'forest',
    'mountain',
    'mountain',
    'mountain',
    'mountain',
    'mountain',
    'mountain',
    'forest',
    'forest',
    'mountain',
    'mountain',
    'mountain',
    'mountain'
  ],
  [
    'mountain',
    'forest',
    'forest',
    'forest',
    'forest',
    'forest',
    'mountain',
    'mountain',
    'plain',
    'road',
    'road',
    'forest',
    'forest',
    'mountain',
    'mountain',
    'mountain'
  ],
  [
    'forest',
    'forest',
    'plain',
    'plain',
    'forest',
    'forest',
    'mountain',
    'plain',
    'plain',
    'road',
    'town',
    'road',
    'plain',
    'forest',
    'forest',
    'mountain'
  ],
  [
    'forest',
    'plain',
    'plain',
    'plain',
    'forest',
    'mountain',
    'mountain',
    'plain',
    'town',
    'town',
    'town',
    'road',
    'plain',
    'plain',
    'forest',
    'mountain'
  ],
  [
    'forest',
    'plain',
    'forest',
    'plain',
    'forest',
    'mountain',
    'plain',
    'plain',
    'town',
    'town',
    'town',
    'road',
    'plain',
    'forest',
    'forest',
    'mountain'
  ],
  [
    'forest',
    'plain',
    'forest',
    'plain',
    'plain',
    'plain',
    'plain',
    'road',
    'road',
    'town',
    'road',
    'road',
    'plain',
    'forest',
    'mountain',
    'mountain'
  ],
  [
    'forest',
    'forest',
    'forest',
    'plain',
    'forest',
    'plain',
    'road',
    'road',
    'plain',
    'plain',
    'plain',
    'road',
    'plain',
    'forest',
    'mountain',
    'mountain'
  ],
  [
    'mountain',
    'forest',
    'forest',
    'plain',
    'forest',
    'plain',
    'road',
    'plain',
    'plain',
    'plain',
    'plain',
    'road',
    'plain',
    'forest',
    'forest',
    'mountain'
  ],
  [
    'mountain',
    'mountain',
    'forest',
    'forest',
    'forest',
    'plain',
    'road',
    'plain',
    'forest',
    'forest',
    'plain',
    'road',
    'plain',
    'plain',
    'forest',
    'mountain'
  ],
  [
    'mountain',
    'mountain',
    'mountain',
    'forest',
    'forest',
    'plain',
    'road',
    'plain',
    'forest',
    'water',
    'water',
    'road',
    'plain',
    'forest',
    'forest',
    'mountain'
  ],
  [
    'mountain',
    'forest',
    'forest',
    'forest',
    'plain',
    'plain',
    'road',
    'plain',
    'forest',
    'water',
    'water',
    'plain',
    'plain',
    'forest',
    'mountain',
    'mountain'
  ],
  [
    'forest',
    'forest',
    'plain',
    'plain',
    'plain',
    'road',
    'road',
    'plain',
    'plain',
    'water',
    'water',
    'plain',
    'forest',
    'forest',
    'mountain',
    'mountain'
  ],
  [
    'forest',
    'plain',
    'plain',
    'forest',
    'road',
    'road',
    'plain',
    'plain',
    'plain',
    'water',
    'water',
    'plain',
    'forest',
    'mountain',
    'mountain',
    'mountain'
  ],
  [
    'forest',
    'plain',
    'forest',
    'forest',
    'road',
    'plain',
    'plain',
    'forest',
    'plain',
    'plain',
    'plain',
    'plain',
    'forest',
    'mountain',
    'mountain',
    'mountain'
  ],
  [
    'mountain',
    'forest',
    'forest',
    'forest',
    'road',
    'plain',
    'plain',
    'forest',
    'plain',
    'ruin',
    'plain',
    'plain',
    'forest',
    'mountain',
    'mountain',
    'mountain'
  ]
];

export const worldMap = {
  name: 'Sternküsten-Region',
  width: layout[0].length,
  height: layout.length,
  layout
};

export const pointsOfInterest = {
  town: {
    position: { x: 9, y: 4 },
    title: 'Kvirasim',
    description:
      'Die thorwalsche Hafenstadt Kvirasim bietet Tavernen, Händler und eine Rast für müde Helden.'
  },
  harbor: {
    position: { x: 9, y: 11 },
    title: 'Hafen der Morgenflut',
    description: 'Mehrere Knorrboote liegen hier vertäut. Fischer erzählen von seltsamen Lichtern über dem Fjord.'
  },
  forestShrine: {
    position: { x: 1, y: 7 },
    title: 'Schrein der Waldhüter',
    description: 'Zwischen uralten Tannen flackern Opferkerzen, die von Elfen zur Ehren Firuns entzündet wurden.'
  },
  ruin: {
    position: { x: 9, y: 15 },
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
