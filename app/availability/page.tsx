'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { styles } from '../../styles/forms';
import Link from 'next/link';

export default function AvailabilityPage() {
  const [user, setUser] = useState(null);
  const [openDates, setOpenDates] = useState([]);
  const [stagedDates, setStagedDates] = useState([]);
  const [newDate, setNewDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndDates = async () => {
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

      if (profileError || profile.role !== 'artist') {
        router.push('/account');
        return;
      }

      const { data: dates, error } = await supabase
        .from('open_dates')
        .select('*')
        .eq('artist_user_id', session.user.id)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching open dates:', error);
        setMessage('Error: Could not load your open dates.');
      } else {
        setOpenDates(dates);
      }
      setLoading(false);
    };
    fetchUserAndDates();
  }, [router]);

  const handleStageDate = (e) => {
    e.preventDefault();
    if (!newDate) return;

    const isAlreadyStaged = stagedDates.includes(newDate);
    const isAlreadySaved = openDates.some((d) => d.date === newDate);
    if (isAlreadyStaged || isAlreadySaved) {
      setMessage('Error: This date is already in your list.');
      return;
    }

    setStagedDates([...stagedDates, newDate].sort());
    setNewDate('');
    setMessage('');
  };

  const handleRemoveStagedDate = (dateToRemove) => {
    setStagedDates(stagedDates.filter((date) => date !== dateToRemove));
  };

  const handleSaveDates = async () => {
    if (stagedDates.length === 0) return;
    setIsSaving(true);
    setMessage('');

    const datesToInsert = stagedDates.map((date) => ({
      artist_user_id: user.id,
      date: date,
    }));

    const { data, error } = await supabase
      .from('open_dates')
      .insert(datesToInsert)
      .select();

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else if (data) {
      const updatedDates = [...openDates, ...data].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      setOpenDates(updatedDates);
      setStagedDates([]);
      setMessage(`Success! ${data.length} date(s) added.`);
    }
    setIsSaving(false);
  };

  const handleDeleteDate = async (id) => {
    const { error } = await supabase.from('open_dates').delete().eq('id', id);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setOpenDates(openDates.filter((date) => date.id !== id));
      setMessage('Success! Date removed.');
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
        <h1 style={styles.header}>Manage My Availability</h1>
        <p style={styles.subHeader}>
          Add one or more dates to your list, then save them.
        </p>

        <form
          onSubmit={handleStageDate}
          style={{ marginBottom: '24px', display: 'flex', gap: '10px' }}
        >
          <div style={{ ...styles.inputGroup, flex: 1, marginBottom: 0 }}>
            <label htmlFor="newDate" style={styles.label}>
              Select a date
            </label>
            <input
              id="newDate"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              style={styles.input}
            />
          </div>
          <button
            type="submit"
            style={{ ...styles.button, alignSelf: 'flex-end', width: 'auto' }}
          >
            + Add to List
          </button>
        </form>

        {stagedDates.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2
              style={{
                ...styles.header,
                fontSize: '20px',
                textAlign: 'left',
                marginBottom: '16px',
              }}
            >
              New Dates to Add
            </h2>
            {stagedDates.map((date) => (
              <li
                key={date}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#4b5563',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  color: '#f9fafb',
                  listStyle: 'none',
                }}
              >
                <span>
                  {new Date(date).toLocaleDateString(undefined, {
                    timeZone: 'UTC',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <button
                  onClick={() => handleRemoveStagedDate(date)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fca5a5',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 'bold',
                  }}
                >
                  &times;
                </button>
              </li>
            ))}
            <button
              onClick={handleSaveDates}
              style={{
                ...styles.button,
                width: '100%',
                marginTop: '16px',
                backgroundColor: '#16a34a',
              }}
              disabled={isSaving}
            >
              {isSaving
                ? 'Saving...'
                : `Save ${stagedDates.length} New Date(s)`}
            </button>
          </div>
        )}

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
            Your Currently Open Dates
          </h2>
          {openDates.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {openDates.map((d) => (
                <li
                  key={d.id}
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
                    {new Date(d.date).toLocaleDateString(undefined, {
                      timeZone: 'UTC',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <button
                    onClick={() => handleDeleteDate(d.id)}
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
              You have no open dates listed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
