import React, { useState, useRef, useEffect, useCallback } from "react";
import { GameHeader } from "@/components/GameHeader";

type Face = 1 | 2 | 3 | 4 | 5 | 6;

// Posição dos pontos em cada face (percentual)
const FACE_DOTS: Record<Face, { x: number; y: number }[]> = {
  1: [{ x: 50, y: 50 }],
  2: [{ x: 28, y: 28 }, { x: 72, y: 72 }],
  3: [{ x: 28, y: 28 }, { x: 50, y: 50 }, { x: 72, y: 72 }],
  4: [{ x: 28, y: 28 }, { x: 72, y: 28 }, { x: 28, y: 72 }, { x: 72, y: 72 }],
  5: [{ x: 28, y: 28 }, { x: 72, y: 28 }, { x: 50, y: 50 }, { x: 28, y: 72 }, { x: 72, y: 72 }],
  6: [{ x: 28, y: 22 }, { x: 72, y: 22 }, { x: 28, y: 50 }, { x: 72, y: 50 }, { x: 28, y: 78 }, { x: 72, y: 78 }],
};

// Rotação final para mostrar cada face virada pra câmera
const FACE_ROTS: Record<Face, { rx: number; ry: number }> = {
  1: { rx: 0,    ry: 0   },  // frente
  6: { rx: 0,    ry: 180 },  // trás
  2: { rx: 90,   ry: 0   },  // cima
  5: { rx: -90,  ry: 0   },  // baixo
  3: { rx: 0,    ry: -90 },  // direita
  4: { rx: 0,    ry: 90  },  // esquerda
};

const SIZE = 110; // tamanho do dado em px

// Face de um lado do dado (CSS 3D)
function DiceFace({ value, bg }: { value: Face; bg: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: bg,
        borderRadius: 18,
        border: "2px solid #c8b89a",
        position: "relative",
        boxShadow: "inset 0 2px 6px rgba(255,255,255,0.6), inset 0 -2px 4px rgba(0,0,0,0.15)",
        overflow: "hidden",
      }}
    >
      {/* Highlight de luz */}
      <div style={{
        position: "absolute",
        top: 6, left: 10, right: 10, height: "28%",
        background: "linear-gradient(to bottom, rgba(255,255,255,0.55), rgba(255,255,255,0))",
        borderRadius: "50%",
      }} />
      {/* Pontos */}
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
            boxShadow: "0 1px 4px rgba(0,0,0,0.45), inset 0 1px 2px rgba(0,0,0,0.3)",
          }}
        />
      ))}
    </div>
  );
}

