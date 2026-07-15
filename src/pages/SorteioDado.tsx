import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Maximize2, X } from "lucide-react";

type Face = 1 | 2 | 3 | 4 | 5 | 6;

const FACE_DOTS: Record<Face, { x: number; y: number }[]> = {
  1: [{ x: 50, y: 50 }],
  2: [{ x: 28, y: 28 }, { x: 72, y: 72 }],
  3: [{ x: 28, y: 28 }, { x: 50, y: 50 }, { x: 72, y: 72 }],
  4: [{ x: 28, y: 28 }, { x: 72, y: 28 }, { x: 28, y: 72 }, { x: 72, y: 72 }],
  5: [{ x: 28, y: 28 }, { x: 72, y: 28 }, { x: 50, y: 50 }, { x: 28, y: 72 }, { x: 72, y: 72 }],
  6: [{ x: 28, y: 22 }, { x: 72, y: 22 }, { x: 28, y: 50 }, { x: 72, y: 50 }, { x: 28, y: 78 }, { x: 72, y: 78 }],
};

const FACE_ROTS: Record<Face, { rx: number; ry: number }> = {
  1: { rx: 0,   ry: 0   },
  6: { rx: 0,   ry: 180 },
  2: { rx: 90,  ry: 0   },
  5: { rx: -90, ry: 0   },
  3: { rx: 0,   ry: -90 },
  4: { rx: 0,   ry: 90  },
};

const SIZE = 110;
const ivoryGrad = "linear-gradient(145deg, #fffff5 0%, #f5edd8 100%)";

function DiceFace({ value }: { value: Face }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: ivoryGrad,
        borderRadius: 18,
        border: "2px solid #c8b89a",
        position: "relative",
        boxShadow:
          "inset 0 2px 6px rgba(255,255,255,0.6), inset 0 -2px 4px rgba(0,0,0,0.15)",
        overflow: "hidden",
      }}
    >
      {/* Highlight */}
      <div
        style={{
          position: "absolute",
          top: 6,
          left: 10,
          right: 10,
          height: "28%",
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.55), rgba(255,255,255,0))",
          borderRadius: "50%",
        }}
      />
      {FACE_DOTS[value].map((dot, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: "18%",
            height: "18%",
            borderRadius: "50%",
            backgroundColor: "#2a1a1a",
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            transform: "translate(-50%, -50%)",
            boxShadow:
              "0 1px 4px rgba(0,0,0,0.45), inset 0 1px 2px rgba(0,0,0,0.3)",
          }}
        />
      ))}
    </div>
  );
}

