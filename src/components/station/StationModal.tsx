import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import {
  X,
  TrendingUp,
  TrendingDown,
  Wrench,
  Fuel,
  Package,
  ShoppingBag,
  Compass,
  ArrowRight,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';

export const StationModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TRADE' | 'SERVICES' | 'GATE'>('TRADE');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  const world = useGameStore((state) => state.world);
  const market = useGameStore((state) => state.market);
  const player = useGameStore((state) => state.player);
  const undock = useGameStore((state) => state.undock);
  const buyCommodity = useGameStore((state) => state.buyCommodity);
  const sellCommodity = useGameStore((state) => state.sellCommodity);
  const refuelShip = useGameStore((state) => state.refuelShip);
  const repairShip = useGameStore((state) => state.repairShip);
  const upgradeCargo = useGameStore((state) => state.upgradeCargo);
  const jumpSector = useGameStore((state) => state.jumpSector);

  const activeStation = world.stations.find((s) => s.id === market.activeStationId);
  if (!activeStation) return null;

  const currentCargo = player.inventory.reduce((sum, item) => sum + item.quantity, 0);
  const remainingCargo = player.cargoCapacity - currentCargo;

  const fuelNeeded = Math.round(player.maxFuel - player.fuel);
  const fuelCost = fuelNeeded * activeStation.fuelPricePerUnit;

  const hullNeeded = Math.round(player.maxHull - player.hull);
  const hullCost = hullNeeded * activeStation.repairPricePerPoint;

  const cargoUpgradeCost = Math.round(player.cargoCapacity * 35);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none font-mono">
      <div className="w-full max-w-4xl bg-slate-900 border-2 border-cyan-500/50 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Station Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-cyan-500/30 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <span
                className="w-3.5 h-3.5 rounded-full shadow-lg"
                style={{ backgroundColor: activeStation.color }}
              />
              <h2 className="text-xl font-bold text-white tracking-wide">
                {activeStation.name.toUpperCase()}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-cyan-500/30 font-semibold">
                {activeStation.type}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {activeStation.description}
            </p>
          </div>

          <button
            onClick={undock}
            className="flex items-center space-x-1.5 bg-rose-600/80 hover:bg-rose-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-colors active:scale-95 shadow-glow-red"
          >
            <span>UNDOCK SHIP</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="bg-slate-950/70 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-slate-400">CREDITS: </span>
              <span className="text-yellow-400 font-bold text-sm">
                {player.credits.toLocaleString()} CR
              </span>
            </div>
            <div>
              <span className="text-slate-400">CARGO: </span>
              <span className="text-cyan-300 font-bold">
                {currentCargo} / {player.cargoCapacity}
              </span>
              <span className="text-slate-500 ml-1">({remainingCargo} Free)</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('TRADE')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTab === 'TRADE'
                  ? 'bg-cyan-500 text-black shadow-glow-cyan'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>MARKETPLACE</span>
            </button>

            <button
              onClick={() => setActiveTab('SERVICES')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTab === 'SERVICES'
                  ? 'bg-cyan-500 text-black shadow-glow-cyan'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>SHIP SERVICES</span>
            </button>

            <button
              onClick={() => setActiveTab('GATE')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTab === 'GATE'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>HYPER-GATE</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'TRADE' && (
            <div className="space-y-4">
              {/* Batch quantity selector */}
              <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400">TRANSACTION BATCH SIZE:</span>
                <div className="flex space-x-2">
                  {[1, 5, 10, 25].map((qty) => (
                    <button
                      key={qty}
                      onClick={() => setSelectedQuantity(qty)}
                      className={`px-2.5 py-1 rounded font-bold transition-colors ${
                        selectedQuantity === qty
                          ? 'bg-cyan-500 text-black'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {qty}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Commodities Table */}
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Commodity</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">In Hold (Avg Cost)</th>
                      <th className="py-2.5 px-3 text-right">Buy Unit</th>
                      <th className="py-2.5 px-3 text-right">Sell Unit</th>
                      <th className="py-2.5 px-4 text-center">Trade Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {market.commodities.map((item) => {
                      const owned = player.inventory.find((i) => i.id === item.id);
                      const ownedQty = owned ? owned.quantity : 0;
                      const avgCost = owned ? owned.avgBuyPrice : 0;

                      // Profit calculation
                      const profitPerUnit = owned ? item.sellPrice - avgCost : 0;
                      const canBuy =
                        remainingCargo >= selectedQuantity &&
                        player.credits >= item.buyPrice * selectedQuantity &&
                        item.quantity >= selectedQuantity;
                      const canSell = ownedQty >= selectedQuantity;

                      return (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-100 flex items-center space-x-1.5">
                              {item.illegal && (
                                <span title="Contraband Item">
                                  <AlertOctagon className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                </span>
                              )}
                              <span>{item.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                              {item.description}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                              {item.category}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            {ownedQty > 0 ? (
                              <div>
                                <span className="font-bold text-cyan-300">{ownedQty} units</span>
                                <div className="text-[10px] text-slate-400">@ {avgCost} CR</div>
                              </div>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right font-bold text-yellow-400">
                            {item.buyPrice} CR
                            <div className="text-[9px] text-slate-500">Stock: {item.quantity}</div>
                          </td>

                          <td className="py-3 px-3 text-right font-bold text-emerald-400">
                            {item.sellPrice} CR
                            {ownedQty > 0 && (
                              <div
                                className={`text-[9px] flex items-center justify-end space-x-0.5 ${
                                  profitPerUnit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {profitPerUnit >= 0 ? (
                                  <TrendingUp className="w-2.5 h-2.5" />
                                ) : (
                                  <TrendingDown className="w-2.5 h-2.5" />
                                )}
                                <span>{profitPerUnit >= 0 ? `+${profitPerUnit}` : profitPerUnit} CR</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => buyCommodity(item.id, selectedQuantity)}
                                disabled={!canBuy}
                                className="px-3 py-1.5 rounded bg-cyan-600/80 hover:bg-cyan-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold transition-colors active:scale-95"
                              >
                                BUY {selectedQuantity}x
                              </button>
                              <button
                                onClick={() => sellCommodity(item.id, selectedQuantity)}
                                disabled={!canSell}
                                className="px-3 py-1.5 rounded bg-emerald-600/80 hover:bg-emerald-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold transition-colors active:scale-95"
                              >
                                SELL {selectedQuantity}x
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'SERVICES' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Refueling Card */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                    <Fuel className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white text-sm">Refueling Depot</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Replenish liquid antimatter thruster propellant.
                  </p>
                  <div className="mt-4 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Rate:</span>
                      <span className="text-slate-200">{activeStation.fuelPricePerUnit} CR / Unit</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Required:</span>
                      <span className="text-amber-400 font-bold">{fuelNeeded} Units</span>
                    </div>
                    <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                      <span>Total Cost:</span>
                      <span className="text-yellow-400 font-bold">{fuelCost} CR</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => refuelShip(fuelNeeded)}
                  disabled={fuelNeeded <= 0 || player.credits < fuelCost}
                  className="mt-6 w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:pointer-events-none text-black font-bold text-xs transition-all active:scale-95"
                >
                  {fuelNeeded <= 0 ? 'TANKS FULL' : `REFUEL FULL (${fuelCost} CR)`}
                </button>
              </div>

              {/* Hull Repair Card */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white text-sm">Hull Drydock Repair</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Nanite welding and structural armor plate patching.
                  </p>
                  <div className="mt-4 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Rate:</span>
                      <span className="text-slate-200">{activeStation.repairPricePerPoint} CR / Point</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Damage:</span>
                      <span className="text-rose-400 font-bold">{hullNeeded} Points</span>
                    </div>
                    <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                      <span>Total Cost:</span>
                      <span className="text-yellow-400 font-bold">{hullCost} CR</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => repairShip(hullNeeded)}
                  disabled={hullNeeded <= 0 || player.credits < hullCost}
                  className="mt-6 w-full py-2.5 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs transition-all active:scale-95"
                >
                  {hullNeeded <= 0 ? 'HULL PRISTINE' : `REPAIR ALL (${hullCost} CR)`}
                </button>
              </div>

              {/* Cargo Expansion Card */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
                    <Package className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white text-sm">Cargo Hold Expansion</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Install pressurized magnetic cargo racks (+10 capacity).
                  </p>
                  <div className="mt-4 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Current Size:</span>
                      <span className="text-slate-200">{player.cargoCapacity} Units</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>New Size:</span>
                      <span className="text-cyan-400 font-bold">{player.cargoCapacity + 10} Units</span>
                    </div>
                    <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                      <span>Upgrade Cost:</span>
                      <span className="text-yellow-400 font-bold">{cargoUpgradeCost} CR</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={upgradeCargo}
                  disabled={player.credits < cargoUpgradeCost}
                  className="mt-6 w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:pointer-events-none text-black font-bold text-xs transition-all active:scale-95"
                >
                  EXPAND CARGO ({cargoUpgradeCost} CR)
                </button>
              </div>
            </div>
          )}

          {activeTab === 'GATE' && (
            <div className="max-w-xl mx-auto bg-slate-950/70 border border-purple-500/40 rounded-xl p-6 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Sub-Space Hyper-Jump Array</h3>
              <p className="text-xs text-slate-400">
                Align warp coils with the next frontier sector. All ongoing local pirate bounties and market supply loops will reset to the new destination.
              </p>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Origin:</span>
                  <span className="text-slate-200 font-bold">{world.currentSectorId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Destination:</span>
                  <span className="text-purple-400 font-bold">Uncharted Next Sector</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hyper-Drive Charge:</span>
                  <span className="text-emerald-400 font-bold">READY</span>
                </div>
              </div>

              <button
                onClick={() => {
                  jumpSector();
                  undock();
                }}
                className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>INITIATE HYPER-SPACE JUMP</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
