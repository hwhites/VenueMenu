'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { styles } from '../../styles/forms';
import Link from 'next/link';
// Import the necessary type for the user object
import { User } from '@supabase/supabase-js'; 

export default function AccountPage() {
  // Use User | null type for state
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const [genreText, setGenreText] = useState('');
  const [preferredGenreText, setPreferredGenreText] = useState('');

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
      }
    };
    fetchSession();
  }, [router]);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        setLoading(true);
        // Note: The 'profiles' table select should only be used to get the role, 
        // as the nested select is only reliable if you ensure RLS is correct.
        const { data, error } = await supabase
          .from('profiles')
          .select(
            `
            role,
            artist_profiles(*),
            venue_profiles(*)
          `
          )
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setMessage('Error: Could not load your profile.');
        } else if (data) {
          // Safely pull specific profile data (use an empty object if null)
          const artistProfile = data.artist_profiles || {};
          const venueProfile = data.venue_profiles || {};

          // Create the combined profile object for the state
          const profileData = {
            role: data.role,
            ...(data.role === 'artist' ? artistProfile : venueProfile),
          };
          
          setProfile(profileData);

          // Use the specific profile variables to set genre text, fixing the type error
          if (data.role === 'artist') {
            setGenreText((artistProfile.genres || []).join(', '));
          } else {
            setPreferredGenreText(
              (venueProfile.genres_preferred || []).join(', ')
            );
          }
        }
        setLoading(false);
      };
      fetchProfile();
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    const profileTable =
      profile.role === 'artist' ? 'artist_profiles' : 'venue_profiles';
    // Destructure role, user_id, and remove any transient fields before update
    const { role, user_id, ...updateData } = profile;

    if (profile.role === 'artist') {
      updateData.genres = genreText
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean);
    } else {
      updateData.genres_preferred = preferredGenreText
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean);
    }

    const { error } = await supabase
      .from(profileTable)
      .update(updateData)
      // The update is performed on the user_id column of the profile table
      .eq('user_id', user.id); 

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Success! Your profile has been updated.');
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setProfile({ ...profile, [id]: val });
  };

  const handleNumberChange = (e) => {
    const { id, value } = e.target;
    const numValue = value === '' ? null : parseInt(value, 10);
    setProfile({ ...profile, [id]: numValue });
  };

  if (loading || !profile) {
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
      }}
    >
      <div style={{ ...styles.formWrapper, maxWidth: '600px' }}>
        <h1 style={styles.header}>My Dashboard</h1>
        <p style={styles.subHeader}>
          Update your {profile.role} profile below.
        </p>

        <form onSubmit={handleUpdateProfile}>
          {profile.role === 'artist' && (
            <>
              <div style={styles.inputGroup}>
                <label htmlFor="stage_name" style={styles.label}>
                  Stage Name
                </label>
                <input
                  id="stage_name"
                  type="text"
                  style={styles.input}
                  value={profile.stage_name || ''}
                  onChange={handleChange}
                />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ ...styles.inputGroup, flex: 3 }}>
                  <label htmlFor="home_city" style={styles.label}>
                    Home City
                  </label>
                  <input
                    id="home_city"
                    type="text"
                    style={styles.input}
                    value={profile.home_city || ''}
                    onChange={handleChange}
                  />
                </div>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label htmlFor="home_state" style={styles.label}>
                    State
                  </label>
                  <input
                    id="home_state"
                    type="text"
                    style={styles.input}
                    value={profile.home_state || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label htmlFor="genres" style={styles.label}>
                  Genres (comma-separated)
                </label>
                <input
                  id="genres"
                  type="text"
                  style={styles.input}
                  value={genreText}
                  onChange={(e) => setGenreText(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label htmlFor="act_type" style={styles.label}>
                    Act Type
                  </label>
                  <select
                    id="act_type"
                    style={styles.input}
                    value={profile.act_type || ''}
                    onChange={handleChange}
                  >
                    <option value="">Select Type</option>
                    <option value="acoustic">Acoustic</option>
                    <option value="full_band">Full Band</option>
                    <option value="duo">Duo</option>
                    <option value="dj">DJ</option>
                  </select>
                </div>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label htmlFor="service_radius_km" style={styles.label}>
                    Service Radius (km)
                  </label>
                  <input
                    id="service_radius_km"
                    type="number"
                    style={styles.input}
                    value={profile.service_radius_km || ''}
                    onChange={handleNumberChange}
                  />
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label htmlFor="bio" style={styles.label}>
                  Bio / Description
                </label>
                <textarea
                  id="bio"
                  style={styles.textarea}
                  value={profile.bio || ''}
                  onChange={handleChange}
                />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label htmlFor="price_min" style={styles.label}>
                    Base Price (Min $)
                  </label>
                  <input
                    id="price_min"
                    type="number"
                    style={styles.input}
                    value={profile.price_min || ''}
                    onChange={handleNumberChange}
                  />
                </div>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label htmlFor="price_max" style={styles.label}>
                    Base Price (Max $)
                  </label>
                  <input
                    id="price_max"
                    type="number"
                    style={styles.input}
                    value={profile.price_max || ''}
                    onChange={handleNumberChange}
                  />
                </div>
              </div>
            </>
          )}

          {profile.role === 'venue' && (
            <>
              <div style={styles.inputGroup}>
                <label htmlFor="venue_name" style={styles.label}>
                  Venue Name
                </label>
                <input
                  id="venue_name"
                  type="text"
                  style={styles.input}
                  value={profile.venue_name || ''}
                  onChange={handleChange}
                />
              </div>
              <div style={styles.inputGroup}>
                <label htmlFor="address1" style={styles.label}>
                  Street Address
                </label>
                <input
                  id="address1"
                  type="text"
                  style={styles.input}
                  value={profile.address1 || ''}
                  onChange={handleChange}
                />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ ...styles.inputGroup, flex: 2 }}>
                  <label htmlFor="city" style={styles.label}>
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    style={styles.input}
                    value={profile.city || ''}
                    onChange={handleChange}
                  />
                </div>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label htmlFor="state" style={styles.label}>
                    State
                  </label>
                  <input
                    id="state"
                    type="text"
                    style={styles.input}
                    value={profile.state || ''}
                    onChange={handleChange}
                  />
                </div>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label htmlFor="postal" style={styles.label}>
                    Postal Code
                  </label>
                  <input
                    id="postal"
                    type="text"
                    style={styles.input}
                    value={profile.postal || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label htmlFor="genres_preferred" style={styles.label}>
                  Preferred Genres (comma-separated)
                </label>
                <input
                  id="genres_preferred"
                  type="text"
                  style={styles.input}
                  value={preferredGenreText}
                  onChange={(e) => setPreferredGenreText(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label htmlFor="capacity" style={styles.label}>
                    Capacity
                  </label>
                  <input
                    id="capacity"
                    type="number"
                    style={styles.input}
                    value={profile.capacity || ''}
                    onChange={handleNumberChange}
                  />
                </div>
                <div
                  style={{
                    ...styles.inputGroup,
                    flex: 1,
                    alignItems: 'center',
                    display: 'flex',
                    paddingTop: '20px',
                  }}
                >
                  <input
                    id="pa_provided"
                    type="checkbox"
                    style={{
                      width: '16px',
                      height: '16px',
                      marginRight: '8px',
                    }}
                    checked={profile.pa_provided || false}
                    onChange={handleChange}
                  />
                  <label htmlFor="pa_provided" style={styles.label}>
                    PA Provided?
                  </label>
                </div>
                <div
                  style={{
                    ...styles.inputGroup,
                    flex: 1,
                    alignItems: 'center',
                    display: 'flex',
                    paddingTop: '20px',
                  }}
                >
                  <input
                    id="backline_provided"
                    type="checkbox"
                    style={{
                      width: '16px',
                      height: '16px',
                      marginRight: '8px',
                    }}
                    checked={profile.backline_provided || false}
                    onChange={handleChange}
                  />
                  <label htmlFor="backline_provided" style={styles.label}>
                    Backline?
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label htmlFor="budget_min" style={styles.label}>
                    Typical Budget (Min $)
                  </label>
                  <input
                    id="budget_min"
                    type="number"
                    style={styles.input}
                    value={profile.budget_min || ''}
                    onChange={handleNumberChange}
                  />
                </div>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label htmlFor="budget_max" style={styles.label}>
                    Typical Budget (Max $)
                  </label>
                  <input
                    id="budget_max"
                    type="number"
                    style={styles.input}
                    value={profile.budget_max || ''}
                    onChange={handleNumberChange}
                  />
                </div>
              </div>
            </>
          )}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Saving...' : 'Update Profile'}
          </button>
        </form>

        {message && (
          <p
            style={{
              ...styles.message,
              color: message.startsWith('Error') ? '#f87171' : '#34d399',
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}