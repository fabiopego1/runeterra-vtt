# Runeterra Foundry System — Phase 0 Audit & Mapping

Status: **Phase 0 complete** (2026-10-04). Sources inspected:

- `D:\FoundryVTT\Data\systems\scrpg` — repaired SCRPG V11→V14 system (70 files, v1.5.5). **Untouched.**
- `D:\FoundryVTT\runeterra-work\runeterra-web` — clone of `fabiopego1/Runeterra` (the web app = rule/data source of truth).
- `D:\Downloads\Gorrakh.json` — golden test fixture (O Caixeiro Cítrico / Gorrakh).

---

## 1. SCRPG foundation: what it provides

### Architecture
- Legacy v1 `ActorSheet`/`ItemSheet` classes, no DataModels. `system.json` declares `compatibility: {minimum:"11", verified:"14"}`.
- Entry: `SCRPG.js` → `CONFIG.SCRPG` config, sheet registration, Handlebars helpers (`select`, `color`, `multiple`, `ifSetting`, ability-availability helper), 3 settings.
- **template.json** defines actor types `hero, villain, environment, scene, minion` and 14 item types (`power, quality, ability, villainStatus, environmentTwist, heroMinion, minionForm, mod, principles, backgrounds, powerSources, archetypes, personality, initiativeActor`).
- **dice.js** — the core mechanic: `TaskCheck` rolls `{d1,d2,d3}` as one Foundry dice pool, sorts the three `Die` terms descending → **Max/Mid/Min**; `SingleCheck` for one die; `ItemRoll` (no dice, chat card); `RollAllMinions`; `OutRoll`. Mods (bonus/penalty items) with persistent/exclusive semantics and a "you forgot a penalty" reminder.
- **status.js** — status die per zone: scene color overrides, else health-zone boundaries (`greenLow/yellowHigh/yellowLow/redHigh`).
- **scene.js + scene actor** — Scene Tracker (green 2 / yellow 4 / red 2 spaces), broadcasts scene color to all heroes, initiative = `initiativeActor` items with acted flags on the scene actor.
- Known SCRPG bugs we do NOT carry over: `backIssue`/`backIssues` binding mismatch, `minions.hbs` `actor.system.type` bug, `primaryTokenAttribute:"health"` pointing at an object, chart-only health boundaries (17–40), `Dialog.confirm` deprecation.

### V14 shims found in SCRPG (do not blindly copy)
`renderTemplate/loadTemplates ??=` shims (fine), re-implemented `#select` helper (fine), `ContextMenu.implementation` + `{jQuery:false}` (fine), `TextEditor.implementation.enrichHTML` (fine). Still-legacy: `Dialog.confirm`, `event.srcElement`, sync `super.getData()`. **Runeterra should use current APIs and avoid `Dialog.confirm`.**

### Generic (reuse) vs SCRPG-specific (replace)
- **Generic/reuse**: dice-pool Max/Mid/Min logic; mod item lifecycle; status-die-from-zone pattern; scene tracker state machine; generic item sheet; helpers; colored-dice chat.
- **SCRPG-specific (replace with Runeterra equivalents)**: entire template.json model (hero point grids, principles/twists, mode flags), health chart, config key sets, all templates' wording, English-only lang.

## 2. Runeterra (web app): rule/data source of truth

