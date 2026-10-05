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
  DocumentSheetConfig.unregisterSheet(Actor, 'core', ActorSheet);
  DocumentSheetConfig.registerSheet(Actor, 'runeterra', RuneterraCharacterSheet, { makeDefault: true });
  DocumentSheetConfig.unregisterSheet(Item, 'core', ItemSheet);
  DocumentSheetConfig.registerSheet(Item, 'runeterra', RuneterraItemSheet, { makeDefault: true });

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

  loadTemplates([
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
  const ensureImportButton = (root) => {
    try {
      const scope = root instanceof HTMLElement ? root : document;
      const header = scope.querySelector?.('.directory-header .action-buttons')
        ?? scope.querySelector?.('.header-actions')
        ?? document.querySelector('#actors .directory-header .action-buttons')
        ?? document.querySelector('#actors .header-actions');
      if (!header || header.querySelector('.rt-import-btn')) return;
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
      header.appendChild(btn);
    } catch (e) {
      console.warn('RUNETERRA | botão de importação não pôde ser adicionado:', e);
    }
  };

  // Re-inject on EVERY directory render (search, sort, create/delete actors all
  // re-render the header and destroy the manually appended button) plus tab
  // switches back to Actors. The in-button guard prevents duplicates.
  const injectSoon = (root) => {
    ensureImportButton(root);
    setTimeout(() => ensureImportButton(root), 200);
  };
  Hooks.on('renderActorDirectory', (_app, html) => injectSoon(html ?? _app?.element));
  Hooks.on('renderSidebarTab', (_app, html) => injectSoon(html ?? _app?.element));
  Hooks.on('changeSidebarTab', (_app, tab) => {
    if (typeof tab === 'string' ? tab === 'actors' : tab?.tabId === 'actors') {
      setTimeout(() => ensureImportButton(), 100);
    }
  });
  // The directory may already be rendered when this hook registers.
  setTimeout(() => ensureImportButton(), 500);
  setTimeout(() => ensureImportButton(), 4000);
});
