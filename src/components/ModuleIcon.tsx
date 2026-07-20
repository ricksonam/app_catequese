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
              <stop offset="0%" stopColor="#064e3b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="flame-enc" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#fef3c7" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-enc)" />
          {/* Brilho central suave */}
          <circle cx="50" cy="50" r="28" fill="white" fillOpacity="0.07" />
          {/* Pomba central */}
          <ellipse cx="50" cy="46" rx="11" ry="7" fill="white" fillOpacity="0.95" />
          <path d="M57 43 L68 36 L60 46" fill="white" fillOpacity="0.95" />
          <circle cx="53" cy="42" r="2.5" fill="white" />
          <circle cx="54" cy="41.5" r="1" fill="#064e3b" />
          {/* Asa inferior */}
          <path d="M43 48 Q36 56 44 54" fill="white" fillOpacity="0.7" />
          {/* 5 velas ao redor */}
          {/* vela topo */}
          <rect x="47" y="14" width="6" height="14" rx="3" fill="white" fillOpacity="0.9" />
          <ellipse cx="50" cy="13" rx="3" ry="4" fill="url(#flame-enc)" fillOpacity="0.95" />
          <rect x="49" y="28" width="2" height="4" rx="1" fill="white" fillOpacity="0.5" />
          {/* vela dir-cima */}
          <rect x="72" y="25" width="6" height="14" rx="3" fill="white" fillOpacity="0.9" transform="rotate(30 75 32)" />
          <ellipse cx="75" cy="23" rx="3" ry="4" fill="url(#flame-enc)" fillOpacity="0.95" transform="rotate(30 75 23)" />
          {/* vela dir-baixo */}
          <rect x="72" y="60" width="6" height="14" rx="3" fill="white" fillOpacity="0.9" transform="rotate(-30 75 67)" />
          <ellipse cx="75" cy="58" rx="3" ry="4" fill="url(#flame-enc)" fillOpacity="0.95" transform="rotate(-30 75 58)" />
          {/* vela esq-cima */}
          <rect x="22" y="25" width="6" height="14" rx="3" fill="white" fillOpacity="0.9" transform="rotate(-30 25 32)" />
          <ellipse cx="25" cy="23" rx="3" ry="4" fill="url(#flame-enc)" fillOpacity="0.95" transform="rotate(-30 25 23)" />
          {/* vela esq-baixo */}
          <rect x="22" y="60" width="6" height="14" rx="3" fill="white" fillOpacity="0.9" transform="rotate(30 25 67)" />
          <ellipse cx="25" cy="58" rx="3" ry="4" fill="url(#flame-enc)" fillOpacity="0.95" transform="rotate(30 25 58)" />
          {/* vela baixo */}
          <rect x="47" y="72" width="6" height="14" rx="3" fill="white" fillOpacity="0.9" />
          <ellipse cx="50" cy="71" rx="3" ry="4" fill="url(#flame-enc)" fillOpacity="0.95" />
          {/* Ramo de oliveira no bico da pomba */}
          <path d="M60 46 Q64 50 62 54" stroke="#6ee7b7" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <ellipse cx="63" cy="52" rx="3" ry="2" fill="#6ee7b7" fillOpacity="0.9" transform="rotate(-30 63 52)" />
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
              <stop offset="0%" stopColor="#4c1d95" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
            <linearGradient id="gold-tri" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-tri)" />
          {/* Caminho dourado central */}
          <path d="M50 92 L50 18" stroke="url(#gold-tri)" strokeWidth="4" strokeLinecap="round" strokeDasharray="3 4" />
          {/* === BATISMO (base) === */}
          <circle cx="50" cy="82" r="10" fill="white" fillOpacity="0.2" />
          <circle cx="50" cy="82" r="10" fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="1.5" />
          {/* gota de água */}
          <path d="M50 75 Q46 80 46 83 Q46 87 50 87 Q54 87 54 83 Q54 80 50 75Z" fill="white" fillOpacity="0.9" />
          {/* === EUCARISTIA (meio) === */}
          <circle cx="50" cy="50" r="11" fill="white" fillOpacity="0.2" />
          <circle cx="50" cy="50" r="11" fill="none" stroke="#fbbf24" strokeOpacity="0.8" strokeWidth="1.5" />
          {/* hóstia */}
          <circle cx="50" cy="50" r="7" fill="white" fillOpacity="0.9" />
          <rect x="47.5" y="45" width="5" height="10" rx="1" fill="#4c1d95" fillOpacity="0.4" />
          <rect x="45" y="48" width="10" height="4" rx="1" fill="#4c1d95" fillOpacity="0.4" />
          {/* === CRISMA (topo) === */}
          <circle cx="50" cy="22" r="10" fill="white" fillOpacity="0.2" />
          <circle cx="50" cy="22" r="10" fill="none" stroke="#fb923c" strokeOpacity="0.8" strokeWidth="1.5" />
          {/* chama */}
          <path d="M50 14 Q46 18 47 22 Q48 26 50 27 Q52 26 53 22 Q54 18 50 14Z" fill="#fbbf24" fillOpacity="0.95" />
          <path d="M50 17 Q48 20 48 22 Q49 25 50 26 Q51 25 52 22 Q52 20 50 17Z" fill="white" fillOpacity="0.6" />
          {/* Rótulos laterais — pontos decorativos */}
          <circle cx="30" cy="82" r="3" fill="#7dd3fc" fillOpacity="0.7" />
          <circle cx="30" cy="50" r="3" fill="#fbbf24" fillOpacity="0.7" />
          <circle cx="30" cy="22" r="3" fill="#fb923c" fillOpacity="0.7" />
          <circle cx="70" cy="82" r="3" fill="#7dd3fc" fillOpacity="0.7" />
          <circle cx="70" cy="50" r="3" fill="#fbbf24" fillOpacity="0.7" />
          <circle cx="70" cy="22" r="3" fill="#fb923c" fillOpacity="0.7" />
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
            <linearGradient id="bg-ora" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <radialGradient id="divlight" cx="50%" cy="30%" r="50%">
              <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-ora)" />
          {/* Luz divina irradiando do alto */}
          <ellipse cx="50" cy="18" rx="30" ry="20" fill="url(#divlight)" />
          {/* Raios de luz */}
          <line x1="50" y1="8" x2="20" y2="55" stroke="#fde68a" strokeOpacity="0.25" strokeWidth="6" strokeLinecap="round" />
          <line x1="50" y1="8" x2="50" y2="60" stroke="#fde68a" strokeOpacity="0.3" strokeWidth="6" strokeLinecap="round" />
          <line x1="50" y1="8" x2="80" y2="55" stroke="#fde68a" strokeOpacity="0.25" strokeWidth="6" strokeLinecap="round" />
          <line x1="50" y1="8" x2="10" y2="40" stroke="#fde68a" strokeOpacity="0.15" strokeWidth="4" strokeLinecap="round" />
          <line x1="50" y1="8" x2="90" y2="40" stroke="#fde68a" strokeOpacity="0.15" strokeWidth="4" strokeLinecap="round" />
          {/* Símbolo IHS / pomba no centro da luz */}
          <circle cx="50" cy="22" r="10" fill="#fbbf24" fillOpacity="0.9" />
          <circle cx="50" cy="22" r="7" fill="white" fillOpacity="0.95" />
          {/* Cruz na bolinha */}
          <rect x="48.5" y="17" width="3" height="10" rx="1" fill="#4f46e5" fillOpacity="0.7" />
          <rect x="45" y="20.5" width="10" height="3" rx="1" fill="#4f46e5" fillOpacity="0.7" />
          {/* Mão esquerda aberta, voltada para cima */}
          <path d="M18 88 Q18 68 26 62 Q30 60 33 62 Q36 60 38 63 Q40 60 42 63 Q44 60 46 64 L46 75 Q44 76 42 75 Q40 76 38 75 Q35 76 33 75 Q30 76 28 78 Q26 82 26 88 Z"
            fill="white" fillOpacity="0.9" />
          {/* Mão direita aberta, voltada para cima */}
          <path d="M82 88 Q82 68 74 62 Q70 60 67 62 Q64 60 62 63 Q60 60 58 63 Q56 60 54 64 L54 75 Q56 76 58 75 Q60 76 62 75 Q65 76 67 75 Q70 76 72 78 Q74 82 74 88 Z"
            fill="white" fillOpacity="0.85" />
          {/* Brilhinho nas palmas */}
          <circle cx="36" cy="72" r="2.5" fill="#fbbf24" fillOpacity="0.6" />
          <circle cx="64" cy="72" r="2.5" fill="#fbbf24" fillOpacity="0.6" />
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
