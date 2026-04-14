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
      ref.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [selected, isOpen]);

  return (
    <div className="w-full">
      {React.cloneElement(children as React.ReactElement, { ref })}
    </div>
  );
}

export function CustomDatePicker({ value, onChange, label }: CustomDatePickerProps) {
  const [date, setDate] = useState<Date>(value ? new Date(value + 'T12:00:00') : new Date());
  const [openDay, setOpenDay] = useState(false);
  const [openMonth, setOpenMonth] = useState(false);
  const [openYear, setOpenYear] = useState(false);
  
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  const years = Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - i);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const updateDate = (newDay: number, newMonth: number, newYear: number) => {
    // Ensure the day is valid for the new month/year
    const maxDays = new Date(newYear, newMonth + 1, 0).getDate();
    const validDay = Math.min(newDay, maxDays);
    
    const updated = new Date(newYear, newMonth, validDay);
    setDate(updated);
    const yyyy = updated.getFullYear();
    const mm = String(updated.getMonth() + 1).padStart(2, '0');
    const dd = String(updated.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <div className="space-y-1 w-full animate-in fade-in slide-in-from-top-1">
      {label && <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">{label}</label>}
      <div className="flex gap-2">
        {/* Day Selector */}
        <Popover open={openDay} onOpenChange={setOpenDay}>
          <PopoverTrigger asChild>
            <button className="flex-1 flex items-center justify-between h-12 px-4 py-2 text-base font-black bg-white border-2 border-black/10 rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all shadow-sm active:scale-95">
              <span>{day.toString().padStart(2, '0')}</span>
              <ChevronDown className="h-4 w-4 opacity-50 text-primary" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-2 rounded-2xl border-2 shadow-2xl" align="start">
            <div className="max-h-[280px] overflow-y-auto p-1 grid grid-cols-4 gap-2 scrollbar-none">
              {days.map((d) => (
                <ScrollToValue key={d} selected={d === day} isOpen={openDay}>
                  <button
                    onClick={() => { updateDate(d, month, year); setOpenDay(false); }}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center text-sm rounded-xl transition-all font-bold",
                      d === day 
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
              <span className="truncate text-left">{months[month]}</span>
              <ChevronDown className="h-4 w-4 opacity-50 text-primary" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-2 rounded-2xl border-2 shadow-2xl" align="start">
            <div className="max-h-[280px] overflow-y-auto p-1 flex flex-col gap-1.5 ">
              {months.map((m, i) => (
                <ScrollToValue key={m} selected={i === month} isOpen={openMonth}>
                  <button
                    onClick={() => { updateDate(day, i, year); setOpenMonth(false); }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-sm rounded-xl transition-all font-bold",
                      i === month 
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
              <span>{year}</span>
              <ChevronDown className="h-4 w-4 opacity-50 text-primary" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[140px] p-2 rounded-2xl border-2 shadow-2xl" align="start">
            <div className="max-h-[280px] overflow-y-auto p-1 flex flex-col gap-1.5">
              {years.map((y) => (
                <ScrollToValue key={y} selected={y === year} isOpen={openYear}>
                  <button
                    onClick={() => { updateDate(day, month, y); setOpenYear(false); }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-sm rounded-xl transition-all font-bold",
                      y === year 
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
