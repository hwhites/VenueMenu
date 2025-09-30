'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useParams } from 'next/navigation'
import { styles } from '../../../styles/forms'
import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { CalendarModal } from '../../../components/CalendarModal'

// --- Type Definitions ---
interface PublicVenueProfileData {
  venue_name: string
  city: string
  state: string
  genres_preferred: string[]
  bio?: string
  main_photo_url?: string
  social_links?: { [key: string]: string }
}

export default function VenueProfilePage() {
  const [profile, setProfile] = useState<PublicVenueProfileData | null>(null)
  const [availability, setAvailability] = useState<string[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const params = useParams()
  const venueId = params.id as string

  const ensureAbsoluteUrl = (url: string): string => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  useEffect(() => {
    if (!venueId) return

    const fetchVenueData = async () => {
      const sessionPromise = supabase.auth.getSession();
      
      const profilePromise = supabase
        .from('venue_profiles')
        .select(`
          venue_name, city, state, genres_preferred,
          venue_public_profiles ( bio, main_photo_url, social_links )
        `)
        .eq('user_id', venueId)
        .single()

      const availabilityPromise = supabase.rpc('get_venue_availability', { p_venue_id: venueId });

      const [
        { data: sessionData },
        { data: profileData, error: profileError },
        { data: availabilityData, error: availabilityError }
      ] = await Promise.all([sessionPromise, profilePromise, availabilityPromise]);
      
      if (sessionData.session) {
          setCurrentUser(sessionData.session.user);
          const { data: userProfile } = await supabase.from('profiles').select('role').eq('id', sessionData.session.user.id).single();
          if (userProfile) setCurrentUserRole(userProfile.role);
      }

      if (profileError || !profileData) {
        setError('Venue not found.')
        setLoading(false)
        return
      }
      
      if (availabilityError) console.error("Error fetching venue availability:", availabilityError);

      setAvailability((availabilityData || []).map((d: { needed_date: string }) => d.needed_date.split('T')[0]));

      const publicProfileInfo = Array.isArray(profileData.venue_public_profiles) ? profileData.venue_public_profiles[0] : profileData.venue_public_profiles;

      const combinedProfile: PublicVenueProfileData = {
        venue_name: profileData.venue_name,
        city: profileData.city,
        state: profileData.state,
        genres_preferred: profileData.genres_preferred || [],
        bio: publicProfileInfo?.bio,
        main_photo_url: publicProfileInfo?.main_photo_url,
        social_links: publicProfileInfo?.social_links,
      }
      setProfile(combinedProfile)
      setLoading(false)
    }

    fetchVenueData()
  }, [venueId])

  if (loading) return <div><p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading Venue Profile...</p></div>
  if (error) return <div><p style={{ textAlign: 'center', color: '#f87171', marginTop: '2rem' }}>{error}</p></div>
  if (!profile) return <div><p style={{ textAlign: 'center', marginTop: '2rem' }}>Could not load profile.</p></div>

  const pageStyle: React.CSSProperties = { backgroundColor: '#111827', color: '#f9fafb', minHeight: '100vh', padding: '1rem' };
  const cardStyle: React.CSSProperties = { backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }

  return (
    <>
      <div style={pageStyle}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ ...cardStyle, padding: '2rem', marginBottom: '2rem' }}>
                <Image src={profile.main_photo_url || 'https://via.placeholder.com/800x200'} alt={`${profile.venue_name} main photo`} width={800} height={200} style={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} />
                <h1 style={{ ...styles.header as React.CSSProperties, margin: 0, fontSize: '2.5rem', color: 'inherit' }}>{profile.venue_name}</h1>
                <p style={{ ...styles.subHeader as React.CSSProperties, margin: '0.5rem 0', fontSize: '1.2rem', color: 'inherit', opacity: 0.8 }}>{profile.city}, {profile.state}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>{profile.genres_preferred.map(g => (<span key={g} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.9rem' }}>{g}</span>))}</div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                  <button onClick={() => setIsCalendarOpen(true)} style={{ ...styles.button as React.CSSProperties, flex: 1, backgroundColor: '#4b5563' }}>
                      View Open Dates
                  </button>
                  {currentUser && currentUserRole === 'artist' && (
                      <Link href={`/messages/${venueId}`} style={{ ...styles.button as React.CSSProperties, flex: 1, display: 'block', textDecoration: 'none', textAlign: 'center' }}>
                          Contact This Venue
                      </Link>
                  )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                  <div style={cardStyle}>
                    <h2 style={{...styles.header as React.CSSProperties, fontSize: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.5rem', color: 'inherit' }}>About</h2>
                    <p style={{ lineHeight: '1.6', opacity: 0.9 }}>{profile.bio || 'No description available.'}</p>
                  </div>
                  <div style={cardStyle}>
                    <h2 style={{...styles.header as React.CSSProperties, fontSize: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.5rem', color: 'inherit' }}>Links</h2>
                    {profile.social_links && Object.keys(profile.social_links).length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {Object.entries(profile.social_links).map(([key, value]) => value && ( <li key={key}> <a href={ensureAbsoluteUrl(value as string)} target="_blank" rel="noopener noreferrer" style={{ color: '#7dd3fc', textDecoration: 'none', textTransform: 'capitalize' }}>{key}</a></li>))}
                      </ul>
                    ) : <p style={{ opacity: 0.7 }}>No social links provided.</p>}
                  </div>
              </div>
          </div>
      </div>
      {isCalendarOpen && (
        <CalendarModal 
            availableDates={availability}
            onClose={() => setIsCalendarOpen(false)}
        />
      )}
    </>
  )
}
