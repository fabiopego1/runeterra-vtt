// Runeterra Foundry — rules-text helpers, ported from the web app (app.js: actionIcons,
// TERM_RE_PT, glossKey, rulesText): action icons for the ICON column, and glossary hover tips
// on rules terms ("dado Mín", "Zona Verde", "Atrapalhe"…) plus dice chips for "[d8]" tokens.
// Pure string work (no Foundry globals except the dataset's window.GLOSSARY), so it runs in Node tests.

/** Basic action → [icon code, pt-BR label] (the sheet's ICON column). */
export const ACTION_ICONS = {
  Attack: ['ATQ', 'Atacar'], Defend: ['DEF', 'Defender'], Overcome: ['SUP', 'Superar'],
  Boost: ['FOR', 'Fortalecer'], Hinder: ['ATR', 'Atrapalhar'], Recover: ['REC', 'Recuperar']
};

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Basic actions an ability uses, read from its ENGLISH rules text (like the web's ICON column). */
export function actionIcons(englishText) {
  const found = [];
  String(englishText ?? '').replace(/\b(Attack|Defend|Overcome|Boost|Hinder|Recover)\b/g, (m, a) => {
    if (!found.includes(a)) found.push(a);
    return m;
  });
  return found.map(a => ({
    action: a,
    cls: a.toLowerCase(),
    code: ACTION_ICONS[a][0],
    label: ACTION_ICONS[a][1],
    tip: `<h5>Ícone ${ACTION_ICONS[a][1]}</h5>${window.GLOSSARY?.[a] ?? ''}`
  }));
}

// Same pattern as the web's TERM_RE_PT (dice tokens, other [tokens], then glossary terms).
const TERM_RE_PT = /\[(d4|d6|d8|d10|d12)\]|\[([^\]]+)\]|(?<![A-Za-zÀ-ÿ])(Máx\+Médio\+Mín|Máx\+Médio|Máx\+Mín|Médio\+Mín|dados? Mín(?!\+)|dados? Médio(?!\+)|dados? Máx(?!\+)|Zona Verde|Zona Amarela|Zona Vermelha|dados? de status|reviravoltas? menor(?:es)?|reviravoltas? maior(?:es)?|pontos? de (?:herói|inspiração)|Atac[a-zà-ÿ]*|Ataque[a-zà-ÿ]*|Defend[a-zà-ÿ]*|Defesa|Super[aeo][a-zà-ÿ]*|Fortale[a-zà-ÿ]*|Atrapalh[a-zà-ÿ]*|Recuper[a-zà-ÿ]*|persistentes?|exclusiv[oa]s?|irredutíve(?:l|is)|bônus|penalidades?|lacaios?|tenentes?|Reaç(?:ão|ões)|dados iguais|próxim[oa]s?(?! (?:turno|rodada|vez|ação|sessão))|cenas?|memór(?:ia|ias)|Vida|ambientes?|ambienta(?:l|is)|reviravoltas?)(?![A-Za-zÀ-ÿ])/g;

const GLOSS_PT = [[/^máx\+médio\+mín/, 'Max+Mid+Min'], [/^máx\+médio/, 'Max+Mid'], [/^máx\+mín/, 'Max+Min'], [/^médio\+mín/, 'Mid+Min'],
  [/^dados? mín/, 'Min die'], [/^dados? médio/, 'Mid die'], [/^dados? máx/, 'Max die'],
  [/^zona verde/, 'Green zone'], [/^zona amarela/, 'Yellow zone'], [/^zona vermelha/, 'Red zone'], [/^dados? de status/, 'status die'],
  [/^reviravoltas? men/, 'minor twist'], [/^reviravoltas? mai/, 'major twist'], [/^pontos? de (?:herói|inspiração)/, 'hero point'],
  [/^atac/, 'Attack'], [/^defe/, 'Defend'], [/^super/, 'Overcome'], [/^fortale/, 'Boost'], [/^atrapalh/, 'Hinder'], [/^recuper/, 'Recover'],
  [/^persist/, 'persistent'], [/^exclusiv/, 'exclusive'], [/^irredut/, 'irreducible'], [/^bônus/, 'bonus'], [/^penalidade/, 'penalty'],
  [/^lacaio/, 'minion'], [/^tenente/, 'lieutenant'], [/^reaç/, 'Reaction'], [/^dados iguais/, 'doubles'], [/^próxim/, 'nearby'],
  [/^cena/, 'scene'], [/^memór/, 'collection'], [/^vida$/, 'Health'], [/^ambient/, 'environment'], [/^reviravolta/, 'twist']];

/** Glossary key (English) of a pt-BR rules term, or null. */
export function glossKey(term) {
  const l = String(term).toLowerCase();
  return GLOSS_PT.find(([re]) => re.test(l))?.[1] ?? null;
}

const glossTitle = key => window.I18N?.glossLabel?.[key] ?? key;

/**
 * Decorate rules-text HTML: "[d8]" → dice chip, glossary terms → hover tip (Foundry's
 * data-tooltip). Only text between tags is touched, so existing markup and attributes survive.
 */
export function decorateRulesHtml(html) {
  const gloss = window.GLOSSARY ?? {};
  return String(html ?? '').split(/(<[^>]+>)/).map(part => {
    if (!part || part.startsWith('<')) return part;
    return part.replace(TERM_RE_PT, (m, dsz, br, term) => {
      if (dsz) return `<span class="rt-die">${dsz}</span>`;
      if (br) return m;                                  // other [tokens]: left as the importer wrote them
      const key = glossKey(term);
      const g = key ? gloss[key] : null;
      return g ? `<span class="rt-term" data-tooltip="${esc(`<h5>${glossTitle(key)}</h5>${g}`)}">${term}</span>` : m;
    });
  }).join('');
}
