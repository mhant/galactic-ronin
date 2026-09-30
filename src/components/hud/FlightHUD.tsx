import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { PowerConsole } from './PowerConsole';
import { RadarMinimap } from './RadarMinimap';
import {
  Shield,
  Activity,
  Fuel,
  Coins,
  Package,
  Volume2,
  VolumeX,
  Music,
  AlertTriangle,
  Radio,
} from 'lucide-react';

export const FlightHUD: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const ship = useGameStore((state) => state.ship);
  const world = useGameStore((state) => state.world);
  const combatAlert = useGameStore((state) => state.combatAlert);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const musicEnabled = useGameStore((state) => state.musicEnabled);
  const sfxEnabled = useGameStore((state) => state.sfxEnabled);
  const toggleSound = useGameStore((state) => state.toggleSound);
  const toggleMusic = useGameStore((state) => state.toggleMusic);
  const toggleSFX = useGameStore((state) => state.toggleSFX);

  const speed = Math.round(Math.hypot(ship.vx, ship.vy));
  const currentCargo = player.inventory.reduce((sum, item) => sum + item.quantity, 0);

  // Proximity dock check
  const nearestStation = world.stations.find(
    (st) => Math.hypot(ship.x - st.x, ship.y - st.y) <= st.radius + 160
  );

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 font-mono select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pointer-events-auto">
        {/* Sector and Ship ID */}
        <div className="flex items-center space-x-3 bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 px-3.5 py-2 rounded-lg text-xs shadow-lg">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <div>
            <div className="text-cyan-400 font-bold tracking-wide">
              {world.sector.name}
            </div>
            <div className="text-[10px] text-slate-400">
              SECTOR ID: <span className="text-slate-200">{world.currentSectorId}</span> | SEC LEVEL: <span className="text-amber-400">CLASS-{world.sector.dangerLevel}</span>
            </div>
          </div>
        </div>

        {/* Combat Alert Banner */}
        {combatAlert && (
          <div className="flex items-center space-x-2 bg-rose-950/85 border border-rose-500/60 px-4 py-1.5 rounded-full text-rose-300 text-xs font-bold animate-pulse shadow-glow-red">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>HOSTILE THREAT DETECTED - ENGAGE DEFENSES</span>
          </div>
        )}

        {/* Resources: Credits & Cargo & Sound Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Cargo Status */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 px-3 py-2 rounded-lg text-xs shadow-lg flex items-center space-x-2">
            <Package className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-400">CARGO BAY</div>
              <div className="font-bold text-slate-100">
                {currentCargo} / {player.cargoCapacity} <span className="text-[10px] text-cyan-300 font-normal">UNITS</span>
              </div>
            </div>
          </div>

          {/* Credits */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-yellow-500/30 px-3.5 py-2 rounded-lg text-xs shadow-lg flex items-center space-x-2">
            <Coins className="w-4 h-4 text-yellow-400" />
            <div>
              <div className="text-[10px] text-slate-400">CREDITS</div>
              <div className="font-bold text-yellow-300 text-sm">
                {player.credits.toLocaleString()} <span className="text-[10px] font-normal text-yellow-500">CR</span>
              </div>
            </div>
          </div>

          {/* Music Toggle */}
          <button
            onClick={toggleMusic}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-md active:scale-95 ${
              musicEnabled
                ? 'bg-purple-950/80 border-purple-500/50 text-purple-300 hover:bg-purple-900/80 shadow-glow-purple'
                : 'bg-slate-900/80 border-slate-700 text-slate-500 hover:bg-slate-800'
            }`}
            title="Toggle Ambient Music"
          >
            <Music className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{musicEnabled ? 'MUSIC: ON' : 'MUSIC: OFF'}</span>
          </button>

          {/* SFX Toggle */}
          <button
            onClick={toggleSFX}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-md active:scale-95 ${
              sfxEnabled
                ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/80 shadow-glow-cyan'
                : 'bg-slate-900/80 border-slate-700 text-slate-500 hover:bg-slate-800'
            }`}
            title="Toggle Sound Effects"
          >
            {sfxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{sfxEnabled ? 'SFX: ON' : 'SFX: OFF'}</span>
          </button>

          {/* Master Mute All Toggle */}
          <button
            onClick={toggleSound}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-md active:scale-95 ${
              soundEnabled
                ? 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-300 hover:bg-rose-900/80'
            }`}
            title="Master Audio Mute"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
            <span className="hidden md:inline">{soundEnabled ? 'MUTE' : 'UNMUTE'}</span>
          </button>
        </div>
      </div>

      {/* Middle Docking Notification Overlay */}
      {nearestStation && (
        <div className="self-center bg-slate-900/90 border-2 border-cyan-400 px-6 py-3 rounded-xl shadow-glow-cyan pointer-events-auto flex items-center space-x-3 animate-bounce">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <div className="text-center">
            <div className="text-xs text-slate-300 font-semibold">
              APPROACHING <span className="text-cyan-400 font-bold">{nearestStation.name}</span>
            </div>
            <div className="text-sm font-bold text-cyan-300 tracking-wider">
              PRESS <span className="bg-cyan-500 text-black px-1.5 py-0.5 rounded font-black">[ E ]</span> TO COMMENCE DOCKING
            </div>
          </div>
        </div>
      )}

      {/* Bottom Area: Gauges (Left), Guide (Center), Power & Radar (Right) */}
      <div className="flex items-end justify-between pointer-events-auto">
        {/* Left Gauges: Hull, Shield, Fuel, Speed */}
        <div className="w-64 bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 rounded-lg p-3 text-xs shadow-2xl space-y-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-cyan-900/50">
            <span className="text-[11px] font-bold text-cyan-400">TELEMETRY</span>
            <span className="text-[11px] text-slate-300">SPD: <span className="text-cyan-300 font-bold">{speed}</span> u/s</span>
          </div>

          {/* Hull Bar */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
              <span className="flex items-center gap-1 font-semibold">
                <Activity className="w-3 h-3 text-rose-400" /> HULL INTEGRITY
              </span>
              <span>{Math.round(player.hull)} / {player.maxHull}</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-200 ${
                  player.hull > 50
                    ? 'bg-emerald-400 shadow-glow-green'
                    : player.hull > 25
                    ? 'bg-amber-400 shadow-glow-amber'
                    : 'bg-rose-500 shadow-glow-red animate-pulse'
                }`}
                style={{ width: `${(player.hull / player.maxHull) * 100}%` }}
              />
            </div>
          </div>

          {/* Shield Bar */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
              <span className="flex items-center gap-1 font-semibold">
                <Shield className="w-3 h-3 text-cyan-400" /> DEFLECTOR SHIELD
              </span>
              <span>{Math.round(ship.shield)} / {ship.maxShield}</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-cyan-400 shadow-glow-cyan transition-all duration-150"
                style={{ width: `${(ship.shield / ship.maxShield) * 100}%` }}
              />
            </div>
          </div>

          {/* Fuel Bar */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
              <span className="flex items-center gap-1 font-semibold">
                <Fuel className="w-3 h-3 text-amber-400" /> SUB-LIGHT FUEL
              </span>
              <span>{Math.round(player.fuel)}%</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-200 ${
                  player.fuel > 20
                    ? 'bg-amber-400 shadow-glow-amber'
                    : 'bg-rose-500 animate-pulse'
                }`}
                style={{ width: `${player.fuel}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center Flight Controls Quick Tip */}
        <div className="hidden lg:flex items-center space-x-3 bg-slate-900/70 border border-slate-800 px-4 py-2 rounded-lg text-[11px] text-slate-300">
          <span><kbd className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded">W</kbd> Thrust</span>
          <span><kbd className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded">A/D</kbd> Turn</span>
          <span><kbd className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded">S</kbd> Brake</span>
          <span><kbd className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded">SPACE</kbd> Lasers</span>
          <span><kbd className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded">CLICK/M</kbd> Mine</span>
        </div>

        {/* Right Corner: Power Distribution + Radar Minimap */}
        <div className="flex items-end space-x-3">
          <PowerConsole />
          <RadarMinimap />
        </div>
      </div>
    </div>
  );
};
