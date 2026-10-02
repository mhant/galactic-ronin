import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { SHIP_CLASSES, getShipClass, ESCORT_CLASSES } from '../../data/shipClasses';
import { MINERAL_LIST, getMineral } from '../../data/minerals';
import {
  X,
  Fuel,
  Wrench,
  Crosshair,
  Sparkles,
  Coins,
  Package,
  Music,
  Volume2,
  VolumeX,
  Gem,
  Rocket,
  ScrollText,
  AlertTriangle,
  Award,
  Users,
  ChevronRight,
} from 'lucide-react';

export const StationModal: React.FC = () => {
  const world = useGameStore((state) => state.world);
  const market = useGameStore((state) => state.market);
  const player = useGameStore((state) => state.player);
  const ship = useGameStore((state) => state.ship);
  const activeMission = useGameStore((state) => state.activeMission);
  const stationMissions = useGameStore((state) => state.stationMissions);
  const completedMissionsCount = useGameStore((state) => state.completedMissionsCount);
  const acceptMission = useGameStore((state) => state.acceptMission);
  const abandonActiveMission = useGameStore((state) => state.abandonActiveMission);

  const musicEnabled = useGameStore((state) => state.musicEnabled);
  const sfxEnabled = useGameStore((state) => state.sfxEnabled);
  const toggleMusic = useGameStore((state) => state.toggleMusic);
  const toggleSFX = useGameStore((state) => state.toggleSFX);
  const undock = useGameStore((state) => state.undock);
  const sellMineral = useGameStore((state) => state.sellMineral);
  const sellAllMinerals = useGameStore((state) => state.sellAllMinerals);
  const refuelShip = useGameStore((state) => state.refuelShip);
  const repairShip = useGameStore((state) => state.repairShip);
  const upgradeCargo = useGameStore((state) => state.upgradeCargo);
  const upgradeWeapon = useGameStore((state) => state.upgradeWeapon);
  const upgradeShield = useGameStore((state) => state.upgradeShield);
  const upgradeEngine = useGameStore((state) => state.upgradeEngine);
  const upgradeShipChassis = useGameStore((state) => state.upgradeShipChassis);
  const buyTorpedoLauncher = useGameStore((state) => state.buyTorpedoLauncher);
  const buyTorpedoAmmo = useGameStore((state) => state.buyTorpedoAmmo);
  const buyEmpGenerator = useGameStore((state) => state.buyEmpGenerator);
  const buyEscortShip = useGameStore((state) => state.buyEscortShip);
  const repairEscorts = useGameStore((state) => state.repairEscorts);
  const jumpSector = useGameStore((state) => state.jumpSector);

  const [activeTab, setActiveTab] = useState<'CONTRACTS' | 'REFINERY' | 'UPGRADES'>(
    activeMission ? 'CONTRACTS' : 'REFINERY'
  );

  const activeStation = world.stations.find((s) => s.id === market.activeStationId);
  if (!activeStation) return null;

  const currentCargo = player.inventory.reduce((sum, item) => sum + item.quantity, 0);
  const remainingCargo = player.cargoCapacity - currentCargo;

  const fuelNeeded = Math.round(player.maxFuel - player.fuel);
  const fuelCost = fuelNeeded * activeStation.fuelPricePerUnit;

  const hullNeeded = Math.round(player.maxHull - player.hull);
  const hullCost = hullNeeded * activeStation.repairPricePerPoint;

  // Total liquidation value of all minerals in cargo hold
  const totalMineralEarnings = player.inventory.reduce((sum, item) => {
    const min = getMineral(item.id);
    return sum + min.unitValue * item.quantity;
  }, 0);

  // Upgrade costs & labels
  const weaponLvl = ship.weaponLevel || 1;
  const weaponCost = Math.round(550 * Math.pow(1.15, weaponLvl - 1));

  // Determine multi-cannon title
  const getWeaponTitle = (lvl: number) => {
    if (lvl <= 8) {
      const baseTitles = [
        'Single Cyan Pulse [1x]',
        'Twin Azure Cannons [2x]',
        'Triple Violet Trident [3x]',
        'Quad Crimson Antimatter [4x]',
        'Overcharged Solar Lance [4x]',
        'Tachyon Disintegrator [4x]',
        'Quantum Singularity [4x]',
        'Apex Hyper-Nova Battery [4x]',
      ];
      return baseTitles[lvl - 1] || 'Apex Laser Battery';
    }
    const cannonCount = Math.min(8, 2 + Math.floor((lvl - 9) / 6));
    return `MK-${lvl} Multi-Battery [${cannonCount}x Cannons]`;
  };

  const shieldLvl = ship.shieldLevel || 1;
  const shieldCost = shieldLvl * 400;

  const engineLvl = ship.engineLevel || 1;
  const engineCost = engineLvl * 350;

  const shipTier = ship.shipTier || 1;
  const currentClassDef = getShipClass(shipTier);
  const nextTier = shipTier + 1;
  const hasNextClass = nextTier <= SHIP_CLASSES.length;
  const nextClassDef = hasNextClass ? getShipClass(nextTier) : null;
  const chassisCost = nextClassDef ? nextClassDef.cost : 0;

  // Secondary weapons & drone states
  const torpUnlocked = weaponLvl >= 2 && shipTier >= 2;
  const torpNeeded = (ship.maxTorpedoes || 5) - (ship.torpedoes || 0);
  const torpCost5 = Math.min(5, torpNeeded) * 45;
  const empUnlocked = shieldLvl >= 3 && shipTier >= 4;

  const maxEscorts = ship.maxEscorts || 0;
  const escorts = ship.escorts || [];
  const escortSpace = maxEscorts - escorts.length;
  const escortDamage = escorts.reduce((acc, e) => acc + (e.maxHull - e.hull) + (e.maxShield - e.shield), 0);
  const escortRepairCost = Math.round(escortDamage * 2.5);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-start p-1.5 sm:p-3 md:p-4 select-none font-mono overflow-hidden">
      <div className="w-full max-w-7xl bg-slate-900 border-2 border-cyan-500/50 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full max-h-[98vh] sm:max-h-[96vh]">
        {/* Unified Top Header Bar (Always pinned and 100% visible on Tablets & Mobile) */}
        <div className="shrink-0 bg-slate-950 px-3 sm:px-5 py-2 sm:py-2.5 border-b border-cyan-500/30 flex flex-wrap items-center justify-between gap-2 z-10">
          <div className="flex items-center space-x-2.5">
            <span
              className="w-3.5 h-3.5 rounded-full shadow-lg shrink-0 animate-pulse"
              style={{ backgroundColor: activeStation.color }}
            />
            <div>
              <div className="flex items-center space-x-1.5">
                <h2 className="text-sm sm:text-base md:text-lg font-black text-white tracking-wide truncate max-w-[180px] sm:max-w-[300px]">
                  {activeStation.name.toUpperCase()}
                </h2>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-800 text-cyan-300 border border-cyan-500/30 font-semibold">
                  {activeStation.type}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-1 hidden sm:block">
                {activeStation.description}
              </p>
            </div>
          </div>

          {/* Quick Stats & Audio Controls & Actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            {/* Credits Pill */}
            <div className="flex items-center space-x-1 bg-slate-900 border border-yellow-500/40 px-2.5 py-1 rounded-lg text-xs">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-yellow-300 font-bold text-xs sm:text-sm font-mono">
                {player.credits.toLocaleString()} <span className="text-[10px] font-normal text-yellow-500">CR</span>
              </span>
            </div>

            {/* Cargo Pill */}
            <div className="flex items-center space-x-1 bg-slate-900 border border-cyan-500/40 px-2.5 py-1 rounded-lg text-xs">
              <Package className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-200 font-bold text-xs font-mono">
                {currentCargo}/{player.cargoCapacity}
              </span>
            </div>

            {/* Music Toggle */}
            <button
              onClick={toggleMusic}
              className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                musicEnabled
                  ? 'bg-purple-950/80 border-purple-500/50 text-purple-300'
                  : 'bg-slate-900 border-slate-700 text-slate-500'
              }`}
              title="Toggle Music"
            >
              <Music className="w-3.5 h-3.5" />
            </button>

            {/* SFX Toggle */}
            <button
              onClick={toggleSFX}
              className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                sfxEnabled
                  ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-900 border-slate-700 text-slate-500'
              }`}
              title="Toggle Sound Effects"
            >
              {sfxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Sector Jump Button */}
            <button
              onClick={() => {
                jumpSector();
                undock();
              }}
              className="hidden md:flex items-center space-x-1 bg-purple-700/90 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              title="Jump to Next Sector"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>HYPER-JUMP</span>
            </button>

            {/* Undock Button */}
            <button
              onClick={undock}
              className="flex items-center space-x-1 bg-rose-600 hover:bg-rose-500 text-white px-3 sm:px-4 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95 shadow-glow-red cursor-pointer"
            >
              <span>UNDOCK</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Unified 3-Tab Bar (Responsive across all screens) */}
        <div className="shrink-0 bg-slate-950/90 px-3 py-1.5 border-b border-cyan-500/20 flex items-center justify-center gap-2">
          {/* Contracts & Missions Tab */}
          <button
            onClick={() => setActiveTab('CONTRACTS')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:px-4 rounded-lg text-xs font-bold border transition-all cursor-pointer relative ${
              activeTab === 'CONTRACTS'
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-glow-amber font-black'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <ScrollText className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">
              CONTRACTS {activeMission ? '⚡ [ON MISSION]' : `(${stationMissions.length})`}
            </span>
            {activeMission && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            )}
          </button>

          {/* Mineral Refinery Tab */}
          <button
            onClick={() => setActiveTab('REFINERY')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:px-4 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              activeTab === 'REFINERY'
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md font-black'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Gem className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">MINERAL REFINERY ({currentCargo})</span>
          </button>

          {/* Fleet & Upgrades Tab */}
          <button
            onClick={() => setActiveTab('UPGRADES')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:px-4 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              activeTab === 'UPGRADES'
                ? 'bg-purple-600 text-white border-purple-300 shadow-md font-black'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Rocket className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="truncate">FLEET & UPGRADES (T{shipTier})</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 md:p-5">
          {/* TAB 1: CONTRACTS & MISSIONS */}
          {activeTab === 'CONTRACTS' && (
            <div className="space-y-4 max-w-5xl mx-auto">
              {/* Active Mission Banner if currently on a mission */}
              {activeMission ? (
                <div className="bg-amber-950/40 border-2 border-amber-500/80 rounded-xl p-4 sm:p-5 shadow-2xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400">
                        <ScrollText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black">
                            ACTIVE CONTRACT
                          </span>
                          <span className="text-xs text-amber-300 font-bold">
                            Client: {activeMission.client}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                          {activeMission.title}
                        </h3>
                      </div>
                    </div>

                    <button
                      onClick={() => abandonActiveMission()}
                      className="px-4 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-black text-xs border border-rose-400 transition-all active:scale-95 flex items-center space-x-1.5 shadow-md cursor-pointer"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>ABANDON CONTRACT (-{activeMission.penaltyCredits || 400} CR)</span>
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {activeMission.description}
                  </p>

                  {/* Objective & Reward Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-950/80 border border-amber-500/30 rounded-lg p-3">
                      <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                        Objective Status
                      </div>
                      {activeMission.type === 'BOUNTY_HUNT' && (
                        <div className="mt-1 text-sm font-bold text-white">
                          Hostiles Eliminated: {activeMission.targetEnemiesKilled || 0} / {activeMission.targetEnemiesRequired || 1}
                        </div>
                      )}
                      {(activeMission.type === 'COURIER_CARGO' || activeMission.type === 'VIP_TRANSPORT') && (
                        <div className="mt-1 text-sm font-bold text-white">
                          Destination: <span className="text-cyan-300">{activeMission.targetStationName}</span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Dock at {activeMission.targetStationName} to deliver and collect reward.
                          </div>
                        </div>
                      )}
                      {activeMission.type === 'MINERAL_EXTRACTION' && (
                        <div className="mt-1 text-sm font-bold text-white">
                          Required: {activeMission.requiredMineralQty}x {activeMission.requiredMineralName}
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Mine or salvage {activeMission.requiredMineralName} and dock here to complete.
                          </div>
                        </div>
                      )}
                      {activeMission.type === 'CONVOY_ESCORT' && (
                        <div className="mt-1 text-sm font-bold text-white">
                          Enemies Cleared: {activeMission.targetEnemiesKilled || 0} / {activeMission.targetEnemiesRequired || 3} • Destination: {activeMission.targetStationName}
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-950/80 border border-emerald-500/30 rounded-lg p-3">
                      <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                        Guaranteed Contract Payout
                      </div>
                      <div className="mt-1 text-sm font-bold text-emerald-300 font-mono">
                        +{activeMission.reward.credits.toLocaleString()} CR
                        {activeMission.reward.freeUpgrade && (
                          <span className="text-cyan-300 ml-2 font-mono text-xs">
                            + Free {activeMission.reward.freeUpgrade} Upgrade
                          </span>
                        )}
                        {activeMission.reward.hullBonus && (
                          <span className="text-rose-300 ml-2 font-mono text-xs">
                            +{activeMission.reward.hullBonus} Hull Max
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Available Station Contracts List */
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 pb-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <ScrollText className="w-4 h-4 text-amber-400" />
                        Station Guild Dispatch & Bounties
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Choose a contract to undertake. You must complete or forfeit active contracts before signing new ones.
                      </p>
                    </div>
                    {completedMissionsCount > 0 && (
                      <div className="flex items-center space-x-1 bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 rounded-lg text-xs text-amber-300 font-bold">
                        <Award className="w-3.5 h-3.5" />
                        <span>Contracts Completed: {completedMissionsCount}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {stationMissions.map((m) => (
                      <div
                        key={m.id}
                        className="bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all shadow-lg"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-amber-500/30 font-bold uppercase">
                              {m.type.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Danger: <span className="text-rose-400 font-bold">{'★'.repeat(Math.min(5, m.dangerLevel))}</span>
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-white mt-1.5 leading-snug">
                            {m.title}
                          </h4>
                          <div className="text-[10px] text-cyan-400 font-semibold mt-0.5">
                            Client: {m.client}
                          </div>

                          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                            {m.description}
                          </p>
                        </div>

                        <div className="border-t border-slate-900 pt-2.5 space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-400">Reward:</span>
                            <span className="text-emerald-300 font-bold">
                              +{m.reward.credits.toLocaleString()} CR
                              {m.reward.freeUpgrade && ` • ${m.reward.freeUpgrade} Upgrade`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-rose-400/80">
                            <span>Abandonment Penalty:</span>
                            <span>-{m.penaltyCredits || 400} CR</span>
                          </div>

                          <button
                            onClick={() => acceptMission(m)}
                            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs border border-amber-300 transition-all active:scale-95 shadow-glow-amber cursor-pointer flex items-center justify-center space-x-1.5"
                          >
                            <span>ACCEPT CONTRACT</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MINERAL REFINERY */}
          {activeTab === 'REFINERY' && (
            <div className="max-w-5xl mx-auto space-y-4">
              {/* Mineral Liquidation Banner */}
              <div className="bg-slate-950/90 border-2 border-emerald-500/50 rounded-xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 shrink-0">
                    <Gem className="w-7 h-7 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                      Mineral Refinery & Ore Exchange
                    </h3>
                    <div className="text-xs text-slate-400">
                      Instant refinery liquidation of all mined ores and salvaged raw minerals.
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end w-full sm:w-auto">
                  <div className="text-[10px] text-slate-400 uppercase">Total Cargo Value</div>
                  <div className="text-lg sm:text-xl font-black text-emerald-300 font-mono">
                    +{totalMineralEarnings.toLocaleString()} CR
                  </div>
                  <button
                    onClick={() => sellAllMinerals()}
                    disabled={player.inventory.length === 0}
                    className="mt-2 w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs tracking-wide border-2 border-emerald-300 shadow-glow-green disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-95"
                  >
                    <Coins className="w-4 h-4" />
                    <span>
                      {player.inventory.length > 0
                        ? `SELL ALL MINERALS (+${totalMineralEarnings.toLocaleString()} CR)`
                        : 'CARGO HOLD EMPTY'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Cargo Inventory List */}
              <div className="bg-slate-950/70 border border-cyan-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                  <span className="text-xs font-bold text-slate-300">
                    Cargo Bay Minerals ({currentCargo}/{player.cargoCapacity} Units)
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{remainingCargo} Units Free Space</span>
                </div>

                {player.inventory.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {player.inventory.map((item) => {
                      const min = getMineral(item.id);
                      const itemTotal = min.unitValue * item.quantity;
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${min.bgColor} ${min.borderColor}`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shadow-md shrink-0"
                              style={{ backgroundColor: `${min.color}25`, border: `1px solid ${min.color}` }}
                            >
                              <Gem className="w-5 h-5" style={{ color: min.color }} />
                            </div>
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className={`text-xs font-bold ${min.textColor}`}>
                                  {min.name}
                                </span>
                                <span
                                  className="text-[8px] px-1 py-0.2 rounded font-black border"
                                  style={{
                                    backgroundColor: `${min.color}20`,
                                    borderColor: min.color,
                                    color: min.color,
                                  }}
                                >
                                  {min.rarity}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {item.quantity} Units • {min.unitValue} CR/ea ={' '}
                                <span className="text-emerald-300 font-bold">+{itemTotal.toLocaleString()} CR</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => sellMineral(item.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shrink-0"
                          >
                            Sell ({itemTotal.toLocaleString()} CR)
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-xs space-y-1">
                    <Package className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                    <p className="font-bold text-slate-400">Your cargo bay is currently empty.</p>
                    <p className="text-[11px] text-slate-600 max-w-sm mx-auto">
                      Mine asteroids using your laser or salvage destroyed outlaw warships to collect high-value minerals.
                    </p>
                  </div>
                )}
              </div>

              {/* Scarcity & Market Guide */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-xs font-bold text-slate-400">
                    Galactic Mineral Value & Scarcity Catalog
                  </span>
                  <span className="text-[10px] text-slate-500">Universal Fixed Exchange Rates</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                  {MINERAL_LIST.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800"
                    >
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                        <span className="text-slate-300 font-medium truncate text-[11px]">{m.name}</span>
                      </div>
                      <span className="font-bold font-mono text-yellow-300 shrink-0 ml-1 text-[11px]">
                        {m.unitValue} CR
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FLEET & UPGRADES */}
          {activeTab === 'UPGRADES' && (
            <div className="max-w-5xl mx-auto space-y-4">
              {/* 1. Maintenance & Services */}
              <div className="bg-slate-950/70 border border-cyan-500/30 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center space-x-2 border-b border-cyan-500/20 pb-1.5">
                  <Fuel className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-black text-cyan-300 tracking-wider uppercase">
                    Station Maintenance & Services
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Refuel */}
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-bold flex items-center gap-1">
                          <Fuel className="w-3.5 h-3.5 text-amber-400" /> Refuel Ship
                        </span>
                        <span className="text-amber-400 font-mono text-xs font-bold">
                          {Math.round(player.fuel)}/{player.maxFuel}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {fuelNeeded > 0 ? `${fuelNeeded} units • ${fuelCost} CR` : 'Tanks Full'}
                      </div>
                    </div>
                    <button
                      onClick={() => refuelShip(fuelNeeded)}
                      disabled={fuelNeeded <= 0 || player.credits < fuelCost}
                      className="mt-2.5 w-full py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      {fuelNeeded > 0 ? `Fill Tank (${fuelCost} CR)` : 'Fuel Full'}
                    </button>
                  </div>

                  {/* Repair Hull */}
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-bold flex items-center gap-1">
                          <Wrench className="w-3.5 h-3.5 text-rose-400" /> Hull Repair
                        </span>
                        <span className="text-rose-400 font-mono text-xs font-bold">
                          {Math.round(player.hull)}/{player.maxHull}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {hullNeeded > 0 ? `${hullNeeded} HP • ${hullCost} CR` : 'Hull 100%'}
                      </div>
                    </div>
                    <button
                      onClick={() => repairShip(hullNeeded)}
                      disabled={hullNeeded <= 0 || player.credits < hullCost}
                      className="mt-2.5 w-full py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold hover:bg-rose-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      {hullNeeded > 0 ? `Repair All (${hullCost} CR)` : 'Hull 100%'}
                    </button>
                  </div>

                  {/* Armada Repairs */}
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-bold flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-purple-400" /> Armada Repairs
                        </span>
                        <span className="text-purple-300 font-mono text-xs font-bold">
                          {escorts.length}/{maxEscorts} Escorts
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {escortDamage > 0 ? `${escortRepairCost} CR total damage` : 'All Escorts 100%'}
                      </div>
                    </div>
                    <button
                      onClick={() => repairEscorts()}
                      disabled={escortDamage <= 0 || player.credits < escortRepairCost}
                      className="mt-2.5 w-full py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/50 text-purple-300 text-xs font-bold hover:bg-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      {escortDamage > 0 ? `Repair Fleet (${escortRepairCost} CR)` : 'Fleet 100%'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Chassis Upgrade Progression (Tiers 1–100) */}
              <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
                  <div className="flex items-center space-x-2">
                    <Rocket className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-black text-amber-300 tracking-wider uppercase">
                      Flagship Chassis Progression (Tier 1–100)
                    </h3>
                  </div>
                  <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded font-mono font-bold">
                    Tier {shipTier}/100: {currentClassDef.name}
                  </span>
                </div>

                {hasNextClass && nextClassDef ? (
                  <div className="bg-slate-900/90 border border-amber-500/40 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">{nextClassDef.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 font-bold border border-amber-500/50">
                          TIER {nextClassDef.tier} ({nextClassDef.category})
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 max-w-xl">
                        {nextClassDef.description}
                      </p>
                      <div className="flex items-center space-x-4 text-[11px] text-cyan-300 font-mono mt-2">
                        <span>Hull: +{nextClassDef.hullBonus}</span>
                        <span>Cargo: +{nextClassDef.cargoBonus}</span>
                        <span>Fuel: +{nextClassDef.fuelBonus}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => upgradeShipChassis()}
                      disabled={player.credits < chassisCost}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-500 text-slate-950 font-black text-xs border border-amber-300 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-glow-amber cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Upgrade Chassis ({chassisCost.toLocaleString()} CR)
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-3 text-emerald-400 text-xs font-bold">
                    ✨ Supreme Warmaster Flagship Reached: {currentClassDef.name} (Tier {shipTier})
                  </div>
                )}
              </div>

              {/* 3. Core Ship Systems */}
              <div className="bg-slate-950/70 border border-cyan-500/30 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center space-x-2 border-b border-cyan-500/20 pb-1.5">
                  <Crosshair className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-black text-cyan-300 tracking-wider uppercase">
                    Ship Weaponry & Core Modules
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Laser Cannons Upgrade */}
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        Laser Cannons (Lvl {weaponLvl})
                      </div>
                      <div className="text-[10px] text-cyan-300 mt-0.5 font-mono">
                        {getWeaponTitle(weaponLvl)}
                      </div>
                    </div>
                    <button
                      onClick={() => upgradeWeapon()}
                      disabled={weaponLvl >= 50 || player.credits < weaponCost}
                      className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-mono shrink-0"
                    >
                      {weaponLvl >= 50 ? 'MAX' : `${weaponCost.toLocaleString()} CR`}
                    </button>
                  </div>

                  {/* Shield Capacitors */}
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        Shield Capacitors (Lvl {shieldLvl}/5)
                      </div>
                      <div className="text-[10px] text-cyan-300 mt-0.5">
                        Max Shield: {ship.maxShield} HP
                      </div>
                    </div>
                    <button
                      onClick={() => upgradeShield()}
                      disabled={shieldLvl >= 5 || player.credits < shieldCost}
                      className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-mono shrink-0"
                    >
                      {shieldLvl >= 5 ? 'MAX' : `${shieldCost} CR`}
                    </button>
                  </div>

                  {/* Thruster Manifolds */}
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        Thruster Manifolds (Lvl {engineLvl}/5)
                      </div>
                      <div className="text-[10px] text-amber-300 mt-0.5">
                        Speed & Agility Multiplier
                      </div>
                    </div>
                    <button
                      onClick={() => upgradeEngine()}
                      disabled={engineLvl >= 5 || player.credits < engineCost}
                      className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-mono shrink-0"
                    >
                      {engineLvl >= 5 ? 'MAX' : `${engineCost} CR`}
                    </button>
                  </div>

                  {/* Cargo Bay Expansion */}
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        Cargo Bay Expansion (+10 Units)
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Current: {player.cargoCapacity} Units
                      </div>
                    </div>
                    <button
                      onClick={() => upgradeCargo()}
                      disabled={player.credits < Math.round(player.cargoCapacity * 35)}
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-mono shrink-0"
                    >
                      {Math.round(player.cargoCapacity * 35)} CR
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Special Ordnance */}
              <div className="bg-slate-950/70 border border-purple-500/30 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center space-x-2 border-b border-purple-500/20 pb-1.5">
                  <Crosshair className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-black text-purple-300 tracking-wider uppercase">
                    Special Ordnance Systems
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Torpedo Launcher / Ammo */}
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-amber-300">Photon Torpedoes</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Stock: {ship.torpedoes || 0}/{ship.maxTorpedoes || 5}
                      </div>
                    </div>
                    {ship.hasTorpedoLauncher ? (
                      <button
                        onClick={() => buyTorpedoAmmo(5)}
                        disabled={torpNeeded <= 0 || player.credits < torpCost5}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        {torpNeeded > 0 ? `+5 (${torpCost5} CR)` : 'Full'}
                      </button>
                    ) : (
                      <button
                        onClick={() => buyTorpedoLauncher()}
                        disabled={!torpUnlocked || player.credits < 450}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        {torpUnlocked ? 'Unlock (450 CR)' : 'T2 Chassis Req'}
                      </button>
                    )}
                  </div>

                  {/* EMP Shockwave */}
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-purple-300">EMP Shockwave</div>
                      <div className="text-[10px] text-slate-400">360° EMP Stun Wave</div>
                    </div>
                    {ship.hasEmpGenerator ? (
                      <span className="text-xs text-emerald-400 font-bold px-2 py-1 bg-emerald-950/60 rounded border border-emerald-500/40">
                        INSTALLED
                      </span>
                    ) : (
                      <button
                        onClick={() => buyEmpGenerator()}
                        disabled={!empUnlocked || player.credits < 600}
                        className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        {empUnlocked ? 'Install (600 CR)' : 'T4 Chassis Req'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. Escort Fleet Hangar (All 10 Escort Classes) */}
              <div className="bg-slate-950/70 border border-purple-500/30 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-1.5">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-black text-purple-300 tracking-wider uppercase">
                      Escort Fleet Armada Hangar ({escorts.length}/{maxEscorts} Ships)
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {escortSpace > 0 ? `${escortSpace} Wing Slot(s) Open` : 'Hangar Full'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ESCORT_CLASSES.map((escortDef) => {
                    const isTierUnlocked = shipTier >= escortDef.minShipTier;
                    const canAfford = player.credits >= escortDef.cost;
                    const canBuy = isTierUnlocked && escortSpace > 0 && canAfford;

                    return (
                      <div
                        key={escortDef.type}
                        className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                          isTierUnlocked
                            ? 'bg-slate-900/90 border-slate-800 hover:border-purple-500/50'
                            : 'bg-slate-950/50 border-slate-900 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: escortDef.color }}
                              />
                              <span className="text-xs font-bold text-white">{escortDef.name}</span>
                            </div>
                            <span
                              className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold"
                              style={{
                                backgroundColor: `${escortDef.color}20`,
                                color: escortDef.color,
                                border: `1px solid ${escortDef.color}40`,
                              }}
                            >
                              {escortDef.type}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                            {escortDef.description}
                          </p>

                          <div className="flex items-center space-x-3 text-[10px] font-mono text-cyan-300 mt-1.5">
                            <span>HP: {escortDef.hull}</span>
                            <span>Shield: {escortDef.shield}</span>
                            <span>DPS: ~{Math.round(escortDef.damage / escortDef.fireCooldown)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                          <span className="text-[11px] font-bold text-yellow-300 font-mono">
                            {escortDef.cost.toLocaleString()} CR
                          </span>

                          <button
                            onClick={() => buyEscortShip(escortDef.type)}
                            disabled={!canBuy}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isTierUnlocked
                                ? 'bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed text-[10px]'
                            }`}
                          >
                            {!isTierUnlocked
                              ? `Tier ${escortDef.minShipTier} Req`
                              : escortSpace <= 0
                              ? 'Hangar Full'
                              : `Deploy (${escortDef.cost.toLocaleString()} CR)`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
