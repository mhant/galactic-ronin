import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { SHIP_CLASSES, ESCORT_CLASSES } from '../../data/shipClasses';
import {
  Play,
  Terminal,
  HelpCircle,
  Volume2,
  VolumeX,
  Music,
  Home,
  Shield,
  BookOpen,
  Crosshair,
  Users,
  Rocket,
  X,
  CheckCircle2,
  Lock,
  Swords,
} from 'lucide-react';

export const PauseMenu: React.FC = () => {
  const [showControls, setShowControls] = useState(false);
  const [showCodex, setShowCodex] = useState(false);
  const [codexTab, setCodexTab] = useState<'WEAPONS' | 'ESCORTS' | 'TIERS'>('WEAPONS');

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
  const ship = useGameStore((state) => state.ship);
  const currentSectorId = useGameStore((state) => state.world.currentSectorId || 'Sector-01');
  const touchControlsMode = useGameStore((state) => state.touchControlsMode);
  const setTouchControlsMode = useGameStore((state) => state.setTouchControlsMode);
  const difficulty = useGameStore((state) => state.difficulty || 'EASY');
  const setDifficulty = useGameStore((state) => state.setDifficulty);

  if (!isPaused) return null;

  const playerTier = ship.shipTier || 1;
  const weaponLvl = ship.weaponLevel || 1;
  const shieldLvl = ship.shieldLevel || 1;

  const SPECIAL_WEAPONS_INFO = [
    {
      id: 'torpedo',
      name: 'Photon Torpedo Launcher',
      category: 'Heavy Kinetic Ordnance',
      color: '#F97316',
      unlockRequirement: 'Ship Tier 2+ & Laser Level 2+',
      isUnlocked: playerTier >= 2 && weaponLvl >= 2,
      isInstalled: !!ship.hasTorpedoLauncher,
      cost: 750,
      description: 'Fires high-velocity seeking torpedoes dealing heavy explosive splash damage to hull and armor.',
      keybinding: 'F Key / Right-Click',
    },
    {
      id: 'emp',
      name: 'EMP Shockwave Emitter',
      category: 'Electromagnetic Warfare',
      color: '#00F0FF',
      unlockRequirement: 'Ship Tier 4+ & Shield Level 3+',
      isUnlocked: playerTier >= 4 && shieldLvl >= 3,
      isInstalled: !!ship.hasEmpGenerator,
      cost: 1200,
      description: 'Emits a 360-degree electromagnetic pulse that neutralizes incoming fire and stuns all nearby outlaw craft.',
      keybinding: 'Q Key',
    },
    {
      id: 'autoturrets',
      name: 'Point-Defense Auto-Flak Turrets',
      category: 'Automated Defensive Interception',
      color: '#FBBF24',
      unlockRequirement: 'Ship Tier 3+ & Laser Level 3+',
      isUnlocked: playerTier >= 3 && weaponLvl >= 3,
      isInstalled: !!ship.hasAutoTurrets,
      cost: 950,
      description: 'Automated high-rate-of-fire flak cannons that track and shoot down incoming enemy torpedoes and raider craft.',
      keybinding: 'Passive Auto-Fire',
    },
    {
      id: 'beam',
      name: 'Continuous Phaser Beam Lance',
      category: 'High-Energy Particle Lance',
      color: '#38BDF8',
      unlockRequirement: 'Ship Tier 6+ (Frigate or higher)',
      isUnlocked: playerTier >= 6,
      isInstalled: !!ship.hasBeamWeapon,
      cost: 2800,
      description: 'Continuous lock-on plasma beam lance that burns through enemy energy shielding and shreds armored hulls.',
      keybinding: 'Lock-on Continuous Beam',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 select-none font-mono pointer-events-auto select-auto animate-fade-in">
      {/* Tactical Pause Card */}
      <div className="max-w-xl w-full bg-slate-950/95 border border-cyan-500/50 rounded-2xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 shadow-2xl shadow-cyan-950/60 pointer-events-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[11px] font-bold text-cyan-400 tracking-widest uppercase shadow-glow-cyan">
            <Shield className="w-3.5 h-3.5" />
            <span>TACTICAL FLIGHT PAUSE</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-200 tracking-wider">
            SYSTEM STANDBY
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400">
            Sector: <span className="text-slate-200 font-bold">{currentSectorId}</span> | Tier:{' '}
            <span className="text-amber-300 font-bold">{playerTier}/100</span> | Hull:{' '}
            <span className="text-emerald-400 font-bold">{player.hull}/{player.maxHull}</span> | Credits:{' '}
            <span className="text-amber-400 font-bold">{player.credits.toLocaleString()} CR</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 max-w-sm mx-auto">
          {/* Resume Flight */}
          <button
            onClick={() => togglePause()}
            className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm tracking-wider transition-all duration-150 active:scale-95 shadow-glow-cyan flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME FLIGHT [ESC]</span>
          </button>

          {/* Open Armory & Fleet Codex */}
          <button
            onClick={() => setShowCodex(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 font-bold text-xs tracking-wider border border-purple-500/50 transition-all duration-150 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer shadow-md"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>GALACTIC ARMORY & FLEET CODEX</span>
          </button>

          {/* Open Flight Diagnostics */}
          <button
            onClick={() => toggleDiagnostics()}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 font-bold text-xs tracking-wider border border-cyan-500/40 transition-all duration-150 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer shadow-md"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>FLIGHT RECORDER & TELEMETRY [F3]</span>
          </button>

          {/* Controls Reference */}
          <button
            onClick={() => setShowControls(!showControls)}
            className="w-full py-2 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 transition-all duration-150 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>{showControls ? 'HIDE FLIGHT CONTROLS' : 'HOW TO PLAY & CONTROLS'}</span>
          </button>

          {/* Return to Main Menu */}
          <button
            onClick={() => returnToMainMenu()}
            className="w-full py-2 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-xs border border-rose-500/30 transition-all duration-150 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-rose-400" />
            <span>RETURN TO MAIN MENU (SAVE & QUIT)</span>
          </button>
        </div>

        {/* Combat Difficulty Setting */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center space-y-2 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-amber-400" />
              <span>COMBAT DIFFICULTY</span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              {difficulty === 'EASY' && 'Base (2.0x HP & Firepower)'}
              {difficulty === 'NORMAL' && 'Normal (2x Easy / 4.0x HP)'}
              {difficulty === 'HARD' && 'Hard (4x Easy / 8.0x HP)'}
              {difficulty === 'EXTREME' && 'Extreme (8x Easy / 16.0x HP)'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {(['EASY', 'NORMAL', 'HARD', 'EXTREME'] as const).map((diff) => {
              const isActive = difficulty === diff;
              const activeBg =
                diff === 'EASY'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950'
                  : diff === 'NORMAL'
                  ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-950'
                  : diff === 'HARD'
                  ? 'bg-orange-600 text-white border-orange-400 shadow-md shadow-orange-950'
                  : 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-950 animate-pulse';

              const idleBorder =
                diff === 'EASY'
                  ? 'hover:border-emerald-500/50 text-emerald-400'
                  : diff === 'NORMAL'
                  ? 'hover:border-amber-500/50 text-amber-400'
                  : diff === 'HARD'
                  ? 'hover:border-orange-500/50 text-orange-400'
                  : 'hover:border-rose-500/50 text-rose-400';

              return (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-black tracking-wider transition-all duration-150 border cursor-pointer ${
                    isActive
                      ? activeBg
                      : `bg-slate-950/80 border-slate-800 ${idleBorder} hover:bg-slate-900`
                  }`}
                >
                  {diff}
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls Manual Drawer */}
        {showControls && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-left text-xs text-slate-300 space-y-2 shadow-inner animate-fadeIn">
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

      {/* GALACTIC ARMORY & FLEET CODEX MODAL */}
      {showCodex && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in">
          <div className="max-w-4xl w-full bg-slate-950 border-2 border-purple-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="shrink-0 bg-slate-900/90 px-4 sm:px-6 py-3 border-b border-purple-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                    GALACTIC ARMORY & FLEET CODEX
                  </h2>
                  <p className="text-[10px] text-purple-300">
                    Comprehensive specifications for special ordnance, armada escorts, and flagship tiers.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCodex(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="shrink-0 bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center space-x-2">
              <button
                onClick={() => setCodexTab('WEAPONS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  codexTab === 'WEAPONS'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Special Ordnance (4)</span>
              </button>

              <button
                onClick={() => setCodexTab('ESCORTS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  codexTab === 'ESCORTS'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Armada Escorts (10 Classes)</span>
              </button>

              <button
                onClick={() => setCodexTab('TIERS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  codexTab === 'TIERS'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Flagship Tiers (1–100)</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* TAB 1: SPECIAL WEAPONS */}
              {codexTab === 'WEAPONS' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    All special ordnance systems available for purchase at space station refineries once prerequisite tech levels and ship chassis tiers are met.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {SPECIAL_WEAPONS_INFO.map((wpn) => (
                      <div
                        key={wpn.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between space-y-2.5 transition-all ${
                          wpn.isInstalled
                            ? 'bg-slate-900/90 border-emerald-500/50'
                            : wpn.isUnlocked
                            ? 'bg-slate-900/90 border-purple-500/40'
                            : 'bg-slate-950/60 border-slate-900 opacity-70'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: wpn.color }} />
                              {wpn.name}
                            </h3>
                            {wpn.isInstalled ? (
                              <span className="text-[9px] px-2 py-0.5 rounded font-black bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> INSTALLED
                              </span>
                            ) : wpn.isUnlocked ? (
                              <span className="text-[9px] px-2 py-0.5 rounded font-black bg-purple-950 text-purple-300 border border-purple-500/40">
                                AVAILABLE
                              </span>
                            ) : (
                              <span className="text-[9px] px-2 py-0.5 rounded font-black bg-slate-900 text-slate-500 border border-slate-800 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> LOCKED
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {wpn.category} • Cost: <span className="text-amber-300 font-bold">{wpn.cost.toLocaleString()} CR</span>
                          </div>

                          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                            {wpn.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-900 flex flex-col gap-1 text-[10px] font-mono">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Unlock Requirement:</span>
                            <span className={wpn.isUnlocked ? 'text-cyan-300 font-bold' : 'text-amber-400 font-bold'}>
                              {wpn.unlockRequirement}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Trigger / Control:</span>
                            <span className="text-purple-300 font-bold">{wpn.keybinding}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: ARMADA ESCORTS */}
              {codexTab === 'ESCORTS' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Armada escorts are autonomous wingmen that fly with your flagship, attack targets in combat, mine asteroids, and provide fleet defenses.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {ESCORT_CLASSES.map((esc) => {
                      const isUnlocked = playerTier >= esc.minShipTier;
                      return (
                        <div
                          key={esc.type}
                          className={`p-4 rounded-xl border flex flex-col justify-between space-y-2.5 transition-all ${
                            isUnlocked
                              ? esc.isSpecialty
                                ? 'bg-slate-900/95 border-cyan-500/50 shadow-md'
                                : 'bg-slate-900/90 border-purple-500/40'
                              : 'bg-slate-950/60 border-slate-900 opacity-70'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: esc.color }} />
                                <h3 className="text-xs sm:text-sm font-bold text-white">{esc.name}</h3>
                              </div>
                              <div className="flex items-center space-x-1">
                                {esc.isSpecialty && (
                                  <span className="text-[8px] px-1.5 py-0.2 rounded font-black bg-cyan-950 text-cyan-300 border border-cyan-500/50">
                                    SPECIALTY
                                  </span>
                                )}
                                {isUnlocked ? (
                                  <span className="text-[9px] px-2 py-0.5 rounded font-black bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                                    UNLOCKED
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-2 py-0.5 rounded font-black bg-amber-950 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                    <Lock className="w-2.5 h-2.5" /> Tier {esc.minShipTier}
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                              {esc.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-cyan-300 mt-2">
                              <span>Hull: <strong className="text-slate-100">{esc.hull} HP</strong></span>
                              <span>Shield: <strong className="text-slate-100">{esc.shield} HP</strong></span>
                              <span>Cost: <strong className="text-amber-300">{esc.cost.toLocaleString()} CR</strong></span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Special Perk / Capability:</span>
                            <span className="text-amber-300 font-bold">{esc.perks}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: FLAGSHIP TIERS */}
              {codexTab === 'TIERS' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>100-Tier Flagship progression roadmap and chassis classifications.</span>
                    <span className="text-amber-300 font-bold">Current Tier: {playerTier}/100</span>
                  </div>

                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {SHIP_CLASSES.map((cls) => {
                      const isCurrent = cls.tier === playerTier;
                      const isPassed = cls.tier < playerTier;
                      return (
                        <div
                          key={cls.tier}
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                            isCurrent
                              ? 'bg-amber-950/40 border-amber-500 shadow-glow-amber'
                              : isPassed
                              ? 'bg-slate-900/60 border-slate-800 opacity-80'
                              : 'bg-slate-950/40 border-slate-900 opacity-60'
                          }`}
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-white font-mono">
                                TIER {cls.tier}: {cls.name}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-slate-800 text-cyan-300 border border-slate-700">
                                {cls.category}
                              </span>
                              {isCurrent && (
                                <span className="text-[8px] px-1.5 py-0.2 rounded font-black bg-amber-500 text-slate-950">
                                  CURRENT SHIP
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {cls.description}
                            </p>
                          </div>

                          <div className="flex items-center space-x-3 text-[10px] font-mono text-cyan-300 shrink-0">
                            <span>HP: +{cls.hullBonus}</span>
                            <span>Cargo: +{cls.cargoBonus}</span>
                            <span>Cost: <strong className="text-amber-300">{cls.cost.toLocaleString()} CR</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

