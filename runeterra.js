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
  // Design: ONE re-injection mechanism (a body-level MutationObserver), not a pile of
  // hooks and timers. The button is appended DOM, so the directory header re-render
  // wipes it — the observer re-adds it on the next mutation. The observer binds to
  // document.body (never replaced by Foundry), filters to sidebar changes, and
  // throttles to one check per frame. The append itself is guarded and scoped to the
  // Actors panel, so a run is cheap and can never touch Items/Scenes.
  const findActorsPanel = () => game.actors.apps?.[0]?.element
    ?? ui.actors?.element
    // fallbacks for odd render orders; note [data-tab="actors"] ALSO matches the
    // sidebar icon button, so it must not be used to find the panel itself.
    ?? document.querySelector('#actors')
    ?? document.querySelector('.sidebar-tab.directory.actors-sidebar');
  const findHeader = (panel) => panel?.querySelector('.directory-header .action-buttons')
    ?? panel?.querySelector('.header-actions')
    ?? panel?.querySelector('.directory-header');
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
      if (!panel || panel.querySelector('.rt-import-btn')) return;
      const header = findHeader(panel);
      if (!header) return;
      header.appendChild(createImportButton());
    } catch (e) {
      console.warn('RUNETERRA | botão de importação não pôde ser adicionado:', e);
    }
  };
  let ensureQueued = false;
  const queueEnsure = () => {
    if (ensureQueued) return;
    ensureQueued = true;
    requestAnimationFrame(() => {
      ensureQueued = false;
      ensureImportButton();
    });
  };
  try {
    // No node filter on purpose: a header re-render adds the .directory-header node
    // ITSELF (no matching descendant), so matching descendants alone misses exactly
    // the mutation that wipes the button. queueEnsure is rAF-throttled and
    // ensureImportButton no-ops in one query when nothing is needed.
    new MutationObserver(() => queueEnsure())
      .observe(document.body, { childList: true, subtree: true });
  } catch (e) {
    console.warn('RUNETERRA | observer indisponível:', e);
  }
  // Safety net: Foundry's async render can wipe the button AFTER the observer's
  // re-injection lands (the two interleave). A cheap periodic check bounds how long
  // the button can ever be missing to one interval; it no-ops when present.
  setInterval(ensureImportButton, 3000);
  Hooks.on('renderActorDirectory', () => queueEnsure());
  // First paint after login (the observer may bind before the sidebar exists).
  setTimeout(ensureImportButton, 2000);
  // Manual trigger/debugging.
  game.runeterra.ensureImportButton = ensureImportButton;
});
