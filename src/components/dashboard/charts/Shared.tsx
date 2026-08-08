import React, { useState, useEffect, useRef } from "react";

interface YearSelectProps {
  value: number;
  onChange: (value: number) => void;
  options: number[];
}

function YearSelect({ value, onChange, options }: YearSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between w-24 px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white text-gray-800 shadow-sm hover:border-orange-300 focus:outline-none transition-all cursor-pointer"
      >
        <span>{value}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 text-gray-400 ${isOpen ? "rotate-180 text-[#d87612]" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-24 rounded-xl shadow-lg bg-white border border-gray-100 focus:outline-none z-50 overflow-hidden py-1">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 text-xs font-semibold transition-all ${option === value
                ? "bg-[#d87612] text-white"
                : "text-gray-700 hover:bg-orange-50 hover:text-[#d87612]"
                }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const TruncatedNameTick = (props: any) => {
  const { x, y, payload } = props;
  const fullName = String(payload?.value ?? '');
  const firstName = fullName.split(' ')[0] || fullName;
  const displayText = fullName.length > firstName.length ? `${firstName}...` : firstName;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill="#4b5563"
        fontSize={12}
        fontWeight="600"
        style={{ cursor: 'default' }}
      >
        {displayText}
        <title>{fullName}</title>
      </text>
    </g>
  );
};


export { YearSelect, TruncatedNameTick };
