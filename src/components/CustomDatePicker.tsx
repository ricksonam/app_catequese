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

export function CustomDatePicker({ value, onChange, label }: CustomDatePickerProps) {
  const initialDate = value ? new Date(value + 'T12:00:00') : null;
  const [tempDate, setTempDate] = useState<{ d: number | null, m: number | null, y: number | null }>({
    d: initialDate ? initialDate.getDate() : null,
    m: initialDate ? initialDate.getMonth() : null,
    y: initialDate ? initialDate.getFullYear() : null
  });

  const [openDay, setOpenDay] = useState(false);
  const [openMonth, setOpenMonth] = useState(false);
  const [openYear, setOpenYear] = useState(false);
  
  const years = Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - i);
  const currentYear = tempDate.y || new Date().getFullYear();
  const currentMonth = tempDate.m !== null ? tempDate.m : new Date().getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const updateDate = (newDay: number | null, newMonth: number | null, newYear: number | null) => {
    const updated = { d: newDay, m: newMonth, y: newYear };
    setTempDate(updated);
    
    if (updated.d !== null && updated.m !== null && updated.y !== null) {
      const maxDays = new Date(updated.y, updated.m + 1, 0).getDate();
      const validDay = Math.min(updated.d, maxDays);
      const mm = String(updated.m + 1).padStart(2, '0');
      const dd = String(validDay).padStart(2, '0');
      onChange(`${updated.y}-${mm}-${dd}`);
    }
  };

  // Helper to handle scrolling to selected item manually once when opened
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if ((openDay || openMonth || openYear) && scrollRef.current) {
      const selected = scrollRef.current.querySelector('[data-selected="true"]');
      if (selected) {
        selected.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    }
  }, [openDay, openMonth, openYear]);

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
          <PopoverContent className="w-[200px] p-2 rounded-2xl border-2 shadow-2xl z-[100]" align="start">
            <div 
              ref={openDay ? scrollRef : null}
              className="max-h-[250px] overflow-y-auto p-1 grid grid-cols-4 gap-2 overscroll-contain touch-pan-y"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {days.map((d) => (
                <button
                  key={d}
                  data-selected={d === tempDate.d}
                  onClick={() => { updateDate(d, tempDate.m, tempDate.y); setOpenDay(false); }}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center text-sm rounded-xl transition-all font-bold",
                    d === tempDate.d 
                      ? "bg-primary text-primary-foreground shadow-lg scale-110 z-10" 
                      : "hover:bg-primary/10 text-foreground"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Month Selector */}
        <Popover open={openMonth} onOpenChange={setOpenMonth}>
          <PopoverTrigger asChild>
            <button className="flex-[2] flex items-center justify-between h-12 px-4 py-2 text-base font-black bg-white border-2 border-black/10 rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all shadow-sm active:scale-95">
              <span className="truncate text-left">
                {tempDate.m !== null ? months[tempDate.m] : "Mês"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50 text-primary" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-2 rounded-2xl border-2 shadow-2xl z-[100]" align="start">
            <div 
              ref={openMonth ? scrollRef : null}
              className="max-h-[250px] overflow-y-auto p-1 flex flex-col gap-1.5 overscroll-contain touch-pan-y"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {months.map((m, i) => (
                <button
                  key={m}
                  data-selected={i === tempDate.m}
                  onClick={() => { updateDate(tempDate.d, i, tempDate.y); setOpenMonth(false); }}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm rounded-xl transition-all font-bold",
                    i === tempDate.m 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "hover:bg-primary/10 text-foreground"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Year Selector */}
        <Popover open={openYear} onOpenChange={setOpenYear}>
          <PopoverTrigger asChild>
            <button className="flex-[1.2] flex items-center justify-between h-12 px-4 py-2 text-base font-black bg-white border-2 border-black/10 rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all shadow-sm active:scale-95">
              <span>{tempDate.y ? tempDate.y : "Ano"}</span>
              <ChevronDown className="h-4 w-4 opacity-50 text-primary" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[140px] p-2 rounded-2xl border-2 shadow-2xl z-[100]" align="start">
            <div 
              ref={openYear ? scrollRef : null}
              className="max-h-[250px] overflow-y-auto p-1 flex flex-col gap-1.2 overscroll-contain touch-pan-y"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {years.map((y) => (
                <button
                  key={y}
                  data-selected={y === tempDate.y}
                  onClick={() => { updateDate(tempDate.d, tempDate.m, y); setOpenYear(false); }}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm rounded-xl transition-all font-bold",
                    y === tempDate.y 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "hover:bg-primary/10 text-foreground"
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
