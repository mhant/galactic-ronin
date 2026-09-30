import React from 'react';
import { useGameStore } from './store/useGameStore';
import { GameCanvas } from './components/canvas/GameCanvas';
import { FlightHUD } from './components/hud/FlightHUD';
import { StationModal } from './components/station/StationModal';
import { MainMenu } from './components/menu/MainMenu';
import { GameOverModal } from './components/menu/GameOverModal';

export const App: React.FC = () => {
  const gameStatus = useGameStore((state) => state.gameStatus);

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
        </div>
      )}

      {/* Station Docking Interface */}
      {gameStatus === 'STATION' && (
        <div className="relative z-30">
          <StationModal />
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
    </div>
  );
};

export default App;
