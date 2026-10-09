// Runeterra Foundry — the GM vault (same sealed file as the web app's GM Screen).
// The vault holds GM-only rules material (villain building blocks, tools, twist tables, the
// Bullpen's ready examples…) adapted from the rulebook. It ships ENCRYPTED in data/gm-vault.js
// (AES-GCM, PBKDF2) and is opened at run time by the Game Master's password. The password is never
// stored: only the derived key lives in sessionStorage for the tab, like the web app does.
// Modules are opened on demand (only what a feature needs). WebCrypto only, so it runs in Node tests.

const KEY_STORE = 'runeterra-gm-key';
const VAULT_URL = 'systems/runeterra/data/gm-vault.js';

/** What each module defines, and which module must run before it. */
export const VAULT_MODULES = {
  'gm-villain-data': { global: 'GM_VDATA', needs: [] },
  'gm-twists': { global: 'GM_TWISTS', needs: [] },
  // The Bullpen keeps its ready examples inside a closure; exposeBullpenData() adds one line (below)
  // so they can be read. The sealed file itself is never modified.
  'gm-bullpen': { global: 'GM_BULLPEN_DATA', needs: ['gm-villain-data'], patch: exposeBullpenData }
};

/** Add a line to the Bullpen module's source that exposes its example lists. Throws if the book changed. */
export function exposeBullpenData(src) {
  const anchor = 'window.GM_BULLPEN = {';
  if (!src.includes(anchor) || !/\bconst MINIONS\b/.test(src) || !/\bconst LIEUTENANTS\b/.test(src)) {
    throw new Error('O módulo da Bancada mudou de formato: não foi possível ler os lacaios e tenentes de exemplo.');
  }
  return src.replace(anchor, `window.GM_BULLPEN_DATA = { MINIONS, LIEUTENANTS };\n  ${anchor}`);
}

const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const toB64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const win = () => globalThis.window ?? globalThis;
let payload = null;            // decrypted vault (kept in memory for the page's life)
const ran = new Set();         // modules already executed

/** Load data/gm-vault.js (sets window.GM_VAULT) the first time it is needed. */
export async function loadVault() {
  if (win().GM_VAULT) return win().GM_VAULT;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = VAULT_URL;
    s.onload = resolve;
    s.onerror = () => reject(new Error('O cofre (data/gm-vault.js) não foi encontrado.'));
    document.head.appendChild(s);
  });
  if (!win().GM_VAULT) throw new Error('O cofre foi carregado, mas está vazio.');
  return win().GM_VAULT;
}

/** Derive the 256-bit vault key from the password; returns it base64-encoded. */
export async function deriveRawKey(password) {
  const v = await loadVault();
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(password).normalize('NFC')), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: b64(v.salt), iterations: v.iter }, base, 256);
  return toB64(bits);
}

/** Decrypt the vault with a raw key (base64). Returns the payload, or null when the key is wrong. */
export async function openWithRawKey(raw) {
  const v = await loadVault();
  try {
    const key = await crypto.subtle.importKey('raw', b64(raw), 'AES-GCM', false, ['decrypt']);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(v.iv) }, key, b64(v.ct));
    const o = JSON.parse(new TextDecoder().decode(plain));
    return o && o.v === 2 ? o : null;
  } catch (e) {
    return null;
  }
}

/**
 * Decrypt an arbitrary AES-GCM box { iv, ct } (base64) with a raw vault key. Used for files the
 * GM Screen exports (backups) that were sealed with the same key. Returns the parsed JSON or null.
 */
export async function openBoxWithRawKey(raw, box) {
  try {
    const key = await crypto.subtle.importKey('raw', b64(raw), 'AES-GCM', false, ['decrypt']);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(box.iv) }, key, b64(box.ct));
    return JSON.parse(new TextDecoder().decode(plain));
  } catch (e) {
    return null;
  }
}

const store = {
  get() { try { return globalThis.sessionStorage?.getItem(KEY_STORE) ?? null; } catch (e) { return null; } },
  set(v) { try { globalThis.sessionStorage?.setItem(KEY_STORE, v); } catch (e) { /* private mode */ } },
  clear() { try { globalThis.sessionStorage?.removeItem(KEY_STORE); } catch (e) { /* ignore */ } }
};

/** The raw key kept for this tab (or null). */
export const keptKey = () => store.get();

/** Run one vault module (and what it needs), once. */
function runModule(name) {
  if (ran.has(name)) return;
  const def = VAULT_MODULES[name];
  if (!def) throw new Error(`Módulo "${name}" desconhecido.`);
  for (const dep of def.needs) runModule(dep);
  let src = payload.modules?.[name];
  if (!src) throw new Error(`O cofre não tem o módulo "${name}".`);
  if (def.patch) src = def.patch(src);
  new Function('window', src)(win());
  if (!win()[def.global]) throw new Error(`O módulo "${name}" abriu, mas não definiu ${def.global}.`);
  ran.add(name);
}

/**
 * Open the vault and run the named modules. Tries, in order: already open in this page, the key
 * kept for this tab, the given password. Returns { ok, error?, needPassword? }; never throws for a
 * wrong password.
 */
export async function unlockModules(names, { password = null } = {}) {
  if (!payload) {
    const kept = store.get();
    if (kept) payload = await openWithRawKey(kept);
    if (!payload && password != null) {
      let raw;
      try { raw = await deriveRawKey(password); } catch (e) { return { ok: false, error: e.message || String(e) }; }
      payload = await openWithRawKey(raw);
      if (payload) store.set(raw);
    }
  }
  if (!payload) return { ok: false, needPassword: true, error: password != null ? 'Senha incorreta.' : 'O cofre do Mestre está fechado.' };
  try { for (const n of names) runModule(n); } catch (e) { return { ok: false, error: e.message || String(e) }; }
  return { ok: true };
}

/** The villain building blocks if already unlocked in this page. */
export const villainData = () => win().GM_VDATA ?? null;

/** Antagonist importer entry: make window.GM_VDATA available. */
export const unlockVillainData = opts => unlockModules(['gm-villain-data'], opts);

/** Forget the key kept for this tab and what was opened (a page reload also drops the modules). */
export function lockVault() {
  store.clear();
  payload = null;
}

/**
 * Foundry UI: open the vault modules, asking the GM for the password when needed (GM only).
 * Resolves to { ok, error? }. Not used by tests.
 */
export async function ensureVaultModules(names) {
  if (!game.user.isGM) return { ok: false, error: 'Só o Mestre pode usar o material do cofre (ferramentas do Escudo do Mestre).' };
  let r = await unlockModules(names);
  while (!r.ok && r.needPassword) {
    const pw = await foundry.applications.api.DialogV2.prompt({
      window: { title: game.i18n.localize('RUNETERRA.VaultTitle') },
      content: `<p>${game.i18n.localize('RUNETERRA.VaultPrompt')}</p><input type="password" name="pw" autocomplete="off" autofocus>`,
      ok: { label: game.i18n.localize('RUNETERRA.VaultUnlock'), callback: (ev, button) => button.form.elements.pw.value },
      rejectClose: false
    });
    if (pw == null || pw === '') return { ok: false, error: 'Operação cancelada: o cofre continua fechado.' };
    r = await unlockModules(names, { password: pw });
    if (!r.ok && !r.needPassword) return r;
    if (!r.ok) ui.notifications.warn(r.error);
  }
  return r;
}

/** Antagonist importer UI entry (kept for import.js). */
export const ensureVillainData = () => ensureVaultModules(['gm-villain-data']);
