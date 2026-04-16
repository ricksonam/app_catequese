import React from 'react';
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const Spinner = ({ size = 'md', text, className, ...props }: SpinnerProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  const iconSizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-[3px]",
    lg: "w-8 h-8 border-4"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)} {...props}>
      <div className={cn(
        "rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5 animate-bounce-subtle",
        sizeClasses[size]
      )}>
        <div className={cn(
          "border-primary/30 border-t-primary rounded-full animate-spin",
          iconSizeClasses[size]
        )} />
      </div>
      {text && (
        <p className="text-xs font-black text-primary/60 uppercase tracking-widest animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default Spinner;
