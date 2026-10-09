// Runeterra Foundry — the GM vault (same sealed file as the web app's GM Screen).
// The vault holds GM-only rules material (villain building blocks, tools, notes) adapted from the
// rulebook. It ships ENCRYPTED in data/gm-vault.js (AES-GCM, PBKDF2) and is opened at run time by
// the Game Master's password. The password is never stored: only the derived key lives in
// sessionStorage for the tab, like the web app does. WebCrypto only, so it also runs in Node tests.

const KEY_STORE = 'runeterra-gm-key';
const VAULT_URL = 'systems/runeterra/data/gm-vault.js';
const MODULES = ['gm-villain-data'];   // what the importer needs; the rest of the vault stays closed

const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const toB64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const win = () => globalThis.window ?? globalThis;

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

/** Run the named vault modules as scripts (they define window.GM_* globals). */
export function runModules(payload, names = MODULES) {
  for (const n of names) {
    const src = payload.modules?.[n];
    if (!src) throw new Error(`O cofre não tem o módulo "${n}".`);
    new Function('window', src)(win());
  }
}

const store = {
  get() { try { return globalThis.sessionStorage?.getItem(KEY_STORE) ?? null; } catch (e) { return null; } },
  set(v) { try { globalThis.sessionStorage?.setItem(KEY_STORE, v); } catch (e) { /* private mode */ } },
  clear() { try { globalThis.sessionStorage?.removeItem(KEY_STORE); } catch (e) { /* ignore */ } }
};

/** The villain building blocks if already unlocked in this page. */
export const villainData = () => win().GM_VDATA ?? null;

/**
 * Make window.GM_VDATA available. Tries, in order: already loaded, the key kept for this tab,
 * the given password. Returns { ok, error? }; never throws for a wrong password.
 */
export async function unlockVillainData({ password = null } = {}) {
  if (villainData()) return { ok: true };
  let payload = null;
  const kept = store.get();
  if (kept) payload = await openWithRawKey(kept);
  if (!payload && password != null) {
    let raw;
    try { raw = await deriveRawKey(password); } catch (e) { return { ok: false, error: e.message || String(e) }; }
    payload = await openWithRawKey(raw);
    if (payload) store.set(raw);
  }
  if (!payload) return { ok: false, needPassword: true, error: password != null ? 'Senha incorreta.' : 'O cofre do Mestre está fechado.' };
  try { runModules(payload); } catch (e) { return { ok: false, error: e.message || String(e) }; }
  return villainData() ? { ok: true } : { ok: false, error: 'O cofre abriu, mas os dados do antagonista não foram carregados.' };
}

/** Forget the key kept for this tab. */
export const lockVault = () => store.clear();

/**
 * Foundry UI: unlock with a password prompt when needed (GM only). Resolves to
 * { ok, error? }. Not used by tests.
 */
export async function ensureVillainData() {
  if (!game.user.isGM) return { ok: false, error: 'Só o Mestre pode importar antagonistas (o material é do cofre do Mestre).' };
  let r = await unlockVillainData();
  while (!r.ok && r.needPassword) {
    const pw = await foundry.applications.api.DialogV2.prompt({
      window: { title: game.i18n.localize('RUNETERRA.VaultTitle') },
      content: `<p>${game.i18n.localize('RUNETERRA.VaultPrompt')}</p><input type="password" name="pw" autocomplete="off" autofocus>`,
      ok: { label: game.i18n.localize('RUNETERRA.VaultUnlock'), callback: (ev, button) => button.form.elements.pw.value },
      rejectClose: false
    });
    if (pw == null || pw === '') return { ok: false, error: 'Importação cancelada: o cofre continua fechado.' };
    r = await unlockVillainData({ password: pw });
    if (!r.ok && !r.needPassword) return r;
    if (!r.ok) ui.notifications.warn(r.error);
  }
  return r;
}
