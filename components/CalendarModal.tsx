'use client'

import { useState } from 'react';
import * as React from 'react';
import { styles } from '../styles/forms';

interface CalendarModalProps {
  availableDates: string[];
  onClose: () => void;
  onDateSelect?: (date: string) => void; // Optional: for making dates clickable
  selectable?: boolean; // Optional: flag to enable selection
}

export const CalendarModal = ({ availableDates, onClose, onDateSelect, selectable = false }: CalendarModalProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const availabilitySet = new Set(availableDates);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(<div key={`empty-${i}`} style={{ visibility: 'hidden' }}></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), day))
            .toISOString().split('T')[0];
        
        const isAvailable = availabilitySet.has(dateStr);

        let dayStyle: React.CSSProperties = {
            width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%', color: '#f9fafb',
            backgroundColor: '#4b5563', // Default to grey
            cursor: 'default'
        };

        if (isAvailable) {
            dayStyle.backgroundColor = '#16a34a'; // Green for available
            if (selectable) {
                dayStyle.cursor = 'pointer';
            }
        }

        calendarDays.push(
            <div 
                key={day} 
                style={dayStyle}
                onClick={() => selectable && isAvailable && onDateSelect && onDateSelect(dateStr)}
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
