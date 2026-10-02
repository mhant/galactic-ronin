import React, { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { GameCanvas } from './components/canvas/GameCanvas';
import { FlightHUD } from './components/hud/FlightHUD';
import { StationModal } from './components/station/StationModal';
import { MainMenu } from './components/menu/MainMenu';
import { GameOverModal } from './components/menu/GameOverModal';
import { PauseMenu } from './components/menu/PauseMenu';
import { DiagnosticConsole } from './components/hud/DiagnosticConsole';
import { MobileTouchControls } from './components/hud/MobileTouchControls';
import { StoryIntroNuxModal } from './components/menu/StoryIntroNuxModal';
import { StorybookModal } from './components/modals/StorybookModal';

export const App: React.FC = () => {
  const gameStatus = useGameStore((state) => state.gameStatus);
  const isPaused = useGameStore((state) => state.isPaused);
  const isDiagnosticsOpen = useGameStore((state) => state.isDiagnosticsOpen);
  const toggleDiagnostics = useGameStore((state) => state.toggleDiagnostics);
  const setDiagnosticsOpen = useGameStore((state) => state.setDiagnosticsOpen);

  useEffect(() => {
    (window as any).__GAME_STORE__ = useGameStore;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3' || e.code === 'F3') {
        e.preventDefault();
        toggleDiagnostics();
      } else if (e.key === 'Escape' || e.code === 'Escape') {
        e.preventDefault();
        const store = useGameStore.getState();
        if (store.isDiagnosticsOpen) {
          store.setDiagnosticsOpen(false);
        } else if (
          store.gameStatus === 'EXPLORING' ||
          store.gameStatus === 'COMBAT' ||
          store.gameStatus === 'STATION'
        ) {
          store.togglePause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDiagnostics]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-space-900 select-none">
      {/* 2D Canvas Engine */}
      <GameCanvas />

      {/* CRT Scanline & Ambient Filter Overlay */}
      <div className="absolute inset-0 crt-overlay pointer-events-none z-10" />

      {/* Flight HUD */}
      {(gameStatus === 'EXPLORING' || gameStatus === 'COMBAT') && (
        <div className="relative z-20 w-full h-full pointer-events-none">
          <FlightHUD />
          <MobileTouchControls />
        </div>
      )}

      {/* Station Docking Interface */}
      {gameStatus === 'STATION' && (
        <div className="relative z-30">
          <StationModal />
        </div>
      )}

      {/* Tactical Pause Menu (ESC) */}
      {isPaused && gameStatus !== 'MENU' && gameStatus !== 'GAMEOVER' && (
        <div className="relative z-40">
          <PauseMenu />
        </div>
      )}

      {/* Main Menu */}
      {gameStatus === 'MENU' && (
        <div className="relative z-40">
          <MainMenu />
        </div>
      )}

      {/* Game Over Screen */}
      {gameStatus === 'GAMEOVER' && (
        <div className="relative z-40">
          <GameOverModal />
        </div>
      )}

      {/* Story Mode Intro Prologue NUX */}
      <div className="relative z-50">
        <StoryIntroNuxModal />
        <StorybookModal />
      </div>

      {/* Global In-Game Flight Recorder & Telemetry Diagnostics Modal (F3) */}
      <DiagnosticConsole
        isOpen={isDiagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
      />
    </div>
  );
};

export default App;
