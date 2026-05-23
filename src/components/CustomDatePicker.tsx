import React, { useState, useEffect } from "react";

interface CustomDatePickerProps {
  value: string; // ISO date string YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
}

export function CustomDatePicker({ value, onChange, label }: CustomDatePickerProps) {
  // Convert YYYY-MM-DD to DD/MM/AAAA for local display
  const toLocalFormat = (isoString: string) => {
    if (!isoString) return "";
    if (isoString.includes("/")) return isoString;
    const parts = isoString.split("T")[0].split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoString;
  };

  // Convert DD/MM/AAAA to YYYY-MM-DD for parent
  const toIsoFormat = (localString: string) => {
    if (localString.length === 10) {
      const parts = localString.split("/");
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    return "";
  };

  const [inputValue, setInputValue] = useState(toLocalFormat(value));

  useEffect(() => {
    const formatted = toLocalFormat(value);
    if (formatted !== inputValue && toIsoFormat(inputValue) !== value) {
      setInputValue(formatted);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 2) val = val.substring(0, 2) + "/" + val.substring(2);
    if (val.length > 5) val = val.substring(0, 5) + "/" + val.substring(5, 9);
    
    setInputValue(val);
    
    if (val.length === 10) {
      onChange(toIsoFormat(val));
    } else if (val === "") {
      onChange("");
    }
  };

  return (
    <div className="w-full">
      {label && <label className="text-xs font-semibold text-zinc-900 mb-1 block">{label.includes("*") ? <>{label.replace("*", "")}<span className="text-red-500">*</span></> : label}</label>}
      <input 
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="DD/MM/AAAA"
        maxLength={10}
        className="form-input"
      />
    </div>
  );
}
