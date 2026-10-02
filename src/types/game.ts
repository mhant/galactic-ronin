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
  mineralPriceMultipliers?: Record<string, number>;
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

export type EscortType =
  | 'FIGHTER'
  | 'GUNSHIP'
  | 'MINING_BARGE'
  | 'FRIGATE'
  | 'MISSILE_CRUISER'
  | 'DESTROYER'
  | 'SHIELD_PROJECTOR'
  | 'BATTLECRUISER'
  | 'REPAIR_TENDER'
  | 'RONIN_WARMASTER';

export type EscortStance = 'ATTACK' | 'DEFEND';

export interface EscortClassDefinition {
  type: EscortType;
  name: string;
  minShipTier: number;
  cost: number;
  hull: number;
  shield: number;
  fireCooldown: number;
  damage: number;
  color: string;
  description: string;
  perks: string;
  isSpecialty?: boolean;
  specialtyRole?: string;
}

export interface EscortShip {
  id: string;
  name: string;
  type: EscortType;
  owner: 'PLAYER' | 'ENEMY';
  leaderId?: string; // If enemy, id of the parent enemy ship
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  fireCooldown: number;
  specialCooldown?: number;
  formationAngle: number;
  formationDist: number;
  targetEnemyId?: string | null;
  miningTargetId?: string | null;
  stunDuration?: number;
}

export type GameMode = 'STORY' | 'FREE_PLAY';
export type GameDifficulty = 'EASY' | 'NORMAL' | 'HARD' | 'EXTREME';

export type MissionType =
  | 'COURIER_CARGO'
  | 'VIP_TRANSPORT'
  | 'BOUNTY_HUNT'
  | 'MINERAL_EXTRACTION'
  | 'CONVOY_ESCORT';

export interface MissionReward {
  credits: number;
  freeUpgrade?: 'WEAPON' | 'SHIELD' | 'ENGINE' | 'CARGO';
  minerals?: { id: string; quantity: number };
  hullBonus?: number;
}

export interface Mission {
  id: string;
  type: MissionType;
  title: string;
  client: string;
  sourceStationId: string;
  sourceStationName: string;
  targetStationId?: string;
  targetStationName?: string;
  targetCoords?: { x: number; y: number };
  requiredMineralId?: string;
  requiredMineralName?: string;
  requiredMineralQty?: number;
  targetEnemyName?: string;
  targetEnemyCategory?: string;
  targetEnemyId?: string;
  targetEnemiesKilled?: number;
  targetEnemiesRequired?: number;
  reward: MissionReward;
  description: string;
  dangerLevel: number;
  status: 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  penaltyCredits: number;
}

export interface StoryChapter {
  id: string;
  chapterNumber: number;
  title: string;
  subtitle: string;
  triggerType: 'PROLOGUE' | 'MISSION_MILESTONE' | 'CHASSIS_UPGRADE' | 'WEAPON_UPGRADE' | 'CUSTOM';
  triggerBadge: string;
  loreText: string[];
  quote: string;
  illustrationIcon: 'SWORD' | 'SHIP' | 'ARMADA' | 'STATION' | 'NEBULA' | 'TITAN' | 'CHRONICLE';
}

export interface SaveSlotData {
  slotIndex: number;
  mode: GameMode;
  timestamp: number;
  player: PlayerStats;
  ship: ShipStats;
  currentSectorId: string;
  activeMission: Mission | null;
  completedMissionsCount: number;
  storyProgress: number; // 0 to 100
  unlockedStoryChapterIds?: string[];
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
  power?: number;
  scale?: number;
  tier?: number;
  category?: 'SCOUT' | 'CORVETTE' | 'FRIGATE' | 'CRUISER' | 'BATTLESHIP' | 'CARRIER' | 'COLOSSUS';
  armorRating?: number;
  escorts?: EscortShip[];
  hasBeamWeapon?: boolean;
  beamTargetId?: string | null;
  stunDuration?: number;
  powerDelta?: number;
  threatLevel?: 'WEAKER' | 'EVEN' | 'STRONGER';
  threatColor?: string;
  isAggroed?: boolean;
  aggroTimer?: number;
}

