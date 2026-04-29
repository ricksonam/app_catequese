import { useQuery } from "@tanstack/react-query";
// Trigger deploy fix
import { supabase } from "@/integrations/supabase/client";
import {
  Shield, PlusCircle, Pencil, Trash2, Users,
  RefreshCw, X, Clock
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AuditEntry {
  id: string;
  user_email: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  entity_type: string;
  entity_name: string;
  created_at: string;
}

async function fetchAuditLog(turmaId: string): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .eq("turma_id", turmaId)
    .order("created_at", { ascending: false })
    .limit(200);
    
  if (error) throw error;
  return (data as any[]) || [];
}

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  INSERT: { label: "Criou",   color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: PlusCircle },
  UPDATE: { label: "Editou",  color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    icon: Pencil },
  DELETE: { label: "Excluiu", color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     icon: Trash2 },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora mesmo";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d} dia${d > 1 ? "s" : ""}`;
}

function fullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

interface AuditLogModalProps {
  turmaId: string;
  open: boolean;
  onClose: () => void;
}

export function AuditLogModal({ turmaId, open, onClose }: AuditLogModalProps) {
  const { data: logs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["audit_log", turmaId],
    queryFn: () => fetchAuditLog(turmaId),
    enabled: open,
    staleTime: 0,
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md w-[95vw] rounded-[28px] p-0 border-none shadow-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-950 flex flex-col max-h-[85vh]">

        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 pt-6 pb-5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all active:scale-90 shadow-sm border border-white/10"
                title="Atualizar"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 text-white", isFetching && "animate-spin")} />
              </button>
              <div>
                <h2 className="text-base font-black text-white tracking-tight">Log de Auditoria</h2>
                <p className="text-[10px] text-white/70 font-medium">Atividades dos catequistas vinculados</p>
              </div>
            </div>
          </div>

          {/* Contagem */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-2xl font-black text-white">{logs.length}</span>
            <span className="text-sm text-white/70 font-medium">
              {logs.length === 1 ? "registro" : "registros"} de atividade
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
              <p className="text-xs text-muted-foreground font-medium">Carregando registros...</p>
            </div>
          )}

          {!isLoading && logs.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center gap-3">
              <div className="w-16 h-16 rounded-3xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                <Users className="h-7 w-7 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Nenhuma atividade ainda</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                  As ações dos catequistas vinculados aparecerão aqui em tempo real.
                </p>
              </div>
            </div>
          )}

          {!isLoading && logs.map((entry) => {
            const cfg = ACTION_CONFIG[entry.action] ?? ACTION_CONFIG.UPDATE;
            const Icon = cfg.icon;
            const emailShort = entry.user_email?.split("@")[0] ?? "Usuário";

            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-border/30 shadow-sm"
              >
                {/* Ícone ação */}
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                  cfg.bg, cfg.border
                )}>
                  <Icon className={cn("h-4 w-4", cfg.color)} />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-xs font-black text-foreground">{emailShort}</span>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border",
                      cfg.bg, cfg.border, cfg.color
                    )}>
                      {cfg.label}
                    </span>
                    <span className="text-[9px] font-semibold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
                      {entry.entity_type}
                    </span>
                  </div>

                  {entry.entity_name && (
                    <p className="text-[11px] text-foreground font-semibold truncate">
                      "{entry.entity_name}"
                    </p>
                  )}

                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground/60" />
                    <span className="text-[9px] text-muted-foreground" title={fullDate(entry.created_at)}>
                      {timeAgo(entry.created_at)} · {fullDate(entry.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {logs.length > 0 && (
          <div className="px-4 py-3 border-t border-border/30 shrink-0">
            <p className="text-[9px] text-center text-muted-foreground">
              Exibindo os últimos {logs.length} registros · Apenas ações de membros vinculados
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
