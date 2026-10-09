// Runeterra flavour layer: trait names, regions, glossary, principle notes.
// Every Runeterra name keeps a pointer to the Sentinels Comics RPG term it stands for,
// so the hover text can explain what it means mechanically.

window.DICE_INFO = {
  d4: { power: 'Barely there', quality: 'Untrained', status: '—', note: 'The smallest die. Normally only appears through penalties, Modular modes, or when you have no power/quality to use (e.g. Health uses d4 if you lack an Athletic power or Mental quality).' },
  d6: { power: 'Above average', quality: 'Solid competency', status: 'Wavering' },
  d8: { power: 'Impressive', quality: 'Skilled', status: 'Steady' },
  d10: { power: 'Exceptional', quality: 'Expert', status: 'Driven' },
  d12: { power: 'Godlike — the stuff of Ascended and Aspects', quality: 'World class', status: 'Ready to give anything' }
};

window.TRAIT_CATEGORIES = {
  // ---------------- POWERS ----------------
  'P:athletic': { kind: 'power', sc: 'Athletic', rt: 'Body & Prowess', health: true,
    note: 'Raw physical capability beyond the ordinary. Counts toward starting Health.',
    items: [
      ['agility', 'Agility', 'Agility', 'Your reflexes are honed.', 'Akali flipping between shrouds; Nilah\'s whip-water footwork.'],
      ['speed', 'Speed', 'Swiftness', 'You\'re quick on your feet.', 'Master Yi\'s Highlander rush; Zeri\'s sparking sprints.'],
      ['strength', 'Strength', 'Might', 'You\'re strong and have no problem lifting.', 'Sion\'s juggernaut charge; Braum lifting a door-shield like a tray.'],
      ['vitality', 'Vitality', 'Vitality', 'You\'re in good shape and good health. At high levels you may even regenerate.', 'Dr. Mundo shrugging off anything; Warwick\'s blood-driven healing.']
    ] },
  'P:elemental': { kind: 'power', sc: 'Elemental/Energy', rt: 'Elements & Energies',
    note: 'Command over an element or energy type. Many abilities ask you to name one ([energy/element]).',
    items: [
      ['cold', 'Cold', 'Frost & True Ice', 'You can lower the temperature dramatically and shape ice to your whim.', 'Lissandra\'s True Ice; Ashe\'s frost arrows; Anivia\'s glacial storm.'],
      ['cosmic', 'Cosmic', 'Celestial Power', 'The primal energies of the universe itself are yours to command.', 'Aurelion Sol\'s starforge; the Aspects of Targon; Zoe\'s twinkling mischief.'],
      ['electricity', 'Electricity', 'Lightning', 'You command the lightning.', 'Zeri\'s spark-rifle; Kennen\'s thundering shuriken; Volibear\'s stormclaws.'],
      ['fire', 'Fire', 'Flame', 'You can make everything burn.', 'Brand\'s rune-fire; Annie and Tibbers; Shyvana\'s dragonfire.'],
      ['infernal', 'Infernal', 'Shadow & Black Mist', 'You command dark, corrupting energies of the underworld.', 'The Black Mist of the Shadow Isles; Morgana\'s shadow magic; Evelynn\'s demonic essence.'],
      ['nuclear', 'Nuclear', 'Raw Hextech Energy', 'You channel raw, volatile power and radiation.', 'Unstable Hextech crystals; Viktor\'s death ray; the glow of a cracked core.'],
      ['radiant', 'Radiant', 'Light', 'Holy light is at your fingertips, ready to purge evil.', 'Lux\'s prismatic light; Leona\'s solar flare; Senna\'s relic light against the Mist.'],
      ['sonic', 'Sonic', 'Song & Sound', 'Focused waves of sound, destructive or mimicking.', 'Sona\'s etwahl; Seraphine\'s voice; Kog\'Maw\'s... noises.'],
      ['water', 'Water', 'Water & Tides', 'You command water, from a single drop to the force of the tides.', 'Nami\'s tidal waves; Illaoi\'s sea-god tentacles; Nautilus dragging his anchor through the depths.'],
      ['weather', 'Weather', 'Storm & Wind', 'You control weather, storms and winds.', 'Janna\'s tempests; Yasuo\'s wind technique; Volibear\'s thunder.']
    ] },
  'P:hallmark': { kind: 'power', sc: 'Hallmark', rt: 'Signature Gear',
    note: 'Items or powers that are yours alone. Rename them on your sheet (e.g. "Hextech Rifle", "Rhaast", "Valor").',
    items: [
      ['sig-vehicle', 'Signature Vehicle', 'Signature Mount / Vehicle', 'A custom vehicle nearly always on hand. Rename it to whatever it is.', 'Corki\'s Valkyrie, Quinn\'s eagle Valor, Sejuani\'s war-boar Bristle, Rell\'s horse.'],
      ['sig-weapon', 'Signature Weaponry', 'Signature Weapon', 'A weapon that is almost a part of you. Rename it to whatever it is.', 'Caitlyn\'s Hextech rifle, Garen\'s sword, Jhin\'s Whisper, a Darkin blade.'],
      ['invented', 'Invented Power', 'Custom Power (GM approval)', 'A power not covered by the list, added with your GM\'s permission.', 'Bard\'s chimes, Aphelios\'s moon-weapons — anything unique.']
    ] },
  'P:intellectual': { kind: 'power', sc: 'Intellectual', rt: 'Mind & Senses',
    items: [
      ['awareness', 'Awareness', 'Keen Senses', 'Enhanced senses: danger sense, superior sight and hearing.', 'Rengar\'s hunter senses; Kindred\'s eye for the dying.'],
      ['deduction', 'Deduction', 'Deduction', 'Your mind makes leaps of logic by analysing details.', 'Caitlyn solving a Piltover case from a single bootprint.'],
      ['intuition', 'Intuition', 'Intuition', 'Strong gut feelings that frequently prove correct.', 'A Kinkou\'s sense of imbalance; Ashe reading the Freljord.'],
      ['lightning-calculator', 'Lightning Calculator', 'Calculating Mind', 'Intense mathematics in the blink of an eye.', 'Heimerdinger\'s instant trajectories; Orianna\'s clockwork precision.'],
      ['presence', 'Presence', 'Commanding Presence', 'You project your personality strongly over those you meet.', 'Swain\'s gaze; Azir\'s imperial bearing.']
    ] },
  'P:materials': { kind: 'power', sc: 'Materials', rt: 'Matter & Earth',
    items: [
      ['metal', 'Metal', 'Metalshaping', 'You command and shape metals.', 'Mordekaiser\'s iron; Ornn\'s forge-craft.'],
      ['plants', 'Plants', 'Verdant Growth', 'Plants respond to your thoughts and grow as you see fit.', 'Zyra\'s thorns; Ivern\'s friends; Maokai\'s saplings.'],
      ['stone', 'Stone', 'Earthshaping', 'You shape stone to build and destroy.', 'Taliyah\'s woven stone; Malphite\'s very self; Qiyana\'s rock.'],
      ['toxic', 'Toxic', 'Toxins & Chemtech', 'You manipulate toxic substances and poison gases.', 'Singed\'s chemtrail; Twitch\'s plague; Zaun\'s Gray.'],
      ['transmutation', 'Transmutation', 'Transmutation', 'You transform non-living materials from one type to another.', 'Shuriman sand-to-stone; Zilean\'s ageing of objects.']
    ] },
  'P:mobility': { kind: 'power', sc: 'Mobility', rt: 'Movement',
    items: [
      ['flight', 'Flight', 'Flight', 'You can fly.', 'Kayle\'s wings; Aurelion Sol riding the heavens.'],
      ['leaping', 'Leaping', 'Leaping', 'You leap through the air with ease.', 'Tristana\'s rocket jump; Rengar\'s pounce.'],
      ['momentum', 'Momentum', 'Momentum', 'You build momentum as you move and channel it effectively.', 'Rammus\'s Powerball; Hecarim\'s onslaught.'],
      ['swimming', 'Swimming', 'Swimming', 'At home in water (at d10+ you can breathe underwater).', 'Nami of the Marai; Fizz in the Bilgewater bay.'],
      ['swinging', 'Swinging', 'Grapple & Swing', 'Via ropes or devices you swing across the city.', 'Camille\'s Hookshot; Jinx swinging through the Undercity.'],
      ['teleportation', 'Teleportation', 'Blink & Portal', 'Disappear and reappear elsewhere; bigger dice mean more range and control.', 'Ezreal\'s Arcane Shift; Kassadin\'s Riftwalk; Twisted Fate\'s Destiny.'],
      ['wall-crawling', 'Wall-Crawling', 'Climbing', 'You stick to walls and travel across them quickly.', 'Elise the spider; Kha\'Zix skittering over ruins.']
    ] },
  'P:psychic': { kind: 'power', sc: 'Psychic', rt: 'Mind Magic',
    items: [
      ['animal-control', 'Animal Control', 'Beast Speech', 'You talk to and command non-sapient animals.', 'Nidalee\'s bond with the jungle; Ivern\'s critters.'],
      ['illusions', 'Illusions', 'Illusions', 'You weave convincing mental images.', 'LeBlanc\'s mirror images; Neeko\'s disguises; Shaco\'s hallucination.'],
      ['postcognition', 'Postcognition', 'Echoes of the Past', 'You see visions of what happened to a person, place or object.', 'Reading the memories left in Shuriman ruins.'],
      ['precognition', 'Precognition', 'Foresight', 'You glimpse a potential future.', 'Karma\'s visions; Targonian prophecy.'],
      ['remote-viewing', 'Remote Viewing', 'Far-Sight', 'You project your senses to another place.', 'A Kinkou spirit-walk; Kindred watching from afar.'],
      ['suggestion', 'Suggestion', 'Charm & Compulsion', 'You influence minds to act on your will.', 'Ahri\'s Charm; Evelynn\'s allure.'],
      ['telekinesis', 'Telekinesis', 'Telekinesis', 'You move things with your mind.', 'Syndra\'s Dark Spheres; Irelia\'s floating blades.'],
      ['telepathy', 'Telepathy', 'Mindspeech', 'You send thoughts and read minds.', 'Tahm Kench whispering bargains; Malzahar\'s Void whispers.']
    ] },
  'P:selfcontrol': { kind: 'power', sc: 'Self Control', rt: 'Body Magic',
    items: [
      ['absorption', 'Absorption', 'Absorption', 'You absorb energy sent at you and channel it into other forms.', 'Kassadin\'s Null Sphere; Sylas stealing spells.'],
      ['density-control', 'Density Control', 'Density Control', 'Become denser to resist harm, or lighter to float.', 'Galio\'s petricite hardening; Malphite\'s granite shield.'],
      ['duplication', 'Duplication', 'Duplication', 'You make copies of yourself.', 'Zed\'s living shadows; Wukong\'s decoy; LeBlanc\'s mimic.'],
      ['elasticity', 'Elasticity', 'Elasticity', 'You can stretch your entire body.', 'Zac, the Secret Weapon, bouncing across Zaun.'],
      ['intangibility', 'Intangibility', 'Phasing', 'You pass through solid objects.', 'Spirits of the Shadow Isles; Nocturne gliding through walls.'],
      ['invisibility', 'Invisibility', 'Camouflage', 'You make yourself unseen.', 'Teemo\'s Guerrilla Warfare; Kha\'Zix\'s Void camouflage; Twitch.'],
      ['part-detachment', 'Part Detachment', 'Part Detachment', 'You can give someone a hand. Literally.', 'Blitzcrank\'s Rocket Grab; Nautilus\'s anchor, sort of.'],
      ['shapeshifting', 'Shapeshifting', 'Shapeshifting', 'Change into forms of roughly the same size.', 'Nidalee\'s cougar; Neeko\'s mimicry; Elise\'s spider form.'],
      ['size-changing', 'Size-Changing', 'Size-Changing', 'Grow to a giant or shrink to insect-sized.', 'Gnar to Mega Gnar; Cho\'Gath feasting; Lulu\'s Wild Growth.']
    ] },
  'P:technological': { kind: 'power', sc: 'Technological', rt: 'Hextech & Chemtech',
    items: [
      ['gadgets', 'Gadgets', 'Hextech Gadgets', 'A variety of useful tools, generally built by someone else.', 'Caitlyn\'s yordle-snap traps; a Piltover Warden\'s kit.'],
      ['inventions', 'Inventions', 'Inventions', 'You invent your own tools and carry some at all times.', 'Ekko\'s Z-Drive; Ziggs\'s satchel charges.'],
      ['power-suit', 'Power Suit', 'Hextech Rig', 'A technological suit with many built-in functions.', 'Rumble\'s mech Tristy; Viktor\'s augmented frame.'],
      ['robotics', 'Robotics', 'Constructs & Turrets', 'You build your own robot servitors.', 'Heimerdinger\'s H-28G turrets; Orianna\'s Ball.']
    ] },
  // ---------------- QUALITIES ----------------
  'Q:information': { kind: 'quality', sc: 'Information', rt: 'Knowledge',
    items: [
      ['underworld', 'Criminal Underworld Info', 'Underworld Contacts', 'You know a guy who knows a guy — fences, smugglers, chem-barons.', 'Bilgewater\'s docks; Zaun\'s chem-dens; the Black Rose\'s whispers.'],
      ['deep-space', 'Deep Space Knowledge', 'Celestial Lore', 'Knowledge of the heavens and beings beyond the world.', 'Targonian star-lore; the Celestials and their constellations.'],
      ['history', 'History', 'History', 'Deep knowledge of historical facts from around the world.', 'The Rune Wars, the fall of Shurima, the Ruination.'],
      ['magical-lore', 'Magical Lore', 'Arcane Lore', 'Occult tomes and the details of the mystical and arcane.', 'World Runes, Darkin lore, Ionian spirit magic.'],
      ['medicine', 'Medicine', 'Medicine', 'Training in treating illness and injury.', 'Zaunite surgery; Ionian herbalism; Soraka\'s healing.'],
      ['otherworldly-mythos', 'Otherworldly Mythos', 'Spirit & Void Mythos', 'Strange knowledge from gazing into other realms.', 'The Spirit Realm, the Void beneath Icathia, the Shadow Isles.'],
      ['science', 'Science', 'Natural Philosophy', 'Physical sciences such as physics, biology and chemistry.', 'Piltover Academy theory; Zaunite chemistry.'],
      ['technology', 'Technology', 'Hextech Engineering', 'Expertise in engineering and machines.', 'Hextech crystals, chemtech engines, clockwork.']
    ] },
  'Q:mental': { kind: 'quality', sc: 'Mental', rt: 'Will & Wits', health: true,
    note: 'Counts toward starting Health.',
    items: [
      ['alertness', 'Alertness', 'Alertness', 'Your senses are trained to be alert at all times.', 'A Freljordian scout on the ice.'],
      ['conviction', 'Conviction', 'Conviction', 'A cause or faith drives you to great heights.', 'Solari zeal; Demacian ideals; Illaoi\'s faith in Nagakabouros.'],
      ['creativity', 'Creativity', 'Creativity', 'You are practised in a creative field.', 'Seraphine\'s songs; Jhin\'s... art.'],
      ['investigation', 'Investigation', 'Investigation', 'Evidence collection, forensics, deduction in the field.', 'Caitlyn and the Piltover Wardens.'],
      ['self-discipline', 'Self-Discipline', 'Self-Discipline', 'Meditation and honed willpower give you mastery of your emotions.', 'Shen\'s Kinkou balance; Master Yi\'s Wuju focus.']
    ] },
  'Q:physical': { kind: 'quality', sc: 'Physical', rt: 'Combat & Craft',
    items: [
      ['acrobatics', 'Acrobatics', 'Acrobatics', 'Gymnastic and aerial manoeuvres.', 'Nilah\'s dancing; Xayah\'s feather-flips.'],
      ['close-combat', 'Close Combat', 'Melee Combat', 'Fighting up close — blades, martial arts, or fists.', 'Fiora\'s riposte; Lee Sin\'s kicks; Vi\'s gauntlets.'],
      ['finesse', 'Finesse', 'Finesse', 'Precise hands: defusing a bomb, picking a pocket.', 'A Zaunite pickpocket; a Piltover clockmaker.'],
      ['fitness', 'Fitness', 'Endurance', 'Top physical shape; you run for miles without tiring.', 'A Noxian legionnaire on a forced march.'],
      ['ranged-combat', 'Ranged Combat', 'Ranged Combat', 'Attacking from afar — guns, bows, thrown blades.', 'Ashe\'s bow; Miss Fortune\'s pistols; Katarina\'s daggers.'],
      ['stealth', 'Stealth', 'Stealth', 'Sneaking in any environment.', 'Akali in the smoke; Talon on the rooftops.']
    ] },
  'Q:social': { kind: 'quality', sc: 'Social', rt: 'Presence & Charm',
    items: [
      ['banter', 'Banter', 'Banter', 'A gift for gab that annoys enemies (and friends).', 'Ezreal\'s quips; Gnar\'s... gnar.'],
      ['imposing', 'Imposing', 'Imposing', 'You know how to be intimidating.', 'Darius\'s glare; Mordekaiser\'s voice.'],
      ['insight', 'Insight', 'Insight', 'Reading people and what they hide.', 'Swain\'s demonic eye; Karma\'s wisdom.'],
      ['leadership', 'Leadership', 'Leadership', 'Leading and directing allies effectively.', 'Jarvan IV rallying Demacia; Sejuani\'s Winter\'s Claw.'],
      ['persuasion', 'Persuasion', 'Persuasion', 'Convincing others it\'s in their interest.', 'Renata Glasc\'s deals; Twisted Fate\'s cons.']
    ] }
};

