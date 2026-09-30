import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import {
  X,
  Fuel,
  Wrench,
  Utensils,
  Crosshair,
  Shield,
  Flame,
  Rocket,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Coins,
  Package,
  AlertOctagon,
} from 'lucide-react';

export const StationModal: React.FC = () => {
  const world = useGameStore((state) => state.world);
  const market = useGameStore((state) => state.market);
  const player = useGameStore((state) => state.player);
  const ship = useGameStore((state) => state.ship);
  const undock = useGameStore((state) => state.undock);
  const buyCommodity = useGameStore((state) => state.buyCommodity);
  const sellCommodity = useGameStore((state) => state.sellCommodity);
  const refuelShip = useGameStore((state) => state.refuelShip);
  const repairShip = useGameStore((state) => state.repairShip);
  const upgradeWeapon = useGameStore((state) => state.upgradeWeapon);
  const upgradeShield = useGameStore((state) => state.upgradeShield);
  const upgradeEngine = useGameStore((state) => state.upgradeEngine);
  const upgradeShipChassis = useGameStore((state) => state.upgradeShipChassis);
  const buyFoodRations = useGameStore((state) => state.buyFoodRations);
  const jumpSector = useGameStore((state) => state.jumpSector);

  const activeStation = world.stations.find((s) => s.id === market.activeStationId);
  if (!activeStation) return null;

  const currentCargo = player.inventory.reduce((sum, item) => sum + item.quantity, 0);
  const remainingCargo = player.cargoCapacity - currentCargo;

  const fuelNeeded = Math.round(player.maxFuel - player.fuel);
  const fuelCost = fuelNeeded * activeStation.fuelPricePerUnit;

  const hullNeeded = Math.round(player.maxHull - player.hull);
  const hullCost = hullNeeded * activeStation.repairPricePerPoint;

  // Upgrade costs & labels
  const weaponLvl = ship.weaponLevel || 1;
  const weaponCost = weaponLvl * 450;

  const shieldLvl = ship.shieldLevel || 1;
  const shieldCost = shieldLvl * 400;

  const engineLvl = ship.engineLevel || 1;
  const engineCost = engineLvl * 350;

  const shipTier = ship.shipTier || 1;
  const shipTierNames = ['Ronin Scout', 'Ronin Heavy Frigate', 'Ronin Battlecruiser'];
  const nextShipTierName = shipTier < 3 ? shipTierNames[shipTier] : 'Maximum Class';
  const chassisCost = shipTier === 1 ? 1600 : 3800;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 select-none font-mono">
      <div className="w-full max-w-6xl bg-slate-900 border-2 border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Unified Station Top Bar */}
        <div className="bg-slate-950 px-6 py-3.5 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span
              className="w-3.5 h-3.5 rounded-full shadow-lg"
              style={{ backgroundColor: activeStation.color }}
            />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg md:text-xl font-bold text-white tracking-wide">
                  {activeStation.name.toUpperCase()}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-cyan-500/30 font-semibold">
                  {activeStation.type}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                {activeStation.description}
              </p>
            </div>
          </div>

          {/* Quick Stats & Action Buttons */}
          <div className="flex items-center space-x-4">
            {/* Credits Pill */}
            <div className="flex items-center space-x-1.5 bg-slate-900 border border-yellow-500/40 px-3 py-1.5 rounded-lg text-xs">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-300 font-bold text-sm">
                {player.credits.toLocaleString()} CR
              </span>
            </div>

            {/* Cargo Pill */}
            <div className="flex items-center space-x-1.5 bg-slate-900 border border-cyan-500/40 px-3 py-1.5 rounded-lg text-xs">
              <Package className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-200 font-bold">
                {currentCargo}/{player.cargoCapacity} <span className="text-slate-400 text-[10px]">({remainingCargo} Free)</span>
              </span>
            </div>

            {/* Sector Jump Button */}
            <button
              onClick={() => {
                jumpSector();
                undock();
              }}
              className="hidden sm:flex items-center space-x-1 bg-purple-700/80 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
              title="Jump to Next Sector"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>HYPER-JUMP</span>
            </button>

            {/* Undock */}
            <button
              onClick={undock}
              className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-glow-red"
            >
              <span>UNDOCK</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Unified One-Screen Content: 3 Focused Sections */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* SECTION 1: ESSENTIALS (Fuel, Food, Repair) - 4 Cols */}
          <div className="lg:col-span-4 flex flex-col space-y-4">
            <div className="flex items-center space-x-2 border-b border-cyan-500/30 pb-2">
              <Fuel className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-cyan-300 tracking-wider uppercase">
                1. Station Essentials
              </h3>
            </div>

            {/* Fuel Depo */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-amber-400" /> Refuel Tanks
                </span>
                <span className="text-slate-400 text-[11px]">
                  {Math.round(player.fuel)} / {player.maxFuel} Fuel
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-amber-400 shadow-glow-amber transition-all"
                  style={{ width: `${(player.fuel / player.maxFuel) * 100}%` }}
                />
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[11px] text-slate-400">
                  {fuelNeeded > 0 ? `${fuelCost} CR (${activeStation.fuelPricePerUnit} CR/u)` : 'Full'}
                </span>
                <button
                  onClick={() => refuelShip(fuelNeeded)}
                  disabled={fuelNeeded <= 0 || player.credits < fuelCost}
                  className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:pointer-events-none text-black font-bold text-xs transition-all active:scale-95"
                >
                  {fuelNeeded <= 0 ? 'TANKS FULL' : `FILL TANK (${fuelCost} CR)`}
                </button>
              </div>
            </div>

            {/* Food Rations */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-emerald-400" /> Food Rations
                </span>
                <span className="text-slate-400 text-[11px]">
                  35 CR / Unit
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Essential subsistence packs required for long journeys and high demand at outposts.
              </p>
              <div className="flex space-x-2 pt-1">
                <button
                  onClick={() => buyFoodRations(1)}
                  disabled={remainingCargo < 1 || player.credits < 35}
                  className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 font-bold text-xs border border-slate-700 transition-all active:scale-95"
                >
                  BUY 1 (35 CR)
                </button>
                <button
                  onClick={() => buyFoodRations(5)}
                  disabled={remainingCargo < 5 || player.credits < 175}
                  className="flex-1 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs transition-all active:scale-95 shadow-md"
                >
                  BUY 5 (175 CR)
                </button>
              </div>
            </div>

            {/* Hull Repair */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-rose-400" /> Hull Repair
                </span>
                <span className="text-slate-400 text-[11px]">
                  {Math.round(player.hull)} / {player.maxHull} HP
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-rose-500 shadow-glow-red transition-all"
                  style={{ width: `${(player.hull / player.maxHull) * 100}%` }}
                />
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[11px] text-slate-400">
                  {hullNeeded > 0 ? `${hullCost} CR (${activeStation.repairPricePerPoint} CR/pt)` : 'Pristine'}
                </span>
                <button
                  onClick={() => repairShip(hullNeeded)}
                  disabled={hullNeeded <= 0 || player.credits < hullCost}
                  className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs transition-all active:scale-95 shadow-md"
                >
                  {hullNeeded <= 0 ? 'REPAIRED' : `REPAIR ALL (${hullCost} CR)`}
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: SHIP UPGRADES (Guns, Shields, Engines, Bigger Ship) - 4 Cols */}
          <div className="lg:col-span-4 flex flex-col space-y-3.5">
            <div className="flex items-center space-x-2 border-b border-cyan-500/30 pb-2">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-cyan-300 tracking-wider uppercase">
                2. Ship Upgrades
              </h3>
            </div>

            {/* Guns Upgrade */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                  <span>Laser Cannons (Guns)</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Tier {weaponLvl}/5 • +25% Dmg & Faster Fire
                </div>
              </div>
              <button
                onClick={upgradeWeapon}
                disabled={weaponLvl >= 5 || player.credits < weaponCost}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs transition-all active:scale-95 shadow-md"
              >
                {weaponLvl >= 5 ? 'MAX' : `UPGRADE (${weaponCost} CR)`}
              </button>
            </div>

            {/* Shields Upgrade */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Deflector Generator</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Tier {shieldLvl}/5 • +25 Max Shield & Recharge
                </div>
              </div>
              <button
                onClick={upgradeShield}
                disabled={shieldLvl >= 5 || player.credits < shieldCost}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs transition-all active:scale-95 shadow-md"
              >
                {shieldLvl >= 5 ? 'MAX' : `UPGRADE (${shieldCost} CR)`}
              </button>
            </div>

            {/* Engines Upgrade */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ion Thrusters (Engines)</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Tier {engineLvl}/5 • +15% Speed & Agility
                </div>
              </div>
              <button
                onClick={upgradeEngine}
                disabled={engineLvl >= 5 || player.credits < engineCost}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs transition-all active:scale-95 shadow-md"
              >
                {engineLvl >= 5 ? 'MAX' : `UPGRADE (${engineCost} CR)`}
              </button>
            </div>

            {/* Bigger Ship Chassis Upgrade */}
            <div className="bg-slate-950/80 border border-purple-500/40 rounded-xl p-3.5 space-y-2 shadow-lg">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-purple-300 flex items-center gap-1.5">
                  <Rocket className="w-3.5 h-3.5 text-purple-400" /> Bigger Ship Class
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 font-bold border border-purple-500/30">
                  {shipTierNames[shipTier - 1]}
                </span>
              </div>
              <p className="text-[10px] text-slate-300">
                {shipTier < 3
                  ? `Upgrade to ${nextShipTierName}: +${shipTier === 1 ? '25' : '40'} Cargo, +${shipTier === 1 ? '50' : '80'} Max Hull, +${shipTier === 1 ? '30' : '50'} Fuel!`
                  : 'Your flagship has achieved maximum dreadnought class!'}
              </p>
              <button
                onClick={upgradeShipChassis}
                disabled={shipTier >= 3 || player.credits < chassisCost}
                className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs transition-all active:scale-95 shadow-md"
              >
                {shipTier >= 3 ? 'MAX SHIP CLASS' : `BUY ${nextShipTierName.toUpperCase()} (${chassisCost} CR)`}
              </button>
            </div>
          </div>

          {/* SECTION 3: COMMODITIES (Clean, concise trading table) - 4 Cols */}
          <div className="lg:col-span-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-yellow-400" />
                <h3 className="text-xs font-bold text-cyan-300 tracking-wider uppercase">
                  3. Commodities Market
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">Buy Low • Sell High</span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[420px] pr-1">
              {market.commodities.map((item) => {
                const owned = player.inventory.find((i) => i.id === item.id);
                const ownedQty = owned ? owned.quantity : 0;
                const avgCost = owned ? owned.avgBuyPrice : 0;
                const profitPerUnit = owned ? item.sellPrice - avgCost : 0;

                const canBuy1 = remainingCargo >= 1 && player.credits >= item.buyPrice && item.quantity >= 1;
                const canBuy5 = remainingCargo >= 5 && player.credits >= item.buyPrice * 5 && item.quantity >= 5;
                const canSell1 = ownedQty >= 1;

                return (
                  <div
                    key={item.id}
                    className="bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-3 transition-colors space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-200 flex items-center space-x-1">
                          {item.illegal && (
                            <span title="Contraband">
                              <AlertOctagon className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            </span>
                          )}
                          <span>{item.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          In Hold: <span className="text-cyan-300 font-bold">{ownedQty}</span>
                          {ownedQty > 0 && <span className="text-slate-500 ml-1">(@{avgCost} CR)</span>}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-yellow-400 font-bold text-xs">
                          {item.buyPrice} CR <span className="text-[9px] text-slate-400 font-normal">BUY</span>
                        </div>
                        <div className="text-emerald-400 font-bold text-xs flex items-center justify-end space-x-0.5">
                          <span>{item.sellPrice} CR</span>
                          <span className="text-[9px] text-slate-400 font-normal">SELL</span>
                          {ownedQty > 0 && (
                            <span
                              className={`text-[9px] ml-1 flex items-center ${
                                profitPerUnit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {profitPerUnit >= 0 ? <TrendingUp className="w-2.5 h-2.5 inline" /> : <TrendingDown className="w-2.5 h-2.5 inline" />}
                              {profitPerUnit >= 0 ? `+${profitPerUnit}` : profitPerUnit}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Trade Buttons */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-900">
                      <button
                        onClick={() => buyCommodity(item.id, 1)}
                        disabled={!canBuy1}
                        className="py-1 rounded bg-cyan-700/80 hover:bg-cyan-600 disabled:opacity-25 disabled:pointer-events-none text-white font-bold text-[10px] transition-all active:scale-95"
                      >
                        BUY 1
                      </button>
                      <button
                        onClick={() => buyCommodity(item.id, 5)}
                        disabled={!canBuy5}
                        className="py-1 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-25 disabled:pointer-events-none text-black font-bold text-[10px] transition-all active:scale-95"
                      >
                        BUY 5
                      </button>
                      <button
                        onClick={() => sellCommodity(item.id, 1)}
                        disabled={!canSell1}
                        className="py-1 rounded bg-emerald-700/80 hover:bg-emerald-600 disabled:opacity-25 disabled:pointer-events-none text-white font-bold text-[10px] transition-all active:scale-95"
                      >
                        SELL 1
                      </button>
                      <button
                        onClick={() => sellCommodity(item.id, ownedQty)}
                        disabled={ownedQty <= 0}
                        className="py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-25 disabled:pointer-events-none text-black font-bold text-[10px] transition-all active:scale-95"
                      >
                        ALL ({ownedQty})
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
