import React, { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import {
  BookOpen,
  Sword,
  Rocket,
  Shield,
  Radio,
  Sparkles,
  ChevronRight,
  X,
  Award,
  Crown,
} from 'lucide-react';

export const StorybookModal: React.FC = () => {
  const activeChapter = useGameStore((state) => state.activeStorybookChapter);
  const closeStorybook = useGameStore((state) => state.closeStorybook);

  // Close on Escape or Enter or Space
  useEffect(() => {
    if (!activeChapter) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        closeStorybook();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeChapter, closeStorybook]);

  if (!activeChapter) return null;

  // Icon mapping
  const renderIllustration = () => {
    switch (activeChapter.illustrationIcon) {
      case 'SWORD':
        return (
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-950/60 border-2 border-amber-400 flex items-center justify-center shadow-glow-amber group">
            <div className="absolute inset-0 bg-amber-400/10 rounded-2xl animate-pulse" />
            <Sword className="w-10 h-10 sm:w-12 sm:h-12 text-amber-300 transform -rotate-45 drop-shadow-[0_0_12px_rgba(245,158,11,0.9)]" />
          </div>
        );
      case 'SHIP':
        return (
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-cyan-950/60 border-2 border-cyan-400 flex items-center justify-center shadow-glow-cyan">
            <div className="absolute inset-0 bg-cyan-400/10 rounded-2xl animate-pulse" />
            <Rocket className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.9)]" />
          </div>
        );
      case 'ARMADA':
        return (
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-purple-950/60 border-2 border-purple-400 flex items-center justify-center shadow-glow-purple">
            <div className="absolute inset-0 bg-purple-400/10 rounded-2xl animate-pulse" />
            <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-purple-300 drop-shadow-[0_0_12px_rgba(168,85,247,0.9)]" />
          </div>
        );
      case 'TITAN':
        return (
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-950/60 border-2 border-emerald-400 flex items-center justify-center shadow-glow-green">
            <div className="absolute inset-0 bg-emerald-400/10 rounded-2xl animate-pulse" />
            <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-300 drop-shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
          </div>
        );
      case 'STATION':
        return (
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-blue-950/60 border-2 border-blue-400 flex items-center justify-center shadow-glow-cyan">
            <Radio className="w-10 h-10 sm:w-12 sm:h-12 text-blue-300 drop-shadow-[0_0_12px_rgba(59,130,246,0.9)]" />
          </div>
        );
      case 'NEBULA':
      case 'CHRONICLE':
      default:
        return (
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-950/60 border-2 border-amber-400 flex items-center justify-center shadow-glow-amber">
            <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.9)]" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fade-in font-mono select-none">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border-2 border-amber-400/90 rounded-3xl p-5 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.35)] flex flex-col gap-4 sm:gap-6 text-slate-100 overflow-hidden">
        {/* Background Japanese Watermark / Grid Motif */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header & Milestone Badge */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs font-bold text-amber-400 tracking-widest uppercase flex items-center gap-1.5">
                <span>CHRONICLES OF THE SPACE RONIN</span>
                <span className="text-[9px] bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/40">
                  {activeChapter.triggerBadge}
                </span>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300">
                Chapter {activeChapter.chapterNumber} • {activeChapter.subtitle}
              </div>
            </div>
          </div>

          <button
            onClick={closeStorybook}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Continue"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content: Illustration + Title + Story Prose */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          {/* Illustration Emblem */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            {renderIllustration()}
            <div className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">
              {activeChapter.triggerType.replace('_', ' ')}
            </div>
          </div>

          {/* Story Narrative Text */}
          <div className="flex-1 flex flex-col gap-2.5 sm:gap-3 text-left">
            <h2 className="text-lg sm:text-2xl font-black text-amber-300 tracking-wide leading-tight">
              {activeChapter.title}
            </h2>

            <div className="space-y-2 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans font-normal">
              {activeChapter.loreText.map((paragraph, idx) => (
                <p key={idx} className="text-slate-300">
                  {idx === 0 ? (
                    <span className="font-bold text-amber-300 text-sm sm:text-base mr-1">
                      {paragraph.slice(0, 1)}
                    </span>
                  ) : null}
                  {idx === 0 ? paragraph.slice(1) : paragraph}
                </p>
              ))}
            </div>

            {/* Ronin Code Quote */}
            {activeChapter.quote && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-950/80 border-l-4 border-amber-400 italic text-[11px] sm:text-xs text-amber-200/90 font-serif">
                "{activeChapter.quote}"
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation & Continue Button */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-1">
          <div className="text-[10px] sm:text-xs text-slate-400 hidden sm:flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Story Chapter Logged to Codex</span>
          </div>

          <button
            onClick={closeStorybook}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs sm:text-sm tracking-wide shadow-glow-amber active:scale-95 transition-all cursor-pointer"
          >
            <span>CONTINUE ODYSSEY</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
