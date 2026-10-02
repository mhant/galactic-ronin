import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { GameMode, SaveSlotData } from '../../types/game';
import { getAllSaveSlots, deleteSlot, formatSaveDate } from '../../data/saveSlots';
import { getShipClass } from '../../data/shipClasses';
import {
  Shield,
  Play,
  Trash2,
  PlusCircle,
  Clock,
  Coins,
  Activity,
  Award,
  Radio,
  X,
  Sparkles,
} from 'lucide-react';

interface SaveSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: GameMode;
}

export const SaveSlotModal: React.FC<SaveSlotModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'STORY',
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>(defaultMode);
  const [slots, setSlots] = useState<(SaveSlotData | null)[]>([null, null, null]);
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);

  const startNewGameInSlot = useGameStore((state) => state.startNewGameInSlot);
  const loadGameFromSlotAction = useGameStore((state) => state.loadGameFromSlotAction);

  const reloadSlots = () => {
    setSlots(getAllSaveSlots(selectedMode));
    setConfirmDeleteIdx(null);
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedMode(defaultMode);
      setSlots(getAllSaveSlots(defaultMode));
      setConfirmDeleteIdx(null);
    }
  }, [isOpen, defaultMode]);

  useEffect(() => {
    reloadSlots();
  }, [selectedMode]);

  if (!isOpen) return null;

  const handleStartNew = (slotIdx: number) => {
    startNewGameInSlot(selectedMode, slotIdx);
    onClose();
  };

  const handleLoad = (slotIdx: number) => {
    loadGameFromSlotAction(selectedMode, slotIdx);
    onClose();
  };

  const handleDelete = (slotIdx: number) => {
    deleteSlot(selectedMode, slotIdx);
    reloadSlots();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 select-none font-mono animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-950 border-2 border-cyan-500/50 rounded-2xl p-5 sm:p-7 space-y-5 shadow-2xl shadow-cyan-950/80 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-[10px] text-cyan-400 font-bold mb-1">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>SAVE DATA & PILOT LOGS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider">
            SELECT FLIGHT PROFILE
          </h2>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
          <button
            onClick={() => setSelectedMode('STORY')}
            className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              selectedMode === 'STORY'
                ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>STORY CAMPAIGN (3 SLOTS)</span>
          </button>
          <button
            onClick={() => setSelectedMode('FREE_PLAY')}
            className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              selectedMode === 'FREE_PLAY'
                ? 'bg-purple-500 text-white shadow-glow-purple'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>FREE PLAY SANDBOX (3 SLOTS)</span>
          </button>
        </div>

        {/* 3 Save Slot Cards */}
        <div className="space-y-3">
          {slots.map((slotData, idx) => {
            if (!slotData) {
              // Empty Slot
              return (
                <div
                  key={idx}
                  className="bg-slate-900/60 border border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-4 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-400 group-hover:text-cyan-300 transition-colors">
                        Empty Slot {idx + 1}
                      </div>
                      <div className="text-[10px] text-slate-600">No active pilot telemetry saved</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartNew(idx)}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>START NEW GAME</span>
                  </button>
                </div>
              );
            }

            // Occupied Slot
            const shipClass = getShipClass(slotData.ship.shipTier || 1);
            return (
              <div
                key={idx}
                className="bg-slate-900/90 border border-cyan-500/40 hover:border-cyan-400 rounded-xl p-3.5 sm:p-4 transition-all shadow-lg space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-xs font-black text-cyan-400">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-white">
                          {shipClass.name}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Tier {slotData.ship.shipTier || 1}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span className="text-slate-300 font-bold">{slotData.currentSectorId}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-2.5 h-2.5" />
                          {formatSaveDate(slotData.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {confirmDeleteIdx === idx ? (
                      <div className="flex items-center space-x-1.5 animate-fade-in">
                        <span className="text-[10px] text-rose-400 font-bold">Delete?</span>
                        <button
                          onClick={() => handleDelete(idx)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer"
                        >
                          YES
                        </button>
                        <button
                          onClick={() => setConfirmDeleteIdx(null)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold cursor-pointer"
                        >
                          NO
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteIdx(idx)}
                        className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-500/50 transition-all cursor-pointer"
                        title="Delete Save Slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleLoad(idx)}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all shadow-glow-cyan active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>RESUME FLIGHT</span>
                    </button>
                  </div>
                </div>

                {/* Telemetry Summary Stats */}
                <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-300">
                  <div className="flex items-center gap-1 bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80">
                    <Coins className="w-3 h-3 text-yellow-400 shrink-0" />
                    <span className="truncate">{slotData.player.credits.toLocaleString()} CR</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80">
                    <Activity className="w-3 h-3 text-rose-400 shrink-0" />
                    <span>{slotData.player.hull}/{slotData.player.maxHull} HP</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80">
                    <Shield className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>{slotData.ship.shield}/{slotData.ship.maxShield} SHD</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80">
                    <Award className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{slotData.completedMissionsCount || 0} Contracts</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
