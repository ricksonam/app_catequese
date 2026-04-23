import { useState } from "react";
import { UserCheck, User, Phone, Briefcase, ArrowRight, Sparkles, Camera } from "lucide-react";
import { useCatequistaMutation, useComunidades } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { mascaraTelefone } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImagePicker } from "@/components/ImagePicker";

interface CatequistaStepProps {
  open: boolean;
  onSuccess: () => void;
}

export function CatequistaStep({ open, onSuccess }: CatequistaStepProps) {
  const mutation = useCatequistaMutation();
  const { data: comunidades = [] } = useComunidades();

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    profissao: "",
    formacao: "",
    foto: "",
    comunidadeId: comunidades[0]?.id || "",
  });

  const handleSave = async () => {
    if (!form.nome) {
      toast.error("Preencha o seu nome");
      return;
    }

    try {
      const id = crypto.randomUUID();
      await mutation.mutateAsync({
        id,
        nome: form.nome,
        telefone: form.telefone,
        profissao: form.profissao,
        formacao: form.formacao,
        foto: form.foto,
        comunidadeId: form.comunidadeId || comunidades[0]?.id || "",
        status: "ativo",
        dataNascimento: "",
        endereco: "",
        anosExperiencia: "",
        observacao: "Cadastro via Onboarding",
      });

      toast.success("Perfil de Catequista criado!");
      onSuccess();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md w-[95vw] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-zinc-950">
        <div className="h-2 w-full bg-gradient-to-r from-sky-500 via-indigo-400 to-sky-500" />
        
        <div className="p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mb-2 shadow-inner">
              <UserCheck className="h-8 w-8 text-sky-600" />
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Passo 2 de 3</p>
              <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Seu Perfil</h2>
            <p className="text-xs text-muted-foreground leading-relaxed px-4">
              Agora crie o seu perfil de catequista. Você poderá adicionar outros colegas depois!
            </p>
          </div>

          <div className="flex justify-center mb-2">
            <ImagePicker 
              onImageUpload={(url) => setForm(f => ({ ...f, foto: url }))} 
              folder="catequistas" 
              currentImageUrl={form.foto} 
              shape="circle" 
              label="Sua Foto"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Seu Nome Completo *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <input 
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Seu nome"
                  className="w-full h-12 pl-11 pr-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-sky-500/50 focus:bg-background transition-all outline-none text-sm font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Telefone</label>
                <input 
                  value={form.telefone}
                  onChange={e => setForm(f => ({ ...f, telefone: mascaraTelefone(e.target.value) }))}
                  placeholder="(00) 00000-0000"
                  className="w-full h-12 px-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-sky-500/50 focus:bg-background transition-all outline-none text-sm font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Profissão</label>
                <input 
                  value={form.profissao}
                  onChange={e => setForm(f => ({ ...f, profissao: e.target.value }))}
                  placeholder="Ex: Professor"
                  className="w-full h-12 px-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-sky-500/50 focus:bg-background transition-all outline-none text-sm font-bold"
                />
              </div>
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
      </DialogContent>
    </Dialog>
  );
}
