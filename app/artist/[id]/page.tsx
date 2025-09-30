'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useParams } from 'next/navigation'
import { styles } from '../../../styles/forms'
import * as React from 'react'
import Image from 'next/image'

// --- Type Definitions ---
interface ThemeSettings {
  backgroundColor?: string
  textColor?: string
}

interface PublicProfileData {
  stage_name: string
  home_city: string
  home_state: string
  genres: string[]
  bio?: string
  public_bio?: string
  profile_photo_url?: string
  social_links?: { [key: string]: string }
  theme_settings?: ThemeSettings
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

  const ensureAbsoluteUrl = (url: string): string => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  useEffect(() => {
    if (!artistId) return

    const fetchArtistData = async () => {
      // Fetch core profile and public profile data, including theme settings
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
            social_links,
            theme_settings
          )
        `)
        .eq('user_id', artistId)
        .single()

      const bookingsPromise = supabase
        .from('bookings')
        .select(`id, date, venue_profiles ( venue_name )`)
        .eq('artist_user_id', artistId)
        .eq('status', 'completed')
        .order('date', { ascending: false })

      const [{ data: profileData, error: profileError }, { data: bookingsData, error: bookingsError }] = await Promise.all([profilePromise, bookingsPromise])

      if (profileError || !profileData) {
        setError('Artist not found.')
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
        theme_settings: publicProfileInfo?.theme_settings, // Include theme settings
      }
      setProfile(combinedProfile)
      
      const formattedBookings: Booking[] = (bookingsData || []).map(b => {
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

  // --- Theme Application ---
  const pageStyle: React.CSSProperties = {
    backgroundColor: profile.theme_settings?.backgroundColor || '#111827',
    color: profile.theme_settings?.textColor || '#f9fafb',
    minHeight: '100vh',
    padding: '1rem',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'rgba(0,0,0,0.2)', // Semi-transparent cards to work with any background
    padding: '1rem',
    borderRadius: '8px'
  }

  return (
    // This outer div applies the custom theme
    <div style={pageStyle}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', ...cardStyle, padding: '2rem' }}>
                <Image
                src={profile.profile_photo_url || 'https://via.placeholder.com/150'}
                alt={`${profile.stage_name} profile photo`}
                width={150}
                height={150}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                <h1 style={{ ...styles.header as React.CSSProperties, margin: 0, fontSize: '2.5rem', color: 'inherit' }}>{profile.stage_name}</h1>
                <p style={{ ...styles.subHeader as React.CSSProperties, margin: '0.5rem 0', fontSize: '1.2rem', color: 'inherit', opacity: 0.8 }}>{profile.home_city}, {profile.home_state}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {profile.genres.map(g => (
                    <span key={g} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.9rem' }}>{g}</span>
                    ))}
                </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div style={cardStyle}>
                <h2 style={{...styles.header as React.CSSProperties, fontSize: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.5rem', color: 'inherit' }}>About</h2>
                <p style={{ lineHeight: '1.6', opacity: 0.9 }}>{profile.public_bio || profile.bio || 'No bio available.'}</p>
                </div>
                <div style={cardStyle}>
                <h2 style={{...styles.header as React.CSSProperties, fontSize: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.5rem', color: 'inherit' }}>Links</h2>
                {profile.social_links && Object.keys(profile.social_links).length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {Object.entries(profile.social_links).map(([key, value]) => value && (
                        <li key={key}>
                        <a href={ensureAbsoluteUrl(value as string)} target="_blank" rel="noopener noreferrer" style={{ color: '#7dd3fc', textDecoration: 'none', textTransform: 'capitalize' }}>
                            {key}
                        </a>
                        </li>
                    ))}
                    </ul>
                ) : <p style={{ opacity: 0.7 }}>No social links provided.</p>}
                </div>
            </div>

            <div style={{ marginTop: '3rem' }}>
                <h2 style={{...styles.header as React.CSSProperties, fontSize: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.5rem', color: 'inherit' }}>Gig History</h2>
                {bookings.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0' }}>
                    {bookings.map(b => (
                    <li key={b.id} style={{ ...cardStyle, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 'bold' }}>{b.venue_name}</span>
                        <span style={{ opacity: 0.7 }}>{new Date(b.date).toLocaleDateString(undefined, { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </li>
                    ))}
                </ul>
                ) : (
                <p style={{ opacity: 0.7, textAlign: 'center', marginTop: '2rem' }}>No completed gigs to show.</p>
                )}
            </div>
        </div>
    </div>
  )
}

