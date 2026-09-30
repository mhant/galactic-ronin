import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Rocket, RotateCcw, HelpCircle, Volume2, VolumeX } from 'lucide-react';

export const MainMenu: React.FC = () => {
  const [showControls, setShowControls] = useState(false);
  const startGame = useGameStore((state) => state.startGame);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const toggleSound = useGameStore((state) => state.toggleSound);

  return (
    <div className="fixed inset-0 z-50 bg-space-900/95 flex flex-col items-center justify-center p-6 select-none font-mono">
      {/* Background Animated Atmosphere */}
      <div className="absolute inset-0 crt-overlay opacity-60 pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full text-center space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[11px] font-bold text-cyan-400 tracking-widest uppercase mb-2 shadow-glow-cyan">
            Tactical Space Exploration & Trade
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-yellow-400 tracking-wider">
            GALACTIC RONIN
          </h1>
          <h2 className="text-xl md:text-2xl font-bold text-slate-300 tracking-widest">
            SPACE BOOGALOO
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto pt-2">
            Pilot a lone starfighter through treacherous outlaw sectors. Speculate on high-yield commodities, mine asteroid fields, and battle pirate raiders.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 max-w-xs mx-auto">
          <button
            onClick={() => startGame(false)}
            className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm tracking-wider transition-all duration-150 active:scale-95 shadow-glow-cyan flex items-center justify-center space-x-2"
          >
            <Rocket className="w-4 h-4" />
            <span>CONTINUE EXPEDITION</span>
          </button>

          <button
            onClick={() => startGame(true)}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs tracking-wider border border-slate-700 transition-all duration-150 active:scale-95 flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>NEW GAME (RESET ALL)</span>
          </button>

          <button
            onClick={() => setShowControls(!showControls)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 transition-all duration-150 active:scale-95 flex items-center justify-center space-x-2"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showControls ? 'HIDE FLIGHT MANUAL' : 'HOW TO PLAY & CONTROLS'}</span>
          </button>
        </div>

        {/* Controls Modal / Drawer */}
        {showControls && (
          <div className="bg-slate-950/90 border border-cyan-500/30 rounded-xl p-5 text-left text-xs text-slate-300 space-y-3 shadow-2xl animate-fadeIn">
            <h3 className="font-bold text-cyan-400 text-sm border-b border-cyan-950 pb-1">
              FLIGHT MANUAL & TACTICAL PROTOCOLS
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span className="text-cyan-300 font-bold">W / Up Arrow:</span> Main Thruster</div>
              <div><span className="text-cyan-300 font-bold">A / D / Left / Right:</span> Turn Ship</div>
              <div><span className="text-cyan-300 font-bold">S / Down Arrow:</span> Retro Dampener</div>
              <div><span className="text-cyan-300 font-bold">Spacebar:</span> Plasma Cannon</div>
              <div><span className="text-cyan-300 font-bold">Click / M:</span> Mining Laser</div>
              <div><span className="text-cyan-300 font-bold">E Key:</span> Dock with Station</div>
            </div>

            <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400 space-y-1">
              <p><strong className="text-yellow-400">Trade:</strong> Buy low at producer stations (e.g. food at Agricultural, ore at Mining) and sell high at consumer hubs.</p>
              <p><strong className="text-cyan-400">Mining:</strong> Fire your mining laser at asteroids to extract valuable minerals and fuel cells into floating cargo.</p>
              <p><strong className="text-rose-400">Power Routing:</strong> Reroute your reactor between Engines, Shields, and Weapons to adapt to combat situations on the fly.</p>
            </div>
          </div>
        )}

        {/* Sound Toggle */}
        <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
          <button
            onClick={toggleSound}
            className="flex items-center space-x-1.5 hover:text-cyan-400 transition-colors"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>Audio Engine: ONLINE</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-500" />
                <span>Audio Engine: MUTED</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
