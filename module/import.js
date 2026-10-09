// Runeterra Foundry — champion importer.
// Accepts the raw "Forja de Campeões" champion JSON (the website's normal export) and the
// versioned runeterra-foundry wrapper if one ever exists. All-or-nothing: the actor is only
// created when validation passes. Derived values are always RECALCULATED, never trusted.

import { catalog } from './data/catalog.js';
import { derive, effectivePrincipleId } from './rules.js';
import { HealthUpdate } from './status.js';

/** Bracket-token pt-BR labels (from the web app). */
const TOKEN_PT = {
  power: 'poder', quality: 'qualidade', 'power/quality': 'poder/qualidade',
  'Self Control power': 'poder de Autocontrole', 'Psychic power': 'poder Psíquico',
  'Mental quality': 'qualidade Mental', 'Signature Vehicle': 'Montaria Emblemática',
  'Signature Weaponry': 'Arma Emblemática',
  'a power gained from your archetype': 'um poder ganho do seu Caminho',
  'a quality gained from your archetype': 'uma qualidade ganho do seu Caminho',
  'energy/element': 'energia/elemento', 'element/energy': 'elemento/energia',
  'elemental/energy': 'elemental/energia', element: 'elemento',
  'basic action': 'ação básica', actions: 'ações', action: 'ação',
  'element/energy you have a related power for': 'elemento/energia de um poder que você tem',
  'energy/element you have a related power for': 'energia/elemento de um poder que você tem',
  'physical or energy': 'físico ou de energia', 'Boost or Hinder': 'Fortaleça ou Atrapalhe',
  'choose two basic actions': 'escolha duas ações básicas',
  'any Physical or Mental quality': 'qualquer qualidade Física ou Mental'
};

/** Zone of each selection group (the ficha's zone tables). */
const GROUP_ZONE = {
  'ps-green': 'green', 'ps-yellow': 'yellow',
  'arch-fixed': 'green', 'arch-green': 'green', 'arch-yellow': 'yellow',
  'arch-fixedred': 'red', red: 'red',
  'arch-formgreen': 'green', 'arch-formyellow': 'yellow',
  'arch-divmethod': 'green', 'arch-divafter': 'green',
  'arch-modfixg': 'green', 'arch-modfixy': 'yellow', 'arch-modfixr': 'red',
  'arch-modgreen': 'green', 'arch-modyellow': 'yellow', 'arch-modred': 'red'
};

/**
 * Validate a champion state and return { state, errors }.
 * Website-only state (cid, step, tour…) is classified and dropped here.
 */
export function parseChampion(json) {
  const errors = [];
  let state = json;
  if (typeof json === 'string') {
    try { state = JSON.parse(json); }
    catch (e) { return { state: null, errors: ['JSON inválido: ' + e.message] }; }
  }
  if (!state || typeof state !== 'object') return { state: null, errors: ['Conteúdo não é um objeto.'] };

  // Versioned wrapper → unwrap.
  if (state.format === 'runeterra-foundry') {
    if (state.version !== 1) errors.push(`formato runeterra-foundry versão ${state.version} não suportada.`);
    state = state.character;
    if (!state) return { state: null, errors: [...errors, 'wrapper sem "character".'] };
  }

  // Saves from before the Confirm button: a named Signature Quality counts as confirmed (web upgradeState).
  if (state.pers?.qname && state.pers.qok === undefined) state = { ...state, pers: { ...state.pers, qok: true } };

  if (state.v !== 1) errors.push(`versão de estado "${state.v}" não suportada (esperado 1) — não parece um JSON da Forja de Campeões.`);
  for (const req of [['bg', 'Origem'], ['ps', 'Fonte de Poder'], ['arch', 'Caminho'], ['pers', 'Temperamento']]) {
    if (!state[req[0]]?.id) errors.push(`"${req[0]}" ausente ou incompleto (${req[1]} não escolhido(a)).`);
  }
  if (!state.info?.name && !state.info?.alias) errors.push('"info.name"/"info.alias" ausente (sem nome de personagem).');

  // Ability entries must resolve to canonical abilities.
  if (state.sel) {
    for (const [gkey, list] of Object.entries(state.sel)) {
      if (!Array.isArray(list)) continue;
      for (const e of list) {
        if (e?.name && !catalog.ability(e.name)) {
          errors.push(`habilidade "${e.name}" (${gkey}) não existe no dataset.`);
        }
      }
    }
  }
  return { state, errors };
}

