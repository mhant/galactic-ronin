import { ShipClassDefinition, EscortClassDefinition, EscortType } from '../types/game';

// Base named classes for early progression
const BASE_SHIP_CLASSES: ShipClassDefinition[] = [
  {
    tier: 1,
    name: 'Ronin Dart',
    category: 'SCOUT',
    cost: 0,
    cargoBonus: 0,
    hullBonus: 0,
    fuelBonus: 0,
    description: 'Sleek, lightweight needle interceptor. Agile in dogfights with minimal mass.',
  },
  {
    tier: 2,
    name: 'Viper Strikecraft',
    category: 'SCOUT',
    cost: 950,
    cargoBonus: 15,
    hullBonus: 25,
    fuelBonus: 20,
    description: 'Twin-pronged strike fighter favored by outer-rim mercenaries.',
    unlockedPerks: ['Equips Photon Torpedo Launcher (+5 Torpedoes)'],
  },
  {
    tier: 3,
    name: 'Kestrel Interceptor',
    category: 'SCOUT',
    cost: 1600,
    cargoBonus: 15,
    hullBonus: 30,
    fuelBonus: 25,
    description: 'Forward-swept gull-wing interceptor engineered for hyper-agile banking.',
  },
  {
    tier: 4,
    name: 'Corsair Skiff',
    category: 'CORVETTE',
    cost: 2400,
    cargoBonus: 20,
    hullBonus: 40,
    fuelBonus: 30,
    description: 'Asymmetric outrigger raider equipped with reinforced port-side armor.',
  },
  {
    tier: 5,
    name: 'Hammerhead Gunship',
    category: 'CORVETTE',
    cost: 3400,
    cargoBonus: 25,
    hullBonus: 50,
    fuelBonus: 35,
    description: 'Heavy armored T-crossbar hammerhead prow with reinforced frontal plating.',
    unlockedPerks: ['Equips Auto Point-Defense Flak Turret'],
  },
  {
    tier: 6,
    name: 'Valkyrie Heavy Frigate',
    category: 'FRIGATE',
    cost: 4600,
    cargoBonus: 30,
    hullBonus: 60,
    fuelBonus: 40,
    description: 'Swept diamond multi-engine frigate built for deep-space escort operations.',
    unlockedPerks: ['Escort Wing Hangar (Viper Fighter Unlocked)'],
  },
  {
    tier: 7,
    name: 'Spectre Stealth Blade',
    category: 'FRIGATE',
    cost: 6000,
    cargoBonus: 30,
    hullBonus: 70,
    fuelBonus: 45,
    description: 'Faceted hexagonal stealth hull with minimal radar cross-section.',
  },
  {
    tier: 8,
    name: 'Centurion Catamaran',
    category: 'FRIGATE',
    cost: 7800,
    cargoBonus: 35,
    hullBonus: 80,
    fuelBonus: 50,
    description: 'Dual-hulled heavy gunboat with central command bridge and dual thrusters.',
    unlockedPerks: ['Equips EMP Shockwave Generator', 'Escort Wing Hangar (Max 3 Escorts)'],
  },
  {
    tier: 9,
    name: 'Aegis Destroyer',
    category: 'CRUISER',
    cost: 10000,
    cargoBonus: 40,
    hullBonus: 95,
    fuelBonus: 55,
    description: 'Stepped wedge hull with reinforced prow decks and broadside battery mounts.',
    unlockedPerks: ['Auto-Targeting Phaser Beam Lance Mount'],
  },
  {
    tier: 10,
    name: 'Trident Battlecruiser',
    category: 'CRUISER',
    cost: 12800,
    cargoBonus: 45,
    hullBonus: 110,
    fuelBonus: 60,
    description: 'Triple-prow trident dreadnought with recessed torpedo missile launch tubes.',
    unlockedPerks: ['Expands Torpedo Capacity to 15', 'Escort Wing Hangar (Max 4 Escorts)'],
  },
  {
    tier: 11,
    name: 'Gorgon Assault Cruiser',
    category: 'CRUISER',
    cost: 16000,
    cargoBonus: 50,
    hullBonus: 130,
    fuelBonus: 70,
    description: 'Octagonal armored fortress hull with flared forward deflector shields.',
  },
  {
    tier: 12,
    name: 'Phoenix Strike Cruiser',
    category: 'CRUISER',
    cost: 20000,
    cargoBonus: 55,
    hullBonus: 150,
    fuelBonus: 80,
    description: 'Predatory raptor-wing cruiser with triple heavy thruster cluster.',
    unlockedPerks: ['Corsair Heavy Gunship Escort Unlocked'],
  },
  {
    tier: 13,
    name: 'Titan Heavy Battleship',
    category: 'BATTLESHIP',
    cost: 25000,
    cargoBonus: 60,
    hullBonus: 180,
    fuelBonus: 90,
    description: 'Massive wedge battleship with multiple reinforced composite armor decks.',
    unlockedPerks: ['Battleship Escort Armada (Max 6 Escorts)'],
  },
  {
    tier: 14,
    name: 'Obsidian Dreadnought',
    category: 'BATTLESHIP',
    cost: 32000,
    cargoBonus: 70,
    hullBonus: 210,
    fuelBonus: 100,
    description: 'Monolithic stepped obsidian dagger hull with glowing plasma channels.',
    unlockedPerks: ['Expands Torpedo Capacity to 25', 'Reduced EMP Cooldown (5s)'],
  },
  {
    tier: 15,
    name: 'Leviathan Flagship',
    category: 'BATTLESHIP',
    cost: 40000,
    cargoBonus: 80,
    hullBonus: 250,
    fuelBonus: 120,
    description: 'Segmented capital flagship with command citadel and expansive cargo decks.',
  },
  {
    tier: 16,
    name: 'Solar Apex Colossus',
    category: 'COLOSSUS',
    cost: 50000,
    cargoBonus: 100,
    hullBonus: 300,
    fuelBonus: 150,
    description: 'The pinnacle of naval engineering: dual ring resonance arrays and supreme firepower.',
    unlockedPerks: ['Max Torpedoes 30', 'Colossus Overcharge Shield Matrix', 'Colossus Apex Armada (Max 8 Escorts)'],
  },
  {
    tier: 17,
    name: 'Hyperion Fleet Carrier',
    category: 'CARRIER',
    cost: 65000,
    cargoBonus: 120,
    hullBonus: 360,
    fuelBonus: 180,
    description: 'Elongated capital carrier featuring dual angled runway flight decks, runway arrestor lights, and dedicated fighter launch bays.',
    unlockedPerks: ['Fleet Carrier Strike Wing (Max 10 Escorts)', 'Expanded Torpedo Bay (35 Torpedoes)'],
  },
  {
    tier: 18,
    name: 'Archon Supercarrier',
    category: 'CARRIER',
    cost: 82000,
    cargoBonus: 140,
    hullBonus: 430,
    fuelBonus: 210,
    description: 'Massive elongated supercarrier with triple catapult flight runways, reinforced hangar bulwarks, and broadside defense arrays.',
    unlockedPerks: ['Supercarrier Strike Wing (Max 12 Escorts)', 'Automated Hangar Repair Systems'],
  },
  {
    tier: 19,
    name: 'Sovereign Dread-Carrier',
    category: 'CARRIER',
    cost: 105000,
    cargoBonus: 165,
    hullBonus: 520,
    fuelBonus: 250,
    description: 'Heavy elongated warship hybrid with armored ram prow, spinal torpedo magazine, and dual lateral hangar decks.',
    unlockedPerks: ['Dread-Carrier Armada (Max 14 Escorts)', 'Max Torpedoes 40'],
  },
  {
    tier: 20,
    name: 'Astral Leviathan Titan',
    category: 'COLOSSUS',
    cost: 135000,
    cargoBonus: 190,
    hullBonus: 620,
    fuelBonus: 300,
    description: 'Monolithic elongated star titan spanning kilometers, equipped with central spinal rail trenches and multi-squadron carrier bays.',
    unlockedPerks: ['Titan Battle Armada (Max 16 Escorts)', 'Aegis Missile Frigate Escort Unlocked'],
  },
  {
    tier: 21,
    name: 'Chronos World-Engine',
    category: 'COLOSSUS',
    cost: 175000,
    cargoBonus: 220,
    hullBonus: 740,
    fuelBonus: 360,
    description: 'Elongated celestial ark flanked by quantum resonance rings, designed to command entire planetary fleets.',
    unlockedPerks: ['World-Engine Fleet (Max 18 Escorts)', 'Singularity Shield Emitters'],
  },
  {
    tier: 22,
    name: 'Ouroboros Infinity Flagship',
    category: 'COLOSSUS',
    cost: 230000,
    cargoBonus: 260,
    hullBonus: 900,
    fuelBonus: 450,
    description: 'The ultimate apex naval starship in known space. An elongated cosmic supercarrier commanding an unstoppable armada.',
    unlockedPerks: ['Infinity Apex Armada (Max 20 Escorts)', 'Max Torpedoes 50', 'Supreme Command Spire Matrix'],
  },
];

