// Runeterra Foundry — access layer over the canonical dataset.
// The dataset (traits, abilities, backgrounds, power sources, archetypes, personalities,
// principles, peoples, regions, health table…) is reused verbatim from the Runeterra web
// app ("Forja de Campeões", the rules source of truth) and loaded as classic scripts listed
// in system.json. English ids stay canonical; pt-BR display names come with the data / overlays.

const dn = die => parseInt(String(die).slice(1), 10) || 4;

/** Flattened trait index: key → {key, sc, rt, desc, lore, cat, kind}. */
let TRAIT = null;

function buildTraitIndex() {
  const out = {};
  for (const [catId, cat] of Object.entries(window.TRAIT_CATEGORIES ?? {})) {
    for (const item of cat.items ?? []) {
      const [key, sc, rt, desc, lore] = item;
      out[key] = { key, sc, rt, desc, lore, cat: catId, kind: cat.kind };
    }
  }
  // Synthetic trait: the Temperament's Signature Quality (always d8).
  out['rp-quality'] = {
    key: 'rp-quality', sc: 'RP Quality', rt: 'Qualidade de Interpretação',
    desc: '', lore: '', cat: 'Q:special', kind: 'quality'
  };
  return out;
}

export const catalog = {
  /** Lazy trait index (dataset loads via classic scripts before this module runs). */
  get traits() {
    if (!TRAIT) TRAIT = buildTraitIndex();
    return TRAIT;
  },

  trait(key) {
    return this.traits[key] ?? null;
  },

  /** Display name resolution chain (mirrors the web app): custom → qname for rp-quality → rt → key. */
  traitName(key, character) {
    if (character) {
      const custom = character.traitNames?.[key];
      if (custom && custom.trim()) return custom.trim();
      if (key === 'rp-quality' && character.pers?.qok && character.pers.qname) return character.pers.qname;
    }
    return this.trait(key)?.rt ?? key;
  },

  backgrounds() { return window.BACKGROUNDS ?? []; },
  powerSources() { return window.POWER_SOURCES ?? []; },
  archetypes() { return window.ARCHETYPES ?? []; },
  personalities() { return window.PERSONALITIES ?? []; },
  principles() { return window.PRINCIPLES ?? []; },
  peoples() { return window.PEOPLES ?? []; },
  regions() { return window.REGIONS ?? []; },

  background(id) { return this.backgrounds().find(b => b.id === id) ?? null; },
  powerSource(id) { return this.powerSources().find(p => p.id === id) ?? null; },
  archetype(id) { return this.archetypes().find(a => a.id === id) ?? null; },
  personality(id) { return this.personalities().find(p => p.id === id) ?? null; },
  principle(id) { return this.principles().find(p => p.id === id) ?? null; },
  /** pt-BR display name of a principle (PRINCIPLE_LORE, patched by the pt overlay). */
  principleName(id) {
    return window.PRINCIPLE_LORE?.[id]?.[0] ?? this.principle(id)?.name ?? id;
  },
  /** pt-BR rules text of a principle's green ability (English text keyed in I18N.text). */
  principleAbilityText(id) {
    const p = this.principle(id);
    if (!p) return '';
    return window.I18N?.text?.[p.ability] ?? p.ability ?? '';
  },
  people(id) { return this.peoples().find(p => p.id === id) ?? null; },
  region(id) { return this.regions().find(r => r.id === id) ?? null; },

  abilities() { return window.ABILITIES ?? {}; },
  ability(name) { return this.abilities()[name] ?? null; },

  /** Ability display name: pt-BR overlay, else English name minus variant suffix. */
  abilityName(name) {
    return window.I18N?.names?.[name] ?? String(name).replace(/ \((?:PS|Hallmark|Quality|Self Control)\)$/, '');
  },
  /** Ability rules text: pt-BR overlay keyed by the English text, else the English text. */
  abilityText(name) {
    const a = this.ability(name);
    if (!a) return '';
    return window.I18N?.text?.[a.text] ?? a.text;
  },

  redAbilities() { return window.RED_ABILITIES ?? []; },
  minionForms() { return window.MINION_FORMS ?? []; },
  healthRow(max) {
    const t = window.HEALTH_TABLE ?? {};
    const clamped = Math.max(17, Math.min(40, max));
    return t[String(clamped)] ?? null;
  },
  divided() { return window.DIVIDED ?? { methods: [], after: [] }; },
  modular() { return window.MODULAR ?? { fixed: {}, green: [], yellow: [], red: [] }; }
};
