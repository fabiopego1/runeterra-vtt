// Runeterra Foundry — actor sheets (one sheet class for all actor types, like the SCRPG base).
// The champion sheet follows the web app's playable ficha (ficha.html): identity + principles,
// powers/qualities, status dice, health zones with per-zone abilities, and the auxiliary page.
import { catalog } from '../data/catalog.js';
import { derive, effectiveZone } from '../rules.js';
import * as dice from '../dice.js';
import { HealthUpdate, resolveStatusDie } from '../status.js';
import { onSetScene, SceneReset, applyPreset } from '../scene.js';

const DIE_RANK = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12 };
const ZONE_RANK = { green: 0, yellow: 1, red: 2, out: 3 };

export class RuneterraCharacterSheet extends foundry.appv1.sheets.ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['runeterra', 'sheet', 'actor'],
      width: 880,
      height: 760,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'champ' }]
    });
  }

  get template() {
    // Champions and villains share the ficha layout (Runeterra builds villains like champions).
    if (this.actor.type === 'champion' || this.actor.type === 'villain') {
      return 'systems/runeterra/templates/sheets/champion-sheet.hbs';
    }
    return `systems/runeterra/templates/sheets/${this.actor.type}-sheet.hbs`;
  }

  /* ------------------------------------------------------------ data prep */

  _traitRows(traitMap, character) {
    return Object.entries(traitMap)
      .map(([key, die]) => {
        const name = catalog.traitName(key, character);
        const orig = key === 'rp-quality'
          ? game.i18n.localize('RUNETERRA.SignatureQuality')
          : (catalog.trait(key)?.rt ?? key);
        return { key, die, name, orig, renamed: name !== orig };
      })
      .sort((a, b) => (DIE_RANK[b.die] - DIE_RANK[a.die]) || a.name.localeCompare(b.name));
  }

  /** The character's two principles, with pt text and the pch element substituted. */
  _principles(character) {
    const out = [];
    for (const slot of ['bg', 'arch']) {
      const id = character?.[slot]?.principle;
      if (!id) continue;
      const def = catalog.principle(id);
      if (!def) continue;
      const element = character?.pch?.[slot];
      const sub = (t) => t
        ? foundry.utils.escapeHTML(t).replaceAll('[energy/element]', element ?? '[…]')
        : '';
      out.push({
        slot,
        id,
        name: id === 'energy-element' && element ? element : catalog.principleName(id),
        rp: sub(def.rp),
        minor: sub(def.minor),
        major: sub(def.major),
        ability: catalog.principleAbilityText(id)
      });
    }
    return out;
  }

  /** The Temperament's Out (knocked out) ability, translated and with the trait chip filled. */
  async _outRow(character) {
    const pers = character?.pers?.id ? catalog.personality(character.pers.id) : null;
    if (!pers) return null;
    const raw = window.I18N?.text?.[pers.out] ?? pers.out ?? '';
    const traitName = character.pers.outTrait ? catalog.traitName(character.pers.outTrait, character) : '[…]';
    const text = raw.replace(/\[(power|quality)\]/g, `<strong>${traitName}</strong>`);
    return {
      name: game.i18n.localize('RUNETERRA.Knockout'),
      type: 'A',
      text: await foundry.applications.ux.TextEditor.implementation.enrichHTML(text)
    };
  }

  /** Ability items grouped by zone, with renames resolved and zone locking applied. */
  async _zoneTables(actor, character, currentZone) {
    const zones = ['green', 'yellow', 'red'];
    // Knocked out: rank below every table so green+yellow+red all lock (only Out stays usable).
    const curRank = currentZone === 'out' ? -1 : (ZONE_RANK[currentZone] ?? 0);
    const enrich = (s) => foundry.applications.ux.TextEditor.implementation.enrichHTML(s ?? '');
    const tables = await Promise.all(zones.map(async zone => {
      const items = actor.items.filter(i => i.type === 'ability' && (i.system.zone ?? 'green') === zone);
      const rows = await Promise.all(items.map(async i => {
        const canonical = i.system.canonicalName || i.name;
        const ptName = catalog.abilityName(i.system.canonicalName || '') || i.name;
        const name = i.system.customName || ptName;
        const base = i.system.customName ? ptName : '';
        return {
          id: i.id,
          name,
          base,
          renamed: !!base && base !== name,
          type: i.system.type ?? 'A',
          text: await enrich(i.system.gameText ?? '')
        };
      }));
      return {
        zone,
        label: game.i18n.localize(`RUNETERRA.Zone${zone.charAt(0).toUpperCase()}${zone.slice(1)}`),
        rank: ZONE_RANK[zone],
        locked: ZONE_RANK[zone] > curRank,
        rows
      };
    }));
    return { tables, out: await this._outRow(character), outActive: currentZone === 'out' };
  }

  /** Special archetype play cards, read from the character's own creation data. */
  _specialArchetype(ch) {
    const archDef = ch?.arch?.id ? catalog.archetype(ch.arch.id) : null;
    if (!archDef) return null;
    const out = { name: archDef.rt, cards: [] };

    if (archDef.divided) {
      const method = catalog.divided().methods.find(m => m.id === ch.arch.divMethod);
      const after = (ch.sel?.['arch-divafter'] ?? []).map(e => catalog.abilityName(e.name));
      out.cards.push({
        title: game.i18n.localize('RUNETERRA.SpecialDivided'),
        lines: [
          method ? `${method.rt ?? method.name}: ${window.I18N?.text?.[method.text] ?? method.text ?? ''}` : '',
          after.length ? `${game.i18n.localize('RUNETERRA.SpecialDividedAfter')}: ${after.join(', ')}` : ''
        ].filter(Boolean)
      });
    }
    if (archDef.modular) {
      const modeKeys = ['arch-modgreen', 'arch-modyellow', 'arch-modred'];
      const modes = modeKeys.flatMap(k => (ch.sel?.[k] ?? []).map(e => {
        const mode = e.modes ?? {};
        const name = mode.name ?? catalog.abilityName(e.name);
        const text = mode.text ? (window.I18N?.text?.[mode.text] ?? mode.text) : '';
        return text ? `${name} — ${text}` : name;
      }));
      const pw = ch.arch.powerless;
      if (pw?.on) {
        modes.push(game.i18n.localize('RUNETERRA.SpecialPowerless')
          + `: ${catalog.traitName(pw.a, ch)} (d6) / ${catalog.traitName(pw.b, ch)} (d10)`);
      }
      out.cards.push({ title: game.i18n.localize('RUNETERRA.SpecialModular'), lines: modes });
    }
    if (archDef.minionForms) {
      const q = ch.arch.minionQ ? catalog.traitName(ch.arch.minionQ, ch) : '';
      const forms = (ch.arch.minionForms ?? []).map(name => {
        const def = catalog.minionForms().find(f => (f[0] ?? f.name) === name);
        const text = def ? (window.I18N?.text?.[def[1] ?? def.rulesText] ?? def[1] ?? def.rulesText ?? '') : '';
        return text ? `${name} — ${text}` : name;
      });
      out.cards.push({
        title: game.i18n.localize('RUNETERRA.SpecialMinionMaker'),
        lines: [q ? `${game.i18n.localize('RUNETERRA.SignatureQuality')}: ${q}` : '', ...forms].filter(Boolean)
      });
    }
    if (archDef.forms) {
      const lines = [];
      for (const zone of ['green', 'yellow']) {
        for (const f of (archDef.forms[zone] ?? [])) {
          const text = window.I18N?.text?.[f.text] ?? f.text ?? '';
          lines.push(text ? `${f.name} — ${text}` : f.name);
        }
      }
      out.cards.push({ title: game.i18n.localize('RUNETERRA.SpecialFormChanger'), lines });
    }
    if (ch.arch.notes) out.cards.push({ title: game.i18n.localize('RUNETERRA.Notes'), lines: [ch.arch.notes] });
    return out.cards.length ? out : null;
  }

  async getData(options = {}) {
    const data = await super.getData(options);
    const sys = this.actor.system;

    if (this.actor.type === 'champion' || this.actor.type === 'villain') {
      const ch = sys.character ?? {};
      const derived = derive(ch, sys.play?.current);
      data.isVillain = this.actor.type === 'villain';

      data.derived = derived;
      data.powers = derived ? this._traitRows(derived.powers, ch) : [];
      data.qualities = derived ? this._traitRows(derived.qualities, ch) : [];
      data.principles = this._principles(ch);

      // Roll slots as single dropdowns: selected option = row matching stored die + name.
      const matchKey = (rows, die, name) => rows.find(r => r.die === die && r.name === name)?.key ?? '';
      data.firstKey = matchKey(data.powers, sys.firstDie, sys.firstDieName);
      data.secondKey = matchKey(data.qualities, sys.secondDie, sys.secondDieName);

      // Health & zones.
      const current = parseInt(sys.play?.current, 10);
      const curValue = isNaN(current) ? (derived?.health.max ?? 0) : current;
      data.currentHealth = curValue;
      const zone = derived
        ? (curValue >= derived.health.greenLow ? 'green' : curValue >= derived.health.yellowLow ? 'yellow' : curValue >= 1 ? 'red' : 'out')
        : 'green';
      data.zoneLabel = game.i18n.localize(`RUNETERRA.Zone${zone.charAt(0).toUpperCase()}${zone.slice(1)}`);
      // Locks follow the EFFECTIVE zone (health pushed down by the scene, SCRPG
      // reference rule); knockout locks every table, Out row excepted.
      const effZone = effectiveZone(zone, sys.scene ?? 'green');
      data.zoneTables = await this._zoneTables(this.actor, ch, effZone);

      // Status die readout (rule-driven info): localized die zone + why (health zone · scene).
      const ZONE_KEY = { green: 'RUNETERRA.ZoneGreen', yellow: 'RUNETERRA.ZoneYellow', red: 'RUNETERRA.ZoneRed' };
      const stKey = String(sys.thirdDieName ?? zone);
      data.statusDie = sys.thirdDie || '—';
      data.statusZoneClass = stKey === 'out' ? 'rt-status-out'
        : (ZONE_KEY[stKey] ? `rt-status-${stKey}` : '');
      data.statusBgClass = ZONE_KEY[stKey] ? `rt-zonebg-${stKey}` : '';
      data.statusAutoLabel = stKey === 'out'
        ? game.i18n.localize('RUNETERRA.Knockout')
        : (ZONE_KEY[stKey] ? game.i18n.localize(ZONE_KEY[stKey]) : stKey);
      const sceneKey = String(sys.scene ?? 'green');
      const sceneLabel = ZONE_KEY[sceneKey] ? game.i18n.localize(ZONE_KEY[sceneKey]) : sceneKey;
      data.statusAutoHint = `${game.i18n.localize('RUNETERRA.Health')}: ${data.zoneLabel} · ${game.i18n.localize('RUNETERRA.Scene')}: ${sceneLabel}`;

      // Names of the chosen creation options.
      data.peopleName = ch.people ? catalog.people(ch.people)?.name : '';
      data.regionName = ch.region ? catalog.region(ch.region)?.name : '';
      data.bgName = ch.bg?.id ? catalog.background(ch.bg.id)?.rt : '';
      data.psName = ch.ps?.id ? catalog.powerSource(ch.ps.id)?.rt : '';
      const archDef = ch.arch?.id ? catalog.archetype(ch.arch.id) : null;
      data.archName = archDef ? (archDef.rt + ((archDef.divided || archDef.modular) && ch.arch.base
        ? ` (${catalog.archetype(ch.arch.base)?.rt})` : '')) : '';
      data.persName = ch.pers?.id ? catalog.personality(ch.pers.id)?.rt : '';

      data.info = ch.info ?? {};
      data.special = this._specialArchetype(ch);

      // Mods (bonus/penalty items selected into the roll).
      data.mods = this.actor.items.filter(i => i.type === 'mod').map(i => ({
        id: i.id, name: i.name, value: i.system.value,
        selected: !!i.system.selected, persistent: !!i.system.persistent, exclusive: !!i.system.exclusive
      }));
    }

    // Scene tracker: build the space grid for each zone.
    if (this.actor.type === 'scene') {
      const mk = (zone, def) => ({
        zone,
        label: game.i18n.localize(`RUNETERRA.Zone${zone.charAt(0).toUpperCase()}${zone.slice(1)}`),
        setting: def.setting,
        current: def.current,
        spaces: Array.from({ length: def.setting }, (_, i) => ({ filled: i < def.current }))
      });
      data.zones = [
        mk('green', sys.greenSpace ?? {}),
        mk('yellow', sys.yellowSpace ?? {}),
        mk('red', sys.redSpace ?? {})
      ];
    }

    // Environment: twist cards owned by this actor.
    if (this.actor.type === 'environment') {
      data.twists = await Promise.all(this.actor.items.filter(i => i.type === 'twist').map(async i => ({
        id: i.id,
        name: i.name,
        text: await foundry.applications.ux.TextEditor.implementation.enrichHTML(i.system.description ?? '')
      })));
    }

    data.config = CONFIG.RUNETERRA;
    data.dieTypes = ['d4', 'd6', 'd8', 'd10', 'd12'];
    return data;
  }

  /* ------------------------------------------------------------ listeners */

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.actor.isOwner) return;

    // Safety net: the status die is rule-driven (health zone + scene), never manual.
    // If it ever desyncs (legacy actors, macro edits), fix it once — HealthUpdate
    // skips the write when already correct, so this cannot loop.
    try {
      const sys = this.actor.system;
      if ((this.actor.type === 'champion' || this.actor.type === 'villain') && sys.character) {
        const r = resolveStatusDie(sys.character, sys.play?.current, sys.scene ?? 'green', sys.derived);
        if (sys.thirdDie !== r.die || sys.thirdDieName !== r.name) HealthUpdate(this.actor);
      }
    } catch (e) { /* resolution needs the dataset; triggers already cover the sync */ }

    html.find('.make-roll').click(() => dice.TaskCheck(this.actor));
    html.find('.roll-power').click(() => dice.SingleCheck(this.actor.system.firstDie, 'power', this.actor.system.firstDieName, this.actor));
    html.find('.roll-quality').click(() => dice.SingleCheck(this.actor.system.secondDie, 'quality', this.actor.system.secondDieName, this.actor));
    html.find('.roll-status').click(() => dice.SingleCheck(this.actor.system.thirdDie, 'status', this.actor.system.thirdDieName, this.actor));

    html.find('.die-select').change(ev => {
      this.actor.update({ [`system.${ev.currentTarget.dataset.field}`]: ev.currentTarget.value });
    });

    // Single trait dropdown per slot: the option carries the trait key, its die rides along.
    html.find('.trait-select').change(ev => {
      const slot = ev.currentTarget.dataset.slot; // 'first' | 'second'
      if (slot !== 'first' && slot !== 'second') return;
      const key = ev.currentTarget.value;
      const die = ev.currentTarget.selectedOptions?.[0]?.dataset.die;
      if (!key || !die) return;
      this.actor.update({
        [`system.${slot}Die`]: die,
        [`system.${slot}DieName`]: catalog.traitName(key, this.actor.system.character)
      });
    });

    html.find('.health-update').change(async ev => {
      await this.actor.update({ 'system.play.current': ev.currentTarget.value });
      await HealthUpdate(this.actor);
    });
    html.find('.health-step').click(async ev => {
      const delta = parseInt(ev.currentTarget.dataset.delta, 10);
      const sys = this.actor.system;
      const max = sys.derived?.healthMax || sys.derived?.health?.max || 0;
      const cur = parseInt(sys.play?.current, 10);
      const value = Math.max(0, Math.min(max, (isNaN(cur) ? max : cur) + delta));
      await this.actor.update({ 'system.play.current': String(value) });
      await HealthUpdate(this.actor);
      this.render(false);
    });

    html.find('.item-create').click(this._onItemCreate.bind(this));
    html.find('.item-edit').click(this._onItemEdit.bind(this));
    html.find('.item-delete').click(this._onItemDelete.bind(this));
    html.find('.roll-item').click(ev => {
      const itemId = ev.currentTarget.closest('[data-item-id]')?.dataset.itemId;
      if (itemId) dice.ItemRoll(this.actor.items.get(itemId));
    });
    html.find('.mod-select').change(async ev => {
      const itemId = ev.currentTarget.closest('[data-item-id]')?.dataset.itemId;
      const mod = this.actor.items.get(itemId);
      if (!mod) return;
      const select = ev.currentTarget.checked;
      const positive = (mod.system.value ?? 0) > 0;
      if (select) {
        // Selecting an exclusive mod deselects the others in the same bonus/penalty group…
        if (mod.system.exclusive) {
          for (const other of this.actor.items.filter(i => i.type === 'mod' && i.id !== itemId
            && i.system.selected && ((i.system.value ?? 0) > 0) === positive)) {
            await other.update({ 'system.selected': false }, { render: false });
          }
          this.render(false);
        } else if (
          // …and a non-exclusive mod can't join an already-selected exclusive one.
          this.actor.items.some(i => i.type === 'mod' && i.id !== itemId && i.system.selected
            && i.system.exclusive && ((i.system.value ?? 0) > 0) === positive)
        ) {
          ev.currentTarget.checked = false;
          return;
        }
      }
      await mod.update({ 'system.selected': select });
    });

    // Click a power/quality row → it becomes the roll die for that slot.
    // The status die is intentionally NOT clickable: it follows the health zone / scene.
    // After setting, the roll config at the top is scrolled into view and flashed,
    // and the clicked row is marked selected (full re-render is skipped to keep scroll).
    const markSelectedTraits = () => {
      html.find('.trait-row').each((_, r) => {
        const k = r.dataset.traitKind;
        const slot = k === 'power' ? 'first' : k === 'quality' ? 'second' : null;
        if (!slot) return;
        const curDie = this.actor.system[`${slot}Die`];
        const curName = this.actor.system[`${slot}DieName`];
        const key = r.dataset.traitKey;
        const rowName = key ? catalog.traitName(key, this.actor.system.character) : '';
        r.classList.toggle('rt-selected', !!curDie && r.dataset.traitDie === curDie && rowName === curName);
      });
    };
    markSelectedTraits();
    html.find('.trait-row').click(async ev => {
      const row = ev.currentTarget;
      const kind = row.dataset.traitKind;
      if (kind !== 'power' && kind !== 'quality') return;
      const slot = kind === 'power' ? 'first' : 'second';
      const key = row.dataset.traitKey;
      const die = row.dataset.traitDie;
      const label = row.querySelector('td')?.innerText.split('\n')[0] ?? '';
      const name = key ? catalog.traitName(key, this.actor.system.character) : '';
      await this.actor.update({
        [`system.${slot}Die`]: die,
        [`system.${slot}DieName`]: name
      }, { render: false });
      // Reflect immediately in the roll dropdown without a full re-render.
      const config = html.find('.rt-roll-config');
      config.find(`.trait-select[data-slot="${slot}"]`).val(key);
      html.find(`.trait-row[data-trait-kind="${kind}"]`).removeClass('rt-selected');
      row.classList.add('rt-selected');
      // Bring the dice choice into view so the user sees where it went.
      const configEl = config[0];
      configEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      configEl?.classList.remove('rt-flash');
      void configEl?.offsetWidth;
      configEl?.classList.add('rt-flash');
      setTimeout(() => configEl?.classList.remove('rt-flash'), 1400);
      ui.notifications.info(game.i18n.format('RUNETERRA.TraitSet', { trait: label, die }));
    });

    // Scene tracker: per-zone step count (1–12).
    html.find('.scene-setting').change(async ev => {
      const zone = ev.currentTarget.dataset.zone;
      const setting = Math.max(1, Math.min(12, parseInt(ev.currentTarget.value, 10) || 1));
      await this.actor.update({
        [`system.${zone}Space.setting`]: setting,
        [`system.${zone}Space.current`]: 0
      });
      this.render(false);
    });

    // Scene tracker.
    html.find('.scene-click').click(ev => onSetScene(this.actor, ev.currentTarget.dataset.zone));
    html.find('.scene-reset').click(async () => {
      await SceneReset(this.actor);
      this.render(false);
    });
    html.find('.scene-preset').change(ev => {
      if (ev.currentTarget.value) applyPreset(this.actor, ev.currentTarget.value);
    });
  }

  /* ------------------------------------------------------------ drag & drop */

  /** Item types allowed per actor type. */
  static DROP_ALLOW = {
    champion: ['ability', 'mod', 'power', 'quality', 'minionForm'],
    villain: ['ability', 'mod', 'power', 'quality', 'villainStatus'],
    minion: ['mod'],
    environment: ['twist', 'mod'],
    scene: []
  };

  async _onDropItem(event, data) {
    const item = await Item.implementation.fromDropData(data);
    if (!item) return false;
    const allowed = RuneterraCharacterSheet.DROP_ALLOW[this.actor.type] ?? [];
    if (!allowed.includes(item.type)) return false;

    // Powers/qualities feed the roll dice instead of becoming owned items.
    if (item.type === 'power' || item.type === 'quality') {
      const slot = item.type === 'power' ? 'first' : 'second';
      const name = item.system.traitKey
        ? catalog.traitName(item.system.traitKey, this.actor.system.character)
        : item.name;
      await this.actor.update({
        [`system.${slot}Die`]: item.system.dieType,
        [`system.${slot}DieName`]: name
      });
      return false;
    }
    // Villain status items do NOT set the die: like champions, villains get their
    // status die automatically from Temperament + health zone + scene.
    if (item.type === 'villainStatus') {
      ui.notifications?.warn(game.i18n.localize('RUNETERRA.VillainStatusAuto'));
      return false;
    }
    // Everything else (ability, mod, minionForm, twist) becomes an owned item.
    const [created] = await this.actor.createEmbeddedDocuments('Item', [item.toObject()]);
    return created;
  }

  async _onItemCreate(ev) {
    ev.preventDefault();
    const type = ev.currentTarget.dataset.type;
    const itemData = { name: game.i18n.localize(`ITEM.Type${type.charAt(0).toUpperCase()}${type.slice(1)}`), type, system: {} };
    const [created] = await this.actor.createEmbeddedDocuments('Item', [itemData]);
    created?.sheet?.render(true);
  }

  _onItemEdit(ev) {
    const itemId = ev.currentTarget.closest('[data-item-id]')?.dataset.itemId;
    this.actor.items.get(itemId)?.sheet?.render(true);
  }

  _onItemDelete(ev) {
    const itemId = ev.currentTarget.closest('[data-item-id]')?.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    new foundry.applications.api.DialogV2({
      window: { title: game.i18n.localize('RUNETERRA.DeleteItem') },
      content: game.i18n.localize('RUNETERRA.DeleteItemConfirm'),
      buttons: [
        {
          action: 'yes', icon: 'fas fa-trash',
          label: game.i18n.localize('RUNETERRA.Delete'),
          callback: () => item.delete()
        },
        {
          action: 'no', icon: 'fas fa-times', default: true,
          label: game.i18n.localize('RUNETERRA.Cancel')
        }
      ]
    }).render(true);
  }
}