// Procedural generator to extend all 100 Tiers
function generateFullShipClassCatalog(): ShipClassDefinition[] {
  const list: ShipClassDefinition[] = [...BASE_SHIP_CLASSES];

  const TITLES = [
    'Nemesis Dreadnought', 'Vanguard Star-Cruiser', 'Apex Leviathan', 'Singularity Siege-Barge',
    'Eclipse Battle-Ark', 'Nova Dread-Carrier', 'Titan Overlord', 'Hyperion Fortress',
    'Aegis World-Ender', 'Void Sovereign', 'Celestial Warmaster', 'Cosmic Dread-Fortress',
    'Infinity Citadel', 'Archon Star-Colossus', 'Valhalla Super-Flagship', 'Nebula Oblivion',
    'Galactic Ronin Star-King', 'Tachyon Emperor', 'Dark-Matter Sovereign', 'Omega Apex Master'
  ];

  for (let t = 23; t <= 100; t++) {
    const titleIdx = (t - 23) % TITLES.length;
    const cycle = Math.floor((t - 23) / TITLES.length) + 1;
    const titleName = cycle > 1 ? `${TITLES[titleIdx]} MK-${cycle}` : TITLES[titleIdx];

    const category: ShipClassDefinition['category'] =
      t >= 80 ? 'COLOSSUS' : t >= 60 ? 'CARRIER' : t >= 40 ? 'BATTLESHIP' : 'CRUISER';

    // Exponential but balanced credit cost curve
    const cost = Math.round(230000 * Math.pow(1.075, t - 22));
    const cargoBonus = 260 + (t - 22) * 18;
    const hullBonus = 900 + (t - 22) * 75;
    const fuelBonus = 450 + (t - 22) * 35;

    const perks: string[] = [];
    if (t % 10 === 0) {
      perks.push(`Armada Expansion (Max ${Math.min(30, 20 + Math.floor((t - 20) / 5))} Escorts)`);
      if (t === 30) perks.push('Vanguard Heavy Destroyer Escort Unlocked');
      if (t === 40) perks.push('Eclipse Battlecruiser Escort Unlocked');
      if (t === 50) perks.push('Chimera Dreadnought Escort Unlocked');
      if (t === 60) perks.push('Archon Carrier Escort Unlocked');
      if (t === 70) perks.push('Sovereign Star-Barge Escort Unlocked');
      if (t === 80) perks.push('Void-Weaver Super-Capital Escort Unlocked');
      if (t === 90) perks.push('Apex Ronin Warmaster Escort Unlocked');
      if (t === 100) perks.push('✨ Supreme Cosmic Hegemony Unlocked (+100% All Stats)');
    }

    list.push({
      tier: t,
      name: `${titleName} [T${t}]`,
      category,
      cost,
      cargoBonus,
      hullBonus,
      fuelBonus,
      description: `Tier ${t} super-capital star fortress with high-density armor plating and quantum reactor lattice.`,
      unlockedPerks: perks.length > 0 ? perks : undefined,
    });
  }

  return list;
}

