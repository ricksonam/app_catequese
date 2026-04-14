import React, { useState } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  // Parse date or use null
  const initialDate = value ? new Date(value + 'T12:00:00') : null;
  
  const dSelected = initialDate ? initialDate.getDate() : null;
  const mSelected = initialDate ? initialDate.getMonth() : null;
  const ySelected = initialDate ? initialDate.getFullYear() : null;

  const years = Array.from({ length: 110 }, (_, i) => new Date().getFullYear() - i);
  // Default to 31 if year/month not selected for day list
  const currentYear = ySelected || new Date().getFullYear();
  const currentMonth = mSelected !== null ? mSelected : new Date().getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleUpdate = (type: 'd' | 'm' | 'y', newVal: string) => {
    const d = type === 'd' ? parseInt(newVal) : dSelected;
    const m = type === 'm' ? parseInt(newVal) : mSelected;
    const y = type === 'y' ? parseInt(newVal) : ySelected;

    if (d !== null && m !== null && y !== null) {
      // Ensure day is valid for the month/year
      const maxDays = new Date(y, m + 1, 0).getDate();
      const validDay = Math.min(d, maxDays);
      
      const mm = String(m + 1).padStart(2, '0');
      const dd = String(validDay).padStart(2, '0');
      onChange(`${y}-${mm}-${dd}`);
    } else {
      // Intermediate state, just trigger some update to local vars if needed,
      // but the parent 'value' only changes when all 3 are set.
      // However, we need to handle the case where the user changes one part only.
      // Constructing a partial ISO just to pass the data back.
      // Best way: parent holds the state. For now, we only call onChange if all set.
      // If we want to allow partial selection to persist:
      const mm = m !== null ? String(m + 1).padStart(2, '0') : "01";
      const dd = d !== null ? String(d).padStart(2, '0') : "01";
      const yyyy = y !== null ? String(y) : "2000";
      onChange(`${yyyy}-${mm}-${dd}`);
    }
  };

  return (
    <div className="space-y-1 w-full animate-in fade-in slide-in-from-top-1">
      {label && <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">{label}</label>}
      <div className="flex gap-2">
        {/* Day */}
        <div className="flex-1">
          <Select 
            value={dSelected?.toString() || ""} 
            onValueChange={(v) => handleUpdate('d', v)}
          >
            <SelectTrigger className="h-12 bg-white border-2 border-black/10 rounded-xl font-black focus:ring-primary/20">
              <SelectValue placeholder="Dia" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {days.map(d => (
                <SelectItem key={d} value={d.toString()}>{d.toString().padStart(2, '0')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Month */}
        <div className="flex-[2]">
          <Select 
            value={mSelected !== null ? mSelected.toString() : ""} 
            onValueChange={(v) => handleUpdate('m', v)}
          >
            <SelectTrigger className="h-12 bg-white border-2 border-black/10 rounded-xl font-black focus:ring-primary/20">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {months.map((m, i) => (
                <SelectItem key={m} value={i.toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year */}
        <div className="flex-[1.2]">
          <Select 
            value={ySelected?.toString() || ""} 
            onValueChange={(v) => handleUpdate('y', v)}
          >
            <SelectTrigger className="h-12 bg-white border-2 border-black/10 rounded-xl font-black focus:ring-primary/20">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
