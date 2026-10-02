import React, { useState, useEffect, useRef } from 'react';
import { logger, LogEntry } from '../../game/diagnosticLogger';
import { Activity, ShieldAlert, Cpu, Copy, Check, Trash2, X, Terminal } from 'lucide-react';

interface DiagnosticConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticConsole: React.FC<DiagnosticConsoleProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'COMBAT' | 'PERF' | 'STATE' | 'WARNING'>('ALL');
  const [copied, setCopied] = useState(false);
  const [metrics, setMetrics] = useState({
    fps: 60,
    frameTimeMs: 16.6,
    enemies: 0,
    projectiles: 0,
    particles: 0,
  });
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLogs(logger.getLogs());
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });

    const interval = setInterval(() => {
      setMetrics({
        fps: logger.currentFps,
        frameTimeMs: logger.frameTimeMs,
        enemies: logger.activeEnemiesCount,
        projectiles: logger.activeProjectilesCount,
        particles: logger.activeParticlesCount,
      });
    }, 250);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  if (!isOpen) return null;

  const filteredLogs = filter === 'ALL' ? logs : logs.filter((l) => l.category === filter);

  const handleCopy = async () => {
    try {
      const text = logger.exportLogs();
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy logs to clipboard:', err);
      // Fallback alert
      try {
        const textArea = document.createElement('textarea');
        textArea.value = logger.exportLogs();
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Final copy fallback failed:', e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 pointer-events-auto select-auto">
      <div className="w-full max-w-4xl h-[650px] bg-slate-950/95 border border-cyan-500/40 rounded-xl shadow-2xl shadow-cyan-950/50 flex flex-col overflow-hidden font-mono text-xs pointer-events-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-cyan-500/30">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h2 className="text-sm font-bold tracking-wider text-cyan-300">FLIGHT RECORDER & TELEMETRY DIAGNOSTICS</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              ACTIVE RECORDER [F3]
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-300 border border-cyan-500/40 rounded transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Log'}
            </button>
            <button
              onClick={() => logger.clear()}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-Time Metrics Strip */}
        <div className="grid grid-cols-5 gap-2 px-4 py-2.5 bg-slate-900/50 border-b border-slate-800 text-slate-300">
          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded border border-slate-800">
            <Activity className={`w-3.5 h-3.5 ${metrics.fps >= 50 ? 'text-emerald-400' : metrics.fps >= 35 ? 'text-amber-400' : 'text-red-400'}`} />
            <div>
              <div className="text-[10px] text-slate-500">FPS</div>
              <div className="font-bold text-slate-200">{metrics.fps} FPS</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded border border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-500">FRAME DELTA</div>
              <div className="font-bold text-slate-200">{metrics.frameTimeMs} ms</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded border border-slate-800">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <div>
              <div className="text-[10px] text-slate-500">LIVE HOSTILES</div>
              <div className="font-bold text-slate-200">{metrics.enemies}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded border border-slate-800">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div>
              <div className="text-[10px] text-slate-500">PROJECTILES</div>
              <div className="font-bold text-slate-200">{metrics.projectiles}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded border border-slate-800">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-500">PARTICLES</div>
              <div className="font-bold text-slate-200">{metrics.particles}</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-950/80 border-b border-slate-800">
          {(['ALL', 'COMBAT', 'PERF', 'STATE', 'WARNING'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
                filter === cat
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="ml-auto text-slate-500 text-[10px]">
            {filteredLogs.length} events logged
          </span>
        </div>

        {/* Log Viewer Console */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-950 text-slate-300 select-text">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600 italic">
              No diagnostic events recorded in this filter.
            </div>
          ) : (
            filteredLogs.map((entry) => {
              const badgeStyle =
                entry.category === 'COMBAT'
                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                  : entry.category === 'PERF'
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : entry.category === 'WARNING'
                  ? 'bg-red-950 text-red-200 border-red-700'
                  : 'bg-cyan-950 text-cyan-300 border-cyan-800';

              return (
                <div key={entry.id} className="p-2 rounded bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-slate-500">{entry.timeStr}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${badgeStyle}`}>
                      {entry.category}
                    </span>
                    <span className="font-semibold text-slate-200">{entry.message}</span>
                  </div>
                  {entry.data && (
                    <pre className="mt-1 p-2 rounded bg-slate-950/80 border border-slate-800/60 text-[10px] text-slate-400 overflow-x-auto">
                      {JSON.stringify(entry.data, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
