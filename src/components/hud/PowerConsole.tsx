import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Zap, Shield, Flame, Crosshair } from 'lucide-react';

export const PowerConsole: React.FC = () => {
  const enginePower = useGameStore((state) => state.ship.enginePower);
  const shieldPower = useGameStore((state) => state.ship.shieldPower);
  const weaponPower = useGameStore((state) => state.ship.weaponPower);
  const distributePower = useGameStore((state) => state.distributePower);

  const systems = [
    {
      id: 'engine' as const,
      name: 'ENGINES',
      power: enginePower,
      icon: Flame,
      color: 'text-amber-400',
      activeBg: 'bg-amber-400 shadow-glow-amber',
      desc: 'Speed & Turn Rate',
    },
    {
      id: 'shield' as const,
      name: 'SHIELDS',
      power: shieldPower,
      icon: Shield,
      color: 'text-cyan-400',
      activeBg: 'bg-cyan-400 shadow-glow-cyan',
      desc: 'Recharge & Mitigation',
    },
    {
      id: 'weapon' as const,
      name: 'WEAPONS',
      power: weaponPower,
      icon: Crosshair,
      color: 'text-rose-400',
      activeBg: 'bg-rose-400 shadow-glow-red',
      desc: 'Damage & Fire Cadence',
    },
  ];

  const totalUsed = enginePower + shieldPower + weaponPower;

  return (
    <div className="bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 rounded-lg p-3 text-xs font-mono shadow-2xl pointer-events-auto select-none">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-900/60">
        <div className="flex items-center space-x-1.5 text-cyan-400 font-bold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span>Reactor Core Distribution</span>
        </div>
        <div className="text-[10px] text-slate-400">
          POWER: <span className="text-cyan-300 font-bold">{totalUsed}/10 BARS</span>
        </div>
      </div>

      <div className="space-y-2">
        {systems.map((sys) => {
          const Icon = sys.icon;
          return (
            <div key={sys.id} className="flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-1.5 w-24">
                <Icon className={`w-3.5 h-3.5 ${sys.color}`} />
                <span className="font-semibold text-slate-200">{sys.name}</span>
              </div>

              {/* Power Pip Bars (1 to 5) */}
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div
                    key={lvl}
                    className={`w-3.5 h-5 rounded-xs border border-slate-700 transition-all duration-150 ${
                      lvl <= sys.power
                        ? sys.activeBg
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  />
                ))}
              </div>

              {/* Reallocate buttons */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => distributePower(sys.id, -1)}
                  disabled={sys.power <= 1}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-slate-200 font-bold flex items-center justify-center border border-slate-700"
                >
                  -
                </button>
                <button
                  onClick={() => distributePower(sys.id, 1)}
                  disabled={sys.power >= 5}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-slate-200 font-bold flex items-center justify-center border border-slate-700"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
