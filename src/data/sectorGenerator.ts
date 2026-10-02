import { Asteroid, Enemy, PlayerStats, Sector, ShipStats, Station, StationType } from '../types/game';
import { getSectorTheme } from './sectorThemes';
import { createScaledEnemy } from '../store/useGameStore';
import { getRandomMineralForSector } from './minerals';

export function createAsteroid(
  id: string,
  x: number,
  y: number,
  radius = 25 + Math.random() * 35,
  preferRare = false,
  dangerLevel = 1
): Asteroid {
  const vertexCount = 7 + Math.floor(Math.random() * 5);
  const vertices = [];
  for (let v = 0; v < vertexCount; v++) {
    const angle = (v / vertexCount) * Math.PI * 2;
    const variation = 0.75 + Math.random() * 0.45;
    vertices.push({
      angle,
      distance: radius * variation,
    });
  }

  const mineral = getRandomMineralForSector(dangerLevel, preferRare);
  const maxYield = Math.max(2, Math.floor(radius / 7));

  return {
    id,
    x,
    y,
    vx: (Math.random() - 0.5) * 8,
    vy: (Math.random() - 0.5) * 8,
    radius,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.35,
    oreType: mineral.id,
    oreYield: maxYield,
    maxYield,
    health: Math.round(radius * 1.6),
    maxHealth: Math.round(radius * 1.6),
    vertices,
  };
}

export function generateSector(sectorId = 'Sector-01'): {
  sector: Sector;
  stations: Station[];
  asteroids: Asteroid[];
  enemies: Enemy[];
} {
  const sectorIndex = parseInt(sectorId.replace('Sector-', ''), 10) || 1;
  const theme = getSectorTheme(sectorIndex - 1);
  const isHostile = theme.dangerLevel >= 4;

  const sector: Sector = {
    id: sectorId,
    name: `${theme.name} (${sectorId})`,
    dangerLevel: theme.dangerLevel,
    width: 8000,
    height: 8000,
    theme,
  };

  // Base core stations around (0,0) with theme-adapted colors and titles
  const stations: Station[] = [
    {
      id: `${sectorId}_st_agri`,
      name: isHostile ? 'Fortified Hydro-Silo' : 'Verdant Harvest Orbital',
      type: 'AGRICULTURAL',
      x: -1300,
      y: -950,
      radius: 95,
      color: isHostile ? '#F97316' : '#10B981',
      description: isHostile
        ? 'Armored bio-domes surrounded by point-defense turrets providing rations under guard.'
        : 'Sprawling hydro-farming ring providing fresh nutrient packs to trade convoys.',
      fuelPricePerUnit: 2,
      repairPricePerPoint: 8,
    },
    {
      id: `${sectorId}_st_mining`,
      name: isHostile ? 'Slag Heap Extraction Hub' : 'Titan Deep-Core Hub',
      type: 'MINING',
      x: 1450,
      y: -1150,
      radius: 110,
      color: theme.primaryColor,
      description: 'Heavily reinforced smelting platform anchored alongside a dense asteroid cluster.',
      fuelPricePerUnit: 3,
      repairPricePerPoint: 6,
    },
    {
      id: `${sectorId}_st_industrial`,
      name: isHostile ? 'Ironclad Munitions Foundry' : 'Vulcan Forge Megacomplex',
      type: 'INDUSTRIAL',
      x: 1550,
      y: 1350,
      radius: 125,
      color: isHostile ? '#EF4444' : '#F59E0B',
      description: 'Belching plasma vents and heavy robotic shipyards producing raw hulls and fusion cores.',
      fuelPricePerUnit: 2,
      repairPricePerPoint: 5,
    },
    {
      id: `${sectorId}_st_tech`,
      name: isHostile ? 'Black-Site Cyber Spire' : 'Aegis High-Tech Citadel',
      type: 'HIGH_TECH',
      x: -1450,
      y: 1250,
      radius: 100,
      color: isHostile ? '#A855F7' : '#06B6D4',
      description: 'Sleek research spire equipped with quantum computing lattices and nanite synthesis bays.',
      fuelPricePerUnit: 4,
      repairPricePerPoint: 10,
    },
    {
      id: `${sectorId}_st_outlaw`,
      name: isHostile ? 'Blood Skull War-Barge' : 'Scraphead Shadow Haven',
      type: 'OUTLAW',
      x: 0,
      y: -2300,
      radius: 85,
      color: isHostile ? '#DC2626' : '#9333EA',
      description: 'A jury-rigged pirate haven built into a hollowed-out asteroid. Anything goes for the right price.',
      fuelPricePerUnit: 5,
      repairPricePerPoint: 12,
    },
  ];

  // Core Asteroid Field
  const asteroids: Asteroid[] = [];
  const asteroidCount = 42;
  for (let i = 0; i < asteroidCount; i++) {
    let x: number;
    let y: number;
    if (i < 18) {
      // Cluster near mining station (1450, -1150)
      const angle = Math.random() * Math.PI * 2;
      const dist = 240 + Math.random() * 680;
      x = 1450 + Math.cos(angle) * dist;
      y = -1150 + Math.sin(angle) * dist;
    } else if (i < 30) {
      // Cluster near outlaw station
      const angle = Math.random() * Math.PI * 2;
      const dist = 280 + Math.random() * 600;
      x = 0 + Math.cos(angle) * dist;
      y = -2300 + Math.sin(angle) * dist;
    } else {
      // Deep space belt
      x = (Math.random() - 0.5) * 4400;
      y = (Math.random() - 0.5) * 4400;
    }
    asteroids.push(createAsteroid(`core_ast_${i}_${Date.now()}`, x, y));
  }

  // Initial Enemy fleet
  const enemies: Enemy[] = [];

  return { sector, stations, asteroids, enemies };
}

