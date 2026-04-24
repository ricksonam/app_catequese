import { useState, useCallback, useRef } from "react";
import { UserCheck, User, ArrowRight, Sparkles, Phone, Mail, MapPin, BookOpen, Briefcase, Calendar } from "lucide-react";
import { useCatequistaMutation, useComunidades } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { mascaraTelefone } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImagePicker } from "@/components/ImagePicker";

interface CatequistaStepProps {
  open?: boolean;
  onSuccess: () => void;
  embedded?: boolean;
}

type CatequistaStatus = "ativo" | "inativo" | "afastado";

interface FormData {
  nome: string;
  dataNascimento: string;
  endereco: string;
  numero: string;
  bairro: string;
  complemento: string;
  profissao: string;
  telefone: string;
  email: string;
  comunidadeId: string;
  formacao: string;
  anosExperiencia: string;
  observacao: string;
  status: CatequistaStatus;
  foto: string;
}

const emptyForm: FormData = {
  nome: "", dataNascimento: "", endereco: "",
  numero: "", bairro: "", complemento: "",
  profissao: "", telefone: "",
  email: "", comunidadeId: "", formacao: "", anosExperiencia: "", observacao: "", status: "ativo",
  foto: "",
};

function calcAge(birth: string): number | null {
  if (!birth) return null;
  const b = new Date(birth); const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--;
  return age;
}

function FieldInput({ label, type = "text", value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 block mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full h-11 px-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-sky-500/50 focus:bg-background transition-all outline-none text-sm font-bold" />
    </div>
  );
}

