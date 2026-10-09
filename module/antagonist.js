// Runeterra Foundry — Antagonist (the Game Master's villain) from the web app's Antagonist Forge.
// Port of antagonist.js (model / fill / issues): the .json the Forge exports holds only the GM's
// CHOICES (approach, archetype, dice, abilities, upgrades…); everything else — dice sizes, Health,
// ability texts, status rows — is RECALCULATED here from the building blocks in the sealed vault
// (window.GM_VDATA, see vault.js). Pure logic: no Foundry documents are touched here.

import { catalog } from './data/catalog.js';

export const DIES = ['d4', 'd6', 'd8', 'd10', 'd12'];
export const bump = d => DIES[Math.min(DIES.length - 1, DIES.indexOf(d) + 1)];
export const RPKEY = 'rp-quality';
export const FORMAT = 'runeterra-antagonist';
const TOKEN_RE = /\[(poder\/qualidade|energia\/elemento|poder|qualidade)\]/g;
const tokensOf = text => [...new Set([...text.matchAll(TOKEN_RE)].map(m => m[1]))];

/** Health → zone ranges [green, yellow, red] (the Forge's table; first row with max >= threshold). */
const ZONES = [[100, ['Máx−75', '74−26', '25−1']], [95, ['95−70', '69−25', '24−1']], [90, ['90−66', '65−23', '22−1']], [85, ['85−60', '59−22', '21−1']],
  [80, ['80−55', '54−21', '20−1']], [75, ['75−50', '49−20', '19−1']], [70, ['70−50', '49−18', '17−1']], [65, ['65−45', '44−18', '17−1']],
  [60, ['60−41', '40−17', '16−1']], [55, ['55−38', '37−17', '16−1']], [50, ['50−35', '34−16', '15−1']], [45, ['45−32', '31−16', '15−1']],
  [40, ['40−30', '29−15', '14−1']], [35, ['35−27', '26−13', '12−1']], [30, ['30−23', '22−12', '11−1']], [25, ['25−20', '19−10', '9−1']],
  [20, ['20−16', '15−8', '7−1']], [15, ['15−11', '10−6', '5−1']], [10, ['10', '9−5', '4−1']]];
export const zonesFor = max => (ZONES.find(z => max >= z[0]) ?? ZONES[ZONES.length - 1])[1];

/** "74−26" / "Máx−75" / "10" → [high, low] numbers for a given max Health. */
export function zoneBounds(txt, max) {
  const parts = String(txt).replace('Máx', String(max)).split('−').map(Number);
  return parts.length > 1 ? [parts[0], parts[1]] : [parts[0], parts[0]];
}

/** Archetypes whose Status die follows the Health zone (all others depend on the scene: GM picks the row). */
export const ZONED = ['bruiser', 'fragile'];

const blank = () => ({
  name: '', alias: '', concept: '', note: '', portrait: null, n: 4, ap: '', arch: '', P: {}, Q: {}, rp: '', rpDesc: '', rpOk: false,
  ab: {}, tk: {}, up: {}, mastery: '', renames: {}, traitNames: {}, play: { cur: '', notes: [], plans: [] }
});

/** Merge a saved/exported state onto a blank one (older exports lack newer fields). */
export function normalizeAntagonist(o) {
  const s = Object.assign(blank(), o || {});
  s.play = Object.assign(blank().play, s.play || {});
  if (o && o.rp && o.rpOk === undefined) s.rpOk = true;   // named before the Confirm button existed
  return s;
}

/** Is this JSON (text or object) an Antagonist Forge export? Cheap sniff, no validation. */
export function isAntagonistJson(json) {
  try {
    const o = typeof json === 'string' ? JSON.parse(json) : json;
    return o?.app === FORMAT;
  } catch (e) { return false; }
}

