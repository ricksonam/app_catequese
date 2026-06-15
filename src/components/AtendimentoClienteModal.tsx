import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeadphonesIcon, FileUp, UploadCloud, AlertCircle, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIPO_ATENDIMENTO = [
  "Tirar dúvidas",
  "Fazer reclamação",
  "Fazer um elogio",
  "Sugestão",
  "Denúncia"
];

export function AtendimentoClienteModal({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tipo, setTipo] = useState<string>("Tirar dúvidas");
  const [mensagem, setMensagem] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      // Fetch phone from profiles if available
      supabase.from("profiles").select("telefone").eq("id", user.id).single()
        .then(({ data }) => {
          if (data && data.telefone) {
            setTelefone(data.telefone);
          }
        });
    }
  }, [user]);

  const { data: meusAtendimentos, isLoading: loadingAtendimentos, refetch } = useQuery({
    queryKey: ["meus_atendimentos", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atendimentos")
        .select("*")
        .eq("usuario_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!mensagem.trim()) {
      toast({ title: "Atenção", description: "Por favor, digite sua mensagem.", variant: "destructive" });
      return;
    }
    if (!telefone.trim()) {
      toast({ title: "Atenção", description: "O número de telefone é obrigatório.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 1. Gerar Protocolo
      const date = new Date();
      const protocolo = `ATD-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      // 2. Upload do arquivo se houver
      let anexoUrl = null;
      if (arquivo) {
        const fileExt = arquivo.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from("atendimentos-anexos")
          .upload(fileName, arquivo);
        
        if (uploadError) {
          throw new Error("Erro ao fazer upload do anexo: " + uploadError.message);
        }
        
        const { data: { publicUrl } } = supabase.storage.from("atendimentos-anexos").getPublicUrl(fileName);
        anexoUrl = publicUrl;
      }

      // 3. Salvar no banco
      const { error: dbError } = await supabase.from("atendimentos").insert({
        protocolo,
        usuario_id: user.id,
        email,
        telefone,
        tipo,
        mensagem,
        anexo_url: anexoUrl,
        status: "Aberto"
      });

      if (dbError) throw dbError;

      // 4. Chamar Edge Function para enviar e-mail
      await supabase.functions.invoke("send-atendimento-email", {
        body: {
          email,
          protocolo,
          tipo,
          mensagem,
          nome: user.user_metadata?.full_name || ""
        }
      });

      toast({
        title: "Solicitação Enviada!",
        description: `Seu protocolo é ${protocolo}. Enviamos um e-mail com a confirmação.`,
      });

      onOpenChange(false);
      // Limpar form
      setMensagem("");
      setArquivo(null);
      setTipo("Tirar dúvidas");
      refetch();
      
    } catch (error: any) {
      console.error(error);
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[32px] p-6 sm:p-8 border-none shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <HeadphonesIcon className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-black text-center">Atendimento ao Cliente</DialogTitle>
          <DialogDescription className="text-center text-base">
            Como podemos ajudar você hoje? Selecione o tipo de atendimento ou acompanhe seus chamados.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="novo" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="novo">Nova Solicitação</TabsTrigger>
            <TabsTrigger value="historico">Minhas Solicitações</TabsTrigger>
          </TabsList>

          <TabsContent value="novo">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-bold">Tipo de Atendimento</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_ATENDIMENTO.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold">E-mail</Label>
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="h-12 rounded-xl bg-muted/30"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold">Telefone (WhatsApp) *</Label>
                  <Input 
                    type="tel" 
                    value={telefone} 
                    onChange={(e) => setTelefone(e.target.value)} 
                    className="h-12 rounded-xl"
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">Mensagem *</Label>
                <Textarea 
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  className="min-h-[120px] rounded-2xl resize-none"
                  placeholder="Descreva detalhadamente sua solicitação..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">Anexar Arquivo (Opcional)</Label>
                <div className="relative">
                  <Input 
                    type="file" 
                    onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <Label 
                    htmlFor="file-upload"
                    className={cn(
                      "flex items-center justify-center gap-2 h-14 border-2 border-dashed rounded-2xl cursor-pointer transition-colors",
                      arquivo ? "border-primary bg-primary/5 text-primary" : "border-muted-foreground/20 hover:bg-muted/50 text-muted-foreground"
                    )}
                  >
                    {arquivo ? (
                      <>
                        <FileUp className="w-5 h-5" />
                        <span className="font-semibold truncate max-w-[200px]">{arquivo.name}</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-5 h-5" />
                        <span className="font-semibold">Clique para anexar foto ou documento</span>
                      </>
                    )}
                  </Label>
                </div>
              </div>

              {!telefone && (
                <div className="flex gap-2 items-center p-3 rounded-xl bg-amber-50 text-amber-600 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>O número de telefone é obrigatório para que possamos contatá-lo.</span>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-14 rounded-2xl font-black text-lg mt-2 shadow-lg hover:scale-[1.01] transition-transform"
              >
                {loading ? "Enviando..." : "Solicitar Atendimento"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="historico" className="space-y-4">
            {loadingAtendimentos ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : meusAtendimentos && meusAtendimentos.length > 0 ? (
              <div className="space-y-3 mt-4">
                {meusAtendimentos.map((atendimento) => (
                  <div key={atendimento.id} className="p-4 rounded-2xl border-2 bg-card hover:border-primary/30 transition-all flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{atendimento.protocolo}</span>
                      <div className={cn(
                        "text-[10px] font-black uppercase px-2 py-1 rounded-full",
                        atendimento.status === 'Resolvido' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {atendimento.status}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-bold text-sm">{atendimento.tipo}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(atendimento.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{atendimento.mensagem}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border-2 border-dashed rounded-2xl bg-muted/20">
                <p className="text-muted-foreground font-medium">Você ainda não abriu nenhuma solicitação de atendimento.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
