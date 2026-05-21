import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LogIn, UserPlus, Users, Calendar,
  Book, Image as ImageIcon, Dices, MessageSquare,
  Mail, Smartphone, Gift, ListChecks,
  CalendarDays, Sparkles, Church, CheckCircle2, Lock
} from "lucide-react";
import { getAppUrl } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PWAInstallChip } from "@/components/Onboarding/PWAInstallChip";

/* ─── Ornamento SVG de cruz ─── */
const CrossOrnament = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 60 60" className={className} fill="currentColor">
    <rect x="26" y="4" width="8" height="52" rx="2" />
    <rect x="4" y="20" width="52" height="8" rx="2" />
  </svg>
);

/* ─── Separador ornamental ─── */
const OrnamentalDivider = () => (
  <div className="flex items-center gap-3 justify-center my-2">
    <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/60" />
    <CrossOrnament className="w-4 h-4 text-[#D4AF37]/70" />
    <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/60" />
  </div>
);

const FEATURES = [
  { title: "Encontros de Catequese", desc: "Planeje, registre presença, avalie e apresente seus encontros.", img: "/card_encontros.jpg", color: "#3b82f6" },
  { title: "Aniversariantes", desc: "Alertas de nascimento e batismo dos seus catequizandos.", img: "/acesso_agenda.jpg", color: "#ec4899" },
  { title: "Atividades e Eventos", desc: "Cadastre celebrações, retiros e eventos no calendário da turma.", img: "/acesso_atividades.jpg", color: "#d97706" },
  { title: "Módulo de Jogos", desc: "Biblioteca interativa de jogos educativos para a catequese.", img: "/acesso_jogos.jpg", color: "#8b5cf6" },
  { title: "Mural de Fotos", desc: "Eternize as memórias da turma com um mural de lembranças.", img: "/mural_de_fotos.png", color: "#10b981" },
  { title: "Trabalho em Equipe", desc: "Compartilhe a turma e co-gerencie com outros catequistas.", img: "/acesso_cadastros.jpg", color: "#0ea5e9" },
  { title: "Catequese em Família", desc: "Crie enquetes e missões para manter as famílias engajadas.", img: "/acesso_conecta.jpg", color: "#a855f7" },
];

