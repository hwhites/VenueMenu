'use client';

// FIX: Importing necessary types for strict compilation
import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { styles } from '../../styles/forms';
import { User } from '@supabase/supabase-js'; 
import * as React from 'react';

// FIX: Define types for the application's core objects

// Minimal type for the Open Dates array from the database
interface OpenDate {
  date: string;
}

// Minimal type for the Artist Profile required for the search logic
interface ArtistProfile {
  price_min: number;
  price_max: number;
  genres: string[];
}

// Minimal type for the Venue result from the 'search_venues' RPC
interface VenueResult {
  user_id: string;
  venue_name: string;
  city: string;
  state: string;
  genres_preferred: string[];
  budget_min: number;
  budget_max: number;
}

export default function DiscoverVenuesPage() {
  // FIX: Explicitly type all state variables
  const [user, setUser] = useState<User | null>(null);
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null); // Use defined type
  const [openDates, setOpenDates] = useState<OpenDate[]>([]); // Use defined array type
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Search state
  const [selectedDate, setSelectedDate] = useState('');
  const [results, setResults] = useState<VenueResult[]>([]); // Use defined result type
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

      // 1. Fetch and Check Artist Profile
      const { data: profile, error: profileError } = await supabase
        .from('artist_profiles')
        .select('price_min, price_max, genres, user_id') // Select only required fields
        .eq('user_id', session.user.id)
        .single();
        
      if (profileError || !profile) {
        router.push('/account'); // Redirect if no artist profile exists
        return;
      }
      
      // 2. Fetch Open Dates
      const { data: dates } = await supabase
        .from('open_dates')
        .select('date')
        .eq('artist_user_id', session.user.id)
        .order('date');

      setUser(session.user);
      setArtistProfile(profile as ArtistProfile); // Cast fetched data to defined type
      setOpenDates(dates as OpenDate[] || []);
      setLoading(false);
    };
    fetchArtistData();
  }, [router]);

  // FIX: Explicitly type 'e' as FormEvent and add required null checks
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    
    // Guard clause for type safety
    if (!artistProfile) {
        setMessage('Error: Profile data is missing.');
        return;
    }
    
    setIsSearching(true);
    setMessage('');
    setResults([]);

    const searchParams = {
      search_date: selectedDate || null,
      artist_price_min: artistProfile.price_min,
      artist_price_max: artistProfile.price_max,
      artist_genres: artistProfile.genres,
    };

    // FIX: Explicit casting of RPC return type
    const { data, error } = await supabase.rpc('search_venues', searchParams);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else if (data && data.length > 0) {
      setResults(data as VenueResult[]); // Cast data to the defined array type
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

  // FIX: Apply casting to all external style objects to bypass build errors
  return (
    <div
      style={
        {
          ...(styles.container as React.CSSProperties),
          minHeight: 'calc(100vh - 120px)',
          backgroundColor: 'transparent',
          padding: '1rem',
          alignItems: 'flex-start',
        } as React.CSSProperties
      }
    >
      <div style={{ ...(styles.formWrapper as React.CSSProperties), maxWidth: '900px' }}>
        <h1 style={styles.header as any}>Find a Venue</h1>
        <p style={styles.subHeader as any}>
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
          <div style={styles.inputGroup as any}>
            <label htmlFor="date" style={styles.label as any}>
              Filter by one of your open dates (Optional)
            </label>
            <select
              id="date"
              style={styles.input as any}
              value={selectedDate}
              // FIX: Explicitly type change handler
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedDate(e.target.value)}
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
            style={{ ...(styles.button as any), width: '100%', marginTop: '1.5rem' }}
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Find Venues'}
          </button>
        </form>

        <div>
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
                } as React.CSSProperties}
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
                        color: '#f9fafb', // Ensure text visibility
                      } as React.CSSProperties}
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