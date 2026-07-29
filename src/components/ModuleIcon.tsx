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
              <stop offset="0%" stopColor="#065f46" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <radialGradient id="glow-enc" cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#065f46" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" rx="16" fill="url(#bg-enc)" />
          <rect width="100" height="100" rx="16" fill="url(#glow-enc)" />
          {/* Duas mãos unidas (aperto / encontro) */}
          {/* Mão esquerda */}
          <path d="M12 60 Q10 52 16 48 L24 44 Q28 42 31 45 L38 55 Q40 58 38 62 L30 70 Q26 74 22 72 Z"
            fill="white" fillOpacity="0.92" />
          {/* Dedos mão esq */}
          <rect x="14" y="38" width="7" height="12" rx="3.5" fill="white" fillOpacity="0.85" transform="rotate(-10 18 44)" />
          <rect x="22" y="35" width="7" height="13" rx="3.5" fill="white" fillOpacity="0.85" transform="rotate(-5 26 41)" />
          <rect x="30" y="36" width="7" height="12" rx="3.5" fill="white" fillOpacity="0.85" transform="rotate(5 34 42)" />
          {/* Mão direita */}
          <path d="M88 60 Q90 52 84 48 L76 44 Q72 42 69 45 L62 55 Q60 58 62 62 L70 70 Q74 74 78 72 Z"
            fill="white" fillOpacity="0.92" />
          {/* Dedos mão dir */}
          <rect x="79" y="38" width="7" height="12" rx="3.5" fill="white" fillOpacity="0.85" transform="rotate(10 83 44)" />
          <rect x="71" y="35" width="7" height="13" rx="3.5" fill="white" fillOpacity="0.85" transform="rotate(5 75 41)" />
          <rect x="63" y="36" width="7" height="12" rx="3.5" fill="white" fillOpacity="0.85" transform="rotate(-5 67 42)" />
          {/* Cruz central entre as mãos */}
          <rect x="47" y="12" width="6" height="22" rx="2.5" fill="white" fillOpacity="0.95" />
          <rect x="39" y="18" width="22" height="6" rx="2.5" fill="white" fillOpacity="0.95" />
          {/* Brilho na cruz */}
          <circle cx="50" cy="21" r="4" fill="#a7f3d0" fillOpacity="0.5" />
          {/* Linha de união das mãos */}
          <path d="M38 58 Q50 63 62 58" stroke="#a7f3d0" strokeWidth="3" fill="none" strokeLinecap="round" strokeOpacity="0.8" />
          {/* Pontinhos decorativos */}
          <circle cx="20" cy="82" r="3" fill="white" fillOpacity="0.3" />
          <circle cx="80" cy="82" r="3" fill="white" fillOpacity="0.3" />
          <circle cx="50" cy="86" r="4" fill="white" fillOpacity="0.2" />
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
              <stop offset="0%" stopColor="#5b21b6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="16" fill="url(#bg-reu)" />
          {/* Balão de fala principal (grande) */}
          <rect x="12" y="14" width="55" height="40" rx="10" fill="white" fillOpacity="0.92" />
          <path d="M24 54 L18 66 L36 54 Z" fill="white" fillOpacity="0.92" />
          {/* Cruz dentro do balão */}
          <rect x="33" y="22" width="5" height="20" rx="2" fill="#5b21b6" fillOpacity="0.6" />
          <rect x="24" y="29" width="22" height="5" rx="2" fill="#5b21b6" fillOpacity="0.6" />
          {/* Balão de resposta menor (canto dir baixo) */}
          <rect x="40" y="54" width="46" height="30" rx="9" fill="white" fillOpacity="0.55" stroke="white" strokeOpacity="0.7" strokeWidth="1.5" />
          <path d="M58 54 L52 44 L68 54 Z" fill="white" fillOpacity="0.55" />
          {/* Linhas no balão menor */}
          <line x1="49" y1="64" x2="77" y2="64" stroke="white" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
          <line x1="49" y1="72" x2="70" y2="72" stroke="white" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
          {/* Ponto decorativo */}
          <circle cx="87" cy="14" r="5" fill="#ddd6fe" fillOpacity="0.5" />
          <circle cx="12" cy="88" r="4" fill="#ddd6fe" fillOpacity="0.35" />
        </svg>
      );

    case "trilha":
      return (
        <svg viewBox="0 0 100 100" className={className || base} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg-tri" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="road-tri" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="16" fill="url(#bg-tri)" />
          {/* Estrada / caminho sinuoso */}
          <path d="M50 90 Q30 75 35 55 Q40 38 50 28 Q60 18 68 10"
            stroke="white" strokeOpacity="0.25" strokeWidth="18" fill="none" strokeLinecap="round" />
          <path d="M50 90 Q30 75 35 55 Q40 38 50 28 Q60 18 68 10"
            stroke="url(#road-tri)" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="6 5" />
          {/* Marco 1 – Batismo (água) */}
          <circle cx="47" cy="75" r="10" fill="white" fillOpacity="0.18" />
          <circle cx="47" cy="75" r="10" fill="none" stroke="#7dd3fc" strokeWidth="2" />
          <path d="M47 68 Q43 72 43 75 Q43 79 47 79 Q51 79 51 75 Q51 72 47 68Z" fill="#7dd3fc" fillOpacity="0.9" />
          {/* Marco 2 – Eucaristia (hóstia) */}
          <circle cx="43" cy="46" r="10" fill="white" fillOpacity="0.18" />
          <circle cx="43" cy="46" r="10" fill="none" stroke="#fbbf24" strokeWidth="2" />
          <circle cx="43" cy="46" r="6" fill="white" fillOpacity="0.9" />
          <rect x="41" y="41.5" width="4" height="9" rx="1" fill="#1e3a5f" fillOpacity="0.5" />
          <rect x="38.5" y="44" width="9" height="4" rx="1" fill="#1e3a5f" fillOpacity="0.5" />
          {/* Marco 3 – Crisma (chama) */}
          <circle cx="57" cy="20" r="10" fill="white" fillOpacity="0.18" />
          <circle cx="57" cy="20" r="10" fill="none" stroke="#fb923c" strokeWidth="2" />
          <path d="M57 12 Q53 16 54 20 Q55 24 57 25 Q59 24 60 20 Q61 16 57 12Z" fill="#fb923c" fillOpacity="0.95" />
          <path d="M57 15 Q55 18 55 20 Q56 23 57 24 Q58 23 59 20 Q59 18 57 15Z" fill="#fef3c7" fillOpacity="0.8" />
          {/* Seta de progresso */}
          <path d="M75 85 L82 78 L89 85" fill="none" stroke="white" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="82" y1="78" x2="82" y2="92" stroke="white" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" />
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
              <stop offset="0%" stopColor="#701a75" />
              <stop offset="100%" stopColor="#c026d3" />
            </linearGradient>
            <radialGradient id="glow-ora" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#f0abfc" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#701a75" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" rx="16" fill="url(#bg-ora)" />
          <rect width="100" height="100" rx="16" fill="url(#glow-ora)" />
          {/* Rosário – corrente circular */}
          {/* Miçangas do rosário (círculo de contas) */}
          {[0,1,2,3,4,5,6,7,8,9].map((i) => {
            const angle = (i * 36 - 90) * Math.PI / 180;
            const cx = 50 + 32 * Math.cos(angle);
            const cy = 50 + 32 * Math.sin(angle);
            return <circle key={i} cx={cx} cy={cy} r="4.5" fill="white" fillOpacity={i % 5 === 0 ? 0.95 : 0.65} />;
          })}
          {/* Linha da corrente */}
          <circle cx="50" cy="50" r="32" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" strokeDasharray="4 3" />
          {/* Cruz central do rosário (parte de baixo) */}
          <line x1="50" y1="82" x2="50" y2="96" stroke="white" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
          {/* Cruz pendente */}
          <rect x="47" y="86" width="6" height="14" rx="2" fill="white" fillOpacity="0.95" />
          <rect x="43" y="90" width="14" height="5" rx="2" fill="white" fillOpacity="0.95" />
          {/* Medalha central */}
          <circle cx="50" cy="50" r="13" fill="white" fillOpacity="0.18" />
          <circle cx="50" cy="50" r="13" fill="none" stroke="#f0abfc" strokeWidth="2" strokeOpacity="0.8" />
          {/* Símbolo mariano no centro (M estilizado) */}
          <path d="M42 57 L42 43 L50 52 L58 43 L58 57" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fillOpacity="0.95" />
          {/* Estrelinhas */}
          <circle cx="18" cy="18" r="2.5" fill="#f0abfc" fillOpacity="0.6" />
          <circle cx="82" cy="18" r="2" fill="#f0abfc" fillOpacity="0.5" />
          <circle cx="14" cy="70" r="2" fill="#f0abfc" fillOpacity="0.4" />
          <circle cx="86" cy="70" r="2" fill="#f0abfc" fillOpacity="0.4" />
        </svg>
      );

    case "liturgia":
      return (
        <svg viewBox="0 0 100 100" className={className || base} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg-lit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#92400e" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <radialGradient id="sunlit" cx="50%" cy="0%" r="80%">
              <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-lit)" />
          {/* Luz solar nascente ao fundo */}
          <rect width="100" height="100" fill="url(#sunlit)" />
          {/* Semicírculo do sol nascendo */}
          <path d="M10 58 A40 40 0 0 1 90 58" fill="#fef3c7" fillOpacity="0.25" />
          <path d="M10 58 A40 40 0 0 1 90 58" fill="none" stroke="#fef3c7" strokeOpacity="0.5" strokeWidth="2" />
          {/* Raios do sol */}
          <line x1="50" y1="14" x2="50" y2="6"  stroke="white" strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round" />
          <line x1="68" y1="20" x2="73" y2="13" stroke="white" strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="32" y1="20" x2="27" y2="13" stroke="white" strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="80" y1="36" x2="87" y2="32" stroke="white" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="36" x2="13" y2="32" stroke="white" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
          <line x1="86" y1="56" x2="94" y2="56" stroke="white" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
          <line x1="14" y1="56" x2="6"  y2="56" stroke="white" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
          {/* Livro aberto */}
          <path d="M14 62 L14 88 Q50 80 50 84 L50 62 Q50 56 14 62Z" fill="white" fillOpacity="0.95" />
          <path d="M86 62 L86 88 Q50 80 50 84 L50 62 Q50 56 86 62Z" fill="white" fillOpacity="0.8" />
          {/* Lombada */}
          <path d="M50 56 Q50 60 50 84" stroke="#92400e" strokeOpacity="0.3" strokeWidth="2" fill="none" />
          {/* Linhas de texto - página esquerda */}
          <line x1="20" y1="72" x2="44" y2="70" stroke="#92400e" strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="20" y1="77" x2="44" y2="75" stroke="#92400e" strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="20" y1="82" x2="38" y2="80" stroke="#92400e" strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round" />
          {/* Cruz decorativa - página direita */}
          <rect x="63" y="66" width="4" height="14" rx="1.5" fill="#92400e" fillOpacity="0.3" />
          <rect x="58" y="71" width="14" height="4" rx="1.5" fill="#92400e" fillOpacity="0.3" />
          {/* Marcador de página dourado */}
          <rect x="76" y="62" width="4" height="14" rx="2" fill="#fbbf24" fillOpacity="0.8" />
        </svg>
      );

    case "jogos":
      return (
        <svg viewBox="0 0 100 100" className={className || base} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg-jog" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#92400e" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="trophy-jog" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="16" fill="url(#bg-jog)" />
          {/* Troféu – corpo */}
          <path d="M33 18 L33 52 Q33 66 50 66 Q67 66 67 52 L67 18 Z"
            fill="url(#trophy-jog)" fillOpacity="0.95" />
          {/* Alças do troféu */}
          <path d="M33 24 Q16 24 16 38 Q16 52 33 52" fill="none" stroke="url(#trophy-jog)" strokeWidth="6" strokeLinecap="round" />
          <path d="M67 24 Q84 24 84 38 Q84 52 67 52" fill="none" stroke="url(#trophy-jog)" strokeWidth="6" strokeLinecap="round" />
          {/* Base do troféu */}
          <rect x="38" y="66" width="24" height="6" rx="2" fill="#fbbf24" fillOpacity="0.85" />
          <rect x="30" y="72" width="40" height="8" rx="4" fill="#fbbf24" fillOpacity="0.9" />
          {/* Cruz dentro do troféu */}
          <rect x="47.5" y="26" width="5" height="22" rx="2" fill="#92400e" fillOpacity="0.5" />
          <rect x="40" y="33" width="20" height="5" rx="2" fill="#92400e" fillOpacity="0.5" />
          {/* Brilho no topo do troféu */}
          <ellipse cx="50" cy="21" rx="10" ry="4" fill="white" fillOpacity="0.3" />
          {/* Estrelas decorativas */}
          <polygon points="14,14 15.5,19 21,19 16.5,22 18,27 14,24 10,27 11.5,22 7,19 12.5,19"
            fill="white" fillOpacity="0.7" />
          <polygon points="86,14 87,17.5 91,17.5 88,20 89,23.5 86,21.5 83,23.5 84,20 81,17.5 85,17.5"
            fill="white" fillOpacity="0.6" />
          <circle cx="14" cy="80" r="3" fill="white" fillOpacity="0.3" />
          <circle cx="86" cy="80" r="3" fill="white" fillOpacity="0.3" />
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

    case "painel-ivc":
      return (
        <svg viewBox="0 0 100 100" className={className || base} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg-ivc" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#065f46" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <radialGradient id="glow-ivc" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#065f46" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" rx="16" fill="url(#bg-ivc)" />
          <rect width="100" height="100" rx="16" fill="url(#glow-ivc)" />
          {/* Escudo de vigilância / painel */}
          <path d="M50 12 L75 22 L75 48 Q75 68 50 78 Q25 68 25 48 L25 22 Z"
            fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.5" strokeWidth="2" />
          {/* Gráfico de barras interno */}
          <rect x="34" y="56" width="7" height="14" rx="2" fill="white" fillOpacity="0.9" />
          <rect x="46" y="46" width="7" height="24" rx="2" fill="white" fillOpacity="0.9" />
          <rect x="58" y="38" width="7" height="32" rx="2" fill="white" fillOpacity="0.9" />
          {/* Linha de tendência ascendente */}
          <polyline points="37,55 50,45 62,36" fill="none" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Bolinha de destaque na tendência */}
          <circle cx="62" cy="36" r="3.5" fill="#fbbf24" fillOpacity="0.95" />
          {/* Cruz pequena no topo do escudo */}
          <rect x="47.5" y="18" width="5" height="14" rx="2" fill="white" fillOpacity="0.95" />
          <rect x="41" y="23" width="18" height="5" rx="2" fill="white" fillOpacity="0.95" />
          {/* Olho de vigilância abaixo */}
          <ellipse cx="50" cy="86" rx="12" ry="7" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" />
          <circle cx="50" cy="86" r="4" fill="white" fillOpacity="0.9" />
          <circle cx="51.5" cy="84.5" r="1.5" fill="#065f46" fillOpacity="0.7" />
        </svg>
      );

    case "biblioteca":
      return (
        <svg viewBox="0 0 100 100" className={className || base} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg-bib2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#065f46" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <radialGradient id="glow-bib2" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#065f46" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" rx="16" fill="url(#bg-bib2)" />
          <rect width="100" height="100" rx="16" fill="url(#glow-bib2)" />
          {/* Prateleira */}
          <rect x="10" y="74" width="80" height="6" rx="3" fill="white" fillOpacity="0.4" />
          {/* Livro 1 (fino, azulado) */}
          <rect x="15" y="34" width="10" height="40" rx="3" fill="white" fillOpacity="0.9" />
          <rect x="15" y="34" width="4" height="40" rx="2" fill="white" fillOpacity="0.4" />
          {/* Livro 2 (largo, creme) */}
          <rect x="27" y="28" width="15" height="46" rx="3" fill="#fef3c7" fillOpacity="0.9" />
          <rect x="27" y="28" width="5" height="46" rx="2" fill="#fbbf24" fillOpacity="0.5" />
          {/* Cruz no livro 2 */}
          <rect x="36" y="38" width="3" height="14" rx="1" fill="#065f46" fillOpacity="0.5" />
          <rect x="32" y="43" width="11" height="3" rx="1" fill="#065f46" fillOpacity="0.5" />
          {/* Livro 3 (médio, branco) */}
          <rect x="44" y="38" width="12" height="36" rx="3" fill="white" fillOpacity="0.85" />
          <rect x="44" y="38" width="4" height="36" rx="2" fill="white" fillOpacity="0.3" />
          {/* Livro 4 (fino, inclinado) */}
          <rect x="58" y="40" width="9" height="34" rx="3" fill="white" fillOpacity="0.75" transform="rotate(-5 62 57)" />
          {/* Livro 5 (largo, à direita) */}
          <rect x="68" y="30" width="14" height="44" rx="3" fill="#a7f3d0" fillOpacity="0.85" />
          <rect x="68" y="30" width="5" height="44" rx="2" fill="white" fillOpacity="0.3" />
          {/* Estrelinhas decorativas */}
          <circle cx="18" cy="20" r="2.5" fill="white" fillOpacity="0.5" />
          <circle cx="82" cy="18" r="2" fill="white" fillOpacity="0.4" />
          <circle cx="50" cy="14" r="3" fill="#fbbf24" fillOpacity="0.7" />
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
