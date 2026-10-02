import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { SaveSlotData } from '../../types/game';
import {
  getAllSaveSlots,
  deleteSlot,
  formatSaveDate,
  exportSlotToJson,
  importSlotFromJson,
} from '../../data/saveSlots';
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
  Download,
  Upload,
  Copy,
  Check,
  FileCode,
  AlertCircle,
} from 'lucide-react';

interface SaveSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SaveSlotModal: React.FC<SaveSlotModalProps> = ({ isOpen, onClose }) => {
  const [slots, setSlots] = useState<(SaveSlotData | null)[]>([null, null, null]);
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);

  // JSON Export Modal State
  const [exportModalData, setExportModalData] = useState<{ slotIdx: number; json: string } | null>(
    null
  );
  const [copiedExport, setCopiedExport] = useState(false);

  // JSON Import Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importTargetSlot, setImportTargetSlot] = useState<number>(0);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);

  const startNewGameInSlot = useGameStore((state) => state.startNewGameInSlot);
  const loadGameFromSlotAction = useGameStore((state) => state.loadGameFromSlotAction);

  const reloadSlots = () => {
    setSlots(getAllSaveSlots('STORY'));
    setConfirmDeleteIdx(null);
  };

  useEffect(() => {
    if (isOpen) {
      reloadSlots();
      setExportModalData(null);
      setIsImportOpen(false);
      setImportError(null);
      setImportSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartNew = (slotIdx: number) => {
    startNewGameInSlot('STORY', slotIdx);
    onClose();
  };

  const handleLoad = (slotIdx: number) => {
    loadGameFromSlotAction('STORY', slotIdx);
    onClose();
  };

  const handleDelete = (slotIdx: number) => {
    deleteSlot('STORY', slotIdx);
    reloadSlots();
  };

  const handleExport = (slotIdx: number) => {
    const json = exportSlotToJson(slotIdx);
    if (json) {
      setExportModalData({ slotIdx, json });
      setCopiedExport(false);
    }
  };

  const copyExportToClipboard = async () => {
    if (!exportModalData) return;
    try {
      await navigator.clipboard.writeText(exportModalData.json);
      setCopiedExport(true);
      setTimeout(() => setCopiedExport(false), 2500);
    } catch {
      // Fallback
      setCopiedExport(true);
    }
  };

  const handleOpenImport = (preferredSlot: number = 0) => {
    setImportTargetSlot(preferredSlot);
    setImportJsonText('');
    setImportError(null);
    setImportSuccess(false);
    setIsImportOpen(true);
  };

  const handleExecuteImport = () => {
    setImportError(null);
    if (!importJsonText.trim()) {
      setImportError('Please paste your save game JSON text.');
      return;
    }

    const res = importSlotFromJson(importTargetSlot, importJsonText);
    if (!res.success) {
      setImportError(res.error || 'Failed to import save JSON.');
      return;
    }

    setImportSuccess(true);
    reloadSlots();
    setTimeout(() => {
      setIsImportOpen(false);
      setImportSuccess(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 select-none font-mono animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-950 border-2 border-cyan-500/50 rounded-2xl p-4 sm:p-7 space-y-4 sm:space-y-5 shadow-2xl shadow-cyan-950/80 relative my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 sm:top-4 right-3.5 sm:right-4 p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Import Button */}
        <div className="flex flex-wrap items-start justify-between gap-2 pr-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-[10px] text-cyan-400 font-bold mb-1">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>SAVE DATA & PILOT LOGS</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white tracking-wider">
              SELECT FLIGHT PROFILE (3 SLOTS)
            </h2>
          </div>

          <button
            onClick={() => handleOpenImport(0)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>IMPORT JSON SAVE</span>
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
                  className="bg-slate-900/60 border border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 transition-all group"
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

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenImport(idx)}
                      className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300 text-xs font-bold transition-all cursor-pointer"
                      title="Import JSON into this slot"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Import</span>
                    </button>

                    <button
                      onClick={() => handleStartNew(idx)}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>START NEW GAME</span>
                    </button>
                  </div>
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
                    <span className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-xs font-black text-cyan-400 shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-white">{shipClass.name}</span>
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
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    {/* Export JSON Button */}
                    <button
                      onClick={() => handleExport(idx)}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-all cursor-pointer"
                      title="Export Save Game to JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Slot Button */}
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

                    {/* Load Game Button */}
                    <button
                      onClick={() => handleLoad(idx)}
                      className="flex items-center space-x-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all shadow-glow-cyan active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>RESUME FLIGHT</span>
                    </button>
                  </div>
                </div>

                {/* Telemetry Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-300">
                  <div className="flex items-center gap-1 bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80 truncate">
                    <Coins className="w-3 h-3 text-yellow-400 shrink-0" />
                    <span className="truncate">{slotData.player.credits.toLocaleString()} CR</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80">
                    <Activity className="w-3 h-3 text-rose-400 shrink-0" />
                    <span>
                      {slotData.player.hull}/{slotData.player.maxHull} HP
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80">
                    <Shield className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>
                      {slotData.ship.shield}/{slotData.ship.maxShield} SHD
                    </span>
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

      {/* JSON EXPORT MODAL DIALOG */}
      {exportModalData && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 select-none font-mono animate-fade-in">
          <div className="w-full max-w-xl bg-slate-950 border-2 border-cyan-500/60 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setExportModalData(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2">
              <FileCode className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-black text-white">
                EXPORT SAVE DATA (SLOT #{exportModalData.slotIdx + 1})
              </h3>
            </div>

            <p className="text-xs text-slate-400">
              Copy the raw JSON telemetry below to back up your save or transfer it to another browser/device.
            </p>

            <div className="relative">
              <textarea
                readOnly
                value={exportModalData.json}
                className="w-full h-48 bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-cyan-300 select-all resize-none focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-500">
                {exportModalData.json.length} characters
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setExportModalData(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs font-bold cursor-pointer"
                >
                  CLOSE
                </button>

                <button
                  onClick={copyExportToClipboard}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all shadow-glow-cyan cursor-pointer active:scale-95"
                >
                  {copiedExport ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedExport ? 'COPIED TO CLIPBOARD!' : 'COPY JSON'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JSON IMPORT MODAL DIALOG */}
      {isImportOpen && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 select-none font-mono animate-fade-in">
          <div className="w-full max-w-xl bg-slate-950 border-2 border-cyan-500/60 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsImportOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-black text-white">IMPORT SAVE DATA (JSON)</h3>
            </div>

            <p className="text-xs text-slate-400">
              Paste exported Galactic Ronin save JSON below and choose which slot to restore into.
            </p>

            {/* Target Slot Selector */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-300 font-bold">Target Slot:</span>
              <div className="flex space-x-1.5">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setImportTargetSlot(idx)}
                    className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      importTargetSlot === idx
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-glow-cyan'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    Slot #{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              placeholder="Paste save JSON string here (e.g. { &quot;player&quot;: { ... }, &quot;ship&quot;: { ... } })..."
              value={importJsonText}
              onChange={(e) => {
                setImportJsonText(e.target.value);
                setImportError(null);
              }}
              className="w-full h-44 bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-cyan-200 placeholder-slate-600 focus:border-cyan-500/80 focus:outline-none"
            />

            {importError && (
              <div className="flex items-center space-x-2 text-rose-400 text-xs bg-rose-950/50 border border-rose-500/40 p-2.5 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccess && (
              <div className="flex items-center space-x-2 text-emerald-400 text-xs bg-emerald-950/50 border border-emerald-500/40 p-2.5 rounded-lg">
                <Check className="w-4 h-4 shrink-0" />
                <span>Save data successfully restored into Slot #{importTargetSlot + 1}!</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                onClick={() => setIsImportOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                CANCEL
              </button>

              <button
                onClick={handleExecuteImport}
                disabled={importSuccess}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-glow-green cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>RESTORE INTO SLOT #{importTargetSlot + 1}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
