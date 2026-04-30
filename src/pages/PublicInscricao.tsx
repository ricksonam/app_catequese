import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchPublicTurmaByCode, upsertCatequizando } from "@/lib/supabaseStore";

import { 
  UserPlus, Calendar, Phone, Mail, MapPin, 
  Plus, X as XIcon, CheckCircle2, AlertCircle, 
  ArrowRight, Sparkles, Heart, Church, 
  Camera, Users, Info, LayoutDashboard
} from "lucide-react";
import { CustomDatePicker } from "@/components/CustomDatePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ImagePicker } from "@/components/ImagePicker";
import { mascaraTelefone, cn, generateUUID } from "@/lib/utils";
import { toast } from "sonner";
import Spinner from "@/components/ui/spinner";
import { type Catequizando } from "@/lib/store";

// --- Helpers ---
function FieldInput({ label, value, onChange, placeholder, type = "text" }: any) {
  const labelWithRedAsterisk = label.includes("*") ? (
    <>
      {label.replace("*", "")}
      <span className="text-red-500">*</span>
    </>
  ) : label;

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest block ml-1">{labelWithRedAsterisk}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-4 bg-white dark:bg-zinc-900 border-2 border-black/5 focus:border-primary/30 rounded-xl outline-none transition-all text-sm font-medium"
      />
    </div>
  );
}

function calcularIdade(dataNascimento: string) {
  if (!dataNascimento) return "";
  const [ano, mes, dia] = dataNascimento.split("-").map(Number);
  const hoje = new Date();
  let idade = hoje.getFullYear() - ano;
  const m = hoje.getMonth() - (mes - 1);
  if (m < 0 || (m === 0 && hoje.getDate() < dia)) idade--;
  return idade > 0 ? `${idade} anos` : "";
}

