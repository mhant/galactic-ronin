import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Compass } from 'lucide-react';

export const RadarMinimap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = canvas.width;
      const center = size / 2;
      const radarRange = 2800; // Units covered by radar
      const scale = (center - 8) / radarRange;

      ctx.clearRect(0, 0, size, size);

      // Radar background circle
      ctx.fillStyle = 'rgba(11, 17, 32, 0.9)';
      ctx.beginPath();
      ctx.arc(center, center, center - 2, 0, Math.PI * 2);
      ctx.fill();

      // Outer border & range circles
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(center, center, (center - 8) * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(center, 4);
      ctx.lineTo(center, size - 4);
      ctx.moveTo(4, center);
      ctx.lineTo(size - 4, center);
      ctx.stroke();

      // Radar sweep
      const now = performance.now() * 0.002;
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(now);
      const gradient = ctx.createLinearGradient(0, 0, center - 8, 0);
      gradient.addColorStop(0, 'rgba(0, 240, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, center - 8, 0, 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const { ship, world } = useGameStore.getState();

      // 1. Draw Asteroids (yellow dots)
      for (const ast of world.asteroids) {
        const dx = (ast.x - ship.x) * scale;
        const dy = (ast.y - ship.y) * scale;
        if (Math.hypot(dx, dy) < center - 6) {
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.arc(center + dx, center + dy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Draw Stations (larger colored diamonds)
      for (const st of world.stations) {
        const dx = (st.x - ship.x) * scale;
        const dy = (st.y - ship.y) * scale;
        const dist = Math.hypot(dx, dy);

        // Clamp to edge if outside range
        let drawX = center + dx;
        let drawY = center + dy;

        if (dist >= center - 10) {
          const angle = Math.atan2(dy, dx);
          drawX = center + Math.cos(angle) * (center - 10);
          drawY = center + Math.sin(angle) * (center - 10);
        }

        ctx.fillStyle = st.color;
        ctx.beginPath();
        ctx.rect(drawX - 3, drawY - 3, 6, 6);
        ctx.fill();
      }

      // 3. Draw Enemies (pulsing red dots)
      for (const enemy of world.enemies) {
        const dx = (enemy.x - ship.x) * scale;
        const dy = (enemy.y - ship.y) * scale;
        if (Math.hypot(dx, dy) < center - 6) {
          ctx.fillStyle = '#FF3366';
          ctx.beginPath();
          ctx.arc(center + dx, center + dy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Draw Player (Cyan triangle in center)
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(ship.rotation);
      ctx.fillStyle = '#00F0FF';
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 rounded-lg p-2.5 shadow-2xl pointer-events-auto">
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-cyan-900/60 font-mono text-[11px] text-cyan-400">
        <span className="flex items-center gap-1 font-bold">
          <Compass className="w-3.5 h-3.5 text-cyan-400" /> RADAR SCOPE
        </span>
        <span className="text-[10px] text-slate-400">2.8k RAD</span>
      </div>
      <canvas
        ref={canvasRef}
        width={140}
        height={140}
        className="block rounded-full mx-auto"
      />
    </div>
  );
};
