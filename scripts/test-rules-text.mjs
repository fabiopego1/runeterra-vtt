// Rules-text helpers (action icons, glossary tips, dice chips) + qok migration of old JSONs.
// Run: node scripts/test-rules-text.mjs
import fs from 'node:fs';
import { dataset as W, FIXTURE } from './_load-dataset.mjs';
const { actionIcons, decorateRulesHtml, glossKey } = await import('../module/rules-text.js');
globalThis.foundry = { utils: { deepClone: structuredClone } };
const { parseChampion } = await import('../module/import.js');

let fail = 0;
const check = (name, ok, extra = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`); };

// Action icons come from the ENGLISH text, in order of appearance, without duplicates.
check('icons: Attack + Hinder', JSON.stringify(actionIcons('Attack a target. Then Hinder it, Attack again.').map(i => i.code)) === '["ATQ","ATR"]');
check('icons: none', actionIcons('Remove any penalty.').length === 0);
check('icons: tip carries the glossary', /Atacar/.test(actionIcons('Attack')[0].tip) && /<h5>/.test(actionIcons('Attack')[0].tip));
const withIcons = Object.values(W.ABILITIES).filter(a => actionIcons(a.text).length).length;
check('icons found on a sensible share of the 299 abilities', withIcons > 100, String(withIcons));

// Glossary keys.
check('glossKey dado Mín', glossKey('dado Mín') === 'Min die');
check('glossKey Zona Verde', glossKey('Zona Verde') === 'Green zone');
check('glossKey Atrapalhe', glossKey('Atrapalhe') === 'Hinder');

// Decoration only touches text between tags, keeps markup, adds tips and dice chips.
const out = decorateRulesHtml('Ataque usando <strong>Cósmico</strong>, aplicando seu dado Mín. Role [d8] na Zona Verde.');
check('term gets a tooltip', /<span class="rt-term" data-tooltip="[^"]*Dado M/.test(out), out);
check('dado Mín text preserved', />dado Mín<\/span>/.test(out));
check('Zona Verde decorated', />Zona Verde<\/span>/.test(out));
check('[d8] becomes a die chip', out.includes('<span class="rt-dchip">d8</span>') && !out.includes('[d8]'));
check('markup untouched', out.includes('<strong>Cósmico</strong>'));
check('attributes are never decorated', decorateRulesHtml('<a title="dado Mín">x</a>') === '<a title="dado Mín">x</a>');
check('"próximo turno" is not "nearby"', !/rt-term/.test(decorateRulesHtml('até o início do seu próximo turno')));
check('unknown [token] left alone', decorateRulesHtml('[energia/elemento]') === '[energia/elemento]');
check('idempotent on plain text', decorateRulesHtml('sem termos aqui') === 'sem termos aqui');

// Old JSON (named Signature Quality, no qok) counts as confirmed, like the web's upgradeState.
const raw = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
check('fixture really lacks qok', raw.pers.qname && raw.pers.qok === undefined);
check('parse sets qok when named', parseChampion(raw).state.pers.qok === true);
check('parse keeps explicit qok=false', parseChampion({ ...raw, pers: { ...raw.pers, qok: false } }).state.pers.qok === false);
check('parse leaves unnamed quality alone', parseChampion({ ...raw, pers: { ...raw.pers, qname: '' } }).state.pers.qok === undefined);
console.log(fail ? `${fail} FAILED` : 'ALL PASSED'); process.exit(fail ? 1 : 0);
