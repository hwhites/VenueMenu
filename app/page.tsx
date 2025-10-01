'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { styles } from '../styles/forms'
import { User } from '@supabase/supabase-js'
import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'

// --- Type Definitions ---
interface InstantGig {
  gig_id: number;
  created_by: string;
  creator_role: 'artist' | 'venue';
  gig_date: string;
  pay_amount: number;
  genres: string[];
  city: string;
  notes: string;
  creator_name: string;
  creator_photo: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'artist' | 'venue' | null>(null);
  const [loading, setLoading] = useState(true);
  const [gigs, setGigs] = useState<InstantGig[]>([]);
  const [filters, setFilters] = useState({ city: '' });
  const [isBooking, setIsBooking] = useState<number | null>(null);
  const [confirmingGigId, setConfirmingGigId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const router = useRouter();

  const fetchGigs = useCallback(async (currentRole: string | null) => {
    const roleToFetch = currentRole === 'artist' ? 'venue' : (currentRole === 'venue' ? 'artist' : null);
    
    // Only fetch if a role is determined (i.e., user is logged in)
    if (!roleToFetch) {
        setGigs([]);
        return;
    }

    const { data, error } = await supabase.rpc('get_instant_gigs', {
      p_filter_role: roleToFetch,
      p_filter_city: filters.city || null,
    });

    if (error) console.error("Error fetching gigs:", error);
    else setGigs(data || []);
  }, [filters.city]);

  useEffect(() => {
    const fetchUserAndGigs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single();
        const role = profile?.role || null;
        setUserRole(role);
        await fetchGigs(role);
      } else {
        setGigs([]); // Ensure gigs are empty if logged out
      }
      setLoading(false);
    };
    fetchUserAndGigs();
  }, [fetchGigs]);

  const handleInstantBook = async (gig: InstantGig) => {
      if (!user || !userRole) { router.push('/login'); return; }
      if (userRole === gig.creator_role) { setMessage("You cannot book your own gig post."); return; }

      setIsBooking(gig.gig_id);
      setMessage('');

      const { error } = await supabase.rpc('book_instant_gig', {
          p_gig_id: gig.gig_id,
          p_booker_id: user.id
      });

      if (error) {
          setMessage(`Error: ${error.message}`);
          if (error.message.includes('no longer available')) {
              fetchGigs(userRole);
          }
      } else {
          setMessage('Success! Booking confirmed. You can view it in "My Bookings".');
          setGigs(prevGigs => prevGigs.filter(g => g.gig_id !== gig.gig_id));
      }
      setIsBooking(null);
      setConfirmingGigId(null);
  };

  if (loading) {
    return <div style={{...styles.container as any}}><p style={{color: '#fff'}}>Loading...</p></div>
  }

  // --- RENDER LOGIC ---

  // If user is not logged in, show a welcome/login screen
  if (!user) {
    return (
        <div style={{...styles.container as any, minHeight: 'calc(100vh - 80px)', alignItems: 'center', padding: '1rem' }}>
            <div style={{...styles.formWrapper as any, maxWidth: '800px', textAlign: 'center'}}>
                <h1 style={styles.header as any}>Welcome to VenueMenu</h1>
                <p style={styles.subHeader as any}>The marketplace for connecting artists and venues.</p>
                <p style={styles.subHeader as any}>Log in or sign up to view the Instant Gig Board.</p>
                <div style={{display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px'}}>
                    <Link href="/login" style={{...styles.button as any, width: 'auto', textDecoration: 'none'}}>
                        Login
                    </Link>
                    <Link href="/signup" style={{...styles.button as any, width: 'auto', backgroundColor: '#4b5563', textDecoration: 'none'}}>
                        Sign Up
                    </Link>
                </div>
            </div>
        </div>
    );
  }

  // If user is logged in, show the Instant Gig Board
  return (
    <div style={{...styles.container as any, minHeight: 'calc(100vh - 80px)', alignItems: 'flex-start', padding: '1rem' }}>
      <div style={{...styles.formWrapper as any, maxWidth: '900px', width: '100%'}}>
        <h1 style={styles.header as any}>Instant Gig Board</h1>
        <p style={styles.subHeader as any}>Find immediate opportunities posted by {userRole === 'artist' ? 'venues' : 'artists'}.</p>
        
        {message && <p style={{ ...(styles.message as React.CSSProperties), color: message.startsWith('Error') ? '#f87171' : '#34d399', textAlign: 'center' }}>{message}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '2rem' }}>
            <input type="text" placeholder="Filter by city..." value={filters.city} onChange={(e) => setFilters(f => ({...f, city: e.target.value}))} style={styles.input as any} />
            <button onClick={() => fetchGigs(userRole)} style={styles.button as any}>Search</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {gigs.length > 0 ? gigs.map(gig => (
            <div key={gig.gig_id} style={{ backgroundColor: '#1f2937', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                <Link href={`/${gig.creator_role}/${gig.created_by}`} style={{textDecoration: 'none', color: 'inherit'}}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <Image src={gig.creator_photo || 'https://via.placeholder.com/50'} alt="Creator photo" width={50} height={50} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                            <h3 style={{ margin: 0 }}>{gig.creator_name}</h3>
                            <p style={{ margin: 0, color: '#9ca3af', textTransform: 'capitalize' }}>{gig.creator_role} is looking for a {gig.creator_role === 'artist' ? 'venue' : 'artist'}</p>
                        </div>
                    </div>
                </Link>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '1.1rem' }}>${gig.pay_amount} on {new Date(gig.gig_date).toLocaleDateString(undefined, { timeZone: 'UTC', month: 'short', day: 'numeric' })}</p>
                <p style={{ margin: '0 0 1rem 0', color: '#d1d5db' }}>in {gig.city}</p>
                <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {(gig.genres || []).map(g => (<span key={g} style={{ backgroundColor: '#4b5563', padding: '0.25rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{g}</span>))}
                </div>
                {gig.notes && <p style={{ margin: '0 0 1rem 0', color: '#9ca3af', fontStyle: 'italic' }}>"{gig.notes}"</p>}

                <div style={{marginTop: 'auto'}}>
                    {confirmingGigId === gig.gig_id ? (
                        <div style={{textAlign: 'center'}}>
                            <p style={{fontSize: '0.8rem', color: '#fca5a5', margin: '0 0 0.5rem 0'}}>This is a binding agreement. Are you sure?</p>
                            <div style={{display: 'flex', gap: '0.5rem'}}>
                                <button onClick={() => handleInstantBook(gig)} style={{...styles.button as any, flex: 2, backgroundColor: '#dc2626'}} disabled={isBooking === gig.gig_id}>
                                    {isBooking === gig.gig_id ? 'Booking...' : 'Confirm Book'}
                                </button>
                                <button onClick={() => setConfirmingGigId(null)} style={{...styles.button as any, flex: 1, backgroundColor: '#4b5563'}}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setConfirmingGigId(gig.gig_id)} 
                            style={{...styles.button as any, backgroundColor: '#16a34a' }}
                            disabled={isBooking !== null || !user}
                        >
                            {user ? 'Instant Book' : 'Login to Book'}
                        </button>
                    )}
                </div>
            </div>
          )) : <p style={{ color: '#9ca3af', textAlign: 'center', gridColumn: '1 / -1' }}>No instant gigs found for you right now. Check back later!</p>}
        </div>
      </div>
    </div>
  )
}

