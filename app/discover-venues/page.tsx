'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { styles } from '../../styles/forms';

export default function DiscoverVenuesPage() {
  const [user, setUser] = useState(null);
  const [artistProfile, setArtistProfile] = useState(null);
  const [openDates, setOpenDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Search state
  const [selectedDate, setSelectedDate] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState(
    'Select an open date to find matching venues, or search without one.'
  );

  useEffect(() => {
    const fetchArtistData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('artist_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      if (!profile) {
        router.push('/account'); // Redirect non-artists
        return;
      }

      const { data: dates } = await supabase
        .from('open_dates')
        .select('date')
        .eq('artist_user_id', session.user.id)
        .order('date');

      setUser(session.user);
      setArtistProfile(profile);
      setOpenDates(dates || []);
      setLoading(false);
    };
    fetchArtistData();
  }, [router]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    setMessage('');
    setResults([]);

    const searchParams = {
      search_date: selectedDate || null, // Pass null if no date is selected
      artist_price_min: artistProfile.price_min,
      artist_price_max: artistProfile.price_max,
      artist_genres: artistProfile.genres,
    };

    const { data, error } = await supabase.rpc('search_venues', searchParams);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else if (data && data.length > 0) {
      setResults(data);
    } else {
      setMessage('No venues found matching your criteria.');
    }
    setIsSearching(false);
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
        alignItems: 'flex-start',
      }}
    >
      <div style={{ ...styles.formWrapper, maxWidth: '900px' }}>
        <h1 style={styles.header}>Find a Venue</h1>
        <p style={styles.subHeader}>
          Find venues that have an open need. Select one of your available dates
          to narrow the results.
        </p>

        <form
          onSubmit={handleSearch}
          style={{
            backgroundColor: '#1f2937',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem',
          }}
        >
          <div style={styles.inputGroup}>
            <label htmlFor="date" style={styles.label}>
              Filter by one of your open dates (Optional)
            </label>
            <select
              id="date"
              style={styles.input}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              <option value="">-- Search All Venues --</option>
              {openDates.map((d) => (
                <option key={d.date} value={d.date}>
                  {new Date(d.date).toLocaleDateString(undefined, {
                    timeZone: 'UTC',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            style={{ ...styles.button, width: '100%', marginTop: '1.5rem' }}
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Find Venues'}
          </button>
        </form>

        <div>
          <h2
            style={{
              ...styles.header,
              fontSize: '20px',
              textAlign: 'left',
              marginBottom: '16px',
            }}
          >
            {results.length > 0
              ? `Showing ${results.length} Result(s)`
              : 'Awaiting Search'}
          </h2>
          {isSearching && <p style={{ textAlign: 'center' }}>Searching...</p>}
          {message && (
            <p style={{ color: '#9ca3af', textAlign: 'center' }}>{message}</p>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
            }}
          >
            {results.map((venue) => (
              <div
                key={venue.user_id}
                style={{
                  backgroundColor: '#374151',
                  padding: '1rem',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#f9fafb' }}>
                  {venue.venue_name}
                </h3>
                <p
                  style={{
                    margin: '0 0 1rem 0',
                    color: '#d1d5db',
                    fontSize: '0.9rem',
                  }}
                >
                  {venue.city}, {venue.state}
                </p>
                <div
                  style={{
                    marginBottom: '1rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  {(venue.genres_preferred || []).map((g) => (
                    <span
                      key={g}
                      style={{
                        backgroundColor: '#4b5563',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
                <p
                  style={{
                    margin: 'auto 0 0 0',
                    color: '#9ca3af',
                    fontSize: '0.8rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #4b5563',
                  }}
                >
                  Budget: ${venue.budget_min || '??'} - $
                  {venue.budget_max || '??'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
