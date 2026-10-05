// Forja de Campeões · Runeterra — Foundry VTT system entry point.
// Independent fork of the repaired SCRPG system (technical foundation), using the
// Runeterra web app's dataset and rules as the source of truth.

import { RUNETERRA } from './module/config.js';
import { catalog } from './module/data/catalog.js';
import { RuneterraCharacterSheet } from './module/sheets/character-sheet.js';
import { RuneterraItemSheet } from './module/sheets/item-sheet.js';
import { importChampion, parseChampion } from './module/import.js';
import { setSceneColor, resetScene } from './module/scene.js';
import { rollSelected } from './module/dice.js';
import { HealthUpdate, resolveStatusDie } from './module/status.js';

const HB = foundry.applications.handlebars;

Hooks.once('init', () => {
  globalThis.RUNETERRA = RUNETERRA;
  CONFIG.RUNETERRA = RUNETERRA;

  // Document sheets.
  const DSC = foundry.applications.apps.DocumentSheetConfig;
  const AppV1Sheets = foundry.appv1.sheets;
  DSC.unregisterSheet(Actor, 'core', AppV1Sheets.ActorSheet);
  DSC.registerSheet(Actor, 'runeterra', RuneterraCharacterSheet, { makeDefault: true });
  DSC.unregisterSheet(Item, 'core', AppV1Sheets.ItemSheet);
  DSC.registerSheet(Item, 'runeterra', RuneterraItemSheet, { makeDefault: true });

  // Settings.
  game.settings.register('runeterra', 'coloredDice', {
    name: 'RUNETERRA.SettingsColoredDice',
    hint: 'RUNETERRA.SettingsColoredDiceHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });

  // Handlebars helpers.
  // Block form: {{#select value}}<option …>{{/select}} — marks the matching option selected.
  Handlebars.registerHelper('select', function (selected, options) {
    if (arguments.length === 1) { options = selected; selected = undefined; }
    const html = options.fn(this);
    const escaped = Handlebars.escapeExpression(String(selected ?? ''));
    return new Handlebars.SafeString(html.replace(new RegExp(` value=["']${escaped}["']`), '$& selected'));
  });
  Handlebars.registerHelper('color', (key) => {
    const k = String(key ?? '');
    const map = { green: 'green', yellow: 'yellow', red: 'red', main: 'green' };
    const base = k.startsWith('green') ? 'green' : k.startsWith('yellow') ? 'yellow' : k.startsWith('red') ? 'red' : map[k] ?? 'green';
    return `color-${base}`;
  });

  HB.loadTemplates([
    'systems/runeterra/templates/partials/traits.hbs',
    'systems/runeterra/templates/partials/abilities.hbs',
    'systems/runeterra/templates/partials/principles.hbs',
    'systems/runeterra/templates/chat/mainroll.hbs',
    'systems/runeterra/templates/chat/minorroll.hbs',
    'systems/runeterra/templates/chat/abilityroll.hbs',
    'systems/runeterra/templates/chat/scenestatus.hbs'
  ]);

  console.log('RUNETERRA | Forja de Campeões · Runeterra — sistema carregado (dataset: ' +
    Object.keys(catalog.abilities()).length + ' habilidades, ' +
    catalog.backgrounds().length + ' origens, ' +
    catalog.powerSources().length + ' fontes, ' +
    catalog.archetypes().length + ' caminhos).');
});

Hooks.once('ready', () => {
  // Importer + table API (used by compendium macros and available for custom macros/tests).
  game.runeterra = { importChampion, parseChampion, setScene: setSceneColor, resetScene, rollSelected };

  // Rule safety net: Vida/Cena/criação mudados por qualquer via (macro, API, outra
  // ficha) recalculam o Status sozinho. HealthUpdate não escreve quando já está
  // certo, então não há loop: no máximo 1 update extra por mudança real.
  Hooks.on('updateActor', (actor, changed) => {
    try {
      if (actor.type !== 'champion' && actor.type !== 'villain') return;
      if (!actor.isOwner && !game.user?.isGM) return;
      const sys = changed?.system ?? {};
      if (!('play' in sys || 'scene' in sys || 'character' in sys)) return;
      const s = actor.system;
      const r = resolveStatusDie(s.character, s.play?.current, s.scene ?? 'green', s.derived);
      if (s.thirdDie !== r.die || s.thirdDieName !== r.name) HealthUpdate(actor);
    } catch (e) { /* dataset ainda carregando */ }
  });

  /** Add the "Importar personagem Runeterra" button to the Actors directory header. */
  // Strictly scoped to the Actors panel: an unscoped '.directory-header' lookup
  // can land in another tab (Items/Scenes), and the duplicate guard would then
  // block the real injection into Actors forever.
  // Containers tried in order: an empty directory renders a different header
  // (sometimes without .action-buttons), so fall back to the header itself and
  // finally the footer — the button must exist even with zero actors.
  const CONTAINER_SELS = [
    '.directory-header .action-buttons',
    '.header-actions',
    '.directory-header',
    '.directory-footer'
  ];
  const firstContainer = (root) => {
    for (const sel of CONTAINER_SELS) {
      const el = root?.querySelector?.(sel);
      if (el) return el;
    }
    return null;
  };
  const findActorsPanel = () => document.querySelector('#sidebar [data-tab="actors"]')
    ?? document.querySelector('.tab[data-tab="actors"]')
    ?? document.querySelector('#actors');
  const findActorsContainer = () => {
    const panel = findActorsPanel();
    if (!panel) return null;
    return firstContainer(panel);
  };
  const createImportButton = () => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rt-import-btn';
    btn.innerHTML = `<i class="fas fa-file-import"></i> ${game.i18n.localize('RUNETERRA.ImportCharacter')}`;
    btn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        const text = await file.text();
        const res = await game.runeterra.importChampion(text);
        if (res.ok) {
          const msgs = [game.i18n.format('RUNETERRA.ImportSuccess', { name: res.actor.name })];
          for (const w of res.warnings ?? []) msgs.push(w);
          ui.notifications.info(msgs.join(' '), { permanent: true });
          res.actor.sheet.render(true);
        } else {
          ui.notifications.error(
            game.i18n.localize('RUNETERRA.ImportFailed') + ' ' + res.errors.join(' | '),
            { permanent: true });
        }
      });
      input.click();
    });
    return btn;
  };
  const ensureImportButton = () => {
    try {
      const panel = findActorsPanel();
      // Panel-wide guard: exactly one button per panel, whichever container it landed in.
      if (!panel || panel.querySelector('.rt-import-btn')) return;
      const header = firstContainer(panel);
      if (!header) return;
      header.appendChild(createImportButton());
    } catch (e) {
      console.warn('RUNETERRA | botão de importação não pôde ser adicionado:', e);
    }
  };

  // Hook path: the rendered app's own element is always the right tab, so this
  // can never land in Items/Scenes. Falls back to panel search when unavailable.
  const injectFromApp = (_app, html) => {
    try {
      const el = html instanceof HTMLElement ? html : _app?.element;
      const header = firstContainer(el);
      if (header && !header.querySelector('.rt-import-btn')) {
        header.appendChild(createImportButton());
        return;
      }
    } catch (e) { /* fall through to panel search */ }
    ensureImportButton();
  };

  // Re-inject whenever the sidebar DOM changes (search, sort, create/delete actors
  // all re-render the header and destroy the manually appended button). A
  // MutationObserver doesn't depend on hook names or render timing: whenever the
  // Actors header exists without our button, it gets one. Injection always
  // targets the Actors panel (see findActorsHeader), no matter what changed.
  // The in-button guard prevents duplicates, so this is cheap to run often.
  const injectSoon = () => {
    ensureImportButton();
    setTimeout(ensureImportButton, 200);
  };
  try {
    const sidebar = document.getElementById('sidebar') ?? document.body;
    new MutationObserver(ensureImportButton).observe(sidebar, { childList: true, subtree: true });
  } catch (e) { /* observer unavailable: hooks + timeouts below still cover it */ }
  Hooks.on('renderActorDirectory', injectFromApp);
  Hooks.on('renderSidebarTab', injectSoon);
  Hooks.on('renderSidebar', injectSoon);
  Hooks.on('changeSidebarTab', (_app, tab) => {
    if (typeof tab === 'string' ? tab === 'actors' : tab?.tabId === 'actors') {
      setTimeout(ensureImportButton, 100);
    }
  });
  // Fallback for slow loads. Also exposed for manual trigger/debugging.
  game.runeterra.ensureImportButton = ensureImportButton;
  for (const ms of [500, 2000, 4000, 8000]) setTimeout(ensureImportButton, ms);
});