/**
 * Procedural Endless Cluster Generation:
 * Generates an asteroid cluster, deep space outpost, or pirate patrol within a 3500x3500 grid cell.
 * Leaves a natural deep-space gap of ~1-2 radar screens (~2500 - 3500 units) between clusters.
 */
export function generateClusterCell(
  cellX: number,
  cellY: number,
  sector: Sector,
  player?: PlayerStats,
  ship?: ShipStats
): {
  stations: Station[];
  asteroids: Asteroid[];
  enemies: Enemy[];
} {
  const CELL_SIZE = 3500;
  const centerX = cellX * CELL_SIZE;
  const centerY = cellY * CELL_SIZE;
  const theme = sector.theme;

  // Pseudo-random deterministic seed for this cell
  const seed = Math.abs(Math.sin(cellX * 12.9898 + cellY * 78.233) * 43758.5453);
  const rand = (offset = 0) => {
    const s = seed + offset;
    return s - Math.floor(s);
  };

  const newStations: Station[] = [];
  const newAsteroids: Asteroid[] = [];
  const newEnemies: Enemy[] = [];

  // Cell Archetype:
  // 0.0 - 0.40: Dense Asteroid Mining Field
  // 0.40 - 0.70: Deep Space Station / Outpost with surrounding field
  // 0.70 - 1.00: Pirate Stronghold / Heavy Warship Patrol Fleet
  const roll = rand(1);

  if (roll < 0.40) {
    // 1. Dense Asteroid Mining Field (Rich in fusion cells & titanium)
    const count = 16 + Math.floor(rand(2) * 10);
    const clusterSpread = 850 + rand(3) * 450;

    for (let i = 0; i < count; i++) {
      const angle = rand(10 + i) * Math.PI * 2;
      const dist = rand(20 + i) * clusterSpread;
      const ax = centerX + Math.cos(angle) * dist;
      const ay = centerY + Math.sin(angle) * dist;
      newAsteroids.push(createAsteroid(`cell_ast_${cellX}_${cellY}_${i}`, ax, ay, 26 + rand(30 + i) * 36, true));
    }

    // 1 roaming guard
    if (player && ship) {
      newEnemies.push(
        createScaledEnemy(
          `cell_guard_${cellX}_${cellY}`,
          centerX + (rand(4) - 0.5) * 600,
          centerY + (rand(5) - 0.5) * 600,
          player,
          ship
        )
      );
    }
  } else if (roll < 0.70) {
    // 2. Deep Space Trading / Outpost Relay
    const stationTypes: StationType[] = ['MINING', 'AGRICULTURAL', 'INDUSTRIAL', 'HIGH_TECH', 'OUTLAW'];
    const chosenType = stationTypes[Math.floor(rand(4) * stationTypes.length)];
    const stationColor = chosenType === 'OUTLAW' ? '#A855F7' : (theme?.stationAccent || '#06B6D4');

    const outpostName = `${chosenType.replace('_', ' ')} Relay [${cellX}, ${cellY}]`;
    const stationX = centerX + (rand(5) - 0.5) * 500;
    const stationY = centerY + (rand(6) - 0.5) * 500;

    newStations.push({
      id: `outpost_${cellX}_${cellY}`,
      name: outpostName,
      type: chosenType,
      x: stationX,
      y: stationY,
      radius: 90,
      color: stationColor,
      description: `Autonomous deep-space ${chosenType.toLowerCase()} outpost servicing long-range ronin traders.`,
      fuelPricePerUnit: 3,
      repairPricePerPoint: 8,
    });

    // A ring of asteroids around the station
    const count = 10 + Math.floor(rand(7) * 8);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rand(8);
      const dist = 320 + rand(9 + i) * 650;
      newAsteroids.push(
        createAsteroid(`cell_st_ast_${cellX}_${cellY}_${i}`, stationX + Math.cos(angle) * dist, stationY + Math.sin(angle) * dist)
      );
    }
  } else {
    // 3. Outlaw Raider Fleet / Heavy Capital Patrol
    const count = 12 + Math.floor(rand(2) * 8);
    for (let i = 0; i < count; i++) {
      const angle = rand(10 + i) * Math.PI * 2;
      const dist = rand(20 + i) * 900;
      newAsteroids.push(createAsteroid(`cell_pirate_ast_${cellX}_${cellY}_${i}`, centerX + Math.cos(angle) * dist, centerY + Math.sin(angle) * dist));
    }

    if (player && ship) {
      const enemyCount = 2 + Math.floor(rand(3) * 2);
      for (let e = 0; e < enemyCount; e++) {
        const ea = rand(40 + e) * Math.PI * 2;
        const ed = 200 + rand(50 + e) * 700;
        newEnemies.push(
          createScaledEnemy(
            `cell_pirate_${cellX}_${cellY}_${e}`,
            centerX + Math.cos(ea) * ed,
            centerY + Math.sin(ea) * ed,
            player,
            ship
          )
        );
      }
    }
  }

  return { stations: newStations, asteroids: newAsteroids, enemies: newEnemies };
}
