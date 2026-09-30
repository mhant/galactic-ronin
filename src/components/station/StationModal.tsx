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
  Music,
  Volume2,
  VolumeX,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Inbox,
} from 'lucide-react';

export const StationModal: React.FC = () => {
  const world = useGameStore((state) => state.world);
  const market = useGameStore((state) => state.market);
  const player = useGameStore((state) => state.player);
  const ship = useGameStore((state) => state.ship);
  const musicEnabled = useGameStore((state) => state.musicEnabled);
  const sfxEnabled = useGameStore((state) => state.sfxEnabled);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const toggleSound = useGameStore((state) => state.toggleSound);
  const toggleMusic = useGameStore((state) => state.toggleMusic);
  const toggleSFX = useGameStore((state) => state.toggleSFX);
  const undock = useGameStore((state) => state.undock);
  const buyCommodity = useGameStore((state) => state.buyCommodity);
  const sellCommodity = useGameStore((state) => state.sellCommodity);
  const sellAllCargo = useGameStore((state) => state.sellAllCargo);
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

  // Food rations in player hold
  const foodItem = player.inventory.find((i) => i.id === 'food_packs');
  const foodOwnedQty = foodItem ? foodItem.quantity : 0;
  const foodMarketItem = market.commodities.find((c) => c.id === 'food_packs');
  const foodSellPrice = foodMarketItem ? foodMarketItem.sellPrice : 30;

  // Total liquidation value of all cargo in hold
  const totalCargoValue = player.inventory.reduce((total, item) => {
    const mItem = market.commodities.find((c) => c.id === item.id);
    const price = mItem ? mItem.sellPrice : 25;
    return total + price * item.quantity;
  }, 0);

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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 md:p-5 select-none font-mono">
      <div className="w-full max-w-7xl bg-slate-900 border-2 border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Unified Station Top Bar */}
        <div className="bg-slate-950 px-5 py-3 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span
              className="w-3.5 h-3.5 rounded-full shadow-lg"
              style={{ backgroundColor: activeStation.color }}
            />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base md:text-lg font-bold text-white tracking-wide">
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

          {/* Quick Stats & Audio Controls & Actions */}
          <div className="flex items-center space-x-2.5">
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

            {/* Music Toggle */}
            <button
              onClick={toggleMusic}
              className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                musicEnabled
                  ? 'bg-purple-950/80 border-purple-500/50 text-purple-300'
                  : 'bg-slate-900 border-slate-700 text-slate-500'
              }`}
              title="Toggle Music"
            >
              <Music className="w-4 h-4" />
            </button>

            {/* SFX Toggle */}
            <button
              onClick={toggleSFX}
              className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                sfxEnabled
                  ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-900 border-slate-700 text-slate-500'
              }`}
              title="Toggle Sound Effects"
            >
              {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Master Mute Toggle */}
            <button
              onClick={toggleSound}
              className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                soundEnabled
                  ? 'bg-slate-900 border-slate-700 text-emerald-400'
                  : 'bg-rose-950/80 border-rose-500/50 text-rose-400'
              }`}
              title="Master Audio Mute"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

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

        {/* Unified One-Screen Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT COLUMN: ESSENTIALS & SHIP UPGRADES (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* MODULE 1: ESSENTIALS (Fuel, Rations, Repair) */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 border-b border-cyan-500/30 pb-1.5">
                <Fuel className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-cyan-300 tracking-wider uppercase">
                  1. Station Essentials
                </h3>
              </div>

              {/* Fuel Depo */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5">
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
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-[11px] text-slate-400">
                    {fuelNeeded > 0 ? `${fuelCost} CR (${activeStation.fuelPricePerUnit} CR/u)` : 'Tanks Full'}
                  </span>
                  <button
                    onClick={() => refuelShip(fuelNeeded)}
                    disabled={fuelNeeded <= 0 || player.credits < fuelCost}
                    className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:pointer-events-none text-black font-bold text-xs transition-all active:scale-95"
                  >
                    {fuelNeeded <= 0 ? 'FULL' : `FILL TANK (${fuelCost} CR)`}
                  </button>
                </div>
              </div>

              {/* Food Rations (Clearly Separated BUY and SELL) */}
              <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-emerald-400" /> Food Rations Depot
                  </span>
                  <span className="text-cyan-300 font-bold text-[11px] bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                    In Hold: {foodOwnedQty} packs
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900 text-xs">
                  {/* Buy Section */}
                  <div className="space-y-1.5 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                      <ArrowDownCircle className="w-3 h-3 text-cyan-400" /> BUY RATIONS (35 CR)
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => buyFoodRations(1)}
                        disabled={remainingCargo < 1 || player.credits < 35}
                        className="flex-1 py-1 rounded bg-cyan-700/80 hover:bg-cyan-600 disabled:opacity-25 disabled:pointer-events-none text-white font-bold text-[10px] transition-all active:scale-95"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => buyFoodRations(5)}
                        disabled={remainingCargo < 5 || player.credits < 175}
                        className="flex-1 py-1 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-25 disabled:pointer-events-none text-black font-bold text-[10px] transition-all active:scale-95"
                      >
                        +5
                      </button>
                    </div>
                  </div>

                  {/* Sell Section */}
                  <div className="space-y-1.5 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                      <ArrowUpCircle className="w-3 h-3 text-emerald-400" /> SELL RATIONS ({foodSellPrice} CR)
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => sellCommodity('food_packs', 1)}
                        disabled={foodOwnedQty < 1}
                        className="flex-1 py-1 rounded bg-emerald-700/80 hover:bg-emerald-600 disabled:opacity-25 disabled:pointer-events-none text-white font-bold text-[10px] transition-all active:scale-95"
                      >
                        SELL 1
                      </button>
                      <button
                        onClick={() => sellCommodity('food_packs', foodOwnedQty)}
                        disabled={foodOwnedQty <= 0}
                        className="flex-1 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-25 disabled:pointer-events-none text-black font-bold text-[10px] transition-all active:scale-95"
                      >
                        ALL ({foodOwnedQty})
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hull Repair */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5">
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
                <div className="flex justify-between items-center pt-0.5">
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

            {/* MODULE 2: SHIP UPGRADES */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center space-x-2 border-b border-cyan-500/30 pb-1.5">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-cyan-300 tracking-wider uppercase">
                  2. Ship Upgrades
                </h3>
              </div>

              {/* Guns */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                    <span>Laser Cannons (Guns)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Tier {weaponLvl}/5 • +25% Dmg & Fire Rate
                  </div>
                </div>
                <button
                  onClick={upgradeWeapon}
                  disabled={weaponLvl >= 5 || player.credits < weaponCost}
                  className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs transition-all active:scale-95"
                >
                  {weaponLvl >= 5 ? 'MAX' : `UPGRADE (${weaponCost} CR)`}
                </button>
              </div>

              {/* Shields */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Deflector Generator</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Tier {shieldLvl}/5 • +25 Shield & Recharge
                  </div>
                </div>
                <button
                  onClick={upgradeShield}
                  disabled={shieldLvl >= 5 || player.credits < shieldCost}
                  className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs transition-all active:scale-95"
                >
                  {shieldLvl >= 5 ? 'MAX' : `UPGRADE (${shieldCost} CR)`}
                </button>
              </div>

              {/* Engines */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ion Thrusters (Engines)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Tier {engineLvl}/5 • +15% Speed & Turn Rate
                  </div>
                </div>
                <button
                  onClick={upgradeEngine}
                  disabled={engineLvl >= 5 || player.credits < engineCost}
                  className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs transition-all active:scale-95"
                >
                  {engineLvl >= 5 ? 'MAX' : `UPGRADE (${engineCost} CR)`}
                </button>
              </div>

              {/* Bigger Ship Class */}
              <div className="bg-slate-950/80 border border-purple-500/40 rounded-xl p-2.5 space-y-1.5">
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
                    ? `Upgrade to ${nextShipTierName}: +${shipTier === 1 ? '25' : '40'} Cargo, +${shipTier === 1 ? '50' : '80'} HP, +${shipTier === 1 ? '30' : '50'} Fuel!`
                    : 'Maximum Flagship Battlecruiser achieved!'}
                </p>
                <button
                  onClick={upgradeShipChassis}
                  disabled={shipTier >= 3 || player.credits < chassisCost}
                  className="w-full py-1.5 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs transition-all active:scale-95"
                >
                  {shipTier >= 3 ? 'MAX SHIP CLASS' : `BUY ${nextShipTierName.toUpperCase()} (${chassisCost} CR)`}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT AREA: CARGO HOLD TO SELL & STATION COMMODITIES (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* SECTION A: YOUR CARGO HOLD (CLEARLY HIGHLIGHTED AS ITEMS YOU CAN SELL) */}
            <div className="bg-slate-950/80 border-2 border-emerald-500/50 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                <div className="flex items-center space-x-2">
                  <Inbox className="w-4 h-4 text-emerald-400" />
                  <div>
                    <h3 className="text-xs font-bold text-emerald-300 tracking-wider uppercase">
                      Your Cargo Hold (Items You Can Sell Here)
                    </h3>
                    <div className="text-[10px] text-slate-400">
                      Total Cargo: <strong className="text-white">{currentCargo} units</strong> • Total Value: <strong className="text-yellow-400">{totalCargoValue} CR</strong>
                    </div>
                  </div>
                </div>

                {/* Sell All Cargo Button */}
                {player.inventory.length > 0 && (
                  <button
                    onClick={() => sellAllCargo()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-all shadow-glow-green active:scale-95"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>SELL ALL CARGO (+{totalCargoValue} CR)</span>
                  </button>
                )}
              </div>

              {/* List of Player Cargo Hold Items */}
              {player.inventory.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                  <Package className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="font-semibold text-slate-300">Your cargo hold is currently empty.</p>
                  <p className="text-[11px] text-slate-500">
                    Mine asteroids with your laser in space, or buy commodities below to sell at other stations.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {player.inventory.map((item) => {
                    const marketItem = market.commodities.find((c) => c.id === item.id);
                    const sellPrice = marketItem ? marketItem.sellPrice : 25;
                    const profitPerUnit = item.avgBuyPrice > 0 ? sellPrice - item.avgBuyPrice : sellPrice;
                    const totalItemValue = sellPrice * item.quantity;

                    return (
                      <div
                        key={item.id}
                        className="bg-slate-900 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs hover:border-emerald-400/60 transition-all"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-100 flex items-center space-x-1.5">
                            {item.category === 'CONTRABAND' && (
                              <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
                            )}
                            <span>{item.name}</span>
                            <span className="text-[10px] px-2 py-0.2 rounded bg-slate-800 text-slate-300 font-normal">
                              {item.category}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Quantity: <strong className="text-cyan-300">{item.quantity} units</strong>
                            {item.avgBuyPrice > 0 ? (
                              <span className="text-slate-500 ml-1.5">(Cost: {item.avgBuyPrice} CR/u)</span>
                            ) : (
                              <span className="text-emerald-400 ml-1.5 font-semibold">(Mined Resource)</span>
                            )}
                          </div>
                        </div>

                        {/* Price & Action Buttons */}
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="text-emerald-400 font-bold text-sm">
                              +{totalItemValue} CR
                            </div>
                            <div
                              className={`text-[10px] flex items-center justify-end font-semibold ${
                                profitPerUnit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {profitPerUnit >= 0 ? <TrendingUp className="w-3 h-3 inline mr-0.5" /> : <TrendingDown className="w-3 h-3 inline mr-0.5" />}
                              <span>{profitPerUnit >= 0 ? `+${profitPerUnit}` : profitPerUnit} CR / u</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => sellCommodity(item.id, 1)}
                              className="px-2.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-all active:scale-95"
                            >
                              SELL 1
                            </button>
                            <button
                              onClick={() => sellCommodity(item.id, item.quantity)}
                              className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-all shadow-md active:scale-95"
                            >
                              SELL ALL ({item.quantity})
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION B: STATION COMMODITIES (BUY GOODS TO TRADE) */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <Coins className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-cyan-300 tracking-wider uppercase">
                    Station Commodities (Buy to Trade Elsewhere)
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400">
                  Hold Space: <strong className="text-white">{remainingCargo} units</strong>
                </span>
              </div>

              {/* Commodities Market List */}
              <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
                {market.commodities.map((item) => {
                  const canBuy1 = remainingCargo >= 1 && player.credits >= item.buyPrice && item.quantity >= 1;
                  const canBuy5 = remainingCargo >= 5 && player.credits >= item.buyPrice * 5 && item.quantity >= 5;

                  return (
                    <div
                      key={item.id}
                      className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-2.5 flex items-center justify-between text-xs transition-all"
                    >
                      <div>
                        <div className="font-bold text-slate-200 flex items-center space-x-1.5">
                          {item.illegal && (
                            <span title="Contraband">
                              <AlertOctagon className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            </span>
                          )}
                          <span>{item.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Price: <strong className="text-yellow-400 font-bold">{item.buyPrice} CR</strong> • In Stock: <span className="text-slate-300">{item.quantity}</span>
                        </div>
                      </div>

                      {/* Buy Buttons */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => buyCommodity(item.id, 1)}
                          disabled={!canBuy1}
                          className="px-2.5 py-1 rounded bg-cyan-700/80 hover:bg-cyan-600 disabled:opacity-25 disabled:pointer-events-none text-white font-bold text-xs transition-all active:scale-95"
                        >
                          BUY 1
                        </button>
                        <button
                          onClick={() => buyCommodity(item.id, 5)}
                          disabled={!canBuy5}
                          className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 disabled:opacity-25 disabled:pointer-events-none text-black font-black text-xs transition-all active:scale-95 shadow-md"
                        >
                          BUY 5
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
    </div>
  );
};
