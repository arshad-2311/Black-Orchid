"use client";

import { useEffect, useRef, useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PremiumCalendarProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  error?: string;
  className?: string;
}

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
];

/**
 * Safely parses YYYY-MM-DD string into a local Date without UTC offset shift
 */
function parseLocalDate(dateStr: string): Date | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Formats a Date object into YYYY-MM-DD string
 */
function formatYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Formats YYYY-MM-DD for luxury display (e.g. "Thursday, August 15, 2026")
 */
function formatDisplayDate(dateStr: string): string {
  const parsed = parseLocalDate(dateStr);
  if (!parsed) return "Select a date";
  return parsed.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function PremiumCalendar({
  value,
  onChange,
  minDate,
  maxDate,
  error,
  className,
}: PremiumCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const calendarId = useId();

  // Determine current view date (month/year)
  const initialDate = parseLocalDate(value) || parseLocalDate(minDate || "") || new Date();
  const [viewDate, setViewDate] = useState<Date>(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );
  const [direction, setDirection] = useState<number>(0);

  const todayStr = formatYYYYMMDD(new Date());

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const prevMonth = () => {
    setDirection(-1);
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setDirection(1);
    setViewDate(new Date(year, month + 1, 1));
  };

  // Check if previous month navigation is allowed (cannot go before minDate's month)
  const minDateParsed = minDate ? parseLocalDate(minDate) : null;
  const isPrevDisabled = minDateParsed
    ? year < minDateParsed.getFullYear() || (year === minDateParsed.getFullYear() && month <= minDateParsed.getMonth())
    : false;

  // Compute days for grid
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const daysGrid: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // Previous month tail days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, d);
    daysGrid.push({
      dateStr: formatYYYYMMDD(prevDate),
      dayNum: d,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const currDate = new Date(year, month, d);
    daysGrid.push({
      dateStr: formatYYYYMMDD(currDate),
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  // Next month lead days to fill 35 or 42 grid cells
  const remaining = (7 - (daysGrid.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(year, month + 1, d);
    daysGrid.push({
      dateStr: formatYYYYMMDD(nextDate),
      dayNum: d,
      isCurrentMonth: false,
    });
  }

  const handleSelectDate = (dateStr: string, isCurrentMonth: boolean) => {
    if (minDate && dateStr < minDate) return;
    if (maxDate && dateStr > maxDate) return;

    onChange(dateStr);
    if (!isCurrentMonth) {
      const parsed = parseLocalDate(dateStr);
      if (parsed) {
        setViewDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
      }
    }
    setIsOpen(false);
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* TRIGGER BUTTON */}
      <button
        ref={triggerRef}
        type="button"
        id="r-date-trigger"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={calendarId}
        aria-label="Select reservation date"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-12 w-full rounded-xl border bg-white/[0.03] px-4 text-left font-sans text-base text-foreground transition-all duration-200 focus:outline-none focus:ring-2 sm:h-14 flex items-center justify-between group",
          isOpen ? "border-gold/60 ring-2 ring-gold/15" : "border-white/10 hover:border-gold/30",
          error ? "border-red-500/50 ring-red-500/20" : "",
          !value ? "text-muted-foreground/60" : "text-foreground"
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <CalendarIcon className="h-5 w-5 shrink-0 text-gold/80 transition-colors group-hover:text-gold" />
          <span className="truncate font-sans font-medium text-sm sm:text-base">
            {value ? formatDisplayDate(value) : "Select date..."}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {value && (
            <span className="hidden sm:inline-block rounded-md bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold tracking-wide uppercase">
              Selected
            </span>
          )}
          <ChevronRight className={cn("h-4 w-4 text-muted-foreground/70 transition-transform duration-200", isOpen && "rotate-90 text-gold")} />
        </div>
      </button>

      {/* DROPDOWN CALENDAR POPOVER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={calendarRef}
            id={calendarId}
            role="dialog"
            aria-label="Reservation Date Picker"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-full z-50 mt-2 w-full max-w-[380px] rounded-2xl border border-white/15 bg-[#0C0C0C]/95 p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl"
          >
            {/* MONTH HEADER */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <button
                type="button"
                onClick={prevMonth}
                disabled={isPrevDisabled}
                aria-label="Previous month"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-foreground transition-all duration-150 active:scale-95",
                  isPrevDisabled
                    ? "opacity-30 cursor-not-allowed border-transparent"
                    : "hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="text-center">
                <span className="font-mono text-xs tracking-[0.25em] text-gold uppercase font-semibold block">
                  {MONTH_NAMES[month]}
                </span>
                <span className="font-[family-name:var(--font-playfair)] text-lg font-bold text-foreground tracking-wide">
                  {year}
                </span>
              </div>

              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-foreground transition-all duration-150 hover:border-gold/40 hover:bg-gold/10 hover:text-gold active:scale-95"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* WEEKDAYS HEADER */}
            <div className="grid grid-cols-7 gap-1 pt-4 pb-2 text-center" role="row">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  role="columnheader"
                  className="font-mono text-[10px] font-semibold text-muted-foreground/60 tracking-widest"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* DAYS GRID */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${year}-${month}`}
                initial={{ opacity: 0, x: direction * 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 16 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
                className="grid grid-cols-7 gap-1 sm:gap-1.5"
                role="grid"
              >
                {daysGrid.map(({ dateStr, dayNum, isCurrentMonth }) => {
                  const isDisabled = Boolean(
                    (minDate && dateStr < minDate) || (maxDate && dateStr > maxDate)
                  );
                  const isSelected = dateStr === value;
                  const isToday = dateStr === todayStr;

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      role="gridcell"
                      aria-selected={isSelected}
                      disabled={isDisabled}
                      onClick={() => handleSelectDate(dateStr, isCurrentMonth)}
                      className={cn(
                        "relative flex h-10 w-full items-center justify-center rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-gold/50",
                        !isCurrentMonth && "text-white/20",
                        isCurrentMonth && !isDisabled && !isSelected && "text-foreground hover:bg-white/10 hover:border hover:border-gold/30 hover:scale-[1.03]",
                        isDisabled && "opacity-25 cursor-not-allowed text-white/30 hover:bg-transparent",
                        isSelected && "bg-gold text-black font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:bg-gold/90 scale-[1.05]"
                      )}
                    >
                      <span>{dayNum}</span>

                      {/* Today dot indicator */}
                      {isToday && !isSelected && (
                        <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold shadow-[0_0_6px_rgba(212,175,55,0.8)]" />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* FOOTER */}
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => {
                  if (!minDate || todayStr >= minDate) {
                    handleSelectDate(todayStr, true);
                  }
                }}
                className="text-[11px] font-mono tracking-widest text-gold uppercase hover:underline focus:outline-none"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-mono tracking-widest text-muted-foreground uppercase hover:text-foreground focus:outline-none"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
