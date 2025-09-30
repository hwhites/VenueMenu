'use client'

import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { styles } from '../../styles/forms'
import { User } from '@supabase/supabase-js'
import * as React from 'react'
import Image from 'next/image'

// Type definition for the venue public profile data
interface PublicProfile {
  user_id: string
  main_photo_url?: string
  bio?: string
  social_links?: {
    website?: string
    facebook?: string
    instagram?: string
  }
}

export default function EditVenuePublicProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Partial<PublicProfile>>({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)

      const { data: baseProfile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (baseProfile?.role !== 'venue') {
        router.push('/account')
        return
      }

      const { data: publicProfile } = await supabase
        .from('venue_public_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      
      if (publicProfile) {
        setProfile(publicProfile)
      }
      setLoading(false)
    }
    fetchProfile()
  }, [router])

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setMessage('')

    const updateData = {
      user_id: user.id,
      ...profile,
    }

    const { error } = await supabase
      .from('venue_public_profiles')
      .upsert(updateData, { onConflict: 'user_id' })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Success! Your public profile has been updated.')
    }
    setLoading(false)
  }
  
  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) return

    const file = event.target.files[0]
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/${Math.random()}.${fileExt}`

    setUploading(true)
    setMessage('');

    const { error: uploadError } = await supabase.storage
      .from('venue-photos') // Use the new bucket
      .upload(filePath, file)

    if (uploadError) {
      setMessage(`Upload Error: ${uploadError.message}`)
      setUploading(false)
      return
    }

    const { data } = supabase.storage
      .from('venue-photos')
      .getPublicUrl(filePath)

    if (data) {
        const newUrl = data.publicUrl;
        setProfile(p => ({ ...p, main_photo_url: newUrl }));
        await supabase
            .from('venue_public_profiles')
            .upsert({ user_id: user.id, main_photo_url: newUrl }, { onConflict: 'user_id' });
        setMessage('Main photo updated!');
    }
    
    setUploading(false)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setProfile(p => ({ ...p, [id]: value }))
  }
  
  const handleSocialLinkChange = (e: ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setProfile(p => ({
          ...p,
          social_links: {
              ...(p.social_links || {}),
              [id]: value
          }
      }));
  }

  if (loading) {
    return <div><p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</p></div>
  }

  return (
    <div style={{...styles.container as React.CSSProperties, minHeight: 'calc(100vh - 120px)', backgroundColor: 'transparent', padding: '1rem' }}>
      <div style={{ ...styles.formWrapper as React.CSSProperties, maxWidth: '600px' }}>
        <h1 style={styles.header as React.CSSProperties}>Edit My Public Profile</h1>
        <p style={styles.subHeader as React.CSSProperties}>
          This information will be visible to artists on your public venue page.
        </p>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Image 
                src={profile.main_photo_url || 'https://via.placeholder.com/200x150'}
                alt="Venue photo preview"
                width={200}
                height={150}
                style={{ objectFit: 'cover', marginBottom: '1rem', borderRadius: '8px' }}
            />
            <div>
                <label htmlFor="photoUpload" style={{...(styles.button as React.CSSProperties), cursor: 'pointer'}}>
                    {uploading ? 'Uploading...' : 'Upload Main Photo'}
                </label>
                <input 
                    type="file" 
                    id="photoUpload"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                />
            </div>
        </div>
        
        <form onSubmit={handleUpdateProfile}>
          <div style={styles.inputGroup as React.CSSProperties}>
            <label htmlFor="bio" style={styles.label as React.CSSProperties}>Public Bio / Description</label>
            <textarea id="bio" style={styles.textarea as React.CSSProperties} value={profile.bio || ''} onChange={handleChange} rows={6}></textarea>
          </div>
          
          <h2 style={{...styles.header as React.CSSProperties, fontSize: '20px', textAlign: 'left', marginTop: '20px'}}>Links</h2>
          
          <div style={styles.inputGroup as React.CSSProperties}>
            <label htmlFor="website" style={styles.label as React.CSSProperties}>Website</label>
            <input id="website" type="text" style={styles.input as React.CSSProperties} value={profile.social_links?.website || ''} onChange={handleSocialLinkChange} />
          </div>
          <div style={styles.inputGroup as React.CSSProperties}>
            <label htmlFor="facebook" style={styles.label as React.CSSProperties}>Facebook URL</label>
            <input id="facebook" type="text" style={styles.input as React.CSSProperties} value={profile.social_links?.facebook || ''} onChange={handleSocialLinkChange} />
          </div>
          <div style={styles.inputGroup as React.CSSProperties}>
            <label htmlFor="instagram" style={styles.label as React.CSSProperties}>Instagram URL</label>
            <input id="instagram" type="text" style={styles.input as React.CSSProperties} value={profile.social_links?.instagram || ''} onChange={handleSocialLinkChange} />
          </div>
          
          <button type="submit" style={styles.button as React.CSSProperties} disabled={loading || uploading}>
            {loading ? 'Saving...' : 'Save Public Profile'}
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
