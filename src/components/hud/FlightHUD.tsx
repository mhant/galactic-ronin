import React, { useState, useEffect, memo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getShipClass } from '../../data/shipClasses';
import { PowerConsole } from './PowerConsole';
import { RadarMinimap } from './RadarMinimap';
import {
  Shield,
  Activity,
  Fuel,
  Rocket,
  Coins,
  Package,
  Volume2,
  VolumeX,
  Music,
  AlertTriangle,
  Radio,
  Navigation,
  Sparkles,
  Crosshair,
  Terminal,
  Pause,
  X,
} from 'lucide-react';

// 1. Sector & System Information (Re-renders ONLY on sector change)
const SectorHeader = memo(() => {
  const sectorName = useGameStore((state) => state.world.sector?.name || 'Deep Space (Sector-01)');
  const currentSectorId = useGameStore((state) => state.world.currentSectorId || 'Sector-01');
  const dangerLevel = useGameStore((state) => state.world.sector?.dangerLevel || 1);

  return (
    <div className="flex items-center space-x-2 sm:space-x-3 bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs shadow-lg pointer-events-auto">
      <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 animate-pulse shrink-0" />
      <div>
        <div className="text-cyan-400 font-bold tracking-wide text-[11px] sm:text-xs truncate max-w-[140px] sm:max-w-[200px]">
          {sectorName}
        </div>
        <div className="text-[9px] sm:text-[10px] text-slate-400">
          <span className="text-slate-200 font-mono">{currentSectorId}</span> | SEC:{' '}
          <span className="text-amber-400 font-bold">LVL-{dangerLevel}</span>
        </div>
      </div>
    </div>
  );
});

