import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogIn, 
  UserPlus, 
  ChevronRight, 
  Share2, 
  Smartphone, 
  Heart, 
  Shield, 
  Users, 
  Calendar, 
  Book, 
  Image as ImageIcon, 
  Gamepad2, 
  LayoutDashboard, 
  MessageSquare,
  MessageCircle,
  Sparkles,
  ArrowDown,
  Instagram,
  Church,
  Mail,
  Dices,
  ListChecks,
  CalendarDays,
  Gift,
  CheckCircle2
} from "lucide-react";
import { getAppUrl } from "@/lib/utils";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function LandingPage() {
  const navigate = useNavigate();
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  const steps = [
    {
      title: "Apresentar o Encontro",
      description: "Planeje seus encontros com antecedência e registre a presença de todos facilmente.",
      icon: CalendarDays,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      delay: 0.1
    },
    {
      title: "Aniversariantes Inteligente",
      description: "Receba alertas lindos no painel sobre aniversários de nascimento e de batismo dos seus catequizandos.",
      icon: Gift,
      color: "text-rose-600",
      bgColor: "bg-rose-500/10",
      delay: 0.2
    },
    {
      title: "Atividades e Eventos",
      description: "Cadastre celebrações, retiros e atividades extras em um calendário exclusivo da turma.",
      icon: ListChecks,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      delay: 0.3
    },
    {
      title: "Módulo de Jogos",
      description: "Acesse uma biblioteca interativa de jogos educativos para deixar a catequese muito mais lúdica.",
      icon: Dices,
      color: "text-fuchsia-600",
      bgColor: "bg-fuchsia-500/10",
      delay: 0.4
    },
    {
      title: "Mural de Fotos",
      description: "Eternize as memórias da sua turma com um mural de lembranças, guardando as fotos dos momentos.",
      icon: ImageIcon,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      delay: 0.5
    },
    {
      title: "Trabalho em Equipe",
      description: "Compartilhe a sua turma usando um código. Outros catequistas podem gerir com você.",
      icon: Users,
      color: "text-sky-600",
      bgColor: "bg-sky-500/10",
      delay: 0.6
    },
    {
      title: "Catequese em Família",
      description: "Crie enquetes e missões familiares incríveis para manter as famílias engajadas na fé.",
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      delay: 0.7
    }
  ];

  const handleShare = async () => {
    const url = getAppUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: "iCatequese",
          text: "Conheça o iCatequese – o sistema completo de gestão para a catequese!",
          url: url,
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  };

  const handleWhatsApp = () => {
    window.open("https://wa.me/5592993371259?text=Olá! Vim pelo site do iCatequese e gostaria de saber mais.", "_blank");
  };

  return (
    <div className="min-h-screen bg-[#FFF5F0] text-slate-900 selection:bg-primary/20 selection:text-primary overflow-x-hidden font-sans">
      
      {/* ── BACKGROUND LITÚRGICO ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-primary/5 rounded-full blur-[150px]" />
        
        {/* Partículas flutuantes */}
        {[
          { s: "✦", t: "10%", l: "15%", d: 0 },
          { s: "✝", t: "20%", r: "10%", d: 2 },
          { s: "☩", b: "15%", l: "10%", d: 4 },
          { s: "✦", b: "10%", r: "15%", d: 1 },
          { s: "✝", t: "45%", l: "5%", d: 3 },
        ].map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 0.3, 
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 6 + i, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: p.d
            }}
            className="absolute text-primary/20 font-serif text-3xl select-none"
            style={{ top: p.t, left: (p as any).l, right: (p as any).right, bottom: p.b }}
          >
            {p.s}
          </motion.div>
        ))}
      </div>

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-md shadow-sm py-3" : "py-6"}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-white shadow-lg shadow-primary/10 border border-black/5 flex items-center justify-center overflow-hidden">
              <img src="/app-logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-xl font-black tracking-tighter text-primary">iCatequese</span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/auth?view=login")} 
              className="px-6 py-2 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              Fazer Login
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20">
        
        {/* ── HEADER AREA (ESTILO SOBRE) ── */}
        <section className="container mx-auto px-6 flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-32 h-32 md:w-40 md:h-40 rounded-[40px] overflow-hidden bg-white shadow-2xl mb-8 border border-black/5 p-3 flex items-center justify-center animate-float-float relative z-10"
          >
            <img src="/app-logo.png" alt="Logo iCatequese" className="w-full h-full object-contain" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter mb-2">iCatequese</h1>
            <div className="flex items-center justify-center gap-2 mb-10">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Gestão Inteligente</p>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>

            <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-md rounded-[32px] p-8 border border-black/5 shadow-xl relative text-left">
              <div className="absolute -top-6 -left-2 bg-primary text-white rounded-2xl p-3.5 shadow-xl rotate-[-10deg]">
                <Church className="h-6 w-6" />
              </div>
              <p className="text-lg md:text-xl leading-relaxed text-slate-700 italic font-medium pt-2">
                "Semear a Palavra e cultivar o Reino. Uma plataforma desenhada para auxiliar catequistas a organizar seus encontros e inovar o processo educativo da fé."
              </p>
            </div>
          </motion.div>
        </section>

        {/* ── BOTÕES DE AÇÃO PRINCIPAIS ── */}
        <section className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <button 
            onClick={() => navigate("/auth?view=login")}
            className="w-full sm:w-auto h-16 px-10 rounded-2xl bg-primary text-white font-black text-lg shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 hover:shadow-primary/50 hover:-translate-y-1 transition-all active:scale-95 group"
          >
            Fazer Login <LogIn className="w-6 h-6" />
          </button>
          
          <button 
            onClick={() => navigate("/auth?view=signup")}
            className="w-full sm:w-auto h-16 px-10 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-black text-lg hover:border-primary/30 hover:bg-slate-50 transition-all active:scale-95"
          >
            Cadastre-se
          </button>
        </section>

        {/* ── MÓDULOS SECTION (GRID DE CARDS BRANCOS) ── */}
        <section className="container mx-auto px-6 mb-24 max-w-4xl">
          <div className="flex items-center gap-4 mb-10 opacity-40">
            <div className="h-px bg-slate-900 flex-1" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-900">Tudo em um só lugar</span>
            <div className="h-px bg-slate-900 flex-1" />
          </div>

          <div className="grid gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: step.delay }}
                className="bg-white rounded-[28px] p-5 border border-black/5 shadow-sm flex items-center gap-5 hover:shadow-xl hover:-translate-y-1 transition-all group"
              >
                <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform ${step.bgColor} ${step.color}`}>
                  <step.icon className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mt-1 font-medium">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── PWA INSTALL CHIP ── */}
        {installPrompt && (
          <section className="container mx-auto px-6 flex justify-center mb-20">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleInstall}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-95 border-2 border-white"
            >
              <Smartphone className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-widest">Instalar App no Celular</span>
            </motion.button>
          </section>
        )}


        {/* ── FINAL CTA ── */}
        <section className="container mx-auto px-6 text-center mb-16">
          <button 
            onClick={() => navigate("/auth?view=signup")}
            className="w-full sm:w-auto h-16 px-12 rounded-2xl bg-primary text-white font-black text-lg shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 hover:shadow-primary/50 hover:-translate-y-1 transition-all active:scale-95 group"
          >
            Cadastre-se agora <CheckCircle2 className="w-6 h-6" />
          </button>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-white/50 border-t border-black/5 py-12 relative z-10 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-12">
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                   <img src="/app-logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                </div>
                <span className="text-xl font-black tracking-tighter text-primary">iCatequese</span>
              </div>
              <p className="text-sm font-medium text-slate-400 max-w-xs leading-relaxed">
                Sistema de gestão inteligente para catequistas modernos. Unindo fé e tecnologia.
              </p>
              <div className="flex items-center gap-6 mt-2">
                <button onClick={handleShare} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary flex items-center gap-1.5 transition-colors">
                  <Share2 className="h-3 w-3" /> Compartilhar
                </button>
                <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Termos</a>
                <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Privacidade</a>
              </div>
            </div>

            {/* Idealizador Card no Footer */}
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-[28px] border border-black/5 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-12 w-12 border-2 border-white shadow-md shrink-0">
                  <AvatarImage src="/rickson-avatar.png" alt="Rickson Amazonas" />
                  <AvatarFallback className="bg-primary text-white font-black text-xs">RA</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-black text-slate-900 leading-none mb-1">Rickson Amazonas</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Idealizador do Projeto</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-slate-400 flex-1">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  <a href="mailto:ricksonam@hotmail.com" className="text-[10px] font-bold truncate hover:text-primary transition-colors">ricksonam@hotmail.com</a>
                </div>
                <button 
                  onClick={handleWhatsApp}
                  className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition-all border border-emerald-200/50"
                >
                  Suporte
                </button>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-black/5 text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">© 2026 iCatequese · Ad maiorem Dei gloriam</p>
          </div>
        </div>
      </footer>

      {/* ── BOTÃO WHATSAPP FLUTUANTE ── */}
      <button
        onClick={handleWhatsApp}
        className="fixed bottom-6 right-6 z-[60] w-16 h-16 rounded-full overflow-hidden shadow-2xl shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all group"
      >
        <img src="/assets/whatsapp-icon.png" alt="WhatsApp" className="w-full h-full object-contain" />
        <span className="absolute right-full mr-4 px-4 py-2 rounded-xl bg-white text-slate-800 text-xs font-black shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-black/5">
          Fale conosco
        </span>
      </button>

      <style>{`
        @keyframes float-float {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
        .animate-float-float {
          animation: float-float 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
