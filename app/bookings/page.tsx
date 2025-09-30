'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { styles } from '../../styles/forms'
import { User } from '@supabase/supabase-js'
import * as React from 'react'

// --- Type Definitions ---
interface Booking {
  booking_id: number
  booking_date: string
  booking_status: 'confirmed' | 'completed' | 'canceled_by_venue' | 'canceled_by_artist'
  artist_name: string
  venue_name: string
  agreed_pay: number
}

export default function BookingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchUserAndBookings = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)

      const { data, error } = await supabase.rpc('get_user_bookings', { p_user_id: session.user.id })
      
      if (error) {
        setError(error.message)
      } else {
        setBookings(data as Booking[])
      }
      setLoading(false)
    }

    fetchUserAndBookings()
  }, [router])

  const upcomingBookings = bookings.filter(b => b.booking_status === 'confirmed');
  const pastBookings = bookings.filter(b => b.booking_status !== 'confirmed');

  if (loading) {
    return <div><p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading Bookings...</p></div>
  }

  if (error) {
    return <div><p style={{ textAlign: 'center', marginTop: '2rem', color: '#f87171' }}>Error: {error}</p></div>
  }

  return (
    <div style={{...styles.container as React.CSSProperties, minHeight: 'calc(100vh - 120px)', backgroundColor: 'transparent', padding: '1rem', alignItems: 'flex-start' }}>
        <div style={{...styles.formWrapper as React.CSSProperties, maxWidth: '800px'}}>
            <h1 style={styles.header as React.CSSProperties}>My Bookings</h1>
            <p style={styles.subHeader as React.CSSProperties}>Here is a list of your confirmed and past gigs.</p>

            {/* Upcoming Bookings Section */}
            <div style={{ marginBottom: '3rem' }}>
                <h2 style={{...styles.header as React.CSSProperties, fontSize: '1.5rem', borderBottom: '1px solid #374151', paddingBottom: '0.5rem' }}>Upcoming</h2>
                {upcomingBookings.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0' }}>
                        {upcomingBookings.map(b => (
                            <li key={b.booking_id} style={{ backgroundColor: '#1f2937', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{b.artist_name} at {b.venue_name}</p>
                                        <p style={{ margin: '0.25rem 0 0 0', color: '#9ca3af' }}>Pay: ${b.agreed_pay}</p>
                                    </div>
                                    <p style={{ margin: 0, color: '#d1d5db' }}>
                                        {new Date(b.booking_date).toLocaleDateString(undefined, { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '2rem' }}>You have no upcoming bookings.</p>
                )}
            </div>

            {/* Past Bookings Section */}
            <div>
                <h2 style={{...styles.header as React.CSSProperties, fontSize: '1.5rem', borderBottom: '1px solid #374151', paddingBottom: '0.5rem' }}>History</h2>
                {pastBookings.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0' }}>
                        {pastBookings.map(b => (
                            <li key={b.booking_id} style={{ backgroundColor: '#1f2937', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', opacity: 0.7 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 'bold' }}>{b.artist_name} at {b.venue_name}</p>
                                        <p style={{ margin: '0.25rem 0 0 0', color: '#9ca3af', textTransform: 'capitalize' }}>Status: {b.booking_status.replace(/_/g, ' ')}</p>
                                    </div>
                                    <p style={{ margin: 0, color: '#9ca3af' }}>
                                        {new Date(b.booking_date).toLocaleDateString(undefined, { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '2rem' }}>You have no past bookings.</p>
                )}
            </div>
        </div>
    </div>
  )
}