// 1b. Main Screen Active Mission Compass Bar (Centered at Top)
const MainScreenMissionCompassBar = memo(() => {
  const activeMission = useGameStore((state) => state.activeMission);
  const inventory = useGameStore((state) => state.player.inventory);
  const abandonActiveMission = useGameStore((state) => state.abandonActiveMission);
  const [navData, setNavData] = useState<{
    targetLabel: string;
    targetSub: string;
    angleDeg: number;
    dist: number;
  } | null>(null);

  useEffect(() => {
    if (!activeMission) {
      setNavData(null);
      return;
    }

    const updateNav = () => {
      const { ship, world, player } = useGameStore.getState();
      let targetX: number | null = null;
      let targetY: number | null = null;
      let targetLabel = 'MISSION OBJECTIVE';
      let targetSub = '';

      if (activeMission.type === 'COURIER_CARGO' || activeMission.type === 'VIP_TRANSPORT') {
        const station = world.stations.find((s) => s.id === activeMission.targetStationId);
        if (station) {
          targetX = station.x;
          targetY = station.y;
          targetLabel = station.name;
          targetSub = activeMission.type === 'VIP_TRANSPORT' ? 'VIP DESTINATION' : 'DELIVERY STATION';
        }
      } else if (activeMission.type === 'BOUNTY_HUNT') {
        // Find matching bounty enemy
        let bounty = world.enemies.find((e) => {
          if (activeMission.targetEnemyId && e.id === activeMission.targetEnemyId) return true;
          if (activeMission.targetEnemyName && e.name.toLowerCase().includes(activeMission.targetEnemyName.toLowerCase())) return true;
          if (activeMission.targetEnemyCategory && e.category === activeMission.targetEnemyCategory) return true;
          return false;
        });
        if (!bounty && world.enemies.length > 0) {
          // Nearest enemy if specific bounty not found
          bounty = world.enemies[0];
        }
        if (bounty) {
          targetX = bounty.x;
          targetY = bounty.y;
          targetLabel = bounty.name;
          targetSub = 'BOUNTY TARGET';
        } else if (activeMission.targetStationId) {
          const station = world.stations.find((s) => s.id === activeMission.targetStationId);
          if (station) {
            targetX = station.x;
            targetY = station.y;
            targetLabel = station.name;
            targetSub = 'RETURN TO CLAIM BOUNTY';
          }
        }
      } else if (activeMission.type === 'MINERAL_EXTRACTION') {
        const currentOre = activeMission.requiredMineralId
          ? player.inventory.find((i) => i.id === activeMission.requiredMineralId)?.quantity || 0
          : 0;
        const needed = activeMission.requiredMineralQty || 1;

        if (currentOre < needed) {
          let closestAst: any = null;
          let minDist = Infinity;
          for (const ast of world.asteroids) {
            if (ast.oreType === activeMission.requiredMineralId) {
              const d = Math.hypot(ast.x - ship.x, ast.y - ship.y);
              if (d < minDist) {
                minDist = d;
                closestAst = ast;
              }
            }
          }
          if (closestAst) {
            targetX = closestAst.x;
            targetY = closestAst.y;
            targetLabel = `${activeMission.requiredMineralName || activeMission.requiredMineralId} DEPOSIT`;
            targetSub = 'MINE REQUIRED ORE';
          }
        } else if (activeMission.targetStationId) {
          const station = world.stations.find((s) => s.id === activeMission.targetStationId);
          if (station) {
            targetX = station.x;
            targetY = station.y;
            targetLabel = station.name;
            targetSub = 'ORE TURN-IN STATION';
          }
        }
      }

      if (targetX !== null && targetY !== null) {
        const dx = targetX - ship.x;
        const dy = targetY - ship.y;
        const dist = Math.round(Math.hypot(dx, dy));
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = (angleRad * 180) / Math.PI;
        setNavData({ targetLabel, targetSub, angleDeg, dist });
      } else {
        setNavData(null);
      }
    };

    updateNav();
    const timer = setInterval(updateNav, 100);
    return () => clearInterval(timer);
  }, [activeMission]);

  if (!activeMission) return null;

  const currentOreCount = activeMission.requiredMineralId
    ? inventory.find((i) => i.id === activeMission.requiredMineralId)?.quantity || 0
    : 0;

  return (
    <div className="bg-slate-950/95 backdrop-blur-md border-2 border-amber-400/80 rounded-2xl px-3 py-2 text-xs shadow-glow-amber pointer-events-auto flex items-center justify-between gap-3 font-mono w-full max-w-md animate-fade-in">
      {/* Directional Nav Indicator with Rotating Arrow */}
      {navData && (
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="w-10 h-10 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shadow-glow-amber transition-transform duration-100"
            title={`Compass Bearing: ${Math.round(navData.angleDeg)}°`}
          >
            <Navigation
              className="w-6 h-6 text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] transition-transform duration-100"
              style={{ transform: `rotate(${navData.angleDeg + 90}deg)` }}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] sm:text-sm font-black text-amber-300 font-mono tracking-tight">
              {navData.dist.toLocaleString()} <span className="text-[10px] text-amber-400 font-normal">u</span>
            </span>
            <span className="text-[9px] text-slate-300 font-bold uppercase truncate max-w-[120px] sm:max-w-[150px]">
              {navData.targetLabel}
            </span>
          </div>
        </div>
      )}

      {/* Center Details & Mission Objective Status */}
      <div className="flex flex-col flex-1 min-w-0 pr-1 border-l border-amber-500/30 pl-2.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider truncate">
            🎯 {activeMission.type.replace('_', ' ')}
          </span>
          <span className="text-emerald-400 font-black text-[10px] shrink-0">
            +{activeMission.reward.credits.toLocaleString()} CR
          </span>
        </div>

        <div className="text-[11px] font-bold text-white truncate leading-tight mt-0.5">
          {activeMission.title}
        </div>

        <div className="flex items-center justify-between text-[9px] text-slate-300 mt-1">
          {activeMission.type === 'BOUNTY_HUNT' && (
            <span className="text-rose-300 font-bold">
              Kills: {activeMission.targetEnemiesKilled || 0}/{activeMission.targetEnemiesRequired || 1}
            </span>
          )}
          {activeMission.type === 'MINERAL_EXTRACTION' && (
            <span className="text-emerald-300 font-bold">
              Ore: {currentOreCount}/{activeMission.requiredMineralQty}
            </span>
          )}
          {(activeMission.type === 'COURIER_CARGO' || activeMission.type === 'VIP_TRANSPORT' || activeMission.type === 'CONVOY_ESCORT') && (
            <span className="text-cyan-300 font-bold truncate">
              Dest: {activeMission.targetStationName || 'Station'}
            </span>
          )}

          <button
            onClick={abandonActiveMission}
            className="text-[8px] text-rose-400 hover:text-rose-200 border border-rose-500/40 hover:bg-rose-950/60 px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ml-auto"
            title={`Abandon mission with -${activeMission.penaltyCredits || 400} CR penalty`}
          >
            ABANDON (-{activeMission.penaltyCredits || 400}CR)
          </button>
        </div>
      </div>
    </div>
  );
});