export interface ShipClassDefinition {
  tier: number;
  name: string;
  category: 'SCOUT' | 'CORVETTE' | 'FRIGATE' | 'CRUISER' | 'BATTLESHIP' | 'CARRIER' | 'COLOSSUS';
  cost: number;
  cargoBonus: number;
  hullBonus: number;
  fuelBonus: number;
  description: string;
  unlockedPerks?: string[];
}

export interface Projectile {
  id: string;
  owner: 'PLAYER' | 'ENEMY';
  type?: 'LASER' | 'TORPEDO' | 'EMP' | 'FLAK';
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  lifetime: number;
  color: string;
  radius?: number;
  targetEnemyId?: string;
  trailColor?: string;
}

export type LootType = 'CARGO' | 'CREDITS' | 'MISSILES' | 'FUEL' | 'REPAIR';

export interface FloatingLoot {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  item: InventoryItem;
  lifetime: number;
  lootType?: LootType;
  creditsValue?: number;
  missilesCount?: number;
  fuelAmount?: number;
  repairAmount?: number;
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

  // Secondary & Heavy Weapon Systems
  hasTorpedoLauncher: boolean;
  torpedoes: number;
  maxTorpedoes: number;
  hasEmpGenerator: boolean;
  empCooldown: number;
  maxEmpCooldown: number;
  hasAutoTurrets: boolean;
  turretCooldown: number;

  // Recon Scout Drone System
  drones: number;
  maxDrones: number;
  droneCooldown: number;

  // Auto-Targeting Beam Weapon System
  hasBeamWeapon: boolean;
  beamTargetId: string | null;

  // Escort Armada Fleet System
  armadaStance: EscortStance;
  escorts: EscortShip[];
  maxEscorts: number;
}

export type SectorThemeId =
  | 'CRIMSON_OUTLAW_RIFT'
  | 'EMERALD_ION_STORM'
  | 'AMETHYST_VOID_WEB'
  | 'SOLAR_CORONA_FOUNDRY'
  | 'DEEP_COBALT_EXPANSE'
  | 'DARK_MATTER_ABYSS';

export interface SectorTheme {
  id: SectorThemeId;
  name: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  nebulaColors: string[];
  starColors: string[];
  ambientColor: string;
  stationAccent: string;
  dangerLevel: number;
  hostilityRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  backgroundColor?: string;
  starTint?: string;
  ambientDustAlpha?: number;
}

export interface Sector {
  id: string;
  name: string;
  dangerLevel: number;
  width: number;
  height: number;
  theme: SectorTheme;
}

export interface DefenseDrone {
  id: string;
  orbitAngle: number;
  orbitRadius: number;
  orbitSpeed: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  fireCooldown: number;
  lifetime: number;
  maxLifetime: number;
  shield?: number;
  maxShield?: number;
}

export type ReconDrone = DefenseDrone;

export interface PointOfInterest {
  id: string;
  title: string;
  name?: string;
  category: 'ASTEROID_CLUSTER' | 'STATION' | 'HOSTILE_FLEET' | 'DERELICT_CACHE' | 'FUSION_ASTEROID' | 'ANOMALY';
  type?: 'ASTEROID_CLUSTER' | 'STATION' | 'HOSTILE_FLEET' | 'DERELICT_CACHE' | 'FUSION_ASTEROID' | 'ANOMALY';
  x: number;
  y: number;
  description: string;
  color: string;
  lifetime: number;
  maxLifetime: number;
  detectedBy?: 'DRONE' | 'LONG_RANGE_RADAR';
  distance?: number;
  timestamp?: number;
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
    drones: ReconDrone[];
    escorts: EscortShip[];
    pointsOfInterest: PointOfInterest[];
    exploredCells: string[];
  };
  market: {
    activeStationId: string | null;
    commodities: MarketItem[];
  };
  gameStatus: GameStatus;
  soundEnabled: boolean;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  combatAlert: boolean;
  isHyperJumping: boolean;
  hyperJumpProgress: number; // 0 to 1
  invertFlightControls: boolean;
  isPaused: boolean;
  isDiagnosticsOpen: boolean;
  touchControlsMode: 'AUTO' | 'ON' | 'OFF';
  mode: GameMode;
  saveSlotIndex: number;
  activeMission: Mission | null;
  stationMissions: Mission[];
  completedMissionsCount: number;
  isIntroNuxOpen: boolean;
  activeStorybookChapter: StoryChapter | null;
  unlockedStoryChapterIds: string[];
  difficulty: GameDifficulty;
}
