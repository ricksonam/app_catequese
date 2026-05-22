import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  LogIn, Lock, Sparkles, BookOpen, Flame, Map,
  Heart, Users, CheckCircle2, ChevronRight,
  Book, BookMarked, ScrollText, Cross
} from "lucide-react";
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
  <div className="flex items-center gap-3 justify-center my-6">
    <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-[#D4AF37]/60" />
    <CrossOrnament className="w-5 h-5 text-[#D4AF37]/80" />
    <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-[#D4AF37]/60" />
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
  const { scrollYProgress } = useScroll();
  const headerY = useTransform(scrollYProgress, [0, 0.05], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  const handleWhatsApp = () =>
    window.open("https://wa.me/5592993371259?text=Olá! Vim pelo site do iCatequese.", "_blank");

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 overflow-x-hidden font-sans selection:bg-[#D4AF37]/30">
      <PWAInstallChip />

      {/* ── BG ornamental ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white" />
        {[
          { top: "8%", left: "6%", s: 0.7, o: 0.08 },
          { top: "12%", right: "8%", s: 0.5, o: 0.05 },
          { top: "55%", left: "3%", s: 0.6, o: 0.06 },
          { top: "60%", right: "5%", s: 0.8, o: 0.07 },
          { top: "85%", left: "12%", s: 0.4, o: 0.05 },
          { top: "80%", right: "10%", s: 0.5, o: 0.06 },
        ].map((p, i) => (
          <CrossOrnament
            key={i}
            className="absolute text-blue-900 w-16 h-16"
            style={{ top: p.top, left: (p as any).left, right: (p as any).right, opacity: p.o, transform: `scale(${p.s})` }}
          />
        ))}
      </div>

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/70 backdrop-blur-xl border border-stone-200/50 rounded-2xl px-5 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-inner">
              <img src="/app-logo.png" alt="Logo" className="w-7 h-7 object-contain brightness-0 invert" />
            </div>
            <span className="text-xl font-black tracking-tighter text-blue-950 font-liturgical">iCatequese</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/login")}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-stone-500 hover:text-stone-900 font-bold text-sm transition-colors"
            >
              <Lock className="h-4 w-4" /> Acesso Restrito
            </button>
            <button
              onClick={() => navigate("/auth?view=login")}
              className="px-6 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95"
            >
              Entrar
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 pt-40 pb-20 px-5 flex flex-col items-center text-center max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 text-[#B8860B] text-xs font-bold tracking-widest uppercase mb-8 border border-[#D4AF37]/20">
          <Sparkles className="w-4 h-4" /> A plataforma da nova evangelização
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-5xl sm:text-7xl font-black tracking-tighter text-blue-950 mb-6 font-liturgical leading-[1.1]"
        >
          Formando discípulos.<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
            Organizando a missão.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-lg sm:text-xl text-stone-500 max-w-2xl font-medium mb-10 leading-relaxed"
        >
          Muito mais que um diário de classe. Um verdadeiro ecossistema digital para apoiar catequistas no processo de Iniciação à Vida Cristã.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <button
            onClick={() => navigate("/auth?view=signup")}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 transition-all hover:-translate-y-1 bg-gradient-to-br from-blue-600 to-blue-800"
          >
            Criar conta gratuita
          </button>
          <button
            onClick={() => {
              document.getElementById("ivc")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-blue-950 bg-white border border-stone-200 hover:border-blue-300 transition-all"
          >
            Conhecer mais
          </button>
        </motion.div>
      </section>

      {/* ── IMAGEM DE DESTAQUE / MOCKUP ── */}
      <section className="relative z-10 px-5 max-w-6xl mx-auto -mt-10 mb-32">
        <motion.div 
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative rounded-[2.5rem] bg-stone-900 p-2 sm:p-4 shadow-2xl border border-stone-800"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-[2.5rem] pointer-events-none" />
          <div className="rounded-[2rem] overflow-hidden bg-stone-100 aspect-[16/10] sm:aspect-[21/9] relative">
            {/* Imagem representativa do Dashboard */}
            <img src="/card_encontros.jpg" alt="Dashboard iCatequese" className="w-full h-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 to-transparent" />
          </div>
        </motion.div>
      </section>

      {/* ── IVC SECTION ── */}
      <section id="ivc" className="relative z-10 py-24 px-5 bg-white border-y border-stone-100">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8">
              <Cross className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-blue-950 mb-6 font-liturgical">
              Iniciação à Vida Cristã
            </h2>
            <p className="text-lg text-stone-600 leading-relaxed mb-6">
              A catequese não é apenas o ensino de uma doutrina, mas um <strong>itinerário existencial</strong>. O paradigma catecumenal nos convida a mergulhar no mistério de Cristo através da liturgia, da palavra e da comunidade.
            </p>
            <p className="text-stone-500 leading-relaxed mb-8">
              O <span className="font-bold text-blue-600">iCatequese</span> foi desenhado com base no Documento 107 da CNBB e no Novo Diretório para a Catequese. Ele oferece ferramentas não apenas para "dar aula", mas para acompanhar verdadeiramente o crescimento espiritual de cada catequizando.
            </p>
            <ul className="space-y-4">
              {[
                "Acompanhamento personalizado por catequizando.",
                "Integração com o calendário litúrgico.",
                "Envolvimento direto das famílias na catequese."
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  <span className="text-stone-700 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-amber-50 rounded-[3rem] transform rotate-3 scale-105" />
            <img src="/mural_de_fotos.png" alt="Mural Catequese" className="relative rounded-[3rem] shadow-xl border border-white" />
            
            {/* Card flutuante */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }}
              className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-2xl border border-stone-100 max-w-[240px]"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500 font-bold uppercase">Famílias</p>
                  <p className="font-black text-stone-900">Engajadas</p>
                </div>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">Conecte os pais através de missões e painéis interativos.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── BENTO GRID (MÓDULOS) ── */}
      <section className="relative z-10 py-32 px-5 bg-[#faf9f6]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-blue-950 mb-4 font-liturgical">Tudo que sua paróquia precisa</h2>
            <p className="text-stone-500 max-w-2xl mx-auto text-lg">Um arsenal de ferramentas modernas para encantar catequizandos e organizar sua pastoral.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card Grande 1 */}
            <motion.div whileHover={{ y: -5 }} className="md:col-span-2 bg-white rounded-[2rem] p-8 sm:p-10 border border-stone-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 transition-colors group-hover:bg-blue-100" />
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                <BookOpen className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-stone-900 mb-3 relative z-10">Gestão de Encontros</h3>
              <p className="text-stone-500 mb-8 max-w-md relative z-10">Planeje cada etapa, registre presenças com um clique, faça avaliações qualitativas e apresente o conteúdo em modo focado na TV ou Datashow.</p>
              <img src="/acesso_agenda.jpg" alt="Agenda" className="rounded-xl shadow-lg border border-stone-100 relative z-10 transform group-hover:scale-105 group-hover:-rotate-1 transition-transform duration-500" />
            </motion.div>

            {/* Card Pequeno 1 */}
            <motion.div whileHover={{ y: -5 }} className="bg-white rounded-[2rem] p-8 border border-stone-200 shadow-sm relative overflow-hidden">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                <Flame className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-black text-stone-900 mb-3">Bíblia e Citações</h3>
              <p className="text-stone-500 mb-6">Acesse as passagens bíblicas rapidamente e crie roletas de sorteio de leitura para a turma.</p>
              <div className="aspect-square bg-stone-50 rounded-xl overflow-hidden border border-stone-100 p-2">
                <img src="/acesso_jogos.jpg" alt="Jogos" className="w-full h-full object-cover rounded-lg" />
              </div>
            </motion.div>

            {/* Card Pequeno 2 */}
            <motion.div whileHover={{ y: -5 }} className="bg-white rounded-[2rem] p-8 border border-stone-200 shadow-sm relative overflow-hidden">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-black text-stone-900 mb-3">Catequese em Família</h3>
              <p className="text-stone-500">Envie missões, avisos e envolva os pais no crescimento espiritual dos filhos.</p>
            </motion.div>

            {/* Card Grande 2 */}
            <motion.div whileHover={{ y: -5 }} className="md:col-span-2 bg-gradient-to-br from-stone-900 to-blue-950 rounded-[2rem] p-8 sm:p-10 border border-stone-800 shadow-xl relative overflow-hidden group">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                <Sparkles className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Jogos Interativos</h3>
              <p className="text-stone-300 mb-8 max-w-md">Uma biblioteca exclusiva de jogos como Bingo Bíblico, Mímica, Sorteio de Nomes e Quiz, pensados para ensinar brincando.</p>
              <div className="flex gap-4 opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="w-1/2 rounded-xl overflow-hidden border border-white/20"><img src="/acesso_jogos.jpg" alt="Jogos" /></div>
                <div className="w-1/2 rounded-xl overflow-hidden border border-white/20"><img src="/mural_de_fotos.png" alt="Mural" /></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TIMELINE DA CATEQUESE ── */}
      <section className="relative z-10 py-24 px-5 bg-white border-y border-stone-100 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <CrossOrnament className="w-8 h-8 text-[#D4AF37] mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-black text-blue-950 mb-4 font-liturgical">O Magistério e a Catequese</h2>
            <p className="text-stone-500 text-lg">Caminhando em sintonia com a Igreja Universal.</p>
          </div>

          <div className="relative border-l-2 border-blue-100 ml-4 sm:ml-1/2 sm:-translate-x-[1px]">
            {TIMELINE.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div 
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  key={idx} 
                  className={`relative pl-8 sm:pl-0 mb-12 sm:w-1/2 ${idx % 2 === 0 ? "sm:pr-12 sm:text-right" : "sm:pl-12 sm:ml-auto"}`}
                >
                  <div className={`absolute top-0 -left-[29px] sm:-translate-x-1/2 sm:left-auto ${idx % 2 === 0 ? "sm:right-[-29px]" : "sm:left-0"} w-14 h-14 bg-white border-4 border-blue-50 rounded-full flex items-center justify-center z-10 shadow-sm`}>
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="bg-[#faf9f6] p-6 rounded-2xl border border-stone-200 hover:border-blue-300 transition-colors shadow-sm">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-black uppercase tracking-widest rounded-full mb-3">
                      {item.year}
                    </span>
                    <h4 className="text-xl font-black text-stone-900 mb-2 font-liturgical">{item.title}</h4>
                    <p className="text-stone-600 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PLANOS E PREÇOS ── */}
      <section className="relative z-10 py-32 px-5 bg-[#faf9f6]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <OrnamentalDivider />
            <h2 className="text-3xl sm:text-4xl font-black text-blue-950 mb-4 font-liturgical">Planos e Assinaturas</h2>
            <p className="text-stone-500 text-lg">Escolha o plano ideal para a sua missão.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* PLANO GRATUITO */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-8 sm:p-10 rounded-[2.5rem] bg-white border border-stone-200 shadow-sm flex flex-col"
            >
              <h3 className="text-2xl font-black text-stone-900 mb-2 font-liturgical">Plano Grátis</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-black text-stone-900">R$ 0</span>
              </div>
              <p className="text-stone-500 mb-8 flex-1">
                Acesso básico para você organizar sua turma e conhecer a plataforma.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "1 Turma ativa",
                  "Mural de fotos básico",
                  "Agenda da turma",
                  "Acesso restrito a jogos"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-stone-700 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-stone-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/auth?view=signup")}
                className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                Começar de Graça
              </button>
            </motion.div>

            {/* PLANO PREMIUM */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-8 sm:p-10 rounded-[2.5rem] bg-gradient-to-b from-blue-600 to-blue-900 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden flex flex-col border border-blue-500/50"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
              <div className="absolute top-6 right-6 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-stone-900 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Recomendado
              </div>

              <h3 className="text-2xl font-black text-white mb-2 font-liturgical">Premium Anual</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-black text-white">R$ 14,90</span>
                <span className="text-blue-200 font-bold uppercase tracking-widest">/ano</span>
              </div>
              <p className="text-blue-100 mb-8 flex-1 relative z-10">
                Acesso vitalício aos módulos premium. O melhor custo-benefício para catequistas dedicados.
              </p>
              <ul className="space-y-4 mb-8 relative z-10">
                {[
                  "Turmas Ilimitadas",
                  "Catequizandos Ilimitados",
                  "Acesso a todos os Jogos Interativos",
                  "Missões em Família e Formulários",
                  "Relatórios Completos de Turma",
                  "Suporte Técnico Prioritário"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-white font-medium">
                    <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/auth?view=signup")}
                className="relative z-10 w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-stone-900 bg-gradient-to-r from-[#FFDF00] to-[#D4AF37] hover:brightness-110 shadow-xl transition-all hover:scale-[1.02] active:scale-95"
              >
                Assinar Premium Agora
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-stone-200 py-16 px-5 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <img src="/app-logo.png" alt="Logo" className="w-7 h-7 object-contain brightness-0 invert" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter text-blue-950 font-liturgical block">iCatequese</span>
              <span className="text-xs text-stone-500 font-bold uppercase tracking-widest">Ad maiorem Dei gloriam</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-3 text-left bg-stone-50 p-3 rounded-2xl border border-stone-100">
              <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                <AvatarImage src="/Avatar.png" alt="Rickson Amazonas" />
                <AvatarFallback>RA</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-black text-stone-900">Rickson Amazonas</p>
                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Criador & Catequista</p>
              </div>
            </div>
            
            <button 
              onClick={handleWhatsApp} 
              className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              Falar no WhatsApp
            </button>
          </div>
        </div>
        <div className="text-center mt-16 text-[10px] font-black text-stone-400 uppercase tracking-widest">
          © {new Date().getFullYear()} iCatequese. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