// 2. Compact Mobile Status Strip (For Phones & Tablets - zero overlap with virtual controls)
const MobileCompactGauges = memo(() => {
  const hull = useGameStore((state) => state.player.hull);
  const maxHull = useGameStore((state) => state.player.maxHull);
  const fuel = useGameStore((state) => state.player.fuel);
  const shield = useGameStore((state) => state.ship.shield);
  const maxShield = useGameStore((state) => state.ship.maxShield);
  const shipTier = useGameStore((state) => state.ship.shipTier || 1);
  const hasTorpedoLauncher = useGameStore((state) => state.ship.hasTorpedoLauncher);
  const torpedoes = useGameStore((state) => state.ship.torpedoes || 0);
  const maxTorpedoes = useGameStore((state) => state.ship.maxTorpedoes || 5);
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    const updateSpeed = () => {
      const { vx, vy } = useGameStore.getState().ship;
      setSpeed(Math.round(Math.hypot(vx, vy)));
    };
    const timer = setInterval(updateSpeed, 120);
    return () => clearInterval(timer);
  }, []);

  const shipClass = getShipClass(shipTier);

  return (
    <div className="flex flex-col gap-1 bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 rounded-xl p-2 text-[10px] font-mono shadow-xl pointer-events-auto max-w-[210px]">
      <div className="flex items-center justify-between text-[9px] pb-1 border-b border-slate-800">
        <span className="font-bold text-amber-300 truncate max-w-[120px]">
          T{shipTier} {shipClass.name}
        </span>
        <span className="text-cyan-300 font-bold font-mono">{speed}u/s</span>
      </div>

      {/* Hull Bar */}
      <div className="flex items-center gap-1.5">
        <Activity className="w-3 h-3 text-rose-400 shrink-0" />
        <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-200 ${
              hull > 50 ? 'bg-emerald-400' : hull > 25 ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'
            }`}
            style={{ width: `${(hull / maxHull) * 100}%` }}
          />
        </div>
        <span className="text-[8px] text-slate-300 w-6 text-right font-mono">{Math.round(hull)}</span>
      </div>

      {/* Shield Bar */}
      <div className="flex items-center gap-1.5">
        <Shield className="w-3 h-3 text-cyan-400 shrink-0" />
        <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-cyan-400 shadow-glow-cyan transition-all duration-150"
            style={{ width: `${(shield / maxShield) * 100}%` }}
          />
        </div>
        <span className="text-[8px] text-slate-300 w-6 text-right font-mono">{Math.round(shield)}</span>
      </div>

      {/* Fuel Bar */}
      <div className="flex items-center gap-1.5">
        <Fuel className="w-3 h-3 text-amber-400 shrink-0" />
        <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-200 ${
              fuel > 20 ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'
            }`}
            style={{ width: `${fuel}%` }}
          />
        </div>
        <span className="text-[8px] text-slate-300 w-6 text-right font-mono">{Math.round(fuel)}%</span>
      </div>

      {/* Torpedo / Missile Ammo */}
      {hasTorpedoLauncher && (
        <div className="flex items-center gap-1.5">
          <Rocket className="w-3 h-3 text-orange-400 shrink-0" />
          <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-150 ${
                torpedoes > 0 ? 'bg-amber-400 shadow-glow-amber' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, (torpedoes / Math.max(1, maxTorpedoes)) * 100)}%` }}
            />
          </div>
          <span className="text-[8px] text-amber-300 w-6 text-right font-mono font-bold">
            {torpedoes}
          </span>
        </div>
      )}
    </div>
  );
});

// 3. Combat Alert Banner (Re-renders ONLY on combat state toggle)
const CombatAlertBanner = memo(() => {
  const combatAlert = useGameStore((state) => state.combatAlert);
  if (!combatAlert) return null;

  return (
    <div className="flex items-center space-x-2 bg-rose-950/90 border border-rose-500/70 px-3 sm:px-4 py-1.5 rounded-full text-rose-300 text-[11px] sm:text-xs font-bold animate-pulse shadow-glow-red pointer-events-auto">
      <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
      <span>HOSTILE THREAT DETECTED</span>
    </div>
  );
});

// 4. Resources & Sound Controls (Re-renders ONLY on credit, cargo, or volume toggle)
const ResourceBar = memo(() => {
  const credits = useGameStore((state) => state.player.credits);
  const cargoCapacity = useGameStore((state) => state.player.cargoCapacity);
  const currentCargo = useGameStore((state) =>
    state.player.inventory.reduce((sum, item) => sum + item.quantity, 0)
  );
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const musicEnabled = useGameStore((state) => state.musicEnabled);
  const sfxEnabled = useGameStore((state) => state.sfxEnabled);
  const toggleSound = useGameStore((state) => state.toggleSound);
  const toggleMusic = useGameStore((state) => state.toggleMusic);
  const toggleSFX = useGameStore((state) => state.toggleSFX);
  const toggleDiagnostics = useGameStore((state) => state.toggleDiagnostics);
  const togglePause = useGameStore((state) => state.togglePause);

  return (
    <div className="flex items-center space-x-1.5 sm:space-x-2.5 pointer-events-auto">
      {/* Cargo Status */}
      <div className="bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs shadow-lg flex items-center space-x-1.5">
        <Package className="w-3.5 h-3.5 text-cyan-400" />
        <div>
          <div className="text-[9px] text-slate-400 hidden sm:block">CARGO</div>
          <div className="font-bold text-slate-100 text-[10px] sm:text-xs">
            {currentCargo}/{cargoCapacity}
          </div>
        </div>
      </div>

      {/* Credits */}
      <div className="bg-slate-900/85 backdrop-blur-md border border-yellow-500/30 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs shadow-lg flex items-center space-x-1.5">
        <Coins className="w-3.5 h-3.5 text-yellow-400" />
        <div>
          <div className="text-[9px] text-slate-400 hidden sm:block">CREDITS</div>
          <div className="font-bold text-yellow-300 text-xs sm:text-sm">
            {credits.toLocaleString()} <span className="text-[9px] font-normal text-yellow-500">CR</span>
          </div>
        </div>
      </div>

      {/* Music Toggle */}
      <button
        onClick={toggleMusic}
        className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
          musicEnabled
            ? 'bg-purple-950/80 border-purple-500/50 text-purple-300 hover:bg-purple-900/80 shadow-glow-purple'
            : 'bg-slate-900/80 border-slate-700 text-slate-500 hover:bg-slate-800'
        }`}
        title="Toggle Ambient Music"
      >
        <Music className="w-3.5 h-3.5" />
      </button>

      {/* SFX Toggle */}
      <button
        onClick={toggleSFX}
        className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
          sfxEnabled
            ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/80 shadow-glow-cyan'
            : 'bg-slate-900/80 border-slate-700 text-slate-500 hover:bg-slate-800'
        }`}
        title="Toggle Sound Effects"
      >
        {sfxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
      </button>

      {/* Master Mute Toggle */}
      <button
        onClick={toggleSound}
        className={`hidden md:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
          soundEnabled
            ? 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            : 'bg-rose-950/80 border-rose-500/50 text-rose-300 hover:bg-rose-900/80'
        }`}
        title="Master Audio Mute"
      >
        {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
        <span>{soundEnabled ? 'MUTE' : 'UNMUTE'}</span>
      </button>

      {/* Flight Recorder Diagnostics Toggle */}
      <button
        onClick={toggleDiagnostics}
        className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-md active:scale-95 bg-cyan-950/80 hover:bg-cyan-900/90 border-cyan-500/50 text-cyan-300 shadow-glow-cyan cursor-pointer"
        title="Toggle Flight Recorder & Diagnostics (F3)"
      >
        <Terminal className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span>LOG [F3]</span>
      </button>

      {/* Pause Menu Toggle */}
      <button
        onClick={togglePause}
        className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-md active:scale-95 bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-200 cursor-pointer"
        title="Tactical Pause & Menu (ESC)"
      >
        <Pause className="w-3.5 h-3.5 text-cyan-400" />
        <span>PAUSE [ESC]</span>
      </button>
    </div>
  );
});

// 5. Drone Status Banner & POI Callouts
const DroneAndPoiLayer = memo(() => {
  const dronesInFlight = useGameStore((state) => state.world.drones?.length || 0);
  const pointsOfInterest = useGameStore((state) => state.world.pointsOfInterest || []);
  const dismissPointOfInterest = useGameStore((state) => state.dismissPointOfInterest);

  if (dronesInFlight === 0 && pointsOfInterest.length === 0) return null;

  const currentShip = useGameStore.getState().ship;
  const shipX = currentShip.x;
  const shipY = currentShip.y;

  return (
    <div className="self-center flex flex-col items-center gap-1.5 pointer-events-auto max-w-2xl w-full z-20">
      {dronesInFlight > 0 && (
        <div className="flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-500/60 px-3 sm:px-4 py-1 rounded-full text-emerald-300 text-[11px] font-bold animate-pulse shadow-glow-green">
          <Radio className="w-3 h-3 text-emerald-400 animate-spin" />
          <span>DEFENSE DRONES ACTIVE ({dronesInFlight})</span>
        </div>
      )}

      {pointsOfInterest.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 max-w-full">
          {pointsOfInterest.slice(0, 3).map((poi) => {
            const dx = poi.x - shipX;
            const dy = poi.y - shipY;
            const dist = Math.round(Math.hypot(dx, dy));
            const angleRad = Math.atan2(dy, dx);
            const angleDeg = (angleRad * 180) / Math.PI;

            const isStation = poi.type === 'STATION';
            const isAsteroid = poi.type === 'FUSION_ASTEROID';

            const badgeColor = isStation
              ? 'border-cyan-500/60 bg-slate-900/90 text-cyan-300 shadow-glow-cyan'
              : isAsteroid
              ? 'border-amber-500/60 bg-slate-900/90 text-amber-300 shadow-glow-amber'
              : 'border-rose-500/60 bg-slate-900/90 text-rose-300 shadow-glow-red';

            return (
              <div
                key={poi.id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border backdrop-blur-md text-[11px] transition-all hover:scale-105 ${badgeColor}`}
              >
                <div
                  className="w-4 h-4 flex items-center justify-center bg-black/50 rounded-full border border-white/20 shrink-0"
                  title={`Bearing: ${Math.round(angleDeg)}°`}
                >
                  <Navigation
                    className="w-2.5 h-2.5 text-current transition-transform duration-100"
                    style={{ transform: `rotate(${angleDeg + 90}deg)` }}
                  />
                </div>

                {isStation && <Radio className="w-3 h-3 text-cyan-400 shrink-0" />}
                {isAsteroid && <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />}
                {!isStation && !isAsteroid && <Crosshair className="w-3 h-3 text-rose-400 shrink-0" />}

                <div className="leading-tight">
                  <div className="font-bold text-[10px] sm:text-[11px] truncate max-w-[110px] sm:max-w-[150px]">
                    {poi.name}
                  </div>
                  <div className="text-[8px] opacity-75 font-mono">
                    {dist.toLocaleString()}u • {Math.round(poi.lifetime)}s
                  </div>
                </div>

                <button
                  onClick={() => dismissPointOfInterest(poi.id)}
                  className="p-0.5 hover:bg-white/20 rounded text-slate-400 hover:text-white transition-all ml-0.5 shrink-0 cursor-pointer"
                  title="Dismiss POI"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