/**
 * Warnings (not errors) for state the importer would otherwise ignore silently:
 * unknown principle ids and a Twist of Fate whose choices don't resolve in the dataset.
 */
export function stateWarnings(state) {
  const w = [];
  for (const slot of ['bg', 'arch']) {
    const pid = effectivePrincipleId(state, slot);
    if (pid && !catalog.principle(pid)) w.push(`princípio "${pid}" (${slot}) não existe no dataset — ignorado.`);
  }
  const rc = state.retcon;
  if (rc?.type) {
    const need = (ok, what) => { if (!ok) w.push(`Reviravolta "${rc.type}": ${what} — a escolha não foi aplicada.`); };
    if (!(window.RETCONS ?? []).some(r => r.id === rc.type)) w.push(`Reviravolta "${rc.type}" desconhecida — ignorada.`);
    else if (rc.type === 'swap-powers' || rc.type === 'swap-quals') need(catalog.trait(rc.a) && catalog.trait(rc.b) && rc.a !== rc.b, 'traços a/b inválidos');
    else if (rc.type === 'add-d6') need(catalog.trait(rc.key) && !!rc.key, 'traço inválido');
    else if (rc.type === 'change-principle') need(['bg', 'arch'].includes(rc.which) && catalog.principle(rc.principle), 'princípio/slot inválido');
    else if (rc.type === 'change-ability') need(rc.ab && catalog.trait(rc.trait), 'habilidade/traço inválido');
    else if (rc.type === 'extra-red') need((state.sel?.['red-extra'] ?? []).length > 0, 'nenhuma Suprema extra no JSON');
  }
  return w;
}

/**
 * Fill the ability text's bracket tokens like the ficha does:
 * [power]/[quality] → the chosen trait's display name, [energy/element] → the chosen value.
 */
export function fillText(text, entry, character) {
  if (!text) return '';
  const traitChip = (key) => key
    ? `<strong>${catalog.traitName(key, character)}</strong>`
    : `<strong>[${TOKEN_PT['power/quality']}]</strong>`;
  return text.replace(/\[([^\]]+)\]/g, (m, br) => {
    // Trait tokens.
    if (br === 'power' || br === 'power/quality') return entry?.trait ? traitChip(entry.trait) : m;
    if (br === 'quality') return entry ? traitChip(entry.trait2 ?? entry.trait) : m;
    // Signature gear tokens resolve to the entry's (fixed) trait.
    if (br === 'Signature Weaponry' || br === 'Signature Vehicle') {
      return entry?.trait ? traitChip(entry.trait) : `<strong>[${TOKEN_PT[br] ?? br}]</strong>`;
    }
    // Choices made when taking the ability.
    const choice = entry?.ch?.[br];
    if (choice) return `<strong>${choice}</strong>`;
    // Archetype-sourced trait tokens.
    if (/gained from your archetype/.test(br)) return entry?.trait ? traitChip(entry.trait) : m;
    return `<strong>[${TOKEN_PT[br] ?? br}]</strong>`;
  });
}

/** Ability instance id (canonical identity, same format as the web app). */
function iidOf(gkey, entry) {
  return gkey === 'red' ? `red:${entry.cat}:${entry.name}` : `${gkey}:${entry.name}`;
}

async function uploadPortrait(dataURI, baseName) {
  if (!dataURI || typeof dataURI !== 'string' || !dataURI.startsWith('data:image')) return { img: null, warning: null };
  const ext = dataURI.slice(11, dataURI.indexOf(';')) || 'jpeg';
  try {
    const blob = await (await fetch(dataURI)).blob();
    const file = new File([blob], `${baseName}.${ext}`, { type: blob.type });
    // The target directory must exist, or Foundry's upload silently returns false.
    const FPA = foundry.applications.apps.FilePicker;
    try {
      await FPA.createDirectory('data', 'runeterra-portraits', {});
    } catch (e) { /* already exists */ }
    const res = await FPA.upload('data', 'runeterra-portraits', file, {}, { notify: false });
    if (res === false) throw new Error('FilePicker.upload retornou false');
    return { img: `runeterra-portraits/${baseName}.${ext}`, warning: null };
  } catch (e) {
    // Fallback: keep the data URI on the prototype image only (never in system data).
    return { img: dataURI, warning: 'retrato salvo como data URI (falha o upload: ' + e.message + ')' };
  }
}

