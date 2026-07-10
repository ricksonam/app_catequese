import {
  ShoppingCart, X, Download, Eye, FileText,
  Search, BookOpen, Star,
  Plus, Minus, Trash2, CreditCard, CheckCircle2,
  Package, Loader2, Gift, Lock,
  ChevronLeft, ChevronRight, Shield, Headphones, Award,
  SlidersHorizontal,
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
  gallery_urls?: string[] | null;
  paginas?: number | null;
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

// ─── Category Icons ───────────────────────────────────────────────────────────
const CATEGORIAS_VISUAIS = [
  {
    label: "Formações",
    emoji: "📖",
    color: "from-violet-400 to-purple-500",
    bg: "bg-violet-50",
    border: "border-violet-200",
    value: "Formações",
  },
  {
    label: "Encontros",
    emoji: "👥",
    color: "from-orange-300 to-amber-400",
    bg: "bg-orange-50",
    border: "border-orange-200",
    value: "Encontros",
  },
  {
    label: "Arquivos Digitais",
    emoji: "📄",
    color: "from-green-400 to-emerald-500",
    bg: "bg-green-50",
    border: "border-green-200",
    value: "Arquivos Digitais",
  },
  {
    label: "Kits e\nProdutos",
    emoji: "🎁",
    color: "from-pink-400 to-rose-500",
    bg: "bg-pink-50",
    border: "border-pink-200",
    value: "Kits e Produtos",
  },
  {
    label: "Jogos e\nDinâmicas",
    emoji: "🎮",
    color: "from-yellow-400 to-orange-400",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    value: "Jogos e Dinâmicas",
  },
  {
    label: "Liturgia e\nDevoção",
    emoji: "🕯️",
    color: "from-blue-400 to-indigo-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    value: "Liturgia e Devoção",
  },
];

// ─── Thumbnail Display ────────────────────────────────────────────────────────
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

// ─── Image Gallery Modal ──────────────────────────────────────────────────────
function ImageGalleryModal({
  produto,
  onClose,
  onAddToCart,
  onDownload,
  comprado,
  inCart,
}: {
  produto: Produto | null;
  onClose: () => void;
  onAddToCart: (p: Produto) => void;
  onDownload: (p: Produto) => void;
  comprado: boolean;
  inCart: boolean;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [imgErr, setImgErr] = useState(false);

  if (!produto) return null;

  const gratis = produto.gratuito || produto.preco === 0;

  // Build gallery from thumbnail + gallery_urls
  const galleryImages: string[] = [];
  if (produto.thumbnail_url) galleryImages.push(produto.thumbnail_url);
  if (produto.gallery_urls && produto.gallery_urls.length > 0) {
    galleryImages.push(...produto.gallery_urls.filter(u => u !== produto.thumbnail_url));
  }

  const hasMultiple = galleryImages.length > 1;

  const prev = () => setCurrentIdx(i => (i === 0 ? galleryImages.length - 1 : i - 1));
  const next = () => setCurrentIdx(i => (i === galleryImages.length - 1 ? 0 : i + 1));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 w-full sm:max-w-lg rounded-t-[28px] sm:rounded-[28px] overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex-1 min-w-0 pr-4">
            {produto.categoria && (
              <span className="inline-block text-[9px] font-black uppercase tracking-widest text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full mb-1">
                {produto.categoria}
              </span>
            )}
            <h3 className="text-base font-black text-foreground leading-tight line-clamp-2">{produto.titulo}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Image */}
        <div className="relative bg-gray-100 dark:bg-zinc-800 aspect-[4/3] overflow-hidden mx-5 rounded-2xl">
          {galleryImages.length > 0 && !imgErr ? (
            <img
              src={galleryImages[currentIdx]}
              alt={`${produto.titulo} - imagem ${currentIdx + 1}`}
              className="w-full h-full object-cover transition-opacity duration-300"
              onError={() => setImgErr(true)}
            />
          ) : (
            <ThumbnailDisplay produto={produto} />
          )}

          {/* Navigation arrows */}
          {hasMultiple && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-black/60 flex items-center justify-center shadow-md hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-black/60 flex items-center justify-center shadow-md hover:bg-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Dot indicators */}
          {hasMultiple && (
            <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5">
              {galleryImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className={cn(
                    "rounded-full transition-all duration-200",
                    i === currentIdx ? "w-4 h-2 bg-white" : "w-2 h-2 bg-white/50"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnails strip */}
        {hasMultiple && (
          <div className="flex gap-2 px-5 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {galleryImages.map((url, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={cn(
                  "w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all",
                  i === currentIdx ? "border-primary shadow-sm" : "border-transparent opacity-60"
                )}
              >
                <img src={url} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="px-5 py-3 flex-1 overflow-y-auto">
          {produto.descricao && (
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">{produto.descricao}</p>
          )}
          {produto.tags && produto.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {produto.tags.map(tag => (
                <span key={tag} className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {produto.tamanho_bytes && (
            <p className="text-[11px] text-muted-foreground/70 mb-2">📦 Tamanho: {formatBytes(produto.tamanho_bytes)}</p>
          )}
        </div>

        {/* Footer Action */}
        <div className="px-5 pb-6 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between mb-3">
            <span className={cn("text-2xl font-black", gratis ? "text-blue-600" : "text-primary")}>
              {gratis ? "Grátis" : formatPrice(produto.preco)}
            </span>
            {comprado && (
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Já comprado
              </span>
            )}
          </div>

          {comprado || gratis ? (
            <button
              onClick={() => { onDownload(produto); onClose(); }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-500 text-white font-black text-sm uppercase tracking-wider active:scale-95 transition-all shadow-md shadow-emerald-500/25"
            >
              <Download className="w-4 h-4" /> Baixar Material
            </button>
          ) : inCart ? (
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary/10 text-primary border-2 border-primary/20 font-black text-sm uppercase tracking-wider"
            >
              <CheckCircle2 className="w-4 h-4" /> Já está no Carrinho
            </button>
          ) : (
            <button
              onClick={() => { onAddToCart(produto); onClose(); }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider active:scale-95 transition-all shadow-md shadow-primary/25"
            >
              <ShoppingCart className="w-4 h-4" /> Adicionar ao Carrinho
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProdutoCard({
  produto,
  comprado,
  onAddToCart,
  onDownload,
  onOpenGallery,
  inCart,
}: {
  produto: Produto;
  comprado: boolean;
  onAddToCart: (p: Produto) => void;
  onDownload: (p: Produto) => void;
  onOpenGallery: (p: Produto) => void;
  inCart: boolean;
}) {
  const novo = isNovo(produto.publicado_em);
  const gratis = produto.gratuito || produto.preco === 0;

  // Badge label based on category
  const badgeLabel = produto.categoria || "Arquivo Digital";
  const badgeColor = produto.categoria?.includes("Kit")
    ? "bg-teal-600"
    : "bg-violet-600";

  return (
    <div
      className={cn(
        "bg-white dark:bg-zinc-900 rounded-[20px] overflow-hidden flex flex-col shadow-md hover:shadow-xl transition-all duration-300",
        "border border-gray-100 dark:border-zinc-800",
        produto.destaque && "ring-2 ring-amber-400/50"
      )}
    >
      {/* Thumbnail — clickable to open gallery */}
      <button
        onClick={() => onOpenGallery(produto)}
        className="relative w-full aspect-[3/2.5] overflow-hidden bg-gray-100 dark:bg-zinc-800 group focus:outline-none"
      >
        <ThumbnailDisplay produto={produto} />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 bg-white/90 text-gray-800 text-[11px] font-bold px-3 py-1.5 rounded-full shadow">
            <Eye className="w-3.5 h-3.5" /> Ver fotos
          </div>
        </div>

        {/* Badge bottom left */}
        <div className="absolute bottom-2 left-2">
          <span className={cn("text-[9px] font-black text-white px-2 py-0.5 rounded-full", badgeColor)}>
            {badgeLabel}
          </span>
        </div>

        {/* Novo / Destaque badge */}
        {produto.destaque && (
          <div className="absolute top-2 left-2">
            <span className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow">
              <Star className="w-2 h-2" /> DESTAQUE
            </span>
          </div>
        )}
        {novo && !produto.destaque && (
          <div className="absolute top-2 right-2">
            <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow">NOVO</span>
          </div>
        )}
        {gratis && (
          <div className="absolute top-2 right-2">
            <span className="flex items-center gap-1 bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow">
              <Gift className="w-2 h-2" /> GRÁTIS
            </span>
          </div>
        )}
      </button>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        <h3 className="text-[13px] font-black text-foreground leading-snug line-clamp-1">{produto.titulo}</h3>
        {produto.descricao && (
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{produto.descricao}</p>
        )}

        {/* Price + cart */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className={cn("text-sm font-black", gratis ? "text-blue-600" : "text-primary")}>
            {gratis ? "Grátis" : formatPrice(produto.preco)}
          </span>

          {comprado || gratis ? (
            <button
              onClick={() => onDownload(produto)}
              className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
            </button>
          ) : inCart ? (
            <button
              disabled
              className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onAddToCart(produto)}
              className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center active:scale-95 transition-all hover:bg-primary hover:text-white"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cart Drawer ──────────────────────────────────────────────────────────────
function CartDrawer({
  open, cart, onClose, onRemove, onChangeQty, onCheckout, checkingOut,
}: {
  open: boolean; cart: CartItem[]; onClose: () => void;
  onRemove: (id: string) => void; onChangeQty: (id: string, delta: number) => void;
  onCheckout: () => void; checkingOut: boolean;
}) {
  const total = cart.reduce((s, i) => s + i.produto.preco * i.quantidade, 0);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-zinc-900 z-50 shadow-2xl flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
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

        {cart.length > 0 && (
          <div className="p-4 pb-24 sm:pb-4 border-t border-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-muted-foreground">Total</span>
              <span className="text-xl font-black text-foreground">{formatPrice(total)}</span>
            </div>
            <button
              onClick={onCheckout}
              disabled={checkingOut}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider active:scale-[0.98] transition-all shadow-lg shadow-primary/30 disabled:opacity-70 hover:bg-primary/90"
            >
              {checkingOut ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Aguarde...</>
              ) : (
                <>Finalizar compra</>
              )}
            </button>
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center py-2.5 rounded-xl bg-muted text-muted-foreground font-bold text-xs hover:bg-muted/80 transition-colors"
            >
              Adicionar mais produtos
            </button>
            <p className="text-[10px] text-muted-foreground text-center">🔒 Ambiente 100% seguro</p>
          </div>
        )}
      </div>
    </>
  );
}

function CheckoutConfirmModal({
  open, cart, userName, total, onClose, onConfirm, checkingOut
}: {
  open: boolean; cart: CartItem[]; userName: string; total: number; onClose: () => void; onConfirm: () => void; checkingOut: boolean;
}) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-[28px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col border border-border/50 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border/50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-foreground">Confira seu pedido</h3>
            <p className="text-sm text-muted-foreground mt-1">Quase lá! Revise os itens abaixo.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Comprador</p>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{userName || "Cliente"}</p>
                <p className="text-xs text-muted-foreground">O acesso será liberado para esta conta.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Resumo ({cart.length} itens)</p>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
              {cart.map(item => (
                <div key={item.produto.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="font-bold text-primary">{item.quantidade}x</span>
                    <span className="truncate text-foreground/80">{item.produto.titulo}</span>
                  </div>
                  <span className="font-bold shrink-0">{formatPrice(item.produto.preco * item.quantidade)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-border/50">
              <span className="font-bold text-foreground">Total a pagar:</span>
              <span className="text-xl font-black text-primary">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-border/50 space-y-3">
          <button
            onClick={onConfirm}
            disabled={checkingOut}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#009EE3] hover:bg-[#008ACA] text-white font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20 disabled:opacity-70"
          >
            {checkingOut ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
            ) : (
              <><CreditCard className="w-5 h-5" /> Pagar com Mercado Pago</>
            )}
          </button>
          <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Transação 100% segura
          </p>
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
  const [activeTab, setActiveTab] = useState("Todos");
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);
  const [showFiltros, setShowFiltros] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [galleryProduto, setGalleryProduto] = useState<Produto | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);

  // Fetch user name
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from("profiles").select("nome").eq("id", user.id).single();
      if (data) {
        setUserName(data.nome || user.email || "Cliente");
      }
    };
    fetchProfile();
  }, [user]);

  // Mock products for display when DB is empty
  const MOCK_PRODUCTS: Produto[] = [
    {
      id: "mock-1",
      titulo: "Encontro com Amor",
      descricao: "Roteiro completo para encontros de catequese",
      categoria: "Encontros",
      arquivo_url: null,
      arquivo_tipo: "pdf",
      thumbnail_url: "/produto_encontro_amor.png",
      preview_url: null,
      tamanho_bytes: 2048000,
      publicado_em: new Date().toISOString(),
      ativo: true,
      preco: 14.90,
      gratuito: false,
      destaque: true,
      tags: ["catequese", "encontro", "roteiro"],
      gallery_urls: ["/produto_encontro_amor.png"],
    },
    {
      id: "mock-2",
      titulo: "Jogo Bíblico",
      descricao: "Jogo interativo em PDF + orientações",
      categoria: "Jogos e Dinâmicas",
      arquivo_url: null,
      arquivo_tipo: "pdf",
      thumbnail_url: "/produto_jogo_biblico.png",
      preview_url: null,
      tamanho_bytes: 5120000,
      publicado_em: new Date().toISOString(),
      ativo: true,
      preco: 9.90,
      gratuito: false,
      destaque: true,
      tags: ["jogo", "bíblia", "dinâmica"],
      gallery_urls: ["/produto_jogo_biblico.png"],
    },
    {
      id: "mock-3",
      titulo: "Kit Eucaristia",
      descricao: "Materiais prontos para a preparação da Eucaristia",
      categoria: "Kits e Produtos",
      arquivo_url: null,
      arquivo_tipo: "pdf",
      thumbnail_url: "/produto_kit_eucaristia.png",
      preview_url: null,
      tamanho_bytes: 10240000,
      publicado_em: new Date().toISOString(),
      ativo: true,
      preco: 29.90,
      gratuito: false,
      destaque: true,
      tags: ["eucaristia", "kit", "sacramento"],
      gallery_urls: ["/produto_kit_eucaristia.png"],
    },
    {
      id: "mock-4",
      titulo: "Liturgia Diária",
      descricao: "Sugestões de orações e reflexões diárias",
      categoria: "Liturgia e Devoção",
      arquivo_url: null,
      arquivo_tipo: "pdf",
      thumbnail_url: "/produto_liturgia_diaria.png",
      preview_url: null,
      tamanho_bytes: 3072000,
      publicado_em: new Date().toISOString(),
      ativo: true,
      preco: 7.90,
      gratuito: false,
      destaque: true,
      tags: ["liturgia", "oração", "reflexão"],
      gallery_urls: ["/produto_liturgia_diaria.png"],
    },
  ];

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
        const fetched = (data as Produto[]) || [];
        setProdutos(fetched.length > 0 ? fetched : MOCK_PRODUCTS);
        localStorage.setItem("ivc_materiais_ultimo_visto", new Date().toISOString());
      } catch (err) {
        console.error(err);
        setProdutos(MOCK_PRODUCTS);
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
    if (produto.id.startsWith("mock-")) {
      toast.info("Este é um produto de demonstração.");
      return;
    }
    if (produto.gratuito || produto.preco === 0) {
      if (produto.arquivo_url) window.open(produto.arquivo_url, "_blank");
      return;
    }
    if (!user) { toast.error("Faça login para baixar o material."); return; }
    setDownloadingId(produto.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-download-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
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
    if (!user) { toast.error("Faça login para continuar."); return; }
    if (cart.length === 0) return;
    setCheckingOut(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const items = cart.map(i => ({ id: i.produto.id, titulo: i.produto.titulo, preco: i.produto.preco, quantidade: i.quantidade }));
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-mp-preference`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao criar pagamento");
      window.location.href = json.init_point || json.sandbox_init_point;
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCheckingOut(false);
    }
  }, [cart, user]);

  // Filter logic
  const filtered = produtos.filter(p => {
    const matchCat = filtroCategoria === null || p.categoria === filtroCategoria;
    const matchTab =
      activeTab === "Todos" ? true :
      activeTab === "Mais vendidos" ? p.destaque :
      activeTab === "Novidades" ? isNovo(p.publicado_em) :
      activeTab === "Promoções" ? (p.preco > 0 && p.preco < 15) :
      true;
    const matchBusca =
      !busca.trim() ||
      p.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      (p.descricao || "").toLowerCase().includes(busca.toLowerCase()) ||
      (p.tags || []).some(t => t.toLowerCase().includes(busca.toLowerCase()));
    return matchCat && matchTab && matchBusca;
  });

  const destaques = filtered.filter(p => p.destaque);
  const demais = filtered.filter(p => !p.destaque);
  const cartCount = cart.reduce((s, i) => s + i.quantidade, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <div className="w-6 h-6 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-xs font-black text-primary/60 uppercase tracking-widest animate-pulse">Carregando loja...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-0 pb-28 bg-gray-50 dark:bg-zinc-950 min-h-screen -mx-4 px-0">

        {/* ── TOP HEADER ── */}
        <div className="bg-white dark:bg-zinc-900 px-4 pt-3 pb-3 flex items-center justify-between shadow-sm sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg overflow-hidden">
                <img src="/icone_loja.png" alt="Loja" className="w-full h-full object-cover" onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.display = 'none';
                  const parent = el.parentElement;
                  if (parent) {
                    parent.innerHTML = '🏪';
                    parent.className += ' flex items-center justify-center text-lg';
                  }
                }} />
              </div>
              <span className="text-[15px] font-black text-primary">Loja</span>
            </div>
          </div>

          {/* Cart button */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative w-9 h-9 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        <div className="px-4">

          {/* ── SEARCH BAR ── */}
          <div className="flex gap-2 mt-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar produtos e arquivos..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-sm"
              />
            </div>
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className={cn(
                "h-11 px-4 rounded-2xl border text-sm font-bold flex items-center gap-2 shadow-sm transition-all",
                showFiltros
                  ? "bg-primary text-white border-primary"
                  : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
            </button>
          </div>

          {/* ── CATEGORY ICONS ── */}
          <div className="grid grid-cols-6 gap-2 mb-5">
            {CATEGORIAS_VISUAIS.map(cat => (
              <button
                key={cat.value}
                onClick={() => setFiltroCategoria(filtroCategoria === cat.value ? null : cat.value)}
                className="flex flex-col items-center gap-1.5"
              >
                <div
                  className={cn(
                    "w-full aspect-square rounded-[18px] flex items-center justify-center text-xl border-2 transition-all",
                    cat.bg, cat.border,
                    filtroCategoria === cat.value && "ring-2 ring-primary scale-95"
                  )}
                  style={{ minWidth: 0 }}
                >
                  <span style={{ fontSize: "1.4rem" }}>{cat.emoji}</span>
                </div>
                <span className="text-[8px] font-bold text-center leading-tight text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>

          {/* ── DESTAQUES SECTION ── */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black text-foreground">Destaques</h2>
              <button className="text-sm font-bold text-primary flex items-center gap-1">
                Ver todos <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Tab filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-4">
              {["Todos", "Mais vendidos", "Novidades", "Promoções"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all",
                    activeTab === tab
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-zinc-700 hover:border-primary/30"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Product grid — destaques */}
            {destaques.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {destaques.map(p => (
                  <ProdutoCard
                    key={p.id}
                    produto={p}
                    comprado={purchasedIds.has(p.id)}
                    onAddToCart={addToCart}
                    onDownload={handleDownload}
                    onOpenGallery={setGalleryProduto}
                    inCart={cart.some(c => c.produto.id === p.id)}
                  />
                ))}
              </div>
            )}

            {/* Non-featured products */}
            {demais.length > 0 && (
              <>
                {destaques.length > 0 && (
                  <div className="flex items-center gap-2 mb-3 mt-2">
                    <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-700" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mais produtos</span>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-700" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {demais.map(p => (
                    <ProdutoCard
                      key={p.id}
                      produto={p}
                      comprado={purchasedIds.has(p.id)}
                      onAddToCart={addToCart}
                      onDownload={handleDownload}
                      onOpenGallery={setGalleryProduto}
                      inCart={cart.some(c => c.produto.id === p.id)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Package className="w-7 h-7 text-primary/50" />
                </div>
                <p className="text-sm font-bold text-muted-foreground">Nenhum produto encontrado</p>
                {(busca || filtroCategoria || activeTab !== "Todos") && (
                  <button
                    onClick={() => { setBusca(""); setFiltroCategoria(null); setActiveTab("Todos"); }}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── TRUST BAR ── */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30 p-4 mb-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Shield, title: "Compra segura", sub: "Seus dados protegidos" },
                { icon: Download, title: "Download imediato", sub: "Acesso rápido aos arquivos" },
                { icon: Headphones, title: "Suporte especializado", sub: "Estamos aqui para ajudar" },
                { icon: Award, title: "Conteúdo de qualidade", sub: "Feito para catequistas" },
              ].map(({ icon: Icon, title, sub }) => (
                <div key={title} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 border border-blue-100 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-foreground leading-tight">{title}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── GALLERY MODAL ── */}
      {galleryProduto && (
        <ImageGalleryModal
          produto={galleryProduto}
          onClose={() => setGalleryProduto(null)}
          onAddToCart={addToCart}
          onDownload={handleDownload}
          comprado={purchasedIds.has(galleryProduto.id)}
          inCart={cart.some(c => c.produto.id === galleryProduto.id)}
        />
      )}

      {/* ── CART DRAWER ── */}
      <CartDrawer
        open={cartOpen}
        cart={cart}
        onClose={() => setCartOpen(false)}
        onRemove={removeFromCart}
        onChangeQty={changeQty}
        onCheckout={() => setShowCheckoutConfirm(true)}
        checkingOut={checkingOut}
      />
      
      <CheckoutConfirmModal
        open={showCheckoutConfirm}
        cart={cart}
        userName={userName}
        total={cart.reduce((s, i) => s + i.produto.preco * i.quantidade, 0)}
        onClose={() => setShowCheckoutConfirm(false)}
        onConfirm={handleCheckout}
        checkingOut={checkingOut}
      />
    </>
  );
}
