'use client'

import { useState } from 'react';
import * as React from 'react';

// --- Type Definitions ---
export type DateStatus = 'open' | 'booked' | 'unavailable' | 'staged_add' | 'staged_remove';

interface CalendarProps {
  initialDate?: Date;
  dates: Map<string, DateStatus>;
  onDateClick?: (date: string) => void;
  isEditable?: boolean;
}

// --- Helper Functions ---
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
const toYyyyMmDd = (date: Date): string => date.toISOString().split('T')[0];

// --- Styles ---
const colorMap: Record<DateStatus, string> = {
    open: '#f59e0b', // Yellow
    booked: '#16a34a', // Green
    unavailable: '#4b5563', // Grey
    staged_add: '#facc15', // Lighter Yellow
    staged_remove: '#6b7280', // Lighter Grey
};

// --- Main Component ---
export const AvailabilityCalendar = ({
  initialDate = new Date(),
  dates,
  onDateClick,
  isEditable = false,
}: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();
  const daysInMonth = getDaysInMonth(year, currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(year, currentDate.getMonth());

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(Date.UTC(year, currentDate.getMonth(), day));
    const dateStr = toYyyyMmDd(dateObj);
    const status = dates.get(dateStr) || 'unavailable';
    const isPast = dateObj < today;

    const isClickable = isEditable && !isPast && status !== 'booked';
    
    const dayStyle: React.CSSProperties = {
        width: '100%',
        aspectRatio: '1 / 1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        color: '#f9fafb',
        backgroundColor: isPast ? '#374151' : colorMap[status],
        cursor: isClickable ? 'pointer' : 'default',
        opacity: isPast ? 0.6 : 1,
        transition: 'transform 0.1s ease-in-out',
    };

    calendarDays.push(
      <div
        key={day}
        style={dayStyle}
        onClick={() => isClickable && onDateClick?.(dateStr)}
        onMouseEnter={(e) => { if(isClickable) e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={(e) => { if(isClickable) e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {day}
      </div>
    );
  }

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, currentDate.getMonth() + offset, 1));
  };

  return (
    <div style={{ backgroundColor: '#1f2937', padding: '1rem', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', color: '#f9fafb', fontSize: '1.5rem', cursor: 'pointer' }}>‹</button>
        <h3 style={{ margin: 0, color: '#f9fafb' }}>{monthName} {year}</h3>
        <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', color: '#f9fafb', fontSize: '1.5rem', cursor: 'pointer' }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} style={{ fontWeight: 'bold', color: '#9ca3af' }}>{d}</div>)}
        {calendarDays}
      </div>
    </div>
  );
};
