'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { styles } from '../../styles/forms';
import Link from 'next/link'; // Import Link

export default function DiscoverPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Search state
  const [filters, setFilters] = useState({
    date: '',
    minBudget: '',
    maxBudget: '',
    genres: '',
  });
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState(
    'Use the filters above to find artists.'
  );

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (profile?.role !== 'venue') {
        router.push('/account');
        return;
      }

      setUser(session.user);
      setLoading(false);
    };
    fetchSession();
  }, [router]);

  const handleFilterChange = (e) => {
    const { id, value } = e.target;
    setFilters({ ...filters, [id]: value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    setMessage('');
    setResults([]);

    const searchParams = {
      search_date: filters.date || null,
      budget_min_search: filters.minBudget ? parseInt(filters.minBudget) : null,
      budget_max_search: filters.maxBudget ? parseInt(filters.maxBudget) : null,
      genres_search: filters.genres
        ? filters.genres
            .split(',')
            .map((g) => g.trim())
            .filter(Boolean)
        : null,
    };

    const { data, error } = await supabase.rpc('search_artists', searchParams);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else if (data && data.length > 0) {
      setResults(data);
    } else {
      setMessage('No artists found matching your criteria.');
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
        <h1 style={styles.header}>Find an Artist</h1>
        <p style={styles.subHeader}>
          Filter by date, budget, and genre to find the perfect match for your
          venue.
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <div style={styles.inputGroup}>
              <label htmlFor="date" style={styles.label}>
                Date
              </label>
              <input
                id="date"
                type="date"
                style={styles.input}
                value={filters.date}
                onChange={handleFilterChange}
              />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="genres" style={styles.label}>
                Genres (comma-separated)
              </label>
              <input
                id="genres"
                type="text"
                style={styles.input}
                value={filters.genres}
                onChange={handleFilterChange}
              />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="minBudget" style={styles.label}>
                Min Budget ($)
              </label>
              <input
                id="minBudget"
                type="number"
                style={styles.input}
                value={filters.minBudget}
                onChange={handleFilterChange}
              />
            </div>
            <div style={{ ...styles.inputGroup }}>
              <label htmlFor="maxBudget" style={styles.label}>
                Max Budget ($)
              </label>
              <input
                id="maxBudget"
                type="number"
                style={styles.input}
                value={filters.maxBudget}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <button
            type="submit"
            style={{ ...styles.button, width: '100%', marginTop: '1.5rem' }}
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Find Artists'}
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
            {results.map((artist) => (
              <div
                key={artist.user_id}
                style={{
                  backgroundColor: '#374151',
                  padding: '1rem',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#f9fafb' }}>
                  {artist.stage_name}
                </h3>
                <p
                  style={{
                    margin: '0 0 1rem 0',
                    color: '#d1d5db',
                    fontSize: '0.9rem',
                  }}
                >
                  {artist.home_city}, {artist.home_state}
                </p>
                <div
                  style={{
                    marginBottom: '1rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  {(artist.genres || []).map((g) => (
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
                  style={{ margin: '0', color: '#9ca3af', fontSize: '0.8rem' }}
                >
                  Price: ${artist.price_min || '??'} - $
                  {artist.price_max || '??'}
                </p>
                {/* Contact Button */}
                <Link
                  href={`/messages/${artist.user_id}`}
                  style={{
                    ...styles.button,
                    marginTop: '1rem',
                    textDecoration: 'none',
                    textAlign: 'center',
                    padding: '0.5rem',
                  }}
                >
                  Contact
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
