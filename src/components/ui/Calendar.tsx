import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface CalendarProps {
    value?: Date | null;
    onChange?: (date: Date | null) => void;
    minDate?: Date;
    placeholder?: string;
}

export default function Calendar({ value, onChange, minDate, placeholder = 'Select date' }: CalendarProps) {
    const today = new Date();
    const [open, setOpen] = useState(false);
    const [cur, setCur] = useState({ y: value?.getFullYear() || today.getFullYear(), m: value?.getMonth() || today.getMonth() });
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const firstDay = new Date(cur.y, cur.m, 1).getDay();
    const daysInMonth = new Date(cur.y, cur.m + 1, 0).getDate();
    const prevDays = new Date(cur.y, cur.m, 0).getDate();

    const prev = () => setCur(c => c.m === 0 ? { y: c.y - 1, m: 11 } : { ...c, m: c.m - 1 });
    const next = () => setCur(c => c.m === 11 ? { y: c.y + 1, m: 0 } : { ...c, m: c.m + 1 });

    const isToday = (d: number) => d === today.getDate() && cur.m === today.getMonth() && cur.y === today.getFullYear();
    const isSelected = (d: number) => value && d === value.getDate() && cur.m === value.getMonth() && cur.y === value.getFullYear();
    const isDisabled = (d: number) => minDate ? new Date(cur.y, cur.m, d) < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : false;

    const selectDay = (d: number) => {
        if (isDisabled(d)) return;
        const date = new Date(cur.y, cur.m, d, 12, 0, 0);
        onChange?.(date);
        setOpen(false);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="relative w-full" ref={ref}>
            {/* Input */}
            <div
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm cursor-pointer hover:border-gray-300 bg-white"
            >
                <span className={value ? 'text-gray-800' : 'text-gray-400'}>
                    {value ? formatDate(value) : placeholder}
                </span>
                <CalendarIcon className="h-4 w-4 text-gray-400" />
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 bg-white rounded-xl border border-gray-200 p-4 w-72 shadow-lg">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <button onClick={prev} className="p-1 rounded-md hover:bg-gray-100 text-gray-500">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-sm font-medium text-gray-900">{MONTHS[cur.m]} {cur.y}</span>
                        <button onClick={next} className="p-1 rounded-md hover:bg-gray-100 text-gray-500">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-7 gap-0.5">
                        {DAYS.map(d => (
                            <div key={d} className="text-center text-xs text-gray-400 font-medium py-1.5">{d}</div>
                        ))}
                        {Array.from({ length: firstDay }, (_, i) => (
                            <div key={`p${i}`} className="text-center text-xs text-gray-300 py-1.5">{prevDays - firstDay + 1 + i}</div>
                        ))}
                        {Array.from({ length: daysInMonth }, (_, i) => {
                            const d = i + 1;
                            const dis = isDisabled(d);
                            return (
                                <button
                                    key={d}
                                    onClick={() => selectDay(d)}
                                    disabled={dis}
                                    className={`text-center text-sm py-1.5 rounded-md transition-colors
                    ${isToday(d) || isSelected(d) ? 'bg-[#F28522] text-white font-semibold' : ''}
                    ${!isToday(d) && !isSelected(d) && !dis ? 'text-gray-800 hover:bg-[#F28522] hover:text-white' : ''}
                    ${dis ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                                >
                                    {d}
                                </button>
                            );
                        })}
                        {Array.from({ length: (firstDay + daysInMonth) % 7 === 0 ? 0 : 7 - (firstDay + daysInMonth) % 7 }, (_, i) => (
                            <div key={`n${i}`} className="text-center text-xs text-gray-300 py-1.5">{i + 1}</div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between mt-3">
                        <button onClick={() => { onChange?.(null); setOpen(false); }} className="text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50">
                            Clear
                        </button>
                        <button
                            onClick={() => { setCur({ y: today.getFullYear(), m: today.getMonth() }); onChange?.(today); setOpen(false); }}
                            className="text-xs px-3 py-1.5 rounded-md bg-[#F28522] text-white font-medium hover:bg-[#d9731e]"
                        >
                            Today
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}