export default function SorteioDado() {
  const navigate = useNavigate();

  const [result, setResult]       = useState<Face | null>(null);
  const [history, setHistory]     = useState<Face[]>([]);
  const [rolling, setRolling]     = useState(true);
  const [expanded, setExpanded]   = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cubeRef      = useRef<HTMLDivElement>(null);
  const posRef       = useRef({ x: 160, y: 200 });
  const velRef       = useRef({ x: 5.5, y: 4.2 });
  const rotRef       = useRef({ rx: 20, ry: 15, rz: 0 });
  const rotVelRef    = useRef({ rx: 6, ry: 8, rz: 3 });
  const rollingRef   = useRef(true);
  const rafRef       = useRef(0);

  const step = useCallback(() => {
    if (!rollingRef.current) return;
    const container = containerRef.current;
    const cube      = cubeRef.current;
    if (!container || !cube) { rafRef.current = requestAnimationFrame(step); return; }

    const maxX = container.clientWidth  - SIZE;
    const maxY = container.clientHeight - SIZE;

    posRef.current.x += velRef.current.x;
    posRef.current.y += velRef.current.y;

    if (posRef.current.x <= 0)    { velRef.current.x =  Math.abs(velRef.current.x); posRef.current.x = 0; }
    if (posRef.current.x >= maxX) { velRef.current.x = -Math.abs(velRef.current.x); posRef.current.x = maxX; }
    if (posRef.current.y <= 0)    { velRef.current.y =  Math.abs(velRef.current.y); posRef.current.y = 0; }
    if (posRef.current.y >= maxY) { velRef.current.y = -Math.abs(velRef.current.y); posRef.current.y = maxY; }

    rotRef.current.rx += rotVelRef.current.rx;
    rotRef.current.ry += rotVelRef.current.ry;
    rotRef.current.rz += rotVelRef.current.rz;

    cube.style.left      = `${posRef.current.x}px`;
    cube.style.top       = `${posRef.current.y}px`;
    cube.style.transform = `rotateX(${rotRef.current.rx}deg) rotateY(${rotRef.current.ry}deg) rotateZ(${rotRef.current.rz}deg)`;

    rafRef.current = requestAnimationFrame(step);
  }, []);

  const startRolling = useCallback(() => {
    rollingRef.current = true;
    setRolling(true);
    setResult(null);

    const sx = Math.random() > 0.5 ? 1 : -1;
    const sy = Math.random() > 0.5 ? 1 : -1;
    velRef.current    = { x: sx * (4.5 + Math.random() * 4), y: sy * (3.5 + Math.random() * 4) };
    rotVelRef.current = {
      rx: (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 7),
      ry: (Math.random() > 0.5 ? 1 : -1) * (6 + Math.random() * 8),
      rz: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 4),
    };
    rafRef.current = requestAnimationFrame(step);
  }, [step]);

  const stopDice = useCallback(() => {
    if (!rollingRef.current) { startRolling(); return; }

    rollingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    setRolling(false);

    const rolled = (Math.floor(Math.random() * 6) + 1) as Face;
    setResult(rolled);
    setHistory(prev => [rolled, ...prev].slice(0, 10));

    const { rx, ry } = FACE_ROTS[rolled];
    if (cubeRef.current) {
      cubeRef.current.style.transition = "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
      cubeRef.current.style.transform  = `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(0deg)`;
      setTimeout(() => { if (cubeRef.current) cubeRef.current.style.transition = ""; }, 700);
    }
  }, [startRolling]);

  // Inicia ao montar
  useEffect(() => {
    const c = containerRef.current;
    if (c) {
      posRef.current = { x: c.clientWidth / 2 - SIZE / 2, y: c.clientHeight / 2 - SIZE / 2 };
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [step]);

  return (
    // h-[100dvh] para preencher exatamente a viewport sem scroll
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "100dvh", background: "radial-gradient(ellipse at 50% 30%, #1e3a5f 0%, #0d1117 70%)" }}
    >
      {/* ── Header ── visível apenas quando NÃO está expandido */}
      {!expanded && (
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/20 backdrop-blur-sm border-b border-white/10 z-20">
          {/* Voltar */}
          <button
            id="voltar-btn"
            onClick={() => navigate("/jogos")}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>

          {/* Título */}
          <div className="text-center">
            <h1 className="text-lg font-black text-white tracking-tight leading-none">Sorteio de Dado</h1>
            <p className="text-[10px] text-white/40 font-semibold uppercase tracking-widest mt-0.5">
              {rolling ? "Toque para parar!" : "Toque para jogar novamente"}
            </p>
          </div>

          {/* Expandir */}
          <button
            id="expandir-btn"
            onClick={() => setExpanded(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Tela cheia"
          >
            <Maximize2 className="h-4 w-4 text-white" />
          </button>
        </div>
      )}

      {/* ── Arena de jogo ── ocupa todo o espaço restante */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden select-none"
        style={{ perspective: "700px", perspectiveOrigin: "50% 50%", cursor: "pointer" }}
        onClick={stopDice}
      >
        {/* Botão X de fechar tela cheia — só aparece no modo expandido */}
        {expanded && (
          <button
            id="fechar-expandido-btn"
            onClick={e => { e.stopPropagation(); setExpanded(false); }}
            className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 transition-all"
            aria-label="Fechar tela cheia"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        )}

        {/* Dado 3D */}
        <div
          ref={cubeRef}
          id="dado-3d"
          style={{
            position: "absolute",
            width: SIZE,
            height: SIZE,
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          <div style={{ position:"absolute", inset:0, transform:`translateZ(${SIZE/2}px)` }}>
            <DiceFace value={1} />
          </div>
          <div style={{ position:"absolute", inset:0, transform:`rotateY(180deg) translateZ(${SIZE/2}px)` }}>
            <DiceFace value={6} />
          </div>
          <div style={{ position:"absolute", inset:0, transform:`rotateY(90deg) translateZ(${SIZE/2}px)` }}>
            <DiceFace value={3} />
          </div>
          <div style={{ position:"absolute", inset:0, transform:`rotateY(-90deg) translateZ(${SIZE/2}px)` }}>
            <DiceFace value={4} />
          </div>
          <div style={{ position:"absolute", inset:0, transform:`rotateX(90deg) translateZ(${SIZE/2}px)` }}>
            <DiceFace value={2} />
          </div>
          <div style={{ position:"absolute", inset:0, transform:`rotateX(-90deg) translateZ(${SIZE/2}px)` }}>
            <DiceFace value={5} />
          </div>
        </div>

        {/* Resultado */}
        {!rolling && result && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 pointer-events-none z-10">
            <div className="animate-in fade-in zoom-in duration-500 text-center">
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">resultado</p>
              <span
                className="font-black text-white leading-none"
                style={{
                  fontSize: 100,
                  textShadow: "0 0 40px rgba(255,255,255,0.35), 0 4px 20px rgba(0,0,0,0.7)",
                }}
              >
                {result}
              </span>
              <p className="text-white/25 text-xs mt-2 font-medium">toque para jogar novamente</p>
            </div>
          </div>
        )}

        {/* Dica rolando */}
        {rolling && (
          <p className="absolute bottom-6 left-0 right-0 text-center text-white/20 text-xs font-medium pointer-events-none animate-pulse">
            Toque para parar o dado
          </p>
        )}

        {/* Histórico — canto inferior direito */}
        {history.length > 0 && (
          <div className="absolute bottom-4 right-3 flex flex-col items-center gap-1.5 pointer-events-none z-20">
            <p className="text-[9px] text-white/20 uppercase tracking-widest font-bold">últimos</p>
            {history.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-center rounded-xl font-black border border-white/10 bg-white/5 backdrop-blur-sm text-white/70"
                style={{
                  width: 30,
                  height: 30,
                  opacity: Math.max(0.1, 1 - i * 0.09),
                  fontSize: i === 0 ? 14 : 12,
                }}
              >
                {h}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
