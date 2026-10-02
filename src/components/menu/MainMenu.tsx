import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { SaveSlotModal } from './SaveSlotModal';
import {
  HelpCircle,
  Volume2,
  VolumeX,
  Music,
  Award,
} from 'lucide-react';

export const MainMenu: React.FC = () => {
  const [showControls, setShowControls] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const musicEnabled = useGameStore((state) => state.musicEnabled);
  const sfxEnabled = useGameStore((state) => state.sfxEnabled);
  const toggleMusic = useGameStore((state) => state.toggleMusic);
  const toggleSFX = useGameStore((state) => state.toggleSFX);

  return (
    <div className="fixed inset-0 z-50 bg-space-900/95 flex flex-col items-center justify-center p-4 sm:p-6 select-none font-mono overflow-y-auto">
      {/* Background Animated Atmosphere */}
      <div className="absolute inset-0 crt-overlay opacity-60 pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full text-center space-y-6 sm:space-y-8 my-auto py-6">
        {/* Title */}
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[11px] font-bold text-cyan-400 tracking-widest uppercase mb-1 shadow-glow-cyan">
            Tactical Space Exploration, Bounties & Trade
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-yellow-400 tracking-wider">
            GALACTIC RONIN
          </h1>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-300 tracking-widest">
            OUTER-RIM CHRONICLES
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto pt-1">
            Play as an exiled space ronin. Take high-risk contracts, mine scarce minerals, upgrade up to Tier 100 star dreadnoughts, and command an invincible armada.
          </p>
        </div>

        {/* Play Action Button */}
        <div className="space-y-3 max-w-sm mx-auto">
          <button
            onClick={() => setSaveModalOpen(true)}
            className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black text-sm tracking-wider transition-all duration-150 active:scale-95 shadow-2xl shadow-cyan-500/40 flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-slate-950/20 group-hover:scale-110 transition-transform">
                <Award className="w-5 h-5 text-slate-950" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-slate-950 tracking-wide">ENTER THE GALAXY / PLAY</div>
                <div className="text-[10px] text-slate-800 font-bold">Contracts, Story Lore & Fleet Battles</div>
              </div>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-950 text-cyan-300 font-black">
              3 SLOTS
            </span>
          </button>

          {/* Controls Overview Button */}
          <button
            onClick={() => setShowControls(!showControls)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 transition-all duration-150 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showControls ? 'HIDE FLIGHT MANUAL' : 'HOW TO PLAY & CONTROLS'}</span>
          </button>
        </div>

        {/* Controls Modal / Drawer */}
        {showControls && (
          <div className="bg-slate-950/90 border border-cyan-500/30 rounded-xl p-4 sm:p-5 text-left text-xs text-slate-300 space-y-3 shadow-2xl animate-fade-in max-w-md mx-auto">
            <h3 className="font-bold text-cyan-400 text-sm border-b border-cyan-950 pb-1 flex items-center justify-between">
              <span>FLIGHT MANUAL & CONTROLS</span>
              <span className="text-[10px] text-slate-400">Desktop & Mobile Ready</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span className="text-cyan-300 font-bold">W / Up Arrow:</span> Main Thruster</div>
              <div><span className="text-cyan-300 font-bold">A / D / Left / Right:</span> Turn Ship</div>
              <div><span className="text-amber-300 font-bold">S / Down Arrow:</span> Reverse Thruster</div>
              <div><span className="text-cyan-300 font-bold">Spacebar:</span> Plasma Cannons</div>
              <div><span className="text-yellow-300 font-bold">Click / M:</span> Rapid Mining Laser</div>
              <div><span className="text-amber-300 font-bold">F / Right-Click:</span> Fire Torpedo</div>
              <div><span className="text-purple-300 font-bold">Q Key:</span> EMP Shockwave</div>
              <div><span className="text-emerald-300 font-bold">R Key:</span> Launch Recon Drone</div>
              <div><span className="text-purple-300 font-bold">T Key:</span> Toggle Armada Stance</div>
              <div><span className="text-cyan-300 font-bold">E Key:</span> Dock with Station</div>
            </div>

            <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400 space-y-1">
              <p><strong className="text-amber-400">📜 Station Contracts:</strong> Dock at stations to accept Courier, Bounty Hunt, and Deep Mining missions.</p>
              <p><strong className="text-cyan-400">🚀 Tier 100 Progression:</strong> Upgrade your chassis and build an armada of up to 30 escort warships.</p>
            </div>
          </div>
        )}

        {/* Audio Toggles */}
        <div className="flex items-center justify-center space-x-6 text-xs text-slate-400 pt-2 border-t border-slate-900">
          <button
            onClick={toggleMusic}
            className="flex items-center space-x-1.5 hover:text-purple-300 transition-colors cursor-pointer"
          >
            <Music className={`w-4 h-4 ${musicEnabled ? 'text-purple-400' : 'text-slate-600'}`} />
            <span>Music: <strong className={musicEnabled ? 'text-purple-300' : 'text-slate-500'}>{musicEnabled ? 'ON' : 'OFF'}</strong></span>
          </button>

          <button
            onClick={toggleSFX}
            className="flex items-center space-x-1.5 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            {sfxEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-600" />
            )}
            <span>SFX: <strong className={sfxEnabled ? 'text-cyan-300' : 'text-slate-500'}>{sfxEnabled ? 'ON' : 'OFF'}</strong></span>
          </button>
        </div>
      </div>

      {/* Save Slot Picker Modal */}
      <SaveSlotModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
      />
    </div>
  );
};
