import {
  ArrowLeft, ShoppingCart, X, Download, Eye, FileText,
  Sparkles, Search, BookOpen, Tag, Star, Crown,
  Plus, Minus, Trash2, CreditCard, CheckCircle2,
  Package, Loader2, ChevronRight, Gift, Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Produto {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  arquivo_url: string | null;
  arquivo_tipo: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  tamanho_bytes: number | null;
  publicado_em: string | null;
  ativo: boolean;
  preco: number;
  gratuito: boolean;
  destaque: boolean;
  tags: string[] | null;
}

interface CartItem {
  produto: Produto;
  quantidade: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isNovo(publicadoEm: string | null): boolean {
  if (!publicadoEm) return false;
  return Date.now() - new Date(publicadoEm).getTime() < 7 * 24 * 60 * 60 * 1000;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatPrice(preco: number): string {
  return preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ThumbnailDisplay({ produto, className }: { produto: Produto; className?: string }) {
  const [imgErr, setImgErr] = useState(false);
  const isPdf = produto.arquivo_tipo === "pdf" || produto.arquivo_url?.toLowerCase().endsWith(".pdf");

  if (produto.thumbnail_url && !imgErr) {
    return (
      <img
        src={produto.thumbnail_url}
        alt={produto.titulo}
        className={cn("w-full h-full object-cover", className)}
        onError={() => setImgErr(true)}
      />
    );
  }
  if (isPdf) {
    return (
      <div className={cn("w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-500 to-red-700", className)}>
        <FileText className="w-10 h-10 text-white drop-shadow-lg" strokeWidth={1.5} />
        <span className="text-[10px] font-black text-white tracking-widest mt-1 bg-red-900/40 px-2 py-0.5 rounded">PDF</span>
      </div>
    );
  }
  return (
    <div className={cn("w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-violet-500 to-purple-700", className)}>
      <BookOpen className="w-10 h-10 text-white drop-shadow-lg" strokeWidth={1.5} />
      <span className="text-[10px] font-black text-white tracking-widest mt-1 bg-purple-900/40 px-2 py-0.5 rounded">MATERIAL</span>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProdutoCard({
  produto,
  comprado,
  onAddToCart,
  onDownload,
  onPreview,
  inCart,
}: {
  produto: Produto;
  comprado: boolean;
  onAddToCart: (p: Produto) => void;
  onDownload: (p: Produto) => void;
  onPreview: (p: Produto) => void;
  inCart: boolean;
}) {
  const novo = isNovo(produto.publicado_em);
  const gratis = produto.gratuito || produto.preco === 0;

  return (
    <div
      className={cn(
        "group relative bg-white dark:bg-zinc-900 rounded-[24px] overflow-hidden flex flex-col transition-all duration-300",
        "border-2 border-transparent hover:border-primary/20",
        "shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.16)]",
        produto.destaque && "ring-2 ring-amber-400/60 ring-offset-2"
      )}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted">
        <ThumbnailDisplay produto={produto} />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {produto.destaque && (
            <span className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg">
              <Star className="w-2.5 h-2.5" /> DESTAQUE
            </span>
          )}
          {novo && !produto.destaque && (
            <span className="flex items-center gap-1 bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg">
              <Sparkles className="w-2.5 h-2.5" /> NOVO
            </span>
          )}
          {gratis && (
            <span className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg">
              <Gift className="w-2.5 h-2.5" /> GRÁTIS
            </span>
          )}
          {comprado && (
            <span className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg">
              <CheckCircle2 className="w-2.5 h-2.5" /> COMPRADO
            </span>
          )}
        </div>

        {/* Preview hover overlay */}
        {produto.preview_url && (
          <button
            onClick={() => onPreview(produto)}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 text-white text-xs font-bold"
          >
            <Eye className="w-4 h-4" /> Pré-visualizar
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        {produto.categoria && (
          <span className="self-start text-[9px] font-black uppercase tracking-widest text-primary/70 bg-primary/8 px-2 py-0.5 rounded-full border border-primary/15">
            {produto.categoria}
          </span>
        )}

        <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 flex-1">{produto.titulo}</h3>

        {produto.descricao && (
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{produto.descricao}</p>
        )}

        {/* Tags */}
        {produto.tags && produto.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {produto.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer: preço + tamanho */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className={cn(
            "text-base font-black",
            gratis ? "text-blue-600" : "text-primary"
          )}>
            {gratis ? "Grátis" : formatPrice(produto.preco)}
          </span>
          {produto.tamanho_bytes && (
            <span className="text-[10px] text-muted-foreground/60 font-medium">{formatBytes(produto.tamanho_bytes)}</span>
          )}
        </div>

        {/* Action button */}
        {comprado || gratis ? (
          <button
            onClick={() => onDownload(produto)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-wider active:scale-95 transition-all shadow-sm shadow-emerald-500/30"
          >
            <Download className="w-3.5 h-3.5" /> Baixar
          </button>
        ) : inCart ? (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[11px] font-black uppercase tracking-wider"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> No Carrinho
          </button>
        ) : (
          <button
            onClick={() => onAddToCart(produto)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-wider active:scale-95 transition-all shadow-sm shadow-primary/30"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> Adicionar
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Cart Drawer ──────────────────────────────────────────────────────────────
function CartDrawer({
  open,
  cart,
  onClose,
  onRemove,
  onChangeQty,
  onCheckout,
  checkingOut,
}: {
  open: boolean;
  cart: CartItem[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onChangeQty: (id: string, delta: number) => void;
  onCheckout: () => void;
  checkingOut: boolean;
}) {
  const total = cart.reduce((s, i) => s + i.produto.preco * i.quantidade, 0);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}
      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-zinc-900 z-50 shadow-2xl flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h2 className="text-base font-black text-foreground">Meu Carrinho</h2>
            {cart.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 opacity-20" />
              <p className="text-sm font-bold">Seu carrinho está vazio</p>
              <p className="text-xs text-center">Adicione materiais da vitrine para começar</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.produto.id} className="flex gap-3 bg-muted/40 rounded-2xl p-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-muted">
                  <ThumbnailDisplay produto={item.produto} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{item.produto.titulo}</p>
                  <p className="text-sm font-black text-primary mt-0.5">{formatPrice(item.produto.preco)}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button onClick={() => onChangeQty(item.produto.id, -1)} className="w-6 h-6 rounded-full bg-white border border-border flex items-center justify-center hover:bg-muted transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-black w-5 text-center">{item.quantidade}</span>
                    <button onClick={() => onChangeQty(item.produto.id, 1)} className="w-6 h-6 rounded-full bg-white border border-border flex items-center justify-center hover:bg-muted transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <button onClick={() => onRemove(item.produto.id)} className="w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors shrink-0 mt-0.5">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-muted-foreground">Total</span>
              <span className="text-xl font-black text-foreground">{formatPrice(total)}</span>
            </div>
            <button
              onClick={onCheckout}
              disabled={checkingOut}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-black text-sm uppercase tracking-wider active:scale-[0.98] transition-all shadow-lg shadow-primary/30 disabled:opacity-70"
            >
              {checkingOut ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Aguarde...</>
              ) : (
                <><CreditCard className="w-4 h-4" /> Pagar via Mercado Pago</>
              )}
            </button>
            <p className="text-[10px] text-muted-foreground text-center">
              🔒 Pagamento 100% seguro via Mercado Pago
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────
function PreviewModal({ produto, onClose }: { produto: Produto | null; onClose: () => void }) {
  if (!produto) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h3 className="font-black text-foreground">{produto.titulo}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">
          {produto.preview_url ? (
            <iframe src={produto.preview_url} className="w-full h-[400px] rounded-xl border border-border/50" />
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <p className="text-sm">Preview não disponível</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MaterialApoio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewProduto, setPreviewProduto] = useState<Produto | null>(null);

  // Buscar produtos
  useEffect(() => {
    async function fetch() {
      try {
        const { data, error } = await supabase
          .from("material_apoio")
          .select("*")
          .eq("ativo", true)
          .order("destaque", { ascending: false })
          .order("publicado_em", { ascending: false });
        if (error) throw error;
        setProdutos((data as Produto[]) || []);
        localStorage.setItem("ivc_materiais_ultimo_visto", new Date().toISOString());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  // Buscar compras do usuário
  useEffect(() => {
    if (!user) return;
    async function fetchPurchases() {
      const { data } = await supabase
        .from("store_purchases")
        .select("product_id")
        .eq("user_id", user!.id);
      if (data) setPurchasedIds(new Set(data.map((p: any) => p.product_id)));
    }
    fetchPurchases();
  }, [user]);

  // Cart actions
  const addToCart = useCallback((produto: Produto) => {
    setCart(prev => {
      const exists = prev.find(i => i.produto.id === produto.id);
      if (exists) return prev;
      return [...prev, { produto, quantidade: 1 }];
    });
    toast.success(`"${produto.titulo}" adicionado ao carrinho!`);
    setCartOpen(true);
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(i => i.produto.id !== id));
  }, []);

  const changeQty = useCallback((id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.produto.id !== id) return i;
      const newQty = i.quantidade + delta;
      return newQty < 1 ? i : { ...i, quantidade: newQty };
    }));
  }, []);

  // Download
  const handleDownload = useCallback(async (produto: Produto) => {
    // Grátis: link direto
    if (produto.gratuito || produto.preco === 0) {
      if (produto.arquivo_url) {
        window.open(produto.arquivo_url, "_blank");
      }
      return;
    }

    if (!user) {
      toast.error("Faça login para baixar o material.");
      return;
    }

    setDownloadingId(produto.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-download-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ product_id: produto.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao gerar link de download");
      window.open(json.url, "_blank");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDownloadingId(null);
    }
  }, [user]);

  // Checkout
  const handleCheckout = useCallback(async () => {
    if (!user) {
      toast.error("Faça login para continuar.");
      return;
    }
    if (cart.length === 0) return;

    setCheckingOut(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const items = cart.map(i => ({
        id: i.produto.id,
        titulo: i.produto.titulo,
        preco: i.produto.preco,
        quantidade: i.quantidade,
      }));

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-mp-preference`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao criar pagamento");

      // Redirecionar para checkout do Mercado Pago
      const checkoutUrl = json.init_point || json.sandbox_init_point;
      window.location.href = checkoutUrl;
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCheckingOut(false);
    }
  }, [cart, user]);

  // Filtros
  const categorias = [...new Set(produtos.map(p => p.categoria).filter(Boolean))] as string[];
  const filtered = produtos.filter(p => {
    const matchCat = filtro === "Todos" || p.categoria === filtro;
    const matchBusca =
      !busca.trim() ||
      p.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      (p.descricao || "").toLowerCase().includes(busca.toLowerCase()) ||
      (p.tags || []).some(t => t.toLowerCase().includes(busca.toLowerCase()));
    return matchCat && matchBusca;
  });

  const destaques = filtered.filter(p => p.destaque);
  const demais = filtered.filter(p => !p.destaque);
  const cartCount = cart.reduce((s, i) => s + i.quantidade, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-bounce-subtle">
          <div className="w-6 h-6 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-xs font-black text-primary/60 uppercase tracking-widest animate-pulse">Carregando loja...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5 pb-24">

        {/* ── HERO HEADER ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-5 shadow-xl shadow-primary/25 animate-fade-in">
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 60%)" }} />
          <div className="absolute right-4 bottom-0 opacity-5 pointer-events-none">
            <Crown className="w-28 h-28 text-white" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex-1">
              <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em] mb-0.5">iCatequese</p>
              <h1 className="text-xl font-black text-white leading-tight drop-shadow-sm">Loja de Materiais</h1>
              <p className="text-[11px] text-white/70 mt-0.5">PDFs, packs e recursos para catequistas</p>
            </div>
          </div>
        </div>

        {/* ── BUSCA ── */}
        <div className="relative animate-fade-in">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar materiais, temas, tags..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-2xl border border-border/60 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
        </div>

        {/* ── FILTROS ── */}
        {categorias.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide animate-fade-in">
            {["Todos", ...categorias].map(c => (
              <button
                key={c}
                onClick={() => setFiltro(c)}
                className={cn(
                  "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border",
                  filtro === c
                    ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                    : "bg-card text-muted-foreground border-border/50 hover:border-primary/30"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* ── DESTAQUES ── */}
        {destaques.length > 0 && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-black text-foreground uppercase tracking-wider">Em Destaque</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {destaques.map((p, i) => (
                <ProdutoCard
                  key={p.id}
                  produto={p}
                  comprado={purchasedIds.has(p.id)}
                  onAddToCart={addToCart}
                  onDownload={handleDownload}
                  onPreview={setPreviewProduto}
                  inCart={cart.some(c => c.produto.id === p.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── TODOS OS PRODUTOS ── */}
        {demais.length > 0 && (
          <div className="space-y-3 animate-fade-in">
            {destaques.length > 0 && (
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-xs font-black text-foreground uppercase tracking-wider">Todos os Materiais</h2>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {demais.map((p, i) => (
                <ProdutoCard
                  key={p.id}
                  produto={p}
                  comprado={purchasedIds.has(p.id)}
                  onAddToCart={addToCart}
                  onDownload={handleDownload}
                  onPreview={setPreviewProduto}
                  inCart={cart.some(c => c.produto.id === p.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty */}
        {filtered.length === 0 && !loading && (
          <div className="float-card p-10 text-center animate-float-up">
            <div className="icon-box bg-primary/10 text-primary mx-auto mb-3">
              <Package className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-muted-foreground">
              {busca || filtro !== "Todos" ? "Nenhum produto encontrado" : "Nenhum material disponível ainda"}
            </p>
            {(busca || filtro !== "Todos") && (
              <button onClick={() => { setBusca(""); setFiltro("Todos"); }} className="mt-3 text-xs font-bold text-primary hover:underline">
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {/* Info de segurança */}
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-muted/60 border border-border/40">
          <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Todos os pagamentos são processados com segurança pelo Mercado Pago. Após aprovação, o material ficará disponível para download imediato.
          </p>
        </div>
      </div>

      {/* ── FLOATING CART BUTTON ── */}
      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-24 right-4 z-30 flex items-center gap-2 pl-3 pr-4 py-3 rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/30 active:scale-95 transition-all animate-in slide-in-from-bottom-4"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="text-sm font-black">{cartCount}</span>
          <span className="text-xs font-bold hidden sm:inline">Ver Carrinho</span>
        </button>
      )}

      {/* ── CART DRAWER ── */}
      <CartDrawer
        open={cartOpen}
        cart={cart}
        onClose={() => setCartOpen(false)}
        onRemove={removeFromCart}
        onChangeQty={changeQty}
        onCheckout={handleCheckout}
        checkingOut={checkingOut}
      />

      {/* ── PREVIEW MODAL ── */}
      {previewProduto && (
        <PreviewModal produto={previewProduto} onClose={() => setPreviewProduto(null)} />
      )}
    </>
  );
}
