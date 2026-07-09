import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Download, ShoppingBag, ArrowRight, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function StoreCheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const paymentId = searchParams.get("payment_id");
  const externalRef = searchParams.get("external_reference");

  useEffect(() => {
    if (!user) return;
    // Aguarda um momento para o webhook processar
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("store_purchases")
        .select("*, material_apoio:product_id(id, titulo, arquivo_url, arquivo_tipo, thumbnail_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setPurchases(data || []);
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [user]);

  const handleDownload = async (productId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-download-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ product_id: productId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      window.open(json.url, "_blank");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-sm space-y-6 text-center">
        {/* Success icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-black text-foreground">Pagamento Aprovado!</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Seus materiais estão prontos para download 🎉
          </p>
        </div>

        {/* Downloads */}
        <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-4 text-left space-y-3">
          <p className="text-xs font-black text-foreground uppercase tracking-wider mb-2">Seus Materiais</p>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Verificando compras...</span>
            </div>
          ) : purchases.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Aguarde alguns instantes, o acesso está sendo liberado...
            </p>
          ) : (
            purchases.map(p => {
              const mat = p.material_apoio;
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{mat?.titulo}</p>
                  </div>
                  <button
                    onClick={() => handleDownload(mat?.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-black active:scale-95 transition-all"
                  >
                    <Download className="w-3 h-3" /> Baixar
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Email notice */}
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-blue-50 border border-blue-100 text-left">
          <Mail className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-700 leading-relaxed">
            Você também pode acessar seus materiais a qualquer momento na <strong>Loja → Meus Downloads</strong>.
          </p>
        </div>

        <button
          onClick={() => navigate("/modulos/loja")}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-sm active:scale-[0.98] transition-all shadow-md shadow-primary/20"
        >
          Voltar à Loja <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