/** Validate the file envelope and return { state, errors }. */
export function parseAntagonist(json) {
  const errors = [];
  let o = json;
  if (typeof json === 'string') {
    try { o = JSON.parse(json); } catch (e) { return { state: null, errors: ['JSON inválido: ' + e.message] }; }
  }
  if (!o || typeof o !== 'object') return { state: null, errors: ['Conteúdo não é um objeto.'] };
  if (o.app !== FORMAT) errors.push('não parece um arquivo da Forja do Antagonista (campo "app" ausente).');
  else if (o.v !== 1) errors.push(`versão ${o.v} do arquivo do antagonista não suportada (esperado 1).`);
  const state = normalizeAntagonist(o);
  if (!state.ap) errors.push('abordagem não escolhida.');
  if (!state.arch) errors.push('arquétipo não escolhido.');
  if (!state.name?.trim() && !state.alias?.trim()) errors.push('o antagonista não tem nome.');
  return { state, errors };
}

/** Display name of a trait key for this antagonist (custom name → named interpretation quality → book name). */
export function traitLabel(S, key) {
  return catalog.traitName(key, { traitNames: S.traitNames ?? {}, pers: { qname: S.rpOk ? S.rp : '', qok: !!(S.rpOk && S.rp?.trim()) } });
}

/** The building blocks chosen by this state: dice, abilities, upgrades, Health (port of model()). */
export function antagonistModel(S, VD) {
  const N = S.n, ap = VD.approaches.find(x => x.id === S.ap), ar = VD.archetypes.find(x => x.id === S.arch);
  const ups = VD.upgrades.filter(u => S.up[u.id]);
  const pUp = ups.some(u => u.id === 'power'), qUp = ups.some(u => u.id === 'quality');
  const pDice = ap ? ap.P.map(d => (pUp ? bump(d) : d)) : [], qDice = ap ? ap.Q.map(d => (qUp ? bump(d) : d)) : [];
  const pOver = !!(ap && pUp && ap.P.some(d => d === 'd12')), qOver = !!(ap && qUp && ap.Q.some(d => d === 'd12'));
  const needA = ap ? ap.pick + (qOver ? 1 : 0) : 0;
  const arPool = ar ? ar.ab.filter(a => a.n !== ar.gain) : [];
  const needR = ar ? ar.pick + (pOver ? 1 : 0) : 0;
  const chosenA = ap ? ap.ab.map((a, i) => ({ a, id: 'a:' + i })).filter(x => S.ab[x.id]) : [];
  const chosenR = ar ? arPool.map(a => ({ a, id: 'r:' + ar.ab.indexOf(a) })).filter(x => S.ab[x.id]) : [];
  const gain = ar && ar.gain ? ar.ab.filter(a => a.n === ar.gain).map(a => ({ a, id: 'g:' + a.n })) : [];
  const upAb = [];
  for (const u of ups) u.ab.forEach((a, i) => { if (u.id !== 'vehicle' || S.ab['u:vehicle:' + i]) upAb.push({ a, id: `u:${u.id}:${i}`, src: u.n }); });
  const upH = ups.reduce((n, u) => n + u.hp, 0);
  const hp = ap && ar ? ap.hp + ar.hp + 5 * N + upH : null;
  const mastery = ups.length ? VD.masteries.find(m => m.n === S.mastery) ?? null : null;
  return { N, ap, ar, ups, pDice, qDice, pOver, qOver, needA, needR, arPool, chosenA, chosenR, gain, upAb, upH, hp, mastery };
}

/** An ability's text with the traits the GM picked filled in (HTML, trait names in <strong>). */
export function fillAbility(S, a, id) {
  return a.x.replace(TOKEN_RE, (m, t) => {
    const k = S.tk[id + '|' + t];
    return k ? `<strong>${traitLabel(S, k)}</strong>` : m;
  });
}

/** What the Forge would still flag (port of issues(), trimmed to what makes an import wrong). */
export function antagonistIssues(S, m) {
  const I = [];
  if (!m.ap || !m.ar) return ['abordagem/arquétipo desconhecidos neste cofre.'];
  const lackP = m.pDice.filter((d, i) => !S.P[i]).length, lackQ = m.qDice.filter((d, i) => !S.Q[i]).length;
  if (lackP) I.push(`faltam ${lackP} dado(s) de poder para atribuir.`);
  if (lackQ) I.push(`faltam ${lackQ} dado(s) de qualidade para atribuir.`);
  if (!S.rp.trim() || !S.rpOk) I.push('a qualidade de interpretação (d8) não está nomeada e confirmada.');
  if (m.chosenA.length < m.needA) I.push(`faltam ${m.needA - m.chosenA.length} habilidade(s) da abordagem.`);
  if (m.chosenR.length < m.needR) I.push(`faltam ${m.needR - m.chosenR.length} habilidade(s) do arquétipo.`);
  for (const x of m.chosenA.concat(m.chosenR, m.gain, m.upAb)) {
    const open = tokensOf(x.a.x).filter(t => !S.tk[x.id + '|' + t]);
    if (open.length) I.push(`“${x.a.n}”: falta escolher ${open.map(t => '[' + t + ']').join(' e ')}.`);
  }
  for (const [kind, store] of [['P', S.P], ['Q', S.Q]]) {
    for (const k of Object.values(store)) if (k && !catalog.trait(k)) I.push(`traço "${k}" (${kind}) não existe no dataset.`);
  }
  return I;
}

