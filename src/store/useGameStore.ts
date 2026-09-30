import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Enemy,
  FloatingLoot,
  GameState,
  InventoryItem,
  MarketItem,
  Projectile,
  ShipStats,
} from '../types/game';
import { generateSector } from '../data/sectorGenerator';
import { generateStationMarket } from '../data/economy';
import { SoundManager } from '../audio/SoundManager';

interface GameActions {
  startGame: (isNew?: boolean) => void;
  setGameStatus: (status: GameState['gameStatus']) => void;
  toggleSound: () => void;
  updateShipPhysics: (updates: Partial<ShipStats>) => void;
  distributePower: (system: 'weapon' | 'shield' | 'engine', delta: number) => void;
  consumeFuel: (amount: number) => boolean;
  rechargeShields: (dt: number) => void;
  
  // Docking & Trade
  dockAtStation: (stationId: string) => void;
  undock: () => void;
  buyCommodity: (commodityId: string, quantity: number) => boolean;
  sellCommodity: (commodityId: string, quantity: number) => boolean;
  refuelShip: (units: number) => boolean;
  repairShip: (points: number) => boolean;
  upgradeCargo: () => boolean;

  // Combat & Mining
  damagePlayer: (rawDamage: number) => void;
  damageEnemy: (enemyId: string, rawDamage: number) => { destroyed: boolean; enemy?: Enemy };
  damageAsteroid: (asteroidId: string, rawDamage: number) => { destroyed: boolean; oreYield?: number; oreType?: string };
  updateEnemies: (enemies: Enemy[]) => void;
  addProjectile: (proj: Projectile) => void;
  updateProjectiles: (dt: number) => void;
  spawnFloatingLoot: (loot: FloatingLoot) => void;
  collectLoot: (lootId: string) => boolean;
  setCombatAlert: (alert: boolean) => void;
  