export const SHIP_CLASSES: ShipClassDefinition[] = generateFullShipClassCatalog();

export function getShipClass(tier: number): ShipClassDefinition {
  const index = Math.max(1, Math.min(SHIP_CLASSES.length, Math.round(tier))) - 1;
  return SHIP_CLASSES[index] || SHIP_CLASSES[0];
}

export function getMaxEscortsForTier(tier: number): number {
  if (tier >= 90) return 30;
  if (tier >= 80) return 26;
  if (tier >= 70) return 24;
  if (tier >= 60) return 22;
  if (tier >= 50) return 20;
  if (tier >= 40) return 18;
  if (tier >= 30) return 16;
  if (tier >= 22) return 14;
  if (tier >= 16) return 10;
  if (tier >= 13) return 8;
  if (tier >= 10) return 6;
  if (tier >= 8) return 4;
  if (tier >= 6) return 2;
  return 0;
}

// Full 10 Escort Ship Classes Catalog
export const ESCORT_CLASSES: EscortClassDefinition[] = [
  {
    type: 'FIGHTER',
    name: 'Viper Interceptor',
    minShipTier: 6,
    cost: 450,
    hull: 120,
    shield: 80,
    fireCooldown: 0.22,
    damage: 28,
    color: '#34D399',
    description: 'Agile dual-cannon dogfighter that swarms hostiles and intercepts incoming fire.',
    perks: 'High speed, rapid fire',
  },
  {
    type: 'GUNSHIP',
    name: 'Corsair Heavy Gunship',
    minShipTier: 12,
    cost: 850,
    hull: 220,
    shield: 140,
    fireCooldown: 0.3,
    damage: 48,
    color: '#FBBF24',
    description: 'Armored heavy gunship with twin plasma cannons and reinforced composite shielding.',
    perks: 'Armor piercing plasma',
  },
  {
    type: 'FRIGATE',
    name: 'Aegis Missile Frigate',
    minShipTier: 20,
    cost: 1800,
    hull: 380,
    shield: 240,
    fireCooldown: 0.45,
    damage: 85,
    color: '#38BDF8',
    description: 'Long-range missile frigate equipped with guided micro-torpedoes and flak point-defense.',
    perks: 'Long-range missile battery',
  },
  {
    type: 'DESTROYER',
    name: 'Vanguard Heavy Destroyer',
    minShipTier: 30,
    cost: 3500,
    hull: 580,
    shield: 380,
    fireCooldown: 0.38,
    damage: 130,
    color: '#F97316',
    description: 'High-durability fleet destroyer armed with dual heavy plasma lances and reactive armor.',
    perks: 'Dual heavy lances, high HP',
  },
  {
    type: 'BATTLECRUISER',
    name: 'Eclipse Battlecruiser',
    minShipTier: 40,
    cost: 6500,
    hull: 880,
    shield: 580,
    fireCooldown: 0.35,
    damage: 190,
    color: '#C084FC',
    description: 'Heavy battlecruiser with continuous beam lance arrays and fleet shield projectors.',
    perks: 'Continuous beam lances',
  },
  {
    type: 'DREADNOUGHT',
    name: 'Chimera Dreadnought Escort',
    minShipTier: 50,
    cost: 12000,
    hull: 1300,
    shield: 900,
    fireCooldown: 0.32,
    damage: 280,
    color: '#EF4444',
    description: 'Massive capital dreadnought featuring quad heavy batteries and broadside flak walls.',
    perks: 'Quad plasma batteries',
  },
  {
    type: 'CARRIER',
    name: 'Archon Carrier Escort',
    minShipTier: 60,
    cost: 22000,
    hull: 1900,
    shield: 1400,
    fireCooldown: 0.28,
    damage: 380,
    color: '#00F0FF',
    description: 'Capital escort carrier that deploys autonomous defense drones and flak barriers.',
    perks: 'Micro-drone swarm support',
  },
  {
    type: 'SOVEREIGN',
    name: 'Sovereign Star-Barge',
    minShipTier: 70,
    cost: 40000,
    hull: 2800,
    shield: 2100,
    fireCooldown: 0.25,
    damage: 540,
    color: '#A855F7',
    description: 'Titan-class siege barge armed with high-yield antimatter cannons and heavy shields.',
    perks: 'Antimatter siege cannons',
  },
  {
    type: 'VOID_WEAVER',
    name: 'Void-Weaver Super-Capital',
    minShipTier: 80,
    cost: 75000,
    hull: 4200,
    shield: 3200,
    fireCooldown: 0.22,
    damage: 750,
    color: '#EC4899',
    description: 'Cosmic void dreadnought with singularity tractor fields and reality-shredding lances.',
    perks: 'Singularity void lances',
  },
  {
    type: 'RONIN_WARMASTER',
    name: 'Apex Ronin Warmaster',
    minShipTier: 90,
    cost: 140000,
    hull: 6500,
    shield: 5000,
    fireCooldown: 0.18,
    damage: 1100,
    color: '#FFDD00',
    description: 'The supreme flagship escort: an unstoppable titan of war commanding the entire fleet.',
    perks: 'Supreme flagship aura, 1100 DPS',
  },
];

export function getEscortClass(type: EscortType): EscortClassDefinition {
  return ESCORT_CLASSES.find((e) => e.type === type) || ESCORT_CLASSES[0];
}
