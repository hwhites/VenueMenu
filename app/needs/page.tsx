'use client';

// FIX: Importing all necessary types
import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { styles } from '../../styles/forms';
import Link from 'next/link';
import { User } from '@supabase/supabase-js'; 
import * as React from 'react';

// FIX: Define a minimal type for the data being handled
interface DateNeed {
  id: number;
  venue_user_id: string;
  date: string;
  // Add other required properties from the 'date_needs' table here (e.g., status, time_window, budget)
}

export default function NeedsPage() {
  // FIX: Explicitly type all state variables
  const [user, setUser] = useState<User | null>(null);
  const [dateNeeds, setDateNeeds] = useState<DateNeed[]>([]); // Use defined type
  const [newDate, setNewDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndNeeds = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      const currentUser = session.user;
      setUser(currentUser); // FIX: Set User is safe now

      // 1. Role Check
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      if (profileError || profile?.role !== 'venue') {
        router.push('/account');
        return;
      }

      // 2. Fetch Date Needs
      const { data: needs, error } = await supabase
        .from('date_needs')
        .select('*')
        .eq('venue_user_id', currentUser.id)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching date needs:', error);
        setMessage('Error: Could not load your date needs.');
      } else {
        setDateNeeds(needs as DateNeed[]); // FIX: Cast data to the defined type
      }
      setLoading(false);
    };
    fetchUserAndNeeds();
  }, [router]);

  // FIX: Explicitly type 'e' as FormEvent and add null guard
  const handleAddNeed = async (e: FormEvent) => {
    e.preventDefault();
    if (!newDate || !user) return; // FIX: Null guard for user

    const { data, error } = await supabase
      .from('date_needs')
      .insert({
        venue_user_id: user.id, // FIX: user is guaranteed not null here
        date: newDate,
      })
      .select();

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else if (data && data.length > 0) {
      const newNeed = data[0] as DateNeed; // FIX: Cast the new item
      const updatedNeeds = [...dateNeeds, newNeed].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() // FIX: Use getTime() for reliable sorting
      );
      setDateNeeds(updatedNeeds);
      setNewDate('');
      setMessage('Success! Date need added.');
    }
  };

  // FIX: Explicitly type 'id' parameter
  const handleDeleteNeed = async (id: number) => {
    const { error } = await supabase.from('date_needs').delete().eq('id', id);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setDateNeeds(dateNeeds.filter((need) => need.id !== id));
      setMessage('Success! Date need removed.');
    }
  };

  // FIX: Explicitly type change handler for date input
  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewDate(e.target.value);
  };

  if (loading) {
    return (
      <div>
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</p>
      </div>
    );
  }

  // FIX: Apply casting to all external style objects to bypass build errors
  return (
    <div
      style={
        {
          ...(styles.container as React.CSSProperties),
          minHeight: 'calc(100vh - 120px)',
          backgroundColor: 'transparent',
          padding: '1rem',
        } as React.CSSProperties
      }
    >
      <div style={{ ...(styles.formWrapper as React.CSSProperties), maxWidth: '600px' }}>
        <h1 style={styles.header as any}>Manage My Date Needs</h1>
        <p style={styles.subHeader as any}>
          List the dates your venue needs to book an artist.
        </p>

        <form
          onSubmit={handleAddNeed}
          style={{ marginBottom: '24px', display: 'flex', gap: '10px' }}
        >
          <div style={{ ...(styles.inputGroup as any), flex: 1, marginBottom: 0 }}>
            <label htmlFor="newDate" style={styles.label as any}>
              Add a new date need
            </label>
            <input
              id="newDate"
              type="date"
              value={newDate}
              onChange={handleDateChange}
              style={styles.input as any}
              required
            />
          </div>
          <button
            type="submit"
            style={{ ...(styles.button as any), alignSelf: 'flex-end', width: 'auto' }}
          >
            Add Date
          </button>
        </form>

        {message && (
          <p
            style={
              {
                ...(styles.message as any),
                color: message.startsWith('Error') ? '#f87171' : '#34d399',
              } as React.CSSProperties
            }
          >
            {message}
          </p>
        )}

        <div style={{ marginTop: '24px' }}>
          <h2
            style={
              {
                ...(styles.header as any),
                fontSize: '20px',
                textAlign: 'left',
                marginBottom: '16px',
              } as React.CSSProperties
            }
          >
            Your Current Date Needs
          </h2>
          {dateNeeds.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {dateNeeds.map((need) => (
                <li
                  key={need.id}
                  style={
                    {
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: '#374151',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      color: '#f9fafb',
                    } as React.CSSProperties
                  }
                >
                  <span>
                    {new Date(need.date).toLocaleDateString(undefined, {
                      timeZone: 'UTC',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <button
                    onClick={() => handleDeleteNeed(need.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f87171',
                      cursor: 'pointer',
                      fontSize: '18px',
                      fontWeight: 'bold',
                    }}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#9ca3af', textAlign: 'center' }}>
              You have no date needs listed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}