export default function LandingPage() {
  const navigate = useNavigate();

  const handleWhatsApp = () =>
    window.open("https://wa.me/5592993371259?text=Olá! Vim pelo site do iCatequese.", "_blank");

  return (
    <div className="min-h-screen bg-[#FDF8F5] text-stone-900 overflow-x-hidden font-sans selection:bg-[#D4AF37]/30">
      <PWAInstallChip />
      {/* ── BG ornamental ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Gradiente radial central */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(212,175,55,0.1),transparent)]" />
        {/* Luz central dourada suave */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[120px]" />
        {/* Padrão de cruzes decorativas */}
        {[
          { top: "8%", left: "6%", s: 0.7, o: 0.15 },
          { top: "12%", right: "8%", s: 0.5, o: 0.1 },
          { top: "55%", left: "3%", s: 0.6, o: 0.12 },
          { top: "60%", right: "5%", s: 0.8, o: 0.12 },
          { top: "85%", left: "12%", s: 0.4, o: 0.1 },
          { top: "80%", right: "10%", s: 0.5, o: 0.1 },
        ].map((p, i) => (
          <CrossOrnament
            key={i}
            className="absolute text-[#D4AF37] w-16 h-16"
            style={{ top: p.top, left: (p as any).left, right: (p as any).right, opacity: p.o, transform: `scale(${p.s})` }}
          />
        ))}
      </div>

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4 bg-blue-600/90 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-sm">
            <img src="/app-logo.png" alt="Logo" className="w-7 h-7 object-contain" />
          </div>
          <span className="text-lg font-black tracking-tighter text-white">iCatequese</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/admin/login")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/90 hover:bg-stone-900 text-white text-[11px] font-black uppercase tracking-wide border border-stone-700/50 transition-all active:scale-95 shadow-sm"
          >
            <Lock className="h-3 w-3" /> Acesso Restrito
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 flex flex-col items-center justify-center px-5 pt-28 pb-10 text-center">

        {/* Linha ornamental topo */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex items-center gap-3 mb-6 bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent py-2 px-8 rounded-full border border-[#D4AF37]/20 shadow-sm">
          <CrossOrnament className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-lg sm:text-xl font-black uppercase tracking-[0.1em] text-[#FFD700] drop-shadow-lg text-center leading-relaxed" style={{ textShadow: "0 2px 10px rgba(255, 215, 0, 0.4)" }}>
            Gestão de Turmas de catequese<br className="sm:hidden" /> para Catequistas
          </span>
          <CrossOrnament className="w-4 h-4 text-[#D4AF37]" />
        </motion.div>

        {/* Logo flutuante */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="relative mb-6"
        >
          {/* Halo dourado */}
          <div className="absolute inset-0 rounded-full bg-[#D4AF37]/20 blur-3xl scale-150 animate-pulse" />
          <div className="relative w-16 h-16 rounded-full bg-white shadow-[0_0_20px_rgba(212,175,55,0.15)] flex items-center justify-center p-2"
            style={{ animation: "liturgicalFloat 5s ease-in-out infinite" }}>
            <img src="/app-logo.png" alt="iCatequese" className="w-full h-full object-contain" />
          </div>
        </motion.div>

        {/* Título */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl sm:text-3xl font-black tracking-tighter mb-1 bg-gradient-to-r from-primary via-blue-400 to-primary bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent drop-shadow-sm"
        >
          iCatequese
        </motion.h1>

        <OrnamentalDivider />

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-stone-600 font-medium max-w-xs leading-relaxed mt-2 mb-8 italic"
        >
          "Gestão inteligente para a catequese, fortalecendo a fé e organizando a missão"
        </motion.p>

        {/* ── BOTÕES PRINCIPAIS ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-6 w-full max-w-xs"
        >
          {/* Entrar — bordado */}
          <button
            onClick={() => navigate("/auth?view=login")}
            className="group w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider bg-white border-2 border-blue-600/40 text-blue-600 hover:bg-blue-50 hover:border-blue-600 transition-all active:scale-95 hover:scale-[1.03] shadow-md"
          >
            <LogIn className="h-4 w-4 shrink-0" />
            Entrar
          </button>

          {/* CTA Relocado do final da página — Versão Premium */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="w-full p-8 rounded-[40px] text-center relative overflow-hidden bg-white border border-stone-200/60 shadow-[0_20px_50px_rgba(0,0,0,0.08)] group hover:border-[#D4AF37]/30 transition-all"
          >
            {/* Efeitos de Fundo Premium */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#D4AF37]/5 rounded-full -ml-20 -mb-20 blur-3xl pointer-events-none" />
            
            <p className="text-xl font-liturgical font-black text-stone-900 mb-2 relative z-10">Comece agora!</p>
            <p className="text-[12px] text-stone-600 mb-6 relative z-10 font-bold leading-relaxed max-w-[240px] mx-auto">
              Organize sua Catequese com a plataforma completa <span className="text-primary">iCatequese</span>.
            </p>
            <button
              onClick={() => navigate("/auth?view=signup")}
              className="relative z-10 w-full px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all active:scale-95 hover:scale-[1.02] shadow-xl overflow-hidden group-hover:shadow-primary/20"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              }}
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              Criar conta gratuita
            </button>
          </motion.div>
        </motion.div>


      </section>

      {/* ── SEÇÃO DE FUNCIONALIDADES ── */}
      <section className="relative z-10 px-5 pb-20 pt-2 max-w-lg mx-auto -mt-4">
        {/* Título seção */}
        <div className="text-center mb-8">
          <OrnamentalDivider />
          <p className="text-[12px] font-black uppercase tracking-[0.35em] mt-2 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#B8860B] bg-clip-text text-transparent drop-shadow-sm">
            Tudo em um só lugar
          </p>
        </div>

        <div className="space-y-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-4 p-4 rounded-[28px] border border-blue-500/10 bg-white hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md overflow-hidden bg-zinc-100 border border-black/5">
                <img src={f.img} alt={f.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-liturgical font-black text-stone-900 leading-snug group-hover:text-blue-600 transition-colors">{f.title}</p>
                <p className="text-xs text-stone-500 leading-relaxed mt-0.5">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>




      </section>

      {/* ── PLANOS E PREÇOS ── */}
      <section className="relative z-10 px-5 pb-20 pt-4 max-w-lg mx-auto">
        <div className="text-center mb-10">
          <OrnamentalDivider />
          <p className="text-[12px] font-black uppercase tracking-[0.35em] mt-2 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#B8860B] bg-clip-text text-transparent drop-shadow-sm">
            Nossos Planos
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {/* PLANO GRATUITO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-[40px] bg-white border-2 border-stone-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative"
          >
            <h3 className="text-2xl font-black text-stone-900 mb-2 font-liturgical">Plano Gratuito</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-black text-stone-900">R$ 0</span>
              <span className="text-sm text-stone-500 font-bold uppercase tracking-widest">/ano</span>
            </div>
            
            <p className="text-sm text-stone-500 font-medium mb-6 leading-relaxed">
              Ideal para quem está começando e quer organizar sua turma com facilidade.
            </p>

            <ul className="space-y-4 mb-8">
              {[
                "Gestão gratuita de 1 turma de catequese",
                "Mural de fotos",
                "Biblioteca de encontros",
                "Agenda de eventos",
                "Bíblia online",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-stone-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-stone-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate("/auth?view=signup")}
              className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors active:scale-95"
            >
              Começar Grátis
            </button>
          </motion.div>

          {/* PLANO PREMIUM */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-8 rounded-[40px] bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-[0_20px_50px_rgba(37,99,235,0.25)] relative overflow-hidden group border border-blue-400/30"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
            <div className="absolute top-4 right-6 bg-[#FFD700] text-stone-900 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Recomendado
            </div>

            <h3 className="text-2xl font-black text-white mb-2 font-liturgical">Plano Premium</h3>
            <div className="flex items-baseline gap-1 mb-6 relative z-10">
              <span className="text-4xl font-black text-white drop-shadow-md">R$ 14,90</span>
              <span className="text-sm text-blue-200 font-bold uppercase tracking-widest">/ano</span>
            </div>

            <p className="text-sm text-blue-100 font-medium mb-6 leading-relaxed relative z-10">
              Tenha acesso a todas as ferramentas avançadas para a melhor experiência.
            </p>

            <ul className="space-y-4 mb-8 relative z-10">
              {[
                "Acesso a todas as ferramentas e módulos",
                "Gestão de mais de 1 turma de catequese",
                "Turmas e catequizandos ilimitados",
                "Suporte técnico prioritário",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-white font-medium">
                  <CheckCircle2 className="w-5 h-5 text-[#FFD700] shrink-0 drop-shadow-sm" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate("/auth?view=signup")}
              className="relative z-10 w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-blue-900 bg-[#FFD700] hover:bg-[#FFC000] shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all active:scale-95"
            >
              Assinar Premium
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-stone-200/80 py-10 px-5 bg-white/40">
        <div className="max-w-lg mx-auto">
          {/* Card idealizador Premium */}
          <div className="p-6 rounded-[32px] bg-white border border-stone-200/60 shadow-xl flex flex-col sm:flex-row items-center gap-5 mb-8 relative overflow-hidden group hover:border-[#D4AF37]/30 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-[#D4AF37]/10 transition-colors" />
            
            <Avatar className="h-16 w-16 border-2 border-[#D4AF37]/30 shrink-0 shadow-md">
              <AvatarImage src="/Avatar.png" alt="Rickson Amazonas" />
              <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37] font-black text-sm">RA</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left relative z-10">
              <p className="text-lg font-liturgical font-black text-stone-900 leading-none">Rickson Amazonas</p>
              <p className="text-[11px] text-stone-500 font-bold uppercase tracking-widest mt-1.5">Catequista · Idealizador do iCatequese</p>
              <div className="flex flex-col sm:flex-row items-center gap-3 mt-3">
                <a href="mailto:ricksonam@hotmail.com" className="text-[11px] text-[#D4AF37] font-bold hover:underline flex items-center gap-1.5 transition-colors">
                  <Mail className="h-3 w-3" /> ricksonam@hotmail.com
                </a>
              </div>
            </div>
            <button 
              onClick={handleWhatsApp} 
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95 relative z-10"
            >
              Suporte Técnico
            </button>
          </div>

          <div className="text-center">
            <OrnamentalDivider />
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-3">
              © 2026 iCatequese · Ad maiorem Dei gloriam
            </p>
          </div>
        </div>
      </footer>


      {/* ── WHATSAPP FLUTUANTE ── */}
      <button
        onClick={handleWhatsApp}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full overflow-hidden shadow-2xl shadow-emerald-500/30 hover:scale-110 active:scale-95 transition-all"
      >
        <img src="/assets/whatsapp-icon.png" alt="WhatsApp" className="w-full h-full object-contain" />
      </button>

      <style>{`
        @keyframes liturgicalFloat {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes scrollDot {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(14px); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
