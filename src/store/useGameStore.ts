import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Enemy,
  FloatingLoot,
  GameState,
  GameMode,
  InventoryItem,
  MarketItem,
  PlayerStats,
  PointOfInterest,
  Projectile,
  DefenseDrone,
  ReconDrone,
  ShipStats,
  Station,
  Asteroid,
  EscortShip,
  EscortStance,
  EscortType,
  Mission,
  StoryChapter,
} from '../types/game';
import { generateSector, generateClusterCell } from '../data/sectorGenerator';
import { generateStationMarket, getStationMineralPrice } from '../data/economy';
import { SoundManager } from '../audio/SoundManager';
import { SHIP_CLASSES, getShipClass, getEscortClass, getMaxEscortsForTier } from '../data/shipClasses';
import { getMineral, getRandomMineralForSector } from '../data/minerals';
import { generateStationMissions } from '../data/missions';
import { saveToSlot, loadFromSlot } from '../data/saveSlots';
import { getStoryChapterForEvent } from '../data/storyChapters';

import { logger } from '../game/diagnosticLogger';

export function calculatePlayerPower(player: PlayerStats, ship: ShipStats): number {
  const tierPower = (ship.shipTier || 1) * 35;
  const weaponPower = (ship.weaponLevel || 1) * 20 + (ship.weaponPower || 3) * 8;
  const defensePower = (ship.shieldLevel || 1) * 15 + ((player.maxHull || 100) / 5);
  return Math.round(tierPower + weaponPower + defensePower);
}

export function generateEnemySalvage(enemy: Enemy): FloatingLoot[] {
  const drops: FloatingLoot[] = [];
  const cat = enemy.category || (enemy.type === 'OUTLAW_BOSS' ? 'BATTLESHIP' : enemy.type === 'RAIDER_CORVETTE' ? 'CRUISER' : 'SCOUT');
  const scale = enemy.scale || 1.0;

  // 1. Credits / Cash Pods
  let credCrates = 1;
  let credBase = 120;
  if (cat === 'COLOSSUS') {
    credCrates = 4;
    credBase = 1100;
  } else if (cat === 'CARRIER') {
    credCrates = 3;
    credBase = 850;
  } else if (cat === 'BATTLESHIP') {
    credCrates = 2;
    credBase = 550;
  } else if (cat === 'CRUISER') {
    credCrates = 2;
    credBase = 350;
  } else if (cat === 'FRIGATE') {
    credCrates = 1;
    credBase = 220;
  } else if (cat === 'CORVETTE') {
    credCrates = 1;
    credBase = 140;
  }

  for (let c = 0; c < credCrates; c++) {
    const credVal = Math.round((credBase + Math.random() * (credBase * 0.5)) * scale);
    drops.push({
      id: `loot_cr_${Date.now()}_${c}_${Math.random()}`,
      x: enemy.x + (Math.random() - 0.5) * 45,
      y: enemy.y + (Math.random() - 0.5) * 45,
      vx: (Math.random() - 0.5) * 45,
      vy: (Math.random() - 0.5) * 45,
      lootType: 'CREDITS',
      creditsValue: credVal,
      item: {
        id: 'credit_chip',
        name: `Credit Voucher (+${credVal} CR)`,
        quantity: credVal,
        avgBuyPrice: 0,
        category: 'TECH',
      },
      lifetime: 55,
    });
  }

  // 2. Missiles / Torpedo Munition Pods
  let torpCrates = 0;
  if (cat === 'COLOSSUS') torpCrates = 4;
  else if (cat === 'CARRIER') torpCrates = 3;
  else if (cat === 'BATTLESHIP') torpCrates = 2;
  else if (cat === 'CRUISER') torpCrates = 2;
  else if (cat === 'FRIGATE') torpCrates = 1;
  else if (cat === 'CORVETTE' && Math.random() < 0.65) torpCrates = 1;
  else if (Math.random() < 0.35) torpCrates = 1;

  for (let t = 0; t < torpCrates; t++) {
    const torpQty = cat === 'COLOSSUS' ? 3 : cat === 'BATTLESHIP' ? 2 : 1;
    drops.push({
      id: `loot_torp_${Date.now()}_${t}_${Math.random()}`,
      x: enemy.x + (Math.random() - 0.5) * 45,
      y: enemy.y + (Math.random() - 0.5) * 45,
      vx: (Math.random() - 0.5) * 45,
      vy: (Math.random() - 0.5) * 45,
      lootType: 'MISSILES',
      missilesCount: torpQty,
      item: {
        id: 'torpedo_ordnance',
        name: `Plasma Torpedo Pod (+${torpQty} Torps)`,
        quantity: torpQty,
        avgBuyPrice: 0,
        category: 'TECH',
      },
      lifetime: 55,
    });
  }

  // 3. Fuel & Nanite Hull Repair Drops
  if (cat === 'COLOSSUS' || cat === 'BATTLESHIP' || cat === 'CRUISER' || Math.random() < 0.55) {
    if (Math.random() < 0.5) {
      const fuelAmt = Math.round(20 + Math.random() * 25);
      drops.push({
        id: `loot_fuel_${Date.now()}_${Math.random()}`,
        x: enemy.x + (Math.random() - 0.5) * 45,
        y: enemy.y + (Math.random() - 0.5) * 45,
        vx: (Math.random() - 0.5) * 45,
        vy: (Math.random() - 0.5) * 45,
        lootType: 'FUEL',
        fuelAmount: fuelAmt,
        item: {
          id: 'fuel_canister',
          name: `Plasma Fuel Pod (+${fuelAmt} Fuel)`,
          quantity: fuelAmt,
          avgBuyPrice: 0,
          category: 'INDUSTRIAL',
        },
        lifetime: 55,
      });
    } else {
      const repAmt = Math.round(25 + Math.random() * 30);
      drops.push({
        id: `loot_rep_${Date.now()}_${Math.random()}`,
        x: enemy.x + (Math.random() - 0.5) * 45,
        y: enemy.y + (Math.random() - 0.5) * 45,
        vx: (Math.random() - 0.5) * 45,
        vy: (Math.random() - 0.5) * 45,
        lootType: 'REPAIR',
        repairAmount: repAmt,
        item: {
          id: 'repair_nanites',
          name: `Nanite Repair Pod (+${repAmt} Hull)`,
          quantity: repAmt,
          avgBuyPrice: 0,
          category: 'TECH',
        },
        lifetime: 55,
      });
    }
  }

  // 4. Valuable Mineral Cargo Drops
  let mineralCrates = 1;
  if (cat === 'COLOSSUS') mineralCrates = 3;
  else if (cat === 'CARRIER' || cat === 'BATTLESHIP') mineralCrates = 2;
  else if (cat === 'CRUISER') mineralCrates = 2;

  const enemyTier = Math.max(1, Math.round(scale * 4));
  for (let s = 0; s < mineralCrates; s++) {
    const mineral = getRandomMineralForSector(Math.max(1, Math.min(6, Math.floor(enemyTier / 3))), s === 0 && enemyTier >= 8);
    const qty = Math.max(1, Math.round((2 + Math.random() * 3) * scale));
    drops.push({
      id: `loot_cargo_${Date.now()}_${s}_${Math.random()}`,
      x: enemy.x + (Math.random() - 0.5) * 45,
      y: enemy.y + (Math.random() - 0.5) * 45,
      vx: (Math.random() - 0.5) * 45,
      vy: (Math.random() - 0.5) * 45,
      lootType: 'CARGO',
      item: {
        id: mineral.id,
        name: mineral.name,
        quantity: qty,
        avgBuyPrice: mineral.unitValue,
        category: 'ORE',
      },
      lifetime: 55,
    });
  }

  return drops;
}

export function generateEscortSalvage(escort: EscortShip): FloatingLoot[] {
  const drops: FloatingLoot[] = [];
  const creditAmt = escort.type === 'GUNSHIP' ? 120 : 70;
  drops.push({
    id: `loot_escort_cr_${Date.now()}_${Math.random()}`,
    x: escort.x + (Math.random() - 0.5) * 20,
    y: escort.y + (Math.random() - 0.5) * 20,
    vx: (Math.random() - 0.5) * 35,
    vy: (Math.random() - 0.5) * 35,
    lootType: 'CREDITS',
    creditsValue: creditAmt,
    item: {
      id: 'credits_escort_salvage',
      name: `Escort Salvage (+${creditAmt} CR)`,
      quantity: creditAmt,
      avgBuyPrice: 0,
      category: 'TECH',
    },
    lifetime: 45,
  });

  if (Math.random() < 0.4) {
    drops.push({
      id: `loot_escort_fuel_${Date.now()}_${Math.random()}`,
      x: escort.x + (Math.random() - 0.5) * 20,
      y: escort.y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 35,
      vy: (Math.random() - 0.5) * 35,
      lootType: 'FUEL',
      fuelAmount: 15,
      item: {
        id: 'fuel_canister',
        name: 'Plasma Fuel Pod (+15 Fuel)',
        quantity: 15,
        avgBuyPrice: 0,
        category: 'INDUSTRIAL',
      },
      lifetime: 45,
    });
  }
  return drops;
}

