'use client';

// FIX: Added FormEvent and ChangeEvent for explicit event typing
import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { styles } from '../../styles/forms';
import Link from 'next/link';
import { User } from '@supabase/supabase-js'; 
import * as React from 'react'; // Use * as React for max compatibility

export default function AccountPage() {
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
          
          const artistProfile: any = Array.isArray(data.artist_profiles) 
            ? data.artist_profiles[0] || {} 
            : data.artist_profiles || {};
          
          const venueProfile: any = Array.isArray(data.venue_profiles)
            ? data.venue_profiles[0] || {}
            : data.venue_profiles || {};

          const profileData = {
            role: data.role,
            ...(data.role === 'artist' ? artistProfile : venueProfile),
          };
          
          setProfile(profileData);

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

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return; 

    setMessage('');
    setLoading(true);

    const profileTable =
      profile.role === 'artist' ? 'artist_profiles' : 'venue_profiles';
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
      .eq('user_id', user.id); 

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Success! Your profile has been updated.');
    }
    setLoading(false);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    let val: string | number | boolean = value;

    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      val = target.checked;
    }

    setProfile({ ...profile, [id]: val });
  };

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
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
      style={styles.container as React.CSSProperties} // Cast entire styles.container to bypass type error
    >
      <div style={
        { 
          ...(styles.formWrapper as React.CSSProperties), 
          minHeight: 'calc(100vh - 120px)',
          backgroundColor: 'transparent',
          padding: '1rem',
          maxWidth: '600px',
        } as React.CSSProperties // Cast entire inline style block
      }>
        
        {/* FIX APPLIED: Cast styles.header to any at the use point to bypass build issue */}
        <h1 style={styles.header as any}>My Dashboard</h1> 
        <p style={styles.subHeader as any}>
          Update your {profile.role} profile below.
        </p>

        <form onSubmit={handleUpdateProfile}>
          {profile.role === 'artist' && (
            <>
              <div style={styles.inputGroup as any}>
                <label htmlFor="stage_name" style={styles.label as any}>
                  Stage Name
                </label>
                <input
                  id="stage_name"
                  type="text"
                  style={styles.input as any}
                  value={profile.stage_name || ''}
                  onChange={handleChange}
                />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ ...(styles.inputGroup as any), flex: 3 }}>
                  <label htmlFor="home_city" style={styles.label as any}>
                    Home City
                  </label>
                  <input
                    id="home_city"
                    type="text"
                    style={styles.input as any}
                    value={profile.home_city || ''}
                    onChange={handleChange}
                  />
                </div>
                <div style={{ ...(styles.inputGroup as any), flex: 1 }}>
                  <label htmlFor="home_state" style={styles.label as any}>
                    State
                  </label>
                  <input
                    id="home_state"
                    type="text"
                    style={styles.input as any}
                    value={profile.home_state || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div style={styles.inputGroup as any}>
                <label htmlFor="genres" style={styles.label as any}>
                  Genres (comma-separated)
                </label>
                <input
                  id="genres"
                  type="text"
                  style={styles.input as any}
                  value={genreText}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setGenreText(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ ...(styles.inputGroup as any), flex: 1 }}>
                  <label htmlFor="act_type" style={styles.label as any}>
                    Act Type
                  </label>
                  <select
                    id="act_type"
                    style={styles.input as any}
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
                <div style={{ ...(styles.inputGroup as any), flex: 1 }}>
                  <label htmlFor="service_radius_km" style={styles.label as any}>
                    Service Radius (km)
                  </label>
                  <input
                    id="service_radius_km"
                    type="number"
                    style={styles.input as any}
                    value={profile.service_radius_km || ''}
                    onChange={handleNumberChange}
                  />
                </div>
              </div>
              <div style={styles.inputGroup as any}>
                <label htmlFor="bio" style={styles.label as any}>
                  Bio / Description
                </label>
                <textarea
                  id="bio"
                  style={styles.textarea as any}
                  value={profile.bio || ''}
                  onChange={handleChange}
                />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ ...(styles.inputGroup as any), flex: 1 }}>
                  <label htmlFor="price_min" style={styles.label as any}>
                    Base Price (Min $)
                  </label>
                  <input
                    id="price_min"
                    type="number"
                    style={styles.input as any}
                    value={profile.price_min || ''}
                    onChange={handleNumberChange}
                  />
                </div>
                <div style={{ ...(styles.inputGroup as any), flex: 1 }}>
                  <label htmlFor="price_max" style={styles.label as any}>
                    Base Price (Max $)
                  </label>
                  <input
                    id="price_max"
                    type="number"
                    style={styles.input as any}
                    value={profile.price_max || ''}
                    onChange={handleNumberChange}
                  />
                </div>
              </div>
            </>
          )}

          {profile.role === 'venue' && (
            <>
              <div style={styles.inputGroup as any}>
                <label htmlFor="venue_name" style={styles.label as any}>
                  Venue Name
                </label>
                <input
                  id="venue_name"
                  type="text"
                  style={styles.input as any}
                  value={profile.venue_name || ''}
                  onChange={handleChange}
                />
              </div>
              <div style={styles.inputGroup as any}>
                <label htmlFor="address1" style={styles.label as any}>
                  Street Address
                </label>
                <input
                  id="address1"
                  type="text"
                  style={styles.input as any}
                  value={profile.address1 || ''}
                  onChange={handleChange}
                />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ ...(styles.inputGroup as any), flex: 2 }}>
                  <label htmlFor="city" style={styles.label as any}>
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    style={styles.input as any}
                    value={profile.city || ''}
                    onChange={handleChange}
                  />
                </div>
                <div style={{ ...(styles.inputGroup as any), flex: 1 }}>
                  <label htmlFor="state" style={styles.label as any}>
                    State
                  </label>
                  <input
                    id="state"
                    type="text"
                    style={styles.input as any}
                    value={profile.state || ''}
                    onChange={handleChange}
                  />
                </div>
                <div style={{ ...(styles.inputGroup as any), flex: 1 }}>
                  <label htmlFor="postal" style={styles.label as any}>
                    Postal Code
                  </label>
                  <input
                    id="postal"
                    type="text"
                    style={styles.input as any}
                    value={profile.postal || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div style={styles.inputGroup as any}>
                <label htmlFor="genres_preferred" style={styles.label as any}>
                  Preferred Genres (comma-separated)
                </label>
                <input
                  id="genres_preferred"
                  type="text"
                  style={styles.input as any}
                  value={preferredGenreText}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPreferredGenreText(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ ...(styles.inputGroup as any), flex: 1 }}>
                  <label htmlFor="capacity" style={styles.label as any}>
                    Capacity
                  </label>
                  <input
                    id="capacity"
                    type="number"
                    style={styles.input as any}
                    value={profile.capacity || ''}
                    onChange={handleNumberChange}
                  />
                </div>
                <div
                  style={{
                    ...(styles.inputGroup as any),
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
                  <label htmlFor="pa_provided" style={styles.label as any}>
                    PA Provided?
                  </label>
                </div>
                <div
                  style={{
                    ...(styles.inputGroup as any),
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
                  <label htmlFor="backline_provided" style={styles.label as any}>
                    Backline?
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ ...(styles.inputGroup as any), flex: 1 }}>
                  <label htmlFor="budget_min" style={styles.label as any}>
                    Typical Budget (Min $)
                  </label>
                  <input
                    id="budget_min"
                    type="number"
                    style={styles.input as any}
                    value={profile.budget_min || ''}
                    onChange={handleNumberChange}
                  />
                </div>
                <div style={{ ...(styles.inputGroup as any), flex: 1 }}>
                  <label htmlFor="budget_max" style={styles.label as any}>
                    Typical Budget (Max $)
                  </label>
                  <input
                    id="budget_max"
                    type="number"
                    style={styles.input as any}
                    value={profile.budget_max || ''}
                    onChange={handleNumberChange}
                  />
                </div>
              </div>
            </>
          )}

          <button type="submit" style={styles.button as any} disabled={loading}>
            {loading ? 'Saving...' : 'Update Profile'}
          </button>
        </form>

        {message && (
          <p
            style={
              {
                ...(styles.message as any),
                color: message.startsWith('Error') ? '#f87171' : '#34d399',
              } as React.CSSProperties
            }
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}