export default function SorteioDado() {
  const [result, setResult] = useState<Face | null>(null);
  const [history, setHistory] = useState<Face[]>([]);
  const [rolling, setRolling] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const cubeRef     = useRef<HTMLDivElement>(null);
  const posRef      = useRef({ x: 160, y: 200 });
  const velRef      = useRef({ x: 5.5, y: 4.2 });
  const rotRef      = useRef({ rx: 20, ry: 15, rz: 0 });
  const rotVelRef   = useRef({ rx: 6, ry: 8, rz: 3 });
  const rollingRef  = useRef(true);
  const rafRef      = useRef(0);

  const step = useCallback(() => {
    if (!rollingRef.current) return;
    const container = containerRef.current;
    const cube      = cubeRef.current;
    if (!container || !cube) { rafRef.current = requestAnimationFrame(step); return; }

    const maxX = container.clientWidth  - SIZE;
    const maxY = container.clientHeight - SIZE;

    // Mover
    posRef.current.x += velRef.current.x;
    posRef.current.y += velRef.current.y;

    // Quicar nas paredes
    if (posRef.current.x <= 0)    { velRef.current.x =  Math.abs(velRef.current.x); posRef.current.x = 0; }
    if (posRef.current.x >= maxX) { velRef.current.x = -Math.abs(velRef.current.x); posRef.current.x = maxX; }
    if (posRef.current.y <= 0)    { velRef.current.y =  Math.abs(velRef.current.y); posRef.current.y = 0; }
    if (posRef.current.y >= maxY) { velRef.current.y = -Math.abs(velRef.current.y); posRef.current.y = maxY; }

    // Girar
    rotRef.current.rx += rotVelRef.current.rx;
    rotRef.current.ry += rotVelRef.current.ry;
    rotRef.current.rz += rotVelRef.current.rz;

    // Aplicar
    cube.style.left      = `${posRef.current.x}px`;
    cube.style.top       = `${posRef.current.y}px`;
    cube.style.transform = `rotateX(${rotRef.current.rx}deg) rotateY(${rotRef.current.ry}deg) rotateZ(${rotRef.current.rz}deg)`;

    rafRef.current = requestAnimationFrame(step);
  }, []);

  const startRolling = useCallback(() => {
    rollingRef.current = true;
    setRolling(true);
    setResult(null);

    // Nova velocidade aleatória
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

    // Animar suavemente para a face correta
    const { rx, ry } = FACE_ROTS[rolled];
    if (cubeRef.current) {
      cubeRef.current.style.transition = "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
      cubeRef.current.style.transform  = `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(0deg)`;
      setTimeout(() => { if (cubeRef.current) cubeRef.current.style.transition = ""; }, 700);
    }
  }, [startRolling]);

  // Inicia ao montar
  useEffect(() => {
    // Posição inicial no centro
    const posInit = () => {
      const c = containerRef.current;
      if (c) {
        posRef.current = { x: c.clientWidth / 2 - SIZE / 2, y: c.clientHeight / 2 - SIZE / 2 };
      }
    };
    posInit();
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [step]);

  // Cor de fundo marfim das faces
  const ivoryGrad = "linear-gradient(145deg, #fffff5 0%, #f5edd8 100%)";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "radial-gradient(ellipse at 50% 30%, #1e3a5f 0%, #0d1117 70%)" }}>
      <GameHeader
        title="Sorteio de Dado"
        subtitle={rolling ? "Toque para parar!" : "Toque para jogar novamente"}
      />

      {/* Arena de jogo */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden select-none"
        style={{ perspective: "700px", perspectiveOrigin: "50% 50%", cursor: "pointer" }}
        onClick={stopDice}
      >
        {/* Sombra projetada no chão (falsa) */}
        <div
          style={{
            position: "absolute",
            width: SIZE * 0.9,
            height: SIZE * 0.3,
            background: "radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, transparent 70%)",
            borderRadius: "50%",
            left: posRef.current.x + SIZE * 0.05,
            top:  posRef.current.y + SIZE * 0.85,
            filter: "blur(4px)",
            pointerEvents: "none",
            transition: "none",
          }}
          id="dice-shadow"
        />

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
          {/* Frente  → 1 */}
          <div style={{ position:"absolute", inset:0, transform:`translateZ(${SIZE/2}px)` }}>
            <DiceFace value={1} bg={ivoryGrad} />
          </div>
          {/* Trás    → 6 */}
          <div style={{ position:"absolute", inset:0, transform:`rotateY(180deg) translateZ(${SIZE/2}px)` }}>
            <DiceFace value={6} bg={ivoryGrad} />
          </div>
          {/* Direita → 3 */}
          <div style={{ position:"absolute", inset:0, transform:`rotateY(90deg) translateZ(${SIZE/2}px)` }}>
            <DiceFace value={3} bg={ivoryGrad} />
          </div>
          {/* Esquerda → 4 */}
          <div style={{ position:"absolute", inset:0, transform:`rotateY(-90deg) translateZ(${SIZE/2}px)` }}>
            <DiceFace value={4} bg={ivoryGrad} />
          </div>
          {/* Cima    → 2 */}
          <div style={{ position:"absolute", inset:0, transform:`rotateX(90deg) translateZ(${SIZE/2}px)` }}>
            <DiceFace value={2} bg={ivoryGrad} />
          </div>
          {/* Baixo   → 5 */}
          <div style={{ position:"absolute", inset:0, transform:`rotateX(-90deg) translateZ(${SIZE/2}px)` }}>
            <DiceFace value={5} bg={ivoryGrad} />
          </div>
        </div>

        {/* Resultado central */}
        {!rolling && result && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-end pb-28 pointer-events-none"
            style={{ zIndex: 10 }}
          >
            <div className="animate-in fade-in zoom-in duration-500 text-center">
              <p className="text-white/35 text-xs font-bold uppercase tracking-[0.2em] mb-1">resultado</p>
              <span
                className="font-black text-white leading-none"
                style={{
                  fontSize: 96,
                  textShadow: "0 0 40px rgba(255,255,255,0.4), 0 4px 20px rgba(0,0,0,0.6)",
                }}
              >
                {result}
              </span>
              <p className="text-white/30 text-xs mt-2 font-medium">toque para jogar novamente</p>
            </div>
          </div>
        )}

        {/* Dica (rolando) */}
        {rolling && (
          <p className="absolute bottom-8 left-0 right-0 text-center text-white/25 text-xs font-medium pointer-events-none animate-pulse">
            Toque para parar o dado
          </p>
        )}

        {/* Histórico — canto inferior direito */}
        {history.length > 0 && (
          <div className="absolute bottom-4 right-3 flex flex-col items-center gap-1.5 pointer-events-none" style={{ zIndex: 20 }}>
            <p className="text-[9px] text-white/20 uppercase tracking-widest font-bold">últimos</p>
            {history.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-center rounded-xl font-black text-sm border border-white/10 bg-white/5 backdrop-blur-sm text-white/70"
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