/** Status die row to use now: zone-driven for Brutamontes/Frágil, else the GM's choice (clamped). */
export function statusIndexFor(ar, state, hpNow, hpMax) {
  const rows = ar?.status ?? [];
  if (rows.length === 3 && ZONED.includes(ar.id)) return zoneIndexOf(hpNow, hpMax);
  const i = Number.isInteger(state?.statusIndex) ? state.statusIndex : 0;
  return Math.max(0, Math.min(Math.max(0, rows.length - 1), i));
}

/** 0 green · 1 yellow · 2 red for current Health (by the Forge's table); null when knocked out (0). */
export function zoneIndexOf(hpNow, hpMax) {
  const z = zonesFor(hpMax);
  const [, greenLow] = zoneBounds(z[0], hpMax), [, yellowLow] = zoneBounds(z[1], hpMax);
  return hpNow >= greenLow ? 0 : hpNow >= yellowLow ? 1 : 2;
}

/** Short label of a status row for the dice card ("Zona Verde (Vida)" → "Zona Verde"). */
export const shortStatus = label => {
  const t = String(label).replace(/\s*\(Vida\)$/, '');
  return t.length > 36 ? t.slice(0, 35).trimEnd() + '…' : t;
};

const ZONE_NAMES = ['green', 'yellow', 'red'];

/**
 * Build everything the importer needs from an Antagonist Forge JSON and the vault's data.
 * All-or-nothing on errors; sheet gaps (unnamed trait, missing pick…) become warnings.
 * Returns { ok:false, errors } | { ok, actorData, items, warnings, portrait }.
 */
