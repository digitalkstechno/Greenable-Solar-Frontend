import { useState, useRef, useEffect } from 'react';
import { Clock, X } from 'lucide-react';

interface TimePickerProps {
  value?: string; // "HH:mm"
  onChange?: (time: string) => void;
  placeholder?: string;
}

export default function TimePicker({ value = '', onChange, placeholder = '--:-- --' }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

  // Parse value "HH:mm" into 12-hour format
  const getParsedTime = () => {
    if (!value) return { hour: '12', minute: '00', period: 'AM' };
    const [hStr, mStr] = value.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    const hour = String(h).padStart(2, '0');
    return { hour, minute: m, period };
  };

  const { hour, minute, period } = getParsedTime();

  // Helper to format 12h components back to "HH:mm" 24h format
  const formatTime24h = (h12: string, m: string, p: string) => {
    let h = parseInt(h12, 10);
    if (p === 'PM' && h < 12) h += 12;
    if (p === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  };

  const handleSelect = (newHour: string, newMinute: string, newPeriod: string) => {
    const formatted = formatTime24h(newHour, newMinute, newPeriod);
    onChange?.(formatted);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll active elements into view when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        // Scroll hour
        const activeHour = hourRef.current?.querySelector('[data-active="true"]');
        if (activeHour) {
          activeHour.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        }
        // Scroll minute
        const activeMinute = minuteRef.current?.querySelector('[data-active="true"]');
        if (activeMinute) {
          activeMinute.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        }
        // Scroll period
        const activePeriod = periodRef.current?.querySelector('[data-active="true"]');
        if (activePeriod) {
          activePeriod.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        }
      }, 50);
    }
  }, [open]);

  const hoursList = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const periodsList = ['AM', 'PM'];

  // Display value formatting
  const displayValue = () => {
    if (!value) return placeholder;
    const { hour, minute, period } = getParsedTime();
    return `${hour}:${minute} ${period}`;
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
  };

  return (
    <div className="relative w-full" ref={ref}>
      {/* Input / Trigger */}
      <div
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm cursor-pointer hover:border-gray-300 bg-white"
      >
        <span className={value ? 'text-gray-800' : 'text-gray-400'}>
          {displayValue()}
        </span>
        <div className="flex items-center gap-1.5">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 focus:outline-none p-0.5 rounded-full hover:bg-gray-100 flex items-center justify-center"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <Clock className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Popover Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 bg-white rounded-xl border border-gray-200 p-2 shadow-lg flex gap-1 w-64 h-60">
          {/* Hours Column */}
          <div ref={hourRef} className="flex-1 overflow-y-auto scrollbar-none flex flex-col">
            {hoursList.map((h) => {
              const active = h === hour;
              return (
                <button
                  type="button"
                  key={h}
                  data-active={active}
                  onClick={() => handleSelect(h, minute, period)}
                  className={`text-center py-1.5 text-sm rounded-md transition-colors cursor-pointer block w-full shrink-0
                    ${active ? 'bg-[#F28522] text-white font-semibold' : 'text-gray-800 hover:bg-gray-100'}
                  `}
                >
                  {h}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="w-[1px] bg-gray-100 my-1 shrink-0"></div>

          {/* Minutes Column */}
          <div ref={minuteRef} className="flex-1 overflow-y-auto scrollbar-none flex flex-col">
            {minutesList.map((m) => {
              const active = m === minute;
              return (
                <button
                  type="button"
                  key={m}
                  data-active={active}
                  onClick={() => handleSelect(hour, m, period)}
                  className={`text-center py-1.5 text-sm rounded-md transition-colors cursor-pointer block w-full shrink-0
                    ${active ? 'bg-[#F28522] text-white font-semibold' : 'text-gray-800 hover:bg-gray-100'}
                  `}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="w-[1px] bg-gray-100 my-1 shrink-0"></div>

          {/* Period Column */}
          <div ref={periodRef} className="flex-1 overflow-y-auto scrollbar-none flex flex-col justify-start">
            {periodsList.map((p) => {
              const active = p === period;
              return (
                <button
                  type="button"
                  key={p}
                  data-active={active}
                  onClick={() => handleSelect(hour, minute, p)}
                  className={`text-center py-1.5 text-sm rounded-md transition-colors cursor-pointer block w-full shrink-0
                    ${active ? 'bg-[#F28522] text-white font-semibold' : 'text-gray-800 hover:bg-gray-100'}
                  `}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
