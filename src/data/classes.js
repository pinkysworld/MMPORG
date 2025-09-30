export const heroClasses = {
  krieger: {
    name: 'Krieger',
    description:
      'Bewaffnete Spezialisten Aventuriens, die im Nahkampf glänzen und ihre Gefährten beschützen.',
    baseAttributes: {
      mut: 12,
      klugheit: 11,
      intuition: 10,
      charisma: 9,
      fingerfertigkeit: 11,
      gewandtheit: 12,
      konstitution: 13,
      koerperkraft: 13
    },
    skills: ['Hiebwaffen', 'Schildkampf', 'Körperbeherrschung']
  },
  magier: {
    name: 'Magier',
    description:
      'Bewahrer arkaner Geheimnisse, die Elementarkräfte beschwören und Rätsel lösen.',
    baseAttributes: {
      mut: 10,
      klugheit: 14,
      intuition: 12,
      charisma: 11,
      fingerfertigkeit: 10,
      gewandtheit: 10,
      konstitution: 9,
      koerperkraft: 8
    },
    skills: ['Elementarmagie', 'Alchimie', 'Sagenkunde']
  },
  waldlaeufer: {
    name: 'Waldläufer',
    description:
      'Pfadfinder und Spurenleser, die unauffällig reisen und aus dem Hinterhalt angreifen.',
    baseAttributes: {
      mut: 11,
      klugheit: 10,
      intuition: 12,
      charisma: 10,
      fingerfertigkeit: 12,
      gewandtheit: 13,
      konstitution: 11,
      koerperkraft: 11
    },
    skills: ['Bögen', 'Wildnisleben', 'Sinnesschärfe']
  },
  geweiht: {
    name: 'Geweihte',
    description:
      'Auserwählte der Götter, die Wunder wirken, heilen und moralische Führer sind.',
    baseAttributes: {
      mut: 11,
      klugheit: 12,
      intuition: 12,
      charisma: 13,
      fingerfertigkeit: 10,
      gewandtheit: 10,
      konstitution: 10,
      koerperkraft: 9
    },
    skills: ['Liturgie', 'Heilkunde', 'Diplomatie']
  }
};

export function deriveCombatStats(attributes) {
  const le = Math.round((attributes.konstitution + attributes.koerperkraft) * 1.5);
  const ae = Math.round((attributes.intuition + attributes.klugheit) * 1.2);
  const at = Math.round((attributes.mut + attributes.koerperkraft) / 2 + 7);
  const pa = Math.round((attributes.gewandtheit + attributes.intuition) / 2 + 6);
  return { le, ae, at, pa };
}
