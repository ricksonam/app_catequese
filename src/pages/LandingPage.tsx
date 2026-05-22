import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Lock, Sparkles, BookOpen, Flame, Map,
  Heart, Users, CheckCircle2,
  Book, ScrollText, Cross
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PWAInstallChip } from "@/components/Onboarding/PWAInstallChip";

/* ─── Ornamento SVG de cruz (Simplificado) ─── */
const CrossOrnament = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 60 60" className={className} fill="currentColor">
    <rect x="28" y="10" width="4" height="40" rx="1" />
    <rect x="15" y="24" width="30" height="4" rx="1" />
  </svg>
);

/* ─── Separador ornamental ─── */
const OrnamentalDivider = () => (
  <div className="flex items-center gap-4 justify-center my-10">
    <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-[#8C2A3C]/40" />
    <CrossOrnament className="w-5 h-5 text-[#8C2A3C]" />
    <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-[#8C2A3C]/40" />
  </div>
);

const TIMELINE = [
  { year: "1992", title: "Catecismo da Igreja Católica", desc: "Apresenta a síntese orgânica e essencial da fé católica.", icon: Book },
  { year: "1997", title: "Diretório Geral para a Catequese", desc: "Orientações fundamentais para a ação catequética no mundo.", icon: ScrollText },
  { year: "2005", title: "Diretório Nacional de Catequese", desc: "Documento 84 da CNBB, adaptando as diretrizes para a realidade do Brasil.", icon: Map },
  { year: "2007", title: "Documento de Aparecida", desc: "O impulso missionário e a urgência de formar discípulos missionários.", icon: Flame },
  { year: "2017", title: "Iniciação à Vida Cristã (Doc 107)", desc: "A catequese de inspiração catecumenal no Brasil.", icon: Cross },
  { year: "2020", title: "Novo Diretório para a Catequese", desc: "A catequese no contexto da nova evangelização e cultura digital.", icon: BookOpen },
  { year: "2021", title: "Antiquum Ministerium", desc: "Instituição formal do Ministério de Catequista pelo Papa Francisco.", icon: Users },
];

export default function LandingPage() {
  const navigate = useNavigate();

  const handleWhatsApp = () =>
    window.open("https://wa.me/5592993371259?text=Olá! Vim pelo site do iCatequese.", "_blank");

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 overflow-x-hidden font-sans selection:bg-[#8C2A3C]/20">
      <PWAInstallChip />

      {/* ── NAVBAR Clássica ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-stone-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#8C2A3C] flex items-center justify-center shadow-sm">
              <img src="/app-logo.png" alt="Logo" className="w-6 h-6 object-contain brightness-0 invert" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#8C2A3C] font-liturgical">iCatequese</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin/login")}
              className="hidden sm:flex items-center gap-1.5 text-stone-500 hover:text-[#8C2A3C] font-semibold text-sm transition-colors"
            >
              <Lock className="h-4 w-4" /> Restrito
            </button>
            <button
              onClick={() => navigate("/auth?view=login")}
              className="px-6 py-2 rounded bg-[#8C2A3C] text-white text-sm font-semibold hover:bg-[#6b1e2c] transition-colors"
            >
              Acessar Plataforma
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO Solene ── */}
      <section className="relative z-10 pt-40 pb-24 px-6 flex flex-col items-center text-center max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <span className="text-[#8C2A3C] text-xs font-bold tracking-[0.2em] uppercase border-b border-[#8C2A3C]/30 pb-1">
            Evangelização e Organização
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-5xl sm:text-6xl text-[#2C241B] mb-8 font-liturgical leading-tight"
        >
          Formando discípulos.<br/>
          <span className="text-[#8C2A3C] italic">Organizando a missão.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-lg text-stone-600 max-w-2xl leading-relaxed mb-12"
        >
          Muito mais que um diário de classe. Um ecossistema digital elegante e sereno para apoiar catequistas no processo de Iniciação à Vida Cristã.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <button
            onClick={() => navigate("/auth?view=signup")}
            className="w-full sm:w-auto px-10 py-3.5 rounded bg-[#8C2A3C] font-bold text-sm uppercase tracking-widest text-white hover:bg-[#6b1e2c] transition-colors shadow-md"
          >
            Criar conta gratuita
          </button>
          <button
            onClick={() => {
              document.getElementById("recursos")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="w-full sm:w-auto px-10 py-3.5 rounded font-bold text-sm uppercase tracking-widest text-stone-700 bg-transparent border border-stone-300 hover:border-[#8C2A3C] hover:text-[#8C2A3C] transition-colors"
          >
            Conhecer as Ferramentas
          </button>
        </motion.div>
      </section>

      {/* ── IMAGEM DE DESTAQUE ── */}
      <section className="relative px-6 max-w-5xl mx-auto mb-24">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-stone-200"
        >
          <img src="/card_encontros.jpg" alt="Dashboard iCatequese" className="w-full h-auto object-cover" />
        </motion.div>
      </section>

      {/* ── IVC SECTION Clássica ── */}
      <section className="py-20 px-6 bg-white border-y border-stone-100">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <Cross className="w-8 h-8 text-[#8C2A3C] mb-6" strokeWidth={1.5} />
            <h2 className="text-3xl sm:text-4xl text-[#2C241B] mb-6 font-liturgical">
              Iniciação à Vida Cristã
            </h2>
            <p className="text-stone-600 leading-relaxed mb-6">
              A catequese não é apenas o ensino de uma doutrina, mas um <strong>itinerário existencial</strong>. O paradigma catecumenal nos convida a mergulhar no mistério de Cristo através da liturgia, da palavra e da comunidade.
            </p>
            <p className="text-stone-600 leading-relaxed mb-8">
              O iCatequese foi construído à luz do Documento 107 da CNBB e do Novo Diretório para a Catequese. Oferecemos ferramentas para acompanhar verdadeiramente o crescimento espiritual, unindo família, catequista e comunidade.
            </p>
            <ul className="space-y-3">
              {[
                "Acompanhamento pessoal e avaliações formativas.",
                "Sintonia com os tempos do Ano Litúrgico.",
                "Envolvimento ativo da família."
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-stone-700">
                  <CheckCircle2 className="w-5 h-5 text-[#8C2A3C] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative p-2 bg-[#FDFBF7] border border-stone-200 rounded-xl shadow-inner">
            <img src="/acesso_conecta.jpg" alt="Acompanhamento Catequético" className="rounded-lg shadow-md border border-stone-100 w-full" />
          </div>
        </div>
      </section>

      {/* ── RECURSOS (Alternados, estilo clássico) ── */}
      <section id="recursos" className="py-24 px-6 bg-[#FDFBF7]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl text-[#2C241B] mb-4 font-liturgical">Tudo para a sua Missão</h2>
            <p className="text-stone-500 max-w-2xl mx-auto text-lg">Um arsenal de ferramentas modernas com uma alma litúrgica e serena.</p>
            <OrnamentalDivider />
          </div>

          <div className="space-y-24">
            {/* Recurso 1: Encontros */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 relative p-2 bg-white border border-stone-200 rounded-xl shadow-sm">
                <img src="/acesso_agenda.jpg" alt="Gestão de Encontros" className="rounded-lg border border-stone-100" />
              </div>
              <div className="order-1 md:order-2">
                <BookOpen className="w-8 h-8 text-[#8C2A3C] mb-4" strokeWidth={1.5} />
                <h3 className="text-2xl text-[#2C241B] font-liturgical mb-4">Gestão de Encontros</h3>
                <p className="text-stone-600 leading-relaxed">
                  Planeje cada etapa, registre presenças com facilidade e faça anotações pastorais. Mantenha o diário de classe organizado e tenha todo o histórico da turma em um só lugar.
                </p>
              </div>
            </div>

            {/* Recurso 2: Bíblia */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Flame className="w-8 h-8 text-[#D4AF37] mb-4" strokeWidth={1.5} />
                <h3 className="text-2xl text-[#2C241B] font-liturgical mb-4">Sagrada Escritura</h3>
                <p className="text-stone-600 leading-relaxed">
                  Tenha a Bíblia sempre à mão. Acesse passagens rapidamente durante o encontro, crie destaques e utilize roletas de sorteio para incentivar os catequizandos a lerem a Palavra de Deus de forma dinâmica.
                </p>
              </div>
              <div className="relative p-2 bg-white border border-stone-200 rounded-xl shadow-sm">
                <img src="/acesso_biblia.jpg" alt="Bíblia e Citações" className="rounded-lg border border-stone-100" />
              </div>
            </div>

            {/* Recurso 3: Família */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 relative p-2 bg-white border border-stone-200 rounded-xl shadow-sm flex justify-center py-10">
                <img src="/icone-catequese em familia.png" alt="Catequese em Família" className="rounded-lg max-h-64 object-contain" />
              </div>
              <div className="order-1 md:order-2">
                <Heart className="w-8 h-8 text-[#8C2A3C] mb-4" strokeWidth={1.5} />
                <h3 className="text-2xl text-[#2C241B] font-liturgical mb-4">Apoio às Famílias</h3>
                <p className="text-stone-600 leading-relaxed">
                  A catequese acontece primeiro no lar. Envie missões semanais, avisos e envolva os pais no crescimento espiritual dos filhos com murais interativos e comunicados.
                </p>
              </div>
            </div>

            {/* Recurso 4: Jogos */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Sparkles className="w-8 h-8 text-[#D4AF37] mb-4" strokeWidth={1.5} />
                <h3 className="text-2xl text-[#2C241B] font-liturgical mb-4">Dinâmicas e Jogos</h3>
                <p className="text-stone-600 leading-relaxed">
                  Aprender brincando também é evangelizar. Uma biblioteca exclusiva de jogos como Bingo Bíblico, Mímica e Quiz, pensados para reforçar o ensinamento de forma leve e alegre.
                </p>
              </div>
              <div className="relative p-2 bg-white border border-stone-200 rounded-xl shadow-sm">
                <img src="/acesso_jogos.jpg" alt="Jogos Interativos" className="rounded-lg border border-stone-100" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TIMELINE DA CATEQUESE ── */}
      <section className="py-20 px-6 bg-white border-y border-stone-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl text-[#2C241B] mb-4 font-liturgical">O Magistério e a Catequese</h2>
            <p className="text-stone-500 text-lg">Caminhando em sintonia com a Igreja Universal.</p>
          </div>

          <div className="relative border-l border-stone-300 ml-4 md:ml-1/2 md:-translate-x-[0.5px]">
            {TIMELINE.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className={`relative pl-8 md:pl-0 mb-10 md:w-1/2 ${idx % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12 md:ml-auto"}`}>
                  <div className={`absolute top-0 -left-[17px] md:-translate-x-1/2 md:left-auto ${idx % 2 === 0 ? "md:right-[-17px]" : "md:left-0"} w-8 h-8 bg-[#FDFBF7] border-2 border-[#8C2A3C] rounded-full flex items-center justify-center z-10`}>
                    <Icon className="w-4 h-4 text-[#8C2A3C]" />
                  </div>
                  <div>
                    <span className="inline-block text-[#D4AF37] text-sm font-bold tracking-widest mb-1">
                      {item.year}
                    </span>
                    <h4 className="text-lg text-[#2C241B] mb-1 font-liturgical">{item.title}</h4>
                    <p className="text-stone-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PLANOS E PREÇOS Clássicos ── */}
      <section className="py-24 px-6 bg-[#FDFBF7]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <OrnamentalDivider />
            <h2 className="text-3xl sm:text-4xl text-[#2C241B] mb-4 font-liturgical">Planos e Assinaturas</h2>
            <p className="text-stone-500 text-lg">Escolha como apoiar e estruturar a sua missão.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* PLANO GRATUITO */}
            <div className="p-10 bg-white border border-stone-200 rounded-sm shadow-sm flex flex-col relative">
              <h3 className="text-2xl text-[#2C241B] mb-2 font-liturgical">Uso Gratuito</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl text-[#2C241B]">R$ 0</span>
              </div>
              <p className="text-stone-600 mb-8 flex-1 text-sm leading-relaxed">
                Acesso básico para organizar uma turma e conhecer as ferramentas fundamentais.
              </p>
              <ul className="space-y-3 mb-10">
                {[
                  "1 Turma ativa",
                  "Mural de fotos básico",
                  "Agenda de encontros",
                  "Acesso restrito a jogos"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-stone-700">
                    <CheckCircle2 className="w-4 h-4 text-stone-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/auth?view=signup")}
                className="w-full py-3 rounded border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors"
              >
                Começar de Graça
              </button>
            </div>

            {/* PLANO PREMIUM */}
            <div className="p-10 bg-[#8C2A3C] text-white rounded-sm shadow-lg flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <CrossOrnament className="w-32 h-32 text-white" />
              </div>
              <h3 className="text-2xl text-white mb-2 font-liturgical">Acesso Premium</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl text-white">R$ 14,90</span>
                <span className="text-[#D4AF37] text-sm uppercase tracking-widest">/ano</span>
              </div>
              <p className="text-white/80 mb-8 flex-1 text-sm leading-relaxed">
                Acesso integral aos recursos premium. Uma contribuição mínima para manter a plataforma viva.
              </p>
              <ul className="space-y-3 mb-10 relative z-10">
                {[
                  "Turmas Ilimitadas",
                  "Catequizandos Ilimitados",
                  "Acesso a todos os Jogos Interativos",
                  "Missões em Família e Formulários",
                  "Relatórios Completos de Turma",
                  "Suporte Prioritário"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-white">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/auth?view=signup")}
                className="w-full py-3 rounded bg-[#D4AF37] text-[#2C241B] text-xs font-bold uppercase tracking-widest hover:bg-[#c49d29] transition-colors relative z-10"
              >
                Assinar Premium
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-stone-200 py-12 px-6 bg-white text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <CrossOrnament className="w-6 h-6 text-stone-300 mb-6" />
          <h2 className="text-2xl text-[#8C2A3C] font-liturgical mb-2">iCatequese</h2>
          <p className="text-xs text-stone-400 font-bold uppercase tracking-[0.2em] mb-8">Ad maiorem Dei gloriam</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-stone-200">
                <AvatarImage src="/Avatar.png" alt="Rickson Amazonas" />
                <AvatarFallback>RA</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-bold text-stone-700">Rickson Amazonas</p>
                <p className="text-[10px] text-stone-500 uppercase tracking-widest">Criador & Catequista</p>
              </div>
            </div>
            <button 
              onClick={handleWhatsApp} 
              className="px-5 py-2 border border-[#8C2A3C] text-[#8C2A3C] text-xs font-bold uppercase tracking-widest rounded hover:bg-[#8C2A3C] hover:text-white transition-colors"
            >
              Contato WhatsApp
            </button>
          </div>
          
          <div className="text-[10px] text-stone-400 uppercase tracking-widest">
            © {new Date().getFullYear()} iCatequese. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
