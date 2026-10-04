// Runeterra Foundry — shim replacing the web app's i18n.js bootstrap.
// The data files (data-rules.js, data-tables.js, data-lore.js) and their pt-BR overlays
// (data/pt/*.js) are the canonical dataset reused verbatim from the Runeterra web app.
// They expect window.I18N (three lookup maps) and window.T to exist; the web version also
// touches document/localStorage, which we do not want inside Foundry.
(() => {
  'use strict';
  const I18N = (window.I18N = {
    ui: {},    // English UI string → pt-BR
    text: {},  // English rules text → pt-BR (same [tokens])
    names: {}  // English ability name → pt-BR
  });
  window.T = (s, vars) => {
    let out = Object.prototype.hasOwnProperty.call(I18N.ui, s) ? I18N.ui[s] : s;
    if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    return out;
  };
})();