export function createScaledEnemy(
  id: string,
  baseX: number,
  baseY: number,
  playerOrPower: PlayerStats | number,
  shipOrName?: ShipStats | string,
  customName?: string
): Enemy {
  let playerPower: number;
  let playerTier = 1;
  let weaponLevel = 1;
  let weaponPower = 3;
  let nameOverride = customName;

  if (typeof playerOrPower === 'number') {
    playerPower = playerOrPower;
    if (typeof shipOrName === 'string') {
      nameOverride = shipOrName;
    }
    // Estimate player tier and weapon level from power
    playerTier = Math.max(1, Math.min(22, Math.round(playerPower / 50)));
    weaponLevel = Math.max(1, Math.min(5, Math.round((playerPower % 100) / 25) + 1));
  } else {
    const ship = (typeof shipOrName === 'object' && shipOrName !== null ? shipOrName : {}) as ShipStats;
    playerPower = calculatePlayerPower(playerOrPower, ship);
    playerTier = ship.shipTier || 1;
    weaponLevel = ship.weaponLevel || 1;
    weaponPower = ship.weaponPower || 3;
  }

  // Scale between -30% (0.70x) to +15% (1.15x) of player power
  const factor = 0.70 + Math.random() * 0.45;
  const power = Math.round(playerPower * factor);

  // 1. Determine Enemy Tier & Naval Category (scales with player's ship class)
  const enemyTier = Math.max(1, Math.min(22, Math.round(playerTier * factor)));

  let category: Enemy['category'] = 'SCOUT';
  let title = 'Outlaw Interceptor';
  let enemyScale = 1.0;
  let armorRating = 0; // % of direct laser fire absorbed

  if (enemyTier >= 20) {
    category = 'COLOSSUS';
    title = factor > 1.08 ? 'Astral Leviathan Titan' : 'Ouroboros Apex Flagship';
    enemyScale = Number((3.30 + (factor - 0.7) * 0.5).toFixed(2));
    armorRating = 0.50;
  } else if (enemyTier >= 17) {
    category = 'CARRIER';
    title = factor > 1.08 ? 'Archon Supercarrier' : 'Hyperion Fleet Carrier';
    enemyScale = Number((2.85 + (factor - 0.7) * 0.45).toFixed(2));
    armorRating = 0.45;
  } else if (enemyTier >= 15) {
    category = 'COLOSSUS';
    title = factor > 1.08 ? 'Solar Apex Colossus' : 'Eclipse Flagship';
    enemyScale = Number((2.55 + (factor - 0.7) * 0.4).toFixed(2));
    armorRating = 0.40;
  } else if (enemyTier >= 13) {
    category = 'BATTLESHIP';
    title = factor > 1.08 ? 'Behemoth Battleship' : 'Void Dreadnought';
    enemyScale = Number((2.35 + (factor - 0.7) * 0.4).toFixed(2));
    armorRating = 0.35;
  } else if (enemyTier >= 9) {
    category = 'CRUISER';
    title = factor > 1.08 ? 'Warlord Battlecruiser' : 'Heavy Assault Cruiser';
    enemyScale = Number((1.95 + (factor - 0.7) * 0.35).toFixed(2));
    armorRating = 0.25;
  } else if (enemyTier >= 6) {
    category = 'FRIGATE';
    title = factor > 1.05 ? 'Valkyrie Warship' : 'Reaper Heavy Frigate';
    enemyScale = Number((1.55 + (factor - 0.7) * 0.3).toFixed(2));
    armorRating = 0.18;
  } else if (enemyTier >= 4) {
    category = 'CORVETTE';
    title = factor > 1.05 ? 'Hammerhead Raider' : 'Marauder Gunship';
    enemyScale = Number((1.25 + (factor - 0.7) * 0.25).toFixed(2));
    armorRating = 0.10;
  } else {
    category = 'SCOUT';
    title = factor > 1.0 ? 'Vanguard Interceptor' : 'Outlaw Skiff';
    enemyScale = Number((0.95 + (factor - 0.7) * 0.2).toFixed(2));
    armorRating = 0.05;
  }

  // 2. Formidable HP & Shield Scaling
  // Benchmark player laser volley damage
  const volleyMultiplier = weaponLevel >= 5 ? 1.79 : weaponLevel >= 4 ? 1.4 : weaponLevel >= 3 ? 1.35 : weaponLevel >= 2 ? 1.2 : 1.0;
  const expectedVolleyDmg = (45 + weaponPower * 12) * (1 + (weaponLevel - 1) * 0.25) * volleyMultiplier;

  // Number of sustained full laser volleys needed to destroy the enemy based on naval class:
  let classVolleys = 4.0;
  if (category === 'COLOSSUS') classVolleys = 22.0 + ((factor - 0.70) / 0.45) * 14.0;
  else if (category === 'CARRIER') classVolleys = 18.0 + ((factor - 0.70) / 0.45) * 11.0;
  else if (category === 'BATTLESHIP') classVolleys = 13.0 + ((factor - 0.70) / 0.45) * 8.0;
  else if (category === 'CRUISER') classVolleys = 8.0 + ((factor - 0.70) / 0.45) * 5.0;
  else if (category === 'FRIGATE') classVolleys = 6.0 + ((factor - 0.70) / 0.45) * 3.5;
  else if (category === 'CORVETTE') classVolleys = 4.5 + ((factor - 0.70) / 0.45) * 2.5;
  else classVolleys = 3.2 + ((factor - 0.70) / 0.45) * 2.0;

  const totalEffectiveHP = Math.round(expectedVolleyDmg * classVolleys);

  // Divide between Hull and Deflector Shields based on category
  let maxShield = 0;
  let maxHull = totalEffectiveHP;

  if (category === 'COLOSSUS') {
    maxShield = Math.round(totalEffectiveHP * 0.50);
    maxHull = totalEffectiveHP - maxShield;
  } else if (category === 'CARRIER') {
    maxShield = Math.round(totalEffectiveHP * 0.48);
    maxHull = totalEffectiveHP - maxShield;
  } else if (category === 'BATTLESHIP') {
    maxShield = Math.round(totalEffectiveHP * 0.45);
    maxHull = totalEffectiveHP - maxShield;
  } else if (category === 'CRUISER') {
    maxShield = Math.round(totalEffectiveHP * 0.38);
    maxHull = totalEffectiveHP - maxShield;
  } else if (category === 'FRIGATE') {
    maxShield = Math.round(totalEffectiveHP * 0.30);
    maxHull = totalEffectiveHP - maxShield;
  } else if (category === 'CORVETTE') {
    maxShield = Math.round(totalEffectiveHP * 0.22);
    maxHull = totalEffectiveHP - maxShield;
  } else {
    maxShield = factor > 0.90 ? Math.round(totalEffectiveHP * 0.20) : 0;
    maxHull = totalEffectiveHP - maxShield;
  }

  let type: Enemy['type'] = 'PIRATE_SCOUT';
  if (category === 'COLOSSUS' || category === 'CARRIER' || category === 'BATTLESHIP') {
    type = 'OUTLAW_BOSS';
  } else if (category === 'CRUISER' || category === 'FRIGATE' || category === 'CORVETTE') {
    type = 'RAIDER_CORVETTE';
  }

  const hasBeam = enemyTier >= 9 || category === 'COLOSSUS' || category === 'CARRIER' || category === 'BATTLESHIP' || category === 'CRUISER';

  let escortCount = 0;
  if (category === 'COLOSSUS') escortCount = 5;
  else if (category === 'CARRIER') escortCount = 4;
  else if (category === 'BATTLESHIP') escortCount = 3;
  else if (category === 'CRUISER') escortCount = 2;
  else if (category === 'FRIGATE') escortCount = 1;

  const enemyEscorts: EscortShip[] = [];
  for (let i = 0; i < escortCount; i++) {
    const isGunship = (category === 'COLOSSUS' || category === 'CARRIER' || category === 'BATTLESHIP') && i % 2 === 1;
    const formAng = (i / escortCount) * Math.PI * 2;
    const formDist = 55 + enemyScale * 25;
    enemyEscorts.push({
      id: `escort_enemy_${id}_${i}`,
      name: isGunship ? 'Outlaw Heavy Gunship' : 'Outlaw Raider Escort',
      type: isGunship ? 'GUNSHIP' : 'FIGHTER',
      owner: 'ENEMY',
      leaderId: id,
      x: baseX + Math.cos(formAng) * formDist,
      y: baseY + Math.sin(formAng) * formDist,
      vx: 0,
      vy: 0,
      rotation: Math.random() * Math.PI * 2,
      hull: isGunship ? 180 : 100,
      maxHull: isGunship ? 180 : 100,
      shield: isGunship ? 100 : 50,
      maxShield: isGunship ? 100 : 50,
      fireCooldown: 0.5 + Math.random() * 1.5,
      formationAngle: formAng,
      formationDist: formDist,
      targetEnemyId: null,
    });
  }

  return {
    id,
    name: nameOverride || title,
    type,
    category,
    tier: enemyTier,
    armorRating,
    x: baseX,
    y: baseY,
    vx: (Math.random() - 0.5) * 15,
    vy: (Math.random() - 0.5) * 15,
    rotation: Math.random() * Math.PI * 2,
    hull: maxHull,
    maxHull,
    shield: maxShield,
    maxShield,
    bounty: Math.round(250 + power * 3.8 + enemyTier * 120),
    fireCooldown: Math.random() * 1.5,
    aggroDistance: Math.round(520 + enemyScale * 140),
    power,
    scale: enemyScale,
    hasBeamWeapon: hasBeam,
    beamTargetId: null,
    escorts: enemyEscorts,
  };
}

interface GameActions {
  startGame: (isNew?: boolean) => void;
  setGameStatus: (status: GameState['gameStatus']) => void;
  toggleSound: () => void;
  toggleMusic: () => void;
  toggleSFX: () => void;
  toggleFlightControls: () => void;
  updateShipPhysics: (updates: Partial<ShipStats>) => void;
  distributePower: (system: 'weapon' | 'shield' | 'engine', delta: number) => void;
  consumeFuel: (amount: number) => boolean;
  rechargeShields: (dt: number) => void;
  
  // Docking & Trade
  dockAtStation: (stationId: string) => void;
  undock: () => void;
  sellMineral: (mineralId: string, quantity?: number) => boolean;
  sellAllMinerals: () => number;
  buyCommodity: (commodityId: string, quantity: number) => boolean;
  sellCommodity: (commodityId: string, quantity: number) => boolean;
  sellAllCargo: () => number;
  refuelShip: (units: number) => boolean;
  repairShip: (points: number) => boolean;
  upgradeCargo: () => boolean;
  upgradeWeapon: () => boolean;
  upgradeShield: () => boolean;
  upgradeEngine: () => boolean;
  upgradeShipChassis: () => boolean;
  buyFoodRations: (qty: number) => boolean;
  buyTorpedoLauncher: () => boolean;
  buyTorpedoAmmo: (qty: number) => boolean;
  buyEmpGenerator: () => boolean;
  upgradeAutoTurrets: () => boolean;
  fireTorpedo: () => boolean;
  triggerEmpWave: () => boolean;
  buyBeamWeapon: () => boolean;

  // Escort Armada Fleet Actions
  toggleArmadaStance: () => void;
  buyEscortShip: (type: EscortType) => boolean;
  sellEscortShip: (escortId: string) => number;
  repairEscorts: () => boolean;
  dismissEscort: (escortId: string) => void;
  updateWorldEscorts: (escorts: EscortShip[]) => void;
  damageEscort: (escortId: string, rawDamage: number, stunDuration?: number) => { destroyed: boolean; escort?: EscortShip };

  // Recon Scout Drone & Endless Cluster Actions
  launchReconDrone: () => boolean;
  buyDrones: (qty: number) => boolean;
  updateWorldDrones: (drones: ReconDrone[]) => void;
  addPointOfInterest: (poi: PointOfInterest) => void;
  updatePointsOfInterest: (dt: number, playerX: number, playerY: number) => void;
  dismissPointOfInterest: (poiId: string) => void;
  checkAndGenerateClusters: (playerX: number, playerY: number) => void;
  updateHyperJump: (dt: number) => void;

  // Combat & Mining
  damagePlayer: (rawDamage: number) => void;
  damageEnemy: (enemyId: string, rawDamage: number, isExplosive?: boolean, stunDuration?: number) => { destroyed: boolean; enemy?: Enemy };
  damageAsteroid: (asteroidId: string, rawDamage: number) => { destroyed: boolean; oreYield?: number; oreType?: string };
  updateEnemies: (enemies: Enemy[]) => void;
  spawnEnemyWave: () => void;
  addProjectile: (proj: Projectile) => void;
  updateProjectiles: (dt: number) => void;
  spawnFloatingLoot: (loot: FloatingLoot) => void;
  collectLoot: (lootId: string) => boolean;
  setCombatAlert: (alert: boolean) => void;
  
  // Sector transition / Reset
  jumpSector: () => void;
  resetGame: () => void;
  reconstructShip: () => void;

  // Pause & Diagnostics System
  setPaused: (paused: boolean) => void;
  togglePause: () => void;
  setDiagnosticsOpen: (open: boolean) => void;
  toggleDiagnostics: () => void;
  returnToMainMenu: () => void;
  setTouchControlsMode: (mode: 'AUTO' | 'ON' | 'OFF') => void;

  // Save Slots & Mode System
  startNewGameInSlot: (mode: GameMode, slotIndex: number) => void;
  loadGameFromSlotAction: (mode: GameMode, slotIndex: number) => boolean;
  saveCurrentGame: () => boolean;
  setIntroNuxOpen: (open: boolean) => void;

  // Missions & Contracts System
  acceptMission: (mission: Mission) => boolean;
  completeActiveMission: () => boolean;
  abandonActiveMission: () => boolean;
  progressMissionKill: (enemyCategory?: string) => void;
  progressMissionMining: (oreId: string, qty: number) => void;
  setStationMissions: (missions: Mission[]) => void;

  // Storybook Chronicles Cutscenes System
  triggerStoryChapter: (chapter: StoryChapter) => void;
  closeStorybook: () => void;
}

const INITIAL_POWER = {
  weaponPower: 3,
  shieldPower: 3,
  enginePower: 4,
};

const initialSectorData = generateSector('Sector-01');

