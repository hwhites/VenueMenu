'use client'

import { useState } from 'react';
import * as React from 'react';
import { styles } from '../styles/forms';

interface CalendarModalProps {
  availableDates: string[];
  onClose: () => void;
  onDateSelect?: (date: string) => void;
  selectable?: boolean;
}

export const CalendarModal = ({ availableDates, onClose, onDateSelect, selectable = false }: CalendarModalProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const availabilitySet = new Set(availableDates);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(<div key={`empty-${i}`} style={{ visibility: 'hidden' }}></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), day));
        const dateStr = dateObj.toISOString().split('T')[0];
        const isPast = dateObj < today;
        
        const isAvailable = availabilitySet.has(dateStr);

        // --- UPDATED CLICK LOGIC ---
        // A date is clickable if the calendar is selectable, the date isn't in the past, AND either:
        // 1. The date is explicitly marked as available.
        // 2. No available dates were provided at all (for venues picking any date).
        const isClickable = selectable && !isPast && (isAvailable || availableDates.length === 0);

        let dayStyle: React.CSSProperties = {
            width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%', color: '#f9fafb',
            backgroundColor: isAvailable ? '#16a34a' : '#4b5563',
            cursor: isClickable ? 'pointer' : 'default',
            opacity: isPast ? 0.5 : 1,
            transition: 'transform 0.1s ease-in-out',
        };

        if(isPast) {
            dayStyle.backgroundColor = '#374151'; // Darker grey for past dates
        }

        calendarDays.push(
            <div 
                key={day} 
                style={dayStyle}
                onClick={() => isClickable && onDateSelect && onDateSelect(dateStr)}
                onMouseEnter={(e) => { if(isClickable) e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={(e) => { if(isClickable) e.currentTarget.style.transform = 'scale(1)'; }}
            >
                {day}
            </div>
        );
    }

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ ...styles.formWrapper as React.CSSProperties, maxWidth: '400px', backgroundColor: '#1f2937' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', color: '#f9fafb', fontSize: '1.5rem', cursor: 'pointer' }}>‹</button>
                    <h2 style={{ ...styles.header as React.CSSProperties, margin: 0, fontSize: '1.2rem' }}>{monthName} {year}</h2>
                    <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', color: '#f9fafb', fontSize: '1.5rem', cursor: 'pointer' }}>›</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} style={{ fontWeight: 'bold', color: '#9ca3af' }}>{d}</div>)}
                    {calendarDays}
                </div>
                <button onClick={onClose} style={{ ...styles.button as React.CSSProperties, width: '100%', marginTop: '1.5rem' }}>Close</button>
            </div>
        </div>
    );
};

