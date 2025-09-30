'use client'

import { useState, useEffect, useCallback, FormEvent, ChangeEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { styles } from '../../styles/forms';
import { User } from '@supabase/supabase-js';
import * as React from 'react';
import { AvailabilityCalendar, DateStatus } from '../../components/AvailabilityCalendar';

// --- Type Definitions ---
interface OpenDate {
  id: number;
  date: string;
  status: 'open' | 'booked';
}

export default function AvailabilityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [allDates, setAllDates] = useState<Map<string, DateStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  // State for the editing modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stagedDates, setStagedDates] = useState<Map<string, DateStatus>>(new Map());
  const [recurrence, setRecurrence] = useState({ type: 'weekly', count: '4' });
  const [isSaving, setIsSaving] = useState(false);

  // --- Data Fetching ---
  const fetchDates = useCallback(async (currentUser: User) => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('open_dates')
      .select('id, date, status')
      .eq('artist_user_id', currentUser.id)
      .in('status', ['open', 'booked']);

    if (fetchError) {
      setError(fetchError.message);
    } else {
      const dateMap = new Map<string, DateStatus>();
      data.forEach(d => {
        // Normalize date to prevent timezone issues
        const date = new Date(d.date).toISOString().split('T')[0];
        dateMap.set(date, d.status);
      });
      setAllDates(dateMap);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const initPage = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const currentUser = session.user;
      setUser(currentUser);
      await fetchDates(currentUser);
    };
    initPage();
  }, [router, fetchDates]);

  // --- Modal and Editing Logic ---
  const handleOpenModal = () => {
    setStagedDates(new Map(allDates)); // Copy current dates into staging
    setIsModalOpen(true);
  };

  const handleModalDateClick = (date: string) => {
    const currentStatus = stagedDates.get(date) || 'unavailable';
    const newStagedDates = new Map(stagedDates);

    if (currentStatus === 'unavailable') {
      newStagedDates.set(date, 'open');
    } else if (currentStatus === 'open') {
      newStagedDates.set(date, 'unavailable');
    }
    // Booked dates are not clickable
    setStagedDates(newStagedDates);
  };
  
  const handleQuickRemove = async (date: string) => {
      if (!user || !confirm(`Are you sure you want to remove your availability for ${date}?`)) return;
      
      const { error: deleteError } = await supabase
        .from('open_dates')
        .delete()
        .eq('artist_user_id', user.id)
        .eq('date', date)
        .eq('status', 'open');
        
      if (deleteError) setError(deleteError.message);
      else await fetchDates(user);
  };

  const handleApplyRecurrence = () => {
    const newDates = new Map(stagedDates);
    const today = new Date();
    const count = parseInt(recurrence.count, 10);
    if (isNaN(count)) return;

    for (let i = 0; i < count; i++) {
        let nextDate: Date;
        if (recurrence.type === 'weekly') {
            nextDate = new Date(today.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
        } else if (recurrence.type === 'biweekly') {
            nextDate = new Date(today.getTime() + (i * 14 * 24 * 60 * 60 * 1000));
        } else { // monthly
            nextDate = new Date(today.getFullYear(), today.getMonth() + i, today.getDate());
        }
        
        const dateStr = nextDate.toISOString().split('T')[0];
        if (!newDates.has(dateStr)) {
            newDates.set(dateStr, 'open');
        }
    }
    setStagedDates(newDates);
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
    
    const toAdd: { artist_user_id: string; date: string; status: 'open' }[] = [];
    const toRemove: string[] = [];

    stagedDates.forEach((status, date) => {
      if (status === 'open' && !allDates.has(date)) {
        toAdd.push({ artist_user_id: user.id, date, status: 'open' });
      }
    });

    allDates.forEach((status, date) => {
      if (status === 'open' && !stagedDates.has(date)) {
        toRemove.push(date);
      }
    });
    
    if (toAdd.length > 0) {
        await supabase.from('open_dates').insert(toAdd);
    }
    if (toRemove.length > 0) {
        await supabase.from('open_dates').delete().eq('artist_user_id', user.id).in('date', toRemove);
    }

    await fetchDates(user);
    setIsSaving(false);
    setIsModalOpen(false);
  };

  if (loading) return <div><p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading Availability...</p></div>;
  if (error) return <div><p style={{ textAlign: 'center', color: '#f87171', marginTop: '2rem' }}>Error: {error}</p></div>;

  return (
    <>
      <div style={{...styles.container as React.CSSProperties, minHeight: 'calc(100vh - 120px)', backgroundColor: 'transparent', padding: '1rem', alignItems: 'flex-start' }}>
        <div style={{...styles.formWrapper as React.CSSProperties, maxWidth: '800px'}}>
          <h1 style={styles.header as React.CSSProperties}>My Availability</h1>
          <p style={styles.subHeader as React.CSSProperties}>
            Green dates are booked, yellow dates are open. Click an open date to remove it.
          </p>

          <button onClick={handleOpenModal} style={{...styles.button as React.CSSProperties, width: '100%', marginBottom: '2rem' }}>
            Add / Edit Availability
          </button>

          <AvailabilityCalendar dates={allDates} onDateClick={handleQuickRemove} />
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{...styles.formWrapper as React.CSSProperties, maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'}}>
            <h1 style={styles.header as React.CSSProperties}>Edit Dates</h1>
            <p style={styles.subHeader as React.CSSProperties}>Click grey dates to mark them as open (yellow), or click yellow dates to remove them. Booked dates (green) cannot be changed.</p>
            
            <AvailabilityCalendar dates={stagedDates} onDateClick={handleModalDateClick} isEditable={true} />

            <div style={{ marginTop: '2rem', borderTop: '1px solid #4b5563', paddingTop: '1rem' }}>
                <h2 style={{...styles.header as React.CSSProperties, fontSize: '1.2rem'}}>Add Recurring Dates</h2>
                <div style={{display: 'flex', gap: '1rem', alignItems: 'flex-end'}}>
                    <div style={{...styles.inputGroup as React.CSSProperties, flex: 2}}>
                        <label style={styles.label as any}>Rule</label>
                        <select value={recurrence.type} onChange={(e: ChangeEvent<HTMLSelectElement>) => setRecurrence(r => ({ ...r, type: e.target.value }))} style={styles.input as any}>
                            <option value="weekly">Repeat Weekly</option>
                            <option value="biweekly">Repeat Bi-Weekly</option>
                            <option value="monthly">Repeat Monthly</option>
                        </select>
                    </div>
                    <div style={{...styles.inputGroup as React.CSSProperties, flex: 1}}>
                         <label style={styles.label as any}>For</label>
                        <input type="number" value={recurrence.count} onChange={(e: ChangeEvent<HTMLInputElement>) => setRecurrence(r => ({ ...r, count: e.target.value }))} style={styles.input as any} />
                    </div>
                    <div style={{...styles.inputGroup as React.CSSProperties, flex: 1, marginBottom: '0'}}>
                        <button type="button" onClick={handleApplyRecurrence} style={{...styles.button as any, width: '100%', padding: '0.65rem' }}>Apply</button>
                    </div>
                </div>
            </div>

            <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
                <button onClick={handleSaveChanges} style={{...styles.button as React.CSSProperties, flex: 2, backgroundColor: '#16a34a'}} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => setIsModalOpen(false)} style={{...styles.button as React.CSSProperties, flex: 1, backgroundColor: '#4b5563'}}>
                    Cancel
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

