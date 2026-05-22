import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import {
  Lock, Sparkles, BookOpen, Flame, Map,
  Heart, Users, CheckCircle2, X,
  Book, ScrollText, Cross, ChevronRight,
  Play, Gamepad2, Bell, Camera, Calendar,
  MessageSquare, Star, Zap, Shield, Globe,
  ArrowRight, Menu, GraduationCap, Award,
  UserPlus, LogIn
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PWAInstallChip } from "@/components/Onboarding/PWAInstallChip";

/* ─── Types ─── */
interface Module {
  id: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  title: string;
  description: string;
  badge?: string;
  features: string[];
  previewContent: React.ReactNode;
}

/* ─── Ornamento SVG de cruz ─── */
const CrossOrnament = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 60 60" className={className} fill="currentColor">
    <rect x="28" y="10" width="4" height="40" rx="1" />
    <rect x="15" y="24" width="30" height="4" rx="1" />
  </svg>
);

/* ─── Floating particles ─── */
const FloatingParticle = ({ delay, x, size }: { delay: number; x: number; size: number }) => (
  <motion.div
    className="absolute rounded-full opacity-20 pointer-events-none"
    style={{
      left: `${x}%`,
      bottom: -20,
      width: size,
      height: size,
      background: "linear-gradient(135deg, #8C2A3C, #D4AF37)",
    }}
    animate={{ y: [-20, -500], opacity: [0, 0.3, 0] }}
    transition={{ duration: 8 + delay, repeat: Infinity, delay, ease: "linear" }}
  />
);

/* ─── Chip Component ─── */
const Chip = ({
  children,
  variant = "default",
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  variant?: "default" | "premium" | "danger" | "ghost" | "restricted";
  onClick?: () => void;
  className?: string;
}) => {
  const variants = {
    default: "bg-white/10 text-white border border-white/20 hover:bg-white/20",
    premium:
      "bg-gradient-to-r from-[#D4AF37] to-[#f0cc5a] text-[#2C241B] font-bold shadow-lg shadow-[#D4AF37]/30",
    danger: "bg-[#8C2A3C]/80 text-white border border-[#8C2A3C]",
    ghost:
      "bg-transparent text-white/70 border border-white/20 hover:text-white hover:border-white/40",
    restricted:
      "bg-white/10 text-white border border-white/25 hover:bg-white/20 backdrop-blur-sm",
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

/* ─── Module Modal Preview Content ─── */
const EncountrosPreview = () => (
  <div className="space-y-3">
    {["Encontro 1 – A Criação", "Encontro 2 – O Batismo", "Encontro 3 – A Eucaristia"].map((enc, i) => (
      <motion.div
        key={i}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: i * 0.1 }}
        className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl"
      >
        <div className="w-8 h-8 rounded-lg bg-[#8C2A3C]/30 flex items-center justify-center text-[#8C2A3C] text-xs font-bold">
          {i + 1}
        </div>
        <div className="flex-1">
          <p className="text-white/90 text-sm font-medium">{enc}</p>
          <p className="text-white/40 text-xs">12 catequizandos presentes</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Realizado</span>
      </motion.div>
    ))}
    <div className="mt-4 p-3 bg-[#8C2A3C]/20 rounded-xl border border-[#8C2A3C]/30 text-center">
      <p className="text-[#D4AF37] text-xs font-semibold">📅 Próximo: 28 de Maio — Crisma</p>
    </div>
  </div>
);

const BibliaPreview = () => {
  const [verse] = useState({
    book: "João",
    chapter: 3,
    verse: 16,
    text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
  });
  return (
    <div className="space-y-4">
      <div className="p-5 bg-gradient-to-br from-amber-950/40 to-amber-900/20 border border-amber-700/30 rounded-2xl text-center">
        <p className="text-amber-400/60 text-xs uppercase tracking-widest mb-2">Versículo do Dia</p>
        <p className="text-white/90 text-sm leading-relaxed font-light italic">"{verse.text}"</p>
        <p className="text-amber-400 text-xs mt-3 font-semibold">
          {verse.book} {verse.chapter}:{verse.verse}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["Gênesis", "Salmos", "João", "Romanos", "Filipenses", "Apocalipse"].map((book) => (
          <div key={book} className="p-2 bg-white/5 border border-white/10 rounded-lg text-center text-white/60 text-xs hover:bg-white/10 cursor-pointer transition-colors">
            {book}
          </div>
        ))}
      </div>
    </div>
  );
};