window.GLOSSARY = {
  'Attack': 'Basic action: deal damage equal to your effect die to a target. <em>Runeterra:</em> a Noxian axe swing, a burst of Rune-fire.',
  'Defend': 'Basic action: reduce damage from an incoming Attack by your effect die. <em>Runeterra:</em> Braum\'s Unbreakable, a petricite ward.',
  'Overcome': 'Basic action: deal with an obstacle or challenge in the scene (a collapsing ruin, a locked Hextech vault). Your total determines how well it goes.',
  'Boost': 'Basic action: create a <b>bonus</b> (+1 to +4 depending on the effect die) that you or an ally can add to a later roll. <em>Runeterra:</em> Janna\'s Eye of the Storm, Lulu\'s whimsy.',
  'Hinder': 'Basic action: create a <b>penalty</b> (-1 to -4) on a target\'s rolls. <em>Runeterra:</em> Ashe\'s frost, Morgana\'s binding.',
  'Recover': 'Regain Health up to your maximum. <em>Runeterra:</em> Soraka\'s starcall, a swig of Zaunite stim.',
  'Min die': 'Roll your pool (power + quality + status), sort the dice by result: the lowest is the <b>Min</b>, the middle the <b>Mid</b>, the highest the <b>Max</b>. Normal basic actions use the Mid die as the "effect".',
  'Mid die': 'The middle result of your three-die pool. Basic actions use it by default.',
  'Max die': 'The highest result of your three-die pool. Abilities that "use your Max die" are much stronger than a basic action.',
  'Max+Mid+Min': 'Add all three dice together — the most powerful possible effect, usually reserved for Red abilities.',
  'Max+Mid': 'Add your Max and Mid results together for the effect.',
  'Max+Min': 'Add your Max and Min results together for the effect.',
  'Mid+Min': 'Add your Mid and Min results together for the effect.',
  'persistent': 'A persistent bonus/penalty isn\'t used up after one roll — it stays until removed or the scene ends.',
  'exclusive': 'An exclusive bonus can only be used by you (not handed to allies).',
  'irreducible': 'Irreducible damage can\'t be lowered by Defend or damage reduction.',
  'bonus': 'A modifier (+1 to +4) created by Boost, added to a later roll.',
  'penalty': 'A modifier (-1 to -4) created by Hinder, subtracted from a target\'s rolls.',
  'minion': 'Weak enemies (or allies) represented by a single die. When hit, they roll to "save"; a failed save removes them and a success shrinks their die.',
  'lieutenant': 'A tougher enemy than a minion, but not a full villain.',
  'Green zone': 'Your status at high Health: you roll your Green status die and can use Green abilities. <em>Runeterra:</em> fresh into the fight.',
  'Yellow zone': 'Mid Health: you roll your Yellow status die and unlock Yellow abilities (plus Green).',
  'Red zone': 'Low Health: you roll your Red status die and unlock your most powerful Red abilities. Heroes are at their best when desperate.',
  'status die': 'The third die in your pool, set by your personality and your current zone (Green/Yellow/Red).',
  'minor twist': 'A complication with limited consequences — the GM may use your principle\'s Minor Twist question.',
  'major twist': 'A story-defining complication — the GM may use your principle\'s Major Twist question.',
  'twist': 'A narrative complication the GM introduces, often inspired by your principles.',
  'hero point': 'A resource earned mainly from principles; spend it to reroll, add a bonus, or otherwise bend the scene in your favour.',
  'Reaction': 'An ability that triggers outside your turn in response to something. Normally one Reaction per turn.',
  'doubles': 'When two dice in your pool show the same number. Some abilities trigger extra effects (good or bad) on doubles.',
  'nearby': 'Within the same general area of the scene — close enough to reach quickly.',
  'close': 'Right next to the target, within arm\'s reach.',
  'scene': 'A single encounter or situation, like a comic-book page spread: a fight on Piltover\'s bridges, a negotiation in Noxus.',
  'collection': 'A multi-issue story arc. Your hero advances at the end of collections.',
  'Health': 'Your hit points. Dropping through them moves you from the Green to Yellow to Red zone. At 0 you are incapacitated (and can use your Out ability).',
  'environment': 'The scene itself, which acts on its own turn (a sandstorm in Shurima, the Black Mist rolling in).'
};

