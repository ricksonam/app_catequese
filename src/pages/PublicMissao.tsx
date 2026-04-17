import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Heart, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import Spinner from "@/components/ui/spinner";
import { categoriasMissao } from "@/lib/missoesTemplates";
import { Button } from "@/components/ui/button";

export default function PublicMissao() {
  const { codigo } = useParams();
  const [concluidaAnim, setConcluidaAnim] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Checks local storage to see if this device already completed it
  useEffect(() => {
    if (codigo) {
      const mark = localStorage.getItem(`missao_concluida_${codigo}`);
      if (mark) setHasCompleted(true);
    }
  }, [codigo]);

  const { data: missao, isLoading, error } = useQuery({
    queryKey: ["public_missao", codigo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missoes_familia")
        .select(`
          *,
          turma:turmas(nome, comunidade_nome)
        `)
        .eq("codigo_compartilhamento", codigo)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!codigo,
  });

  const concluirMissao = useMutation({
    mutationFn: async () => {
      if (hasCompleted) return; // Prevent double trigger
      const { error } = await supabase.rpc("incrementar_missao_concluida", { p_codigo: codigo });
      if (error) throw error;
    },
    onSuccess: () => {
      setHasCompleted(true);
      if (codigo) localStorage.setItem(`missao_concluida_${codigo}`, "true");
      setConcluidaAnim(true);
      
      // Joyful confetti animation!
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#f43f5e', '#ec4899', '#8b5cf6']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f43f5e', '#ec4899', '#8b5cf6']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF0F5] flex flex-col items-center justify-center p-6">
        <Spinner size="lg" text="Preparando missão..." />
      </div>
    );
  }

  if (error || !missao) {
    return (
      <div className="min-h-screen bg-[#FFF0F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 text-slate-300">
           <AlertCircle className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Missão Indisponível</h1>
        <p className="text-slate-500 max-w-xs">Parece que este link expirou ou está incorreto. Verifique com seu catequista.</p>
      </div>
    );
  }

  const catObj = categoriasMissao.find(c => c.id === missao.categoria) || categoriasMissao[0];
  const isConcluidaVisible = hasCompleted || concluidaAnim;

  return (
    <div className="min-h-screen bg-[#FFF0F5] pt-12 pb-24 px-6 flex flex-col items-center">
      
      {/* Floating Header */}
      <div className="text-center mb-8 animate-fade-in">
         <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-2">Missão em Família</p>
         <h2 className="text-lg font-bold text-slate-700">Turma {missao.turma?.nome}</h2>
         {missao.turma?.comunidade_nome && (
           <p className="text-xs text-slate-500 font-medium">Comunidade {missao.turma.comunidade_nome}</p>
         )}
      </div>

      {/* Main Mission Card */}
      <div className="w-full max-w-sm bg-white rounded-[40px] shadow-2xl shadow-rose-500/10 p-8 text-center relative mt-8 animate-float-up">
         
         {/* Top Icon */}
         <div className={`absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-[28px] ${catObj.color} text-white flex items-center justify-center shadow-lg shadow-${catObj.color}/30 transform rotate-3`}>
           <Heart className="h-10 w-10 fill-white" />
         </div>

         <div className="mt-10">
           <h3 className={`text-sm font-black ${catObj.textClass} uppercase tracking-widest mb-4 inline-block px-3 py-1 bg-${catObj.color}/10 rounded-full`}>
             {catObj.label}
           </h3>
           
           <h1 className="text-3xl font-black text-slate-800 leading-tight mb-4 tracking-tight">
             {missao.titulo}
           </h1>

           <div className="w-12 h-1 bg-slate-100 mx-auto rounded-full mb-6" />

           <p className="text-slate-600 font-medium text-lg leading-relaxed mix-blend-multiply">
             {missao.descricao}
           </p>
         </div>

      </div>

      {/* Completion Action */}
      <div className="mt-12 w-full max-w-sm flex flex-col items-center">
        {isConcluidaVisible ? (
          <div className="bg-emerald-500 text-white rounded-3xl p-6 w-full text-center shadow-xl shadow-emerald-500/20 animate-fade-in transform transition-all">
             <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
               <CheckCircle2 className="h-10 w-10" />
             </div>
             <h3 className="text-2xl font-black mb-1">Incrível!</h3>
             <p className="text-emerald-50 font-medium">Missão cumprida e coração cheio! O catequista já foi avisado.</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-bold text-slate-500 mb-4 animate-pulse">Quando finalizarem, apertem aqui 👇</p>
            <Button
              onClick={() => concluirMissao.mutate()}
              disabled={concluirMissao.isPending}
              className={`w-full h-20 rounded-[32px] text-xl font-black text-white shadow-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:scale-105 active:scale-95 transition-all shadow-rose-500/30 overflow-hidden relative group`}
            >
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Sparkles className="h-6 w-6 mr-3" />
              Missão Cumprida!
            </Button>
          </>
        )}
      </div>

      {/* Branding */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-50">
         <img src="/app-logo.png" className="w-5 h-5 grayscale" alt="iCatequese" />
         <span className="text-[10px] font-black text-slate-400 uppercase">iCatequese</span>
      </div>
    </div>
  );
}
