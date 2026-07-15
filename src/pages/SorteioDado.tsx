import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { GameHeader } from "@/components/GameHeader";
import { cn } from "@/lib/utils";

type Face = 1 | 2 | 3 | 4 | 5 | 6;

// Pontos de cada face
const DOTS: Record<Face, { x: number; y: number }[]> = {
  1: [{ x: 50, y: 50 }],
  2: [{ x: 30, y: 30 }, { x: 70, y: 70 }],
  3: [{ x: 30, y: 30 }, { x: 50, y: 50 }, { x: 70, y: 70 }],
  4: [{ x: 30, y: 30 }, { x: 70, y: 30 }, { x: 30, y: 70 }, { x: 70, y: 70 }],
  5: [{ x: 30, y: 30 }, { x: 70, y: 30 }, { x: 50, y: 50 }, { x: 30, y: 70 }, { x: 70, y: 70 }],
  6: [{ x: 30, y: 25 }, { x: 70, y: 25 }, { x: 30, y: 50 }, { x: 70, y: 50 }, { x: 30, y: 75 }, { x: 70, y: 75 }],
};

function DiceSVG({ value, size = 140 }: { value: Face; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="diceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e8e8e8" />
        </linearGradient>
        {/* Sombra lateral do dado (efeito 3D) */}
        <linearGradient id="sideRight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c0c0c0" />
          <stop offset="100%" stopColor="#a0a0a0" />
        </linearGradient>
        <linearGradient id="sideBottom" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#b0b0b0" />
          <stop offset="100%" stopColor="#909090" />
        </linearGradient>
        <filter id="diceShadow" x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="3" dy="6" stdDeviation="5" floodColor="#00000044" />
        </filter>
      </defs>

      {/* Corpo do dado */}
      <g filter="url(#diceShadow)">
        {/* Face frontal */}
        <rect x="8" y="8" width="76" height="76" rx="14" ry="14" fill="url(#diceGrad)" stroke="#d0d0d0" strokeWidth="1" />
        {/* Lado direito (3D) */}
        <polygon points="84,8 92,16 92,92 84,84" fill="url(#sideRight)" />
        {/* Lado inferior (3D) */}
        <polygon points="8,84 84,84 92,92 16,92" fill="url(#sideBottom)" />
        {/* Canto inferior direito (3D) */}
        <polygon points="84,84 92,92 92,92" fill="#888" />
        {/* Highlight superior */}
        <rect x="12" y="10" width="68" height="12" rx="6" fill="white" fillOpacity="0.5" />
      </g>

      {/* Pontos */}
      {DOTS[value].map((dot, i) => (
        <circle key={i} cx={dot.x} cy={dot.y} r="7" fill="#1a1a1a" />
      ))}
    </svg>
  );
}

export default function SorteioDado() {
  const [current, setCurrent] = useState<Face>(1);
  const [rolling, setRolling] = useState(false);
  const [display, setDisplay] = useState<Face>(1);
  const [history, setHistory] = useState<Face[]>([]);
  const [hasRolled, setHasRolled] = useState(false);

  const rollDice = useCallback(() => {
    if (rolling) return;
    setRolling(true);

    const result = (Math.floor(Math.random() * 6) + 1) as Face;

    let tick = 0;
    const total = 16;
    const interval = setInterval(() => {
      setDisplay((Math.floor(Math.random() * 6) + 1) as Face);
      tick++;
      if (tick >= total) {
        clearInterval(interval);
        setDisplay(result);
        setCurrent(result);
        setRolling(false);
        setHasRolled(true);
        setHistory(prev => [result, ...prev].slice(0, 10));
      }
    }, 55);
  }, [rolling]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b2838] to-[#0d1117]">
      <GameHeader title="Sorteio de Dado" subtitle="Toque para jogar" />

      {/* Área central */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 relative">

        {/* Dado */}
        <button
          id="dado-btn"
          onClick={rollDice}
          disabled={rolling}
          aria-label="Rolar dado"
          className={cn(
            "relative outline-none transition-all duration-200",
            rolling
              ? "cursor-wait animate-[wiggle_0.1s_ease-in-out_infinite]"
              : "hover:scale-105 active:scale-95 cursor-pointer"
          )}
          style={{
            filter: rolling
              ? "drop-shadow(0 0 20px #6366f188)"
              : hasRolled
              ? "drop-shadow(0 0 24px #ffffff55)"
              : "drop-shadow(0 0 8px #ffffff22)",
            transform: rolling ? undefined : "perspective(400px) rotateX(8deg)",
          }}
        >
          <DiceSVG value={display} size={170} />
        </button>

        {/* Número grande */}
        <div className="text-center">
          {hasRolled && !rolling ? (
            <div className="animate-in fade-in zoom-in duration-300">
              <span className="text-7xl font-black text-white drop-shadow-lg">{current}</span>
              <p className="text-white/40 text-sm font-semibold mt-1 uppercase tracking-widest">sorteado</p>
            </div>
          ) : (
            <p className={cn("text-white/30 text-sm font-medium", rolling && "animate-pulse")}>
              {rolling ? "Jogando..." : "Toque no dado para jogar"}
            </p>
          )}
        </div>

        {/* Botão */}
        <button
          id="rolar-btn"
          onClick={rollDice}
          disabled={rolling}
          className={cn(
            "px-10 py-3.5 rounded-2xl font-black text-white text-base uppercase tracking-widest transition-all duration-200",
            rolling ? "opacity-40 scale-95 cursor-wait" : "hover:scale-105 active:scale-95"
          )}
          style={{
            background: rolling ? "#374151" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            boxShadow: rolling ? "none" : "0 6px 30px #6366f155",
          }}
        >
          🎲 {rolling ? "Rolando..." : "Jogar"}
        </button>

        {/* Histórico — canto inferior direito */}
        {history.length > 0 && (
          <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1">
            <p className="text-[10px] text-white/25 uppercase tracking-widest font-bold mb-0.5">Últimos</p>
            {history.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-center rounded-lg font-black text-white/80 text-sm border border-white/10 bg-white/5 backdrop-blur-sm"
                style={{
                  width: 32,
                  height: 32,
                  opacity: 1 - i * 0.08,
                  transform: `scale(${1 - i * 0.03})`,
                }}
              >
                {h}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes wiggle {
          0%   { transform: perspective(400px) rotateX(8deg) rotate(-8deg) scale(0.97); }
          25%  { transform: perspective(400px) rotateX(8deg) rotate(8deg)  scale(1.03); }
          50%  { transform: perspective(400px) rotateX(8deg) rotate(-6deg) scale(0.98); }
          75%  { transform: perspective(400px) rotateX(8deg) rotate(6deg)  scale(1.02); }
          100% { transform: perspective(400px) rotateX(8deg) rotate(-8deg) scale(0.97); }
        }
      `}</style>
    </div>
  );
}