window.ABILITY_TYPES = {
  A: 'Action — used on your turn instead of a basic action.',
  R: 'Reaction — triggers in response to something, even outside your turn (normally once per turn).',
  I: 'Inherent — always on; no roll or action required.',
  'A/I': 'Both an Action and an Inherent effect.'
};

window.COLOR_INFO = {
  green: 'Green abilities are usable in any zone. Most heroes have several: from power source, archetype and both principles.',
  yellow: 'Yellow abilities unlock once you drop into the Yellow (or Red) zone — you get stronger as the fight turns against you.',
  red: 'Red abilities unlock only in the Red zone. They are your ultimates: desperate, dramatic, decisive.',
  out: 'Your Out ability is used when you are incapacitated (0 Health): even knocked out you can still help your team once per round.'
};

window.PRINCIPLE_CATEGORIES = {
  Esoteric: 'Something strange and otherworldly defines you — destiny, magic, the undead, the stars.',
  Expertise: 'You are good at something — a skill or talent you\'ve internalised, which also points to what worries you.',
  Ideals: 'What you believe in and fight for.',
  Identity: 'How you present yourself and who you are on the outside.',
  Responsibility: 'The weight of your life outside the fight — family, a guild, a debt, a mask.'
};

// Runeterra re-flavour for each principle id (name shown in the builder + a hint).
window.PRINCIPLE_LORE = {
  'destiny': ['Principle of Destiny', 'Prophecy follows you like the Aspects follow the chosen. Great for Targon or Shurima.'],
  'energy-element': ['Principle of [Element]', 'Name your element: Frost (True Ice), Flame, Light, Storm... You live and breathe it.'],
  'exorcism': ['Principle of the Mist-Hunter', 'You sense the Black Mist, spirits and Void-taint — a Sentinel of Light\'s instinct.'],
  'fauna': ['Principle of the Beast', 'The wild creatures of Ionia, the Freljord or Ixtal know you as kin.'],
  'flora': ['Principle of the Wild Growth', 'Ivern\'s gift: every root and bloom answers you.'],
  'future': ['Principle of the Future', 'Visions of futures yet to be — Zilean\'s burden, Karma\'s dream.'],
  'immortality': ['Principle of the Undying', 'Ascended, darkin, or spirit — you don\'t age, and mundane ailments don\'t touch you.'],
  'inner-demon': ['Principle of the Darkness Within', 'A Darkin voice, a Void hunger, a demon of the Shadow Isles — held down, for now.'],
  'magic': ['Principle of the Arcane', 'You feel the flow of magic everywhere — the hum of Runes, the currents of the Spirit Realm.'],
  'sea': ['Principle of the Deep', 'Nagakabouros\'s chosen, Marai-born, or Bilgewater salt: the sea is home.'],
  'space': ['Principle of the Summit', 'You endure the killing heights of Mount Targon and the void between the stars.'],
  'time-traveler': ['Principle of the Bygone Age', 'You are from another era — imperial Shurima, the Rune Wars, or a future not yet written.'],
  'undead': ['Principle of the Black Mist', 'Dead but not gone — a revenant of the Ruination.'],
  'clockwork': ['Principle of Clockwork', 'Piltovan precision: you see how every gear should turn.'],
  'gearhead': ['Principle of the Tinkerer', 'You can tell what\'s wrong with any machine, from a music box to a Hexgate.'],
  'history': ['Principle of Lore', 'Archives, ruins, forgotten tongues: you know the story of Runeterra.'],
  'indestructible': ['Principle of the Indestructible', 'Swords bounce off you like hail off Galio.'],
  'lab': ['Principle of the Workshop', 'A lab in Piltover, a chem-den in Zaun, a tower in the Freljord — your sanctum.'],
  'mastery': ['Principle of Mastery', 'You have studied your own gift the way Ryze studies the Runes.'],
  'mentor': ['Principle of the Mentor', 'You teach the next generation, like Shen, Karma or Master Yi.'],
  'powerless': ['Principle of the Unpowered', 'No magic, all grit — a Mageseeker or Warden who knows how to beat mages.'],
  'science': ['Principle of Natural Philosophy', 'Academy theory and Zaunite chemistry at your fingertips.'],
  'speed': ['Principle of Speed', 'Faster than the Noxian messenger ravens.'],
  'stealth': ['Principle of Stealth', 'Every Kinkou and Black Rose door is open to you.'],
  'strength': ['Principle of Strength', 'Sion-level brute force; you never roll for mundane feats of strength.'],
  'tactician': ['Principle of the Tactician', 'Jarvan\'s war-tables, Swain\'s schemes: always a plan and a backup plan.'],
  'whispers': ['Principle of Whispers', 'A voice no one else hears — a Darkin weapon, a Void murmur, a dead ancestor.'],
  'chaos': ['Principle of Chaos', 'Jinx-grade unpredictability.'],
  'compassion': ['Principle of Compassion', 'Soraka weeps for every wound.'],
  'defender': ['Principle of the Defender', 'Braum\'s door, Taric\'s shield — you put yourself in harm\'s way.'],
  'dependence': ['Principle of Dependence', 'You need something: a Hextech heart, a relic, shimmer...'],
  'equality': ['Principle of Equality', 'For the undercity, for the mageborn, for the downtrodden.'],
  'great-power': ['Principle of Great Power', 'Your magic scares even you — Lux\'s blinding light, Syndra\'s spheres.'],
  'hero': ['Principle of the Champion', 'You have a calling to protect others.'],
  'honor': ['Principle of Honor', 'Demacian codes, Ionian vows, Freljordian oaths.'],
  'justice': ['Principle of Justice', 'Always aware of injustice and who committed it.'],
  'liberty': ['Principle of Liberty', 'Sylas\'s chains broken; no mind can hold you.'],
  'order': ['Principle of Order', 'Noxian discipline or Demacian law — you keep your head in chaos.'],
  'self-preservation': ['Principle of Self Preservation', 'Survive first. Heroics second.'],
  'zealot': ['Principle of the Zealot', 'Solari fire, faith in the Mother Serpent, belief in the Glorious Evolution.'],
  'ambition': ['Principle of Ambition', 'Noxus rewards the strong — and you intend to rise.'],
  'amnesia': ['Principle of Amnesia', 'Your past is lost to you, and others struggle to track you.'],
  'detachment': ['Principle of Detachment', 'Kinkou calm, Aspect-like distance.'],
  'discovery': ['Principle of Discovery', 'Ezreal\'s wanderlust; Heimerdinger\'s eureka.'],
  'loner': ['Principle of the Loner', 'Best at what you do when nobody\'s watching.'],
  'nomad': ['Principle of the Nomad', 'Shuriman caravans, wandering ronin, Bard\'s endless journeys.'],
  'peace': ['Principle of Peace', 'Ionian balance: violence is rarely the answer.'],
  'rage': ['Principle of Rage', 'Tryndamere\'s fury, Renekton\'s madness — aimed at the right target.'],
  'split': ['Principle of the Split', 'Two souls, two views: Kayn and Rhaast bickering in one head.'],
  'savagery': ['Principle of Savagery', 'Freljordian wilds and Ixtali jungle — civilisation doesn\'t fit.'],
  'levity': ['Principle of Levity', 'Jokes in the face of the Ruination.'],
  'spotless-mind': ['Principle of the Spotless Mind', 'Grudges slide off you like water off a Marai scale.'],
  'business': ['Principle of Business', 'A Piltover trading house, a Bilgewater tavern, a Zaunite chem-empire.'],
  'debtor': ['Principle of the Debtor', 'You owe Tahm Kench, a chem-baron, or worse.'],
  'detective': ['Principle of the Detective', 'You always know when something\'s being hidden.'],
  'double-agent': ['Principle of the Double Agent', 'The Black Rose, the Kinkou, the Mageseekers — you serve two masters.'],
  'everyman': ['Principle of the Everyman', 'Just a regular person in way over your head.'],
  'family': ['Principle of Family', 'Great Houses, clans and tribes — family comes first.'],
  'mask': ['Principle of the Mask', 'A hidden mage in Demacia must never be discovered.'],
  'sidekick': ['Principle of the Sidekick', 'Always where the trouble is — Ekko\'s crew, Jinx\'s tagalong.'],
  'team': ['Principle of the Warband', 'You hold an official rank: Piltover Wardens, Dauntless Vanguard, Winter\'s Claw.'],
  'underworld': ['Principle of the Underworld', 'Contacts in every Bilgewater dive and Zaunite chem-den.'],
  'veteran': ['Principle of the Veteran', 'The Ionian invasion, the Rune Wars, the Ruination: you\'ve seen war.'],
  'youth': ['Principle of Youth', 'Young, bright, and underestimated — like Zoe, Lulu or a young yordle.']
};

