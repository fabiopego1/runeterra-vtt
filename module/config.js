// Runeterra Foundry — CONFIG.RUNETERRA lookup tables (labels come from localization).
// Game-content catalogs (traits, abilities, backgrounds, …) live in module/data/catalog.js,
// backed by the dataset reused from the Runeterra web app.

export const RUNETERRA = {
  dieTypes: ['d4', 'd6', 'd8', 'd10', 'd12'],

  // Health zone / scene colors.
  scenes: ['green', 'yellow', 'red'],

  // Ability timing types (Ação / Reação / Inerente).
  abilityType: {
    A: { label: 'RUNETERRA.AbilityAction', tooltip: 'RUNETERRA.AbilityActionTooltip' },
    R: { label: 'RUNETERRA.AbilityReaction', tooltip: 'RUNETERRA.AbilityReactionTooltip' },
    I: { label: 'RUNETERRA.AbilityInherent', tooltip: 'RUNETERRA.AbilityInherentTooltip' }
  },

  // Basic actions (icons on ability rows).
  actionType: {
    all: 'RUNETERRA.ActionAll',
    attack: 'RUNETERRA.ActionAttack',
    defend: 'RUNETERRA.ActionDefend',
    overcome: 'RUNETERRA.ActionOvercome',
    boost: 'RUNETERRA.ActionBoost',
    hinder: 'RUNETERRA.ActionHinder',
    recover: 'RUNETERRA.ActionRecover'
  },

  // Twist types for environments (Gestores de Cena).
  twistType: {
    greenminor: { label: 'RUNETERRA.TwistGreenMinor', color: 'green' },
    greenmajor: { label: 'RUNETERRA.TwistGreenMajor', color: 'green' },
    yellowminor: { label: 'RUNETERRA.TwistYellowMinor', color: 'yellow' },
    yellowmajor: { label: 'RUNETERRA.TwistYellowMajor', color: 'yellow' },
    redminor: { label: 'RUNETERRA.TwistRedMinor', color: 'red' },
    redmajor: { label: 'RUNETERRA.TwistRedMajor', color: 'red' }
  },

  // Mod (bônus/penalidade) magnitudes.
  mod: [-4, -3, -2, -1, 1, 2, 3, 4],

  // Minion form bonus thresholds (Fabricante de Lacaios).
  bonus: {
    one: 'RUNETERRA.BonusOne',
    two: 'RUNETERRA.BonusTwo',
    three: 'RUNETERRA.BonusThree',
    four: 'RUNETERRA.BonusFour'
  }
};
