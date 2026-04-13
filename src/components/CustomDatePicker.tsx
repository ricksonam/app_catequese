import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";

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
  const [date, setDate] = useState<Date>(value ? new Date(value + 'T12:00:00') : new Date());
  
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const updateDate = (newDay: number, newMonth: number, newYear: number) => {
    const updated = new Date(newYear, newMonth, newDay);
    setDate(updated);
    const yyyy = updated.getFullYear();
    const mm = String(updated.getMonth() + 1).padStart(2, '0');
    const dd = String(updated.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>}
      <div className="flex gap-1">
        {/* Day Selector */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex-1 flex items-center justify-between h-10 px-3 py-2 text-sm bg-background border border-input rounded-md hover:bg-accent transition-colors">
              <span>{day.toString().padStart(2, '0')}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[180px] p-0" align="start">
            <div className="max-h-[200px] overflow-y-auto p-1 grid grid-cols-4 gap-1">
              {days.map((d) => (
                <button
                  key={d}
                  onClick={() => updateDate(d, month, year)}
                  className={cn(
                    "h-8 flex items-center justify-center text-xs rounded-md transition-colors",
                    d === day ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Month Selector */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex-[1.5] flex items-center justify-between h-10 px-3 py-2 text-sm bg-background border border-input rounded-md hover:bg-accent transition-colors">
              <span className="truncate text-left">{months[month]}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[180px] p-0" align="start">
            <div className="max-h-[200px] overflow-y-auto p-1 flex flex-col gap-1">
              {months.map((m, i) => (
                <button
                  key={m}
                  onClick={() => updateDate(day, i, year)}
                  className={cn(
                    "px-3 py-2 text-left text-xs rounded-md transition-colors",
                    i === month ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Year Selector */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex-1 flex items-center justify-between h-10 px-3 py-2 text-sm bg-background border border-input rounded-md hover:bg-accent transition-colors">
              <span>{year}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[120px] p-0" align="start">
            <div className="max-h-[200px] overflow-y-auto p-1 flex flex-col gap-1">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => updateDate(day, month, y)}
                  className={cn(
                    "px-3 py-2 text-left text-xs rounded-md transition-colors",
                    y === year ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted"
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
