'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useParams } from 'next/navigation'
import { styles } from '../../../styles/forms'
import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { CalendarModal } from '../../../components/CalendarModal' // Import the new component

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
  rating?: number
}

interface Review {
    id: number
    rating: number
    comment?: string
    venue_name: string
}

export default function ArtistProfilePage() {
  const [profile, setProfile] = useState<PublicProfileData | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [reviews, setReviews] = useState<Review[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const params = useParams()
  const artistId = params.id as string

  const ensureAbsoluteUrl = (url: string): string => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  useEffect(() => {
    if (!artistId) return

    const fetchArtistData = async () => {
      const sessionPromise = supabase.auth.getSession();
      const profilePromise = supabase.from('artist_profiles').select(`stage_name, home_city, home_state, genres, bio, artist_public_profiles ( bio, profile_photo_url, social_links, theme_settings )`).eq('user_id', artistId).single();
      const bookingsPromise = supabase.from('bookings').select(`id, date, venue_profiles ( venue_name ), reviews ( rating )`).eq('artist_user_id', artistId).eq('status', 'completed').order('date', { ascending: false });
      const reviewsPromise = supabase.from('reviews').select(`id, rating, comment, bookings ( venue_profiles ( venue_name ) )`).eq('reviewee_id', artistId).order('created_at', { ascending: false });
      const availabilityPromise = supabase.rpc('get_artist_availability', { p_artist_id: artistId });

      const [
        { data: sessionData },
        { data: profileData, error: profileError }, 
        { data: bookingsData, error: bookingsError },
        { data: reviewsData, error: reviewsError },
        { data: availabilityData, error: availabilityError }
      ] = await Promise.all([sessionPromise, profilePromise, bookingsPromise, reviewsPromise, availabilityPromise]);

      if (sessionData.session) {
          setCurrentUser(sessionData.session.user);
          const { data: userProfile } = await supabase.from('profiles').select('role').eq('id', sessionData.session.user.id).single();
          if (userProfile) setCurrentUserRole(userProfile.role);
      }

      if (profileError || !profileData) { setError('Artist not found.'); setLoading(false); return; }
      if (bookingsError) console.error('Error fetching bookings:', bookingsError);
      if (reviewsError) console.error('Error fetching reviews:', reviewsError);
      if (availabilityError) console.error('Error fetching availability:', availabilityError);
      
      setAvailability((availabilityData || []).map((d: { available_date: string }) => d.available_date.split('T')[0]));

      const publicProfileInfo = Array.isArray(profileData.artist_public_profiles) ? profileData.artist_public_profiles[0] : profileData.artist_public_profiles;
      const combinedProfile: PublicProfileData = {
        stage_name: profileData.stage_name, home_city: profileData.home_city, home_state: profileData.home_state,
        genres: profileData.genres || [], bio: profileData.bio, public_bio: publicProfileInfo?.bio,
        profile_photo_url: publicProfileInfo?.profile_photo_url, social_links: publicProfileInfo?.social_links,
        theme_settings: publicProfileInfo?.theme_settings,
      }
      setProfile(combinedProfile)
      
      const formattedBookings: Booking[] = (bookingsData || []).map(b => {
        const venueProfile = Array.isArray(b.venue_profiles) ? b.venue_profiles[0] : b.venue_profiles;
        const review = Array.isArray(b.reviews) ? b.reviews[0] : b.reviews;
        return { id: b.id, date: b.date, venue_name: (venueProfile as { venue_name: string })?.venue_name || 'Unknown Venue', rating: (review as { rating: number })?.rating }
      });
      setBookings(formattedBookings)

      const formattedReviews: Review[] = (reviewsData || []).map(r => {
        const bookingInfo = Array.isArray(r.bookings) ? r.bookings[0] : r.bookings;
        const venueProfile = Array.isArray(bookingInfo?.venue_profiles) ? bookingInfo?.venue_profiles[0] : bookingInfo?.venue_profiles;
        return { id: r.id, rating: r.rating, comment: r.comment, venue_name: (venueProfile as { venue_name: string })?.venue_name || 'A Venue' }
      });
      setReviews(formattedReviews);

      setLoading(false)
    }

    fetchArtistData()
  }, [artistId])

  if (loading) return <div><p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading Artist Profile...</p></div>
  if (error) return <div><p style={{ textAlign: 'center', color: '#f87171', marginTop: '2rem' }}>{error}</p></div>
  if (!profile) return <div><p style={{ textAlign: 'center', marginTop: '2rem' }}>Could not load profile.</p></div>

  const pageStyle: React.CSSProperties = { backgroundColor: profile.theme_settings?.backgroundColor || '#111827', color: profile.theme_settings?.textColor || '#f9fafb', minHeight: '100vh', padding: '1rem' };
  const cardStyle: React.CSSProperties = { backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }

  return (
    <>
      <div style={pageStyle}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', ...cardStyle, padding: '2rem' }}>
                  <Image src={profile.profile_photo_url || 'https://via.placeholder.com/150'} alt={`${profile.stage_name} profile photo`} width={150} height={150} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h1 style={{ ...styles.header as React.CSSProperties, margin: 0, fontSize: '2.5rem', color: 'inherit' }}>{profile.stage_name}</h1>
                    <p style={{ ...styles.subHeader as React.CSSProperties, margin: '0.5rem 0', fontSize: '1.2rem', color: 'inherit', opacity: 0.8 }}>{profile.home_city}, {profile.home_state}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>{profile.genres.map(g => (<span key={g} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.9rem' }}>{g}</span>))}</div>
                  </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                  <button onClick={() => setIsCalendarOpen(true)} style={{ ...styles.button as React.CSSProperties, flex: 1, backgroundColor: '#4b5563' }}>
                      View Availability
                  </button>
                  {currentUser && currentUserRole === 'venue' && (
                      <Link href={`/messages/${artistId}`} style={{ ...styles.button as React.CSSProperties, flex: 1, display: 'block', textDecoration: 'none', textAlign: 'center' }}>
                          Contact This Artist
                      </Link>
                  )}
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
                        {Object.entries(profile.social_links).map(([key, value]) => value && ( <li key={key}> <a href={ensureAbsoluteUrl(value as string)} target="_blank" rel="noopener noreferrer" style={{ color: '#7dd3fc', textDecoration: 'none', textTransform: 'capitalize' }}>{key}</a></li>))}
                      </ul>
                    ) : <p style={{ opacity: 0.7 }}>No social links provided.</p>}
                  </div>
              </div>

              <div style={{ marginTop: '3rem' }}>
                <h2 style={{...styles.header as React.CSSProperties, fontSize: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.5rem', color: 'inherit' }}>Gig History</h2>
                {bookings.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0' }}>
                    {bookings.map(b => (
                      <li key={b.id} style={{ ...cardStyle, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 'bold' }}>{b.venue_name}</span>
                          <span style={{ opacity: 0.7, marginLeft: '1rem' }}>{new Date(b.date).toLocaleDateString(undefined, { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        {b.rating && (<span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{b.rating}/5 ★</span>)}
                      </li>
                    ))}
                  </ul>
                ) : <p style={{ opacity: 0.7, textAlign: 'center', marginTop: '2rem' }}>No completed gigs to show.</p>}
              </div>

              <div style={{ marginTop: '3rem' }}>
                <h2 style={{...styles.header as React.CSSProperties, fontSize: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.5rem', color: 'inherit' }}>Reviews</h2>
                {reviews.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0' }}>
                      {reviews.map(r => (
                          <li key={r.id} style={{ ...cardStyle, marginBottom: '1rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                  <span style={{ fontWeight: 'bold' }}>{r.venue_name}</span>
                                  <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{r.rating}/5 ★</span>
                              </div>
                              {r.comment && <p style={{ margin: 0, opacity: 0.9 }}>"{r.comment}"</p>}
                          </li>
                      ))}
                  </ul>
                ) : <p style={{ opacity: 0.7, textAlign: 'center', marginTop: '2rem' }}>This artist has not received any reviews yet.</p>}
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

