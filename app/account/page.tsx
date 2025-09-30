'use client'

import { useCallback, useEffect, useState, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import { styles } from '../../styles/forms'
import { User } from '@supabase/supabase-js'
import * as React from 'react'

// --- Type Definitions for Clarity ---
interface ArtistProfile {
  user_id: string
  stage_name?: string
  home_city?: string
  home_state?: string
  service_radius_km?: number
  price_min?: number
  genres?: string[]
  act_type?: 'acoustic' | 'full_band' | 'dj' | 'duo' | ''
  bio?: string
}

interface VenueProfile {
  user_id: string
  venue_name?: string
  address1?: string
  city?: string
  state?: string
  postal?: string
  genres_preferred?: string[]
  budget_min?: number
  budget_max?: number
  capacity?: number
  pa_provided?: boolean
  backline_provided?: boolean
}

type Profile = { role: 'artist' | 'venue' } & Partial<ArtistProfile> & Partial<VenueProfile>

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const [genreText, setGenreText] = useState('')
  const [preferredGenreText, setPreferredGenreText] = useState('')

  const getProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    setUser(session.user)

    const { data: baseProfile, error: baseError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (baseError || !baseProfile) {
      console.error('Error fetching base profile:', baseError)
      setMessage('Error: Could not load your profile.')
      setLoading(false)
      return
    }

    const { role } = baseProfile
    let profileData = {}

    if (role === 'artist') {
      const { data: artistData, error: artistError } = await supabase
        .from('artist_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      if (artistError && artistError.code !== 'PGRST116') console.error('Error fetching artist profile:', artistError)
      profileData = artistData || {}
      setGenreText((artistData?.genres || []).join(', '))
    } else { 
      const { data: venueData, error: venueError } = await supabase
        .from('venue_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      if (venueError && venueError.code !== 'PGRST116') console.error('Error fetching venue profile:', venueError)
      profileData = venueData || {}
      setPreferredGenreText((venueData?.genres_preferred || []).join(', '))
    }

    setProfile({ role, ...profileData })
    setLoading(false)
  }, [router])

  useEffect(() => {
    getProfile()
  }, [getProfile])

  // --- 2. Corrected Profile Update Logic ---
  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !profile?.role) {
      setMessage('Error: User or profile data is missing.')
      return
    }

    setMessage('')
    setLoading(true)

    const profileTable = profile.role === 'artist' ? 'artist_profiles' : 'venue_profiles'
    
    // Helper to safely parse numbers, returning undefined for invalid input
    const safeParseInt = (value: any): number | undefined => {
        const num = parseInt(String(value), 10);
        return isNaN(num) ? undefined : num;
    };
    
    let updateData: Partial<ArtistProfile | VenueProfile> = { user_id: user.id }

    if (profile.role === 'artist') {
      updateData = {
        user_id: user.id,
        stage_name: profile.stage_name,
        home_city: profile.home_city,
        home_state: profile.home_state,
        service_radius_km: safeParseInt(profile.service_radius_km),
        price_min: safeParseInt(profile.price_min),
        genres: genreText.split(',').map(g => g.trim()).filter(Boolean),
        act_type: profile.act_type,
        bio: profile.bio,
      }
    } else {
      updateData = {
        user_id: user.id,
        venue_name: profile.venue_name,
        address1: profile.address1,
        city: profile.city,
        state: profile.state,
        postal: profile.postal,
        genres_preferred: preferredGenreText.split(',').map(g => g.trim()).filter(Boolean),
        budget_min: safeParseInt(profile.budget_min),
        budget_max: safeParseInt(profile.budget_max),
        capacity: safeParseInt(profile.capacity),
        pa_provided: profile.pa_provided,
        backline_provided: profile.backline_provided,
      }
    }

    const { error } = await supabase
      .from(profileTable)
      .upsert(updateData, { onConflict: 'user_id' })

    if (error) {
      setMessage(`Error: ${error.message}`)
      console.error('Profile Save Error:', error)
    } else {
      setMessage('Success! Your profile has been updated.')
    }
    setLoading(false)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target
    const isCheckbox = type === 'checkbox'
    const val = isCheckbox ? (e.target as HTMLInputElement).checked : value
    setProfile(p => (p ? { ...p, [id]: val } : null))
  }

  if (loading || !profile) {
    return <div><p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</p></div>
  }

  return (
    <div style={{...styles.container as React.CSSProperties, minHeight: 'calc(100vh - 120px)', backgroundColor: 'transparent', padding: '1rem' }}>
      <div style={{ ...styles.formWrapper as React.CSSProperties, maxWidth: '600px' }}>
        <h1 style={styles.header as React.CSSProperties}>My Profile & Rates</h1>
        <p style={styles.subHeader as React.CSSProperties}>
          Update your {profile.role} profile below.
        </p>

        <form onSubmit={handleUpdateProfile}>
          {profile.role === 'artist' && (
            <>
              <h2 style={{...styles.header as React.CSSProperties, fontSize: '20px', textAlign: 'left', marginTop: '20px'}}>Base Details</h2>
              <div style={styles.inputGroup as React.CSSProperties}>
                <label htmlFor="stage_name" style={styles.label as React.CSSProperties}>Stage Name</label>
                <input id="stage_name" type="text" style={styles.input as React.CSSProperties} value={profile.stage_name || ''} onChange={handleChange} />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ ...(styles.inputGroup as React.CSSProperties), flex: 3 }}>
                  <label htmlFor="home_city" style={styles.label as React.CSSProperties}>Home City</label>
                  <input id="home_city" type="text" style={styles.input as React.CSSProperties} value={profile.home_city || ''} onChange={handleChange} />
                </div>
                <div style={{ ...(styles.inputGroup as React.CSSProperties), flex: 1 }}>
                  <label htmlFor="home_state" style={styles.label as React.CSSProperties}>State</label>
                  <input id="home_state" type="text" style={styles.input as React.CSSProperties} value={profile.home_state || ''} onChange={handleChange} />
                </div>
              </div>
              <div style={styles.inputGroup as React.CSSProperties}>
                <label htmlFor="genres" style={styles.label as React.CSSProperties}>Genres (comma-separated)</label>
                <input id="genres" type="text" style={styles.input as React.CSSProperties} value={genreText} onChange={e => setGenreText(e.target.value)} />
              </div>
              
              <h2 style={{...styles.header as React.CSSProperties, fontSize: '20px', textAlign: 'left', marginTop: '20px'}}>Pricing</h2>
              <div style={styles.inputGroup as React.CSSProperties}>
                <label htmlFor="price_min" style={styles.label as React.CSSProperties}>Absolute Minimum Pay ($)</label>
                <input id="price_min" type="number" style={styles.input as React.CSSProperties} value={profile.price_min || ''} onChange={handleChange} required />
              </div>
              
              <h2 style={{...styles.header as React.CSSProperties, fontSize: '20px', textAlign: 'left', marginTop: '20px'}}>Global Settings</h2>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ ...(styles.inputGroup as React.CSSProperties), flex: 1 }}>
                  <label htmlFor="service_radius_km" style={styles.label as React.CSSProperties}>Service Radius (km)</label>
                  <input id="service_radius_km" type="number" style={styles.input as React.CSSProperties} value={profile.service_radius_km || ''} onChange={handleChange} />
                </div>
                <div style={{ ...(styles.inputGroup as React.CSSProperties), flex: 1 }}>
                  <label htmlFor="act_type" style={styles.label as React.CSSProperties}>Act Type</label>
                  <select id="act_type" style={styles.input as React.CSSProperties} value={profile.act_type || ''} onChange={handleChange}>
                    <option value="">Select Type</option>
                    <option value="acoustic">Acoustic</option>
                    <option value="full_band">Full Band</option>
                    <option value="duo">Duo</option>
                    <option value="dj">DJ</option>
                  </select>
                </div>
              </div>
              <div style={styles.inputGroup as React.CSSProperties}>
                <label htmlFor="bio" style={styles.label as React.CSSProperties}>Bio / Description</label>
                <textarea id="bio" style={styles.textarea as React.CSSProperties} value={profile.bio || ''} onChange={handleChange} />
              </div>
            </>
          )}

          {profile.role === 'venue' && (
            <>
              <div style={styles.inputGroup as React.CSSProperties}>
                <label htmlFor="venue_name" style={styles.label as React.CSSProperties}>Venue Name</label>
                <input id="venue_name" type="text" style={styles.input as React.CSSProperties} value={profile.venue_name || ''} onChange={handleChange} />
              </div>
              <div style={styles.inputGroup as React.CSSProperties}>
                  <label htmlFor="address1" style={styles.label as React.CSSProperties}>Street Address</label>
                  <input id="address1" type="text" style={styles.input as React.CSSProperties} value={profile.address1 || ''} onChange={handleChange}/>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ ...(styles.inputGroup as React.CSSProperties), flex: 2 }}>
                  <label htmlFor="city" style={styles.label as React.CSSProperties}>City</label>
                  <input id="city" type="text" style={styles.input as React.CSSProperties} value={profile.city || ''} onChange={handleChange} />
                </div>
                <div style={{ ...(styles.inputGroup as React.CSSProperties), flex: 1 }}>
                  <label htmlFor="state" style={styles.label as React.CSSProperties}>State</label>
                  <input id="state" type="text" style={styles.input as React.CSSProperties} value={profile.state || ''} onChange={handleChange} />
                </div>
                <div style={{ ...(styles.inputGroup as React.CSSProperties), flex: 1 }}>
                  <label htmlFor="postal" style={styles.label as React.CSSProperties}>Postal Code</label>
                  <input id="postal" type="text" style={styles.input as React.CSSProperties} value={profile.postal || ''} onChange={handleChange} />
                </div>
              </div>
              <div style={styles.inputGroup as React.CSSProperties}>
                <label htmlFor="genres_preferred" style={styles.label as React.CSSProperties}>Preferred Genres (comma-separated)</label>
                <input id="genres_preferred" type="text" style={styles.input as React.CSSProperties} value={preferredGenreText} onChange={e => setPreferredGenreText(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ ...(styles.inputGroup as React.CSSProperties), flex: 1 }}>
                  <label htmlFor="capacity" style={styles.label as React.CSSProperties}>Capacity</label>
                  <input id="capacity" type="number" style={styles.input as React.CSSProperties} value={profile.capacity || ''} onChange={handleChange} />
                </div>
                <div style={{ ...(styles.inputGroup as React.CSSProperties), flex: 1, alignItems: 'center', display: 'flex', paddingTop: '20px' }}>
                  <input id="pa_provided" type="checkbox" style={{ width: '16px', height: '16px', marginRight: '8px' }} checked={profile.pa_provided || false} onChange={handleChange} />
                  <label htmlFor="pa_provided" style={styles.label as React.CSSProperties}>PA Provided?</label>
                </div>
                <div style={{ ...(styles.inputGroup as React.CSSProperties), flex: 1, alignItems: 'center', display: 'flex', paddingTop: '20px' }}>
                  <input id="backline_provided" type="checkbox" style={{ width: '16px', height: '16px', marginRight: '8px' }} checked={profile.backline_provided || false} onChange={handleChange} />
                  <label htmlFor="backline_provided" style={styles.label as React.CSSProperties}>Backline?</label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ ...(styles.inputGroup as React.CSSProperties), flex: 1 }}>
                  <label htmlFor="budget_min" style={styles.label as React.CSSProperties}>Typical Budget (Min $)</label>
                  <input id="budget_min" type="number" style={styles.input as React.CSSProperties} value={profile.budget_min || ''} onChange={handleChange} />
                </div>
                <div style={{ ...(styles.inputGroup as React.CSSProperties), flex: 1 }}>
                  <label htmlFor="budget_max" style={styles.label as React.CSSProperties}>Typical Budget (Max $)</label>
                  <input id="budget_max" type="number" style={styles.input as React.CSSProperties} value={profile.budget_max || ''} onChange={handleChange} />
                </div>
              </div>
            </>
          )}

          <button type="submit" style={styles.button as React.CSSProperties} disabled={loading}>
            {loading ? 'Saving...' : 'Update Profile'}
          </button>
        </form>

        {message && (
          <p style={{...(styles.message as React.CSSProperties), color: message.startsWith('Error') ? '#f87171' : '#34d399' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