window.REGIONS = [
  // Descriptions come from the campaign's lore notes (see the Lore panel for the full text).
  { id: 'bilgewater', name: 'Bilgewater', tag: 'Where fortunes are made and ambitions shattered in the blink of an eye.', color: '#3e8eab',
    lore: 'A haven for smugglers, raiders and the unscrupulous. For those fleeing justice, debt or persecution, it is a city of new beginnings — no one on its winding streets cares about your past. Almost anything can be bought here, but at dawn the unwary are found floating in the harbour.',
    champs: 'Miss Fortune, Gangplank, Graves, Twisted Fate, Pyke, Illaoi, Nautilus, Nilah',
    bg: ['criminal', 'struggling', 'performer', 'adventurer'], ps: ['cursed', 'training', 'relic'], pr: ['sea', 'underworld', 'debtor', 'chaos'] },
  { id: 'bandle', name: 'Bandle City', tag: 'The timeless home of the yordles, beyond the material realm.', color: '#e58fd0',
    lore: 'A land of unbridled magic reached through unseen paths. Every sensation is heightened, the sunlight is eternally golden — or so the storytellers say, though none agree on what they saw. Mortals who return often seem to have aged greatly; many never return at all.',
    champs: 'Teemo, Tristana, Lulu, Veigar, Poppy, Corki, Ziggs, Rumble, Gnar, Kennen, Yuumi',
    bg: ['otherworldly', 'performer', 'adventurer', 'academic'], ps: ['extradimensional', 'genius', 'mystical'], pr: ['chaos', 'levity', 'youth', 'sidekick'] },
  { id: 'demacia', name: 'Demacia', tag: 'Justice, honour and duty — a proud kingdom in turmoil.', color: '#c8b27a',
    lore: 'A strong, lawful kingdom with a prestigious military history, built on petricite, a white stone that dampens magic. Increasingly insular, torn by the Mage Rebellion and a disputed succession, Demacia may not survive its own rigidity — and all the petricite in the land will not protect it from itself.',
    champs: 'Garen, Lux, Jarvan IV, Sylas, Fiora, Galio, Quinn, Poppy',
    bg: ['upper-class', 'military', 'law', 'dynasty'], ps: ['training', 'genetic', 'relic'], pr: ['honor', 'justice', 'mask', 'order', 'hero'] },
  { id: 'shadow-isles', name: 'The Shadow Isles', tag: 'A once-beautiful realm, shrouded forever by the Black Mist.', color: '#4fd1b8',
    lore: 'Shattered by a magical cataclysm, the isles are wrapped in a Black Mist that drains the life of all who dwell there. Those who perish in the Mist haunt the land for eternity, and its power grows every year, reaching out to reap souls across Runeterra.',
    champs: 'Thresh, Kalista, Hecarim, Viego, Yorick, Karthus, Gwen, Senna, Vex',
    bg: ['tragic', 'otherworldly', 'former-villain', 'anachronistic'], ps: ['supernatural', 'cursed'], pr: ['undead', 'exorcism', 'inner-demon', 'whispers'] },
  { id: 'ionia', name: 'Ionia', tag: 'The First Lands — unspoiled beauty and natural magic.', color: '#d77da0',
    lore: 'A spiritual people living in harmony and balance across a vast archipelago, with many (often conflicting) orders and sects. Neutral for centuries until the Noxian invasion, Ionia now faces militarisation, vigilantism and a rising hunger for darker arts.',
    champs: 'Ahri, Yasuo, Irelia, Karma, Shen, Zed, Master Yi, Lee Sin, Xayah, Sett',
    bg: ['otherworldly', 'exile', 'tragic', 'academic'], ps: ['training', 'nature', 'extradimensional'], pr: ['peace', 'compassion', 'detachment', 'fauna', 'flora'] },
  { id: 'ixtal', name: 'Ixtal', tag: 'Masters of elemental magic, hidden deep in the jungle.', color: '#6fb04c',
    lore: 'An ancient culture of the great westward diaspora that survived the Void and the Darkin by withdrawing behind the wild jungle. From the arcology-city of Ixaocan, the Ixtali regard every other faction as usurpers and keep intruders at bay with powerful magic.',
    champs: 'Qiyana, Milio, Nidalee, Zyra, Neeko, Rengar, Malphite, Skarner',
    bg: ['dynasty', 'upper-class', 'otherworldly', 'adventurer'], ps: ['nature', 'genetic', 'mystical'], pr: ['flora', 'fauna', 'energy-element', 'great-power'] },
  { id: 'nazumah', name: 'Nazumah', tag: 'Free hunters of giant beasts, who threw off the warrior-gods.', color: '#e07a3f',
    lore: 'A land of valiant warriors and monster hunters that celebrates the freedom it won from the "warrior-gods". A melting pot of peoples who fled the Darkin War, with markets where Shurima\'s finest goods are traded — and where cheating a Nazumite merchant can get you banished. Nazumites will help any "sibling of the sands" escape servitude.',
    champs: 'K\'Sante',
    bg: ['military', 'adventurer', 'struggling', 'exile'], ps: ['training', 'relic', 'nature'], pr: ['liberty', 'equality', 'business', 'savagery'] },
  { id: 'freljord', name: 'The Freljord', tag: 'A harsh land of born warriors — and the only home of True Ice.', color: '#7fb7d9',
    lore: 'Proud, fiercely independent tribes with a strong raiding culture are being drawn into a civil war between three factions: one honours old traditions, one follows a young idealist\'s dream of unity, and one worships an enigmatic power.',
    champs: 'Ashe, Sejuani, Lissandra, Braum, Tryndamere, Olaf, Anivia, Ornn, Volibear, Udyr, Trundle',
    bg: ['military', 'dynasty', 'exile', 'otherworldly'], ps: ['nature', 'higher-power', 'relic'], pr: ['fauna', 'rage', 'savagery', 'energy-element', 'family'] },
  { id: 'noxus', name: 'Noxus', tag: 'A fearsome empire where strength — in any form — is everything.', color: '#b6453c',
    lore: 'Brutal and expansionist to outsiders, yet unusually inclusive within: anyone can rise to power and respect if they prove their aptitude, regardless of birth, homeland or wealth.',
    champs: 'Darius, Draven, Katarina, Swain, LeBlanc, Riven, Sion, Samira',
    bg: ['military', 'criminal', 'upper-class', 'former-villain'], ps: ['training', 'cursed', 'mystical'], pr: ['ambition', 'great-power', 'order', 'rage'] },
  { id: 'piltover', name: 'Piltover', tag: 'The City of Progress.', color: '#d9a441',
    lore: 'A thriving, progressive city and Valoran\'s cultural centre, powered by commerce and visionary thinking rather than armies. Its sea gates bring the world\'s goods, and its merchant clans fund art, architecture and esoteric hextech research.',
    champs: 'Caitlyn, Jayce, Heimerdinger, Vi, Ezreal, Camille, Orianna, Seraphine',
    bg: ['academic', 'upper-class', 'law', 'performer'], ps: ['genius', 'powered-suit', 'tech-upgrades'], pr: ['discovery', 'science', 'gearhead', 'business', 'lab'] },
  { id: 'zaun', name: 'Zaun', tag: 'The City of Iron and Glass.', color: '#3fb58f',
    lore: 'A vast underground district in the canyons beneath Piltover, living in perpetual smoky twilight. Vibrant and rich in culture, it welcomes the dangerous research Piltover forbids — and pays for it with pollution and rivers of toxic sludge.',
    champs: 'Jinx, Ekko, Viktor, Warwick, Singed, Twitch, Zeri, Blitzcrank, Renata Glasc',
    bg: ['struggling', 'criminal', 'medical', 'created'], ps: ['experimentation', 'radiation', 'tech-upgrades', 'genius'], pr: ['liberty', 'equality', 'underworld', 'gearhead', 'levity'] },
  { id: 'shurima', name: 'Shurima', tag: 'A fallen desert empire — whose capital has risen again.', color: '#e0b04a',
    lore: 'Once a thriving civilisation, its glorious capital became myth after the fall. Nomads scratch out a living around oases, treasure-hunt among ruins or sell their swords — and now whispers from the heart of the desert say the capital has risen.',
    champs: 'Azir, Nasus, Renekton, Sivir, Taliyah, Xerath, Amumu, Rammus, Akshan',
    bg: ['anachronistic', 'dynasty', 'adventurer', 'struggling'], ps: ['higher-power', 'relic', 'genetic'], pr: ['history', 'destiny', 'immortality', 'time-traveler', 'nomad'] },
  { id: 'targon', name: 'Targon', tag: 'The highest peak in Runeterra — a gateway to the Celestial Realm.', color: '#8e8cf0',
    lore: 'A beacon for dreamers, madmen and adventurers. The few who survive the climb find a sky of glittering celestial bodies, and return haunted and hollow — or transformed beyond recognition.',
    champs: 'Leona, Diana, Pantheon, Taric, Aphelios, Zoe, Aurelion Sol, Soraka',
    bg: ['interstellar', 'exile', 'military', 'academic'], ps: ['cosmos', 'higher-power'], pr: ['destiny', 'zealot', 'space', 'defender'] },
  { id: 'void', name: 'The Void', tag: 'The Realm of Nothing, hungering beyond the Material Realm.', color: '#a066d6',
    lore: 'A force of insatiable hunger, waiting for its masters, the Watchers, to mark the final moment of destruction. To be touched by it is to glimpse eternal unreality — enough to break even the strongest mind.',
    champs: 'Kai\'Sa, Kassadin, Malzahar, Cho\'Gath, Kha\'Zix, Bel\'Veth, Vel\'Koz, Rek\'Sai',
    bg: ['exile', 'tragic', 'interstellar', 'blank-slate'], ps: ['alien', 'extradimensional', 'unknown'], pr: ['inner-demon', 'exorcism', 'self-preservation', 'savagery'] }
];

