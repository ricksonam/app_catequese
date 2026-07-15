import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { GameHeader } from "@/components/GameHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

// ─── Tipos ───────────────────────────────────────────────────────────────────
type Face = 1 | 2 | 3 | 4 | 5 | 6;

interface RollEntry {
  id: number;
  value: Face;
  timestamp: Date;
}

// ─── SVG das faces do dado ────────────────────────────────────────────────────
const DOT_POSITIONS: Record<Face, { cx: number; cy: number }[]> = {
  1: [{ cx: 50, cy: 50 }],
  2: [
    { cx: 25, cy: 25 },
    { cx: 75, cy: 75 },
  ],
  3: [
    { cx: 25, cy: 25 },
    { cx: 50, cy: 50 },
    { cx: 75, cy: 75 },
  ],
  4: [
    { cx: 25, cy: 25 },
    { cx: 75, cy: 25 },
    { cx: 25, cy: 75 },
    { cx: 75, cy: 75 },
  ],
  5: [
    { cx: 25, cy: 25 },
    { cx: 75, cy: 25 },
    { cx: 50, cy: 50 },
    { cx: 25, cy: 75 },
    { cx: 75, cy: 75 },
  ],
  6: [
    { cx: 25, cy: 20 },
    { cx: 75, cy: 20 },
    { cx: 25, cy: 50 },
    { cx: 75, cy: 50 },
    { cx: 25, cy: 80 },
    { cx: 75, cy: 80 },
  ],
};

// Cores por resultado
const FACE_COLORS: Record<Face, { bg: string; dot: string; glow: string }> = {
  1: { bg: "#1a1a2e", dot: "#e2c97e", glow: "#e2c97e66" },
  2: { bg: "#16213e", dot: "#7eb8e2", glow: "#7eb8e266" },
  3: { bg: "#0f3460", dot: "#7ee29b", glow: "#7ee29b66" },
  4: { bg: "#533483", dot: "#e27eb8", glow: "#e27eb866" },
  5: { bg: "#c84b31", dot: "#f5f5f5", glow: "#ffffff66" },
  6: { bg: "#1b4332", dot: "#ffd700", glow: "#ffd70066" },
};

