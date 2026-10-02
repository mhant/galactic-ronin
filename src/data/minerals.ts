export type MineralRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';

export interface Mineral {
  id: string;
  name: string;
  rarity: MineralRarity;
  unitValue: number; // Base credit value per unit
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  description: string;
}

export const MINERALS: Record<string, Mineral> = {
  iron_ore: {
    id: 'iron_ore',
    name: 'Ferrous Iron Ore',
    rarity: 'COMMON',
    unitValue: 45,
    color: '#94A3B8',
    bgColor: 'bg-slate-800/80',
    borderColor: 'border-slate-600',
    textColor: 'text-slate-300',
    glowColor: '#64748B',
    description: 'Basic dense metallic ore abundant across planetary asteroid belts.',
  },
  titanium_ore: {
    id: 'titanium_ore',
    name: 'Refined Titanium',
    rarity: 'UNCOMMON',
    unitValue: 120,
    color: '#38BDF8',
    bgColor: 'bg-cyan-950/80',
    borderColor: 'border-cyan-500/60',
    textColor: 'text-cyan-300',
    glowColor: '#00F0FF',
    description: 'High-tensile crystalline alloy used for starship bulkheads and armor plating.',
  },
  cobalt_ore: {
    id: 'cobalt_ore',
    name: 'Cobalt Resonance Ore',
    rarity: 'RARE',
    unitValue: 280,
    color: '#818CF8',
    bgColor: 'bg-indigo-950/80',
    borderColor: 'border-indigo-500/60',
    textColor: 'text-indigo-300',
    glowColor: '#6366F1',
    description: 'Conductive blue crystal essential for deflector shield coils and heavy capacitors.',
  },
  platinum_ore: {
    id: 'platinum_ore',
    name: 'Lustrous Platinum',
    rarity: 'RARE',
    unitValue: 550,
    color: '#E2E8F0',
    bgColor: 'bg-slate-900/90',
    borderColor: 'border-slate-400/70',
    textColor: 'text-slate-100',
    glowColor: '#F8FAFC',
    description: 'Precious noble metal sought after across civilized starports for high-grade avionics.',
  },
  quantum_crystal: {
    id: 'quantum_crystal',
    name: 'Quantum Hyper-Crystal',
    rarity: 'EPIC',
    unitValue: 1200,
    color: '#C084FC',
    bgColor: 'bg-purple-950/80',
    borderColor: 'border-purple-500/60',
    textColor: 'text-purple-300',
    glowColor: '#A855F7',
    description: 'Bioluminescent exotic crystal that vibrates across subspace quantum frequencies.',
  },
  void_obsidian: {
    id: 'void_obsidian',
    name: 'Void Obsidian Core',
    rarity: 'LEGENDARY',
    unitValue: 2800,
    color: '#F59E0B',
    bgColor: 'bg-amber-950/80',
    borderColor: 'border-amber-500/70',
    textColor: 'text-amber-300',
    glowColor: '#F59E0B',
    description: 'Super-dense gravitational mineral formed in the hearts of collapsed spatial anomalies.',
  },
  antimatter_shard: {
    id: 'antimatter_shard',
    name: 'Antimatter Singularity Shard',
    rarity: 'MYTHIC',
    unitValue: 6500,
    color: '#EC4899',
    bgColor: 'bg-pink-950/80',
    borderColor: 'border-pink-500/70',
    textColor: 'text-pink-300',
    glowColor: '#F43F5E',
    description: 'Supreme apex mineral housing containment-stable raw antimatter star energy.',
  },
};

export const MINERAL_LIST = Object.values(MINERALS);

export function getMineral(id: string): Mineral {
  if (MINERALS[id]) return MINERALS[id];
  // Backward compatibility alias lookups
  if (id === 'food_packs' || id === 'food_rations') return MINERALS['iron_ore'];
  if (id === 'fusion_cells') return MINERALS['cobalt_ore'];
  if (id === 'nano_meds' || id === 'medical_supplies') return MINERALS['platinum_ore'];
  if (id === 'quantum_chips' || id === 'micro_electronics') return MINERALS['quantum_crystal'];
  if (id === 'hyper_stims') return MINERALS['void_obsidian'];
  if (id === 'warp_coils') return MINERALS['antimatter_shard'];

  return {
    id,
    name: id.replace(/_/g, ' ').toUpperCase(),
    rarity: 'COMMON',
    unitValue: 50,
    color: '#94A3B8',
    bgColor: 'bg-slate-800/80',
    borderColor: 'border-slate-600',
    textColor: 'text-slate-300',
    glowColor: '#64748B',
    description: 'Unclassified raw mineral specimen.',
  };
}

/**
 * Pick a random mineral based on sector danger level and preference for rarity
 */
export function getRandomMineralForSector(dangerLevel = 1, preferRare = false): Mineral {
  const roll = Math.random();

  if (dangerLevel >= 5) {
    if (preferRare || roll < 0.12) return MINERALS.antimatter_shard;
    if (roll < 0.30) return MINERALS.void_obsidian;
    if (roll < 0.55) return MINERALS.quantum_crystal;
    if (roll < 0.80) return MINERALS.platinum_ore;
    return MINERALS.cobalt_ore;
  }

  if (dangerLevel >= 3) {
    if (preferRare || roll < 0.08) return MINERALS.void_obsidian;
    if (roll < 0.25) return MINERALS.quantum_crystal;
    if (roll < 0.50) return MINERALS.platinum_ore;
    if (roll < 0.75) return MINERALS.cobalt_ore;
    return MINERALS.titanium_ore;
  }

  // Early sectors (1-2)
  if (preferRare || roll < 0.05) return MINERALS.quantum_crystal;
  if (roll < 0.20) return MINERALS.platinum_ore;
  if (roll < 0.45) return MINERALS.cobalt_ore;
  if (roll < 0.75) return MINERALS.titanium_ore;
  return MINERALS.iron_ore;
}