export function buildAntagonistImport(json, VD) {
  const { state: S, errors } = parseAntagonist(json);
  if (!S || errors.length) return { ok: false, errors };
  const m = antagonistModel(S, VD);
  if (!m.ap || !m.ar) return { ok: false, errors: [`abordagem "${S.ap}" ou arquétipo "${S.arch}" não existe neste cofre — o cofre do VTT pode estar desatualizado.`] };
  const warnings = antagonistIssues(S, m).map(w => w[0].toUpperCase() + w.slice(1));

  // Traits: power/quality dice by slot, plus the Signature (interpretation) quality d8.
  const powers = {}, qualities = {};
  m.pDice.forEach((d, i) => { const k = S.P[i]; if (k && catalog.trait(k)) powers[k] = d; });
  m.qDice.forEach((d, i) => { const k = S.Q[i]; if (k && catalog.trait(k)) qualities[k] = d; });
  if (S.rp.trim() && S.rpOk) qualities[RPKEY] = 'd8';

  // Health, zones and the Status rows of the archetype.
  const hp = m.hp;
  const zoned = ZONED.includes(m.ar.id);
  const zr = zonesFor(hp);
  const [gHi, gLo] = zoneBounds(zr[0], hp), [yHi, yLo] = zoneBounds(zr[1], hp), [rHi] = zoneBounds(zr[2], hp);
  const curRaw = parseInt(S.play.cur, 10);
  const cur = Number.isFinite(curRaw) ? Math.max(0, Math.min(hp, curRaw)) : hp;
  const status = m.ar.status.map(([label, die]) => ({ label, short: shortStatus(label), die }));
  const sIdx = statusIndexFor(m.ar, null, cur, hp);

  const { portrait, ...kept } = S;
  const antagonist = {
    state: kept,
    statusIndex: sIdx,
    zone: zoned ? ZONE_NAMES[sIdx] : 'green',
    zoned,
    status,
    ranges: { green: zr[0].replace('Máx', String(hp)), yellow: zr[1], red: zr[2] },
    approach: m.ap.n, archetype: m.ar.n,
    upgrades: m.ups.map(u => u.n),
    mastery: m.mastery ? { n: m.mastery.n, x: m.mastery.x } : null,
    hpFormula: `${m.ap.hp} ${m.ar.hp >= 0 ? '+ ' + m.ar.hp : '− ' + -m.ar.hp} + 5×${m.N}${m.upH ? ' + ' + m.upH : ''} = ${hp}`
  };
  const actorData = {
    name: (S.name || S.alias).trim(),
    type: 'villain',
    img: 'icons/svg/mystery-man.svg',
    system: {
      approach: m.ap.n,
      character: { traitNames: S.traitNames ?? {}, pers: { qname: S.rpOk ? S.rp : '', qok: !!(S.rpOk && S.rp.trim()) } },
      antagonist,
      derived: {
        powers, qualities,
        status: zoned && status.length === 3 ? { green: status[0].die, yellow: status[1].die, red: status[2].die } : null,
        status2: null,
        healthMax: hp, greenLow: gLo, yellowHigh: yHi, yellowLow: yLo, redHigh: rHi
      },
      health: { value: cur, max: hp },
      play: { current: String(cur) },
      thirdDie: status[sIdx]?.die ?? 'd4',
      thirdDieName: status[sIdx]?.short ?? 'N/A'
    }
  };

  // Abilities (approach, archetype, the archetype's free ability, upgrades) and the mastery, as ability items.
  const items = [];
  const push = (group, id, a, srcName) => {
    const custom = S.renames[id]?.trim() ?? '';
    items.push({
      name: custom || a.n,
      type: 'ability',
      sort: items.length * 100,   // keep the Forge's order (approach, archetype, upgrades, mastery)
      system: {
        iid: 'ant:' + id, group, canonicalName: '', customName: custom, type: a.t, zone: 'green',
        traits: tokensOf(a.x).map(t => S.tk[id + '|' + t]).filter(Boolean),
        choices: {}, gameText: fillAbility(S, a, id), source: srcName
      }
    });
  };
  for (const x of m.chosenA) push('antagonist-ap', x.id, x.a, m.ap.n);
  for (const x of m.chosenR) push('antagonist-ar', x.id, x.a, m.ar.n);
  for (const x of m.gain) push('antagonist-ar', x.id, x.a, m.ar.n);
  for (const x of m.upAb) push('antagonist-up', x.id, x.a, x.src);
  if (m.mastery) push('antagonist-mastery', 'mastery', { n: m.mastery.n, t: 'I', x: m.mastery.x }, 'Maestria');

  return { ok: true, actorData, items, warnings, portrait: portrait ?? null };
}

/**
 * Keep the actor's Status die (and zone tag) in step with Health / the GM's row choice.
 * Mirrors status.js HealthUpdate for antagonists; skips the update when nothing changed.
 */
export async function AntagonistUpdate(actor) {
  const sys = actor.system, ant = sys.antagonist;
  if (!ant?.status?.length) return;
  const max = sys.derived?.healthMax || sys.health?.max || 0;
  const cur = parseInt(sys.play?.current, 10);
  const hpNow = Number.isFinite(cur) ? cur : max;
  const zoned = !!ant.zoned && ant.status.length === 3;
  const idx = zoned ? zoneIndexOf(hpNow, max) : Math.max(0, Math.min(ant.status.length - 1, ant.statusIndex ?? 0));
  const row = ant.status[idx];
  const patch = {};
  if (ant.statusIndex !== idx) patch['system.antagonist.statusIndex'] = idx;
  const zone = zoned ? ZONE_NAMES[idx] : 'green';
  if (ant.zone !== zone) patch['system.antagonist.zone'] = zone;
  if (sys.thirdDie !== row.die) patch['system.thirdDie'] = row.die;
  if (sys.thirdDieName !== row.short) patch['system.thirdDieName'] = row.short;
  if (Number.isFinite(cur) && sys.health?.value !== cur) patch['system.health.value'] = cur;
  if (Object.keys(patch).length) await actor.update(patch);
}
