import { ETAPAS_CATEQUESE } from "@/lib/store";
import { Check } from "lucide-react";

interface EtapaMapProps {
  etapaAtual?: string;
  onSelect?: (etapaId: string) => void;
  readonly?: boolean;
}

export function EtapaMap({ etapaAtual, onSelect, readonly = false }: EtapaMapProps) {
  const currentIdx = ETAPAS_CATEQUESE.findIndex((e) => e.id === etapaAtual);

  return (
    <div className="flex items-center gap-1 w-full">
      {ETAPAS_CATEQUESE.map((etapa, i) => {
        const isCompleted = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isClickable = !readonly && onSelect;

        return (
          <div key={etapa.id} className="flex-1 flex flex-col items-center">
            <button
              disabled={!isClickable}
              onClick={() => isClickable && onSelect(etapa.id)}
              className={`w-full relative flex flex-col items-center transition-all ${
                isClickable ? "cursor-pointer" : "cursor-default"
              }`}
            >
              {/* Connector line */}
              <div className="flex items-center w-full mb-2">
                {i > 0 && (
                  <div
                    className={`flex-1 h-1 rounded-full ${
                      isCompleted || isCurrent ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                    isCurrent
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : isCompleted
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                {i < ETAPAS_CATEQUESE.length - 1 && (
                  <div
                    className={`flex-1 h-1 rounded-full ${
                      isCompleted ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
              <span
                className={`text-[9px] leading-tight text-center font-medium ${
                  isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {etapa.label}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
