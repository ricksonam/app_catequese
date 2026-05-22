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
    className="absolute rounded-full opacity-10 pointer-events-none"
    style={{
      left: `${x}%`,
      bottom: -20,
      width: size,
      height: size,
      background: "linear-gradient(135deg, #8C2A3C, #D4AF37)",
    }}
    animate={{ y: [-20, -500], opacity: [0, 0.2, 0] }}
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
    default: "bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200",
    premium:
      "bg-gradient-to-r from-[#D4AF37] to-[#f0cc5a] text-[#2C241B] font-bold shadow-lg shadow-[#D4AF37]/30",
    danger: "bg-[#8C2A3C]/10 text-[#8C2A3C] border border-[#8C2A3C]/20",
    ghost:
      "bg-transparent text-stone-600 border border-stone-200 hover:text-stone-900 hover:border-stone-300",
    restricted:
      "bg-white/80 text-stone-600 border border-stone-200 hover:bg-stone-50 backdrop-blur-sm shadow-sm",
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
        className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-100 rounded-xl"
      >
        <div className="w-8 h-8 rounded-lg bg-[#8C2A3C]/10 flex items-center justify-center text-[#8C2A3C] text-xs font-bold">
          {i + 1}
        </div>
        <div className="flex-1">
          <p className="text-stone-800 text-sm font-medium">{enc}</p>
          <p className="text-stone-500 text-xs">12 catequizandos presentes</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Realizado</span>
      </motion.div>
    ))}
    <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
      <p className="text-amber-700 text-xs font-semibold">📅 Próximo: 28 de Maio — Crisma</p>
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
      <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl text-center">
        <p className="text-amber-700/80 text-xs uppercase tracking-widest mb-2 font-bold">Versículo do Dia</p>
        <p className="text-stone-800 text-sm leading-relaxed font-light italic">"{verse.text}"</p>
        <p className="text-amber-700 text-xs mt-3 font-semibold">
          {verse.book} {verse.chapter}:{verse.verse}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["Gênesis", "Salmos", "João", "Romanos", "Filipenses", "Apocalipse"].map((book) => (
          <div key={book} className="p-2 bg-white border border-stone-200 rounded-lg text-center text-stone-600 text-xs hover:bg-stone-50 cursor-pointer transition-colors">
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
      <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Gamepad2 className="w-4 h-4 text-purple-600" />
          <span className="text-purple-700 text-xs font-semibold">Quiz Bíblico</span>
          <span className="ml-auto text-amber-600 text-xs font-bold">⏱ 0:14</span>
        </div>
        <p className="text-purple-950 text-sm font-medium mb-4">{question}</p>
        <div className="grid grid-cols-2 gap-2">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`p-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                selected === null
                  ? "bg-white text-purple-900 border border-purple-200 hover:bg-purple-100"
                  : i === correct
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : selected === i
                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                  : "bg-white/50 text-purple-300 border border-purple-100 opacity-50"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {["Bingo Bíblico", "Mímica", "Sorteio"].map((game) => (
          <div key={game} className="p-2 bg-white border border-stone-200 rounded-xl text-stone-600 text-xs">
            {game}
          </div>
        ))}
      </div>
    </div>
  );
};

const FamiliaPreview = () => (
  <div className="space-y-3">
    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="w-4 h-4 text-rose-500" />
        <span className="text-rose-700 text-xs font-semibold">Missão da Semana</span>
      </div>
      <p className="text-stone-800 text-sm leading-relaxed">
        🙏 Rezem juntos o Pai Nosso antes do jantar e conversem sobre uma atitude de bondade que podem praticar esta semana.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <div className="flex -space-x-1">
          {["M", "P", "A"].map((l) => (
            <div key={l} className="w-5 h-5 rounded-full bg-white border border-rose-200 flex items-center justify-center text-[10px] text-rose-600 font-bold shadow-sm">{l}</div>
          ))}
        </div>
        <span className="text-stone-500 text-xs">3 famílias responderam</span>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {["Mural de Fotos", "Avisos", "Formulários", "Comunicados"].map((item) => (
        <div key={item} className="p-2.5 bg-white border border-stone-200 rounded-xl text-stone-600 text-xs flex items-center gap-1.5 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          {item}
        </div>
      ))}
    </div>
  </div>
);

const CalendarioPreview = () => {
  const events = [
    { date: "26 Mai", name: "Pentecostes", color: "bg-rose-50 text-rose-700 border-rose-200" },
    { date: "01 Jun", name: "Corpus Christi", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { date: "15 Jun", name: "SS. Trindade", color: "bg-white border-stone-200 text-stone-800" },
  ];
  return (
    <div className="space-y-3">
      <div className="p-3 bg-white border border-stone-200 rounded-xl shadow-sm">
        <p className="text-stone-400 text-xs uppercase tracking-widest mb-3 text-center font-bold">Próximas Solenidades</p>
        <div className="space-y-2">
          {events.map((ev) => (
            <div key={ev.name} className={`flex items-center gap-3 p-2.5 rounded-lg border ${ev.color}`}>
              <span className="text-xs font-mono font-bold opacity-70">{ev.date}</span>
              <span className="text-sm font-medium">{ev.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
        <p className="text-emerald-700 text-xs font-medium">🌿 Tempo Comum — Semana XXVI</p>
      </div>
    </div>
  );
};

const ComunicacaoPreview = () => (
  <div className="space-y-3">
    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-blue-500" />
        <span className="text-blue-700 text-xs font-semibold">Novo Comunicado</span>
      </div>
      <div className="space-y-2">
        <div className="h-2 bg-blue-200/50 rounded-full w-full" />
        <div className="h-2 bg-blue-200/50 rounded-full w-4/5" />
        <div className="h-2 bg-blue-200/50 rounded-full w-3/5" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="px-3 py-1.5 bg-blue-600 border border-blue-500 rounded-lg text-white text-xs shadow-sm">WhatsApp</div>
        <div className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-stone-500 text-xs">E-mail</div>
        <div className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-stone-500 text-xs">Push</div>
      </div>
    </div>
    <div className="flex items-center gap-2 text-stone-500 text-xs">
      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
    gradient: "from-amber-600 to-amber-400",
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
    gradient: "from-violet-600 to-purple-500",
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
    gradient: "from-rose-600 to-pink-500",
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
    gradient: "from-emerald-600 to-green-500",
    title: "Calendário Litúrgico",
    description: "Acompanhe o Ano Litúrgico e sincronize seus encontros com as solenidades da Igreja.",
    features: ["Ano litúrgico", "Cores do tempo", "Solenidades", "Integração com turmas"],
    previewContent: <CalendarioPreview />,
  },
  {
    id: "comunicacao",
    icon: <MessageSquare className="w-6 h-6" />,
    color: "#2563eb",
    gradient: "from-blue-600 to-indigo-500",
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
    className="relative cursor-pointer rounded-2xl overflow-hidden border border-stone-200 group bg-white shadow-sm hover:shadow-xl transition-all duration-300"
  >
    {/* Glow on hover */}
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
      style={{
        background: `radial-gradient(ellipse at top left, ${module.color}10 0%, transparent 70%)`,
      }}
    />

    {/* Top gradient accent */}
    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${module.gradient} opacity-80 group-hover:opacity-100 transition-opacity`} />

    <div className="relative p-6">
      {/* Icon + Badge */}
      <div className="flex items-start justify-between mb-5">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md"
          style={{ background: `linear-gradient(135deg, ${module.color}, ${module.color}cc)` }}
        >
          {module.icon}
        </div>
        {module.badge && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-sm"
            style={{
              color: module.color,
              borderColor: `${module.color}30`,
              background: `${module.color}10`,
            }}
          >
            {module.badge}
          </span>
        )}
      </div>

      {/* Content */}
      <h3 className="text-stone-800 font-bold text-lg mb-2">{module.title}</h3>
      <p className="text-stone-500 text-sm leading-relaxed mb-5">{module.description}</p>

      {/* Features */}
      <div className="flex flex-wrap gap-2">
        {module.features.slice(0, 3).map((f) => (
          <span key={f} className="text-[10px] px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-600 font-medium">
            {f}
          </span>
        ))}
        {module.features.length > 3 && (
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-600 font-medium">
            +{module.features.length - 3}
          </span>
        )}
      </div>

      {/* CTA */}
      <div className="mt-5 flex items-center gap-1.5 text-xs font-bold opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300" style={{ color: module.color }}>
        Ver demonstração <ChevronRight className="w-4 h-4" />
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
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative p-6 pb-5">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: `radial-gradient(ellipse at top left, ${module.color} 0%, transparent 70%)`,
            }}
          />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md"
                style={{ background: `linear-gradient(135deg, ${module.color}, ${module.color}cc)` }}
              >
                {module.icon}
              </div>
              <div>
                <h3 className="text-stone-800 font-bold text-xl">{module.title}</h3>
                <p className="text-stone-500 text-xs mt-0.5">{module.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors text-stone-500 shrink-0 ml-4"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${module.color}40, transparent)` }}
          />
        </div>

        {/* Modal Body — Preview */}
        <div className="px-6 pb-6 pt-2">
          <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-4">Visualização do módulo</p>
          {module.previewContent}
        </div>

        {/* Modal Footer */}
        <div className="px-6 pb-6 bg-stone-50/50 pt-4">
          <div
            className="h-px w-full mb-4"
            style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent)" }}
          />
          <p className="text-stone-500 text-xs text-center mb-4">
            Crie sua conta gratuita para acessar este módulo
          </p>
          <button
            onClick={() => { window.location.href = "/auth?view=signup"; }}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white relative overflow-hidden group shadow-md"
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
  { src: "/tela_1.jpg", label: "Bíblia Online" },
  { src: "/tela_2.jpg", label: "Relatórios" },
  { src: "/tela_3.jpg", label: "Jogos" },
  { src: "/tela_4.jpg", label: "Atividades" },
  { src: "/tela_5.jpg", label: "Turmas" },
];

const ScreenCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % screens.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-5xl mx-auto px-4 py-8">
      {/* Screens row */}
      <motion.div 
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, { offset }) => {
          if (offset.x < -50) {
            setCurrentIndex((prev) => (prev + 1) % screens.length);
          } else if (offset.x > 50) {
            setCurrentIndex((prev) => (prev - 1 + screens.length) % screens.length);
          }
        }}
        className="flex items-center justify-center gap-4 overflow-hidden py-8 cursor-grab active:cursor-grabbing relative h-[560px]"
      >
        {screens.map((screen, i) => {
          const offset = i - currentIndex;
          
          let normalizedOffset = offset;
          if (offset < -2) normalizedOffset += screens.length;
          if (offset > 2) normalizedOffset -= screens.length;
          
          const absOffset = Math.abs(normalizedOffset);
          const isCenter = normalizedOffset === 0;
          const isVisible = absOffset <= 2;

          return (
            <motion.div
              key={screen.src}
              animate={{
                scale: isCenter ? 1 : absOffset === 1 ? 0.9 : 0.8,
                opacity: isCenter ? 1 : absOffset === 1 ? 0.9 : 0.5,
                x: normalizedOffset * 180,
                zIndex: isCenter ? 10 : absOffset === 1 ? 5 : 1,
                rotateY: normalizedOffset * -5,
              }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className={`absolute rounded-3xl overflow-hidden shadow-2xl border border-stone-200 ${isVisible ? "" : "opacity-0 pointer-events-none"}`}
              style={{ width: 240, height: 500 }}
            >
              <img src={screen.src} alt={screen.label} className="w-full h-full object-cover bg-white pointer-events-none" />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {screens.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`rounded-full transition-all duration-300 ${
              i === currentIndex ? "w-6 h-2 bg-[#8C2A3C]" : "w-2 h-2 bg-stone-300 hover:bg-stone-400"
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
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    return scrollY.onChange((latest) => {
      setScrolled(latest > 20);
    });
  }, [scrollY]);

  const handleWhatsApp = () =>
    window.open("https://wa.me/5592993371259?text=Olá! Vim pelo site do iCatequese.", "_blank");

  return (
    <div className="min-h-screen bg-white text-stone-800 overflow-x-hidden font-sans selection:bg-[#8C2A3C]/20 selection:text-white">
      <PWAInstallChip />

      {/* Animated background orbs */}
      <div className="absolute top-0 left-0 w-full h-[600px] overflow-hidden pointer-events-none z-0">
        <div className="absolute w-[600px] h-[600px] -top-40 -left-40 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #f3e8ff 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute w-[500px] h-[500px] top-20 -right-20 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #ffe4e6 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #fef3c7 0%, transparent 70%)", filter: "blur(80px)" }} />
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 1.5} x={15 + i * 15} size={6 + (i % 3) * 4} />
        ))}
      </div>

      {/* ── NAVBAR ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-stone-200 shadow-sm bg-white">
              <AvatarImage src="/Avatar.png" alt="Avatar" />
              <AvatarFallback className="bg-purple-100 text-purple-900 text-xs font-bold">iC</AvatarFallback>
            </Avatar>
            <span className="text-xl font-bold tracking-tight text-stone-800">
              i<span className="text-[#8C2A3C]">Catequese</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            {/* Acesso Restrito Chip */}
            <Chip
              variant="restricted"
              onClick={() => navigate("/admin/login")}
              className="gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-stone-400" />
              Acesso Restrito
            </Chip>

            {/* Entrar */}
            <button
              onClick={() => navigate("/auth?view=login")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors duration-200"
            >
              <LogIn className="w-4 h-4" /> Entrar
            </button>

            {/* Cadastre-se — DESTAQUE */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/auth?view=signup")}
              className="relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white overflow-hidden group shadow-md"
              style={{
                background: "linear-gradient(135deg, #8C2A3C 0%, #b33a52 50%, #8C2A3C 100%)",
                boxShadow: "0 4px 14px 0 rgba(140, 42, 60, 0.39)",
              }}
            >
              {/* Shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <UserPlus className="w-4 h-4" />
              Cadastre-se grátis
              <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-bold border border-white/10">FREE</span>
            </motion.button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
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
              className="md:hidden border-t border-stone-200 overflow-hidden bg-white shadow-lg absolute top-full left-0 right-0"
            >
              <div className="px-6 py-5 space-y-4">
                <button onClick={() => navigate("/admin/login")}
                  className="flex items-center gap-2 text-stone-600 font-medium text-sm w-full p-2 hover:bg-stone-50 rounded-lg">
                  <Lock className="w-4 h-4" /> Acesso Restrito
                </button>
                <button onClick={() => navigate("/auth?view=login")}
                  className="flex items-center gap-2 text-stone-600 font-medium text-sm w-full p-2 hover:bg-stone-50 rounded-lg">
                  <LogIn className="w-4 h-4" /> Entrar na plataforma
                </button>
                <button
                  onClick={() => navigate("/auth?view=signup")}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white text-center shadow-md"
                  style={{ background: "linear-gradient(135deg, #8C2A3C, #b33a52)" }}
                >
                  Cadastre-se grátis
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 pt-40 pb-20 px-6 flex flex-col items-center text-center max-w-5xl mx-auto">
        {/* Top label */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase bg-amber-50 text-amber-700 border border-amber-200 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Evangelização e Organização
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6 text-stone-900"
        >
          A plataforma completa
          <br />
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(135deg, #8C2A3C 0%, #c93a56 100%)" }}
          >
            para catequistas
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-stone-600 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
        >
          Gerencie turmas, encontros, catequizandos e famílias em um só lugar. 
          Ferramentas litúrgicas modernas com alma pastoral.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          {/* Primary CTA — super destacado */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/auth?view=signup")}
            className="relative w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-base text-white overflow-hidden group shadow-lg"
            style={{
              background: "linear-gradient(135deg, #8C2A3C 0%, #c93a56 100%)",
              boxShadow: "0 10px 25px -5px rgba(140,42,60,0.4), 0 8px 10px -6px rgba(140,42,60,0.2)",
            }}
          >
            {/* Animated shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative flex items-center justify-center gap-2.5">
              <UserPlus className="w-5 h-5" />
              Cadastre-se — é grátis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>

          {/* Secondary CTA */}
          <button
            onClick={() => document.getElementById("modulos")?.scrollIntoView({ behavior: "smooth" })}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-sm text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-300 shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 text-stone-500" /> Ver os módulos
          </button>
        </motion.div>


      </section>

      {/* ── TELAS LADO A LADO — SLIDESHOW ── */}
      <section className="relative z-10 pb-20 pt-8 bg-white border-y border-stone-100">
        <div className="relative flex items-center justify-center overflow-hidden w-full">
          <ScreenCarousel />
        </div>

      </section>

      {/* ── MÓDULOS ── */}
      <section id="modulos" className="relative z-10 py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5 bg-purple-50 text-purple-700 border border-purple-100"
              >
                <Zap className="w-3.5 h-3.5" /> Módulos da Plataforma
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 mb-5 tracking-tight">
                Tudo para a sua <span className="text-[#8C2A3C]">Missão</span>
              </h2>
              <p className="text-stone-500 text-lg max-w-2xl mx-auto">
                Clique em um módulo para ver uma prévia interativa das ferramentas projetadas para facilitar seu dia a dia.
              </p>
            </motion.div>
          </div>

          {/* Module Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, i) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <ModuleCard module={module} onClick={() => setSelectedModule(module)} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IVC SECTION ── */}
      <section className="relative z-10 py-24 px-6 bg-[#FDFBF7] border-y border-stone-200">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 bg-white border border-stone-200 shadow-sm">
              <Cross className="w-4 h-4 text-[#8C2A3C]" />
              <span className="text-[#8C2A3C] text-xs font-bold uppercase tracking-widest">IVC</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 mb-6 leading-tight tracking-tight">
              Iniciação à<br />
              <span className="text-[#8C2A3C]">Vida Cristã</span>
            </h2>
            <p className="text-stone-600 text-lg leading-relaxed mb-8">
              A catequese não é apenas o ensino de uma doutrina, mas um{" "}
              <strong className="text-stone-900 font-bold">itinerário existencial</strong>. O paradigma catecumenal
              nos convida a mergulhar no mistério de Cristo através da liturgia, da palavra e da comunidade.
            </p>
            <ul className="space-y-4">
              {[
                "Acompanhamento pessoal e avaliações formativas.",
                "Sintonia com os tempos do Ano Litúrgico.",
                "Envolvimento ativo da família.",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-stone-700 font-medium">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl overflow-hidden border border-stone-200 shadow-2xl relative p-3 bg-white"
          >
            <div className="absolute inset-0 bg-stone-100 rounded-3xl -z-10 transform scale-105 opacity-50 blur-xl" />
            <img src="/acesso_conecta.jpg" alt="Acompanhamento Catequético" className="w-full h-auto rounded-2xl border border-stone-100" />
          </motion.div>
        </div>
      </section>
      {/* ── PLANOS ── */}
      <section className="relative z-10 py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 mb-5 tracking-tight">
              Planos e <span className="text-[#D4AF37]">Assinaturas</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6 items-stretch max-w-3xl mx-auto">
            {/* Gratuito */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-4 sm:p-8 rounded-2xl flex flex-col bg-stone-50 border border-stone-200 shadow-sm"
            >
              <h3 className="text-sm sm:text-2xl font-extrabold text-stone-800 mb-1 sm:mb-2">Uso Gratuito</h3>
              <div className="flex items-baseline gap-1 mb-3 sm:mb-6">
                <span className="text-2xl sm:text-6xl font-black text-stone-900">R$ 0</span>
              </div>
              <p className="hidden sm:block text-stone-600 mb-6 text-sm leading-relaxed flex-1">
                Acesso básico para organizar uma turma e conhecer as ferramentas fundamentais do iCatequese.
              </p>
              <ul className="space-y-2 sm:space-y-4 mb-4 sm:mb-8 flex-1">
                {["1 Turma ativa", "Mural básico", "Agenda", "Bíblia"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[10px] sm:text-sm font-medium text-stone-700">
                    <CheckCircle2 className="w-3 h-3 sm:w-5 sm:h-5 text-stone-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/auth?view=signup")}
                className="mt-auto w-full py-2 sm:py-4 rounded-lg border-2 border-stone-300 text-stone-700 font-bold hover:border-stone-400 hover:bg-stone-100 transition-all text-xs sm:text-base"
              >
                Grátis
              </button>
            </motion.div>

            {/* Premium */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-4 sm:p-8 rounded-2xl flex flex-col relative overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #6b1e2c 0%, #8C2A3C 100%)",
                boxShadow: "0 10px 20px -5px rgba(140, 42, 60, 0.4)",
              }}
            >
              <div className="flex items-center gap-1 sm:gap-3 mb-1 sm:mb-6">
                <h3 className="text-sm sm:text-2xl font-extrabold text-white">Premium</h3>
              </div>
              <div className="flex items-baseline gap-1 mb-3 sm:mb-6">
                <span className="text-2xl sm:text-6xl font-black text-white">14,90</span>
                <span className="text-[#D4AF37] text-[10px] sm:text-sm uppercase tracking-widest font-bold">/ano</span>
              </div>
              <p className="hidden sm:block text-white/80 mb-6 text-sm leading-relaxed flex-1">
                Acesso integral a todos os recursos. Uma contribuição mínima para manter a plataforma viva.
              </p>
              <ul className="space-y-2 sm:space-y-4 mb-4 sm:mb-8 flex-1 relative z-10">
                {[
                  "Ilimitado",
                  "Jogos Interativos",
                  "Missões",
                  "Relatórios",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[10px] sm:text-sm font-medium text-white">
                    <CheckCircle2 className="w-3 h-3 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/auth?view=signup")}
                className="mt-auto w-full py-2 sm:py-4 rounded-lg font-black text-xs sm:text-base text-[#2C241B] relative z-10 overflow-hidden shadow-xl"
                style={{ background: "linear-gradient(135deg, #D4AF37, #f0cc5a)" }}
              >
                Assinar
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL E FOOTER ── */}
      <footer className="relative z-10 py-6 px-6 bg-white border-t border-stone-200">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10 border border-stone-200 shadow-sm">
              <AvatarImage src="/Avatar.png" alt="Rickson Amazonas" />
              <AvatarFallback>RA</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-bold text-stone-800">Rickson Amazonas</p>
              <p className="text-[10px] text-stone-500 uppercase tracking-widest font-semibold mt-0.5">Catequista e Idealizador do iCatequese</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleWhatsApp}
              className="px-5 py-2 rounded-lg border border-stone-200 text-stone-600 text-xs font-bold hover:border-stone-300 hover:bg-stone-50 transition-all"
            >
              Contato WhatsApp
            </button>
            <div className="hidden sm:block text-[10px] font-medium text-stone-400 uppercase tracking-widest">
              © {new Date().getFullYear()} iCatequese.
            </div>
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