const JogosPreview = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const question = "Quem foi o primeiro rei de Israel?";
  const options = ["Davi", "Saul", "Salomão", "Moisés"];
  const correct = 1;
  return (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Gamepad2 className="w-4 h-4 text-purple-400" />
          <span className="text-purple-300 text-xs font-semibold">Quiz Bíblico</span>
          <span className="ml-auto text-yellow-400 text-xs font-bold">⏱ 0:14</span>
        </div>
        <p className="text-white text-sm font-medium mb-4">{question}</p>
        <div className="grid grid-cols-2 gap-2">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`p-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                selected === null
                  ? "bg-white/10 text-white/80 hover:bg-white/20"
                  : i === correct
                  ? "bg-green-500/30 text-green-300 border border-green-500/50"
                  : selected === i
                  ? "bg-red-500/30 text-red-300 border border-red-500/50"
                  : "bg-white/5 text-white/40"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {["Bingo Bíblico", "Mímica", "Sorteio"].map((game) => (
          <div key={game} className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/60 text-xs">
            {game}
          </div>
        ))}
      </div>
    </div>
  );
};

const FamiliaPreview = () => (
  <div className="space-y-3">
    <div className="p-4 bg-gradient-to-br from-rose-950/40 to-pink-900/20 border border-rose-700/30 rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="w-4 h-4 text-rose-400" />
        <span className="text-rose-300 text-xs font-semibold">Missão da Semana</span>
      </div>
      <p className="text-white/80 text-sm leading-relaxed">
        🙏 Rezem juntos o Pai Nosso antes do jantar e conversem sobre uma atitude de bondade que podem praticar esta semana.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <div className="flex -space-x-1">
          {["M", "P", "A"].map((l) => (
            <div key={l} className="w-5 h-5 rounded-full bg-rose-500/40 border border-rose-400/50 flex items-center justify-center text-[10px] text-rose-300 font-bold">{l}</div>
          ))}
        </div>
        <span className="text-white/40 text-xs">3 famílias responderam</span>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {["Mural de Fotos", "Avisos", "Formulários", "Comunicados"].map((item) => (
        <div key={item} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 text-xs flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          {item}
        </div>
      ))}
    </div>
  </div>
);

const CalendarioPreview = () => {
  const events = [
    { date: "26 Mai", name: "Pentecostes", color: "bg-red-500/20 text-red-300 border-red-500/30" },
    { date: "01 Jun", name: "Corpus Christi", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    { date: "15 Jun", name: "SS. Trindade", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  ];
  return (
    <div className="space-y-3">
      <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3 text-center">Próximas Solenidades</p>
        <div className="space-y-2">
          {events.map((ev) => (
            <div key={ev.name} className={`flex items-center gap-3 p-2.5 rounded-lg border ${ev.color}`}>
              <span className="text-xs font-mono font-bold opacity-80">{ev.date}</span>
              <span className="text-sm">{ev.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 bg-gradient-to-r from-green-900/30 to-emerald-900/20 border border-green-700/30 rounded-xl text-center">
        <p className="text-green-400 text-xs">🌿 Tempo Comum — Semana XXVI</p>
      </div>
    </div>
  );
};

const ComunicacaoPreview = () => (
  <div className="space-y-3">
    <div className="p-4 bg-gradient-to-br from-blue-950/40 to-indigo-900/20 border border-blue-700/30 rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-blue-400" />
        <span className="text-blue-300 text-xs font-semibold">Novo Comunicado</span>
      </div>
      <div className="space-y-2">
        <div className="h-2 bg-white/10 rounded-full w-full" />
        <div className="h-2 bg-white/10 rounded-full w-4/5" />
        <div className="h-2 bg-white/10 rounded-full w-3/5" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="px-3 py-1.5 bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 text-xs">WhatsApp</div>
        <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/50 text-xs">E-mail</div>
        <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/50 text-xs">Push</div>
      </div>
    </div>
    <div className="flex items-center gap-2 text-white/50 text-xs">
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span>47 destinatários • Enviado às 19:30</span>
    </div>
  </div>
);

/* ─── MODULE DATA ─── */
const modules: Module[] = [
  {
    id: "encontros",
    icon: <BookOpen className="w-6 h-6" />,
    color: "#8C2A3C",
    gradient: "from-[#8C2A3C] to-[#b33a52]",
    title: "Gestão de Encontros",
    description: "Planeje encontros, registre presenças e faça anotações pastorais com facilidade.",
    badge: "Essencial",
    features: ["Diário de classe", "Chamada digital", "Anotações", "Planos de aula"],
    previewContent: <EncountrosPreview />,
  },
  {
    id: "biblia",
    icon: <Book className="w-6 h-6" />,
    color: "#D4AF37",
    gradient: "from-amber-700 to-amber-500",
    title: "Sagrada Escritura",
    description: "Bíblia completa integrada com sorteio de versículos e destaques por tempo litúrgico.",
    badge: "Popular",
    features: ["Bíblia completa", "Sorteio de citações", "Versículo do dia", "Busca por livro"],
    previewContent: <BibliaPreview />,
  },
  {
    id: "jogos",
    icon: <Gamepad2 className="w-6 h-6" />,
    color: "#7c3aed",
    gradient: "from-violet-700 to-purple-500",
    title: "Dinâmicas e Jogos",
    description: "Biblioteca de jogos bíblicos interativos para animar e engajar os catequizandos.",
    badge: "Premium",
    features: ["Quiz Bíblico", "Bingo Bíblico", "Mímica Sagrada", "Sorteio de grupos"],
    previewContent: <JogosPreview />,
  },
  {
    id: "familia",
    icon: <Heart className="w-6 h-6" />,
    color: "#e11d48",
    gradient: "from-rose-700 to-pink-500",
    title: "Apoio às Famílias",
    description: "Missões semanais, mural de fotos e comunicados direto para as famílias.",
    badge: "Premium",
    features: ["Missões em família", "Mural de fotos", "Formulários", "Comunicados"],
    previewContent: <FamiliaPreview />,
  },
  {
    id: "calendario",
    icon: <Calendar className="w-6 h-6" />,
    color: "#059669",
    gradient: "from-emerald-700 to-green-500",
    title: "Calendário Litúrgico",
    description: "Acompanhe o Ano Litúrgico e sincronize seus encontros com as solenidades da Igreja.",
    features: ["Ano litúrgico", "Cores do tempo", "Solenidades", "Integração com turmas"],
    previewContent: <CalendarioPreview />,
  },
  {
    id: "comunicacao",
    icon: <MessageSquare className="w-6 h-6" />,
    color: "#2563eb",
    gradient: "from-blue-700 to-indigo-500",
    title: "Comunicação",
    description: "Crie avisos e comunicados profissionais e envie para pais e catequizandos.",
    badge: "Premium",
    features: ["Avisos em massa", "Modelos prontos", "WhatsApp integrado", "Histórico"],
    previewContent: <ComunicacaoPreview />,
  },
];

/* ─── Module Card ─── */
const ModuleCard = ({ module, onClick }: { module: Module; onClick: () => void }) => (
  <motion.div
    whileHover={{ y: -6, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="relative cursor-pointer rounded-2xl overflow-hidden border border-white/10 group"
    style={{
      background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      backdropFilter: "blur(10px)",
    }}
  >
    {/* Glow on hover */}
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
      style={{
        background: `radial-gradient(ellipse at top left, ${module.color}20 0%, transparent 60%)`,
      }}
    />

    {/* Top gradient accent */}
    <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${module.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

    <div className="relative p-5">
      {/* Icon + Badge */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${module.color}, ${module.color}cc)` }}
        >
          {module.icon}
        </div>
        {module.badge && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border"
            style={{
              color: module.color,
              borderColor: `${module.color}40`,
              background: `${module.color}15`,
            }}
          >
            {module.badge}
          </span>
        )}
      </div>

      {/* Content */}
      <h3 className="text-white font-bold text-base mb-1.5">{module.title}</h3>
      <p className="text-white/50 text-xs leading-relaxed mb-4">{module.description}</p>

      {/* Features */}
      <div className="flex flex-wrap gap-1.5">
        {module.features.slice(0, 3).map((f) => (
          <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">
            {f}
          </span>
        ))}
        {module.features.length > 3 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">
            +{module.features.length - 3}
          </span>
        )}
      </div>

      {/* CTA */}
      <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300" style={{ color: module.color }}>
        Ver demonstração <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </div>
  </motion.div>
);

