import { MarketItem, Station, StationType } from '../types/game';

export interface CommodityTemplate {
  id: string;
  name: string;
  category: 'ORE' | 'FOOD' | 'TECH' | 'CONTRABAND' | 'INDUSTRIAL';
  basePrice: number;
  description: string;
  illegal?: boolean;
}

export const COMMODITIES: CommodityTemplate[] = [
  {
    id: 'food_packs',
    name: 'Hydro-Ration Packs',
    category: 'FOOD',
    basePrice: 35,
    description: 'Dehydrated calorie-dense nutritional cubes for long interstellar hauls.',
  },
  {
    id: 'titanium_ore',
    name: 'Refined Titanium Ore',
    category: 'ORE',
    basePrice: 75,
    description: 'Essential raw structural material for hull plating and starship bulkheads.',
  },
  {
    id: 'fusion_cells',
    name: 'Plasma Fusion Cells',
    category: 'INDUSTRIAL',
    basePrice: 180,
    description: 'High-density fuel cells utilized in station reactor cores and heavy thrusters.',
  },
  {
    id: 'nano_meds',
    name: 'Nanite Trauma Kits',
    category: 'TECH',
    basePrice: 320,
    description: 'Medical nanobots programmed for rapid emergency biological cell repair.',
  },
  {
    id: 'quantum_chips',
    name: 'Quantum Logic Cores',
    category: 'TECH',
    basePrice: 580,
    description: 'Complex sub-atomic processors essential for navigation supercomputers.',
  },
  {
    id: 'hyper_stims',
    name: 'Hyper-Stim Inhalers',
    category: 'CONTRABAND',
    basePrice: 750,
    description: 'Illicit neural stimulants banned in federation sectors. Fetch huge outlaw profits.',
    illegal: true,
  },
  {
    id: 'warp_coils',
    name: 'Micro-Warp Stabilizers',
    category: 'INDUSTRIAL',
    basePrice: 1200,
    description: 'Rare exotic matter containment coils used in sub-light warp manifolds.',
  },
];

// Price multipliers per station type
// [StationType]: { [commodityId]: { supplyMultiplier: number, demandMultiplier: number } }
export const STATION_PRICE_MODIFIERS: Record<StationType, Record<string, number>> = {
  AGRICULTURAL: {
    food_packs: 0.55,       // Cheap food
    titanium_ore: 1.35,     // Demands materials
    fusion_cells: 1.15,
    nano_meds: 1.25,
    quantum_chips: 1.2,
    hyper_stims: 1.3,
    warp_coils: 1.2,
  },
  MINING: {
    food_packs: 1.45,       // Demands food
    titanium_ore: 0.5,      // Cheap ore
    fusion_cells: 1.3,      // Demands fuel
    nano_meds: 1.4,         // Demands medical kits
    quantum_chips: 1.25,
    hyper_stims: 1.5,       // Miners love stims
    warp_coils: 1.3,
  },
  INDUSTRIAL: {
    food_packs: 1.1,
    titanium_ore: 1.5,      // High demand for raw ore
    fusion_cells: 0.65,     // Cheap energy cells
    nano_meds: 1.1,
    quantum_chips: 1.2,
    hyper_stims: 1.15,
    warp_coils: 0.7,        // Produces warp components
  },
  HIGH_TECH: {
    food_packs: 1.2,
    titanium_ore: 1.25,
    fusion_cells: 1.35,
    nano_meds: 0.6,         // Produces medicine
    quantum_chips: 0.55,    // Produces high tech
    hyper_stims: 1.4,
    warp_coils: 0.75,
  },
  OUTLAW: {
    food_packs: 1.4,
    titanium_ore: 0.85,
    fusion_cells: 1.25,
    nano_meds: 1.6,
    quantum_chips: 1.4,
    hyper_stims: 0.5,       // Cheap illegal stims
    warp_coils: 1.5,
  },
};

export function generateStationMarket(station: Station): MarketItem[] {
  const modifiers = STATION_PRICE_MODIFIERS[station.type] || {};

  return COMMODITIES.map((c) => {
    const mod = modifiers[c.id] ?? 1.0;
    // Add small random market fluctuation (+/- 10%)
    const fluctuation = 0.9 + Math.random() * 0.2;
    const effectiveMultiplier = mod * fluctuation;

    const baseUnitCost = Math.round(c.basePrice * effectiveMultiplier);
    // Buy price has a slight spread (margin)
    const buyPrice = Math.max(10, Math.round(baseUnitCost * 1.05));
    const sellPrice = Math.max(8, Math.round(baseUnitCost * 0.95));

    // Availability is higher if station produces it (low multiplier)
    const isProducer = mod <= 0.8;
    const quantity = isProducer
      ? Math.floor(40 + Math.random() * 60)
      : Math.floor(5 + Math.random() * 25);

    return {
      id: c.id,
      name: c.name,
      description: c.description,
      category: c.category,
      buyPrice,
      sellPrice,
      quantity,
      illegal: c.illegal,
    };
  });
}