### Catalog (all in `js/data-tables.js`, `js/data-rules.js`, `js/data-lore.js`, `js/pt/*`)
| Catalog | Count | Key facts |
|---|---|---|
| BACKGROUNDS | 20 | `q.dice` (e.g. d10/d8/d6) → qualities `b0..b2` from `q.opts`; `psDice` passed to Source; `principle` = category; optional `mustInclude` |
| POWER_SOURCES | 20 | `opts` → powers `p0..p2`; `yellow` (2, usually `diff`), `green` (1) ability lists; `archDice` → `a0..a2`; extras: addTrait / training / alien / cosmos; `required` (powered-suit) |
| ARCHETYPES | 20 | `req.any` (mandatory trait, p.44 swap frees old die as `fa<i>` slot), `powers`/`quals` lists, `remPowers` (one/oneOrMore/any), `green` (2–3), `yellow` (1–2), `principle` = 2nd category; `healthAlt` (armored, robot); special: divided, modular, minion-maker, form-changer (+ robot extra) |
| PERSONALITIES | 20 | `status:[g,y,r]` = status dice; `out` text with one trait token (`pers.outTrait`); `extra:'impulsive'` upgrade; `healthAny` (mischievous) |
| ABILITIES | 299 | keyed by English canonical name; `type` A/R/I/A-I; text with `[token]` brackets; pt text via `I18N.text` map |
| PRINCIPLES | 64 | 5 categories; `{id,name,cat,rp,minor,major,type,ability}`; pt via PRINCIPLE_LORE + pt/principles.js |
| PEOPLES | 9 | flavor-only (+suggestions); vastaya, human, yordle, spirit, troll, minotaur, construct, plant, dragonkin |
| REGIONS | 14 | flavor-only; bilgewater … void; 2 locked by password |
| HEALTH_TABLE | 24–40→17 | max → `[greenLow, yellowHigh, yellowLow, redHigh]` |
| MINION_FORMS | 12 | `[name, text, bonusThreshold '+1'..'+4']` |
| DIVIDED / MODULAR | — | methods (4), after (Divided Psyche/Split Form); fixed Switch/Quick Switch/Emergency Switch + 1 green + 2 yellow + 1 red modes; optional Powerless Mode |
| TRAIT_CATEGORIES | 8 P: + 4 Q: | ~42 powers (incl. sig-weapon/sig-vehicle/invented) + 22 qualities + synthetic `rp-quality` (d8 Signature Quality) |

### Derived values (must be RECALCULATED, not trusted from cache)
- **Traits**: `T = {traitKey: dieSize}` accumulated from `bg.q.dice`→qualities, `bg.psDice`→powers, `ps.archDice`→arch (with p.44 swap freeing old die), source extras (robot d10, training d8 quality, cosmos up/down, alien), modular extra d6 powers (up to 2), `rp-quality` d8, impulsive +1 size.
- **Status dice**: straight from `PERSONALITIES[id].status = [green,yellow,red]`; Divided second Temperament → `status2`.
- **Health**: `max = 8 + max(red status die) + max(eligible trait die, else 4) + (roll result or fixed 4)`; eligible = best `P:athletic`/`Q:mental` trait (+`healthAlt` categories, or any trait if `healthAny`); zones from HEALTH_TABLE. Gorrakh: 8+10(d10 red)+10(vitality d10)+5 = 33 → Green 33–26 / Yellow 25–13 / Red 12–1. ✔ matches ficha.
- **Ability pools evaluated against the historical trait snapshot** at pick time (`R.before.<step>`), not the final sheet.

### Ability selection (`sel`)
Groups: `ps-yellow` (2, usually `diff`), `ps-green` (1), `arch-fixed` (auto), `arch-green` (2–3), `arch-yellow` (1–2, optional `fromGreen`/`notGreen`), form/divided/modular groups, `red` (exactly 2 Ultimates, category must hold a d6+ trait, `use` pins trait). Entry = `{name, ch:{token:value}, trait, trait2}` / red adds `{cat, use}`. Ability instance id (**iid**) formats:
- group: `"{gkey}:{Name}"` → `ps-green:Rally`
- ultimate: `"red:{cat}:{Name}"` → `red:P:hallmark:Ultimate Weaponry`
- principle: `pr:bg` / `pr:arch`; out: `out`

### Renames (two orthogonal maps — must survive import)
- `renames[iid] = customName` — e.g. `ps-green:Rally → "Punhado de Laranjas"`.
- `traitNames[traitKey] = customName` — e.g. `medicine → "Laranjas Mágicas"`.
- Display resolution: custom → (`rp-quality`: `pers.qname` when `qok`) → canonical pt name (`TRAIT.rt`) → id. Canonical id NEVER overwritten.

### evo / play / info
- `evo` = pure overlay applied at render (`traits` swaps, `principles` swaps, `abilities` swaps `{name,ch,trait}`, `log[]` per collection).
- `play` = `hp` (5 hero-point checkboxes), `rw` (16 reward checkboxes = 4 rows +1..+4), `issues`, `coll`, `cdone`, `current` (current HP as string, null = max), `notes` (10 lines).
- `info` = identity + physical + costume + notes(biography) + portrait (base64 data URI, ~700px JPEG).

