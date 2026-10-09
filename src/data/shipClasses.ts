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
    cargoBonus: 25,
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
    cargoBonus: 30,
    hullBonus: 30,
    fuelBonus: 25,
    description: 'Forward-swept gull-wing interceptor engineered for hyper-agile banking.',
  },
  {
    tier: 4,
    name: 'Corsair Skiff',
    category: 'CORVETTE',
    cost: 2400,
    cargoBonus: 35,
    hullBonus: 40,
    fuelBonus: 30,
    description: 'Asymmetric outrigger raider equipped with reinforced port-side armor.',
  },
  {
    tier: 5,
    name: 'Hammerhead Gunship',
    category: 'CORVETTE',
    cost: 3400,
    cargoBonus: 40,
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
    cargoBonus: 45,
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
    cargoBonus: 50,
    hullBonus: 70,
    fuelBonus: 45,
    description: 'Faceted hexagonal stealth hull with minimal radar cross-section.',
  },
  {
    tier: 8,
    name: 'Centurion Catamaran',
    category: 'FRIGATE',
    cost: 7800,
    cargoBonus: 55,
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
    cargoBonus: 60,
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
    cargoBonus: 65,
    hullBonus: 110,
    fuelBonus: 60,
    description: 'Triple-prow trident dreadnought with recessed torpedo missile launch tubes.',
    unlockedPerks: ['Escort Wing Hangar (Max 4 Escorts)', 'Expanded Torpedo Magazine'],
  },
  {
    tier: 11,
    name: 'Gorgon Assault Cruiser',
    category: 'CRUISER',
    cost: 16000,
    cargoBonus: 70,
    hullBonus: 130,
    fuelBonus: 70,
    description: 'Octagonal armored fortress hull with flared forward deflector shields.',
  },
  {
    tier: 12,
    name: 'Phoenix Strike Cruiser',
    category: 'CRUISER',
    cost: 20000,
    cargoBonus: 75,
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
    cargoBonus: 80,
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
    cargoBonus: 85,
    hullBonus: 210,
    fuelBonus: 100,
    description: 'Monolithic stepped obsidian dagger hull with glowing plasma channels.',
    unlockedPerks: ['Reduced EMP Cooldown (5s)', 'High-Capacity Torpedo Magazine'],
  },
  {
    tier: 15,
    name: 'Leviathan Flagship',
    category: 'BATTLESHIP',
    cost: 40000,
    cargoBonus: 90,
    hullBonus: 250,
    fuelBonus: 120,
    description: 'Segmented capital flagship with command citadel and expansive cargo decks.',
  },
  {
    tier: 16,
    name: 'Solar Apex Colossus',
    category: 'COLOSSUS',
    cost: 50000,
    cargoBonus: 95,
    hullBonus: 300,
    fuelBonus: 150,
    description: 'The pinnacle of naval engineering: dual ring resonance arrays and supreme firepower.',
    unlockedPerks: ['Colossus Overcharge Shield Matrix', 'Colossus Apex Armada (Max 8 Escorts)'],
  },
  {
    tier: 17,
    name: 'Hyperion Fleet Carrier',
    category: 'CARRIER',
    cost: 65000,
    cargoBonus: 100,
    hullBonus: 360,
    fuelBonus: 180,
    description: 'Elongated capital carrier featuring dual angled runway flight decks, runway arrestor lights, and dedicated fighter launch bays.',
    unlockedPerks: ['Fleet Carrier Strike Wing (Max 10 Escorts)', 'Expanded Torpedo Flight Bay'],
  },
  {
    tier: 18,
    name: 'Archon Supercarrier',
    category: 'CARRIER',
    cost: 82000,
    cargoBonus: 105,
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
    cargoBonus: 110,
    hullBonus: 520,
    fuelBonus: 250,
    description: 'Heavy elongated warship hybrid with armored ram prow, spinal torpedo magazine, and dual lateral hangar decks.',
    unlockedPerks: ['Dread-Carrier Armada (Max 14 Escorts)', 'Spinal Heavy Torpedo Bay'],
  },
  {
    tier: 20,
    name: 'Astral Leviathan Titan',
    category: 'COLOSSUS',
    cost: 135000,
    cargoBonus: 115,
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
    cargoBonus: 120,
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
    cargoBonus: 125,
    hullBonus: 900,
    fuelBonus: 450,
    description: 'The ultimate apex naval starship in known space. An elongated cosmic supercarrier commanding an unstoppable armada.',
    unlockedPerks: ['Infinity Apex Armada (Max 20 Escorts)', 'Supreme Command Spire Matrix'],
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
    const cargoBonus = 50;
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

export function getMaxTorpedoesForTier(tier: number): number {
  if (tier < 2) return 5;
  // Starting at Tier 2 (base 5): fast early growth, then tapers off smoothly
  // T2: 5, T3: 10 (+5), T4: 12 (+2), T5: 14 (+2), T6: 15 (+1), T10: 19, T20: 26, T50: 40, T100: 50
  return Math.min(50, Math.round(5 + 5 * Math.sqrt(tier - 2)));
}

export function getBaseCargoForTier(tier: number): number {
  let cargo = 30;
  const maxT = Math.max(1, Math.min(SHIP_CLASSES.length, Math.round(tier)));
  for (let t = 2; t <= maxT; t++) {
    cargo += getShipClass(t).cargoBonus;
  }
  return cargo;
}

export function getMaxEscortsForTier(tier: number): number {
  if (tier >= 100) return 50;
  if (tier >= 90) return 42;
  if (tier >= 80) return 36;
  if (tier >= 70) return 32;
  if (tier >= 60) return 28;
  if (tier >= 50) return 24;
  if (tier >= 40) return 20;
  if (tier >= 30) return 16;
  if (tier >= 20) return 12;
  if (tier >= 15) return 10;
  if (tier >= 10) return 8;
  if (tier >= 8) return 6;
  if (tier >= 6) return 4;
  if (tier >= 4) return 3;
  if (tier >= 2) return 2;
  return 1; // Tier 1 starts with 1 wingman escort slot!
}

// Full 10 Escort Ship Classes Catalog (Specialties start at 3rd escort, skipping at least 1 slot)
export const ESCORT_CLASSES: EscortClassDefinition[] = [
  {
    type: 'FIGHTER',
    name: 'Viper Interceptor',
    minShipTier: 6,
    cost: 450,
    hull: 140,
    shield: 90,
    fireCooldown: 0.22,
    damage: 28,
    color: '#34D399',
    description: 'Agile dual-cannon dogfighter that swarms hostiles and intercepts incoming fire.',
    perks: 'Rapid-fire dual pulse lasers',
  },
  {
    type: 'GUNSHIP',
    name: 'Corsair Heavy Gunship',
    minShipTier: 12,
    cost: 850,
    hull: 240,
    shield: 160,
    fireCooldown: 0.3,
    damage: 52,
    color: '#FBBF24',
    description: 'Armored heavy gunship with twin plasma cannons and reinforced composite shielding.',
    perks: 'Armor-piercing heavy plasma',
  },
  {
    type: 'MINING_BARGE',
    name: 'Orion Auto-Mining Barge',
    minShipTier: 20,
    cost: 1800,
    hull: 420,
    shield: 280,
    fireCooldown: 0.2,
    damage: 20,
    color: '#06B6D4',
    description: 'Autonomous mining industrial barge. Automatically fires mining laser beams at nearby asteroids and pulls mined minerals into cargo!',
    perks: 'Auto-mines nearby asteroids & salvages ore',
    isSpecialty: true,
    specialtyRole: 'AUTO-MINING INDUSTRIAL',
  },
  {
    type: 'FRIGATE',
    name: 'Vanguard Heavy Frigate',
    minShipTier: 30,
    cost: 3500,
    hull: 620,
    shield: 420,
    fireCooldown: 0.36,
    damage: 125,
    color: '#38BDF8',
    description: 'Long-range combat frigate with twin plasma batteries and point-defense flak arrays.',
    perks: 'Twin plasma batteries & flak screen',
  },
  {
    type: 'MISSILE_CRUISER',
    name: 'Arsenal Missile Cruiser',
    minShipTier: 40,
    cost: 6500,
    hull: 920,
    shield: 620,
    fireCooldown: 3.5,
    damage: 220,
    color: '#F97316',
    description: 'Heavy artillery cruiser equipped with endless photon torpedo missile launch bays that fire homing salvos at enemies.',
    perks: 'Endless photon torpedo missile salvos',
    isSpecialty: true,
    specialtyRole: 'HEAVY ARTILLERY MISSILES',
  },
  {
    type: 'DESTROYER',
    name: 'Aegis Fleet Destroyer',
    minShipTier: 50,
    cost: 12000,
    hull: 1400,
    shield: 950,
    fireCooldown: 0.32,
    damage: 260,
    color: '#A855F7',
    description: 'High-durability fleet destroyer armed with dual heavy plasma lances and reactive armor decks.',
    perks: 'Dual heavy plasma lances, massive HP',
  },
  {
    type: 'SHIELD_PROJECTOR',
    name: 'Bastion Shield Dome Cruiser',
    minShipTier: 60,
    cost: 22000,
    hull: 1800,
    shield: 2200,
    fireCooldown: 0.5,
    damage: 45,
    color: '#00F0FF',
    description: 'Defensive command cruiser that projects a 130px spherical deflector energy dome, vaporizing all enemy incoming projectiles to protect armada.',
    perks: 'Projects wide 130px kinetic deflector shield bubble',
    isSpecialty: true,
    specialtyRole: 'FLEET SHIELD PROJECTOR',
  },
  {
    type: 'BATTLECRUISER',
    name: 'Trident Battlecruiser',
    minShipTier: 70,
    cost: 40000,
    hull: 2900,
    shield: 2200,
    fireCooldown: 0.25,
    damage: 520,
    color: '#EC4899',
    description: 'Heavy battlecruiser with continuous beam lance arrays and triple heavy batteries.',
    perks: 'Continuous beam lance arrays',
  },
  {
    type: 'REPAIR_TENDER',
    name: 'Nanite Repair Tender',
    minShipTier: 80,
    cost: 75000,
    hull: 3600,
    shield: 2800,
    fireCooldown: 2.5,
    damage: 30,
    color: '#10B981',
    description: 'Utility cruiser equipped with harmonic nanite emitters that pulse repair waves, constantly restoring Hull and Shields for player and fleet.',
    perks: 'Pulses nanite repair waves (+15 Hull, +20 Shield/pulse)',
    isSpecialty: true,
    specialtyRole: 'NANITE FLEET REPAIR',
  },
  {
    type: 'RONIN_WARMASTER',
    name: 'Apex Ronin Warmaster',
    minShipTier: 90,
    cost: 140000,
    hull: 6800,
    shield: 5200,
    fireCooldown: 0.18,
    damage: 1100,
    color: '#FFDD00',
    description: 'The supreme flagship escort: an unstoppable titan of war with multi-cannons and fleet command aura.',
    perks: 'Supreme flagship command aura, 1100 DPS',
  },
];

export function getEscortClass(type: EscortType): EscortClassDefinition {
  return ESCORT_CLASSES.find((e) => e.type === type) || ESCORT_CLASSES[0];
}
