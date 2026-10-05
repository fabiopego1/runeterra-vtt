// Runeterra Foundry — generic item sheet (all item types).
// Ability items resolve against the canonical dataset: picking a canonical ability fills
// type + pt-BR game text; the custom name stays separate so identity is never overwritten.
import { catalog } from '../data/catalog.js';

export class RuneterraItemSheet extends foundry.appv1.sheets.ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['runeterra', 'sheet', 'item'],
      width: 520,
      height: 520
    });
  }

  get template() {
    return `systems/runeterra/templates/sheets/${this.item.type}-sheet.hbs`;
  }

  async getData(options = {}) {
    const data = await super.getData(options);
    data.config = CONFIG.RUNETERRA;
    data.dieTypes = ['d4', 'd6', 'd8', 'd10', 'd12'];

    // Ability picker: all canonical abilities with their pt-BR display names.
    data.abilityOptions = Object.entries(catalog.abilities())
      .map(([en, def]) => ({ en, pt: catalog.abilityName(en), type: def.type }))
      .sort((a, b) => a.pt.localeCompare(b.pt, 'pt-BR'));
    data.canonical = this.item.system.canonicalName
      ? catalog.ability(this.item.system.canonicalName) : null;
    data.canonicalPt = this.item.system.canonicalName
      ? catalog.abilityName(this.item.system.canonicalName) : '';

    // Trait picker for powers/qualities.
    data.traitOptions = Object.values(catalog.traits)
      .map(t => ({ key: t.key, name: t.rt, kind: t.kind }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.item.isOwner) return;

    html.find('.die-select').change(ev => {
      this.item.update({ [`system.${ev.currentTarget.dataset.field}`]: ev.currentTarget.value });
    });

    // Canonical ability picker: resolve type + pt-BR text from the dataset.
    html.find('.canonical-picker').change(async ev => {
      const en = ev.currentTarget.value.trim();
      const def = catalog.ability(en);
      if (!def) return;
      const pt = catalog.abilityName(en);
      await this.item.update({
        name: pt,
        'system.canonicalName': en,
        'system.type': def.type,
        'system.gameText': window.I18N?.text?.[def.text] ?? def.text
      });
      this.render(false);
    });
  }
}
