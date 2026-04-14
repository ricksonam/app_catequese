import React, { useState, useEffect, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface CustomDatePickerProps {
  value: string; // ISO date string YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
}

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function ScrollToValue({ selected, children, isOpen }: { selected: boolean; children: React.ReactNode; isOpen: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selected && isOpen && ref.current) {
      const timer = setTimeout(() => {
        ref.current?.scrollIntoView({ block: "center", behavior: "auto" });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selected, isOpen]);

  return (
    <div className="w-full">
      {React.cloneElement(children as React.ReactElement, { ref })}
    </div>
  );
}

export function CustomDatePicker({ value, onChange, label }: CustomDatePickerProps) {
  // Parse date or use null
  const initialDate = value ? new Date(value + 'T12:00:00') : null;
  const [tempDate, setTempDate] = useState<{ d: number | null, m: number | null, y: number | null }>({
    d: initialDate ? initialDate.getDate() : null,
    m: initialDate ? initialDate.getMonth() : null,
    y: initialDate ? initialDate.getFullYear() : null
  });

  const [openDay, setOpenDay] = useState(false);
  const [openMonth, setOpenMonth] = useState(false);
  const [openYear, setOpenYear] = useState(false);
  
  // Years list (up to 100 years ago)
  const years = Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - i);
  // Days list (based on currently selected month/year, default to 31 if not selected)
  const currentYear = tempDate.y || new Date().getFullYear();
  const currentMonth = tempDate.m !== null ? tempDate.m : new Date().getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const updateDate = (newDay: number | null, newMonth: number | null, newYear: number | null) => {
    const updated = { d: newDay, m: newMonth, y: newYear };
    setTempDate(updated);
    
    // If all parts are selected, call onChange
    if (updated.d !== null && updated.m !== null && updated.y !== null) {
      const maxDays = new Date(updated.y, updated.m + 1, 0).getDate();
      const validDay = Math.min(updated.d, maxDays);
      
      const yyyy = updated.y;
      const mm = String(updated.m + 1).padStart(2, '0');
      const dd = String(validDay).padStart(2, '0');
      onChange(`${yyyy}-${mm}-${dd}`);
    }
  };

  return (
    <div className="space-y-1 w-full animate-in fade-in slide-in-from-top-1">
      {label && <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">{label}</label>}
      <div className="flex gap-2">
        {/* Day Selector */}
        <Popover open={openDay} onOpenChange={setOpenDay}>
          <PopoverTrigger asChild>
            <button className="flex-1 flex items-center justify-between h-12 px-4 py-2 text-base font-black bg-white border-2 border-black/10 rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all shadow-sm active:scale-95">
              <span className={cn(!tempDate.d && "text-muted-foreground/60")}>
                {tempDate.d ? tempDate.d.toString().padStart(2, '0') : "Dia"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50 text-primary" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-2 rounded-2xl border-2 shadow-2xl" align="start">
            <div className="max-h-[280px] overflow-y-auto p-1 grid grid-cols-4 gap-2">
              {days.map((d) => (
                <ScrollToValue key={d} selected={d === tempDate.d} isOpen={openDay}>
                  <button
                    onClick={() => { updateDate(d, tempDate.m, tempDate.y); setOpenDay(false); }}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center text-sm rounded-xl transition-all font-bold",
                      d === tempDate.d 
                        ? "bg-primary text-primary-foreground shadow-lg scale-110 z-10" 
                        : "hover:bg-primary/10 text-foreground/70"
                    )}
                  >
                    {d}
                  </button>
                </ScrollToValue>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Month Selector */}
        <Popover open={openMonth} onOpenChange={setOpenMonth}>
          <PopoverTrigger asChild>
            <button className="flex-[2] flex items-center justify-between h-12 px-4 py-2 text-base font-black bg-white border-2 border-black/10 rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all shadow-sm active:scale-95">
              <span className={cn("truncate text-left", tempDate.m === null && "text-muted-foreground/60")}>
                {tempDate.m !== null ? months[tempDate.m] : "Mês"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50 text-primary" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-2 rounded-2xl border-2 shadow-2xl" align="start">
            <div className="max-h-[280px] overflow-y-auto p-1 flex flex-col gap-1.5">
              {months.map((m, i) => (
                <ScrollToValue key={m} selected={i === tempDate.m} isOpen={openMonth}>
                  <button
                    onClick={() => { updateDate(tempDate.d, i, tempDate.y); setOpenMonth(false); }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-sm rounded-xl transition-all font-bold",
                      i === tempDate.m 
                        ? "bg-primary text-primary-foreground shadow-lg translate-x-1" 
                        : "hover:bg-primary/10 text-foreground/70"
                    )}
                  >
                    {m}
                  </button>
                </ScrollToValue>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Year Selector */}
        <Popover open={openYear} onOpenChange={setOpenYear}>
          <PopoverTrigger asChild>
            <button className="flex-[1.2] flex items-center justify-between h-12 px-4 py-2 text-base font-black bg-white border-2 border-black/10 rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all shadow-sm active:scale-95">
              <span className={cn(!tempDate.y && "text-muted-foreground/60")}>
                {tempDate.y ? tempDate.y : "Ano"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50 text-primary" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[140px] p-2 rounded-2xl border-2 shadow-2xl" align="start">
            <div className="max-h-[280px] overflow-y-auto p-1 flex flex-col gap-1.5">
              {years.map((y) => (
                <ScrollToValue key={y} selected={y === tempDate.y} isOpen={openYear}>
                  <button
                    onClick={() => { updateDate(tempDate.d, tempDate.m, y); setOpenYear(false); }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-sm rounded-xl transition-all font-bold",
                      y === tempDate.y 
                        ? "bg-primary text-primary-foreground shadow-lg translate-x-1" 
                        : "hover:bg-primary/10 text-foreground/70"
                    )}
                  >
                    {y}
                  </button>
                </ScrollToValue>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
