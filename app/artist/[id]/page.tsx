'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useParams } from 'next/navigation'
import { styles } from '../../../styles/forms'
import * as React from 'react'

// --- Type Definitions ---
interface PublicProfileData {
  stage_name: string
  home_city: string
  home_state: string
  genres: string[]
  bio?: string
  public_bio?: string
  profile_photo_url?: string
  social_links?: { [key: string]: string }
}

interface Booking {
  id: number
  date: string
  venue_name: string
}

export default function ArtistProfilePage() {
  const [profile, setProfile] = useState<PublicProfileData | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const params = useParams()
  const artistId = params.id as string

  useEffect(() => {
    if (!artistId) return

    const fetchArtistData = async () => {
      const profilePromise = supabase
        .from('artist_profiles')
        .select(`
          stage_name,
          home_city,
          home_state,
          genres,
          bio,
          artist_public_profiles (
            bio,
            profile_photo_url,
            social_links
          )
        `)
        .eq('user_id', artistId)
        .single()

      const bookingsPromise = supabase
        .from('bookings')
        .select(`
          id,
          date,
          venue_profiles ( venue_name )
        `)
        .eq('artist_user_id', artistId)
        .eq('status', 'completed')
        .order('date', { ascending: false })

      const [{ data: profileData, error: profileError }, { data: bookingsData, error: bookingsError }] = await Promise.all([profilePromise, bookingsPromise])

      if (profileError) {
        setError('Artist not found.')
        console.error(profileError)
        setLoading(false)
        return
      }

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError)
      }

      const publicProfileInfo = Array.isArray(profileData.artist_public_profiles) ? profileData.artist_public_profiles[0] : profileData.artist_public_profiles;

      const combinedProfile: PublicProfileData = {
        stage_name: profileData.stage_name,
        home_city: profileData.home_city,
        home_state: profileData.home_state,
        genres: profileData.genres || [],
        bio: profileData.bio,
        public_bio: publicProfileInfo?.bio,
        profile_photo_url: publicProfileInfo?.profile_photo_url,
        social_links: publicProfileInfo?.social_links,
      }
      setProfile(combinedProfile)
      
      const formattedBookings: Booking[] = (bookingsData || []).map(b => {
        // FIX: Handle both array and object cases for joined data
        const venueProfile = Array.isArray(b.venue_profiles) ? b.venue_profiles[0] : b.venue_profiles;
        
        return {
          id: b.id,
          date: b.date,
          venue_name: (venueProfile as { venue_name: string })?.venue_name || 'Unknown Venue',
        }
      });
      setBookings(formattedBookings)

      setLoading(false)
    }

    fetchArtistData()
  }, [artistId])

  if (loading) {
    return <div><p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading Artist Profile...</p></div>
  }
  if (error) {
    return <div><p style={{ textAlign: 'center', color: '#f87171', marginTop: '2rem' }}>{error}</p></div>
  }
  if (!profile) {
    return <div><p style={{ textAlign: 'center', marginTop: '2rem' }}>Could not load profile.</p></div>
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
        <img
          src={profile.profile_photo_url || 'https://via.placeholder.com/150'}
          alt={`${profile.stage_name} profile photo`}
          style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <div>
          <h1 style={{ ...styles.header as React.CSSProperties, margin: 0, fontSize: '2.5rem' }}>{profile.stage_name}</h1>
          <p style={{ ...styles.subHeader as React.CSSProperties, margin: '0.5rem 0', fontSize: '1.2rem' }}>{profile.home_city}, {profile.home_state}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {profile.genres.map(g => (
              <span key={g} style={{ backgroundColor: '#374151', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.9rem' }}>{g}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div>
          <h2 style={{...styles.header as React.CSSProperties, fontSize: '1.5rem', borderBottom: '1px solid #374151', paddingBottom: '0.5rem' }}>About</h2>
          <p style={{ color: '#d1d5db', lineHeight: '1.6' }}>{profile.public_bio || profile.bio || 'No bio available.'}</p>
        </div>
        <div>
          <h2 style={{...styles.header as React.CSSProperties, fontSize: '1.5rem', borderBottom: '1px solid #374151', paddingBottom: '0.5rem' }}>Links</h2>
          {profile.social_links && Object.keys(profile.social_links).length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(profile.social_links).map(([key, value]) => value && (
                <li key={key}>
                  <a href={value as string} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', textTransform: 'capitalize' }}>
                    {key}
                  </a>
                </li>
              ))}
            </ul>
          ) : <p style={{ color: '#9ca3af' }}>No social links provided.</p>}
        </div>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h2 style={{...styles.header as React.CSSProperties, fontSize: '1.5rem', borderBottom: '1px solid #374151', paddingBottom: '0.5rem' }}>Gig History</h2>
        {bookings.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0' }}>
            {bookings.map(b => (
              <li key={b.id} style={{ backgroundColor: '#1f2937', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold' }}>{b.venue_name}</span>
                <span style={{ color: '#9ca3af' }}>{new Date(b.date).toLocaleDateString(undefined, { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '2rem' }}>No completed gigs to show.</p>
        )}
      </div>
    </div>
  )
}

