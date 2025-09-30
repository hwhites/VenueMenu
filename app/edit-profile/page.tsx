'use client'

import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { styles } from '../../styles/forms'
import { User } from '@supabase/supabase-js'
import * as React from 'react'
import Image from 'next/image'

// Type definition for the public profile data
interface PublicProfile {
  user_id: string
  profile_photo_url?: string
  bio?: string
  social_links?: {
    spotify?: string
    instagram?: string
    youtube?: string
    facebook?: string
    website?: string
  }
  gallery_urls?: string[]
  location_tags?: string[]
}

export default function EditPublicProfilePage() {
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
      if (baseProfile?.role !== 'artist') {
        router.push('/account')
        return
      }

      const { data: publicProfile } = await supabase
        .from('artist_public_profiles')
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
      .from('artist_public_profiles')
      .upsert(updateData, { onConflict: 'user_id' })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Success! Your public profile has been updated.')
    }
    setLoading(false)
  }
  
  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) {
      return
    }

    const file = event.target.files[0]
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/${Math.random()}.${fileExt}`

    setUploading(true)
    setMessage('');

    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file)

    if (uploadError) {
      setMessage(`Upload Error: ${uploadError.message}`)
      setUploading(false)
      return
    }

    const { data } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath)

    if (data) {
        const newUrl = data.publicUrl;
        setProfile(p => ({ ...p, profile_photo_url: newUrl }));
        await supabase
            .from('artist_public_profiles')
            .upsert({ user_id: user.id, profile_photo_url: newUrl }, { onConflict: 'user_id' });
        setMessage('Profile picture updated!');
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
          This information will be visible to everyone on your public artist page.
        </p>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Image 
                src={profile.profile_photo_url || 'https://via.placeholder.com/150'}
                alt="Profile picture preview"
                width={150}
                height={150}
                style={{ borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem' }}
            />
            <div>
                <label htmlFor="avatarUpload" style={{...(styles.button as React.CSSProperties), cursor: 'pointer'}}>
                    {uploading ? 'Uploading...' : 'Upload New Photo'}
                </label>
                <input 
                    type="file" 
                    id="avatarUpload"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                />
            </div>
        </div>
        
        <form onSubmit={handleUpdateProfile}>
          <div style={styles.inputGroup as React.CSSProperties}>
            <label htmlFor="bio" style={styles.label as React.CSSProperties}>Public Bio</label>
            <textarea id="bio" style={styles.textarea as React.CSSProperties} value={profile.bio || ''} onChange={handleChange} rows={6}></textarea>
          </div>
          
          <h2 style={{...styles.header as React.CSSProperties, fontSize: '20px', textAlign: 'left', marginTop: '20px'}}>Social Links</h2>
          
          <div style={styles.inputGroup as React.CSSProperties}>
            <label htmlFor="website" style={styles.label as React.CSSProperties}>Website</label>
            <input id="website" type="text" style={styles.input as React.CSSProperties} value={profile.social_links?.website || ''} onChange={handleSocialLinkChange} />
          </div>
          <div style={styles.inputGroup as React.CSSProperties}>
            <label htmlFor="spotify" style={styles.label as React.CSSProperties}>Spotify URL</label>
            <input id="spotify" type="text" style={styles.input as React.CSSProperties} value={profile.social_links?.spotify || ''} onChange={handleSocialLinkChange} />
          </div>
          <div style={styles.inputGroup as React.CSSProperties}>
            <label htmlFor="instagram" style={styles.label as React.CSSProperties}>Instagram URL</label>
            <input id="instagram" type="text" style={styles.input as React.CSSProperties} value={profile.social_links?.instagram || ''} onChange={handleSocialLinkChange} />
          </div>
           <div style={styles.inputGroup as React.CSSProperties}>
            <label htmlFor="youtube" style={styles.label as React.CSSProperties}>YouTube URL</label>
            <input id="youtube" type="text" style={styles.input as React.CSSProperties} value={profile.social_links?.youtube || ''} onChange={handleSocialLinkChange} />
          </div>
          
          <button type="submit" style={styles.button as React.CSSProperties} disabled={loading || uploading}>
            {loading ? 'Saving...' : 'Save Profile Text'}
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

