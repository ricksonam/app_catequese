import React from "react";

interface ModuleIconProps {
  type: string;
  className?: string;
}

/**
 * Renderiza ícones SVG inline para os módulos do Dashboard.
 * Cada ícone tem fundo colorido e ilustração branca, sem nenhum texto.
 */
export function ModuleIcon({ type, className }: ModuleIconProps) {
  const base = "w-full h-full";

  switch (type) {
    // ── MÓDULOS DA TURMA ─────────────────────────────────────

    case "catequizandos":
      return (
        <svg viewBox="0 0 100 100" className={className || base} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg-cat" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-cat)" />
          {/* Cruz */}
          <rect x="47" y="10" width="6" height="22" rx="2" fill="white" fillOpacity="0.9" />
          <rect x="39" y="16" width="22" height="6" rx="2" fill="white" fillOpacity="0.9" />
          {/* 3 crianças - esquerda */}
          <circle cx="28" cy="52" r="9" fill="white" fillOpacity="0.85" />
          <path d="M14 72 Q14 62 28 62 Q42 62 42 72" fill="white" fillOpacity="0.85" />
          {/* Centro */}
          <circle cx="50" cy="49" r="10" fill="white" />
          <path d="M35 72 Q35 59 50 59 Q65 59 65 72" fill="white" />
          {/* direita */}
          <circle cx="72" cy="52" r="9" fill="white" fillOpacity="0.85" />
          <path d="M58 72 Q58 62 72 62 Q86 62 86 72" fill="white" fillOpacity="0.85" />
          {/* Base */}
          <rect x="10" y="73" width="80" height="5" rx="2.5" fill="white" fillOpacity="0.2" />
        </svg>
      );

    case "encontros":
      return (
        <svg viewBox="0 0 100 100" className={className || base} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg-enc" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#15803d" />
              <stop offset="100%" stopColor="#4ade80" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-enc)" />
          {/* Livro aberto */}
          <path d="M20 65 L20 35 Q50 28 50 35 L50 65 Q50 60 20 65Z" fill="white" fillOpacity="0.9" />
          <path d="M80 65 L80 35 Q50 28 50 35 L50 65 Q50 60 80 65Z" fill="white" fillOpacity="0.75" />
          <line x1="50" y1="35" x2="50" y2="65" stroke="#15803d" strokeWidth="2" />
          {/* Cruz no livro */}
          <rect x="47" y="41" width="6" height="18" rx="1.5" fill="#15803d" fillOpacity="0.5" />
          <rect x="41" y="47" width="18" height="6" rx="1.5" fill="#15803d" fillOpacity="0.5" />
          {/* 4 pessoas em volta */}
          <circle cx="50" cy="20" r="7" fill="white" />
          <circle cx="20" cy="50" r="7" fill="white" />
          <circle cx="80" cy="50" r="7" fill="white" />
          <circle cx="50" cy="82" r="7" fill="white" />
        </svg>
      );

    case "eventos":
      return (
        <svg viewBox="0 0 100 100" className={className || base} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg-eve" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c2410c" />
              <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-eve)" />
          {/* Calendário */}
          <rect x="15" y="25" width="70" height="58" rx="8" fill="white" fillOpacity="0.2" />
          <rect x="15" y="25" width="70" height="20" rx="8" fill="white" fillOpacity="0.35" />
          <rect x="15" y="38" width="70" height="7" fill="white" fillOpacity="0.35" />
          {/* Argolas */}
          <rect x="32" y="18" width="6" height="14" rx="3" fill="white" fillOpacity="0.9" />
          <rect x="62" y="18" width="6" height="14" rx="3" fill="white" fillOpacity="0.9" />
          {/* Estrela central */}
          <polygon points="50,50 53,60 63,60 55,66 58,76 50,70 42,76 45,66 37,60 47,60"
            fill="white" fillOpacity="0.9" />
          {/* Faíscas */}
          <circle cx="25" cy="55" r="2.5" fill="white" fillOpacity="0.6" />
          <circle cx="75" cy="55" r="2.5" fill="white" fillOpacity="0.6" />
          <circle cx="30" cy="70" r="2" fill="white" fillOpacity="0.5" />
          <circle cx="70" cy="70" r="2" fill="white" fillOpacity="0.5" />
        </svg>
      );

    case "reunioes":
      return (
        <svg viewBox="0 0 100 100" className={className || base} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg-reu" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-reu)" />
          {/* Mesa oval */}
          <ellipse cx="50" cy="58" rx="32" ry="16" fill="white" fillOpacity="0.25" />
          <ellipse cx="50" cy="58" rx="32" ry="16" fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="2.5" />
          {/* 5 pessoas ao redor da mesa */}
          <circle cx="50" cy="28" r="8" fill="white" />
          <circle cx="22" cy="45" r="7" fill="white" fillOpacity="0.85" />
          <circle cx="78" cy="45" r="7" fill="white" fillOpacity="0.85" />
          <circle cx="28" cy="74" r="7" fill="white" fillOpacity="0.75" />
          <circle cx="72" cy="74" r="7" fill="white" fillOpacity="0.75" />
          {/* Tela de apresentação */}
          <rect x="36" y="14" width="28" height="18" rx="3" fill="white" fillOpacity="0.3" stroke="white" strokeOpacity="0.6" strokeWidth="1.5" />
          <line x1="44" y1="20" x2="56" y2="20" stroke="white" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
          <line x1="44" y1="25" x2="52" y2="25" stroke="white" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "trilha":
      return (
        <svg viewBox="0 0 100 100" className={className || base} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg-tri" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6d28d9" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-tri)" />
          {/* Estrada sinuosa */}
          <path d="M50 85 Q35 70 45 55 Q55 40 40 25" stroke="white" strokeOpacity="0.9" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M50 85 Q35 70 45 55 Q55 40 40 25" stroke="white" strokeOpacity="0.2" strokeWidth="12" fill="none" strokeLinecap="round" />
          {/* Marcadores da trilha */}
          <circle cx="50" cy="85" r="5" fill="white" />
          <circle cx="45" cy="62" r="5" fill="white" fillOpacity="0.8" />
          <circle cx="40" cy="25" r="6" fill="#fbbf24" />
          {/* Cruz dourada no topo */}
          <rect x="37" y="12" width="6" height="18" rx="2" fill="#fbbf24" />
          <rect x="31" y="17" width="18" height="6" rx="2" fill="#fbbf24" />
          {/* Pomba */}
          <ellipse cx="72" cy="30" rx="10" ry="6" fill="white" fillOpacity="0.85" transform="rotate(-20 72 30)" />
          <path d="M78 28 L86 22 L80 30" fill="white" fillOpacity="0.85" />
          <circle cx="74" cy="25" r="3" fill="white" fillOpacity="0.9" />
        </svg>
      );

    case "diario":
      return (
        <svg viewBox="0 0 100 100" className={className || base} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg-dia" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-dia)" />
          {/* Diário - livro aberto */}
          <rect x="18" y="22" width="30" height="56" rx="4" fill="white" fillOpacity="0.9" />
          <rect x="52" y="22" width="30" height="56" rx="4" fill="white" fillOpacity="0.75" />
          {/* Lombada */}
          <rect x="46" y="20" width="8" height="60" rx="4" fill="white" />
          {/* Linhas de escrita */}
          <line x1="24" y1="38" x2="44" y2="38" stroke="#0369a1" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="46" x2="44" y2="46" stroke="#0369a1" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="54" x2="40" y2="54" stroke="#0369a1" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
          {/* Cruz no lado direito */}
          <rect x="63" y="35" width="5" height="18" rx="1.5" fill="#0369a1" fillOpacity="0.4" />
          <rect x="57" y="41" width="17" height="5" rx="1.5" fill="#0369a1" fillOpacity="0.4" />
          {/* Lápis */}
          <rect x="67" y="58" width="8" height="22" rx="2" fill="#fbbf24" transform="rotate(-35 67 58)" />
          <polygon points="69,74 77,72 72,80" fill="#fb923c" transform="rotate(-35 67 58)" />
        </svg>
      );

    // ── MÓDULOS GLOBAIS ───────────────────────────────────────

    case "biblia":
      return (
        <svg viewBox="0 0 100 100" className={className || base} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg-bib" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="100%" stopColor="#f87171" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-bib)" />
          {/* Bíblia - capa fechada */}
          <rect x="22" y="18" width="56" height="68" rx="6" fill="white" fillOpacity="0.2" />
          <rect x="22" y="18" width="56" height="68" rx="6" fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="2" />
          <rect x="22" y="18" width="10" height="68" rx="3" fill="white" fillOpacity="0.15" />
          {/* Cruz radiante */}
          <rect x="47" y="32" width="6" height="28" rx="2" fill="white" />
          <rect x="36" y="43" width="28" height="6" rx="2" fill="white" />
          {/* Raios de luz */}
          <line x1="50" y1="26" x2="50" y2="20" stroke="white" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
          <line x1="60" y1="29" x2="64" y2="24" stroke="white" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
          <line x1="40" y1="29" x2="36" y2="24" stroke="white" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
          <line x1="65" y1="37" x2="72" y2="35" stroke="white" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
          <line x1="35" y1="37" x2="28" y2="35" stroke="white" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
          {/* Marcador */}
          <rect x="56" y="74" width="4" height="16" rx="2" fill="#fbbf24" />
        </svg>
      );

    case "oracoes":
      return (
        <svg viewBox="0 0 100 100" className={className || base} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg-ora" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4c1d95" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
            <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-ora)" />
          {/* Auréola dourada */}
          <circle cx="50" cy="30" r="22" fill="url(#glow)" fillOpacity="0.3" />
          <circle cx="50" cy="30" r="18" fill="url(#glow)" fillOpacity="0.15" />
          {/* Cruz no centro da auréola */}
          <rect x="47" y="15" width="6" height="22" rx="2" fill="white" fillOpacity="0.9" />
          <rect x="39" y="22" width="22" height="6" rx="2" fill="white" fillOpacity="0.9" />
          {/* Mãos em oração */}
          <ellipse cx="43" cy="66" rx="9" ry="20" rx2="8" fill="white" fillOpacity="0.9" transform="rotate(-10 43 66)" />
          <ellipse cx="57" cy="66" rx="9" ry="20" fill="white" fillOpacity="0.85" transform="rotate(10 57 66)" />
          {/* Rosário */}
          <circle cx="24" cy="58" r="3" fill="#fbbf24" />
          <circle cx="20" cy="66" r="3" fill="#fbbf24" />
          <circle cx="19" cy="75" r="3" fill="#fbbf24" />
          <path d="M24 58 Q20 62 20 66 Q19 70 19 75" stroke="#fbbf24" strokeOpacity="0.5" strokeWidth="1.5" fill="none" />
        </svg>
      );

    case "liturgia":
      return (
        <svg viewBox="0 0 100 100" className={className || base} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg-lit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-lit)" />
          {/* Sol litúrgico ao fundo */}
          <circle cx="50" cy="42" r="22" fill="white" fillOpacity="0.15" />
          {/* Raios do sol */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
            const r = Math.PI * angle / 180;
            const x1 = 50 + 26 * Math.cos(r);
            const y1 = 42 + 26 * Math.sin(r);
            const x2 = 50 + 34 * Math.cos(r);
            const y2 = 42 + 34 * Math.sin(r);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" />;
          })}
          {/* Cálice litúrgico */}
          <path d="M35 30 Q38 50 50 58 Q62 50 65 30 Z" fill="white" fillOpacity="0.9" />
          <rect x="46" y="58" width="8" height="18" rx="2" fill="white" fillOpacity="0.9" />
          <rect x="36" y="74" width="28" height="5" rx="2.5" fill="white" fillOpacity="0.9" />
          {/* Hóstia */}
          <circle cx="50" cy="26" r="8" fill="white" />
          <rect x="47" y="20" width="6" height="12" rx="1.5" fill="#b45309" fillOpacity="0.5" />
          <rect x="44" y="23" width="12" height="6" rx="1.5" fill="#b45309" fillOpacity="0.5" />
        </svg>
      );

    case "jogos":
      return (
        <svg viewBox="0 0 100 100" className={className || base} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg-jog" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#065f46" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-jog)" />
          {/* Dado grande */}
          <rect x="20" y="20" width="55" height="55" rx="12" fill="white" fillOpacity="0.9" />
          {/* Pontos do dado */}
          <circle cx="35" cy="35" r="5" fill="#065f46" fillOpacity="0.7" />
          <circle cx="55" cy="35" r="5" fill="#065f46" fillOpacity="0.7" />
          <circle cx="47.5" cy="47.5" r="5" fill="#065f46" fillOpacity="0.7" />
          <circle cx="35" cy="60" r="5" fill="#065f46" fillOpacity="0.7" />
          <circle cx="60" cy="60" r="5" fill="#065f46" fillOpacity="0.7" />
          {/* Cruz pequena em cima do dado */}
          <rect x="67" y="14" width="5" height="16" rx="2" fill="white" fillOpacity="0.9" />
          <rect x="61" y="19" width="17" height="5" rx="2" fill="white" fillOpacity="0.9" />
          {/* Estrela */}
          <polygon points="80,72 82,78 88,78 83,82 85,88 80,84 75,88 77,82 72,78 78,78"
            fill="#fbbf24" fillOpacity="0.9" />
        </svg>
      );

    case "agenda":
      return (
        <svg viewBox="0 0 100 100" className={className || base} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg-age" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0e7490" />
              <stop offset="100%" stopColor="#67e8f9" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-age)" />
          {/* Calendário */}
          <rect x="15" y="22" width="70" height="65" rx="10" fill="white" fillOpacity="0.2" />
          <rect x="15" y="22" width="70" height="65" rx="10" fill="none" stroke="white" strokeOpacity="0.5" strokeWidth="2" />
          {/* Cabeçalho do calendário */}
          <rect x="15" y="22" width="70" height="22" rx="10" fill="white" fillOpacity="0.35" />
          <rect x="15" y="38" width="70" height="6" fill="white" fillOpacity="0.35" />
          {/* Argolas */}
          <rect x="30" y="15" width="6" height="14" rx="3" fill="white" fillOpacity="0.9" />
          <rect x="64" y="15" width="6" height="14" rx="3" fill="white" fillOpacity="0.9" />
          {/* Grid de dias - com destaque em um */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((i) => {
            const col = i % 5;
            const row = Math.floor(i / 5);
            const x = 22 + col * 13;
            const y = 52 + row * 13;
            const isSpecial = i === 7;
            return (
              <rect key={i} x={x} y={y} width="9" height="9" rx="2"
                fill={isSpecial ? "#fbbf24" : "white"}
                fillOpacity={isSpecial ? 0.95 : 0.45}
              />
            );
          })}
          {/* Cruz no dia especial */}
          <rect x="25" y="54" width="3" height="7" rx="1" fill="#0e7490" fillOpacity="0.7" />
          <rect x="23" y="57" width="7" height="3" rx="1" fill="#0e7490" fillOpacity="0.7" />
        </svg>
      );

    case "loja":
      return (
        <svg viewBox="0 0 100 100" className={className || base} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg-loj" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-loj)" />
          {/* Sacola */}
          <path d="M25 42 L30 80 L70 80 L75 42 Z" fill="white" fillOpacity="0.9" />
          <path d="M25 42 L75 42" stroke="white" strokeWidth="2" />
          {/* Alças */}
          <path d="M36 42 Q36 22 50 22 Q64 22 64 42" stroke="white" strokeOpacity="0.9" strokeWidth="5" fill="none" strokeLinecap="round" />
          {/* Cruz na sacola */}
          <rect x="47" y="52" width="6" height="18" rx="2" fill="#1e40af" fillOpacity="0.5" />
          <rect x="41" y="58" width="18" height="6" rx="2" fill="#1e40af" fillOpacity="0.5" />
          {/* Estrelas ao redor */}
          <circle cx="20" cy="30" r="3" fill="#fbbf24" fillOpacity="0.8" />
          <circle cx="80" cy="30" r="3" fill="#fbbf24" fillOpacity="0.8" />
          <circle cx="15" cy="55" r="2" fill="#fbbf24" fillOpacity="0.6" />
          <circle cx="85" cy="55" r="2" fill="#fbbf24" fillOpacity="0.6" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 100 100" className={className || base} xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="#6b7280" />
          <circle cx="50" cy="50" r="25" fill="white" fillOpacity="0.5" />
        </svg>
      );
  }
}