/* ─── Module Modal ─── */
const ModuleModal = ({ module, onClose }: { module: Module; onClose: () => void }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(145deg, #1a0a2e 0%, #0f0520 50%, #1a0f2e 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative p-6 pb-4">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(ellipse at top left, ${module.color} 0%, transparent 60%)`,
            }}
          />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${module.color}, ${module.color}cc)` }}
              >
                {module.icon}
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{module.title}</h3>
                <p className="text-white/40 text-xs">{module.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${module.color}60, transparent)` }}
          />
        </div>

        {/* Modal Body — Preview */}
        <div className="px-6 pb-6">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-4">Visualização do módulo</p>
          {module.previewContent}
        </div>

        {/* Modal Footer */}
        <div className="px-6 pb-6">
          <div
            className="h-px w-full mb-4"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }}
          />
          <p className="text-white/30 text-xs text-center mb-3">
            Crie sua conta gratuita para acessar este módulo
          </p>
          <button
            onClick={() => { window.location.href = "/auth?view=signup"; }}
            className="w-full py-3 rounded-xl font-bold text-sm text-white relative overflow-hidden group"
            style={{ background: `linear-gradient(135deg, ${module.color}, ${module.color}cc)` }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" /> Cadastre-se e acesse grátis
            </span>
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

/* ─── Screen Carousel ─── */
const screens = [
  { src: "/card_encontros.jpg", label: "Encontros" },
  { src: "/acesso_agenda.jpg", label: "Agenda" },
  { src: "/acesso_biblia.jpg", label: "Bíblia" },
  { src: "/acesso_conecta.jpg", label: "Conecta" },
  { src: "/acesso_jogos.jpg", label: "Jogos" },
];

const ScreenCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextRandom = Math.floor(Math.random() * screens.length);
      setDirection(nextRandom > currentIndex ? 1 : -1);
      setCurrentIndex(nextRandom);
    }, 3000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <div className="relative w-full max-w-5xl mx-auto px-4">
      {/* Screens row */}
      <div className="flex items-center justify-center gap-4 overflow-hidden">
        {screens.map((screen, i) => {
          const offset = i - currentIndex;
          const absOffset = Math.abs(offset);
          const isCenter = offset === 0;
          const isVisible = absOffset <= 2;

          return (
            <motion.div
              key={screen.src}
              animate={{
                scale: isCenter ? 1 : absOffset === 1 ? 0.85 : 0.7,
                opacity: isCenter ? 1 : absOffset === 1 ? 0.6 : 0.3,
                x: offset * 280,
                zIndex: isCenter ? 10 : absOffset === 1 ? 5 : 1,
                rotateY: offset * -8,
              }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className={`absolute rounded-2xl overflow-hidden shadow-2xl border border-white/10 ${isVisible ? "" : "opacity-0"}`}
              style={{ width: 280, height: 170 }}
            >
              <img src={screen.src} alt={screen.label} className="w-full h-full object-cover" />
              {isCenter && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-3">
                  <span className="text-white text-xs font-semibold">{screen.label}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-8">
        {screens.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`rounded-full transition-all duration-300 ${
              i === currentIndex ? "w-6 h-2 bg-[#D4AF37]" : "w-2 h-2 bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

/* ─── MAIN COMPONENT ─── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleWhatsApp = () =>
    window.open("https://wa.me/5592993371259?text=Olá! Vim pelo site do iCatequese.", "_blank");

  return (
    <div
      className="min-h-screen text-white overflow-x-hidden font-sans"
      style={{
        background: "linear-gradient(160deg, #0d0520 0%, #120a2e 30%, #1a0f2e 60%, #0d0520 100%)",
      }}
    >
      <PWAInstallChip />

      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute w-[600px] h-[600px] -top-40 -left-40 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #6b46c1 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute w-[500px] h-[500px] -bottom-20 -right-20 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #8C2A3C 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #D4AF37 0%, transparent 70%)", filter: "blur(80px)" }} />
        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 1.2} x={10 + i * 11} size={4 + (i % 3) * 4} />
        ))}
      </div>

      {/* ── NAVBAR ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: "linear-gradient(90deg, rgba(13,5,32,0.95) 0%, rgba(18,10,46,0.95) 50%, rgba(13,5,32,0.95) 100%)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-white/20 shadow-lg shadow-purple-500/20">
              <AvatarImage src="/Avatar.png" alt="Avatar" />
              <AvatarFallback className="bg-purple-900 text-white text-xs">iC</AvatarFallback>
            </Avatar>
            <span className="text-xl font-bold tracking-tight text-white">
              i<span className="text-[#D4AF37]">Catequese</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3">
            {/* Acesso Restrito Chip */}
            <Chip
              variant="restricted"
              onClick={() => navigate("/admin/login")}
              className="gap-1.5"
            >
              <Lock className="w-3 h-3 opacity-70" />
              Acesso Restrito
            </Chip>

            {/* Entrar */}
            <button
              onClick={() => navigate("/auth?view=login")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/25 transition-all duration-200"
            >
              <LogIn className="w-4 h-4" /> Entrar
            </button>

            {/* Cadastre-se — DESTAQUE */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/auth?view=signup")}
              className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #8C2A3C 0%, #b33a52 50%, #8C2A3C 100%)",
                boxShadow: "0 0 20px rgba(140,42,60,0.5), 0 4px 15px rgba(140,42,60,0.3)",
              }}
            >
              {/* Shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <UserPlus className="w-4 h-4" />
              Cadastre-se grátis
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-semibold">FREE</span>
            </motion.button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/10"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/10 overflow-hidden"
              style={{ background: "rgba(13,5,32,0.98)" }}
            >
              <div className="px-6 py-4 space-y-3">
                <button onClick={() => navigate("/admin/login")}
                  className="flex items-center gap-2 text-white/50 text-sm w-full">
                  <Lock className="w-4 h-4" /> Acesso Restrito
                </button>
                <button onClick={() => navigate("/auth?view=login")}
                  className="flex items-center gap-2 text-white/70 text-sm w-full">
                  <LogIn className="w-4 h-4" /> Entrar na plataforma
                </button>
                <button
                  onClick={() => navigate("/auth?view=signup")}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white text-center"
                  style={{ background: "linear-gradient(135deg, #8C2A3C, #b33a52)" }}
                >
                  Cadastre-se grátis
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom accent line */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)" }} />
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 pt-32 pb-16 px-6 flex flex-col items-center text-center max-w-5xl mx-auto">
        {/* Top label */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase"
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.08))",
              border: "1px solid rgba(212,175,55,0.3)",
              color: "#D4AF37",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" /> Evangelização e Organização
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6"
        >
          A plataforma completa
          <br />
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(135deg, #D4AF37 0%, #f0cc5a 50%, #D4AF37 100%)" }}
          >
            para catequistas
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white/50 text-lg max-w-2xl mb-10 leading-relaxed"
        >
          Gerencie turmas, encontros, catequizandos e famílias em um só lugar. 
          Ferramentas litúrgicas modernas com alma pastoral.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          {/* Primary CTA — super destacado */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/auth?view=signup")}
            className="relative w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-base text-white overflow-hidden group"
            style={{
              background: "linear-gradient(135deg, #8C2A3C 0%, #c93a56 40%, #8C2A3C 100%)",
              boxShadow: "0 0 40px rgba(140,42,60,0.5), 0 8px 30px rgba(140,42,60,0.4)",
            }}
          >
            {/* Animated shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            {/* Glow ring */}
            <div
              className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
              style={{ background: "linear-gradient(135deg, #8C2A3C, #c93a56)", filter: "blur(12px)" }}
            />
            <span className="relative flex items-center gap-2.5">
              <UserPlus className="w-5 h-5" />
              Cadastre-se — é grátis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>

          {/* Secondary CTA */}
          <button
            onClick={() => document.getElementById("modulos")?.scrollIntoView({ behavior: "smooth" })}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-sm text-white/70 hover:text-white border border-white/15 hover:border-white/30 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" /> Ver os módulos
          </button>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-10 text-white/30 text-xs"
        >
          {[
            { icon: <Shield className="w-3.5 h-3.5" />, text: "Grátis para começar" },
            { icon: <Users className="w-3.5 h-3.5" />, text: "Para catequistas e paróquias" },
            { icon: <Star className="w-3.5 h-3.5" />, text: "CNBB Doc. 107" },
          ].map((badge) => (
            <div key={badge.text} className="flex items-center gap-1.5">
              {badge.icon} {badge.text}
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── TELAS LADO A LADO — SLIDESHOW ── */}
      <section className="relative z-10 pb-24">
        <div className="relative h-56 flex items-center justify-center overflow-hidden">
          <ScreenCarousel />
        </div>

        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 pointer-events-none z-20"
          style={{ background: "linear-gradient(90deg, #0d0520, transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none z-20"
          style={{ background: "linear-gradient(-90deg, #0d0520, transparent)" }} />
      </section>

      {/* ── MÓDULOS ── */}
      <section id="modulos" className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
                style={{
                  background: "rgba(139,92,246,0.1)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  color: "#a78bfa",
                }}
              >
                <Zap className="w-3.5 h-3.5" /> Módulos da Plataforma
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Tudo para a sua <span className="text-[#D4AF37]">Missão</span>
              </h2>
              <p className="text-white/40 max-w-xl mx-auto">
                Clique em um módulo para ver uma prévia interativa do que ele faz.
              </p>
            </motion.div>
          </div>

          {/* Module Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((module, i) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <ModuleCard module={module} onClick={() => setSelectedModule(module)} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IVC SECTION ── */}
      <section
        className="relative z-10 py-20 px-6 mx-6 mb-8 rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: "radial-gradient(ellipse at top right, rgba(140,42,60,0.3) 0%, transparent 60%)" }}
        />
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
              style={{ background: "rgba(140,42,60,0.2)", border: "1px solid rgba(140,42,60,0.4)" }}>
              <Cross className="w-3.5 h-3.5 text-[#8C2A3C]" />
              <span className="text-[#8C2A3C] text-xs font-semibold uppercase tracking-wider">IVC</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">
              Iniciação à<br />
              <span className="text-[#D4AF37]">Vida Cristã</span>
            </h2>
            <p className="text-white/50 leading-relaxed mb-6">
              A catequese não é apenas o ensino de uma doutrina, mas um{" "}
              <strong className="text-white/80">itinerário existencial</strong>. O paradigma catecumenal
              nos convida a mergulhar no mistério de Cristo através da liturgia, da palavra e da
              comunidade.
            </p>
            <ul className="space-y-3">
              {[
                "Acompanhamento pessoal e avaliações formativas.",
                "Sintonia com os tempos do Ano Litúrgico.",
                "Envolvimento ativo da família.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-white/60">
                  <CheckCircle2 className="w-5 h-5 text-[#8C2A3C] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
          >
            <img src="/acesso_conecta.jpg" alt="Acompanhamento Catequético" className="w-full h-auto" />
          </motion.div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Planos e <span className="text-[#D4AF37]">Assinaturas</span>
            </h2>
            <p className="text-white/40">Escolha como apoiar e estruturar a sua missão.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Gratuito */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl flex flex-col"
              style={{
                background: "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <h3 className="text-xl font-bold text-white mb-2">Uso Gratuito</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-bold text-white">R$ 0</span>
              </div>
              <p className="text-white/40 mb-8 text-sm leading-relaxed flex-1">
                Acesso básico para organizar uma turma e conhecer as ferramentas fundamentais.
              </p>
              <ul className="space-y-3 mb-8">
                {["1 Turma ativa", "Mural de fotos básico", "Agenda de encontros", "Bíblia online"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/50">
                    <CheckCircle2 className="w-4 h-4 text-white/20" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/auth?view=signup")}
                className="w-full py-3.5 rounded-xl border border-white/20 text-white/60 text-sm font-semibold hover:border-white/40 hover:text-white transition-all"
              >
                Começar de Graça
              </button>
            </motion.div>

            {/* Premium */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-8 rounded-3xl flex flex-col relative overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #4a1626, #6b1e2c, #4a1626)",
                border: "1px solid rgba(212,175,55,0.3)",
                boxShadow: "0 0 50px rgba(140,42,60,0.3), 0 20px 40px rgba(0,0,0,0.4)",
              }}
            >
              {/* Gold glow */}
              <div
                className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
                style={{ background: "radial-gradient(circle, #D4AF37, transparent)" }}
              />
              <div className="absolute top-4 right-4">
                <CrossOrnament className="w-20 h-20 text-white opacity-10" />
              </div>

              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl font-bold text-white">Acesso Premium</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 font-semibold">
                  ANUAL
                </span>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-bold text-white">R$ 14,90</span>
                <span className="text-[#D4AF37] text-sm uppercase tracking-widest">/ano</span>
              </div>
              <p className="text-white/60 mb-8 text-sm leading-relaxed flex-1">
                Acesso integral aos recursos premium. Uma contribuição mínima para manter a plataforma viva.
              </p>
              <ul className="space-y-3 mb-8 relative z-10">
                {[
                  "Turmas Ilimitadas",
                  "Catequizandos Ilimitados",
                  "Todos os Jogos Interativos",
                  "Missões em Família e Formulários",
                  "Relatórios Completos de Turma",
                  "Suporte Prioritário",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/auth?view=signup")}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-[#2C241B] relative z-10 overflow-hidden group"
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #f0cc5a, #D4AF37)",
                  boxShadow: "0 0 20px rgba(212,175,55,0.4)",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-2">
                  <Award className="w-4 h-4" /> Assinar Premium
                </span>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="relative z-10 py-20 px-6 text-center">
        <div
          className="max-w-3xl mx-auto p-12 rounded-3xl relative overflow-hidden"
          style={{
            background: "linear-gradient(145deg, rgba(140,42,60,0.2), rgba(140,42,60,0.1))",
            border: "1px solid rgba(140,42,60,0.3)",
          }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{ background: "radial-gradient(ellipse at center, rgba(212,175,55,0.15), transparent 60%)" }}
          />
          <CrossOrnament className="w-8 h-8 text-[#D4AF37] mx-auto mb-6 opacity-60" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Comece a transformar<br />
            <span className="text-[#D4AF37]">sua catequese hoje</span>
          </h2>
          <p className="text-white/50 mb-8 max-w-xl mx-auto">
            Junte-se a catequistas de todo o Brasil que já usam o iCatequese para
            organizar e evangelizar com mais eficiência.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/auth?view=signup")}
              className="relative w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-base text-white overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #8C2A3C, #c93a56)",
                boxShadow: "0 0 30px rgba(140,42,60,0.5)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center gap-2">
                <UserPlus className="w-5 h-5" /> Criar conta grátis
              </span>
            </motion.button>
            <button
              onClick={handleWhatsApp}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-sm text-white/60 hover:text-white border border-white/15 hover:border-white/30 transition-all"
            >
              Falar no WhatsApp
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="relative z-10 border-t py-12 px-6 text-center"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <CrossOrnament className="w-5 h-5 text-white/20 mb-5" />
          <h2 className="text-2xl font-bold mb-1">
            i<span className="text-[#D4AF37]">Catequese</span>
          </h2>
          <p className="text-xs text-white/25 font-bold uppercase tracking-[0.2em] mb-8">Ad maiorem Dei gloriam</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-white/15">
                <AvatarImage src="/Avatar.png" alt="Rickson Amazonas" />
                <AvatarFallback>RA</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-bold text-white/80">Rickson Amazonas</p>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Criador & Catequista</p>
              </div>
            </div>
            <button
              onClick={handleWhatsApp}
              className="px-5 py-2 rounded-xl border border-white/15 text-white/40 text-xs font-semibold hover:border-white/30 hover:text-white/70 transition-all"
            >
              Contato WhatsApp
            </button>
          </div>

          <div className="text-[10px] text-white/20 uppercase tracking-widest">
            © {new Date().getFullYear()} iCatequese. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* ── MODULE MODAL ── */}
      {selectedModule && (
        <ModuleModal module={selectedModule} onClose={() => setSelectedModule(null)} />
      )}
    </div>
  );
}
