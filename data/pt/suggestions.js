// pt-BR: sugestões extras de Terra Natal e Povo (só para interpretação, não mudam regras).
// Completa as listas de window.REGIONS e window.PEOPLES com Caminhos (ar), poderes e qualidades (tr)
// e mais Princípios (pr). A Forja mostra a marca ✦ em cada opção sugerida.
(() => {
  'use strict';
  const add = (list, id, extra) => {
    const x = (list || []).find(e => e.id === id);
    if (!x) return;
    for (const [k, v] of Object.entries(extra)) x[k] = [...new Set((x[k] || []).concat(v))];
  };

  const REG = {
    bilgewater: { ar: ['marksman', 'cqc', 'wild-card', 'shadow'], tr: ['ranged-combat', 'close-combat', 'banter', 'underworld', 'swimming', 'water', 'sig-weapon', 'sig-vehicle', 'imposing', 'finesse'], pr: ['business', 'loner', 'team'] },
    bandle: { ar: ['wild-card', 'gadgeteer', 'transporter', 'speedster', 'marksman'], tr: ['teleportation', 'illusions', 'size-changing', 'inventions', 'gadgets', 'banter', 'creativity', 'acrobatics', 'stealth'], pr: ['discovery', 'mentor', 'family'] },
    demacia: { ar: ['armored', 'cqc', 'powerhouse', 'marksman'], tr: ['close-combat', 'leadership', 'conviction', 'sig-weapon', 'sig-vehicle', 'fitness', 'strength', 'history', 'radiant'], pr: ['defender', 'powerless', 'veteran', 'family', 'tactician'] },
    'shadow-isles': { ar: ['sorcerer', 'minion-maker', 'shadow', 'form-changer'], tr: ['infernal', 'intangibility', 'otherworldly-mythos', 'magical-lore', 'stealth', 'imposing', 'postcognition'], pr: ['immortality', 'history', 'mask', 'self-preservation'] },
    ionia: { ar: ['cqc', 'psychic', 'elemental', 'speedster', 'shadow', 'form-changer'], tr: ['agility', 'close-combat', 'self-discipline', 'insight', 'magical-lore', 'plants', 'animal-control', 'weather', 'otherworldly-mythos'], pr: ['mastery', 'mentor', 'honor', 'split'] },
    ixtal: { ar: ['elemental', 'sorcerer', 'form-changer', 'shadow'], tr: ['plants', 'stone', 'fire', 'weather', 'cold', 'magical-lore', 'stealth', 'animal-control', 'history'], pr: ['order', 'mastery', 'history', 'loner'] },
    nazumah: { ar: ['cqc', 'powerhouse', 'armored', 'marksman'], tr: ['close-combat', 'strength', 'vitality', 'leadership', 'sig-weapon', 'fitness', 'alertness', 'imposing'], pr: ['defender', 'hero', 'family', 'team'] },
    freljord: { ar: ['powerhouse', 'cqc', 'elemental', 'form-changer', 'marksman'], tr: ['cold', 'strength', 'vitality', 'close-combat', 'fitness', 'animal-control', 'sig-weapon', 'imposing', 'otherworldly-mythos'], pr: ['veteran', 'nomad', 'zealot', 'strength'] },
    noxus: { ar: ['cqc', 'powerhouse', 'blaster', 'shadow', 'armored'], tr: ['close-combat', 'strength', 'imposing', 'leadership', 'infernal', 'sig-weapon', 'self-discipline', 'underworld'], pr: ['tactician', 'veteran', 'strength', 'double-agent'] },
    piltover: { ar: ['gadgeteer', 'marksman', 'armored', 'robot'], tr: ['gadgets', 'inventions', 'power-suit', 'robotics', 'technology', 'science', 'investigation', 'ranged-combat', 'nuclear', 'persuasion'], pr: ['detective', 'clockwork', 'future', 'justice'] },
    zaun: { ar: ['gadgeteer', 'robot', 'wild-card', 'minion-maker', 'powerhouse'], tr: ['toxic', 'robotics', 'inventions', 'gadgets', 'technology', 'medicine', 'underworld', 'swinging', 'banter', 'vitality'], pr: ['lab', 'chaos', 'team', 'debtor'] },
    shurima: { ar: ['elemental', 'blaster', 'powerhouse', 'sorcerer', 'reality-shaper'], tr: ['radiant', 'fire', 'stone', 'history', 'leadership', 'vitality', 'sig-weapon', 'magical-lore', 'strength'], pr: ['ambition', 'great-power', 'order', 'hero'] },
    targon: { ar: ['blaster', 'armored', 'flyer', 'sorcerer', 'reality-shaper'], tr: ['cosmic', 'radiant', 'fitness', 'deep-space', 'conviction', 'sig-weapon', 'flight', 'precognition'], pr: ['hero', 'honor', 'great-power', 'mentor'] },
    void: { ar: ['form-changer', 'powerhouse', 'shadow', 'blaster'], tr: ['absorption', 'shapeshifting', 'teleportation', 'part-detachment', 'otherworldly-mythos', 'awareness', 'vitality', 'infernal'], pr: ['rage', 'amnesia', 'discovery', 'split'] }
  };
  for (const [id, x] of Object.entries(REG)) add(window.REGIONS, id, x);

  const PEO = {
    human: { bg: ['unremarkable', 'military', 'academic', 'upper-class'], ar: ['cqc', 'marksman', 'gadgeteer', 'sorcerer'], tr: ['close-combat', 'ranged-combat', 'leadership', 'persuasion', 'investigation', 'history', 'sig-weapon'], pr: ['everyman', 'family', 'hero', 'ambition', 'team'] },
    vastaya: { bg: ['exile', 'performer'], ps: ['genetic'], ar: ['shadow', 'elemental'], tr: ['agility', 'animal-control', 'shapeshifting', 'suggestion', 'acrobatics', 'awareness', 'otherworldly-mythos'], pr: ['flora', 'liberty', 'family', 'loner'] },
    yordle: { bg: ['adventurer', 'performer'], ps: ['genius'], ar: ['wild-card', 'gadgeteer', 'marksman', 'transporter'], tr: ['size-changing', 'illusions', 'teleportation', 'inventions', 'gadgets', 'banter', 'creativity', 'stealth'], pr: ['levity', 'youth', 'discovery', 'sidekick'] },
    spirit: { bg: ['blank-slate', 'anachronistic'], ps: ['supernatural'], ar: ['elemental', 'psychic', 'sorcerer', 'flyer'], tr: ['intangibility', 'weather', 'plants', 'otherworldly-mythos', 'magical-lore', 'insight', 'flight'], pr: ['immortality', 'detachment', 'peace', 'destiny'] },
    troll: { bg: ['struggling', 'criminal'], ps: ['nature', 'relic'], ar: ['powerhouse', 'cqc'], tr: ['strength', 'vitality', 'cold', 'close-combat', 'imposing', 'fitness', 'sig-weapon'], pr: ['ambition', 'savagery', 'family'] },
    minotaur: { bg: ['struggling', 'military'], ps: ['training'], ar: ['armored', 'cqc'], tr: ['strength', 'vitality', 'close-combat', 'imposing', 'fitness', 'conviction'], pr: ['liberty', 'compassion', 'defender'] },
    construct: { bg: ['blank-slate', 'anachronistic'], ps: ['tech-upgrades', 'relic'], ar: ['armored', 'powerhouse', 'gadgeteer'], tr: ['robotics', 'density-control', 'part-detachment', 'strength', 'lightning-calculator', 'technology', 'alertness', 'stone'], pr: ['clockwork', 'amnesia', 'indestructible', 'defender'] },
    plant: { bg: ['blank-slate'], ps: ['supernatural'], ar: ['elemental', 'minion-maker', 'form-changer'], tr: ['plants', 'toxic', 'animal-control', 'vitality', 'stealth', 'otherworldly-mythos'], pr: ['savagery', 'peace', 'immortality'] },
    dragonkin: { bg: ['otherworldly', 'exile'], ps: ['cosmos'], ar: ['powerhouse', 'flyer', 'blaster'], tr: ['fire', 'flight', 'strength', 'shapeshifting', 'imposing', 'vitality', 'cosmic'], pr: ['rage', 'great-power', 'energy-element'] }
  };
  for (const [id, x] of Object.entries(PEO)) add(window.PEOPLES, id, x);
})();
