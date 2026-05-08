import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LogIn, UserPlus, Heart, Users, Calendar,
  Book, Image as ImageIcon, Dices, MessageSquare,
  Share2, Mail, Smartphone, Gift, ListChecks,
  CalendarDays, Sparkles, Church, CheckCircle2
} from "lucide-react";
import { getAppUrl } from "@/lib/utils";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
  { title: "Encontros de Catequese", desc: "Planeje, registre presença, avalie e apresente seus encontros.", icon: CalendarDays, color: "#3b82f6" },
  { title: "Aniversariantes", desc: "Alertas de nascimento e batismo dos seus catequizandos.", icon: Gift, color: "#ec4899" },
  { title: "Atividades e Eventos", desc: "Cadastre celebrações, retiros e eventos no calendário da turma.", icon: ListChecks, color: "#d97706" },
  { title: "Módulo de Jogos", desc: "Biblioteca interativa de jogos educativos para a catequese.", icon: Dices, color: "#8b5cf6" },
  { title: "Mural de Fotos", desc: "Eternize as memórias da turma com um mural de lembranças.", icon: ImageIcon, color: "#10b981" },
  { title: "Trabalho em Equipe", desc: "Compartilhe a turma e co-gerencie com outros catequistas.", icon: Users, color: "#0ea5e9" },
  { title: "Catequese em Família", desc: "Crie enquetes e missões para manter as famílias engajadas.", icon: MessageSquare, color: "#a855f7" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [apoieOpen, setApoieOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  };

  const handleShare = async () => {
    const url = getAppUrl();
    if (navigator.share) {
      try { await navigator.share({ title: "iCatequese", text: "Gestão para catequistas!", url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  };

  const handleWhatsApp = () =>
    window.open("https://wa.me/5592993371259?text=Olá! Vim pelo site do iCatequese.", "_blank");

  return (
    <div className="min-h-screen bg-[#FDF8F5] text-stone-900 overflow-x-hidden font-sans selection:bg-[#D4AF37]/30">

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
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4 bg-blue-600/80 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center overflow-hidden">
            <img src="/app-logo.png" alt="Logo" className="w-7 h-7 object-contain brightness-0 invert" />
          </div>
          <span className="text-base font-black tracking-tight text-white">iCatequese</span>
        </div>
        <button
          onClick={() => setApoieOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/90 hover:bg-rose-500 text-white text-[11px] font-black uppercase tracking-wide border border-rose-400/30 transition-all active:scale-95 shadow-sm"
        >
          <Heart className="h-3 w-3 fill-white" /> Apoie
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-5 pt-12 pb-10 text-center">

        {/* Linha ornamental topo */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex items-center gap-3 mb-6">
          <div className="h-px w-10 bg-gradient-to-r from-transparent to-stone-900/20" />
          <span className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-900">Gestão para Catequistas</span>
          <div className="h-px w-10 bg-gradient-to-l from-transparent to-stone-900/20" />
        </motion.div>

        {/* Logo flutuante */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="relative mb-6"
        >
          {/* Halo dourado */}
          <div className="absolute inset-0 rounded-full bg-[#D4AF37]/15 blur-2xl scale-150" />
          <div className="relative w-28 h-28 rounded-[32px] bg-white border border-[#D4AF37]/30 shadow-xl flex items-center justify-center p-3"
            style={{ animation: "liturgicalFloat 5s ease-in-out infinite" }}>
            <img src="/app-logo.png" alt="iCatequese" className="w-full h-full object-contain drop-shadow-md" />
          </div>
        </motion.div>

        {/* Título */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-5xl sm:text-6xl font-black tracking-tighter mb-1 bg-gradient-to-r from-primary via-blue-400 to-primary bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent drop-shadow-sm"
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
          "Semear a Palavra, cultivar o Reino. Uma plataforma para catequistas organizarem a fé."
        </motion.p>

        {/* ── BOTÕES PRINCIPAIS ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 w-full max-w-xs"
        >
          {/* Cadastrar — destaque dourado */}
          <button
            onClick={() => navigate("/auth?view=signup")}
            className="group relative flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider overflow-hidden transition-all active:scale-95 hover:scale-[1.03]"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #B8860B, #D4AF37)",
              backgroundSize: "200% 100%",
              boxShadow: "0 8px 32px rgba(212,175,55,0.3), 0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors" />
            <UserPlus className="h-4 w-4 text-white shrink-0 relative z-10" />
            <span className="text-white relative z-10">Cadastrar</span>
          </button>

          {/* Entrar — bordado */}
          <button
            onClick={() => navigate("/auth?view=login")}
            className="group flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider bg-white border-2 border-[#D4AF37]/40 text-stone-900 hover:bg-[#D4AF37]/5 hover:border-[#D4AF37]/80 transition-all active:scale-95 hover:scale-[1.03] shadow-sm"
          >
            <LogIn className="h-4 w-4 shrink-0" />
            Entrar
          </button>
        </motion.div>


      </section>

      {/* ── SEÇÃO DE FUNCIONALIDADES ── */}
      <section className="relative z-10 px-5 pb-20 max-w-lg mx-auto">
        {/* Título seção */}
        <div className="text-center mb-8">
          <OrnamentalDivider />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]/90 mt-3">Tudo em um só lugar</p>
        </div>

        <div className="space-y-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-4 p-4 rounded-2xl border border-stone-200/60 bg-white hover:border-blue-500/40 hover:shadow-md transition-all group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm bg-white"
                style={{ border: `1px solid ${f.color}40` }}
              >
                <f.icon className="h-5 w-5" style={{ color: f.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-stone-800 leading-snug">{f.title}</p>
                <p className="text-xs text-stone-500 leading-relaxed mt-0.5">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Instalar PWA */}
        {installPrompt && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleInstall}
            className="w-full mt-6 flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 font-black text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all active:scale-95 shadow-sm"
          >
            <Smartphone className="h-4 w-4" /> Instalar App no Celular
          </motion.button>
        )}

        {/* CTA final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 p-6 rounded-3xl text-center relative overflow-hidden bg-white border border-[#D4AF37]/30 shadow-xl"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />
          <CrossOrnament className="w-10 h-10 text-[#D4AF37]/40 mx-auto mb-3 relative z-10" />
          <p className="text-base font-black text-stone-900 mb-1 relative z-10">Comece agora!</p>
          <p className="text-xs text-stone-500 mb-5 relative z-10">Junte-se a catequistas de todo o Brasil</p>
          <button
            onClick={() => navigate("/auth?view=signup")}
            className="relative z-10 px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider text-white transition-all active:scale-95 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #B8860B)",
              boxShadow: "0 8px 24px rgba(212,175,55,0.4)"
            }}
          >
            Criar conta grátis
          </button>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-stone-200/80 py-10 px-5 bg-white/40">
        <div className="max-w-lg mx-auto">
          <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-stone-900/5 border border-stone-900/10 flex items-center justify-center overflow-hidden">
                <img src="/app-logo.png" alt="Logo" className="w-7 h-7 object-contain drop-shadow-sm" />
              </div>
              <span className="text-base font-black text-[#D4AF37] drop-shadow-sm">iCatequese</span>
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <button onClick={handleShare} className="text-[10px] font-black uppercase tracking-widest text-stone-500 hover:text-[#D4AF37] flex items-center gap-1 transition-colors">
                <Share2 className="h-3 w-3" /> Compartilhar
              </button>
            </div>
          </div>

          {/* Card idealizador */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center gap-4 mb-8">
            <Avatar className="h-11 w-11 border-2 border-[#D4AF37]/30 shrink-0">
              <AvatarImage src="/rickson-avatar.png" alt="Rickson Amazonas" />
              <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37] font-black text-xs">RA</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-stone-900">Rickson Amazonas</p>
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Catequista · Idealizador do iCatequese</p>
              <a href="mailto:ricksonam@hotmail.com" className="text-[10px] text-[#D4AF37]/90 hover:text-[#D4AF37] transition-colors flex items-center gap-1 mt-0.5">
                <Mail className="h-3 w-3" /> ricksonam@hotmail.com
              </a>
            </div>
            <button onClick={handleWhatsApp} className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 font-black text-[9px] uppercase tracking-wide hover:bg-emerald-100 transition-all shrink-0">
              Suporte
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

      {/* ── DIALOG APOIE ── */}
      <Dialog open={apoieOpen} onOpenChange={setApoieOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-stone-200 p-0 overflow-hidden rounded-[32px] shadow-2xl">
          <div className="p-8 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #7c2d12, #9f1239)" }}>
            <div className="absolute inset-0 opacity-10">
              <CrossOrnament className="absolute top-2 right-2 w-24 h-24 text-white" />
            </div>
            <Heart className="w-14 h-14 fill-white text-white mx-auto mb-3 animate-heartbeat relative z-10 drop-shadow-md" />
            <h2 className="text-xl font-black relative z-10 text-white drop-shadow-md">Apoie o iCatequese!</h2>
          </div>
          <div className="p-6 text-center space-y-4">
            <p className="text-sm text-stone-600 leading-relaxed font-medium">
              Projeto independente mantido com recursos próprios. Sua doação ajuda a manter tudo <strong className="text-stone-900 font-black">gratuito para todos</strong>.
            </p>
            <div className="p-4 rounded-2xl bg-stone-50 border border-[#D4AF37]/30 shadow-inner">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]/90 mb-2">Chave PIX</p>
              <p className="font-black text-lg text-stone-900">ricksonam@hotmail.com</p>
              <button
                onClick={() => { navigator.clipboard.writeText("ricksonam@hotmail.com"); toast.success("Chave PIX copiada!"); }}
                className="mt-4 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all active:scale-95 shadow-md hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, #D4AF37, #B8860B)" }}
              >
                Copiar Chave
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