/** Open a file picker and resolve with the chosen .json file's text (null on cancel). */
export function pickChampionJson() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      resolve(file ? await file.text() : null);
    });
    input.click();
  });
}

/**
 * Build the actor data + items from a champion JSON (no documents touched).
 * All-or-nothing: returns { ok:false, errors } when validation fails.
 */
export async function buildChampionImport(json) {
  const { state, errors } = parseChampion(json);
  if (!state || errors.length) return { ok: false, errors: errors ?? ['JSON inválido.'] };

  const warnings = stateWarnings(state);
  const ch = state.info ?? {};

  // Derive (recalculate — never trust cached values).
  const derived = derive(state, state.play?.current);
  if (!derived) return { ok: false, errors: ['Não foi possível recalcular os valores derivados (dados de criação incompletos).'] };

  const name = (ch.name || ch.alias || 'Campeão').trim();
  const baseName = (ch.alias || ch.name || 'retrato').trim().replace(/[^\w-]+/g, '_');

  // Portrait: extract the data URI out of the actor data and upload as an asset.
  let img = 'icons/svg/mystery-man.svg';
  if (ch.portrait) {
    const up = await uploadPortrait(ch.portrait, baseName);
    if (up.img) img = up.img;
    if (up.warning) warnings.push(up.warning);
  }

  const play = state.play ?? {};
  const current = play.current != null && play.current !== '' ? String(parseInt(play.current, 10)) : null;

  const actorData = {
    name,
    type: 'champion',
    img,
    system: {
      character: {
        people: state.people ?? null,
        region: state.region ?? null,
        bg: state.bg ?? { id: null, assign: {}, principle: null },
        ps: state.ps ?? { id: null, assign: {}, extra: {} },
        arch: state.arch ?? {},
        pers: state.pers ?? {},
        health: state.health ?? {},
        pch: state.pch ?? {},
        sel: state.sel ?? {},
        renames: state.renames ?? {},
        traitNames: state.traitNames ?? {},
        retcon: state.retcon ?? { type: null },
        evo: state.evo ?? { traits: {}, principles: {}, abilities: {}, log: [] },
        info: { ...ch, portrait: undefined }
      },
      derived: {
        powers: derived.powers,
        qualities: derived.qualities,
        status: { green: derived.status[0], yellow: derived.status[1], red: derived.status[2] },
        status2: derived.status2,
        healthMax: derived.health.max,
        greenLow: derived.health.greenLow,
        yellowHigh: derived.health.yellowHigh,
        yellowLow: derived.health.yellowLow,
        redHigh: derived.health.redHigh
      },
      health: { value: current == null ? derived.health.max : parseInt(current, 10), max: derived.health.max },
      play: {
        hp: play.hp ?? [], rw: play.rw ?? [], issues: play.issues ?? [],
        coll: play.coll ?? [], cdone: play.cdone ?? [], current, notes: play.notes ?? []
      }
    }
  };

  // Ability items from sel (+ principles as green abilities).
  const items = [];
  const rc = state.retcon ?? {};
  for (const [srcKey, list] of Object.entries(state.sel ?? {})) {
    if (!Array.isArray(list)) continue;
    // Twist of Fate "Hidden Reserves": the extra Ultimate is a Red ability (only with that retcon).
    if (srcKey === 'red-extra' && rc.type !== 'extra-red') continue;
    const gkey = srcKey === 'red-extra' ? 'red' : srcKey;
    const zone = GROUP_ZONE[gkey] ?? 'green';
    for (let entry of list) {
      if (!entry?.name) continue;
      const def = catalog.ability(entry.name);
      if (!def) continue; // validation already reported it
      const iid = iidOf(gkey, entry);
      // Twist of Fate "New Technique": this ability now uses another power/quality.
      if (rc.type === 'change-ability' && rc.ab === iid && rc.trait && catalog.trait(rc.trait)) {
        entry = { ...entry, trait: rc.trait };
      }
      const srcText = window.I18N?.text?.[def.text] ?? def.text;
      items.push({
        name: state.renames?.[iid]?.trim() || catalog.abilityName(entry.name),
        type: 'ability',
        system: {
          iid,
          group: gkey,
          canonicalName: entry.name,
          customName: state.renames?.[iid]?.trim() ?? '',
          type: def.type,
          zone,
          traits: [entry.trait, entry.trait2].filter(Boolean),
          choices: entry.ch ?? {},
          gameText: fillText(srcText, entry, state)
        }
      });
    }
  }
  for (const slot of ['bg', 'arch']) {
    const pid = effectivePrincipleId(state, slot);
    const def = pid ? catalog.principle(pid) : null;
    if (!def) continue;
    const element = state.pch?.[slot];
    const raw = window.I18N?.text?.[def.ability] ?? def.ability ?? '';
    items.push({
      name: element || catalog.principleName(pid),
      type: 'ability',
      system: {
        iid: 'pr:' + slot, group: 'principle', canonicalName: '',
        customName: '', type: 'A', zone: 'green',
        traits: [], choices: element ? { 'energy/element': element } : {},
        gameText: raw.replaceAll('[energy/element]', `<strong>${element ?? '[…]'}</strong>`)
      }
    });
  }

  return { ok: true, actorData, items, warnings, hasPortrait: !!ch.portrait };
}