  // Sector transition / Reset
  jumpSector: () => void;
  resetGame: () => void;
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
        id: 'food_packs',
        name: 'Hydro-Ration Packs',
        quantity: 5,
        avgBuyPrice: 35,
        category: 'FOOD' as const,
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
    shield: 100,
    maxShield: 100,
    isThrusting: false,
    isMining: false,
  },
  world: {
    currentSectorId: 'Sector-01',
    sector: initialSectorData.sector,
    stations: initialSectorData.stations,
    asteroids: initialSectorData.asteroids,
    enemies: initialSectorData.enemies,
    projectiles: [] as Projectile[],
    floatingLoot: [] as FloatingLoot[],
  },
  market: {
    activeStationId: null as string | null,
    commodities: [] as MarketItem[],
  },
  gameStatus: 'MENU' as GameState['gameStatus'],
  soundEnabled: true,
  combatAlert: false,
});

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      startGame: (isNew = false) => {
        SoundManager.startAmbient();
        if (isNew) {
          const fresh = getInitialState();
          const sectorData = generateSector('Sector-01');
          fresh.world.sector = sectorData.sector;
          fresh.world.stations = sectorData.stations;
          fresh.world.asteroids = sectorData.asteroids;
          fresh.world.enemies = sectorData.enemies;
          fresh.gameStatus = 'EXPLORING';
          set(fresh);
        } else {
          set({ gameStatus: 'EXPLORING' });
        }
      },

      setGameStatus: (status) => set({ gameStatus: status }),

      toggleSound: () => {
        const next = !get().soundEnabled;
        SoundManager.setEnabled(next);
        set({ soundEnabled: next });
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
        const station = get().world.stations.find((s) => s.id === stationId);
        if (!station) return;
        const commodities = generateStationMarket(station);
        SoundManager.playDock();
        SoundManager.updateThruster(false);
        set((state) => ({
          gameStatus: 'STATION',
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

      damageEnemy: (enemyId, rawDamage) => {
        const { world } = get();
        const enemy = world.enemies.find((e) => e.id === enemyId);
        if (!enemy) return { destroyed: false };

        let remaining = rawDamage;
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
          const updatedEnemies = world.enemies.filter((e) => e.id !== enemyId);

          // Spawn floating loot
          const lootItem: InventoryItem = {
            id: 'titanium_ore',
            name: 'Refined Titanium Ore',
            quantity: 3 + Math.floor(Math.random() * 4),
            avgBuyPrice: 0,
            category: 'ORE',
          };

          const newLoot: FloatingLoot = {
            id: `loot_${Date.now()}_${Math.random()}`,
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            item: lootItem,
            lifetime: 45,
          };

          set((state) => ({
            player: {
              ...state.player,
              credits: state.player.credits + bountyReward,
            },
            world: {
              ...state.world,
              enemies: updatedEnemies,
              floatingLoot: [...state.world.floatingLoot, newLoot],
            },
          }));

          return { destroyed: true, enemy };
        }

        const updatedEnemies = world.enemies.map((e) =>
          e.id === enemyId ? { ...e, hull, shield } : e
        );

        set((state) => ({
          world: { ...state.world, enemies: updatedEnemies },
        }));

        return { destroyed: false };
      },

      damageAsteroid: (asteroidId, rawDamage) => {
        const { world } = get();
        const asteroid = world.asteroids.find((a) => a.id === asteroidId);
        if (!asteroid) return { destroyed: false };

        const newHealth = Math.max(0, asteroid.health - rawDamage);

        if (newHealth <= 0) {
          SoundManager.playExplosion();
          // Spawn ore loot
          const updatedAsteroids = world.asteroids.filter((a) => a.id !== asteroidId);
          const yieldCount = Math.max(1, asteroid.oreYield);

          const lootItem: InventoryItem = {
            id: asteroid.oreType,
            name: asteroid.oreType === 'fusion_cells' ? 'Plasma Fusion Cells' : 'Refined Titanium Ore',
            quantity: yieldCount,
            avgBuyPrice: 0,
            category: asteroid.oreType === 'fusion_cells' ? 'INDUSTRIAL' : 'ORE',
          };

          const newLoot: FloatingLoot = {
            id: `loot_ore_${Date.now()}_${Math.random()}`,
            x: asteroid.x,
            y: asteroid.y,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            item: lootItem,
            lifetime: 60,
          };

          set((state) => ({
            world: {
              ...state.world,
              asteroids: updatedAsteroids,
              floatingLoot: [...state.world.floatingLoot, newLoot],
            },
          }));

          return { destroyed: true, oreYield: yieldCount, oreType: asteroid.oreType };
        }

        const updatedAsteroids = world.asteroids.map((a) =>
          a.id === asteroidId ? { ...a, health: newHealth } : a
        );

        set((state) => ({
          world: { ...state.world, asteroids: updatedAsteroids },
        }));

        return { destroyed: false };
      },

      updateEnemies: (enemies) => {
        set((state) => ({
          world: { ...state.world, enemies },
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

        const currentCargo = player.inventory.reduce((sum, item) => sum + item.quantity, 0);
        if (currentCargo + loot.item.quantity > player.cargoCapacity) {
          return false; // Cargo full!
        }

        SoundManager.playCash();

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

        return true;
      },

      setCombatAlert: (alert) => set({ combatAlert: alert }),

      jumpSector: () => {
        const currentNum = parseInt(get().world.currentSectorId.replace('Sector-0', '')) || 1;
        const nextSectorId = `Sector-0${currentNum + 1}`;
        const nextSectorData = generateSector(nextSectorId);

        SoundManager.playDock();

        set((state) => ({
          world: {
            ...state.world,
            currentSectorId: nextSectorId,
            sector: nextSectorData.sector,
            stations: nextSectorData.stations,
            asteroids: nextSectorData.asteroids,
            enemies: nextSectorData.enemies,
            projectiles: [],
            floatingLoot: [],
          },
          ship: {
            ...state.ship,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
          },
        }));
      },

      resetGame: () => {
        const fresh = getInitialState();
        const sectorData = generateSector('Sector-01');
        fresh.world.sector = sectorData.sector;
        fresh.world.stations = sectorData.stations;
        fresh.world.asteroids = sectorData.asteroids;
        fresh.world.enemies = sectorData.enemies;
        set(fresh);
      },
    }),
    {
      name: 'galactic-ronin-storage',
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
      }),
    }
  )
);
