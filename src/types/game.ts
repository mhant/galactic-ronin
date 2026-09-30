export type GameStatus = 'MENU' | 'EXPLORING' | 'STATION' | 'MINING' | 'COMBAT' | 'GAMEOVER' | 'VICTORY';

export type StationType = 'MINING' | 'AGRICULTURAL' | 'INDUSTRIAL' | 'HIGH_TECH' | 'OUTLAW';

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
  category: 'ORE' | 'FOOD' | 'TECH' | 'CONTRABAND' | 'INDUSTRIAL';
}

export interface MarketItem {
  id: string;
  name: string;
  description: string;
  category: 'ORE' | 'FOOD' | 'TECH' | 'CONTRABAND' | 'INDUSTRIAL';
  buyPrice: number;    // Price player pays to buy
  sellPrice: number;   // Price player receives when selling
  quantity: number;    // Stock at station
  illegal?: boolean;
}

export interface Station {
  id: string;
  name: string;
  type: StationType;
  x: number;
  y: number;
  radius: number;
  color: string;
  description: string;
  fuelPricePerUnit: number;
  repairPricePerPoint: number;
}

export interface AsteroidVertex {
  angle: number;
  distance: number;
}

export interface Asteroid {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotSpeed: number;
  oreType: string;
  oreYield: number;
  maxYield: number;
  health: number;
  maxHealth: number;
  vertices: AsteroidVertex[];
}

export interface Enemy {
  id: string;
  name: string;
  type: 'PIRATE_SCOUT' | 'RAIDER_CORVETTE' | 'OUTLAW_BOSS';
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  bounty: number;
  fireCooldown: number;
  aggroDistance: number;
}

export interface Projectile {
  id: string;
  owner: 'PLAYER' | 'ENEMY';
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  lifetime: number;
  color: string;
}

export interface FloatingLoot {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  item: InventoryItem;
  lifetime: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  lifetime: number;
  maxLifetime: number;
}

export interface PlayerStats {
  credits: number;
  hull: number;
  maxHull: number;
  fuel: number;
  maxFuel: number;
  cargoCapacity: number;
  inventory: InventoryItem[];
}

export interface ShipStats {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  weaponPower: number; // 1 to 5
  shieldPower: number; // 1 to 5
  enginePower: number; // 1 to 5
  weaponLevel: number; // Upgrade tier 1-5
  shieldLevel: number; // Upgrade tier 1-5
  engineLevel: number; // Upgrade tier 1-5
  shipTier: number;    // 1: Scout, 2: Heavy Frigate, 3: Battlecruiser
  shield: number;
  maxShield: number;
  isThrusting: boolean;
  isMining: boolean;
}

export interface Sector {
  id: string;
  name: string;
  dangerLevel: number;
  width: number;
  height: number;
}

export interface GameState {
  player: PlayerStats;
  ship: ShipStats;
  world: {
    currentSectorId: string;
    sector: Sector;
    stations: Station[];
    asteroids: Asteroid[];
    enemies: Enemy[];
    projectiles: Projectile[];
    floatingLoot: FloatingLoot[];
  };
  market: {
    activeStationId: string | null;
    commodities: MarketItem[];
  };
  gameStatus: GameStatus;
  soundEnabled: boolean;
  combatAlert: boolean;
}