/**
 * Import a champion JSON string (or object) as a NEW actor. All-or-nothing.
 * Returns { ok, actor?, errors?, warnings? }.
 */
export async function importChampion(json) {
  const built = await buildChampionImport(json);
  if (!built.ok) return built;

  const [actor] = await Actor.createDocuments([built.actorData]);
  if (built.items.length) await actor.createEmbeddedDocuments('Item', built.items);

  // The status die follows health zone + scene automatically — set it on import
  // so the sheet never opens with the d4 template default.
  try {
    await HealthUpdate(actor);
  } catch (e) { /* sheet render-time sync covers it as fallback */ }

  return { ok: true, actor, warnings: built.warnings };
}

/**
 * Is this actor a champion that already has a built character (i.e. a re-import, not a first fill)?
 */
export function isBuiltChampion(actor) {
  const c = actor?.system?.character;
  return !!(c?.bg?.id || c?.ps?.id || c?.arch?.id || c?.pers?.id);
}

/**
 * Pure: the update payload for importing INTO an existing actor. A first fill takes everything
 * from the JSON; a re-import (actor already built) keeps what only Foundry knows — current Health
 * (clamped to the new max) — and the actor's portrait unless the JSON carries one.
 */
export function mergeForReimport(built, actor, reimport) {
  const { name, img, system } = built.actorData;
  const out = { name, system: foundry.utils.deepClone(system) };
  if (!reimport) return { ...out, img };
  if (built.hasPortrait) out.img = img;
  const max = system.health.max;
  const held = Number.parseInt(actor.system?.play?.current ?? actor.system?.health?.value, 10);
  const value = Number.isFinite(held) ? Math.max(0, Math.min(held, max)) : max;
  out.system.health = { value, max };
  out.system.play.current = String(value);
  return out;
}

/**
 * Fill an existing champion actor in place. On an empty shell (the sheet's import button) it
 * takes everything from the JSON; on an already-built champion it is a RE-import: abilities that
 * came from an import (iid set) are rebuilt, hand-made ones, mods, scene/mode state and the current
 * Health are kept. Items are only touched after the JSON validated (all-or-nothing).
 */
export async function importIntoChampion(actor, json) {
  const built = await buildChampionImport(json);
  if (!built.ok) return built;
  const reimport = isBuiltChampion(actor);
  const update = mergeForReimport(built, actor, reimport);

  const staleIds = actor.items.filter(i => i.type === 'ability' && (!reimport || i.system.iid)).map(i => i.id);
  if (staleIds.length) await actor.deleteEmbeddedDocuments('Item', staleIds);
  await actor.update(update);
  if (built.items.length) await actor.createEmbeddedDocuments('Item', built.items);

  try {
    await HealthUpdate(actor);
  } catch (e) { /* sheet render-time sync covers it as fallback */ }

  return { ok: true, actor, warnings: built.warnings, reimport };
}
