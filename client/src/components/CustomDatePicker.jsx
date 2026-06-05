import { useState, useEffect, useRef } from 'react';

export default function CustomDatePicker({ value, onChange, min, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse YYYY-MM-DD to a local Date object
  const getLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date();
  };

  const selectedDate = value ? getLocalDate(value) : null;
  const [displayMonth, setDisplayMonth] = useState(selectedDate || new Date());

  // Keep display month synced if value is updated externally
  useEffect(() => {
    if (value) {
      setDisplayMonth(getLocalDate(value));
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = (e) => {
    e.stopPropagation();
    setDisplayMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    setDisplayMonth(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (dateStr) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  // Generate 42 cells representing the calendar grid
  const generateGrid = () => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
    const cells = [];
    
    // Start index is (1 - firstDayIndex) to backfill the grid with previous month days
    for (let i = 0; i < 42; i++) {
      const dt = new Date(year, month, 1 - firstDayIndex + i);
      const cellDateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      cells.push({
        day: dt.getDate(),
        isCurrentMonth: dt.getMonth() === month,
        dateStr: cellDateStr
      });
    }
    return cells;
  };

  const cells = generateGrid();
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Human readable display string in input
  const getFormattedDisplayValue = () => {
    if (!value) return '';
    const dateObj = getLocalDate(value);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  return (
    <div className="relative w-full max-w-xs" ref={containerRef}>
      {/* Input Field Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`input flex items-center justify-between cursor-pointer select-none bg-surface-900 border border-slate-700/60 hover:border-brand-500/50 rounded-xl px-4 py-3 text-slate-100 transition-all duration-200 ${isOpen ? 'ring-2 ring-brand-500 border-transparent shadow-lg shadow-brand-500/5' : ''} ${className}`}
      >
        <span className={value ? 'text-slate-100 font-medium' : 'text-slate-500'}>
          {getFormattedDisplayValue() || 'Select Date'}
        </span>
        <svg
          className="w-5 h-5 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>

      {/* Dropdown Calendar */}
      {isOpen && (
        <div className="absolute left-0 mt-2 bg-surface-950 border border-slate-800/80 rounded-2xl shadow-2xl z-50 p-4 w-[310px] animate-slide-up origin-top-left">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h4 className="font-display font-bold text-sm text-slate-200 capitalize tracking-wide select-none">
              {monthNames[month]} {year}
            </h4>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Weekdays Row */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-center select-none">
            {weekdays.map(d => (
              <span key={d} className="text-slate-500 font-bold text-[11px] uppercase tracking-wider py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, idx) => {
              const isCellSelected = value === cell.dateStr;
              const isDisabled = min && cell.dateStr < min;
              const isCellToday = cell.dateStr === todayStr;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(cell.dateStr)}
                  className={`
                    w-9 h-9 flex items-center justify-center text-sm rounded-lg transition-all relative font-medium
                    ${isDisabled 
                      ? 'text-slate-700 cursor-not-allowed opacity-30 bg-transparent' 
                      : cell.isCurrentMonth 
                        ? 'text-slate-200' 
                        : 'text-slate-500'}
                    ${!isDisabled && !isCellSelected ? 'hover:bg-slate-800/80 hover:text-white cursor-pointer' : ''}
                    ${isCellSelected 
                      ? 'bg-brand-600 text-white font-semibold shadow-lg shadow-brand-600/35 scale-105' 
                      : ''}
                    ${isCellToday && !isCellSelected ? 'border border-brand-500/50 text-brand-400' : ''}
                  `}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between border-t border-slate-800/60 mt-3.5 pt-3 select-none">
            <button
              type="button"
              onClick={() => handleSelectDay(todayStr)}
              className="text-xs text-brand-400 hover:text-brand-300 font-bold transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-400 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