export default function PublicInscricao() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: turma, isLoading, error } = useQuery({
    queryKey: ["public_turma", codigo],
    queryFn: () => fetchPublicTurmaByCode(codigo || ""),
    enabled: !!codigo,
  });


  const [form, setForm] = useState<any>({
    nome: "",
    dataNascimento: "",
    telefone: "",
    email: "",
    endereco: "",
    numero: "",
    bairro: "",
    complemento: "",
    responsavel: "",
    participacaoPastoral: "",
    necessidadeEspecial: "nenhuma",
    observacao: "",
    status: "ativo",
    foto: "",
    sacramentos: {
      batismo: { recebido: false, data: "", paroquia: "" },
      eucaristia: { recebido: false, data: "", paroquia: "" },
      crisma: { recebido: false, data: "", paroquia: "" },
    },
    responsaveis: [{ id: generateUUID(), nome: "", telefone: "", vinculo: "pais" }],
  });

  const updateField = (field: string, value: any) => setForm((prev: any) => ({ ...prev, [field]: value }));

  const updateSacramento = (sac: string, field: string, value: any) => {
    setForm((prev: any) => ({
      ...prev,
      sacramentos: {
        ...prev.sacramentos,
        [sac]: { ...prev.sacramentos[sac], [field]: value },
      },
    }));
  };

  const updateResponsavel = (id: string, field: string, value: any) => {
    setForm((prev: any) => ({
      ...prev,
      responsaveis: prev.responsaveis.map((r: any) => r.id === id ? { ...r, [field]: value } : r),
    }));
  };

  const addResponsavel = () => {
    setForm((prev: any) => ({
      ...prev,
      responsaveis: [...prev.responsaveis, { id: generateUUID(), nome: "", telefone: "", vinculo: "outros" }],
    }));
  };

  const removeResponsavel = (id: string) => {
    setForm((prev: any) => ({
      ...prev,
      responsaveis: prev.responsaveis.filter((r: any) => r.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !turma) {
      toast.error("Por favor, preencha o nome completo.");
      return;
    }


    setIsSubmitting(true);
    try {
      // Verificar se já existe um catequizando com o mesmo nome e data de nascimento nesta turma
      // para permitir atualização em vez de criar um duplicado
      const { data: existing } = await supabase
        .from("catequizandos")
        .select("id")
        .eq("turma_id", turma.id)
        .ilike("nome", form.nome.trim())
        .eq("data_nascimento", form.dataNascimento)
        .maybeSingle();

      const payload: Catequizando = {
        ...form,
        id: existing?.id || generateUUID(),
        turmaId: turma.id,
        responsavel: form.responsaveis[0]?.nome || "", // Campo legado para compatibilidade
        origem: 'online',
      };


      await upsertCatequizando(payload);

      setIsSuccess(true);
      toast.success("Inscrição realizada com sucesso!");
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao realizar inscrição. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" text="Carregando formulário..." /></div>;

  if (error || !turma) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h1 className="text-xl font-black uppercase tracking-tight">Link Inválido</h1>
        <p className="text-muted-foreground mt-2 max-w-xs text-sm">Não encontramos a turma para este link. Verifique com o catequista.</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-foreground tracking-tight uppercase">Vínculo Confirmado!</h1>
            <p className="text-sm text-muted-foreground font-medium">
              A caminhada de <span className="text-primary font-bold">{form.nome}</span> foi registrada com sucesso.
            </p>
          </div>
          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
             <p className="text-xs font-bold text-primary uppercase tracking-widest leading-relaxed">
               Agora o catequista já pode visualizar os dados no sistema. Que Deus abençoe essa caminhada!
             </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Fazer novo registro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FE] pb-20">
      {/* Header Premium */}
      <div className="bg-white border-b border-black/5 px-6 py-8 shadow-sm">
        <div className="max-w-2xl mx-auto flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner mb-2 animate-bounce-subtle">
             <UserPlus className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Acolhida e Renovação na Fé</p>
            <h1 className="text-3xl font-black text-foreground tracking-tighter leading-tight uppercase">
              Catequese {turma.nome}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="px-2.5 py-1 rounded-lg bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground border-2 border-black/5">
                {turma.ano}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-primary/5 text-[10px] font-black uppercase tracking-widest text-primary border-2 border-primary/10">
                {turma.etapa?.replace("-", " ")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-8">
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* FOTO E DADOS BÁSICOS */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-6">
            <div className="flex items-center gap-3 text-primary font-black uppercase tracking-tight text-sm">
               <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">👤</div>
               Dados Pessoais
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="mx-auto md:mx-0">
                <ImagePicker 
                  onImageUpload={(url) => updateField("foto", url)} 
                  folder="catequizandos" 
                  currentImageUrl={form.foto} 
                  shape="circle" 
                  label="Foto"
                  hideCamera={true}
                />
              </div>
              <div className="flex-1 w-full space-y-4">
                <FieldInput label="Nome completo do catequizando *" value={form.nome} onChange={(v: string) => updateField("nome", v)} placeholder="Ex: João Silva Santos" />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CustomDatePicker 
                    label="Data de Nascimento" 
                    value={form.dataNascimento} 
                    onChange={(v: string) => updateField("dataNascimento", v)} 
                  />
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest block ml-1">Idade</label>
                    <div className="h-10 flex items-center px-4 bg-muted/20 rounded-xl border-2 border-black/5 font-black text-primary text-sm">
                      {calcularIdade(form.dataNascimento) || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldInput label="Telefone" type="tel" value={form.telefone} onChange={(v: string) => updateField("telefone", mascaraTelefone(v))} placeholder="(00) 00000-0000" />
              <FieldInput label="E-mail" type="email" value={form.email} onChange={(v: string) => updateField("email", v)} placeholder="exemplo@email.com" />
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-[-8px]">
                <MapPin className="w-3 h-3" /> Endereço Residencial
              </div>
              <FieldInput label="Rua / Avenida" value={form.endereco} onChange={(v: string) => updateField("endereco", v)} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <FieldInput label="Número" value={form.numero} onChange={(v: string) => updateField("numero", v)} />
                <FieldInput label="Bairro" value={form.bairro} onChange={(v: string) => updateField("bairro", v)} />
                <div className="col-span-2 sm:col-span-1">
                  <FieldInput label="Complemento" value={form.complemento} onChange={(v: string) => updateField("complemento", v)} />
                </div>
              </div>
            </div>
          </div>

          {/* SACRAMENTOS */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-6">
            <div className="flex items-center gap-3 text-orange-600 font-black uppercase tracking-tight text-sm">
               <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">✝️</div>
               Vida Sacramental
            </div>
            
            <p className="text-[11px] font-bold text-muted-foreground bg-orange-50 p-3 rounded-xl border border-orange-100">
              Marque os sacramentos que o catequizando já recebeu:
            </p>

            <div className="grid grid-cols-1 gap-6">
              {(["batismo", "eucaristia", "crisma"] as const).map((sac) => (
                <div key={sac} className={cn(
                  "p-4 rounded-2xl border-2 transition-all duration-300",
                  form.sacramentos[sac].recebido ? "border-orange-200 bg-orange-50/30" : "border-black/5 bg-white"
                )}>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={cn(
                      "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                      form.sacramentos[sac].recebido ? "bg-orange-500 border-orange-500 text-white" : "border-black/20 group-hover:border-orange-300"
                    )}>
                      {form.sacramentos[sac].recebido && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <input 
                      type="checkbox" 
                      checked={form.sacramentos[sac].recebido} 
                      onChange={(e) => updateSacramento(sac, "recebido", e.target.checked)} 
                      className="hidden" 
                    />
                    <span className={cn(
                      "text-sm font-black uppercase tracking-wide",
                      form.sacramentos[sac].recebido ? "text-orange-700" : "text-foreground"
                    )}>{sac}</span>
                  </label>
                  
                  {form.sacramentos[sac].recebido && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 animate-in slide-in-from-top-2">
                      <FieldInput label="Paróquia onde recebeu" value={form.sacramentos[sac].paroquia} onChange={(v: string) => updateSacramento(sac, "paroquia", v)} placeholder="Nome da paróquia" />
                      <CustomDatePicker label="Data do Sacramento" value={form.sacramentos[sac].data || ""} onChange={(v: string) => updateSacramento(sac, "data", v)} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2">
              <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest block ml-1 mb-2">Participa de algum grupo ou pastoral?</label>
              <textarea 
                value={form.participacaoPastoral} 
                onChange={(e) => updateField("participacaoPastoral", e.target.value)} 
                className="w-full min-h-[80px] p-4 bg-white dark:bg-zinc-900 border-2 border-black/5 focus:border-orange-300 rounded-xl outline-none transition-all text-sm font-medium resize-none" 
                placeholder="Ex: Coroinhas, IA, Perseverança..." 
              />
            </div>
          </div>

          {/* RESPONSÁVEIS */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-blue-600 font-black uppercase tracking-tight text-sm">
                 <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">👥</div>
                 Responsáveis
              </div>
              <button 
                type="button" 
                onClick={addResponsavel}
                className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl border border-blue-200 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3 h-3" /> Adicionar Outro
              </button>
            </div>

            <div className="space-y-4">
              {form.responsaveis.map((resp: any, idx: number) => (
                <div key={resp.id} className="p-5 bg-blue-50/20 border-2 border-blue-100/50 rounded-2xl space-y-4 relative group animate-in zoom-in-95">
                  {form.responsaveis.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeResponsavel(resp.id)}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-white text-destructive rounded-full flex items-center justify-center shadow-md border-2 border-destructive/20 hover:bg-destructive hover:text-white transition-all"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldInput label={`Nome do Responsável ${idx + 1}`} value={resp.nome} onChange={(v: string) => updateResponsavel(resp.id, "nome", v)} placeholder="Ex: Maria Oliveira" />
                    <FieldInput label="Telefone de Contato" type="tel" value={resp.telefone} onChange={(v: string) => updateResponsavel(resp.id, "telefone", mascaraTelefone(v))} placeholder="(00) 00000-0000" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest block ml-1 mb-1">Vínculo</label>
                    <Select value={resp.vinculo} onValueChange={(v) => updateResponsavel(resp.id, "vinculo", v)}>
                      <SelectTrigger className="h-10 bg-white border-2 border-black/5 rounded-xl">
                        <SelectValue placeholder="Selecione o vínculo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pais">Pais</SelectItem>
                        <SelectItem value="avós">Avós</SelectItem>
                        <SelectItem value="tios">Tios</SelectItem>
                        <SelectItem value="padrinhos">Padrinhos</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* OUTRAS INFO */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-6">
            <div className="flex items-center gap-3 text-muted-foreground font-black uppercase tracking-tight text-sm">
               <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">📝</div>
               Informações Adicionais
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest block ml-1 mb-1">Necessidade Especial ou Restrição Alimentar?</label>
                <Select value={form.necessidadeEspecial} onValueChange={(v) => updateField("necessidadeEspecial", v)}>
                  <SelectTrigger className="h-10 bg-white border-2 border-black/5 rounded-xl">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhuma">Nenhuma</SelectItem>
                    <SelectItem value="tdah">TDAH</SelectItem>
                    <SelectItem value="autismo">Autismo</SelectItem>
                    <SelectItem value="auditiva">Deficiência Auditiva</SelectItem>
                    <SelectItem value="visual">Deficiência Visual</SelectItem>
                    <SelectItem value="motora">Deficiência Motora</SelectItem>
                    <SelectItem value="alergia">Alergia Alimentar</SelectItem>
                    <SelectItem value="outra">Outra (especificar abaixo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest block ml-1 mb-2">Observações / Comentários</label>
                <textarea 
                  value={form.observacao} 
                  onChange={(e) => updateField("observacao", e.target.value)} 
                  className="w-full min-h-[100px] p-4 bg-white dark:bg-zinc-900 border-2 border-black/5 focus:border-primary/30 rounded-xl outline-none transition-all text-sm font-medium resize-none" 
                  placeholder="Espaço para detalhes importantes sobre o catequizando..." 
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-5 bg-primary text-white rounded-3xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-primary/30 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Spinner size="sm" color="white" text="Enviando Inscrição..." />
            ) : (
              <>
                Confirmar Caminhada e Enviar <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Branding Footer */}
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
           <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-black/5">
              <img src="/app-logo.png" className="w-6 h-6 object-contain" alt="iCatequese" />
              <span className="text-[10px] font-black text-primary tracking-tighter uppercase italic">iCatequese Digital</span>
           </div>
           <p className="text-[10px] font-bold text-muted-foreground/60 max-w-[200px]">
             Sistema de Gestão de Catequese Seguro e Eficiente
           </p>
        </div>
      </div>
    </div>
  );
}
