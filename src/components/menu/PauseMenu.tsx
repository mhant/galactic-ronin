import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Play, Terminal, HelpCircle, Volume2, VolumeX, Music, Home, Shield } from 'lucide-react';

export const PauseMenu: React.FC = () => {
  const [showControls, setShowControls] = useState(false);
  const isPaused = useGameStore((state) => state.isPaused);
  const togglePause = useGameStore((state) => state.togglePause);
  const toggleDiagnostics = useGameStore((state) => state.toggleDiagnostics);
  const returnToMainMenu = useGameStore((state) => state.returnToMainMenu);
  const musicEnabled = useGameStore((state) => state.musicEnabled);
  const sfxEnabled = useGameStore((state) => state.sfxEnabled);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const toggleMusic = useGameStore((state) => state.toggleMusic);
  const toggleSFX = useGameStore((state) => state.toggleSFX);
  const toggleSound = useGameStore((state) => state.toggleSound);
  const player = useGameStore((state) => state.player);
  const currentSectorId = useGameStore((state) => state.world.currentSectorId || 'Sector-01');
  const touchControlsMode = useGameStore((state) => state.touchControlsMode);
  const setTouchControlsMode = useGameStore((state) => state.setTouchControlsMode);

  if (!isPaused) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 select-none font-mono pointer-events-auto select-auto animate-fade-in">
      {/* Tactical Pause Card */}
      <div className="max-w-lg w-full bg-slate-950/95 border border-cyan-500/50 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl shadow-cyan-950/60 pointer-events-auto">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[11px] font-bold text-cyan-400 tracking-widest uppercase shadow-glow-cyan">
            <Shield className="w-3.5 h-3.5" />
            <span>TACTICAL FLIGHT PAUSE</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-200 tracking-wider">
            SYSTEM STANDBY
          </h2>
          <p className="text-xs text-slate-400">
            Sector: <span className="text-slate-200 font-bold">{currentSectorId}</span> | Hull:{' '}
            <span className="text-emerald-400 font-bold">{player.hull}/{player.maxHull}</span> | Credits:{' '}
            <span className="text-amber-400 font-bold">{player.credits.toLocaleString()} CR</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 max-w-sm mx-auto">
          {/* Resume Flight */}
          <button
            onClick={() => togglePause()}
            className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm tracking-wider transition-all duration-150 active:scale-95 shadow-glow-cyan flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME FLIGHT [ESC]</span>
          </button>

          {/* Open Flight Diagnostics */}
          <button
            onClick={() => toggleDiagnostics()}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 font-bold text-xs tracking-wider border border-cyan-500/40 transition-all duration-150 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer shadow-md"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>FLIGHT RECORDER & TELEMETRY [F3]</span>
          </button>

          {/* Controls Reference */}
          <button
            onClick={() => setShowControls(!showControls)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 transition-all duration-150 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>{showControls ? 'HIDE FLIGHT CONTROLS' : 'HOW TO PLAY & CONTROLS'}</span>
          </button>

          {/* Return to Main Menu */}
          <button
            onClick={() => returnToMainMenu()}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-xs border border-rose-500/30 transition-all duration-150 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-rose-400" />
            <span>RETURN TO MAIN MENU (SAVE & QUIT)</span>
          </button>
        </div>

        {/* Controls Manual Drawer */}
        {showControls && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-left text-xs text-slate-300 space-y-2.5 shadow-inner animate-fadeIn">
            <h3 className="font-bold text-cyan-300 text-xs border-b border-slate-800 pb-1">
              FLIGHT & WEAPONS MANUAL
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div><strong className="text-cyan-400">W / Up Arrow:</strong> Main Thruster</div>
              <div><strong className="text-cyan-400">A / D / Turn:</strong> Steer Ship</div>
              <div><strong className="text-amber-400">S / Down Arrow:</strong> Reverse Thruster</div>
              <div><strong className="text-cyan-400">Spacebar:</strong> Plasma Cannons</div>
              <div><strong className="text-cyan-400">Click / M:</strong> Rapid Mining Laser</div>
              <div><strong className="text-amber-400">F / Right-Click:</strong> Fire Torpedo</div>
              <div><strong className="text-purple-400">Q Key:</strong> Trigger EMP Shockwave</div>
              <div><strong className="text-emerald-400">R Key:</strong> Launch Recon Drone</div>
              <div><strong className="text-purple-400">T Key:</strong> Toggle Armada Stance</div>
              <div><strong className="text-cyan-400">E Key:</strong> Dock at Station</div>
            </div>
          </div>
        )}

        {/* Audio & Touch Controls Settings */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-slate-900 text-xs text-slate-400">
          <button
            onClick={toggleMusic}
            className="flex items-center space-x-1 hover:text-purple-300 transition-colors cursor-pointer"
          >
            <Music className={`w-3.5 h-3.5 ${musicEnabled ? 'text-purple-400' : 'text-slate-600'}`} />
            <span>Music: <strong className={musicEnabled ? 'text-purple-300' : 'text-slate-500'}>{musicEnabled ? 'ON' : 'OFF'}</strong></span>
          </button>

          <button
            onClick={toggleSFX}
            className="flex items-center space-x-1 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            {sfxEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-600" />}
            <span>SFX: <strong className={sfxEnabled ? 'text-cyan-300' : 'text-slate-500'}>{sfxEnabled ? 'ON' : 'OFF'}</strong></span>
          </button>

          <button
            onClick={toggleSound}
            className="flex items-center space-x-1 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-rose-500" />}
            <span>Master: <strong className={soundEnabled ? 'text-emerald-300' : 'text-rose-400'}>{soundEnabled ? 'ON' : 'MUTE'}</strong></span>
          </button>

          <button
            onClick={() => {
              const next = touchControlsMode === 'AUTO' ? 'OFF' : touchControlsMode === 'OFF' ? 'ON' : 'AUTO';
              setTouchControlsMode(next);
            }}
            className="flex items-center space-x-1 hover:text-amber-300 transition-colors cursor-pointer px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px]"
          >
            <span>Touch Controls: <strong className="text-amber-300 font-bold">{touchControlsMode}</strong></span>
          </button>
        </div>
      </div>
    </div>
  );
};