export function CatequistaStep({ open, onSuccess }: CatequistaStepProps) {
  const mutation = useCatequistaMutation();
  const { data: comunidades = [] } = useComunidades();

  const [form, setForm] = useState<FormData>({ ...emptyForm });

  const updateField = useCallback((field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

  const handleSave = async () => {
    if (!form.nome) {
      toast.error("Nome é obrigatório");
      return;
    }
    try {
      const id = crypto.randomUUID();
      await mutation.mutateAsync({
        id,
        nome: form.nome,
        dataNascimento: form.dataNascimento,
        endereco: form.endereco,
        numero: form.numero,
        bairro: form.bairro,
        complemento: form.complemento,
        profissao: form.profissao,
        telefone: form.telefone,
        email: form.email,
        comunidadeId: form.comunidadeId || comunidades[0]?.id || "",
        formacao: form.formacao,
        anosExperiencia: form.anosExperiencia,
        observacao: form.observacao || "Cadastro via Onboarding",
        status: form.status,
        foto: form.foto,
      });
      toast.success("Perfil de Catequista criado!");
      onSuccess();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    }
  };

  const formContent = (
    <div className={cn("flex flex-col", !embedded && "max-h-[92vh]")}>
      {!embedded && (
        <>
          <div className="h-2 w-full bg-gradient-to-r from-sky-500 via-indigo-400 to-sky-500 shrink-0" />
          <div className="flex flex-col items-center text-center pt-6 pb-3 px-8 shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mb-2 shadow-inner">
              <UserCheck className="h-7 w-7 text-sky-600" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Passo 2 de 3</p>
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Seu Perfil</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1 max-w-sm">
              Crie o seu perfil de catequista completo. Você poderá adicionar outros catequistas depois!
            </p>
          </div>
        </>
      )}

      {/* Scrollable Form */}
      <div className={cn("overflow-y-auto flex-1 px-8 pb-6 space-y-4", embedded ? "pt-2" : "pt-0")}>
        {/* Foto */}
        <div className="flex justify-center py-2">
          <ImagePicker
            onImageUpload={(url) => updateField("foto", url)}
            folder="catequistas"
            currentImageUrl={form.foto}
            shape="circle"
            label="Foto de Perfil"
          />
        </div>

        {/* Dados Pessoais */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-black/5 pb-2">
            <User className="h-4 w-4 text-sky-600" />
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-600">Dados Pessoais</p>
          </div>

          <FieldInput label="Nome Completo *" value={form.nome} onChange={(v) => updateField("nome", v)} placeholder="Seu nome completo" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 block mb-1">Data de Nascimento</label>
              <input
                type="date"
                value={form.dataNascimento}
                onChange={(e) => updateField("dataNascimento", e.target.value)}
                className="w-full h-11 px-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-sky-500/50 focus:bg-background transition-all outline-none text-sm font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 block mb-1">Idade</label>
              <div className="w-full h-11 px-4 rounded-2xl bg-muted/30 border-2 border-transparent flex items-center text-sm font-bold text-muted-foreground">
                {form.dataNascimento ? `${calcAge(form.dataNascimento)} anos` : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-black/5 pb-2">
            <MapPin className="h-4 w-4 text-indigo-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Endereço</p>
          </div>

          <FieldInput label="Rua / Logradouro" value={form.endereco} onChange={(v) => updateField("endereco", v)} placeholder="Rua, Avenida..." />

          <div className="grid grid-cols-3 gap-3">
            <FieldInput label="Número" value={form.numero} onChange={(v) => updateField("numero", v)} />
            <div className="col-span-2">
              <FieldInput label="Bairro" value={form.bairro} onChange={(v) => updateField("bairro", v)} />
            </div>
          </div>

          <FieldInput label="Complemento" value={form.complemento} onChange={(v) => updateField("complemento", v)} placeholder="Apto, bloco..." />
        </div>

        {/* Contato e Profissão */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-black/5 pb-2">
            <Phone className="h-4 w-4 text-sky-600" />
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-600">Contato e Profissão</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldInput
              label="Telefone"
              type="tel"
              value={form.telefone}
              onChange={(v) => updateField("telefone", mascaraTelefone(v))}
              placeholder="(00) 00000-0000"
            />
            <FieldInput label="E-mail" type="email" value={form.email} onChange={(v) => updateField("email", v)} placeholder="email@exemplo.com" />
          </div>

          <FieldInput label="Profissão" value={form.profissao} onChange={(v) => updateField("profissao", v)} placeholder="Ex: Professor, Médico..." />
        </div>

        {/* Formação e Comunidade */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-black/5 pb-2">
            <BookOpen className="h-4 w-4 text-indigo-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Formação e Comunidade</p>
          </div>

          {comunidades.length > 0 && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 block mb-1">Comunidade</label>
              <select
                value={form.comunidadeId}
                onChange={(e) => updateField("comunidadeId", e.target.value)}
                className="w-full h-11 px-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-sky-500/50 focus:bg-background transition-all outline-none text-sm font-bold appearance-none"
              >
                <option value="">Selecione...</option>
                {comunidades.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          )}

          <FieldInput label="Formação" value={form.formacao} onChange={(v) => updateField("formacao", v)} placeholder="Ex: Teologia, Pedagogia..." />

          <div className="grid grid-cols-2 gap-3">
            <FieldInput label="Anos de Experiência" value={form.anosExperiencia} onChange={(v) => updateField("anosExperiencia", v)} placeholder="Ex: 5" />
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 block mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value as CatequistaStatus)}
                className="w-full h-11 px-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-sky-500/50 focus:bg-background transition-all outline-none text-sm font-bold appearance-none"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="afastado">Afastado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 block mb-1">Observação</label>
            <textarea
              value={form.observacao}
              onChange={(e) => updateField("observacao", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-sky-500/50 focus:bg-background transition-all outline-none text-sm font-bold resize-none min-h-[60px]"
              placeholder="Observações sobre o catequista..."
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={mutation.isPending || !form.nome}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-black text-sm shadow-xl shadow-sky-500/25 active:scale-[0.97] transition-all hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
        >
          {mutation.isPending ? "Salvando..." : "Próximo Passo"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  if (embedded) return formContent;

  return (
    <Dialog open={open || false} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg w-[95vw] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-zinc-950 max-h-[92vh] flex flex-col">
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
