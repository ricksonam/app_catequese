import React from "react";
import { ArrowLeft, Maximize, Minimize, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GameHeaderProps {
  title: string;
  subtitle: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onBack?: () => void;
  showHistoryBtn?: boolean;
  onShowHistory?: () => void;
  actionButtons?: React.ReactNode;
}

export function GameHeader({
  title,
  subtitle,
  isFullscreen = false,
  onToggleFullscreen,
  onBack,
  showHistoryBtn = false,
  onShowHistory,
  actionButtons,
}: GameHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md p-4 sm:p-6 border-b border-border shadow-sm">
      <div className="flex items-center justify-between">
        {!isFullscreen && (
          <button onClick={onBack || (() => navigate("/jogos"))} className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        
        <div className={cn("text-center flex-1", !isFullscreen && "pr-10")}>
          <h1 className="text-2xl font-black tracking-tight text-foreground font-liturgical leading-none">{title}</h1>
          {!isFullscreen && <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {showHistoryBtn && (
            <Button onClick={onShowHistory} variant="outline" className="hidden sm:flex rounded-xl font-bold gap-2">
              <Save className="h-4 w-4" /> Histórico
            </Button>
          )}
          {actionButtons}
          {onToggleFullscreen && (
            <Button onClick={onToggleFullscreen} variant="outline" size="icon" className="rounded-xl shrink-0">
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
