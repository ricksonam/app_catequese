import { useState, useEffect } from "react";
import { PlayCircle, Clock, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameTimerButtonProps {
  onTimeUp: () => void;
  className?: string;
  duration?: number; // em segundos
  disabled?: boolean;
}

export function GameTimerButton({ onTimeUp, className, duration = 10, disabled = false }: GameTimerButtonProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0 && !hasFinished) {
      setIsRunning(false);
      setHasFinished(true);
      // Play a quick beep sound
      try {
        const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {}
      onTimeUp();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, hasFinished, onTimeUp]);

  const startTimer = () => {
    if (disabled || isRunning || hasFinished) return;
    setIsRunning(true);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setHasFinished(false);
    setTimeLeft(duration);
  };

  // Se external trigger reinicia (ex: nova pergunta), podemos permitir ref usar
  // Mas no React geralmente preferimos unmount/mount usando a key da pergunta.

  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isRunning || hasFinished ? circumference - (timeLeft / duration) * circumference : 0;
  
  // Cores dinâmicas baseadas no tempo e estado
  const getColorClass = () => {
    if (hasFinished) return "text-destructive stroke-destructive";
    if (isRunning && timeLeft <= 3) return "text-amber-500 stroke-amber-500";
    if (isRunning) return "text-primary stroke-primary";
    return "text-muted-foreground stroke-muted-foreground";
  };
  
  const getBgClass = () => {
    if (hasFinished) return "bg-destructive/10 border-destructive/20";
    if (isRunning && timeLeft <= 3) return "bg-amber-500/10 border-amber-500/20";
    if (isRunning) return "bg-primary/10 border-primary/20";
    return "bg-muted/50 border-border hover:bg-muted transition-colors";
  };

  return (
    <button
      onClick={startTimer}
      disabled={disabled || isRunning || hasFinished}
      className={cn(
        "relative flex items-center justify-center p-2 rounded-full border-2 transition-all overflow-hidden shrink-0 group",
        getBgClass(),
        className,
        !isRunning && !hasFinished && !disabled ? "active:scale-95" : ""
      )}
      title="Iniciar Tempo (10s)"
    >
      {/* Círculo do timer - SVG */}
      <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 64 64">
        {/* Fundo do anel */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          className="stroke-current opacity-20"
          strokeWidth="4"
          fill="none"
        />
        {/* Anel de progresso */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          className={cn("stroke-current transition-all duration-1000 ease-linear", getColorClass())}
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      
      {/* Icone / Número Central */}
      <div className={cn("relative z-10 w-12 h-12 flex items-center justify-center font-black transition-all", getColorClass())}>
        {!isRunning && !hasFinished ? (
          <Clock className="h-6 w-6 opacity-70 group-hover:scale-110 group-hover:opacity-100 transition-all" />
        ) : isRunning ? (
          <span className={cn("text-xl", timeLeft <= 3 ? "animate-pulse" : "")}>{timeLeft}</span>
        ) : (
          <span className="text-xl">0</span>
        )}
      </div>
    </button>
  );
}
