import { useState, useCallback, useEffect } from "react";
import { UserCheck, User, ArrowRight, Sparkles, Phone, Mail, MapPin, BookOpen, Briefcase, Calendar } from "lucide-react";
import { useCatequistaMutation, useComunidades, useCatequistas } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { mascaraTelefone, cn } from "@/lib/utils";
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
  const labelWithRedAsterisk = label.includes("*") ? (
    <>
      {label.replace("*", "")}
      <span className="text-red-500">*</span>
    </>
  ) : label;

  return (
    <div>
      <label className="text-xs font-semibold text-zinc-900 mb-1 block">{labelWithRedAsterisk}</label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder}
        className="form-input" 
      />
    </div>
  );
}

export function CatequistaStep({ open, onSuccess, embedded }: CatequistaStepProps) {
  const mutation = useCatequistaMutation();
  const { data: comunidades = [] } = useComunidades();
  const { data: catequistas = [] } = useCatequistas();

  const [form, setForm] = useState<FormData>({ ...emptyForm });

  useEffect(() => {
    if (catequistas.length > 0 && !form.nome) {
      const c = catequistas[0];
      setForm({
        nome: c.nome || "",
        dataNascimento: c.dataNascimento || "",
        endereco: c.endereco || "",
        numero: c.numero || "",
        bairro: c.bairro || "",
        complemento: c.complemento || "",
        profissao: c.profissao || "",
        telefone: c.telefone || "",
        email: c.email || "",
        comunidadeId: c.comunidadeId || "",
        formacao: c.formacao || "",
        anosExperiencia: c.anosExperiencia || "",
        observacao: c.observacao || "",
        status: c.status || "ativo",
        foto: c.foto || "",
      });
    }
  }, [catequistas, form.nome]);

  const updateField = useCallback((field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

  const handleSave = async () => {
    if (!form.nome) {
      toast.error("Nome é obrigatório");
      return;
    }
    try {
      const id = catequistas[0]?.id || crypto.randomUUID();
      await mutation.mutateAsync({
        id,
        nome: form.nome,
        dataNascimento: form.dataNascimento,
        endereco: form.endereco,
        numero: form.numero,
        bairro: form.bairro,
        profissao: form.profissao,
        telefone: form.telefone,
        email: form.email,
        comunidadeId: form.comunidadeId || comunidades[0]?.id || "",
        anosExperiencia: "", // Deprecated field in favor of profissao
        foto: form.foto,
      });
      toast.success("Perfil de Catequista criado!");
      onSuccess();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    }
  };

  const formContent = (
    <div className={cn("flex flex-col", embedded ? "flex-1 min-h-0" : "max-h-[92vh]")}>
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
      <div className={cn("overflow-y-auto flex-1 px-8 pb-6 space-y-3 pt-2")}>
        <div className="flex justify-center mb-2">
          <ImagePicker 
            onImageUpload={(url) => updateField("foto", url)} 
            folder="catequistas" 
            currentImageUrl={form.foto} 
            shape="circle" 
            label="Foto de Perfil"
          />
        </div>
        <FieldInput label="Nome completo *" value={form.nome} onChange={(v) => updateField("nome", v)} />
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-xs font-semibold text-zinc-900 mb-1 block">Data de nascimento</label><input type="date" value={form.dataNascimento} onChange={(e) => updateField("dataNascimento", e.target.value)} className="form-input" /></div>
          <div><label className="text-xs font-semibold text-zinc-900 mb-1 block">Idade</label><div className="form-input text-muted-foreground">{form.dataNascimento ? `${calcAge(form.dataNascimento)} anos` : "—"}</div></div>
        </div>
        <FieldInput label="Rua / Logradouro" value={form.endereco} onChange={(v) => updateField("endereco", v)} />
        <div className="grid grid-cols-3 gap-2">
          <FieldInput label="Número" value={form.numero} onChange={(v) => updateField("numero", v)} />
          <div className="col-span-2">
            <FieldInput label="Bairro" value={form.bairro} onChange={(v) => updateField("bairro", v)} />
          </div>
        </div>
        <FieldInput label="Complemento" value={form.complemento} onChange={(v) => updateField("complemento", v)} />
        <FieldInput label="Profissão" value={form.profissao} onChange={(v) => updateField("profissao", v)} />
        <div className="grid grid-cols-2 gap-2">
          <FieldInput label="Telefone/WhatsApp *" type="tel" value={form.telefone} onChange={(v) => updateField("telefone", mascaraTelefone(v))} />
          <FieldInput label="E-mail" type="email" value={form.email} onChange={(v) => updateField("email", v)} />
        </div>
        {comunidades.length > 0 && (
          <div><label className="text-xs font-semibold text-zinc-900 mb-1 block">Comunidade</label>
            <select value={form.comunidadeId} onChange={(e) => updateField("comunidadeId", e.target.value)} className="form-input">
              <option value="">Selecione...</option>{comunidades.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        )}
        
        <button
          onClick={handleSave}
          disabled={mutation.isPending || !form.nome}
          className="w-full action-btn h-14 mt-4"
        >
          {mutation.isPending ? "Salvando..." : "Próximo Passo"}
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
