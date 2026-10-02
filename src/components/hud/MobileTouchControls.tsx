import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Pickaxe,
  Target,
  Zap,
  Radio,
  Rocket,
  Menu,
  FileText,
  Anchor,
  Flame,
  Shield,
  Gauge,
} from 'lucide-react';

export const MobileTouchControls: React.FC = () => {
  const gameStatus = useGameStore((state) => state.gameStatus);
  const isPaused = useGameStore((state) => state.isPaused);
  const isDiagnosticsOpen = useGameStore((state) => state.isDiagnosticsOpen);
  const distributePower = useGameStore((state) => state.distributePower);
  const togglePause = useGameStore((state) => state.togglePause);
  const toggleDiagnostics = useGameStore((state) => state.toggleDiagnostics);

  // Granular ship weapon selectors (avoids re-rendering on ship movement)
  const hasTorpedoLauncher = useGameStore((state) => state.ship.hasTorpedoLauncher);
  const torpedoes = useGameStore((state) => state.ship.torpedoes || 0);
  const hasEmpGenerator = useGameStore((state) => state.ship.hasEmpGenerator);
  const empCooldown = useGameStore((state) => state.ship.empCooldown || 0);
  const maxDrones = useGameStore((state) => state.ship.maxDrones || 0);
  const drones = useGameStore((state) => state.ship.drones || 0);
  const droneCooldown = useGameStore((state) => state.ship.droneCooldown || 0);
  const maxEscorts = useGameStore((state) => state.ship.maxEscorts || 0);
  const armadaStance = useGameStore((state) => state.ship.armadaStance || 'DEFEND');

  const touchControlsMode = useGameStore((state) => state.touchControlsMode);
  const setTouchControlsMode = useGameStore((state) => state.setTouchControlsMode);

  const [detectedTouch, setDetectedTouch] = useState(false);
  const [activeKeys, setActiveKeys] = useState<Record<string, boolean>>({});
  const [powerPreset, setPowerPreset] = useState<'BALANCED' | 'WEAPONS' | 'SHIELDS' | 'ENGINES'>('BALANCED');
  const [nearbyStationName, setNearbyStationName] = useState<string | null>(null);

  // Reliable detection of Mobile / Tablet vs Desktop Computer
  useEffect(() => {
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    const hasFinePointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

    // True ONLY on actual mobile/tablet devices or pure coarse touch pointer without mouse
    const initialTouch = isMobileDevice || (hasCoarsePointer && !hasFinePointer);
    setDetectedTouch(initialTouch);

    // Dynamic physical touch listener: activate if user physically touches screen
    const onPhysicalTouch = () => {
      setDetectedTouch(true);
    };

    window.addEventListener('touchstart', onPhysicalTouch, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onPhysicalTouch);
    };
  }, []);

  // Throttled proximity check to nearby stations (5 Hz / 200ms) without subscribing to ship/world on 60 FPS
  useEffect(() => {
    const checkStationProximity = () => {
      const { ship, world, gameStatus } = useGameStore.getState();
      if (gameStatus !== 'EXPLORING' && gameStatus !== 'COMBAT') {
        setNearbyStationName(null);
        return;
      }
      const st = (world.stations || []).find((s) => {
        const dx = ship.x - s.x;
        const dy = ship.y - s.y;
        const maxDist = s.radius + 175;
        return dx * dx + dy * dy <= maxDist * maxDist;
      });
      setNearbyStationName(st ? st.name : null);
    };

    const timer = setInterval(checkStationProximity, 200);
    return () => clearInterval(timer);
  }, []);

  const dispatchVirtualKey = useCallback((key: string, isPressed: boolean) => {
    setActiveKeys((prev) => ({ ...prev, [key]: isPressed }));
    window.dispatchEvent(
      new CustomEvent('ronin-virtual-control', {
        detail: { key, isPressed },
      })
    );
  }, []);

  const dispatchVirtualAction = useCallback((action: string) => {
    window.dispatchEvent(
      new CustomEvent('ronin-virtual-control', {
        detail: { action },
      })
    );
  }, []);

  // Quick Cycle Power Distribution for Mobile
  const cyclePowerPreset = useCallback(() => {
    const state = useGameStore.getState();
    const currentWpn = state.ship.weaponPower;
    const currentShd = state.ship.shieldPower;
    const currentEng = state.ship.enginePower;

    if (powerPreset === 'BALANCED') {
      setPowerPreset('WEAPONS');
      distributePower('weapon', 8 - currentWpn);
      distributePower('shield', 1 - currentShd);
      distributePower('engine', 1 - currentEng);
    } else if (powerPreset === 'WEAPONS') {
      setPowerPreset('SHIELDS');
      distributePower('shield', 8 - currentShd);
      distributePower('weapon', 1 - currentWpn);
      distributePower('engine', 1 - currentEng);
    } else if (powerPreset === 'SHIELDS') {
      setPowerPreset('ENGINES');
      distributePower('engine', 8 - currentEng);
      distributePower('shield', 1 - currentShd);
      distributePower('weapon', 1 - currentWpn);
    } else {
      setPowerPreset('BALANCED');
      distributePower('weapon', 3 - currentWpn);
      distributePower('shield', 3 - currentShd);
      distributePower('engine', 4 - currentEng);
    }
  }, [powerPreset, distributePower]);

  const cycleTouchMode = useCallback(() => {
    const next = touchControlsMode === 'AUTO' ? 'OFF' : touchControlsMode === 'OFF' ? 'ON' : 'AUTO';
    setTouchControlsMode(next);
  }, [touchControlsMode, setTouchControlsMode]);

  const shouldRenderTouch =
    touchControlsMode === 'ON' ||
    (touchControlsMode === 'AUTO' && detectedTouch);

  if (gameStatus !== 'EXPLORING' && gameStatus !== 'COMBAT') return null;
  if (!shouldRenderTouch) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none touch-none overflow-hidden">
      {/* Top Floating Mobile Station Dock Banner */}
      {nearbyStationName && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 pointer-events-auto animate-bounce z-40">
          <button
            onTouchStart={() => dispatchVirtualAction('dock')}
            onClick={() => dispatchVirtualAction('dock')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-cyan-500 text-slate-950 font-mono font-black text-sm border-2 border-cyan-200 shadow-2xl shadow-cyan-400/60 active:scale-95 transition-all cursor-pointer"
          >
            <Anchor className="w-5 h-5 animate-pulse" />
            <span>DOCK AT {nearbyStationName.toUpperCase()} [E]</span>
          </button>
        </div>
      )}

      {/* Top Mobile Quick Action Bar (Utility Controls) */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5 pointer-events-auto z-40">
        {/* Touch Controls Mode Toggle Button */}
        <button
          onTouchStart={cycleTouchMode}
          onClick={cycleTouchMode}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-mono font-bold text-[10px] backdrop-blur-md bg-slate-900/90 border-slate-700 text-slate-300 transition-all active:scale-90 shadow-md"
          title={`Touch Controls Mode: ${touchControlsMode} (Tap to Toggle)`}
        >
          <Rocket className="w-3 h-3 text-cyan-400" />
          <span>TOUCH: {touchControlsMode}</span>
        </button>

        {/* Mobile Power Distribution Preset Button */}
        <button
          onTouchStart={cyclePowerPreset}
          onClick={cyclePowerPreset}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-mono font-bold text-[10px] backdrop-blur-md transition-all active:scale-90 shadow-md ${
            powerPreset === 'WEAPONS'
              ? 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-rose-500/20'
              : powerPreset === 'SHIELDS'
              ? 'bg-cyan-950/90 border-cyan-500 text-cyan-300 shadow-cyan-500/20'
              : powerPreset === 'ENGINES'
              ? 'bg-amber-950/90 border-amber-500 text-amber-300 shadow-amber-500/20'
              : 'bg-slate-900/90 border-slate-700 text-slate-300'
          }`}
          title="Cycle Reactor Power Distribution"
        >
          {powerPreset === 'WEAPONS' && <Crosshair className="w-3 h-3 text-rose-400" />}
          {powerPreset === 'SHIELDS' && <Shield className="w-3 h-3 text-cyan-400" />}
          {powerPreset === 'ENGINES' && <Flame className="w-3 h-3 text-amber-400" />}
          {powerPreset === 'BALANCED' && <Zap className="w-3 h-3 text-yellow-400" />}
          <span>{powerPreset}</span>
        </button>

        {/* Diagnostics Modal Toggle */}
        <button
          onTouchStart={toggleDiagnostics}
          onClick={toggleDiagnostics}
          className={`p-2 rounded-lg border font-mono font-bold text-xs backdrop-blur-md transition-all active:scale-95 ${
            isDiagnosticsOpen
              ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-cyan-500/40'
              : 'bg-slate-900/90 text-cyan-400 border-cyan-500/40 shadow-md'
          }`}
          title="Flight Recorder Diagnostics [F3]"
        >
          <FileText className="w-4 h-4" />
        </button>

        {/* Tactical Pause Menu Toggle */}
        <button
          onTouchStart={togglePause}
          onClick={togglePause}
          className={`p-2 rounded-lg border font-mono font-bold text-xs backdrop-blur-md transition-all active:scale-95 ${
            isPaused
              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/40'
              : 'bg-slate-900/90 text-slate-200 border-slate-700 shadow-md'
          }`}
          title="Tactical Pause [ESC]"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Left Touch Zone - Ergonomic Virtual Flight D-Pad */}
      <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 pointer-events-auto select-none touch-none">
        <div className="relative w-40 h-40 sm:w-44 sm:h-44 bg-slate-950/80 backdrop-blur-lg border border-cyan-500/40 rounded-full shadow-2xl p-2 flex items-center justify-center ring-1 ring-cyan-500/20">
          {/* Center Hub Indicator */}
          <div className="w-11 h-11 rounded-full bg-slate-900/95 border border-cyan-500/50 flex flex-col items-center justify-center text-[9px] text-cyan-400 font-bold font-mono shadow-inner pointer-events-none">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>RCS</span>
          </div>

          {/* Forward Thrust Button [W / ArrowUp] */}
          <button
            onTouchStart={() => dispatchVirtualKey('KeyW', true)}
            onTouchEnd={() => dispatchVirtualKey('KeyW', false)}
            onTouchCancel={() => dispatchVirtualKey('KeyW', false)}
            onMouseDown={() => dispatchVirtualKey('KeyW', true)}
            onMouseUp={() => dispatchVirtualKey('KeyW', false)}
            className={`absolute top-1 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeKeys['KeyW']
                ? 'bg-cyan-400 text-slate-950 scale-110 shadow-lg shadow-cyan-400/60 ring-2 ring-cyan-300'
                : 'bg-slate-900/95 text-cyan-300 border border-cyan-500/50 hover:bg-slate-800'
            }`}
            title="Thrust Forward [W]"
          >
            <ChevronUp className="w-6 h-6" />
          </button>

          {/* Reverse Thruster / Brake Button [S / ArrowDown] */}
          <button
            onTouchStart={() => dispatchVirtualKey('KeyS', true)}
            onTouchEnd={() => dispatchVirtualKey('KeyS', false)}
            onTouchCancel={() => dispatchVirtualKey('KeyS', false)}
            onMouseDown={() => dispatchVirtualKey('KeyS', true)}
            onMouseUp={() => dispatchVirtualKey('KeyS', false)}
            className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeKeys['KeyS']
                ? 'bg-amber-400 text-slate-950 scale-110 shadow-lg shadow-amber-400/60 ring-2 ring-amber-300'
                : 'bg-slate-900/95 text-amber-300 border border-amber-500/50 hover:bg-slate-800'
            }`}
            title="Reverse Thrusters [S]"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          {/* Turn Left Button [A / ArrowLeft] */}
          <button
            onTouchStart={() => dispatchVirtualKey('KeyA', true)}
            onTouchEnd={() => dispatchVirtualKey('KeyA', false)}
            onTouchCancel={() => dispatchVirtualKey('KeyA', false)}
            onMouseDown={() => dispatchVirtualKey('KeyA', true)}
            onMouseUp={() => dispatchVirtualKey('KeyA', false)}
            className={`absolute left-1 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeKeys['KeyA']
                ? 'bg-cyan-400 text-slate-950 scale-110 shadow-lg shadow-cyan-400/60 ring-2 ring-cyan-300'
                : 'bg-slate-900/95 text-cyan-300 border border-cyan-500/50 hover:bg-slate-800'
            }`}
            title="Turn Left [A]"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Turn Right Button [D / ArrowRight] */}
          <button
            onTouchStart={() => dispatchVirtualKey('KeyD', true)}
            onTouchEnd={() => dispatchVirtualKey('KeyD', false)}
            onTouchCancel={() => dispatchVirtualKey('KeyD', false)}
            onMouseDown={() => dispatchVirtualKey('KeyD', true)}
            onMouseUp={() => dispatchVirtualKey('KeyD', false)}
            className={`absolute right-1 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeKeys['KeyD']
                ? 'bg-cyan-400 text-slate-950 scale-110 shadow-lg shadow-cyan-400/60 ring-2 ring-cyan-300'
                : 'bg-slate-900/95 text-cyan-300 border border-cyan-500/50 hover:bg-slate-800'
            }`}
            title="Turn Right [D]"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Right Touch Zone - Complete Weapon & Action Controls Cluster */}
      <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 pointer-events-auto select-none touch-none flex flex-col items-end gap-2.5">
        {/* Row 1: Special Weapons & Utility Matrix (Torpedo, EMP, Drone, Armada) */}
        <div className="flex items-center gap-2">
          {/* Combat Recon Drone Button [R] */}
          {maxDrones > 0 && (
            <button
              onTouchStart={() => dispatchVirtualAction('drone')}
              onClick={() => dispatchVirtualAction('drone')}
              disabled={drones <= 0 || droneCooldown > 0}
              className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-mono font-bold text-[9px] border shadow-xl transition-all active:scale-90 cursor-pointer ${
                drones > 0 && droneCooldown <= 0
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-emerald-500/30'
                  : 'bg-slate-950/80 border-slate-800 text-slate-600 opacity-50'
              }`}
              title="Deploy Point Defense Interceptor Drone [R]"
            >
              <Radio className={`w-4 h-4 ${drones > 0 && droneCooldown <= 0 ? 'animate-pulse' : ''}`} />
              <span className="mt-0.5">DRN {drones}</span>
            </button>
          )}

          {/* EMP Shockwave Generator [Q] */}
          {hasEmpGenerator && (
            <button
              onTouchStart={() => dispatchVirtualAction('emp')}
              onClick={() => dispatchVirtualAction('emp')}
              disabled={empCooldown > 0}
              className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-mono font-bold text-[9px] border shadow-xl transition-all active:scale-90 cursor-pointer ${
                empCooldown <= 0
                  ? 'bg-purple-950/90 border-purple-400 text-purple-300 shadow-purple-500/40 animate-pulse'
                  : 'bg-slate-950/80 border-slate-800 text-slate-500'
              }`}
              title="Discharge EMP Shockwave [Q]"
            >
              <Zap className="w-4 h-4 text-purple-300" />
              <span className="mt-0.5">
                {empCooldown <= 0 ? 'EMP' : `${empCooldown.toFixed(1)}s`}
              </span>
            </button>
          )}

          {/* Photon Torpedo Missile Salvo [F] */}
          {hasTorpedoLauncher && (
            <button
              onTouchStart={() => dispatchVirtualAction('torpedo')}
              onClick={() => dispatchVirtualAction('torpedo')}
              disabled={torpedoes <= 0}
              className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-mono font-bold text-[9px] border shadow-xl transition-all active:scale-90 cursor-pointer ${
                torpedoes > 0
                  ? 'bg-amber-950/90 border-amber-400 text-amber-300 shadow-amber-500/30'
                  : 'bg-slate-950/80 border-slate-800 text-slate-600 opacity-50'
              }`}
              title="Launch Photon Torpedo Missile [F]"
            >
              <Target className="w-4 h-4 text-amber-400" />
              <span className="mt-0.5">TRP {torpedoes}</span>
            </button>
          )}

          {/* Armada Fleet Stance Switcher [T] */}
          {maxEscorts > 0 && (
            <button
              onTouchStart={() => dispatchVirtualAction('armada')}
              onClick={() => dispatchVirtualAction('armada')}
              className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-mono font-bold text-[9px] border shadow-xl transition-all active:scale-90 cursor-pointer ${
                armadaStance === 'ATTACK'
                  ? 'bg-rose-950/90 border-rose-400 text-rose-300 shadow-rose-500/30 ring-1 ring-rose-500/40'
                  : 'bg-purple-950/90 border-purple-400 text-purple-300 shadow-purple-500/30 ring-1 ring-purple-500/40'
              }`}
              title="Toggle Escort Armada Stance [T] (ATTACK / DEFEND)"
            >
              <Rocket className="w-4 h-4" />
              <span className="mt-0.5">{armadaStance === 'ATTACK' ? 'ATK' : 'DEF'}</span>
            </button>
          )}
        </div>

        {/* Row 2: Primary Weapons (Mining Laser Beam & Primary Cannons Trigger) */}
        <div className="flex items-center gap-3">
          {/* Continuous Mining Laser Beam [M] */}
          <button
            onTouchStart={() => dispatchVirtualKey('KeyM', true)}
            onTouchEnd={() => dispatchVirtualKey('KeyM', false)}
            onTouchCancel={() => dispatchVirtualKey('KeyM', false)}
            onMouseDown={() => dispatchVirtualKey('KeyM', true)}
            onMouseUp={() => dispatchVirtualKey('KeyM', false)}
            className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-mono font-bold text-[10px] border shadow-xl transition-all cursor-pointer ${
              activeKeys['KeyM']
                ? 'bg-amber-400 text-slate-950 border-amber-200 scale-105 shadow-amber-400/60 ring-2 ring-amber-300'
                : 'bg-slate-900/95 text-amber-300 border-amber-500/50 backdrop-blur-md shadow-amber-500/20'
            }`}
            title="Hold for Continuous Mining Laser [M]"
          >
            <Pickaxe className="w-6 h-6 mb-0.5" />
            <span>MINE</span>
          </button>

          {/* Primary Pulse Laser Cannons [SPACE] */}
          <button
            onTouchStart={() => dispatchVirtualKey('Space', true)}
            onTouchEnd={() => dispatchVirtualKey('Space', false)}
            onTouchCancel={() => dispatchVirtualKey('Space', false)}
            onMouseDown={() => dispatchVirtualKey('Space', true)}
            onMouseUp={() => dispatchVirtualKey('Space', false)}
            className={`w-20 h-20 rounded-full flex flex-col items-center justify-center font-mono font-black text-xs border shadow-2xl transition-all cursor-pointer ${
              activeKeys['Space']
                ? 'bg-cyan-300 text-slate-950 border-white scale-110 shadow-cyan-400/80 ring-4 ring-cyan-400/50'
                : 'bg-cyan-600/95 text-white border-2 border-cyan-300 backdrop-blur-md shadow-cyan-600/50 hover:bg-cyan-500'
            }`}
            title="Hold for Primary Cannons Fire [SPACE]"
          >
            <Crosshair className="w-8 h-8 mb-0.5 animate-pulse" />
            <span className="tracking-widest">FIRE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
