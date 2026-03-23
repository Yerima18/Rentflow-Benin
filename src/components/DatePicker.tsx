"use client";

import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";
import { forwardRef } from "react";

interface Props {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  showMonthYearPicker?: boolean;
  dateFormat?: string;
  className?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

// Custom styled input for the calendar trigger
const CustomInput = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void; placeholder?: string }>(
  ({ value, onClick, placeholder }, ref) => (
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 hover:border-indigo-400 hover:bg-white cursor-pointer text-left"
    >
      <span className={value ? "text-slate-900 font-medium" : "text-slate-400"}>
        {value || placeholder || "Pick a date"}
      </span>
      <Calendar size={18} className="text-indigo-400 flex-shrink-0 ml-2" />
    </button>
  )
);
CustomInput.displayName = "CustomInput";

export default function DatePicker({
  selected,
  onChange,
  placeholderText,
  showMonthYearPicker = false,
  dateFormat,
  required,
  minDate,
  maxDate,
}: Props) {
  return (
    <div className="date-picker-wrapper">
      <style>{`
        .date-picker-wrapper .react-datepicker-wrapper { width: 100%; }
        .react-datepicker { font-family: inherit; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
        .react-datepicker__header { background: #6366f1; border-bottom: none; padding: 12px 0; }
        .react-datepicker__current-month, .react-datepicker__day-name { color: white; font-weight: 700; }
        .react-datepicker__navigation-icon::before { border-color: white; }
        .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected { background-color: #6366f1; border-radius: 8px; color: white; font-weight: 700; }
        .react-datepicker__day:hover { background-color: #eef2ff; border-radius: 8px; }
        .react-datepicker__day { border-radius: 8px; }
        .react-datepicker__month-text--keyboard-selected, .react-datepicker__month-text--selected { background-color: #6366f1 !important; border-radius: 8px; color: white !important; }
        .react-datepicker__month-text:hover { background-color: #eef2ff !important; border-radius: 8px; }
        .react-datepicker__triangle { display: none; }
        .react-datepicker-popper { z-index: 9999; }
      `}</style>
      <ReactDatePicker
        selected={selected}
        onChange={onChange}
        dateFormat={dateFormat || (showMonthYearPicker ? "MMMM yyyy" : "dd/MM/yyyy")}
        showMonthYearPicker={showMonthYearPicker}
        placeholderText={placeholderText}
        required={required}
        minDate={minDate}
        maxDate={maxDate}
        customInput={<CustomInput placeholder={placeholderText} />}
        popperPlacement="bottom-start"
      />
    </div>
  );
}