window.STEP_INTROS = {
  region: 'Pick the land that shaped your champion. This is pure Runeterra flavour — it has <b>no Sentinels mechanics</b>, but each region highlights Origins, Sources and Principles that fit it.',
  background: 'Your <b>Origin</b> is where your champion came from before they became a legend. <span class="sc">Sentinels: <b>Step 1 – Background</b>. Gives you qualities, one principle, and the dice for your Power Source.</span>',
  powersource: 'Your <b>Source of Power</b> is what changed you and what fuels your abilities. <span class="sc">Sentinels: <b>Step 2 – Power Source</b>. Assign the dice from your Background to powers, gain Yellow and Green abilities, and get the dice for your Path.</span>',
  archetype: 'Your <b>Path</b> is how you fight and what role you play in a team. <span class="sc">Sentinels: <b>Step 3 – Archetype</b>. Assign the dice from your Power Source to powers/qualities, gain Green (and Yellow) abilities and your second principle.</span>',
  personality: 'Your <b>Temperament</b> is how you react under pressure. <span class="sc">Sentinels: <b>Step 4 – Personality</b>. Sets your Green/Yellow/Red status dice, your Out ability, and a d8 custom "roleplaying quality".</span>',
  red: 'Choose two <b>Ultimate techniques</b> — what you unleash when everything is on the line. <span class="sc">Sentinels: <b>Step 5 – Red Abilities</b>. Choose two from categories where you have a power or quality at d6 or higher.</span>',
  retcon: 'A <b>Twist of Fate</b> lets you tweak your legend before it begins. <span class="sc">Sentinels: <b>Step 6 – Retcon</b>. Take exactly one option.</span>',
  health: 'How much punishment can you take? <span class="sc">Sentinels: <b>Step 7 – Health</b>. 8 + max of Red status die + max of one Athletic power or Mental quality (d4 if none) + d8 roll (or 4).</span>',
  finish: 'Name your champion, describe them, and give your abilities proper Runeterran names. <span class="sc">Sentinels: <b>Step 8 – Finishing Touches</b>.</span>'
};
