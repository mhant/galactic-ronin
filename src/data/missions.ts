import { Mission, Station, Sector, PlayerStats, ShipStats } from '../types/game';
import { MINERAL_LIST } from './minerals';

const CLIENT_NAMES = [
  'Aegis Defense Syndicate',
  'Titan Mining Guild',
  'Verdant Hydro-Agri Cooperative',
  'Black-Sun Smugglers Ring',
  'Vulcan Heavy Shipyards',
  'Outer-Rim Research Initiative',
  'Free Ronin Coalition',
  'Shadow Haven Syndicate',
  'Cyber-Spire Nanotech Corp',
  'Ironclad Frontier Guard',
];

export function generateStationMissions(
  station: Station,
  allStations: Station[],
  sector: Sector,
  playerTier: number,
  _player?: PlayerStats,
  _ship?: ShipStats
): Mission[] {
  const missions: Mission[] = [];
  const otherStations = allStations.filter((s) => s.id !== station.id);
  const targetStation = otherStations.length > 0
    ? otherStations[Math.floor(Math.random() * otherStations.length)]
    : station;

  const tierScale = 1 + (playerTier - 1) * 0.18;
  const baseReward = Math.round((650 + Math.random() * 500) * tierScale);

  // 1. Courier Cargo / Passenger Transport Mission
  const client1 = CLIENT_NAMES[Math.floor(Math.random() * CLIENT_NAMES.length)];
  const isVip = Math.random() < 0.45;
  missions.push({
    id: `m_courier_${station.id}_${Date.now()}_1`,
    type: isVip ? 'VIP_TRANSPORT' : 'COURIER_CARGO',
    title: isVip
      ? `Priority Transport: ${client1} Emissary`
      : `Classified Cargo Run: ${station.name} to ${targetStation.name}`,
    client: client1,
    sourceStationId: station.id,
    sourceStationName: station.name,
    targetStationId: targetStation.id,
    targetStationName: targetStation.name,
    reward: {
      credits: Math.round(baseReward * 1.2),
      freeUpgrade: Math.random() < 0.35 ? (Math.random() < 0.5 ? 'ENGINE' : 'CARGO') : undefined,
    },
    description: isVip
      ? `Discreetly transport a high-ranking ${client1} official to ${targetStation.name}. Avoid heavy hull damage during transit.`
      : `Deliver a secure container of sealed components to ${targetStation.name} in safe condition.`,
    dangerLevel: Math.max(1, sector.dangerLevel),
    status: 'AVAILABLE',
    penaltyCredits: Math.round(baseReward * 0.35),
  });

  // 2. Pirate Bounty Hunt Contract
  const client2 = CLIENT_NAMES[Math.floor(Math.random() * CLIENT_NAMES.length)];
  const bossNames = [
    'Captain Blood-Eye Vane', 'Warlord Kaelen the Unbroken', 'Dread Corsair Malakor',
    'Rogue Warmaster Zephyr', 'Apex Outlaw Grim-Jaw', 'The Void Specter', 'Cyber-Pirate Null-Void'
  ];
  const targetBoss = bossNames[Math.floor(Math.random() * bossNames.length)];
  const requiredKills = 1 + Math.floor(Math.min(4, playerTier / 8));
  missions.push({
    id: `m_bounty_${station.id}_${Date.now()}_2`,
    type: 'BOUNTY_HUNT',
    title: `Bounty Contract: Eliminate ${targetBoss}`,
    client: client2,
    sourceStationId: station.id,
    sourceStationName: station.name,
    targetEnemyName: targetBoss,
    targetEnemiesRequired: requiredKills,
    targetEnemiesKilled: 0,
    reward: {
      credits: Math.round(baseReward * 1.8),
      freeUpgrade: Math.random() < 0.5 ? (Math.random() < 0.5 ? 'WEAPON' : 'SHIELD') : undefined,
      hullBonus: 20,
    },
    description: `A notorious outlaw warband led by ${targetBoss} is harassing shipping lanes. Destroy ${requiredKills} hostile warship(s) in this sector.`,
    dangerLevel: Math.min(10, sector.dangerLevel + 1),
    status: 'AVAILABLE',
    penaltyCredits: Math.round(baseReward * 0.5),
  });

  // 3. High-Value Mineral Core Extraction Contract
  const mineral = MINERAL_LIST[Math.min(MINERAL_LIST.length - 1, Math.floor(Math.random() * (2 + Math.floor(playerTier / 5))))];
  const requiredQty = Math.max(3, Math.min(20, Math.round(4 + (playerTier * 0.4))));
  const mineralClient = 'Titan Deep-Core Mining Cartel';
  missions.push({
    id: `m_mining_${station.id}_${Date.now()}_3`,
    type: 'MINERAL_EXTRACTION',
    title: `Extraction Order: ${requiredQty}x ${mineral.name}`,
    client: mineralClient,
    sourceStationId: station.id,
    sourceStationName: station.name,
    targetStationId: station.id,
    targetStationName: station.name,
    requiredMineralId: mineral.id,
    requiredMineralName: mineral.name,
    requiredMineralQty: requiredQty,
    reward: {
      credits: Math.round(baseReward * 1.4 + (mineral.unitValue * requiredQty * 0.8)),
      minerals: { id: mineral.id, quantity: 2 },
    },
    description: `Smelting complexes at ${station.name} require raw ${mineral.name}. Mine asteroids in the sector to obtain ${requiredQty} units and return here.`,
    dangerLevel: sector.dangerLevel,
    status: 'AVAILABLE',
    penaltyCredits: Math.round(baseReward * 0.25),
  });

  // 4. Sector Patrol & Convoy Escort (Tiers 4+)
  if (playerTier >= 4) {
    const client4 = 'Frontier Security Command';
    missions.push({
      id: `m_patrol_${station.id}_${Date.now()}_4`,
      type: 'CONVOY_ESCORT',
      title: `Sector Security Patrol: Secure ${targetStation.name} Corridor`,
      client: client4,
      sourceStationId: station.id,
      sourceStationName: station.name,
      targetStationId: targetStation.id,
      targetStationName: targetStation.name,
      targetEnemiesRequired: 3,
      targetEnemiesKilled: 0,
      reward: {
        credits: Math.round(baseReward * 2.1),
        freeUpgrade: 'WEAPON',
      },
      description: `Rogue warships are blockading the trade vector between ${station.name} and ${targetStation.name}. Clear the corridor and dock safely at ${targetStation.name}.`,
      dangerLevel: Math.min(10, sector.dangerLevel + 2),
      status: 'AVAILABLE',
      penaltyCredits: Math.round(baseReward * 0.45),
    });
  }

  return missions;
}
