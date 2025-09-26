'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { styles } from '../../styles/forms';
import { User } from '@supabase/supabase-js'; 
import * as React from 'react'; 

// --- Type Definitions ---
interface PriceZone {
    max_km: number; 
    min_pay: number;
}

interface ProfileData {
  role: 'artist' | 'venue';
  stage_name?: string;
  home_city?: string;
  home_state?: string;
  service_radius_km?: number;
  price_min?: number; 
  genres?: string[];
  pricing_zones?: PriceZone[]; 
  venue_name?: string;
  genres_preferred?: string[];
  budget_min?: number;
  budget_max?: number; 
  capacity?: number;
  pa_provided?: boolean;
  backline_provided?: boolean;
}

// Default structure for the Zoned Pricing input
const DEFAULT_ZONES: PriceZone[] = [
    { max_km: 15, min_pay: 0 },
    { max_km: 30, min_pay: 0 },
    { max_km: 9999, min_pay: 0 },
];


export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | any>(null); 
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const [genreText, setGenreText] = useState('');
  const [preferredGenreText, setPreferredGenreText] = useState('');
  const [priceZones, setPriceZones] = useState<PriceZone[]>(DEFAULT_ZONES); 


  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const currentUser = session.user;
      setUser(currentUser); 
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

          const profileData: ProfileData = {
            role: data.role,
            ...(data.role === 'artist' ? artistProfile : venueProfile),
          };
          
          setProfile(profileData);

          if (data.role === 'artist') {
            setGenreText((artistProfile.genres || []).join(', '));
            if (artistProfile.pricing_zones && artistProfile.pricing_zones.length > 0) {
                setPriceZones(artistProfile.pricing_zones);
            } else {
                setPriceZones(DEFAULT_ZONES);
            }
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
    const { role, user_id, price_max, ...updateData } = profile; 

    if (profile.role === 'artist') {
      updateData.genres = genreText
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean);
      
      updateData.pricing_zones = priceZones
        .map(zone => ({
            max_km: parseInt(zone.max_km as any, 10),
            min_pay: parseInt(zone.min_pay as any, 10),
        }))
        .filter(zone => zone.min_pay > 0); 

      updateData.price_min = updateData.price_min ? parseInt(updateData.price_min as any, 10) : 0;
      
    } else {
      updateData.genres_preferred = preferredGenreText
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean);
      
      updateData.budget_min = updateData.budget_min ? parseInt(updateData.budget_min as any, 10) : 0;
      updateData.budget_max = updateData.budget_max ? parseInt(updateData.budget_max as any, 10) : 0;
    }
    
    Object.keys(updateData).forEach(key => {
        if (typeof updateData[key] === 'string' && !isNaN(parseFloat(updateData[key]))) {
            updateData[key] = parseFloat(updateData[key]);
        }
        if (key === 'price_max') delete updateData[key]; 
    });


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
  
  const handleZoneChange = (index: number, field: keyof PriceZone, value: string) => {
    const newZones = priceZones.map((zone, i) => {
      if (i === index) {
        const numValue = value === '' ? 0 : parseInt(value, 10);
        return { ...zone, [field]: numValue };
      }
      return zone;
    });
    setPriceZones(newZones);
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
    const numValue = value === '' ? null : value; 
    setProfile({ ...profile, [id]: numValue });
  };

  const getZoneLabel = (index: number) => {
    if (index === 0) return `0 - ${priceZones[0].max_km} km`;
    if (index === 1) return `${priceZones[0].max_km} - ${priceZones[1].max_km} km`;
    if (index === 2) return `${priceZones[1].max_km}+ km (Max Radius)`;
    return '';
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
      style={
        {
          ...(styles.container as React.CSSProperties),
          minHeight: 'calc(100vh - 120px)',
          backgroundColor: 'transparent',
          padding: '1rem',
        } as React.CSSProperties
      }
    >
      <div style={{ ...(styles.formWrapper as React.CSSProperties), maxWidth: '600px' }}>
        <h1 style={styles.header as any}>My Profile & Rates</h1>
        <p style={styles.subHeader as any}>
          {/* FIX APPLIED: Optional chaining prevents runtime crash */}
          Update your {profile?.role || 'Guest'} profile below.
        </p>

        <form onSubmit={handleUpdateProfile}>
          {/* FIX APPLIED: Use optional chaining for safety */}
          {profile?.role === 'artist' && (
            <>
              <h2 style={{...(styles.header as any), fontSize: '20px', textAlign: 'left', marginTop: '20px'}}>Base Details</h2>
              <div style={styles.inputGroup as any}>
                <label htmlFor="stage_name" style={styles.label as any}>Stage Name</label>
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
                  <label htmlFor="home_city" style={styles.label as any}>Home City</label>
                  <input
                    id="home_city"
                    type="text"
                    style={styles.input as any}
                    value={profile.home_city || ''}
                    onChange={handleChange}
                  />
                </div>
                <div style={{ ...(styles.inputGroup as any), flex: 1 }}>
                  <label htmlFor="home_state" style={styles.label as any}>State</label>
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
              
              <h2 style={{...(styles.header as any), fontSize: '20px', textAlign: 'left', marginTop: '20px'}}>Pricing Zones (PostGIS Distance)</h2>
              <p style={{color: '#9ca3af', fontSize: '0.9rem', marginBottom: '16px'}}>
                Set **Minimum Pay** for different distance zones from your home base.
                The furthest zone uses your global **Service Radius** ({profile.service_radius_km || '??'} km).
              </p>

              {/* Dynamic Price Zone Inputs */}
              {priceZones.map((zone, index) => (
                <div key={index} style={{ marginBottom: '12px', padding: '12px', border: '1px solid #4b5563', borderRadius: '6px' }}>
                  <h3 style={{ fontSize: '1rem', color: '#f9fafb', marginBottom: '10px' }}>
                    Zone {index + 1}: {getZoneLabel(index)}
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '16px' }}>
                    
                    {/* Max KM Input (Only for first two zones) */}
                    {index < 2 && (
                        <div style={{...(styles.inputGroup as any), flex: 1 }}>
                            <label style={styles.label as any}>Max Distance (km)</label>
                            <input
                              type="number"
                              style={styles.input as any}
                              value={zone.max_km > 0 ? zone.max_km : ''}
                              onChange={(e) => handleZoneChange(index, 'max_km', e.target.value)}
                              required
                            />
                        </div>
                    )}
                    
                    {/* Min Pay Input */}
                    <div style={{...(styles.inputGroup as any), flex: index < 2 ? 2 : 3 }}> 
                      <label style={styles.label as any}>Min Pay ($)</label>
                      <input
                        type="number"
                        style={styles.input as any}
                        value={zone.min_pay > 0 ? zone.min_pay : ''}
                        onChange={(e) => handleZoneChange(index, 'min_pay', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            
              <h2 style={{...(styles.header as any), fontSize: '20px', textAlign: 'left', marginTop: '20px'}}>Global Settings</h2>
              
              <div style={{ display: 'flex', gap: '16px' }}>
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

              <div style={{ display: 'none' }}> 
                <input id="price_max" type="hidden" value={0} onChange={handleNumberChange} />
              </div>

            </>
          )}

          {profile?.role === 'venue' && (
            <>
              <div style={styles.inputGroup as any}>
                <label htmlFor="venue_name" style={styles.label as any}>Venue Name</label>
                <input id="venue_name" type="text" style={styles.input as any} value={profile.venue_name || ''} onChange={handleChange} />
              </div>
              <div style={styles.inputGroup as any}>
                <label htmlFor="address1" style={styles.label as any}>Street Address</label>
                <input id="address1" type="text" style={styles.input as any} value={profile.address1 || ''} onChange={handleChange} />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ ...(styles.inputGroup as any), flex: 2 }}>
                  <label htmlFor="city" style={styles.label as any}>City</label>
                  <input id="city" type="text" style={styles.input as any} value={profile.city || ''} onChange={handleChange} />
                </div>
                <div style={{ ...(styles.inputGroup as any), flex: 1 }}>
                  <label htmlFor="state" style={styles.label as any}>State</label>
                  <input id="state" type="text" style={styles.input as any} value={profile.state || ''} onChange={handleChange} />
                </div>
                <div style={{ ...(styles.inputGroup as any), flex: 1 }}>
                  <label htmlFor="postal" style={styles.label as any}>Postal Code</label>
                  <input id="postal" type="text" style={styles.input as any} value={profile.postal || ''} onChange={handleChange} />
                </div>
              </div>
              <div style={styles.inputGroup as any}>
                <label htmlFor="genres_preferred" style={styles.label as any}>Preferred Genres (comma-separated)</label>
                <input id="genres_preferred" type="text" style={styles.input as any} value={preferredGenreText} onChange={(e: ChangeEvent<HTMLInputElement>) => setPreferredGenreText(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ ...(styles.inputGroup as any), flex: 1 }}>
                  <label htmlFor="capacity" style={styles.label as any}>Capacity</label>
                  <input id="capacity" type="number" style={styles.input as any} value={profile.capacity || ''} onChange={handleNumberChange} />
                </div>
                <div style={{ ...(styles.inputGroup as any), flex: 1, alignItems: 'center', display: 'flex', paddingTop: '20px' }}>
                  <input id="pa_provided" type="checkbox" style={{ width: '16px', height: '16px', marginRight: '8px' }} checked={profile.pa_provided || false} onChange={handleChange} />
                  <label htmlFor="pa_provided" style={styles.label as any}>PA Provided?</label>
                </div>
                <div style={{ ...(styles.inputGroup as any), flex: 1, alignItems: 'center', display: 'flex', paddingTop: '20px' }}>
                  <input id="backline_provided" type="checkbox" style={{ width: '16px', height: '16px', marginRight: '8px' }} checked={profile.backline_provided || false} onChange={handleChange} />
                  <label htmlFor="backline_provided" style={styles.label as any}>Backline?</label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ ...(styles.inputGroup as any), flex: 1 }}>
                  <label htmlFor="budget_min" style={styles.label as any}>Typical Budget (Min $)</label>
                  <input id="budget_min" type="number" style={styles.input as any} value={profile.budget_min || ''} onChange={handleNumberChange} />
                </div>
                <div style={{ ...(styles.inputGroup as any), flex: 1 }}>
                  <label htmlFor="budget_max" style={styles.label as any}>Typical Budget (Max $)</label>
                  <input id="budget_max" type="number" style={styles.input as any} value={profile.budget_max || ''} onChange={handleNumberChange} />
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