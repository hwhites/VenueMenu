'use client'

import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { styles } from '../../styles/forms'
import { User } from '@supabase/supabase-js'
import * as React from 'react'
import Link from 'next/link'

// --- Type Definitions ---
interface OpenDate {
  date: string
}

interface ArtistProfile {
  price_min?: number
  genres?: string[]
}

interface VenueResult {
  user_id: string
  venue_name?: string
  city?: string
  state?: string
  genres_preferred?: string[]
  budget_min?: number
  budget_max?: number
}

export default function DiscoverVenuesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null)
  const [openDates, setOpenDates] = useState<OpenDate[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const [selectedDate, setSelectedDate] = useState('')
  const [results, setResults] = useState<VenueResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [message, setMessage] = useState('Select an open date to find matching venues, or search without one.')

  useEffect(() => {
    const fetchArtistData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)

      const { data: baseProfile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (baseProfile?.role !== 'artist') {
        router.push('/account')
        return
      }

      const { data: profile } = await supabase
        .from('artist_profiles')
        .select('price_min, genres')
        .eq('user_id', session.user.id)
        .single()
      
      setArtistProfile(profile)

      const { data: dates } = await supabase
        .from('open_dates')
        .select('date')
        .eq('artist_user_id', session.user.id)
        .order('date')

      setOpenDates(dates || [])
      setLoading(false)
    }
    fetchArtistData()
  }, [router])

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    
    setIsSearching(true)
    setMessage('')
    setResults([])

    const searchParams = {
      search_date: selectedDate || null,
      artist_price_min: artistProfile?.price_min || null,
      artist_price_max: null,
      artist_genres: artistProfile?.genres || null,
    }

    const { data, error } = await supabase.rpc('search_venues', searchParams)

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else if (data && data.length > 0) {
      setResults(data as VenueResult[])
    } else {
      setMessage('No venues found matching your criteria.')
    }
    setIsSearching(false)
  }

  if (loading) {
    return <div><p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</p></div>
  }

  return (
    <div style={{...styles.container as React.CSSProperties, minHeight: 'calc(100vh - 120px)', backgroundColor: 'transparent', padding: '1rem', alignItems: 'flex-start' }}>
      <div style={{ ...styles.formWrapper as React.CSSProperties, maxWidth: '900px' }}>
        <h1 style={styles.header as React.CSSProperties}>Find a Venue</h1>
        <p style={styles.subHeader as React.CSSProperties}>
          Find venues that have an open need. Select one of your available dates to narrow the results.
        </p>
        
        {!artistProfile?.price_min && (
          <p style={{ backgroundColor: '#374151', padding: '1rem', borderRadius: '8px', color: '#f9fafb', textAlign: 'center', marginBottom: '1rem' }}>
            Your search will be more effective if you set your minimum price on your profile page.
          </p>
        )}

        <form onSubmit={handleSearch} style={{ backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <div style={styles.inputGroup as React.CSSProperties}>
            <label htmlFor="date" style={styles.label as React.CSSProperties}>Filter by one of your open dates (Optional)</label>
            <select id="date" style={styles.input as React.CSSProperties} value={selectedDate} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedDate(e.target.value)}>
              <option value="">-- Search All Venues --</option>
              {openDates.map((d) => (
                <option key={d.date} value={d.date}>
                  {new Date(d.date).toLocaleDateString(undefined, { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" style={{ ...(styles.button as React.CSSProperties), width: '100%', marginTop: '1.5rem' }} disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Find Venues'}
          </button>
        </form>

        <div>
          <h2 style={{ ...(styles.header as React.CSSProperties), fontSize: '20px', textAlign: 'left', marginBottom: '16px' }}>
            {results.length > 0 ? `Showing ${results.length} Result(s)` : 'Awaiting Search'}
          </h2>
          {isSearching && <p style={{ textAlign: 'center' }}>Searching...</p>}
          {message && <p style={{ color: '#9ca3af', textAlign: 'center' }}>{message}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {results.map((venue) => (
              <div key={venue.user_id} style={{ backgroundColor: '#374151', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#f9fafb' }}>{venue.venue_name}</h3>
                <p style={{ margin: '0 0 1rem 0', color: '#d1d5db', fontSize: '0.9rem' }}>{venue.city}, {venue.state}</p>
                <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {(venue.genres_preferred || []).map((g) => (
                    <span key={g} style={{ backgroundColor: '#4b5563', padding: '0.25rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', color: '#f9fafb' }}>
                      {g}
                    </span>
                  ))}
                </div>
                <p style={{ margin: '0 0 1rem 0', color: '#9ca3af', fontSize: '0.8rem' }}>
                  Budget: ${venue.budget_min || '??'} - ${venue.budget_max || '??'}
                </p>
                 {/* ADDITION: Buttons for profile and contact */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <Link href={`/venue/${venue.user_id}`} style={{...(styles.button as any), flex: 1, textDecoration: 'none', textAlign: 'center', padding: '0.5rem', backgroundColor: '#4b5563' }}>
                      Profile
                    </Link>
                    <Link href={`/messages/${venue.user_id}`} style={{...(styles.button as any), flex: 1, textDecoration: 'none', textAlign: 'center', padding: '0.5rem' }}>
                      Contact
                    </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

