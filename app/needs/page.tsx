'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { styles } from '../../styles/forms';
import Link from 'next/link';

export default function NeedsPage() {
  const [user, setUser] = useState(null);
  const [dateNeeds, setDateNeeds] = useState([]);
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
      setUser(session.user);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError || profile.role !== 'venue') {
        router.push('/account');
        return;
      }

      const { data: needs, error } = await supabase
        .from('date_needs')
        .select('*')
        .eq('venue_user_id', session.user.id)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching date needs:', error);
        setMessage('Error: Could not load your date needs.');
      } else {
        setDateNeeds(needs);
      }
      setLoading(false);
    };
    fetchUserAndNeeds();
  }, [router]);

  const handleAddNeed = async (e) => {
    e.preventDefault();
    if (!newDate) return;

    const { data, error } = await supabase
      .from('date_needs')
      .insert({
        venue_user_id: user.id,
        date: newDate,
      })
      .select();

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else if (data) {
      const updatedNeeds = [...dateNeeds, data[0]].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      setDateNeeds(updatedNeeds);
      setNewDate('');
      setMessage('Success! Date need added.');
    }
  };

  const handleDeleteNeed = async (id) => {
    const { error } = await supabase.from('date_needs').delete().eq('id', id);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setDateNeeds(dateNeeds.filter((need) => need.id !== id));
      setMessage('Success! Date need removed.');
    }
  };

  if (loading) {
    return (
      <div>
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        ...styles.container,
        minHeight: 'calc(100vh - 120px)',
        backgroundColor: 'transparent',
        padding: '1rem',
      }}
    >
      <div style={{ ...styles.formWrapper, maxWidth: '600px' }}>
        <h1 style={styles.header}>Manage My Date Needs</h1>
        <p style={styles.subHeader}>
          List the dates your venue needs to book an artist.
        </p>

        <form
          onSubmit={handleAddNeed}
          style={{ marginBottom: '24px', display: 'flex', gap: '10px' }}
        >
          <div style={{ ...styles.inputGroup, flex: 1, marginBottom: 0 }}>
            <label htmlFor="newDate" style={styles.label}>
              Add a new date need
            </label>
            <input
              id="newDate"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          <button
            type="submit"
            style={{ ...styles.button, alignSelf: 'flex-end', width: 'auto' }}
          >
            Add Date
          </button>
        </form>

        {message && (
          <p
            style={{
              ...styles.message,
              color: message.startsWith('Error') ? '#f87171' : '#34d399',
            }}
          >
            {message}
          </p>
        )}

        <div style={{ marginTop: '24px' }}>
          <h2
            style={{
              ...styles.header,
              fontSize: '20px',
              textAlign: 'left',
              marginBottom: '16px',
            }}
          >
            Your Current Date Needs
          </h2>
          {dateNeeds.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {dateNeeds.map((need) => (
                <li
                  key={need.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#374151',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    color: '#f9fafb',
                  }}
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
