import { useState, useCallback, useEffect } from "react";
import { Church, MapPin, Users, ArrowRight, Sparkles, Mail, FileText, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useParoquiaMutation, useComunidadeMutation, useParoquias, useComunidades } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { mascaraTelefone } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ParoquiaStepProps {
  open?: boolean;
  onSuccess: () => void;
  embedded?: boolean;
}

interface UnifiedFormData {
  pNome: string;
  pEndereco: string;
  pTelefone: string;
  pEmail: string;
  pResponsavel: string;
  cNome: string;
  cEndereco: string;
  cResponsavel: string;
  cTelefone: string;
}

const emptyForm: UnifiedFormData = {
  pNome: "", pEndereco: "", pTelefone: "", pEmail: "", pResponsavel: "",
  cNome: "", cEndereco: "", cResponsavel: "", cTelefone: "",
};

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

function FieldTextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const labelWithRedAsterisk = label.includes("*") ? (
    <>
      {label.replace("*", "")}
      <span className="text-red-500">*</span>
    </>
  ) : label;

  return (
    <div>
      <label className="text-xs font-semibold text-zinc-900 mb-1 block">{labelWithRedAsterisk}</label>
      <textarea 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="form-input min-h-[60px] resize-none" 
      />
    </div>
  );
}

export function ParoquiaStep({ open, onSuccess, embedded }: ParoquiaStepProps) {
  const pMutation = useParoquiaMutation();
  const cMutation = useComunidadeMutation();
  const { data: paroquias = [] } = useParoquias();
  const { data: comunidades = [] } = useComunidades();

  const [form, setForm] = useState<UnifiedFormData>({ ...emptyForm });

  useEffect(() => {
    if (paroquias.length > 0 && !form.pNome) {
      const p = paroquias[0];
      const c = comunidades[0];
      setForm({
        pNome: p.nome || "",
        pEndereco: p.endereco || "",
        pTelefone: p.telefone || "",
        pEmail: p.email || "",
        pResponsavel: p.responsavel || "",
        cNome: c?.nome || "",
        cEndereco: c?.endereco || "",
        cResponsavel: c?.responsavel || "",
        cTelefone: c?.telefone || "",
      });
    }
  }, [paroquias, comunidades, form.pNome]);

  const updateField = useCallback((field: keyof UnifiedFormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

  const handleSave = async () => {
    if (!form.pNome) {
      toast.error("Nome da Paróquia é obrigatório");
      return;
    }
    if (!form.cNome) {
      toast.error("Nome da Comunidade Inicial é obrigatório");
      return;
    }

    try {
      const pId = paroquias[0]?.id || crypto.randomUUID();
      const cId = comunidades[0]?.id || crypto.randomUUID();

      await pMutation.mutateAsync({
        id: pId,
        nome: form.pNome,
        endereco: form.pEndereco,
        telefone: form.pTelefone,
        email: form.pEmail,
        responsavel: form.pResponsavel,
      });

      await cMutation.mutateAsync({
        id: cId,
        nome: form.cNome,
        paroquiaId: pId,
        endereco: form.cEndereco,
        responsavel: form.cResponsavel,
        telefone: form.cTelefone,
      });

      toast.success("Paróquia e Comunidade cadastradas!");
      onSuccess();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    }
  };

  const formContent = (
    <div className={cn("flex flex-col", embedded ? "flex-1 min-h-0" : "max-h-[92vh]")}>
      {!embedded && (
        <>
          <div className="h-2 w-full bg-gradient-to-r from-violet-600 via-amber-400 to-violet-600 shrink-0" />
          <div className="flex flex-col items-center text-center pt-6 pb-3 px-8 shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-2 shadow-inner">
              <Church className="h-7 w-7 text-violet-600" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Passo 1 de 3</p>
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Sua Paróquia</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1 max-w-sm">
              Comece definindo onde sua catequese acontece. Preencha os dados da paróquia e da sua comunidade inicial.
            </p>
          </div>
        </>
      )}

      {/* Scrollable Form */}
      <div className={cn("overflow-y-auto flex-1 px-6 pb-6 space-y-6 pt-4")}>
        {/* Section 1: Parish */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-border/50">
            <Church className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Dados da Paróquia / Área / Escola</h3>
          </div>
          <FieldInput 
            label="Nome da Paróquia / Área / Escola *" 
            value={form.pNome} 
            onChange={(v) => updateField("pNome", v)} 
            placeholder="Digite o nome da paróquia/área/escola"
          />
          <FieldInput label="Endereço" value={form.pEndereco} onChange={(v) => updateField("pEndereco", v)} />
          <div className="grid grid-cols-2 gap-2">
            <FieldInput label="Telefone" type="tel" value={form.pTelefone} onChange={(v) => updateField("pTelefone", mascaraTelefone(v))} />
            <FieldInput label="E-mail" type="email" value={form.pEmail} onChange={(v) => updateField("pEmail", v)} />
          </div>
          <FieldInput label="Pároco responsável" value={form.pResponsavel} onChange={(v) => updateField("pResponsavel", v)} />
        </div>

        {/* Section 2: Community */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-border/50">
            <Users className="h-4 w-4 text-accent-foreground" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Dados da Comunidade / Núcleo</h3>
          </div>
          <FieldInput 
            label="Nome da Comunidade / Núcleo *" 
            value={form.cNome} 
            onChange={(v) => updateField("cNome", v)} 
            placeholder="Digite o nome da comunidade/núcleo"
          />
          
          <div className="flex items-center gap-2 py-1">
            <input 
              type="checkbox" 
              id="usarEnderecoParoquiaOnboarding" 
              onChange={(e) => {
                if (e.target.checked) {
                  updateField("cEndereco", form.pEndereco);
                }
              }}
              className="rounded border-border/50 text-primary focus:ring-primary h-4 w-4"
            />
            <label htmlFor="usarEnderecoParoquiaOnboarding" className="text-xs font-medium text-muted-foreground cursor-pointer">Usar mesmo endereço da paróquia</label>
          </div>

          <FieldInput label="Endereço da Comunidade" value={form.cEndereco} onChange={(v) => updateField("cEndereco", v)} />
          <div className="grid grid-cols-2 gap-2">
            <FieldInput label="Responsável" value={form.cResponsavel} onChange={(v) => updateField("cResponsavel", v)} />
            <FieldInput label="Telefone" type="tel" value={form.cTelefone} onChange={(v) => updateField("cTelefone", mascaraTelefone(v))} />
          </div>

          <button
            onClick={handleSave}
            disabled={pMutation.isPending || cMutation.isPending || !form.pNome || !form.cNome}
            className="w-full action-btn h-14 mt-4"
          >
            {pMutation.isPending || cMutation.isPending ? "Salvando..." : "Próximo Passo"}
          </button>
        </div>
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
