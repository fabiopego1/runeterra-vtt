// Runeterra Foundry — actor sheets (one sheet class for all actor types, like the SCRPG base).
// The champion sheet follows the web app's playable ficha (ficha.html): identity + principles,
// powers/qualities, status dice, health zones with per-zone abilities, and the auxiliary page.
import { catalog } from '../data/catalog.js';
import { derive, effectiveZone, dividedModeOf, slotKinds, effectivePrincipleId } from '../rules.js';
import * as dice from '../dice.js';
import { actionIcons, decorateRulesHtml } from '../rules-text.js';
import { HealthUpdate, resolveStatusDie, EnvironmentUpdate, resolveEnvironmentStatusDie } from '../status.js';
import { onSetScene, SceneReset, applyPreset } from '../scene.js';
import { importIntoChampion, pickChampionJson, isBuiltChampion } from '../import.js';

const DIE_RANK = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12 };
const ZONE_RANK = { green: 0, yellow: 1, red: 2, out: 3 };
// How long the last ability's chat card stays attached to new rolls.
const ABILITY_CARD_LEASE_MS = 20000;

export class RuneterraCharacterSheet extends foundry.appv1.sheets.ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['runeterra', 'sheet', 'actor'],
      width: 880,
      height: 760,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'powers' }]
    });
  }

  /** A champion with nothing chosen (fresh from the create dialog) is an import shell only. */
  _isImportPending(actor) {
    if (actor.type !== 'champion') return false;
    const c = actor.system?.character;
    return !c?.bg?.id && !c?.ps?.id && !c?.arch?.id && !c?.pers?.id;
  }

  /** A built champion gets a header button to update it from a newer JSON (keeps Health, mods…). */
  _getHeaderButtons() {
    const buttons = super._getHeaderButtons();
    if (this.actor.type === 'champion' && this.actor.isOwner && isBuiltChampion(this.actor)) {
      buttons.unshift({
        label: game.i18n.localize('RUNETERRA.Reimport'),
        class: 'rt-reimport',
        icon: 'fas fa-file-import',
        onclick: () => this._onReimport()
      });
    }
    return buttons;
  }

  async _onReimport() {
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize('RUNETERRA.Reimport') },
      content: `<p>${game.i18n.localize('RUNETERRA.ReimportConfirm')}</p>`
    });
    if (!ok) return;
    const text = await pickChampionJson();
    if (text == null) return;
    await this._runImport(text);
  }

  /** Shared by the empty-sheet import and the re-import: run it and report. */
  async _runImport(text) {
    const res = await importIntoChampion(this.actor, text);
    if (res.ok) {
      const key = res.reimport ? 'RUNETERRA.ReimportSuccess' : 'RUNETERRA.ImportSuccess';
      const msgs = [game.i18n.format(key, { name: res.actor.name })];
      for (const w of res.warnings ?? []) msgs.push(w);
      ui.notifications.info(msgs.join(' '), { permanent: true });
      this.render(true);
    } else {
      ui.notifications.error(
        game.i18n.localize('RUNETERRA.ImportFailed') + ' ' + res.errors.join(' | '),
        { permanent: true });
    }
  }

  get template() {
    // Blank champions cannot be hand-built: the sheet is the JSON importer alone.
    if (this._isImportPending(this.actor)) {
      return 'systems/runeterra/templates/sheets/champion-import.hbs';
    }
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
      const id = effectivePrincipleId(character, slot);
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

  /** Zone ranges of the Health track (web ficha: "Faixas de Vida"): Verde máx–greenLow, etc. */
  _healthRanges(h) {
    if (!h) return null;
    return [
      { zone: 'green', label: game.i18n.localize('RUNETERRA.ZoneGreen'), range: `${h.max}–${h.greenLow}` },
      { zone: 'yellow', label: game.i18n.localize('RUNETERRA.ZoneYellow'), range: `${h.yellowHigh}–${h.yellowLow}` },
      { zone: 'red', label: game.i18n.localize('RUNETERRA.ZoneRed'), range: `${h.redHigh}–1` }
    ];
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
      icons: actionIcons(pers.out),
      text: decorateRulesHtml(await foundry.applications.ux.TextEditor.implementation.enrichHTML(text))
    };
  }

  /** Ability items grouped by zone, with renames resolved and zone locking applied. */
  async _zoneTables(actor, character, currentZone) {
    const zones = ['green', 'yellow', 'red'];
    // Knocked out: rank below every table so green+yellow+red all lock (only Out stays usable).
    const curRank = currentZone === 'out' ? -1 : (ZONE_RANK[currentZone] ?? 0);
    const enrich = async (s) => decorateRulesHtml(await foundry.applications.ux.TextEditor.implementation.enrichHTML(s ?? ''));
    // English rules text of an item (source of the ICON column): ability def, or the principle's green ability.
    const englishText = (i) => {
      const iid = i.system.iid ?? '';
      if (iid.startsWith('pr:')) return catalog.principle(effectivePrincipleId(character, iid.slice(3)))?.ability ?? '';
      return catalog.ability(i.system.canonicalName || '')?.text ?? '';
    };
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
          icons: actionIcons(englishText(i)),
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

  /** Twist of Fate (Retcon) the champion took: what it was and what it changed. */
  _retconCard(ch) {
    const rc = ch?.retcon;
    const def = rc?.type ? (window.RETCONS ?? []).find(r => r.id === rc.type) : null;
    if (!def) return null;
    const tn = k => (k ? catalog.traitName(k, ch) : '—');
    const detail = {
      'swap-powers': () => `${tn(rc.a)} ⇄ ${tn(rc.b)}`,
      'swap-quals': () => `${tn(rc.a)} ⇄ ${tn(rc.b)}`,
      'add-d6': () => `${tn(rc.key)} (d6)`,
      'change-principle': () => (rc.principle ? catalog.principleName(rc.principle) : ''),
      'change-ability': () => (rc.trait ? tn(rc.trait) : '')
    }[rc.type]?.();
    return {
      title: game.i18n.localize('RUNETERRA.Retcon'),
      lines: [`${def.rt} — ${def.desc ?? def.sc}`, ...(detail ? [detail] : [])]
    };
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
    const retcon = this._retconCard(ch);
    if (retcon) out.cards.push(retcon);
    if (ch.arch.notes) out.cards.push({ title: game.i18n.localize('RUNETERRA.Notes'), lines: [ch.arch.notes] });
    return out.cards.length ? out : null;
  }

  async getData(options = {}) {
    const data = await super.getData(options);
    const sys = this.actor.system;
    // Foundry v14 AppV1 no longer exposes `system` in the sheet context; the
    // environment/minion templates read `system.*` (die selects, notes) directly.
    data.system = sys;

    if (this.actor.type === 'champion' || this.actor.type === 'villain') {
      const ch = sys.character ?? {};
      const derived = derive(ch, sys.play?.current);
      data.isVillain = this.actor.type === 'villain';

      data.derived = derived;
      data.healthRanges = this._healthRanges(derived.health);
      data.powers = derived ? this._traitRows(derived.powers, ch) : [];
      data.qualities = derived ? this._traitRows(derived.qualities, ch) : [];
      data.principles = this._principles(ch);

      // Divided second form: civilian/heroic mode drives status dice + slot kinds.
      const archDef = ch.arch?.id ? catalog.archetype(ch.arch.id) : null;
      data.isDivided = !!archDef?.divided;
      data.dividedMode = dividedModeOf(sys, ch);
      const [firstKind, secondKind] = slotKinds(ch, data.dividedMode);
      data.firstKind = firstKind;
      data.secondKind = secondKind;
      data.firstTypeLabel = game.i18n.localize(firstKind === 'power' ? 'RUNETERRA.DicePower' : 'RUNETERRA.DiceQuality');
      data.secondTypeLabel = game.i18n.localize(secondKind === 'power' ? 'RUNETERRA.DicePower' : 'RUNETERRA.DiceQuality');
      const firstRows = firstKind === 'power' ? data.powers : data.qualities;
      const secondRows = secondKind === 'power' ? data.powers : data.qualities;

      // Roll slots as single dropdowns: selected option = row matching stored die + name.
      const matchKey = (rows, die, name) => rows.find(r => r.die === die && r.name === name)?.key ?? '';
      data.firstKey = matchKey(firstRows, sys.firstDie, sys.firstDieName);
      data.secondKey = matchKey(secondRows, sys.secondDie, sys.secondDieName);
      data.firstRows = firstRows;
      data.secondRows = secondRows;

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
      data.archName = archDef ? (archDef.rt + ((archDef.divided || archDef.modular) && ch.arch.base
        ? ` (${catalog.archetype(ch.arch.base)?.rt})` : '')) : '';
      data.persName = ch.pers?.id ? catalog.personality(ch.pers.id)?.rt : '';

      data.info = ch.info ?? {};
      data.special = this._specialArchetype(ch);
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

    // Environment: twist cards owned by this actor + scene-driven status die.
    if (this.actor.type === 'environment') {
      data.twists = await Promise.all(this.actor.items.filter(i => i.type === 'twist').map(async i => ({
        id: i.id,
        name: i.name,
        text: decorateRulesHtml(await foundry.applications.ux.TextEditor.implementation.enrichHTML(i.system.description ?? ''))
      })));
      const zone = ['green', 'yellow', 'red'].includes(sys.scene) ? sys.scene : 'green';
      data.statusZone = zone;
      data.statusZoneClass = `rt-status-${zone}`;
      data.statusZoneLabel = game.i18n.localize(`RUNETERRA.Zone${zone.charAt(0).toUpperCase()}${zone.slice(1)}`);
    }

    data.config = CONFIG.RUNETERRA;
    data.dieTypes = ['d4', 'd6', 'd8', 'd10', 'd12'];
    return data;
  }

  /* ------------------------------------------------------------ roll priming */

  /** Roll slots that accept this kind ('power' | 'quality') — Divided Psyche may put both on one kind. */
  _slotsForKind(kind) {
    const sys = this.actor.system;
    const [k1, k2] = slotKinds(sys.character, sys.dividedMode);
    const slots = [];
    if (k1 === kind) slots.push('first');
    if (k2 === kind) slots.push('second');
    return slots;
  }

  /** Mark trait rows whose die+name matches a roll slot, without a re-render. */
  _markSelectedTraits(html) {
    html.find('.trait-row').each((_, r) => {
      const slots = this._slotsForKind(r.dataset.traitKind);
      if (!slots.length) return;
      const slot = slots[0];
      const curDie = this.actor.system[`${slot}Die`];
      const curName = this.actor.system[`${slot}DieName`];
      const key = r.dataset.traitKey;
      const rowName = key ? catalog.traitName(key, this.actor.system.character) : '';
      r.classList.toggle('rt-selected', !!curDie && r.dataset.traitDie === curDie && rowName === curName);
    });
  }

  /**
   * After an ability button press: fixed dice (traits the ability's text
   * names, max two, text order) are set into their slots; every slot the
   * ability leaves free goes empty ("—") for the player to choose. Both
   * dropdowns get a light gold tint and the combined roll button glows.
   * Texts store canonical trait names, so both the display name and the
   * canonical one are matched.
   */
  async _prepareAbilityRoll(item, html) {
    const sys = this.actor.system;
    if (!sys.character) return;
    const norm = (s) => String(s ?? '').replace(/<[^>]*>/g, ' ')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/\s+/g, ' ');
    const hay = norm(item.system.gameText);
    const derived = derive(sys.character, sys.play?.current);
    if (!derived) return;
    const found = [];
    for (const [kind, map] of [['power', derived.powers], ['quality', derived.qualities]]) {
      for (const row of this._traitRows(map, sys.character)) {
        const nName = norm(row.name);
        if (hay && nName && nName.length >= 3 && (hay.includes(nName) || hay.includes(norm(row.orig)))) {
          found.push({ ...row, kind });
        }
      }
    }
    found.sort((a, b) => hay.indexOf(norm(a.name)) - hay.indexOf(norm(b.name)));
    const updates = {};
    const chosen = [];
    const taken = new Set();
    for (const row of found.slice(0, 2)) {
      const slots = this._slotsForKind(row.kind).filter(s => !taken.has(s));
      if (!slots.length) continue;
      const slot = slots.find(s => sys[`${s}DieName`] !== row.name) ?? slots[0];
      taken.add(slot);
      updates[`system.${slot}Die`] = row.die;
      updates[`system.${slot}DieName`] = row.name;
      chosen.push({ slot, key: row.key });
    }
    // Slots the ability doesn't fix reset to the empty state ('d4' + 'N/A'
    // never matches a trait row, so the dropdown shows the "—" option).
    for (const kind of ['power', 'quality']) {
      for (const slot of this._slotsForKind(kind)) {
        if (!taken.has(slot)) {
          updates[`system.${slot}Die`] = 'd4';
          updates[`system.${slot}DieName`] = 'N/A';
        }
      }
    }
    await this.actor.update(updates, { render: false });
    const config = html.find('.rt-roll-config:not(.rt-divided-switch)');
    config.find('.trait-select').addClass('rt-primed');
    for (const { slot, key } of chosen) config.find(`.trait-select[data-slot="${slot}"]`).val(key);
    // Free slots show "—" without a re-render.
    for (const slot of ['first', 'second']) {
      if (!chosen.some(c => c.slot === slot)) config.find(`.trait-select[data-slot="${slot}"]`).val('');
    }
    this._markSelectedTraits(html);
    this._setRollReady(html, html.find('.make-roll')[0]);
  }

  /** Glow on the panel's combined roll button until any panel roll is clicked. */
  _setRollReady(html, button) {
    html.find('.rt-rollbar .rt-ready').removeClass('rt-ready');
    button?.classList.add('rt-ready');
  }

  /** Keep the last ability's card attached to rolls for a short while. */
  _armAbilityLease(id) {
    clearTimeout(this._abilityLease);
    this._abilityLease = setTimeout(() => {
      if (this._lastAbilityId === id) this._lastAbilityId = null;
    }, ABILITY_CARD_LEASE_MS);
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
        const mode = sys.dividedMode === 'civilian' ? 'civilian' : 'heroic';
        const r = resolveStatusDie(sys.character, sys.play?.current, sys.scene ?? 'green', sys.derived, mode);
        if (sys.thirdDie !== r.die || sys.thirdDieName !== r.name) HealthUpdate(this.actor);
      }
      // Environment status die follows the scene color alone.
      if (this.actor.type === 'environment') {
        const r = resolveEnvironmentStatusDie(sys.scene);
        if (sys.thirdDie !== r.die || sys.thirdDieName !== r.name) EnvironmentUpdate(this.actor);
      }
    } catch (e) { /* resolution needs the dataset; triggers already cover the sync */ }

    html.find('.make-roll').click(async () => {
      const sys = this.actor.system;
      const [k1, k2] = slotKinds(sys.character, sys.dividedMode);
      const lbl = (k) => game.i18n.localize(k === 'quality' ? 'RUNETERRA.DiceQuality' : 'RUNETERRA.DicePower');
      const missing = ['first', 'second']
        .filter(s => sys[`${s}DieName`] === 'N/A')
        .map(s => lbl(s === 'first' ? k1 : k2));
      if (missing.length) {
        ui.notifications.warn(game.i18n.format('RUNETERRA.NeedsTrait', { type: missing.join(' + ') }));
        return;
      }
      const abilityId = this._lastAbilityId;
      await dice.TaskCheck(this.actor, { abilityId });
      // The card outlives the roll briefly (refreshed on every roll) so
      // follow-up rolls keep it; a pause longer than the lease lets it fade.
      if (abilityId) this._armAbilityLease(abilityId);
    });
    // Any panel roll consumes the primed ("ready") highlight and the
    // primed dropdown tint.
    html.find('.rt-rollbar button').click(ev => {
      ev.currentTarget.classList.remove('rt-ready');
      html.find('.trait-select.rt-primed').removeClass('rt-primed');
    });

    // Import-only state: fill this blank champion from a Forja de Campeões JSON.
    html.find('.rt-import-json').click(async () => {
      const text = await pickChampionJson();
      if (text == null) return;
      await this._runImport(text);
    });
    // Single-slot buttons follow the slot's current kind (Divided Psyche swaps kinds).
    html.find('.roll-slot').click(ev => {
      const slot = ev.currentTarget.dataset.slot === 'second' ? 'second' : 'first';
      const kind = ev.currentTarget.dataset.kind === 'quality' ? 'quality' : 'power';
      const sys = this.actor.system;
      if (sys[`${slot}DieName`] === 'N/A') {
        ui.notifications.warn(game.i18n.format('RUNETERRA.NeedsTrait', {
          type: game.i18n.localize(kind === 'quality' ? 'RUNETERRA.DiceQuality' : 'RUNETERRA.DicePower')
        }));
        return;
      }
      dice.SingleCheck(sys[`${slot}Die`], kind, sys[`${slot}DieName`], this.actor);
    });
    html.find('.roll-status').click(() => dice.SingleCheck(this.actor.system.thirdDie, 'status', this.actor.system.thirdDieName, this.actor));
    html.find('.roll-minion-group').click(() => dice.rollMinionGroup(this.actor));

    // Divided form switch (heroic/civilian): reset both roll slots (SCRPG
    // reference: slots don't carry across forms) and resync the status die.
    html.find('.divide-mode').click(async ev => {
      const mode = ev.currentTarget.dataset.mode === 'civilian' ? 'civilian' : 'heroic';
      await this.actor.update({
        'system.dividedMode': mode,
        'system.firstDie': 'd4', 'system.firstDieName': 'N/A',
        'system.secondDie': 'd4', 'system.secondDieName': 'N/A'
      });
      await HealthUpdate(this.actor);
    });

    // Single trait dropdown per slot: the option carries the trait key, its die rides along.
    html.find('.trait-select').change(ev => {
      ev.currentTarget.classList.remove('rt-primed');
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
    html.find('.roll-out').click(ev => {
      if (ev.currentTarget.closest('.rt-locked')) {
        ui.notifications.warn(game.i18n.localize('RUNETERRA.ZoneLocked'));
        return;
      }
      dice.OutRoll(this.actor);
    });
    html.find('.roll-item').click(ev => {
      // Zone-locked tables show no roll button, but guard anyway: a locked
      // ability (greyed by health zone + scene) can never roll.
      if (ev.currentTarget.closest('.rt-locked')) {
        ui.notifications.warn(game.i18n.localize('RUNETERRA.ZoneLocked'));
        return;
      }
      const item = this.actor.items.get(ev.currentTarget.closest('[data-item-id]')?.dataset.itemId);
      if (!item) return;
      // No card in chat yet — the ability only reaches chat when the combined
      // roll posts (TaskCheck), always the last ability clicked. Any pending
      // lease from a previous ability dies here so it can't clear this one.
      clearTimeout(this._abilityLease);
      this._lastAbilityId = item.id;
      // Prime the panel slots with the traits the ability names and flag the combined roll.
      this._prepareAbilityRoll(item, html);
    });

    // Click a power/quality row → it becomes the roll die for that slot.
    // The status die is intentionally NOT clickable: it follows the health zone / scene.
    // After setting, the roll config at the top is scrolled into view and flashed,
    // and the clicked row is marked selected (full re-render is skipped to keep scroll).
    this._markSelectedTraits(html);
    html.find('.trait-row').click(async ev => {
      const row = ev.currentTarget;
      const kind = row.dataset.traitKind;
      if (kind !== 'power' && kind !== 'quality') return;
      const slots = this._slotsForKind(kind);
      if (!slots.length) return;
      // Both slots share the kind (Divided Psyche): fill the first slot not
      // already holding this exact trait, else the first slot.
      const key = row.dataset.traitKey;
      const die = row.dataset.traitDie;
      const name = key ? catalog.traitName(key, this.actor.system.character) : '';
      const slot = slots.find(s => this.actor.system[`${s}DieName`] !== name) ?? slots[0];
      const label = row.querySelector('td')?.innerText.split('\n')[0] ?? '';
      await this.actor.update({
        [`system.${slot}Die`]: die,
        [`system.${slot}DieName`]: name
      }, { render: false });
      // Reflect immediately in the roll dropdown without a full re-render.
      // The dice config now lives in the pinned side panel; exclude the
      // Divided form switch, which only borrows the rt-roll-config styling.
      const config = html.find('.rt-roll-config:not(.rt-divided-switch)');
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