// 6. Docking Prompt for Desktop (Mobile uses floating top banner in MobileTouchControls)
const DesktopDockingOverlay = memo(() => {
  const [stationName, setStationName] = useState<string | null>(null);

  useEffect(() => {
    const checkProximity = () => {
      const { ship, world } = useGameStore.getState();
      const near = world.stations.find(
        (st) => Math.hypot(ship.x - st.x, ship.y - st.y) <= st.radius + 175
      );
      setStationName(near ? near.name : null);
    };

    checkProximity();
    const timer = setInterval(checkProximity, 200);
    return () => clearInterval(timer);
  }, []);

  if (!stationName) return null;

  return (
    <div className="hidden sm:flex self-center bg-slate-900/90 border-2 border-cyan-400 px-6 py-3 rounded-xl shadow-glow-cyan pointer-events-auto items-center space-x-3 animate-bounce">
      <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
      <div className="text-center">
        <div className="text-xs text-slate-300 font-semibold">
          APPROACHING <span className="text-cyan-400 font-bold">{stationName}</span>
        </div>
        <div className="text-sm font-bold text-cyan-300 tracking-wider">
          PRESS <span className="bg-cyan-500 text-black px-1.5 py-0.5 rounded font-black">[ E ]</span> TO COMMENCE DOCKING
        </div>
      </div>
    </div>
  );
});