### Website-only state (classify, don't import): `cid, updated, step, maxStep, tour, method, rolls, rerolls, unlocked, noRetcon, v` (keep `v`/`noRetcon` as import metadata only).

## 3. Mapping → Foundry implementation

### Concept map
| Runeterra (web) | SCRPG (Foundry) | Runeterra Foundry |
|---|---|---|
| Champion state JSON | hero actor | Actor type **champion** — `system.character` (definition) + `system.play` (mutable) + `system.derived` (computed) |
| traits `{key: die}` | power/quality items | `system.character.traits = {power:{key:die}, quality:{key:die}}` (authoritative) **plus** optional power/quality items for manual building |
| abilities `sel` + renames | ability items | **ability Items** (owned): `{iid, group, canonicalName, customName, type, zone, traits[], choices{}, gameText}` |
| principles | principles info item | `system.character` fields (bg/arch principle) + ability items `pr:bg`/`pr:arch` |
| status dice from personality | statusDie fields | `system.derived.status = {green,yellow,red}` (+status2) |
| health zones | health zone fields + 17–40 chart | `system.health = {max, greenLow, yellowHigh, yellowLow, redHigh, current}` computed from formula + HEALTH_TABLE data |
| scene tracker actor | scene actor | keep actor type **scene**, same tracker mechanics |
| villain / minion / environment | same | keep, with Runeterra terms (Vilão / Lacaio / Ambiente) |
| mods (persistent/exclusive) | mod items | keep item type **mod** |
| twists | environmentTwist | keep **twist** items (Runeterra GM screen has twists) |
| Out ability | out field | `system.character.pers.outTrait` + derived out text |
| roster / cid | — | Foundry actors; `cid` → import metadata only |

### Dice (preserve SCRPG mechanic)
`firstDie` (power) + `secondDie` (quality) + `thirdDie` (status) → combined `{d1,d2,d3}` pool → Max/Mid/Min; single checks; ability chat cards. Status die auto-follows current health zone (zone overrides scene, per web behavior: zone-of-current-HP; scene color integration kept from SCRPG). Port dice.js with V14-clean APIs; localize chat in pt-BR.

### Import adapter (Phase 7)
```
Runeterra web JSON (v1) ──► adapter (detect format, validate, map ids)
   ├─ format runeterra-foundry v1 (wrapper) or raw web state (both accepted)
   ├─ recalculate T/status/health from bg/ps/arch/pers/health (+extras) — same formulas as web
   ├─ create Champion actor: system.character (bg/ps/arch/pers/health/pch/sel/renames/traitNames/evo/info minus portrait)
   ├─ create owned ability Items from sel (canonical + custom names + zone + text)
   ├─ play state → system.play; portrait dataURI → extracted image asset → actor.img
   └─ all-or-nothing: pre-validate, report failures with field; never half-import
```

### Localization
`lang/pt-BR.json` (primary, complete) + `lang/en.json` (secondary). Data files embed BOTH canonical ids and pt-BR display names (same pattern as the web app: ids canonical, `rt` display). UI, chat, sheets, dialogs in pt-BR; player text never translated.

## 4. Decisions log
1. Actor types: `champion, villain, minion, environment, scene` (Runeterra terminology; minion ≠ SCRPG minion-storage — Runeterra minion = Minion Maker forms on champion + simple minion actor).
2. Traits live in actor system data as `{key: die}` maps (web model is authoritative); items used for abilities/mods/twists and for manual character building.
3. `system.derived` recomputed by a shared `rules.js` (ported formulas) on update/import — never trusted from imports.
4. Foundry-native combat tracker used for initiative (SCRPG's item-based initiative NOT carried; Runeterra has no special initiative rule).
5. Health chart embedded as data (HEALTH_TABLE port), formula-based, no 17–40 hard-coding in code.
6. The web app stays untouched except Phase 7's additive "Exportar para Foundry VTT" menu entry.

## 5. Open questions (defaults chosen; flag if wrong)
- Twists data source: port from web GM screen where readable (encrypted vault — will use SCRPG twist structure with Runeterra labels).
- Compendium packs for the 299 abilities / catalog: generate as compendium packs from data files (nice-to-have after core works).
