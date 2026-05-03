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
  Instagram
} from "lucide-react";
import { getAppUrl } from "@/lib/utils";
import { toast } from "sonner";

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

  const modules = [
    { 
      title: "Gestão de Turmas", 
      desc: "Controle total de encontros, presenças e avaliações em um só lugar.", 
      icon: LayoutDashboard, 
      color: "bg-blue-500",
      delay: 0.1 
    },
    { 
      title: "Bíblia Online", 
      desc: "Acesso rápido às Sagradas Escrituras integrado ao seu plano de aula.", 
      icon: Book, 
      color: "bg-amber-500",
      delay: 0.2
    },
    { 
      title: "Conecta Famílias", 
      desc: "Comunicação direta e missões interativas para envolver os pais.", 
      icon: Heart, 
      color: "bg-rose-500",
      delay: 0.3
    },
    { 
      title: "Jogos Bíblicos", 
      desc: "Dinâmicas, quizes e sorteios para tornar o aprendizado divertido.", 
      icon: Gamepad2, 
      color: "bg-emerald-500",
      delay: 0.4
    },
    { 
      title: "Calendário Litúrgico", 
      desc: "Acompanhe os tempos da Igreja e planeje suas atividades com sabedoria.", 
      icon: Calendar, 
      color: "bg-purple-500",
      delay: 0.5
    },
    { 
      title: "Mural de Memórias", 
      desc: "Registre e compartilhe os momentos especiais da caminhada da fé.", 
      icon: ImageIcon, 
      color: "bg-sky-500",
      delay: 0.6
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
  const handleWhatsApp = () => {
    window.open("https://wa.me/5592993371259?text=Olá! Vim pelo site do iCatequese e gostaria de saber mais.", "_blank");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-primary/20 selection:text-primary overflow-x-hidden font-sans">
      
      {/* ── BACKGROUND LITÚRGICO ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-sky-50 to-white" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-primary/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
        
        {/* Partículas flutuantes */}
        <AnimatePresence>
          {[
            { s: "✦", t: "10%", l: "15%", d: 0 },
            { s: "✝", t: "20%", r: "10%", d: 2 },
            { s: "☩", b: "15%", l: "10%", d: 4 },
            { s: "✦", b: "10%", r: "15%", d: 1 },
            { s: "✝", t: "45%", l: "5%", d: 3 },
          ].map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
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
        </AnimatePresence>
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

          <div className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Funcionalidades</a>
            <a href="#sobre" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Sobre</a>
            <button 
              onClick={() => navigate("/auth")} 
              className="px-6 py-2 rounded-full bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              Entrar
            </button>
          </div>

          <button 
            onClick={() => navigate("/auth")}
            className="md:hidden w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-90 transition-all"
          >
            <LogIn className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20">
        
        {/* ── HERO SECTION ── */}
        <section className="container mx-auto px-6 text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">O Futuro da Catequese chegou</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 leading-[1.1]">
              Acompanhe sua Catequese <br className="hidden md:block" />
              com <span className="bg-gradient-to-r from-primary via-blue-600 to-primary bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent">Amor e Ordem</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              O sistema completo para catequistas modernos. Organize turmas, registre presenças e conecte-se com as famílias de forma simples e inspiradora.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4 sm:px-0">
              <button 
                onClick={() => navigate("/auth")}
                className="w-full sm:w-auto h-16 px-10 rounded-2xl bg-primary text-white font-black text-lg shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 hover:shadow-primary/50 hover:-translate-y-1 transition-all active:scale-95 group"
              >
                Cadastrar agora
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={() => navigate("/auth")}
                className="w-full sm:w-auto h-16 px-10 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-black text-lg hover:border-primary/30 hover:bg-slate-50 transition-all active:scale-95"
              >
                Entrar no Sistema
              </button>
            </div>

            {/* PWA Install Chip */}
            {installPrompt && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleInstall}
                className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-95 border-2 border-white"
              >
                <Smartphone className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest">Instalar App no Celular</span>
              </motion.button>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-16 flex justify-center"
          >
            <div className="animate-bounce p-2 rounded-full bg-white shadow-lg text-slate-400">
              <ArrowDown className="h-5 w-5" />
            </div>
          </motion.div>
        </section>

        {/* ── MÓDULOS SECTION ── */}
        <section id="funcionalidades" className="container mx-auto px-6 mb-32">
          <div className="text-center mb-16 px-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">Tudo o que você precisa</h2>
            <p className="text-slate-500 font-medium">Ferramentas pensadas no dia a dia da missão catequética.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod, i) => (
              <motion.div
                key={mod.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: mod.delay }}
                className="group p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-primary/5 transition-all hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-2xl ${mod.color} text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                  <mod.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-3 tracking-tight group-hover:text-primary transition-colors">{mod.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  {mod.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── SOBRE SECTION ── */}
        <section id="sobre" className="container mx-auto px-6 mb-32">
          <div className="p-8 md:p-16 rounded-[3rem] bg-gradient-to-br from-slate-900 to-blue-950 text-white relative overflow-hidden shadow-3xl">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px]" />
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-300">
                  <Shield className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Seguro e Gratuito</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
                  Nascido para servir à <br /> Igreja e ao Reino
                </h2>
                <p className="text-lg text-slate-300 leading-relaxed font-medium">
                  O iCatequese é um projeto independente, criado com o objetivo de simplificar o trabalho administrativo do catequista, para que ele possa focar no que realmente importa: o anúncio do Evangelho.
                </p>
                <div className="flex flex-wrap gap-6 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xl font-black leading-none">+2.000</p>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Catequistas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xl font-black leading-none">+50.000</p>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Momentos</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="aspect-square rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-sm p-6 flex flex-col justify-center gap-8 relative">
                   <div className="space-y-2">
                     <p className="text-sm font-bold text-blue-300 uppercase tracking-widest">Nossa Missão</p>
                     <p className="text-2xl font-medium leading-relaxed italic text-white/90">
                       "Ide e fazei discípulos entre todas as nações."
                     </p>
                     <p className="text-right text-xs font-black text-slate-400 uppercase tracking-widest">— Mateus 28:19</p>
                   </div>
                   
                   <button 
                     onClick={() => navigate("/auth")}
                     className="w-full h-14 rounded-2xl bg-white text-slate-900 font-black flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-xl active:scale-95"
                   >
                     Comece sua caminhada
                     <ChevronRight className="h-5 w-5" />
                   </button>
                </div>
                {/* Estrelinhas decorativas */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-400 rounded-full blur-2xl opacity-50 animate-pulse" />
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="container mx-auto px-6 text-center mb-20 px-4">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Pronto para transformar sua <br className="hidden md:block" /> experiência na Catequese?
            </h2>
            <p className="text-slate-500 text-lg font-medium">
              Junte-se a milhares de catequistas e leve organização e modernidade para sua paróquia.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => navigate("/auth")}
                className="w-full sm:w-auto h-16 px-12 rounded-2xl bg-primary text-white font-black text-lg shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all active:scale-95"
              >
                Cadastre-se Grátis
              </button>
              <button 
                onClick={handleShare}
                className="w-full sm:w-auto h-16 px-10 rounded-2xl bg-slate-100 text-slate-700 font-black text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="h-5 w-5" />
                Compartilhar App
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-slate-100 py-12 relative z-10 px-4">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4 text-center md:text-left">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                 <img src="/app-logo.png" alt="Logo" className="w-6 h-6 object-contain" />
              </div>
              <span className="text-lg font-black tracking-tighter text-primary">iCatequese</span>
            </div>
            <p className="text-xs font-medium text-slate-400 max-w-xs leading-relaxed">
              Sistema de gestão inteligente para catequistas. <br /> 
              Feito com fé e tecnologia por Rickson Amazonas.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex items-center gap-4 mb-4">
              <a 
                href="https://www.instagram.com/icatequese/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-all shadow-sm"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <button 
                onClick={handleWhatsApp}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-6 mb-2">
              <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Termos</a>
              <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Privacidade</a>
              <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Contato</a>
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">© 2026 iCatequese · Todos os direitos reservados</p>
          </div>
        </div>
      </footer>

      {/* ── BOTÃO WHATSAPP FLUTUANTE ── */}
      <button
        onClick={handleWhatsApp}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      >
        <MessageCircle className="h-7 w-7 group-hover:animate-pulse" />
        <span className="absolute right-full mr-4 px-4 py-2 rounded-xl bg-white text-slate-800 text-xs font-black shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-black/5">
          Fale conosco
        </span>
      </button>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-shimmer {
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
        }
        .shadow-3xl {
          box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
