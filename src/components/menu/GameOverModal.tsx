import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Skull, RotateCcw } from 'lucide-react';

export const GameOverModal: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const world = useGameStore((state) => state.world);
  const reconstructShip = useGameStore((state) => state.reconstructShip);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 select-none font-mono animate-fade-in">
      <div className="max-w-md w-full bg-slate-950 border-2 border-rose-500/60 rounded-2xl p-8 text-center space-y-6 shadow-glow-red animate-bounce-once">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 mx-auto flex items-center justify-center">
          <Skull className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-3xl font-black text-rose-500 tracking-wider">
            VESSEL DESTROYED
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Your starship hull fractured under fatal stress. Your ship has been recovered and systems are ready for emergency reconstruction.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2 text-left">
          <div className="flex justify-between">
            <span className="text-slate-400">Sector Reached:</span>
            <span className="text-slate-200 font-bold">{world?.currentSectorId || 'Sector-01'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Net Worth:</span>
            <span className="text-yellow-400 font-bold">{(player?.credits || 0).toLocaleString()} CR</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={() => reconstructShip()}
            className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all duration-150 active:scale-95 shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RECONSTRUCT SHIP & RETRY</span>
          </button>

          <button
            onClick={() => useGameStore.getState().toggleDiagnostics()}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 font-bold text-xs border border-cyan-500/30 transition-all duration-150 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>REVIEW FLIGHT LOGS [F3]</span>
          </button>

          <button
            onClick={() => useGameStore.getState().returnToMainMenu()}
            className="w-full py-2 rounded-xl bg-transparent hover:bg-slate-900 text-slate-400 hover:text-slate-200 font-medium text-xs transition-all duration-150 flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>Return to Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
