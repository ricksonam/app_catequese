import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  color?: string;
}

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-7 h-7",
};

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
  label,
  color = "text-amber-400",
}: StarRatingProps) {
  const iconClass = sizeMap[size];

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      )}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(star === value ? 0 : star)}
            className={cn(
              "transition-all duration-150",
              readOnly
                ? "cursor-default"
                : "hover:scale-125 active:scale-95 cursor-pointer"
            )}
          >
            <Star
              className={cn(
                iconClass,
                "transition-all duration-150",
                star <= value
                  ? cn(color, "fill-current")
                  : "text-muted-foreground/30 fill-transparent"
              )}
            />
          </button>
        ))}
        {!readOnly && value > 0 && (
          <span className="text-[10px] font-bold text-muted-foreground ml-1">
            {value}/5
          </span>
        )}
        {readOnly && value === 0 && (
          <span className="text-[10px] font-bold text-muted-foreground ml-1">
            Não avaliado
          </span>
        )}
      </div>
    </div>
  );
}

// Componente para exibir média com estrelas
export function StarAverage({ value, label }: { value: number; label?: string }) {
  const filled = Math.round(value);
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      )}
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "w-4 h-4 transition-all",
                star <= filled
                  ? "text-amber-400 fill-current"
                  : "text-muted-foreground/25 fill-transparent"
              )}
            />
          ))}
        </div>
        <span className="text-xs font-black text-foreground">
          {value > 0 ? value.toFixed(1) : "—"}
        </span>
      </div>
    </div>
  );
}
