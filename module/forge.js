// Runeterra Foundry — registry of the file formats the web app (the "Forja") exports.
// One place that knows which JSON is which, so a NEW export from the Forja plugs in by registering
// one entry instead of editing the importer's `if` chain. The Actors-directory button, the empty-sheet
// import and "Atualizar do JSON" all go through sniffForge().
//
// A format is:
//   id      short id ('champion', 'antagonist', 'gm-backup', …)
//   label   pt-BR name for messages
//   detect  (obj) => boolean — cheap sniff of the parsed JSON, no validation
//   create  async (json) => { ok, actor?|actors?, errors?, warnings? } — import as NEW document(s)
//   into    optional async (actor, json) => same — fill/update an EXISTING actor (the sheet buttons)
//
// Current formats (see their modules): champion (import.js), antagonist (import.js),
// gm-backup — the GM Screen's encrypted table backup (foes.js).

const formats = new Map();

/** Register (or replace) a format. Later registrations are sniffed later; put specific ones first. */
export function registerForgeFormat(def) {
  for (const k of ['id', 'label', 'detect', 'create']) if (!def?.[k]) throw new Error(`Formato da Forja sem "${k}".`);
  formats.set(def.id, def);
  return def;
}

export const forgeFormats = () => [...formats.values()];
export const forgeFormat = id => formats.get(id) ?? null;

/** Parse text/objects defensively; null when it is not JSON. */
export function parseJson(json) {
  if (json && typeof json === 'object') return json;
  try { return JSON.parse(json); } catch (e) { return null; }
}

/** The registered format that recognises this JSON (text or object), or null. */
export function sniffForge(json) {
  const o = parseJson(json);
  if (!o) return null;
  for (const f of formats.values()) {
    try { if (f.detect(o)) return f; } catch (e) { /* a broken detector must not hide the others */ }
  }
  return null;
}

/** pt-BR list of what can be imported, for error messages. */
export const forgeFormatList = () => forgeFormats().map(f => f.label).join(', ');