// 7. Desktop Left Gauges: Hull, Shield, Fuel & Special Systems
const DesktopFlightGauges = memo(() => {
  const hull = useGameStore((state) => state.player.hull);
  const maxHull = useGameStore((state) => state.player.maxHull);
  const fuel = useGameStore((state) => state.player.fuel);
  const shield = useGameStore((state) => state.ship.shield);
  const maxShield = useGameStore((state) => state.ship.maxShield);
  const shipTier = useGameStore((state) => state.ship.shipTier || 1);
  const hasAutoTurrets = useGameStore((state) => state.ship.hasAutoTurrets);
  const hasTorpedoLauncher = useGameStore((state) => state.ship.hasTorpedoLauncher);
  const torpedoes = useGameStore((state) => state.ship.torpedoes);
  const maxTorpedoes = useGameStore((state) => state.ship.maxTorpedoes);
  const hasEmpGenerator = useGameStore((state) => state.ship.hasEmpGenerator);
  const empCooldown = useGameStore((state) => state.ship.empCooldown || 0);
  const drones = useGameStore((state) => state.ship.drones || 0);
  const maxDrones = useGameStore((state) => state.ship.maxDrones || 5);
  const droneCooldown = useGameStore((state) => state.ship.droneCooldown || 0);
  const launchReconDrone = useGameStore((state) => state.launchReconDrone);
  const hasBeamWeapon = useGameStore((state) => state.ship.hasBeamWeapon);
  const armadaStance = useGameStore((state) => state.ship.armadaStance || 'DEFEND');
  const escorts = useGameStore((state) => state.ship.escorts || []);
  const maxEscorts = useGameStore((state) => state.ship.maxEscorts || 0);
  const toggleArmadaStance = useGameStore((state) => state.toggleArmadaStance);

  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    const updateSpeed = () => {
      const { vx, vy } = useGameStore.getState().ship;
      setSpeed(Math.round(Math.hypot(vx, vy)));
    };
    const timer = setInterval(updateSpeed, 100);
    return () => clearInterval(timer);
  }, []);

  const shipClass = getShipClass(shipTier);

  return (
    <div className="w-80 bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 rounded-lg p-3 text-xs shadow-2xl space-y-2.5 pointer-events-auto select-none">
      <div className="flex items-center justify-between pb-1.5 border-b border-cyan-900/50">
        <div>
          <div className="text-[10px] text-slate-400 font-bold tracking-wider">CHASSIS CLASS</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono">
              T{shipTier}
            </span>
            <span className="text-xs font-bold text-slate-100">{shipClass.name}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-bold">SPEED</span>
          <div className="text-xs text-cyan-300 font-bold font-mono">{speed} u/s</div>
        </div>
      </div>

      {/* Hull Bar */}
      <div>
        <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
          <span className="flex items-center gap-1 font-semibold">
            <Activity className="w-3 h-3 text-rose-400" /> HULL INTEGRITY
          </span>
          <span>
            {Math.round(hull)} / {maxHull}
          </span>
        </div>
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-200 ${
              hull > 50
                ? 'bg-emerald-400 shadow-glow-green'
                : hull > 25
                ? 'bg-amber-400 shadow-glow-amber'
                : 'bg-rose-500 shadow-glow-red animate-pulse'
            }`}
            style={{ width: `${(hull / maxHull) * 100}%` }}
          />
        </div>
      </div>

      {/* Shield Bar */}
      <div>
        <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
          <span className="flex items-center gap-1 font-semibold">
            <Shield className="w-3 h-3 text-cyan-400" /> DEFLECTOR SHIELD
          </span>
          <span>
            {Math.round(shield)} / {maxShield}
          </span>
        </div>
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-cyan-400 shadow-glow-cyan transition-all duration-150"
            style={{ width: `${(shield / maxShield) * 100}%` }}
          />
        </div>
      </div>

      {/* Fuel Bar */}
      <div>
        <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
          <span className="flex items-center gap-1 font-semibold">
            <Fuel className="w-3 h-3 text-amber-400" /> SUB-LIGHT FUEL
          </span>
          <span>{Math.round(fuel)}%</span>
        </div>
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-200 ${
              fuel > 20 ? 'bg-amber-400 shadow-glow-amber' : 'bg-rose-500 animate-pulse'
            }`}
            style={{ width: `${fuel}%` }}
          />
        </div>
      </div>

      {/* Missiles / Photon Torpedoes Ammo Gauge */}
      <div>
        <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
          <span className="flex items-center gap-1 font-semibold text-orange-400">
            <Rocket className="w-3.5 h-3.5 text-orange-400" /> PHOTON TORPEDOES
          </span>
          <span className="font-mono">
            {hasTorpedoLauncher ? (
              <span className="text-xs font-black text-amber-300">
                {torpedoes} <span className="text-[10px] text-slate-400 font-normal">/ {maxTorpedoes}</span>
              </span>
            ) : (
              <span className="text-slate-500 text-[9px] font-semibold">NOT INSTALLED</span>
            )}
          </span>
        </div>
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-150 ${
              !hasTorpedoLauncher
                ? 'bg-slate-800'
                : torpedoes > 0
                ? 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-glow-amber'
                : 'bg-rose-900/60'
            }`}
            style={{
              width: `${hasTorpedoLauncher ? Math.min(100, (torpedoes / Math.max(1, maxTorpedoes)) * 100) : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Secondary Weapons & Systems */}
      <div className="pt-2 border-t border-slate-800 space-y-1.5">
        <div className="text-[10px] font-bold text-slate-400 flex items-center justify-between">
          <span>SPECIAL SYSTEMS</span>
          <div className="flex items-center gap-1">
            {hasAutoTurrets && (
              <span className="text-[9px] text-yellow-400 bg-yellow-950/80 px-1.5 py-0.2 rounded border border-yellow-500/30">
                FLAK
              </span>
            )}
            {hasBeamWeapon && (
              <span className="text-[9px] text-cyan-300 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-500/30 animate-pulse">
                PHASER BEAM
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {/* Torpedoes */}
          <div
            className={`p-1.5 rounded border flex flex-col justify-between text-[10px] ${
              hasTorpedoLauncher
                ? torpedoes > 0
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-500'
            }`}
            title={hasTorpedoLauncher ? 'F or Right-Click to fire' : 'Requires Lasers Lvl 2+ & Tier 2+ Chassis'}
          >
            <span className="font-bold flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded font-mono bg-slate-800 text-amber-400">F</kbd> TRP
            </span>
            <span className="font-bold font-mono text-[9px] mt-0.5">
              {hasTorpedoLauncher ? (torpedoes > 0 ? `${torpedoes}/${maxTorpedoes}` : 'EMPTY') : 'LOCKED'}
            </span>
          </div>

          {/* EMP Shockwave */}
          <div
            className={`p-1.5 rounded border flex flex-col justify-between text-[10px] ${
              hasEmpGenerator
                ? empCooldown <= 0
                  ? 'bg-cyan-950/60 border-cyan-400/50 text-cyan-300 shadow-glow-cyan'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
                : 'bg-slate-900/60 border-slate-800 text-slate-500'
            }`}
            title={hasEmpGenerator ? 'Q or X to trigger EMP blast' : 'Requires Shields Lvl 3+ & Tier 4+ Chassis'}
          >
            <span className="font-bold flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded font-mono bg-slate-800 text-cyan-300">Q</kbd> EMP
            </span>
            <span className="font-bold font-mono text-[9px] mt-0.5">
              {hasEmpGenerator ? (empCooldown <= 0 ? 'READY' : `${empCooldown.toFixed(1)}s`) : 'LOCKED'}
            </span>
          </div>

          {/* Defense Escort Drone */}
          <div
            onClick={() => launchReconDrone()}
            className={`p-1.5 rounded border flex flex-col justify-between text-[10px] cursor-pointer transition-all ${
              drones > 0 && droneCooldown <= 0
                ? 'bg-emerald-950/60 border-emerald-400/50 text-emerald-300 hover:bg-emerald-900/60 shadow-glow-green pointer-events-auto'
                : drones > 0
                ? 'bg-slate-900 border-slate-800 text-slate-400 pointer-events-auto'
                : 'bg-slate-900/60 border-slate-800 text-slate-600'
            }`}
            title="Press [R] to launch Combat Defense Drone"
          >
            <span className="font-bold flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded font-mono bg-slate-800 text-emerald-300">R</kbd> DRN
            </span>
            <span className="font-bold font-mono text-[9px] mt-0.5">
              {drones > 0
                ? droneCooldown <= 0
                  ? `${drones}/${maxDrones}`
                  : `${droneCooldown.toFixed(1)}s`
                : '0/5'}
            </span>
          </div>

          {/* Armada Fleet Stance */}
          <div
            onClick={() => maxEscorts > 0 && toggleArmadaStance()}
            className={`p-1.5 rounded border flex flex-col justify-between text-[10px] transition-all ${
              maxEscorts > 0
                ? armadaStance === 'ATTACK'
                  ? 'bg-rose-950/70 border-rose-400/60 text-rose-300 hover:bg-rose-900/70 cursor-pointer pointer-events-auto shadow-glow-red'
                  : 'bg-purple-950/70 border-purple-400/60 text-purple-300 hover:bg-purple-900/70 cursor-pointer pointer-events-auto shadow-glow-purple'
                : 'bg-slate-900/60 border-slate-800 text-slate-500'
            }`}
            title="Press [T] to toggle armada stance (ATTACK / DEFEND)"
          >
            <span className="font-bold flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded font-mono bg-slate-800 text-purple-300">T</kbd> ARM
            </span>
            <span className="font-bold font-mono text-[9px] mt-0.5">
              {maxEscorts > 0 ? `${escorts.length}/${maxEscorts}` : 'LOCKED'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

// 8. Static Desktop Flight Controls Quick Reference Bar (ZERO re-renders)
const FlightControlsCheatSheet = memo(() => {
  const hasTorpedoLauncher = useGameStore((state) => state.ship.hasTorpedoLauncher);
  const hasEmpGenerator = useGameStore((state) => state.ship.hasEmpGenerator);
  const drones = useGameStore((state) => state.ship.drones || 0);
  const maxEscorts = useGameStore((state) => state.ship.maxEscorts || 0);

  return (
    <div className="hidden xl:flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 px-3 py-1.5 rounded-lg text-[10px] text-slate-300 shadow-lg select-none">
      <span>
        <kbd className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded font-bold">W / UP</kbd> Thrust
      </span>
      <span>
        <kbd className="bg-slate-800 text-amber-300 px-1 py-0.5 rounded font-bold">S / DOWN</kbd> Reverse
      </span>
      <span>
        <kbd className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded">A / D</kbd> Turn
      </span>
      <span>
        <kbd className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded">SPACE</kbd> Lasers
      </span>
      <span>
        <kbd
          className={`px-1 py-0.5 rounded ${
            hasTorpedoLauncher ? 'bg-amber-900/80 text-amber-300' : 'bg-slate-800 text-slate-500'
          }`}
        >
          F / R-CLICK
        </kbd>{' '}
        <span className={hasTorpedoLauncher ? 'text-amber-200' : 'text-slate-500'}>Torp</span>
      </span>
      <span>
        <kbd
          className={`px-1 py-0.5 rounded ${
            hasEmpGenerator ? 'bg-purple-900/80 text-purple-300' : 'bg-slate-800 text-slate-500'
          }`}
        >
          Q
        </kbd>{' '}
        <span className={hasEmpGenerator ? 'text-purple-200' : 'text-slate-500'}>EMP</span>
      </span>
      <span>
        <kbd
          className={`px-1 py-0.5 rounded ${
            drones > 0 ? 'bg-emerald-900/80 text-emerald-300' : 'bg-slate-800 text-slate-500'
          }`}
        >
          R
        </kbd>{' '}
        <span className={drones > 0 ? 'text-emerald-200' : 'text-slate-500'}>Drone</span>
      </span>
      <span>
        <kbd
          className={`px-1 py-0.5 rounded ${
            maxEscorts > 0 ? 'bg-purple-900/80 text-purple-300' : 'bg-slate-800 text-slate-500'
          }`}
        >
          T
        </kbd>{' '}
        <span className={maxEscorts > 0 ? 'text-purple-200' : 'text-slate-500'}>Armada</span>
      </span>
      <span>
        <kbd className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded">M / CLICK</kbd> Mine
      </span>
    </div>
  );
});

// Root FlightHUD - Adapts seamlessly between Desktop (mouse/keys) and Mobile (touch)
export const FlightHUD: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth <= 1024;
      setIsMobile(isTouch);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-4 font-mono select-none overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between gap-2 pointer-events-auto">
        {/* Left Column: Sector Info & Mobile Compact Status */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <SectorHeader />
          {/* Mobile/Tablet Compact Gauges placed up top out of thumb way */}
          {isMobile && <MobileCompactGauges />}
        </div>

        {/* Center Column: Alert Banner & Prominent Main Screen Mission Compass Bar */}
        <div className="flex flex-col items-center gap-1.5 flex-1 max-w-lg mx-1 sm:mx-2 z-30">
          <CombatAlertBanner />
          <MainScreenMissionCompassBar />
        </div>

        {/* Right Column: Credits, Cargo, Sound & Mobile Radar */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <ResourceBar />
          {/* Upper Right Radar Minimap for Mobile/Tablet */}
          {isMobile && (
            <div className="scale-85 sm:scale-95 origin-top-right">
              <RadarMinimap />
            </div>
          )}
        </div>
      </div>

      {/* Middle Alerts, Drones & Docking Notification */}
      <DroneAndPoiLayer />
      <DesktopDockingOverlay />

      {/* Bottom Area: Gauges (Left), Guide (Center), Power & Radar (Right) - Desktop Only */}
      {!isMobile && (
        <div className="flex items-end justify-between pointer-events-auto gap-2">
          <DesktopFlightGauges />
          <FlightControlsCheatSheet />
          <div className="flex items-end space-x-3">
            <PowerConsole />
            <RadarMinimap />
          </div>
        </div>
      )}
    </div>
  );
};
