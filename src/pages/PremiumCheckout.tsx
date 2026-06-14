import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PremiumCheckout() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/minha-assinatura", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-20">
      <div className="bg-white dark:bg-zinc-900 border-b border-black/5 dark:border-white/5 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800 text-foreground active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-widest text-foreground">Redirecionando...</h1>
        <div className="w-10 h-10" />
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6 mt-4 flex items-center justify-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