const getInitialState = () => ({
  player: {
    credits: 1000,
    hull: 100,
    maxHull: 100,
    fuel: 100,
    maxFuel: 100,
    cargoCapacity: 30,
    inventory: [
      {
        id: 'iron_ore',
        name: 'Ferrous Iron Ore',
        quantity: 5,
        avgBuyPrice: 45,
        category: 'ORE' as const,
      },
    ],
  },
  ship: {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rotation: -Math.PI / 2, // Facing up
    weaponPower: INITIAL_POWER.weaponPower,
    shieldPower: INITIAL_POWER.shieldPower,
    enginePower: INITIAL_POWER.enginePower,
    weaponLevel: 1,
    shieldLevel: 1,
    engineLevel: 1,
    shipTier: 1,
    shield: 100,
    maxShield: 100,
    isThrusting: false,
    isMining: false,
    hasTorpedoLauncher: false,
    torpedoes: 0,
    maxTorpedoes: 5,
    hasEmpGenerator: false,
    empCooldown: 0,
    maxEmpCooldown: 8,
    hasAutoTurrets: false,
    turretCooldown: 0,
    drones: 3,
    maxDrones: 5,
    droneCooldown: 0,
    hasBeamWeapon: false,
    beamTargetId: null as string | null,
    armadaStance: 'DEFEND' as EscortStance,
    escorts: [] as EscortShip[],
    maxEscorts: getMaxEscortsForTier(1),
  },
  world: {
    currentSectorId: 'Sector-01',
    sector: initialSectorData.sector,
    stations: initialSectorData.stations,
    asteroids: initialSectorData.asteroids,
    enemies: initialSectorData.enemies,
    projectiles: [] as Projectile[],
    floatingLoot: [] as FloatingLoot[],
    drones: [] as ReconDrone[],
    escorts: [] as EscortShip[],
    pointsOfInterest: [] as PointOfInterest[],
    exploredCells: ['0,0'],
  },
  market: {
    activeStationId: null as string | null,
    commodities: [] as MarketItem[],
  },
  gameStatus: 'MENU' as GameState['gameStatus'],
  soundEnabled: true,
  musicEnabled: true,
  sfxEnabled: true,
  combatAlert: false,
  isHyperJumping: false,
  hyperJumpProgress: 0,
  invertFlightControls: false,
  isPaused: false,
  isDiagnosticsOpen: false,
  touchControlsMode: 'AUTO' as const,
  mode: 'STORY' as GameMode,
  saveSlotIndex: 0,
  activeMission: null as Mission | null,
  stationMissions: [] as Mission[],
  completedMissionsCount: 0,
  isIntroNuxOpen: false,
  activeStorybookChapter: null as StoryChapter | null,
  unlockedStoryChapterIds: [] as string[],
});

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      startNewGameInSlot: (mode: GameMode, slotIndex: number) => {
        SoundManager.startMusic();
        const fresh = getInitialState();
        const sectorData = generateSector('Sector-01');
        fresh.world.sector = sectorData.sector;
        fresh.world.stations = sectorData.stations;
        fresh.world.asteroids = sectorData.asteroids;

        fresh.world.enemies = (sectorData.enemies || []).map((e) =>
          createScaledEnemy(e.id, e.x, e.y, fresh.player, fresh.ship, e.name)
        );
        fresh.world.escorts = [];
        fresh.gameStatus = 'EXPLORING';
        fresh.mode = mode;
        fresh.saveSlotIndex = slotIndex;
        fresh.activeMission = null;
        fresh.completedMissionsCount = 0;
        fresh.isIntroNuxOpen = mode === 'STORY';
        fresh.activeStorybookChapter = null;
        fresh.unlockedStoryChapterIds = mode === 'STORY' ? ['ch_01_exile'] : [];

        set(fresh);
        saveToSlot(slotIndex, mode, fresh.player, fresh.ship, 'Sector-01', null, 0, 0, fresh.unlockedStoryChapterIds);
      },

      loadGameFromSlotAction: (mode: GameMode, slotIndex: number) => {
        const saved = loadFromSlot(mode, slotIndex);
        if (!saved) return false;
        SoundManager.startMusic();
        const sectorId = saved.currentSectorId || 'Sector-01';
        const sectorData = generateSector(sectorId);
        const scaledEnemies = (sectorData.enemies || []).map((e) =>
          createScaledEnemy(e.id, e.x, e.y, saved.player, saved.ship, e.name)
        );
        const healedHull = Math.max(saved.player.hull || 0, saved.player.maxHull || 100);
        const healedShield = Math.max(saved.ship.shield || 0, saved.ship.maxShield || 100);

        set((state) => ({
          ...state,
          gameStatus: 'EXPLORING',
          mode,
          saveSlotIndex: slotIndex,
          activeMission: saved.activeMission || null,
          completedMissionsCount: saved.completedMissionsCount || 0,
          isIntroNuxOpen: false,
          activeStorybookChapter: null,
          unlockedStoryChapterIds: saved.unlockedStoryChapterIds || (mode === 'STORY' ? ['ch_01_exile'] : []),
          combatAlert: false,
          isHyperJumping: false,
          hyperJumpProgress: 0,
          player: {
            ...saved.player,
            hull: healedHull,
            fuel: Math.max(saved.player.fuel || 0, 50),
          },
          ship: {
            ...saved.ship,
            shield: healedShield,
            maxEscorts: getMaxEscortsForTier(saved.ship.shipTier || 1),
            escorts: saved.ship.escorts || [],
          },
          world: {
            ...state.world,
            currentSectorId: sectorId,
            sector: sectorData.sector,
            stations: sectorData.stations,
            asteroids: sectorData.asteroids,
            enemies: scaledEnemies,
            escorts: saved.ship.escorts || [],
            projectiles: [],
            floatingLoot: [],
            drones: [],
            pointsOfInterest: [],
            exploredCells: ['0,0'],
          },
        }));
        return true;
      },

      saveCurrentGame: () => {
        const state = get();
        return saveToSlot(
          state.saveSlotIndex,
          state.mode,
          state.player,
          state.ship,
          state.world.currentSectorId,
          state.activeMission,
          state.completedMissionsCount,
          state.completedMissionsCount,
          state.unlockedStoryChapterIds || []
        );
      },

      setIntroNuxOpen: (open: boolean) => set({ isIntroNuxOpen: open }),

      triggerStoryChapter: (chapter: StoryChapter) => {
        const { unlockedStoryChapterIds } = get();
        const nextUnlocked = Array.from(new Set([...(unlockedStoryChapterIds || []), chapter.id]));
        set({
          activeStorybookChapter: chapter,
          unlockedStoryChapterIds: nextUnlocked,
        });
        get().saveCurrentGame();
      },

      closeStorybook: () => {
        set({ activeStorybookChapter: null });
        get().saveCurrentGame();
      },

      acceptMission: (mission: Mission) => {
        const { activeMission } = get();
        if (activeMission) return false;
        SoundManager.playLaser(true);
        logger.log('STATE', `Accepted Contract: ${mission.title}`, { mission });
        set({
          activeMission: { ...mission, status: 'ACTIVE' },
        });
        get().saveCurrentGame();
        return true;
      },

      completeActiveMission: () => {
        const { activeMission, player, ship, mode, completedMissionsCount, unlockedStoryChapterIds } = get();
        if (!activeMission) return false;
        SoundManager.playCash();
        const reward = activeMission.reward;
        const bonusCredits = reward.credits || 0;
        const bonusHull = reward.hullBonus || 0;

        let newWeaponLvl = ship.weaponLevel || 1;
        let newShieldLvl = ship.shieldLevel || 1;
        let newEngineLvl = ship.engineLevel || 1;
        let newCargo = player.cargoCapacity;

        if (reward.freeUpgrade === 'WEAPON') newWeaponLvl += 1;
        if (reward.freeUpgrade === 'SHIELD') newShieldLvl += 1;
        if (reward.freeUpgrade === 'ENGINE') newEngineLvl += 1;
        if (reward.freeUpgrade === 'CARGO') newCargo += 10;

        const nextCompletedCount = (completedMissionsCount || 0) + 1;
        logger.log('STATE', `Contract Successfully Completed: ${activeMission.title} (+${bonusCredits} CR)`);

        let chapterToTrigger: StoryChapter | null = null;
        if (mode === 'STORY') {
          chapterToTrigger = getStoryChapterForEvent(
            {
              type: 'MISSION_COMPLETE',
              completedMissionsCount: nextCompletedCount,
              shipTier: ship.shipTier || 1,
              weaponLevel: newWeaponLvl,
              missionTitle: activeMission.title,
              missionRewardCredits: bonusCredits,
            },
            unlockedStoryChapterIds || []
          );
        }

        const nextUnlocked = chapterToTrigger
          ? Array.from(new Set([...(unlockedStoryChapterIds || []), chapterToTrigger.id]))
          : unlockedStoryChapterIds || [];

        set((state) => ({
          activeMission: null,
          completedMissionsCount: nextCompletedCount,
          activeStorybookChapter: chapterToTrigger,
          unlockedStoryChapterIds: nextUnlocked,
          player: {
            ...state.player,
            credits: state.player.credits + bonusCredits,
            maxHull: state.player.maxHull + bonusHull,
            hull: Math.min(state.player.maxHull + bonusHull, state.player.hull + bonusHull),
            cargoCapacity: newCargo,
          },
          ship: {
            ...state.ship,
            weaponLevel: newWeaponLvl,
            shieldLevel: newShieldLvl,
            engineLevel: newEngineLvl,
          },
        }));
        get().saveCurrentGame();
        return true;
      },

      abandonActiveMission: () => {
        const { activeMission } = get();
        if (!activeMission) return false;
        const penalty = activeMission.penaltyCredits || 400;
        SoundManager.playExplosion();
        logger.log('STATE', `Contract Abandoned: ${activeMission.title} (-${penalty} CR penalty)`);
        set((state) => ({
          activeMission: null,
          player: {
            ...state.player,
            credits: Math.max(0, state.player.credits - penalty),
          },
        }));
        get().saveCurrentGame();
        return true;
      },

      progressMissionKill: (_enemyCategory?: string) => {
        const { activeMission } = get();
        if (!activeMission || activeMission.status !== 'ACTIVE') return;
        if (activeMission.type === 'BOUNTY_HUNT' || activeMission.type === 'CONVOY_ESCORT') {
          const current = activeMission.targetEnemiesKilled || 0;
          const req = activeMission.targetEnemiesRequired || 1;
          const next = current + 1;
          const updatedMission: Mission = { ...activeMission, targetEnemiesKilled: next };
          set({ activeMission: updatedMission });
          logger.log('STATE', `Mission Objective Progress: ${next}/${req} Kills`);
          if (next >= req && activeMission.type === 'BOUNTY_HUNT') {
            get().completeActiveMission();
          } else {
            get().saveCurrentGame();
          }
        }
      },

      progressMissionMining: (oreId: string, _qty?: number) => {
        const { activeMission } = get();
        if (!activeMission || activeMission.status !== 'ACTIVE' || activeMission.type !== 'MINERAL_EXTRACTION') return;
        if (activeMission.requiredMineralId === oreId) {
          get().saveCurrentGame();
        }
      },

      setStationMissions: (missions: Mission[]) => set({ stationMissions: missions }),

      startGame: (isNew = false) => {
        SoundManager.startMusic();
        if (isNew) {
          const fresh = getInitialState();
          const sectorData = generateSector('Sector-01');
          fresh.world.sector = sectorData.sector;
          fresh.world.stations = sectorData.stations;
          fresh.world.asteroids = sectorData.asteroids;

          fresh.world.enemies = (sectorData.enemies || []).map((e) =>
            createScaledEnemy(e.id, e.x, e.y, fresh.player, fresh.ship, e.name)
          );
          const initialEnemyEscorts: EscortShip[] = [];
          fresh.world.enemies.forEach((e) => {
            if (e.escorts && e.escorts.length > 0) {
              initialEnemyEscorts.push(...e.escorts);
            }
          });
          fresh.world.escorts = initialEnemyEscorts;
          fresh.gameStatus = 'EXPLORING';
          set(fresh);
        } else {
          const { player, ship, world } = get();
          const currentTier = ship.shipTier || 1;

          const hasTorpedoes = !!ship.hasTorpedoLauncher;
          const maxTorps = Math.max(
            ship.maxTorpedoes || 5,
            currentTier >= 14 ? 25 : currentTier >= 10 ? 15 : 10
          );
          const currentTorps = hasTorpedoes ? Math.max(ship.torpedoes || 0, 5) : 0;
          const hasTurrets = !!ship.hasAutoTurrets;
          const hasEmp = !!ship.hasEmpGenerator;

          // Rescale all existing enemies to floating range [-30%, +15%]
          const rescaledEnemies = (world.enemies || []).map((e) =>
            createScaledEnemy(e.id, e.x, e.y, player, ship, e.name)
          );

          // Safeguard against loading into a dead/broken hull state
          const healedHull = Math.max(player.hull || 0, player.maxHull || 100);
          const healedShield = Math.max(ship.shield || 0, ship.maxShield || 100);

          set((state) => ({
            gameStatus: 'EXPLORING',
            combatAlert: false,
            isHyperJumping: false,
            hyperJumpProgress: 0,
            player: {
              ...state.player,
              hull: healedHull,
              fuel: Math.max(state.player.fuel || 0, 50),
            },
            ship: {
              ...state.ship,
              shield: healedShield,
              hasTorpedoLauncher: hasTorpedoes,
              maxTorpedoes: maxTorps,
              torpedoes: currentTorps,
              hasAutoTurrets: hasTurrets,
              hasEmpGenerator: hasEmp,
              maxEmpCooldown: currentTier >= 14 ? 5 : 6,
              drones: state.ship.drones ?? 3,
              maxDrones: state.ship.maxDrones ?? 5,
              droneCooldown: 0,
              hasBeamWeapon: !!state.ship.hasBeamWeapon,
              beamTargetId: null,
              armadaStance: state.ship.armadaStance || 'DEFEND',
              escorts: state.ship.escorts || [],
              maxEscorts: getMaxEscortsForTier(currentTier),
            },
            world: {
              ...state.world,
              enemies: rescaledEnemies,
              drones: state.world.drones || [],
              escorts: state.world.escorts || [],
              floatingLoot: state.world.floatingLoot || [],
              pointsOfInterest: state.world.pointsOfInterest || [],
              exploredCells: state.world.exploredCells || ['0,0'],
            },
          }));
        }
      },

      reconstructShip: () => {
        SoundManager.startMusic();
        const { world } = get();
        const freshSector = world.sector?.theme ? world.sector : generateSector(world.currentSectorId || 'Sector-01').sector;
        const freshStations = (world.stations && world.stations.length > 0)
          ? world.stations
          : generateSector(world.currentSectorId || 'Sector-01').stations;
        const freshAsteroids = (world.asteroids && world.asteroids.length > 0)
          ? world.asteroids
          : generateSector(world.currentSectorId || 'Sector-01').asteroids;

        set((state) => ({
          gameStatus: 'EXPLORING',
          isPaused: false,
          isDiagnosticsOpen: false,
          combatAlert: false,
          isHyperJumping: false,
          hyperJumpProgress: 0,
          player: {
            ...state.player,
            hull: Math.max(state.player.maxHull || 100, 100),
            fuel: Math.max(state.player.fuel || 50, 50),
          },
          ship: {
            ...state.ship,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            rotation: -Math.PI / 2,
            shield: Math.max(state.ship.maxShield || 100, 100),
            isThrusting: false,
            isMining: false,
            escorts: state.ship.escorts || [],
            maxEscorts: getMaxEscortsForTier(state.ship.shipTier || 1),
            armadaStance: state.ship.armadaStance || 'DEFEND',
          },
          world: {
            ...state.world,
            sector: freshSector,
            stations: freshStations,
            asteroids: freshAsteroids,
            projectiles: [],
            enemies: (state.world.enemies || []).map((e) =>
              createScaledEnemy(e.id, e.x, e.y, state.player, state.ship, e.name)
            ),
            drones: state.world.drones || [],
            escorts: state.ship.escorts || [],
            floatingLoot: state.world.floatingLoot || [],
            pointsOfInterest: state.world.pointsOfInterest || [],
            exploredCells: state.world.exploredCells || ['0,0'],
          },
        }));
      },

      setGameStatus: (status) => set({ gameStatus: status }),

      toggleSound: () => {
        const next = !get().soundEnabled;
        SoundManager.setMusicEnabled(next);
        SoundManager.setSfxEnabled(next);
        set({ soundEnabled: next, musicEnabled: next, sfxEnabled: next });
      },

      toggleMusic: () => {
        const next = !get().musicEnabled;
        SoundManager.setMusicEnabled(next);
        set({ musicEnabled: next });
      },

      toggleSFX: () => {
        const next = !get().sfxEnabled;
        SoundManager.setSfxEnabled(next);
        set({ sfxEnabled: next });
      },

      toggleFlightControls: () => {
        set((state) => ({ invertFlightControls: !state.invertFlightControls }));
      },

      setTouchControlsMode: (mode) => {
        set({ touchControlsMode: mode });
      },

      updateShipPhysics: (updates) => {
        set((state) => ({
          ship: { ...state.ship, ...updates },
        }));
      },

      distributePower: (system, delta) => {
        const { ship } = get();
        const MAX_TOTAL_POWER = 10;
        const currentTotal = ship.weaponPower + ship.shieldPower + ship.enginePower;
        const systemKey = `${system}Power` as 'weaponPower' | 'shieldPower' | 'enginePower';
        const currentVal = ship[systemKey];

        const targetVal = Math.max(1, Math.min(5, currentVal + delta));
        if (targetVal === currentVal) return;

        // If increasing and total reaches limit, borrow from another system
        if (delta > 0 && currentTotal >= MAX_TOTAL_POWER) {
          const otherKeys = (['weaponPower', 'shieldPower', 'enginePower'] as const).filter(
            (k) => k !== systemKey && ship[k] > 1
          );
          if (otherKeys.length === 0) return; // Cannot reallocate
          const borrowFrom = otherKeys[0];
          set((state) => ({
            ship: {
              ...state.ship,
              [systemKey]: targetVal,
              [borrowFrom]: state.ship[borrowFrom] - 1,
            },
          }));
        } else {
          set((state) => ({
            ship: {
              ...state.ship,
              [systemKey]: targetVal,
            },
          }));
        }
      },

      consumeFuel: (amount) => {
        const { player } = get();
        if (player.fuel <= 0) return false;
        const newFuel = Math.max(0, player.fuel - amount);
        set((state) => ({
          player: { ...state.player, fuel: newFuel },
        }));
        return newFuel > 0;
      },

      rechargeShields: (dt) => {
        const { ship } = get();
        if (ship.shield >= ship.maxShield) return;
        // Shield regen scaled by shield power allocation (1 to 5)
        const regenRate = 2 + ship.shieldPower * 2.5; // pts per sec
        const newShield = Math.min(ship.maxShield, ship.shield + regenRate * dt);
        set((state) => ({
          ship: { ...state.ship, shield: newShield },
        }));
      },

      dockAtStation: (stationId) => {
        const { world, player, ship, activeMission } = get();
        const station = world.stations.find((s) => s.id === stationId);
        if (!station) return;
        const commodities = generateStationMarket(station);
        const missions = generateStationMissions(
          station,
          world.stations,
          world.sector,
          ship.shipTier || 1,
          player,
          ship
        );
        SoundManager.playDock();
        SoundManager.updateThruster(false);

        // Check if active mission completed upon docking at target station
        if (activeMission && activeMission.status === 'ACTIVE') {
          if (
            (activeMission.type === 'COURIER_CARGO' ||
              activeMission.type === 'VIP_TRANSPORT' ||
              (activeMission.type === 'CONVOY_ESCORT' &&
                (activeMission.targetEnemiesKilled || 0) >= (activeMission.targetEnemiesRequired || 1))) &&
            activeMission.targetStationId === stationId
          ) {
            get().completeActiveMission();
          } else if (
            activeMission.type === 'MINERAL_EXTRACTION' &&
            activeMission.targetStationId === stationId
          ) {
            const hasOre = player.inventory.find(
              (i) => i.id === activeMission.requiredMineralId && i.quantity >= (activeMission.requiredMineralQty || 1)
            );
            if (hasOre) {
              const reqQty = activeMission.requiredMineralQty || 1;
              const updatedInv = player.inventory
                .map((i) =>
                  i.id === activeMission.requiredMineralId
                    ? { ...i, quantity: i.quantity - reqQty }
                    : i
                )
                .filter((i) => i.quantity > 0);
              set((state) => ({ player: { ...state.player, inventory: updatedInv } }));
              get().completeActiveMission();
            }
          }
        }

        set((state) => ({
          gameStatus: 'STATION',
          stationMissions: missions,
          market: {
            activeStationId: stationId,
            commodities,
          },
          ship: {
            ...state.ship,
            vx: 0,
            vy: 0,
            isThrusting: false,
            isMining: false,
          },
        }));
        get().saveCurrentGame();
      },

      undock: () => {
        SoundManager.playDock();
        set({
          gameStatus: 'EXPLORING',
          market: {
            activeStationId: null,
            commodities: [],
          },
        });
        get().saveCurrentGame();
      },

      buyCommodity: (commodityId, quantity) => {
        const { player, market } = get();
        const marketItem = market.commodities.find((c) => c.id === commodityId);
        if (!marketItem || marketItem.quantity < quantity) return false;

        const totalCost = marketItem.buyPrice * quantity;
        if (player.credits < totalCost) return false;

        const currentCargo = player.inventory.reduce((sum, item) => sum + item.quantity, 0);
        if (currentCargo + quantity > player.cargoCapacity) return false;

        // Deduct credits and update inventory
        const existingItem = player.inventory.find((i) => i.id === commodityId);
        let updatedInventory: InventoryItem[];

        if (existingItem) {
          const totalQty = existingItem.quantity + quantity;
          const weightedCost =
            existingItem.quantity * existingItem.avgBuyPrice + totalCost;
          const newAvgPrice = Math.round(weightedCost / totalQty);
          updatedInventory = player.inventory.map((item) =>
            item.id === commodityId
              ? { ...item, quantity: totalQty, avgBuyPrice: newAvgPrice }
              : item
          );
        } else {
          updatedInventory = [
            ...player.inventory,
            {
              id: marketItem.id,
              name: marketItem.name,
              quantity,
              avgBuyPrice: marketItem.buyPrice,
              category: marketItem.category,
            },
          ];
        }

        const updatedMarketItems = market.commodities.map((c) =>
          c.id === commodityId ? { ...c, quantity: c.quantity - quantity } : c
        );

        SoundManager.playCash();

        set((state) => ({
          player: {
            ...state.player,
            credits: state.player.credits - totalCost,
            inventory: updatedInventory,
          },
          market: {
            ...state.market,
            commodities: updatedMarketItems,
          },
        }));

        return true;
      },

      sellCommodity: (commodityId, quantity) => {
        const { player, market } = get();
        const inventoryItem = player.inventory.find((i) => i.id === commodityId);
        const marketItem = market.commodities.find((c) => c.id === commodityId);
        if (!inventoryItem || inventoryItem.quantity < quantity || !marketItem) return false;

        const earnings = marketItem.sellPrice * quantity;
        const updatedInventory = player.inventory
          .map((item) =>
            item.id === commodityId ? { ...item, quantity: item.quantity - quantity } : item
          )
          .filter((item) => item.quantity > 0);

        const updatedMarketItems = market.commodities.map((c) =>
          c.id === commodityId ? { ...c, quantity: c.quantity + quantity } : c
        );

        SoundManager.playCash();

        set((state) => ({
          player: {
            ...state.player,
            credits: state.player.credits + earnings,
            inventory: updatedInventory,
          },
          market: {
            ...state.market,
            commodities: updatedMarketItems,
          },
        }));

        return true;
      },

      sellMineral: (mineralId: string, quantity?: number) => {
        const { player, market, world } = get();
        const inv = [...player.inventory];
        const idx = inv.findIndex((i) => i.id === mineralId);
        if (idx < 0) return false;
        const item = inv[idx];
        const qtyToSell = quantity ? Math.min(item.quantity, quantity) : item.quantity;
        if (qtyToSell <= 0) return false;

        const activeStation = world.stations.find((s) => s.id === market.activeStationId);
        const priceInfo = getStationMineralPrice(activeStation, mineralId);
        const payout = qtyToSell * priceInfo.unitPrice;

        if (item.quantity <= qtyToSell) {
          inv.splice(idx, 1);
        } else {
          inv[idx] = { ...item, quantity: item.quantity - qtyToSell };
        }

        SoundManager.playCash();
        set({
          player: {
            ...player,
            credits: player.credits + payout,
            inventory: inv,
          },
        });

        return true;
      },

      sellAllMinerals: () => {
        const { player, market, world } = get();
        if (player.inventory.length === 0) return 0;

        const activeStation = world.stations.find((s) => s.id === market.activeStationId);
        let totalEarnings = 0;
        player.inventory.forEach((item) => {
          const priceInfo = getStationMineralPrice(activeStation, item.id);
          totalEarnings += priceInfo.unitPrice * item.quantity;
        });

        if (totalEarnings > 0) {
          SoundManager.playCash();
          set((state) => ({
            player: {
              ...state.player,
              credits: state.player.credits + totalEarnings,
              inventory: [],
            },
          }));
        }
        return totalEarnings;
      },

      sellAllCargo: () => {
        return get().sellAllMinerals();
      },

      refuelShip: (units) => {
        const { player, market, world } = get();
        const station = world.stations.find((s) => s.id === market.activeStationId);
        const pricePerUnit = station ? station.fuelPricePerUnit : 3;
        const needed = player.maxFuel - player.fuel;
        const actualUnits = Math.min(units, needed);
        if (actualUnits <= 0) return false;

        const totalCost = actualUnits * pricePerUnit;
        if (player.credits < totalCost) return false;

        SoundManager.playCash();
        set((state) => ({
          player: {
            ...state.player,
            credits: state.player.credits - totalCost,
            fuel: state.player.fuel + actualUnits,
          },
        }));
        return true;
      },

      repairShip: (points) => {
        const { player, market, world } = get();
        const station = world.stations.find((s) => s.id === market.activeStationId);
        const pricePerPoint = station ? station.repairPricePerPoint : 8;
        const needed = player.maxHull - player.hull;
        const actualPoints = Math.min(points, needed);
        if (actualPoints <= 0) return false;

        const totalCost = actualPoints * pricePerPoint;
        if (player.credits < totalCost) return false;

        SoundManager.playCash();
        set((state) => ({
          player: {
            ...state.player,
            credits: state.player.credits - totalCost,
            hull: state.player.hull + actualPoints,
          },
        }));
        return true;
      },

      upgradeCargo: () => {
        const { player } = get();
        const cost = Math.round(player.cargoCapacity * 35);
        if (player.credits < cost) return false;

        SoundManager.playCash();
        set((state) => ({
          player: {
            ...state.player,
            credits: state.player.credits - cost,
            cargoCapacity: state.player.cargoCapacity + 10,
          },
        }));
        return true;
      },

      upgradeWeapon: () => {
        const { ship, player, world, mode, completedMissionsCount, unlockedStoryChapterIds } = get();
        const currentLvl = ship.weaponLevel || 1;
        if (currentLvl >= 50) return false;
        const cost = Math.round(550 * Math.pow(1.15, currentLvl - 1));
        if (player.credits < cost) return false;

        SoundManager.playCash();
        const nextWeaponLvl = currentLvl + 1;
        const updatedPlayer = {
          ...player,
          credits: player.credits - cost,
        };
        const updatedShip = {
          ...ship,
          weaponLevel: nextWeaponLvl,
        };
        const rescaledEnemies = world.enemies.map((e) =>
          createScaledEnemy(e.id, e.x, e.y, updatedPlayer, updatedShip, e.name)
        );

        let chapterToTrigger: StoryChapter | null = null;
        if (mode === 'STORY') {
          chapterToTrigger = getStoryChapterForEvent(
            {
              type: 'WEAPON_UPGRADE',
              completedMissionsCount: completedMissionsCount || 0,
              shipTier: ship.shipTier || 1,
              weaponLevel: nextWeaponLvl,
            },
            unlockedStoryChapterIds || []
          );
        }

        const nextUnlocked = chapterToTrigger
          ? Array.from(new Set([...(unlockedStoryChapterIds || []), chapterToTrigger.id]))
          : unlockedStoryChapterIds || [];

        set({
          player: updatedPlayer,
          ship: updatedShip,
          activeStorybookChapter: chapterToTrigger,
          unlockedStoryChapterIds: nextUnlocked,
          world: {
            ...world,
            enemies: rescaledEnemies,
          },
        });
        get().saveCurrentGame();
        return true;
      },

      upgradeShield: () => {
        const { ship, player } = get();
        const currentLvl = ship.shieldLevel || 1;
        if (currentLvl >= 5) return false;
        const cost = currentLvl * 400;
        if (player.credits < cost) return false;

        const newMaxShield = 100 + currentLvl * 25;
        SoundManager.playCash();
        set((state) => ({
          player: {
            ...state.player,
            credits: state.player.credits - cost,
          },
          ship: {
            ...state.ship,
            shieldLevel: currentLvl + 1,
            maxShield: newMaxShield,
            shield: newMaxShield,
          },
        }));
        return true;
      },

      upgradeEngine: () => {
        const { ship, player } = get();
        const currentLvl = ship.engineLevel || 1;
        if (currentLvl >= 5) return false;
        const cost = currentLvl * 350;
        if (player.credits < cost) return false;

        SoundManager.playCash();
        set((state) => ({
          player: {
            ...state.player,
            credits: state.player.credits - cost,
          },
          ship: {
            ...state.ship,
            engineLevel: currentLvl + 1,
          },
        }));
        return true;
      },

      upgradeShipChassis: () => {
        const { ship, player, mode, completedMissionsCount, unlockedStoryChapterIds } = get();
        const currentTier = ship.shipTier || 1;
        if (currentTier >= SHIP_CLASSES.length) return false;

        const nextClass = getShipClass(currentTier + 1);
        if (player.credits < nextClass.cost) return false;

        SoundManager.playCash();
        const newTier = currentTier + 1;
        const upgradedShip: Partial<ShipStats> = {
          shipTier: newTier,
          maxEscorts: getMaxEscortsForTier(newTier),
        };

        // Progressive ammo capacities across tiers (does NOT auto-grant weapons for free)
        if (newTier >= 2) {
          upgradedShip.maxTorpedoes = Math.max(ship.maxTorpedoes || 5, 10);
        }
        if (newTier >= 10) {
          upgradedShip.maxTorpedoes = Math.max(ship.maxTorpedoes || 10, 15);
        }
        if (newTier >= 14) {
          upgradedShip.maxTorpedoes = Math.max(ship.maxTorpedoes || 15, 25);
          upgradedShip.maxEmpCooldown = 5;
        }
        if (newTier >= 16) {
          upgradedShip.maxTorpedoes = Math.max(ship.maxTorpedoes || 25, 30);
        }
        if (newTier >= 17) {
          upgradedShip.maxTorpedoes = Math.max(ship.maxTorpedoes || 30, 35);
        }
        if (newTier >= 19) {
          upgradedShip.maxTorpedoes = Math.max(ship.maxTorpedoes || 35, 40);
        }
        if (newTier >= 22) {
          upgradedShip.maxTorpedoes = 50;
        }

        const updatedPlayer = {
          ...player,
          credits: player.credits - nextClass.cost,
          cargoCapacity: player.cargoCapacity + nextClass.cargoBonus,
          maxHull: player.maxHull + nextClass.hullBonus,
          hull: player.hull + nextClass.hullBonus,
          maxFuel: player.maxFuel + nextClass.fuelBonus,
          fuel: player.fuel + nextClass.fuelBonus,
        };

        const updatedShipStats = { ...ship, ...upgradedShip };
        const rescaledEnemies = get().world.enemies.map((e) =>
          createScaledEnemy(e.id, e.x, e.y, updatedPlayer, updatedShipStats, e.name)
        );

        let chapterToTrigger: StoryChapter | null = null;
        if (mode === 'STORY') {
          chapterToTrigger = getStoryChapterForEvent(
            {
              type: 'CHASSIS_UPGRADE',
              completedMissionsCount: completedMissionsCount || 0,
              shipTier: newTier,
              weaponLevel: ship.weaponLevel || 1,
            },
            unlockedStoryChapterIds || []
          );
        }

        const nextUnlocked = chapterToTrigger
          ? Array.from(new Set([...(unlockedStoryChapterIds || []), chapterToTrigger.id]))
          : unlockedStoryChapterIds || [];

        set((state) => ({
          player: updatedPlayer,
          activeStorybookChapter: chapterToTrigger,
          unlockedStoryChapterIds: nextUnlocked,
          ship: {
            ...state.ship,
            ...upgradedShip,
          },
          world: {
            ...state.world,
            enemies: rescaledEnemies,
          },
        }));

        get().saveCurrentGame();
        return true;
      },

      buyTorpedoLauncher: () => {
        const { player, ship } = get();
        if (ship.hasTorpedoLauncher) return false;
        // Prerequisite: Lasers Level 2+ AND Ship Tier 2+
        if ((ship.weaponLevel || 1) < 2 || (ship.shipTier || 1) < 2) return false;
        const cost = 750;
        if (player.credits < cost) return false;

        SoundManager.playCash();
        set((state) => ({
          player: { ...state.player, credits: state.player.credits - cost },
          ship: {
            ...state.ship,
            hasTorpedoLauncher: true,
            torpedoes: 5,
            maxTorpedoes: Math.max(state.ship.maxTorpedoes || 5, 5),
          },
        }));
        return true;
      },

      buyTorpedoAmmo: (qty) => {
        const { player, ship } = get();
        if (!ship.hasTorpedoLauncher) return false;
        const space = ship.maxTorpedoes - ship.torpedoes;
        const actualQty = Math.min(qty, space);
        if (actualQty <= 0) return false;
        const cost = actualQty * 45;
        if (player.credits < cost) return false;

        SoundManager.playCash();
        set((state) => ({
          player: { ...state.player, credits: state.player.credits - cost },
          ship: { ...state.ship, torpedoes: state.ship.torpedoes + actualQty },
        }));
        return true;
      },

      buyEmpGenerator: () => {
        const { player, ship } = get();
        if (ship.hasEmpGenerator) return false;
        // Prerequisite: Shields Level 3+ AND Ship Tier 4+
        if ((ship.shieldLevel || 1) < 3 || (ship.shipTier || 1) < 4) return false;
        const cost = 1200;
        if (player.credits < cost) return false;

        SoundManager.playCash();
        set((state) => ({
          player: { ...state.player, credits: state.player.credits - cost },
          ship: {
            ...state.ship,
            hasEmpGenerator: true,
            empCooldown: 0,
            maxEmpCooldown: state.ship.maxEmpCooldown || 8,
          },
        }));
        return true;
      },

      upgradeAutoTurrets: () => {
        const { player, ship } = get();
        if (ship.hasAutoTurrets) return false;
        // Prerequisite: Lasers Level 3+ AND Ship Tier 3+
        if ((ship.weaponLevel || 1) < 3 || (ship.shipTier || 1) < 3) return false;
        const cost = 950;
        if (player.credits < cost) return false;

        SoundManager.playCash();
        set((state) => ({
          player: { ...state.player, credits: state.player.credits - cost },
          ship: {
            ...state.ship,
            hasAutoTurrets: true,
            turretCooldown: 0,
          },
        }));
        return true;
      },

      buyBeamWeapon: () => {
        const { player, ship } = get();
        if (ship.hasBeamWeapon) return false;
        // Prerequisite: Ship Tier 6+ (Frigate or larger)
        if ((ship.shipTier || 1) < 6) return false;
        const cost = 2800;
        if (player.credits < cost) return false;

        SoundManager.playCash();
        set((state) => ({
          player: { ...state.player, credits: state.player.credits - cost },
          ship: {
            ...state.ship,
            hasBeamWeapon: true,
            beamTargetId: null,
          },
        }));
        return true;
      },

      toggleArmadaStance: () => {
        const current = get().ship.armadaStance || 'DEFEND';
        const next: EscortStance = current === 'DEFEND' ? 'ATTACK' : 'DEFEND';
        SoundManager.playLaser(true);
        set((state) => ({
          ship: {
            ...state.ship,
            armadaStance: next,
          },
        }));
      },

      buyEscortShip: (type: EscortType) => {
        const { player, ship } = get();
        const tier = ship.shipTier || 1;
        const maxAllowed = getMaxEscortsForTier(tier);
        const currentEscorts = ship.escorts || [];
        if (currentEscorts.length >= maxAllowed) return false;

        const escortDef = getEscortClass(type);
        if (tier < escortDef.minShipTier) return false;
        if (player.credits < escortDef.cost) return false;

        SoundManager.playCash();
        const escortIdx = currentEscorts.length;
        const formAng = (escortIdx / Math.max(1, maxAllowed)) * Math.PI * 2;
        const formDist = 52 + (ship.shipTier || 1) * 4;

        const newEscort: EscortShip = {
          id: `escort_player_${Date.now()}_${Math.random()}`,
          name: `${escortDef.name} [Wing-${escortIdx + 1}]`,
          type,
          owner: 'PLAYER',
          x: ship.x + Math.cos(formAng) * formDist,
          y: ship.y + Math.sin(formAng) * formDist,
          vx: ship.vx,
          vy: ship.vy,
          rotation: ship.rotation,
          hull: escortDef.hull,
          maxHull: escortDef.hull,
          shield: escortDef.shield,
          maxShield: escortDef.shield,
          fireCooldown: escortDef.fireCooldown,
          formationAngle: formAng,
          formationDist: formDist,
          targetEnemyId: null,
        };

        const updatedEscorts = [...currentEscorts, newEscort];
        set((state) => ({
          player: {
            ...state.player,
            credits: state.player.credits - escortDef.cost,
          },
          ship: {
            ...state.ship,
            escorts: updatedEscorts,
            maxEscorts: maxAllowed,
          },
          world: {
            ...state.world,
            escorts: [...(state.world.escorts || []).filter((e) => e.owner !== 'PLAYER'), ...updatedEscorts],
          },
        }));
        get().saveCurrentGame();
        return true;
      },

      sellEscortShip: (escortId: string) => {
        const { ship, world } = get();
        const escort =
          (ship.escorts || []).find((e) => e.id === escortId) ||
          (world.escorts || []).find((e) => e.id === escortId && e.owner === 'PLAYER');
        if (!escort) return 0;

        const escortDef = getEscortClass(escort.type);
        const refundCredits = Math.round(escortDef.cost * 0.7);

        const updatedShipEscorts = (ship.escorts || []).filter((e) => e.id !== escortId);
        const updatedWorldEscorts = (world.escorts || []).filter((e) => e.id !== escortId);

        SoundManager.playCash();

        set((state) => ({
          player: {
            ...state.player,
            credits: state.player.credits + refundCredits,
          },
          ship: {
            ...state.ship,
            escorts: updatedShipEscorts,
          },
          world: {
            ...state.world,
            escorts: updatedWorldEscorts,
          },
        }));

        get().saveCurrentGame();
        return refundCredits;
      },

      repairEscorts: () => {
        const { player, ship } = get();
        const escorts = ship.escorts || [];
        if (escorts.length === 0) return false;

        let totalDmg = 0;
        for (const esc of escorts) {
          totalDmg += (esc.maxHull - esc.hull) + (esc.maxShield - esc.shield);
        }
        if (totalDmg <= 0) return false;

        const cost = Math.round(totalDmg * 2.5);
        if (player.credits < cost) return false;

        SoundManager.playCash();
        const repaired = escorts.map((esc) => ({
          ...esc,
          hull: esc.maxHull,
          shield: esc.maxShield,
        }));

        set((state) => ({
          player: {
            ...state.player,
            credits: state.player.credits - cost,
          },
          ship: {
            ...state.ship,
            escorts: repaired,
          },
          world: {
            ...state.world,
            escorts: [...(state.world.escorts || []).filter((e) => e.owner !== 'PLAYER'), ...repaired],
          },
        }));
        return true;
      },

      dismissEscort: (escortId: string) => {
        const { ship } = get();
        const updated = (ship.escorts || []).filter((e) => e.id !== escortId);
        set((state) => ({
          ship: { ...state.ship, escorts: updated },
          world: { ...state.world, escorts: (state.world.escorts || []).filter((e) => e.id !== escortId) },
        }));
      },

      updateWorldEscorts: (escorts: EscortShip[]) => {
        const playerEscorts = escorts.filter((e) => e.owner === 'PLAYER');
        set((state) => ({
          ship: { ...state.ship, escorts: playerEscorts },
          world: { ...state.world, escorts },
        }));
      },

      damageEscort: (escortId: string, rawDamage: number, stunDuration?: number) => {
        const { world, ship } = get();
        const escort = (world.escorts || []).find((e) => e.id === escortId);
        if (!escort) return { destroyed: false };

        let remaining = rawDamage;
        let shield = escort.shield;
        let hull = escort.hull;
        const newStun = stunDuration ? Math.max(escort.stunDuration || 0, stunDuration) : escort.stunDuration;

        if (shield > 0) {
          if (shield >= remaining) {
            shield -= remaining;
            remaining = 0;
          } else {
            remaining -= shield;
            shield = 0;
          }
        }

        if (remaining > 0) {
          hull = Math.max(0, hull - remaining);
        }

        if (hull <= 0) {
          SoundManager.playExplosion();
          const remainingWorldEscorts = (world.escorts || []).filter((e) => e.id !== escortId);
          const remainingPlayerEscorts = (ship.escorts || []).filter((e) => e.id !== escortId);
          const escortDrops = escort.owner === 'ENEMY' ? generateEscortSalvage(escort) : [];
          const bountyReward = escort.owner === 'ENEMY' ? 75 : 0;

          set((s) => ({
            player: {
              ...s.player,
              credits: s.player.credits + bountyReward,
            },
            ship: { ...s.ship, escorts: remainingPlayerEscorts },
            world: {
              ...s.world,
              escorts: remainingWorldEscorts,
              floatingLoot: [...(s.world.floatingLoot || []), ...escortDrops],
            },
          }));
          return { destroyed: true, escort: { ...escort, hull: 0, shield: 0 } };
        }

        const updatedWorldEscorts = (world.escorts || []).map((e) =>
          e.id === escortId ? { ...e, hull, shield, stunDuration: newStun } : e
        );
        const updatedPlayerEscorts = (ship.escorts || []).map((e) =>
          e.id === escortId ? { ...e, hull, shield, stunDuration: newStun } : e
        );

        set((s) => ({
          ship: { ...s.ship, escorts: updatedPlayerEscorts },
          world: { ...s.world, escorts: updatedWorldEscorts },
        }));

        return { destroyed: false, escort: { ...escort, hull, shield, stunDuration: newStun } };
      },

      fireTorpedo: () => {
        const { ship } = get();
        if (!ship.hasTorpedoLauncher || ship.torpedoes <= 0) return false;
        set((state) => ({
          ship: { ...state.ship, torpedoes: state.ship.torpedoes - 1 },
        }));
        return true;
      },

      triggerEmpWave: () => {
        const { ship } = get();
        if (!ship.hasEmpGenerator || ship.empCooldown > 0) return false;
        set((state) => ({
          ship: { ...state.ship, empCooldown: state.ship.maxEmpCooldown || 8 },
        }));
        return true;
      },

      launchReconDrone: () => {
        const { ship, world } = get();
        if ((ship.drones || 0) <= 0 || (ship.droneCooldown || 0) > 0) return false;

        SoundManager.playLaser(false);
        const currentDrones = world.drones || [];
        const count = currentDrones.length;
        const orbitAngle = count * ((Math.PI * 2) / 3);
        const orbitRadius = 85 + (count % 2) * 25;

        const newDrone: DefenseDrone = {
          id: `drone_${Date.now()}_${Math.random()}`,
          orbitAngle,
          orbitRadius,
          orbitSpeed: 2.2,
          x: ship.x + Math.cos(orbitAngle) * orbitRadius,
          y: ship.y + Math.sin(orbitAngle) * orbitRadius,
          vx: 0,
          vy: 0,
          rotation: orbitAngle + Math.PI / 2,
          fireCooldown: 0.3,
          lifetime: 60,
          maxLifetime: 60,
          shield: 60,
          maxShield: 60,
        };

        set((state) => ({
          ship: {
            ...state.ship,
            drones: Math.max(0, (state.ship.drones || 0) - 1),
            droneCooldown: 2.5,
          },
          world: {
            ...state.world,
            drones: [...(state.world.drones || []), newDrone],
          },
        }));
        return true;
      },

      buyDrones: (qty) => {
        const { player, ship } = get();
        const space = (ship.maxDrones || 5) - (ship.drones || 0);
        const actual = Math.min(qty, space);
        if (actual <= 0) return false;
        const cost = actual * 60;
        if (player.credits < cost) return false;

        SoundManager.playCash();
        set((state) => ({
          player: { ...state.player, credits: state.player.credits - cost },
          ship: { ...state.ship, drones: (state.ship.drones || 0) + actual },
        }));
        return true;
      },

      updateWorldDrones: (drones) => {
        set((state) => ({
          world: {
            ...state.world,
            drones,
          },
        }));
      },

      addPointOfInterest: (poi) => {
        set((state) => {
          const existing = (state.world.pointsOfInterest || []).filter(
            (p) => p.id !== poi.id && Math.hypot(p.x - poi.x, p.y - poi.y) > 400
          );
          return {
            world: {
              ...state.world,
              pointsOfInterest: [...existing, poi],
            },
          };
        });
      },

      updatePointsOfInterest: (dt, playerX, playerY) => {
        set((state) => {
          const updated = (state.world.pointsOfInterest || [])
            .map((p) => ({
              ...p,
              lifetime: p.lifetime - dt,
              distance: Math.round(Math.hypot(p.x - playerX, p.y - playerY)),
            }))
            .filter((p) => p.lifetime > 0);
          return {
            world: {
              ...state.world,
              pointsOfInterest: updated,
            },
          };
        });
      },

      dismissPointOfInterest: (poiId) => {
        set((state) => ({
          world: {
            ...state.world,
            pointsOfInterest: (state.world.pointsOfInterest || []).filter((p) => p.id !== poiId),
          },
        }));
      },

      checkAndGenerateClusters: (playerX, playerY) => {
        const { world, player, ship } = get();
        const CELL_SIZE = 3500;
        const currentCellX = Math.round(playerX / CELL_SIZE);
        const currentCellY = Math.round(playerY / CELL_SIZE);

        const explored = new Set(world.exploredCells || ['0,0']);
        const newlyGeneratedStations: Station[] = [];
        const newlyGeneratedAsteroids: Asteroid[] = [];
        const newlyGeneratedEnemies: Enemy[] = [];
        const newKeys: string[] = [];

        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const cx = currentCellX + dx;
            const cy = currentCellY + dy;
            const key = `${cx},${cy}`;
            if (!explored.has(key)) {
              explored.add(key);
              newKeys.push(key);
              const generated = generateClusterCell(cx, cy, world.sector, player, ship);
              newlyGeneratedStations.push(...generated.stations);
              newlyGeneratedAsteroids.push(...generated.asteroids);
              newlyGeneratedEnemies.push(...generated.enemies);
            }
          }
        }

        if (newKeys.length > 0) {
          // Spatial culling: prune entities that are too far from the player to prevent memory and physics bloat
          const MAX_ENEMY_DIST = 4500;
          const MAX_ASTEROID_DIST = 6000;
          const MAX_STATION_DIST = 8000;

          const keptEnemies = (world.enemies || []).filter(
            (e) => Math.hypot(e.x - playerX, e.y - playerY) < MAX_ENEMY_DIST
          );
          const keptAsteroids = (world.asteroids || []).filter(
            (a) => Math.hypot(a.x - playerX, a.y - playerY) < MAX_ASTEROID_DIST
          );
          const keptStations = (world.stations || []).filter(
            (s) => Math.hypot(s.x - playerX, s.y - playerY) < MAX_STATION_DIST
          );

          // Merge & cap
          const combinedEnemies = [...keptEnemies, ...newlyGeneratedEnemies].slice(0, 10);
          const combinedAsteroids = [...keptAsteroids, ...newlyGeneratedAsteroids].slice(0, 75);
          const combinedStations = [...keptStations, ...newlyGeneratedStations].slice(0, 10);

          set((state) => ({
            world: {
              ...state.world,
              stations: combinedStations,
              asteroids: combinedAsteroids,
              enemies: combinedEnemies,
              exploredCells: Array.from(explored).slice(-40),
            },
          }));
        }
      },

      updateHyperJump: (dt) => {
        const { isHyperJumping, hyperJumpProgress } = get();
        if (!isHyperJumping) return;
        const next = hyperJumpProgress + dt * 0.5;
        if (next >= 1.0) {
          set({ isHyperJumping: false, hyperJumpProgress: 0 });
        } else {
          set({ hyperJumpProgress: next });
        }
      },

      buyFoodRations: (qty) => {
        const { player } = get();
        const pricePerUnit = 35;
        const totalCost = pricePerUnit * qty;
        if (player.credits < totalCost) return false;

        const currentCargo = player.inventory.reduce((sum, item) => sum + item.quantity, 0);
        if (currentCargo + qty > player.cargoCapacity) return false;

        const existing = player.inventory.find((i) => i.id === 'food_packs');
        let updatedInventory: InventoryItem[];

        if (existing) {
          const totalQty = existing.quantity + qty;
          const weightedCost = existing.quantity * existing.avgBuyPrice + totalCost;
          updatedInventory = player.inventory.map((item) =>
            item.id === 'food_packs'
              ? { ...item, quantity: totalQty, avgBuyPrice: Math.round(weightedCost / totalQty) }
              : item
          );
        } else {
          updatedInventory = [
            ...player.inventory,
            {
              id: 'food_packs',
              name: 'Hydro-Ration Packs',
              quantity: qty,
              avgBuyPrice: pricePerUnit,
              category: 'FOOD',
            },
          ];
        }

        SoundManager.playCash();
        set((state) => ({
          player: {
            ...state.player,
            credits: state.player.credits - totalCost,
            inventory: updatedInventory,
          },
          market: {
            ...state.market,
            commodities: state.market.commodities.map((c) =>
              c.id === 'food_packs' ? { ...c, quantity: Math.max(0, c.quantity - qty) } : c
            ),
          },
        }));
        return true;
      },

      damagePlayer: (rawDamage) => {
        const { ship, player } = get();
        let remainingDmg = rawDamage;
        let newShield = ship.shield;
        let newHull = player.hull;

        if (newShield > 0) {
          SoundManager.playHit(true);
          if (newShield >= remainingDmg) {
            newShield -= remainingDmg;
            remainingDmg = 0;
          } else {
            remainingDmg -= newShield;
            newShield = 0;
          }
        }

        if (remainingDmg > 0) {
          SoundManager.playHit(false);
          newHull = Math.max(0, newHull - remainingDmg);
        }

        if (newHull <= 0) {
          SoundManager.playExplosion();
          set({
            player: { ...player, hull: 0 },
            ship: { ...ship, shield: 0 },
            gameStatus: 'GAMEOVER',
          });
          return;
        }

        set({
          player: { ...player, hull: newHull },
          ship: { ...ship, shield: newShield },
        });
      },

      damageEnemy: (enemyId, rawDamage, isExplosive = false, stunDuration?: number) => {
        const { world } = get();
        const enemy = world.enemies.find((e) => e.id === enemyId);
        if (!enemy) return { destroyed: false };

        // Armor rating on Cruisers / Battleships / Colossuses reduces direct laser fire
        // Torpedo explosive AOE and EMP shockwaves bypass armor!
        const armorReduction = isExplosive ? 0 : (enemy.armorRating || 0);
        const effectiveDamage = Math.max(1, Math.round(rawDamage * (1 - armorReduction)));
        const newStun = stunDuration ? Math.max(enemy.stunDuration || 0, stunDuration) : enemy.stunDuration;

        let remaining = effectiveDamage;
        let shield = enemy.shield;
        let hull = enemy.hull;

        if (shield > 0) {
          if (shield >= remaining) {
            shield -= remaining;
            remaining = 0;
          } else {
            remaining -= shield;
            shield = 0;
          }
        }

        if (remaining > 0) {
          hull = Math.max(0, hull - remaining);
        }

        if (hull <= 0) {
          SoundManager.playExplosion();
          // Drop loot & bounty
          const bountyReward = enemy.bounty;
          const survivingList = (world.enemies || []).filter((e: Enemy) => e.id !== enemyId);

          logger.log('COMBAT', `Hostile Destroyed: [${enemy.category || enemy.type}] ${enemy.name}`, {
            id: enemy.id,
            category: enemy.category,
            coords: `(${Math.round(enemy.x)}, ${Math.round(enemy.y)})`,
            bounty: bountyReward,
            survivingCount: survivingList.length,
            survivingIds: survivingList.map((e: Enemy) => e.id),
          });

          // Spawn multi-pod salvage drops scaled to enemy tier & category
          const salvageDrops = generateEnemySalvage(enemy);

          // Exploding capital ship shockwave blast damages attached and nearby enemy escorts!
          const blastRadius = 240;
          const attachedEscortDrops: FloatingLoot[] = [];
          const remainingWorldEscorts: EscortShip[] = [];

          for (const esc of world.escorts || []) {
            if (
              esc.owner === 'ENEMY' &&
              (esc.leaderId === enemyId || Math.hypot(esc.x - enemy.x, esc.y - enemy.y) < blastRadius)
            ) {
              const blastDamage = 95; // Heavy shockwave blast
              let escHull = esc.hull;
              let escShield = esc.shield;
              let remDmg = blastDamage;
              if (escShield > 0) {
                if (escShield >= remDmg) {
                  escShield -= remDmg;
                  remDmg = 0;
                } else {
                  remDmg -= escShield;
                  escShield = 0;
                }
              }
              if (remDmg > 0) {
                escHull = Math.max(0, escHull - remDmg);
              }

              if (escHull <= 0) {
                // Escort obliterated in capital explosion
                attachedEscortDrops.push(...generateEscortSalvage(esc));
              } else {
                // Survived blast with remaining HP: severed leader link, becomes hostile rogue escort
                remainingWorldEscorts.push({
                  ...esc,
                  hull: escHull,
                  shield: escShield,
                  leaderId: undefined,
                });
              }
            } else {
              remainingWorldEscorts.push(esc);
            }
          }

          set((s) => ({
            player: {
              ...s.player,
              credits: s.player.credits + bountyReward,
            },
            world: {
              ...s.world,
              enemies: s.world.enemies.filter((e) => e.id !== enemyId),
              escorts: remainingWorldEscorts,
              floatingLoot: [...s.world.floatingLoot, ...salvageDrops, ...attachedEscortDrops],
            },
          }));

          get().progressMissionKill(enemy.category);

          return { destroyed: true, enemy };
        }

        set((state) => ({
          world: {
            ...state.world,
            enemies: state.world.enemies.map((e) =>
              e.id === enemyId ? { ...e, hull, shield, stunDuration: newStun } : e
            ),
          },
        }));

        return { destroyed: false };
      },

      damageAsteroid: (asteroidId, rawDamage) => {
        const { world, ship } = get();
        const asteroid = world.asteroids.find((a) => a.id === asteroidId);
        if (!asteroid) return { destroyed: false };

        const newHealth = Math.max(0, asteroid.health - rawDamage);

        if (newHealth <= 0) {
          SoundManager.playExplosion();
          // Scale asteroid mineral yields with player ship tier (+18% yield per tier)
          const playerTier = ship.shipTier || 1;
          const tierYieldMultiplier = 1.0 + (playerTier - 1) * 0.18;
          const totalYield = Math.max(2, Math.round(asteroid.oreYield * 1.5 * tierYieldMultiplier));
          const minDef = getMineral(asteroid.oreType);
          const drops: FloatingLoot[] = [];

          if (totalYield > 12) {
            const numPods = Math.min(6, Math.ceil(totalYield / 8));
            const basePerPod = Math.floor(totalYield / numPods);
            let rem = totalYield % numPods;
            for (let i = 0; i < numPods; i++) {
              const qty = basePerPod + (rem > 0 ? 1 : 0);
              if (rem > 0) rem--;
              drops.push({
                id: `loot_ore_${Date.now()}_${i}_${Math.random()}`,
                x: asteroid.x + (Math.random() - 0.5) * 35,
                y: asteroid.y + (Math.random() - 0.5) * 35,
                vx: (Math.random() - 0.5) * 65,
                vy: (Math.random() - 0.5) * 65,
                lootType: 'CARGO',
                item: {
                  id: minDef.id,
                  name: minDef.name,
                  quantity: qty,
                  avgBuyPrice: minDef.unitValue,
                  category: 'ORE',
                },
                lifetime: 60,
              });
            }
          } else {
            drops.push({
              id: `loot_ore_${Date.now()}_0_${Math.random()}`,
              x: asteroid.x + (Math.random() - 0.5) * 20,
              y: asteroid.y + (Math.random() - 0.5) * 20,
              vx: (Math.random() - 0.5) * 45,
              vy: (Math.random() - 0.5) * 45,
              lootType: 'CARGO',
              item: {
                id: minDef.id,
                name: minDef.name,
                quantity: totalYield,
                avgBuyPrice: minDef.unitValue,
                category: 'ORE',
              },
              lifetime: 55,
            });
          }

          set((state) => ({
            world: {
              ...state.world,
              asteroids: state.world.asteroids.filter((a) => a.id !== asteroidId),
              floatingLoot: [...state.world.floatingLoot, ...drops],
            },
          }));

          return { destroyed: true, oreYield: totalYield, oreType: asteroid.oreType };
        }

        set((state) => ({
          world: {
            ...state.world,
            asteroids: state.world.asteroids.map((a) =>
              a.id === asteroidId ? { ...a, health: newHealth } : a
            ),
          },
        }));

        return { destroyed: false };
      },

      updateEnemies: (enemies) => {
        set((state) => ({
          world: { ...state.world, enemies },
        }));
      },

      spawnEnemyWave: () => {
        const { player, ship, world } = get();
        // Prune distant enemies first (> 3500px away)
        const activeEnemies = (world.enemies || []).filter(
          (e) => Math.hypot(e.x - ship.x, e.y - ship.y) < 3500
        );

        if (activeEnemies.length >= 6) {
          if (activeEnemies.length !== world.enemies.length) {
            set((state) => ({ world: { ...state.world, enemies: activeEnemies } }));
          }
          return;
        }

        const newEnemies: Enemy[] = [];
        const count = Math.min(2, 6 - activeEnemies.length);
        for (let i = 0; i < count; i++) {
          const spawnAngle = Math.random() * Math.PI * 2;
          const spawnDist = 1100 + Math.random() * 400;
          const ex = ship.x + Math.cos(spawnAngle) * spawnDist;
          const ey = ship.y + Math.sin(spawnAngle) * spawnDist;
          newEnemies.push(createScaledEnemy(`enemy_wave_${Date.now()}_${i}`, ex, ey, player, ship));
        }

        logger.log('STATE', `Reinforcement Wave Spawned (+${newEnemies.length} hostiles)`, {
          totalEnemies: activeEnemies.length + newEnemies.length,
          spawned: newEnemies.map((e) => `${e.category || e.type} (${Math.round(e.x)}, ${Math.round(e.y)})`),
        });

        const newEscorts: EscortShip[] = [];
        newEnemies.forEach((e) => {
          if (e.escorts && e.escorts.length > 0) {
            newEscorts.push(...e.escorts);
          }
        });

        const combinedEnemies = [...activeEnemies, ...newEnemies].slice(0, 8);
        const combinedEscorts = [...(world.escorts || []), ...newEscorts].slice(0, 10);

        set((state) => ({
          world: {
            ...state.world,
            enemies: combinedEnemies,
            escorts: combinedEscorts,
          },
        }));
      },

      addProjectile: (proj) => {
        set((state) => ({
          world: {
            ...state.world,
            projectiles: [...state.world.projectiles, proj],
          },
        }));
      },

      updateProjectiles: (dt) => {
        set((state) => ({
          world: {
            ...state.world,
            projectiles: state.world.projectiles
              .map((p) => ({
                ...p,
                x: p.x + p.vx * dt,
                y: p.y + p.vy * dt,
                lifetime: p.lifetime - dt,
              }))
              .filter((p) => p.lifetime > 0),
          },
        }));
      },

      spawnFloatingLoot: (loot) => {
        set((state) => ({
          world: {
            ...state.world,
            floatingLoot: [...state.world.floatingLoot, loot],
          },
        }));
      },

      collectLoot: (lootId) => {
        const { world, player } = get();
        const loot = world.floatingLoot.find((l) => l.id === lootId);
        if (!loot) return false;

        const type = loot.lootType || 'CARGO';

        // 1. Instant Credit Voucher Pod
        if (type === 'CREDITS') {
          const amount = loot.creditsValue || loot.item.quantity || 100;
          SoundManager.playCash();
          logger.log('STATE', `Salvage Collected: +${amount} Credits`);
          set((state) => ({
            player: {
              ...state.player,
              credits: state.player.credits + amount,
            },
            world: {
              ...state.world,
              floatingLoot: state.world.floatingLoot.filter((l) => l.id !== lootId),
            },
          }));
          return true;
        }

        // 2. Torpedo Ordnance Pod
        if (type === 'MISSILES') {
          const count = loot.missilesCount || loot.item.quantity || 1;
          SoundManager.playCash();
          logger.log('STATE', `Salvage Collected: +${count} Torpedo Munitions`);
          set((state) => ({
            ship: {
              ...state.ship,
              torpedoes: Math.min(state.ship.maxTorpedoes, state.ship.torpedoes + count),
            },
            world: {
              ...state.world,
              floatingLoot: state.world.floatingLoot.filter((l) => l.id !== lootId),
            },
          }));
          return true;
        }

        // 3. Fuel Canister Pod
        if (type === 'FUEL') {
          const amount = loot.fuelAmount || loot.item.quantity || 25;
          SoundManager.playCash();
          logger.log('STATE', `Salvage Collected: +${amount} Fuel`);
          set((state) => ({
            player: {
              ...state.player,
              fuel: Math.min(state.player.maxFuel, state.player.fuel + amount),
            },
            world: {
              ...state.world,
              floatingLoot: state.world.floatingLoot.filter((l) => l.id !== lootId),
            },
          }));
          return true;
        }

        // 4. Nanite Hull Repair Pod
        if (type === 'REPAIR') {
          const amount = loot.repairAmount || loot.item.quantity || 30;
          SoundManager.playCash();
          logger.log('STATE', `Salvage Collected: +${amount} Nanite Hull Repair`);
          set((state) => ({
            player: {
              ...state.player,
              hull: Math.min(state.player.maxHull, state.player.hull + amount),
            },
            world: {
              ...state.world,
              floatingLoot: state.world.floatingLoot.filter((l) => l.id !== lootId),
            },
          }));
          return true;
        }

        // 5. Physical Trade Cargo / Ores (Requires available cargo bay capacity)
        const currentCargo = player.inventory.reduce((sum, item) => sum + item.quantity, 0);
        if (currentCargo + loot.item.quantity > player.cargoCapacity) {
          return false; // Cargo bay is full!
        }

        SoundManager.playCash();
        logger.log('STATE', `Salvage Collected: ${loot.item.name} x${loot.item.quantity}`);

        const existing = player.inventory.find((i) => i.id === loot.item.id);
        let updatedInventory: InventoryItem[];

        if (existing) {
          updatedInventory = player.inventory.map((item) =>
            item.id === loot.item.id
              ? { ...item, quantity: item.quantity + loot.item.quantity }
              : item
          );
        } else {
          updatedInventory = [...player.inventory, loot.item];
        }

        set((state) => ({
          player: {
            ...state.player,
            inventory: updatedInventory,
          },
          world: {
            ...state.world,
            floatingLoot: state.world.floatingLoot.filter((l) => l.id !== lootId),
          },
        }));

        if (loot.item.category === 'ORE') {
          get().progressMissionMining(loot.item.id, loot.item.quantity);
        }

        return true;
      },

      setCombatAlert: (alert) => set({ combatAlert: alert }),

      jumpSector: () => {
        const currentNum = parseInt(get().world.currentSectorId.replace('Sector-0', '')) || 1;
        const nextSectorId = `Sector-0${currentNum + 1}`;
        const nextSectorData = generateSector(nextSectorId);
        const { player, ship } = get();
        const scaledEnemies = nextSectorData.enemies.map((e) =>
          createScaledEnemy(e.id, e.x, e.y, player, ship, e.name)
        );

        SoundManager.playDock();

        set((state) => ({
          isHyperJumping: true,
          hyperJumpProgress: 0,
          world: {
            ...state.world,
            currentSectorId: nextSectorId,
            sector: nextSectorData.sector,
            stations: nextSectorData.stations,
            asteroids: nextSectorData.asteroids,
            enemies: scaledEnemies,
            projectiles: [],
            floatingLoot: [],
            drones: [],
            pointsOfInterest: [],
            exploredCells: ['0,0'],
          },
          ship: {
            ...state.ship,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
          },
        }));
        get().saveCurrentGame();
      },

      setPaused: (paused: boolean) => {
        if (paused) {
          SoundManager.updateThruster(false);
        }
        set({ isPaused: paused });
      },

      togglePause: () => {
        const { isPaused, gameStatus } = get();
        if (gameStatus === 'MENU' || gameStatus === 'GAMEOVER') return;
        const next = !isPaused;
        if (next) {
          SoundManager.updateThruster(false);
        }
        set({ isPaused: next });
      },

      setDiagnosticsOpen: (open: boolean) => {
        if (open) {
          SoundManager.updateThruster(false);
        }
        set({ isDiagnosticsOpen: open });
      },

      toggleDiagnostics: () => {
        const { isDiagnosticsOpen } = get();
        const next = !isDiagnosticsOpen;
        if (next) {
          SoundManager.updateThruster(false);
        }
        set({ isDiagnosticsOpen: next });
      },

      returnToMainMenu: () => {
        SoundManager.updateThruster(false);
        set({
          gameStatus: 'MENU',
          isPaused: false,
          isDiagnosticsOpen: false,
        });
      },

      resetGame: () => {
        const fresh = getInitialState();
        const sectorData = generateSector('Sector-01');
        fresh.world.sector = sectorData.sector;
        fresh.world.stations = sectorData.stations;
        fresh.world.asteroids = sectorData.asteroids;
        fresh.world.enemies = sectorData.enemies.map((e) =>
          createScaledEnemy(e.id, e.x, e.y, fresh.player, fresh.ship, e.name)
        );
        set(fresh);
      },
    }),
    {
      name: 'galactic-ronin-storage',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Self-healing: Ensure world and sector are fully intact
        if (!state.world || !state.world.sector || !state.world.sector.theme) {
          const freshSector = generateSector('Sector-01');
          state.world = {
            currentSectorId: 'Sector-01',
            sector: freshSector.sector,
            stations: freshSector.stations,
            asteroids: freshSector.asteroids,
            enemies: freshSector.enemies,
            projectiles: [],
            floatingLoot: [],
            drones: [],
            escorts: [],
            pointsOfInterest: [],
            exploredCells: ['0,0'],
          };
        } else {
          // Ensure all array properties exist and cap stored enemies to healthy limits
          state.world.stations = (state.world.stations || []).slice(0, 10);
          state.world.asteroids = (state.world.asteroids || []).slice(0, 80);
          state.world.enemies = (state.world.enemies || []).slice(0, 8);
          state.world.projectiles = [];
          state.world.floatingLoot = (state.world.floatingLoot || []).slice(0, 30);
          state.world.drones = (state.world.drones || []).slice(0, 5);
          state.world.escorts = (state.world.escorts || []).slice(0, 10);
          state.world.pointsOfInterest = state.world.pointsOfInterest || [];
          state.world.exploredCells = state.world.exploredCells || ['0,0'];
        }

        if (state.ship) {
          state.ship.escorts = state.ship.escorts || [];
          state.ship.armadaStance = state.ship.armadaStance || 'DEFEND';
          state.ship.maxEscorts = getMaxEscortsForTier(state.ship.shipTier || 1);
        }

        // Self-healing: If player was left dead in storage, restore survival hull
        if (state.player && (state.player.hull <= 0 || !state.player.hull)) {
          state.player.hull = state.player.maxHull || 100;
        }
        if (state.ship && (state.ship.shield <= 0 || !state.ship.shield)) {
          state.ship.shield = state.ship.maxShield || 100;
        }
        // If persisted in GAMEOVER status, reset to MENU so player can continue safely
        if (state.gameStatus === 'GAMEOVER') {
          state.gameStatus = 'MENU';
        }
      },
      partialize: (state) => ({
        player: state.player,
        ship: {
          ...state.ship,
          vx: 0,
          vy: 0,
          isThrusting: false,
          isMining: false,
        },
        world: {
          currentSectorId: state.world.currentSectorId,
          sector: state.world.sector,
          stations: state.world.stations,
          asteroids: state.world.asteroids,
          enemies: state.world.enemies,
          projectiles: [],
          floatingLoot: state.world.floatingLoot,
        },
        soundEnabled: state.soundEnabled,
        musicEnabled: state.musicEnabled,
        sfxEnabled: state.sfxEnabled,
        invertFlightControls: state.invertFlightControls,
      }),
    }
  )
);
