import { Asteroid, Enemy, Sector, Station } from '../types/game';

export function generateSector(sectorId = 'Sector-01'): {
  sector: Sector;
  stations: Station[];
  asteroids: Asteroid[];
  enemies: Enemy[];
} {
  const width = 6000;
  const height = 6000;

  const sector: Sector = {
    id: sectorId,
    name: 'Ronin Frontier Sector 7G',
    dangerLevel: 2,
    width,
    height,
  };

  // 1. Stations strategically positioned
  const stations: Station[] = [
    {
      id: 'station_agri',
      name: 'Verdant Harvest Orbital',
      type: 'AGRICULTURAL',
      x: -1200,
      y: -900,
      radius: 95,
      color: '#10B981', // Emerald
      description: 'Massive hydro-farming dome rings providing fresh produce and rations to outer colonies.',
      fuelPricePerUnit: 2,
      repairPricePerPoint: 8,
    },
    {
      id: 'station_mining',
      name: 'Titan Deep-Core Hub',
      type: 'MINING',
      x: 1400,
      y: -1100,
      radius: 110,
      color: '#F59E0B', // Amber
      description: 'Heavily reinforced smelting platform anchored alongside a dense asteroid cluster.',
      fuelPricePerUnit: 3,
      repairPricePerPoint: 6,
    },
    {
      id: 'station_industrial',
      name: 'Vulcan Forge Megacomplex',
      type: 'INDUSTRIAL',
      x: 1500,
      y: 1300,
      radius: 125,
      color: '#EF4444', // Red-orange
      description: 'Belching plasma vents and heavy robotic shipyards producing raw hulls and fusion cores.',
      fuelPricePerUnit: 2,
      repairPricePerPoint: 5,
    },
    {
      id: 'station_tech',
      name: 'Aegis High-Tech Citadel',
      type: 'HIGH_TECH',
      x: -1400,
      y: 1200,
      radius: 100,
      color: '#06B6D4', // Cyan
      description: 'Sleek research spire equipped with quantum computing lattices and nanite synthesis bays.',
      fuelPricePerUnit: 4,
      repairPricePerPoint: 10,
    },
    {
      id: 'station_outlaw',
      name: 'Scraphead Shadow Haven',
      type: 'OUTLAW',
      x: 0,
      y: -2200,
      radius: 85,
      color: '#A855F7', // Violet
      description: 'A jury-rigged pirate haven built into a hollowed-out asteroid. Anything goes for the right price.',
      fuelPricePerUnit: 5,
      repairPricePerPoint: 12,
    },
  ];

  // 2. Procedural Asteroids (clusters around mining station and scattered fields)
  const asteroids: Asteroid[] = [];
  const asteroidCount = 45;

  for (let i = 0; i < asteroidCount; i++) {
    // Generate some in clusters, some distributed
    let x: number;
    let y: number;

    if (i < 20) {
      // Cluster near mining station (1400, -1100)
      const angle = Math.random() * Math.PI * 2;
      const dist = 250 + Math.random() * 700;
      x = 1400 + Math.cos(angle) * dist;
      y = -1100 + Math.sin(angle) * dist;
    } else if (i < 30) {
      // Cluster near outlaw station
      const angle = Math.random() * Math.PI * 2;
      const dist = 300 + Math.random() * 600;
      x = 0 + Math.cos(angle) * dist;
      y = -2200 + Math.sin(angle) * dist;
    } else {
      // Deep space belt
      x = (Math.random() - 0.5) * 4500;
      y = (Math.random() - 0.5) * 4500;
    }

    const radius = 25 + Math.random() * 35;
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

    const oreTypes = ['titanium_ore', 'titanium_ore', 'fusion_cells'];
    const selectedOre = oreTypes[Math.floor(Math.random() * oreTypes.length)];
    const maxYield = Math.floor(radius / 8);

    asteroids.push({
      id: `ast_${i}_${Date.now()}`,
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      radius,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.4,
      oreType: selectedOre,
      oreYield: maxYield,
      maxYield,
      health: Math.round(radius * 1.5),
      maxHealth: Math.round(radius * 1.5),
      vertices,
    });
  }

  // 3. Enemy Patrols and Pirates (Balanced for fast, rewarding dogfights)
  const enemies: Enemy[] = [
    {
      id: 'enemy_pirate_1',
      name: 'Viper Raider',
      type: 'PIRATE_SCOUT',
      x: 600,
      y: -500,
      vx: 0,
      vy: 0,
      rotation: 0,
      hull: 24,
      maxHull: 24,
      shield: 10,
      maxShield: 10,
      bounty: 200,
      fireCooldown: 0,
      aggroDistance: 450,
    },
    {
      id: 'enemy_pirate_2',
      name: 'Bloodhound Interceptor',
      type: 'PIRATE_SCOUT',
      x: -400,
      y: 400,
      vx: 0,
      vy: 0,
      rotation: 0,
      hull: 28,
      maxHull: 28,
      shield: 12,
      maxShield: 12,
      bounty: 250,
      fireCooldown: 0,
      aggroDistance: 500,
    },
    {
      id: 'enemy_corvette',
      name: 'Black Skull Heavy Corvette',
      type: 'RAIDER_CORVETTE',
      x: 200,
      y: -1700,
      vx: 0,
      vy: 0,
      rotation: 0,
      hull: 65,
      maxHull: 65,
      shield: 25,
      maxShield: 25,
      bounty: 650,
      fireCooldown: 0,
      aggroDistance: 650,
    },
  ];

  return { sector, stations, asteroids, enemies };
}
