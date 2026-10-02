import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import {
  Rocket,
  Package,
  Award,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

export const StoryIntroNuxModal: React.FC = () => {
  const isIntroNuxOpen = useGameStore((state) => state.isIntroNuxOpen);
  const setIntroNuxOpen = useGameStore((state) => state.setIntroNuxOpen);
  const [slide, setSlide] = useState(0);

  if (!isIntroNuxOpen) return null;

  const SLIDES = [
    {
      title: 'THE CODE OF THE SPACE RONIN',
      badge: 'STORY CAMPAIGN: PROLOGUE',
      badgeColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/80',
      icon: <Rocket className="w-8 h-8 text-cyan-400 animate-pulse" />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300 font-mono">
          <p>
            You are a <strong className="text-cyan-300">Space Ronin</strong> — an exiled master starfighter pilot
            carving out a solitary living in the lawless expanse of the Outer Rim sectors.
          </p>
          <p>
            Stripped of clan ties and corporate allegiances, your survival depends entirely on the agility of your ship,
            the precision of your lasers, and the reputation of your contracts.
          </p>
          <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-[11px] text-cyan-200">
            <span className="font-bold text-cyan-400">⚡ PRIMARY DIRECTIVE:</span> Start with a humble{' '}
            <strong className="text-amber-300">Ronin Dart Interceptor</strong>, accept transport contracts and pirate bounties across orbital space stations, and build an unstoppable cosmic armada.
          </div>
        </div>
      ),
    },
    {
      title: 'CONTRACTS, CARGO & BOUNTIES',
      badge: 'STATION MISSIONS SYSTEM',
      badgeColor: 'text-amber-400 border-amber-500/40 bg-amber-950/80',
      icon: <Package className="w-8 h-8 text-amber-400" />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300 font-mono">
          <p>
            Orbital Space Stations constantly broadcast high-value missions on the{' '}
            <strong className="text-amber-300">[ 📜 CONTRACTS & MISSIONS ]</strong> terminal:
          </p>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <strong className="text-cyan-400">📦 Cargo Courier:</strong> Deliver sensitive goods between stations.
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <strong className="text-rose-400">🎯 Pirate Bounties:</strong> Hunt and eliminate outlaw warlords.
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <strong className="text-yellow-400">💎 Deep Core Mining:</strong> Extract rare crystal ores from asteroid belts.
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <strong className="text-emerald-400">🛡️ Convoy Escort:</strong> Clear hostile sector corridors.
            </div>
          </div>
          <p className="text-[11px] text-rose-300 font-bold bg-rose-950/50 p-2 rounded-lg border border-rose-500/40">
            ⚠️ CONTRACT PENALTY: Once you accept a mission, you must complete it or pay a hefty cancellation penalty fee!
          </p>
        </div>
      ),
    },
    {
      title: 'FLEET EXPANSION & TIER 100 CHASSIS',
      badge: 'PROGRESSION & ARMADA',
      badgeColor: 'text-purple-400 border-purple-500/40 bg-purple-950/80',
      icon: <Award className="w-8 h-8 text-purple-400" />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300 font-mono">
          <p>
            Reinvest your bounty earnings at Space Station Shipyards to unlock up to{' '}
            <strong className="text-purple-300">Tier 100 Capital Vessels</strong> and command an entire fleet:
          </p>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-cyan-300 font-bold">Tier 1 - 5: Scouts & Corvettes</span>
              <span className="text-slate-400">Torpedoes & Point-Defense Flak</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-purple-300 font-bold">Tier 6 - 20: Frigates & Battleships</span>
              <span className="text-slate-400">Viper Fighters, Gunships & Missile Frigates</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-amber-300 font-bold">Tier 30 - 100: Dreadnoughts & Titans</span>
              <span className="text-slate-400">Battlecruisers, Supercarriers & Void Weavers</span>
            </div>
          </div>
          <p className="text-[11px] text-emerald-300">
            Switch your escort armada stance between <strong className="text-emerald-400">[DEFEND]</strong> and{' '}
            <strong className="text-rose-400">[ATTACK]</strong> to coordinate fleet strikes!
          </p>
        </div>
      ),
    },
  ];

  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center p-4 select-none font-mono animate-fade-in">
      <div className="w-full max-w-xl bg-slate-950 border-2 border-cyan-500/50 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-cyan-950/80 relative overflow-hidden">
        {/* Top Decorative Glow Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            {current.icon}
            <div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${current.badgeColor}`}>
                {current.badge}
              </span>
              <h2 className="text-base sm:text-lg font-black text-white mt-1 tracking-wide">
                {current.title}
              </h2>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-bold font-mono">
            {slide + 1} / {SLIDES.length}
          </span>
        </div>

        {/* Slide Body */}
        <div className="min-h-[220px] flex flex-col justify-center">
          {current.content}
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={() => setSlide((s) => Math.max(0, s - 1))}
            disabled={slide === 0}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>BACK</span>
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center space-x-1.5">
            {SLIDES.map((_, idx) => (
              <span
                key={idx}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === slide ? 'bg-cyan-400 w-6' : 'bg-slate-800'
                }`}
              />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={() => setIntroNuxOpen(false)}
              className="flex items-center space-x-1 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black tracking-wider transition-all shadow-glow-cyan active:scale-95 cursor-pointer"
            >
              <span>LAUNCH INTERCEPTOR</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setSlide((s) => Math.min(SLIDES.length - 1, s + 1))}
              className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <span>NEXT</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
