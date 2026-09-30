import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Skull, RotateCcw } from 'lucide-react';

export const GameOverModal: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const world = useGameStore((state) => state.world);
  const startGame = useGameStore((state) => state.startGame);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 select-none font-mono">
      <div className="max-w-md w-full bg-slate-950 border-2 border-rose-500/60 rounded-2xl p-8 text-center space-y-6 shadow-glow-red animate-bounce">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 mx-auto flex items-center justify-center">
          <Skull className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-3xl font-black text-rose-500 tracking-wider">
            VESSEL DESTROYED
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Your starship hull fractured under fatal stress. Your cargo and ship systems have been lost to the cold cosmic void.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2 text-left">
          <div className="flex justify-between">
            <span className="text-slate-400">Sector Reached:</span>
            <span className="text-slate-200 font-bold">{world.currentSectorId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Final Net Worth:</span>
            <span className="text-yellow-400 font-bold">{player.credits.toLocaleString()} CR</span>
          </div>
        </div>

        <button
          onClick={() => startGame(true)}
          className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all duration-150 active:scale-95 shadow-lg flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>RECONSTRUCT SHIP & RETRY</span>
        </button>
      </div>
    </div>
  );
};