function DiceFace({ value, size = 120, animated = false }: { value: Face; size?: number; animated?: boolean }) {
  const dots = DOT_POSITIONS[value];
  const colors = FACE_COLORS[value];
  const r = size * 0.12; // dot radius proportional

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn("drop-shadow-2xl select-none", animated && "animate-[spin_0.15s_ease-in-out]")}
      style={{ filter: `drop-shadow(0 0 18px ${colors.glow})` }}
    >
      <defs>
        <radialGradient id={`grad-${value}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={colors.bg} stopOpacity="0.85" />
          <stop offset="100%" stopColor={colors.bg} stopOpacity="1" />
        </radialGradient>
        <filter id="inner-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#00000055" />
        </filter>
      </defs>

      {/* Body */}
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="18"
        ry="18"
        fill={`url(#grad-${value})`}
        stroke={colors.dot}
        strokeWidth="2"
        strokeOpacity="0.25"
      />

      {/* Top highlight */}
      <rect x="10" y="6" width="80" height="18" rx="12" fill="white" fillOpacity="0.07" />

      {/* Dots */}
      {dots.map((pos, i) => (
        <circle
          key={i}
          cx={pos.cx}
          cy={pos.cy}
          r={r}
          fill={colors.dot}
          filter="url(#inner-shadow)"
          style={{ filter: `drop-shadow(0 0 4px ${colors.dot})` }}
        />
      ))}
    </svg>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function SorteioDado() {
  const navigate = useNavigate();

  const [current, setCurrent] = useState<Face | null>(null);
  const [rolling, setRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<Face>(1);
  const [history, setHistory] = useState<RollEntry[]>([]);
  const [totalRolls, setTotalRolls] = useState(0);
  const [stats, setStats] = useState<Record<Face, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
  const rollIdRef = useRef(0);

  const rollDice = useCallback(() => {
    if (rolling) return;

    setRolling(true);
    const result = (Math.floor(Math.random() * 6) + 1) as Face;

    // Animação de "rodando": troca rápida de faces aleatórias
    let ticks = 0;
    const maxTicks = 14;
    const interval = setInterval(() => {
      const fake = (Math.floor(Math.random() * 6) + 1) as Face;
      setDisplayValue(fake);
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(interval);
        setDisplayValue(result);
        setCurrent(result);
        setRolling(false);

        // Atualiza stats e histórico
        setTotalRolls((n) => n + 1);
        setStats((prev) => ({ ...prev, [result]: prev[result] + 1 }));
        setHistory((prev) => [
          { id: ++rollIdRef.current, value: result, timestamp: new Date() },
          ...prev.slice(0, 19),
        ]);

        // Confete especial para 6!
        if (result === 6) {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        }
      }
    }, 60);
  }, [rolling]);

  const clearHistory = () => {
    setHistory([]);
    setTotalRolls(0);
    setStats({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
    setCurrent(null);
  };

  const faces: Face[] = [1, 2, 3, 4, 5, 6];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d1117] via-[#161b27] to-[#0d1117] flex flex-col select-none">
      <GameHeader
        title="Sorteio de Dado"
        subtitle={totalRolls > 0 ? `${totalRolls} lançamento${totalRolls !== 1 ? "s" : ""}` : "Role o dado!"}
      />

      {/* ── Área principal ── */}
      <div className="flex-1 flex flex-col items-center gap-6 px-4 py-6">

        {/* Dado 3D */}
        <div className="flex flex-col items-center gap-4">
          {/* Dado clicável */}
          <button
            id="dado-btn"
            onClick={rollDice}
            disabled={rolling}
            aria-label="Rolar dado"
            className={cn(
              "relative flex items-center justify-center rounded-3xl transition-all duration-200 outline-none",
              "w-44 h-44 sm:w-52 sm:h-52",
              rolling
                ? "scale-95 cursor-wait"
                : "hover:scale-105 active:scale-95 cursor-pointer"
            )}
            style={{
              background: "radial-gradient(circle at 40% 30%, #1e293b, #0f172a)",
              boxShadow: current
                ? `0 0 50px ${FACE_COLORS[current].glow}, 0 20px 60px #00000099`
                : "0 20px 60px #00000099",
            }}
          >
            {/* Reflexo de brilho */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1/3 bg-white/5 rounded-full blur-xl" />
            </div>

            <DiceFace
              value={current ?? displayValue}
              size={110}
              animated={rolling}
            />

            {/* Label de resultado */}
            {current && !rolling && (
              <span
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[11px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full border"
                style={{
                  color: FACE_COLORS[current].dot,
                  borderColor: FACE_COLORS[current].dot + "55",
                  background: FACE_COLORS[current].bg + "cc",
                }}
              >
                {current === 6 ? "🎉 Seis!" : `Tirou ${current}`}
              </span>
            )}
          </button>

          {/* Botão de rolar */}
          <button
            onClick={rollDice}
            disabled={rolling}
            id="rolar-btn"
            className={cn(
              "mt-5 px-8 py-3 rounded-2xl font-black text-base uppercase tracking-widest transition-all duration-200 border-2",
              rolling
                ? "opacity-50 cursor-wait scale-95"
                : "hover:scale-105 active:scale-95"
            )}
            style={{
              background: rolling
                ? "#1e293b"
                : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderColor: "#6366f1",
              color: "#fff",
              boxShadow: rolling ? "none" : "0 4px 24px #6366f166",
            }}
          >
            {rolling ? "Rolando..." : "🎲 Rolar Dado"}
          </button>
        </div>

        {/* ── Estatísticas ── */}
        {totalRolls > 0 && (
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 text-center">
              Estatísticas
            </p>
            <div className="grid grid-cols-6 gap-2">
              {faces.map((f) => {
                const count = stats[f];
                const pct = totalRolls > 0 ? Math.round((count / totalRolls) * 100) : 0;
                const isActive = current === f;
                return (
                  <div
                    key={f}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl p-2 transition-all",
                      isActive ? "ring-2 scale-105" : "opacity-70"
                    )}
                    style={{
                      background: isActive ? FACE_COLORS[f].bg + "aa" : "#ffffff09",
                      ringColor: isActive ? FACE_COLORS[f].dot : "transparent",
                    }}
                  >
                    <DiceFace value={f} size={32} />
                    <span
                      className="text-sm font-black"
                      style={{ color: FACE_COLORS[f].dot }}
                    >
                      {count}
                    </span>
                    <span className="text-[10px] text-white/40">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Histórico ── */}
        {history.length > 0 && (
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Histórico
              </p>
              <button
                onClick={clearHistory}
                id="limpar-btn"
                className="text-[11px] text-white/30 hover:text-red-400 transition-colors font-semibold"
              >
                Limpar
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-center rounded-xl w-9 h-9 font-black text-base border transition-all"
                  style={{
                    background: FACE_COLORS[entry.value].bg + "dd",
                    borderColor: FACE_COLORS[entry.value].dot + "44",
                    color: FACE_COLORS[entry.value].dot,
                  }}
                >
                  {entry.value}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dica inicial */}
        {!current && !rolling && (
          <p className="text-white/25 text-xs font-medium text-center animate-pulse">
            Toque no dado ou no botão para rolar ✨
          </p>
        )}
      </div>
    </div>
  );
}
