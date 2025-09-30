'use client'

import { useState, useEffect, FormEvent } from 'react'
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
  artist_user_id: string
  venue_user_id: string
  has_review: boolean
}

// --- Reusable Modal Components ---

const ReviewModal = ({ booking, user, onClose, onReviewSubmit }: {
    booking: Booking,
    user: User,
    onClose: () => void,
    onReviewSubmit: () => void
}) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a rating.');
            return;
        }
        setIsSubmitting(true);
        setError('');

        const reviewerId = user.id;
        const revieweeId = booking.artist_user_id === user.id ? booking.venue_user_id : booking.artist_user_id;

        const { error: insertError } = await supabase.from('reviews').insert({
            booking_id: booking.booking_id,
            reviewer_id: reviewerId,
            reviewee_id: revieweeId,
            rating,
            comment,
        });

        if (insertError) {
            setError(insertError.message);
        } else {
            onReviewSubmit();
            onClose();
        }
        setIsSubmitting(false);
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{...styles.formWrapper as React.CSSProperties, maxWidth: '500px'}}>
                <h1 style={styles.header as React.CSSProperties}>Leave a Review</h1>
                <p style={styles.subHeader as React.CSSProperties}>Reviewing your experience for the gig on {new Date(booking.booking_date).toLocaleDateString()}.</p>
                <form onSubmit={handleSubmit}>
                    <div style={{...styles.inputGroup as React.CSSProperties, textAlign: 'center', marginBottom: '1rem'}}>
                        <label style={styles.label as React.CSSProperties}>Rating</label>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', fontSize: '2rem' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <span key={star} onClick={() => setRating(star)} style={{ cursor: 'pointer', color: star <= rating ? '#f59e0b' : '#9ca3af' }}>★</span>
                            ))}
                        </div>
                    </div>
                    <div style={styles.inputGroup as React.CSSProperties}>
                        <label htmlFor="comment" style={styles.label as React.CSSProperties}>Comment (Optional)</label>
                        <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} style={styles.textarea as React.CSSProperties} rows={4}></textarea>
                    </div>
                    {error && <p style={{...styles.message as React.CSSProperties, color: '#f87171'}}>{error}</p>}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="submit" style={{...(styles.button as React.CSSProperties), flex: 1}} disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Review'}</button>
                        <button type="button" onClick={onClose} style={{...(styles.button as React.CSSProperties), flex: 1, backgroundColor: '#4b5563'}}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ConfirmationModal = ({ onConfirm, onCancel, message }: {
    onConfirm: () => void,
    onCancel: () => void,
    message: string
}) => (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
        <div style={{...styles.formWrapper as React.CSSProperties, maxWidth: '400px'}}>
            <h1 style={styles.header as React.CSSProperties}>Are you sure?</h1>
            <p style={styles.subHeader as React.CSSProperties}>{message}</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button onClick={onConfirm} style={{...(styles.button as React.CSSProperties), flex: 1, backgroundColor: '#dc2626'}}>Confirm</button>
                <button onClick={onCancel} style={{...(styles.button as React.CSSProperties), flex: 1, backgroundColor: '#4b5563'}}>Cancel</button>
            </div>
        </div>
    </div>
);


export default function BookingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const router = useRouter()

  const fetchUserAndBookings = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    setUser(session.user)

    const { data, error: rpcError } = await supabase.rpc('get_user_bookings', { p_user_id: session.user.id })
    
    if (rpcError) {
      setError(rpcError.message)
    } else {
      setBookings(data as Booking[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUserAndBookings()
  }, [router])

  const handleConfirmCancel = async () => {
    if (!user || !cancellingBooking) return;
    
    setLoading(true);
    const { error: cancelError } = await supabase.rpc('cancel_booking', {
        p_booking_id: cancellingBooking.booking_id,
        p_canceller_id: user.id
    });

    if (cancelError) {
        setError(cancelError.message);
    } else {
        fetchUserAndBookings();
    }
    setCancellingBooking(null);
    setLoading(false);
  }
  
  // --- Simplified Filtering Logic ---
  const upcomingBookings = bookings
    .filter(b => b.booking_status === 'confirmed')
    .sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());

  const pastBookings = bookings.filter(b => b.booking_status !== 'confirmed');


  if (loading && bookings.length === 0) {
    return <div><p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading Bookings...</p></div>
  }

  if (error) {
    return <div><p style={{ textAlign: 'center', marginTop: '2rem', color: '#f87171' }}>Error: {error}</p></div>
  }

  return (
    <>
      <div style={{...styles.container as React.CSSProperties, minHeight: 'calc(100vh - 120px)', backgroundColor: 'transparent', padding: '1rem', alignItems: 'flex-start' }}>
          <div style={{...styles.formWrapper as React.CSSProperties, maxWidth: '800px'}}>
              <h1 style={styles.header as React.CSSProperties}>My Bookings</h1>
              <p style={styles.subHeader as React.CSSProperties}>Here is a list of your confirmed and past gigs.</p>

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
                                      <p style={{ margin: 0, color: '#d1d5db' }}>{new Date(b.booking_date).toLocaleDateString(undefined, { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                  </div>
                                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #374151', textAlign: 'right' }}>
                                      <button onClick={() => setCancellingBooking(b)} style={{...styles.button as React.CSSProperties, width: 'auto', backgroundColor: '#dc2626', padding: '0.5rem 1rem'}} disabled={loading}>Cancel Booking</button>
                                  </div>
                              </li>
                          ))}
                      </ul>
                  ) : <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '2rem' }}>You have no upcoming bookings.</p>}
              </div>

              <div>
                  <h2 style={{...styles.header as React.CSSProperties, fontSize: '1.5rem', borderBottom: '1px solid #374151', paddingBottom: '0.5rem' }}>History</h2>
                  {pastBookings.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0' }}>
                          {pastBookings.map(b => (
                              <li key={b.booking_id} style={{ backgroundColor: '#1f2937', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', opacity: 0.8 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div>
                                          <p style={{ margin: 0, fontWeight: 'bold' }}>{b.artist_name} at {b.venue_name}</p>
                                          <p style={{ margin: '0.25rem 0 0 0', color: '#9ca3af', textTransform: 'capitalize' }}>Status: {b.booking_status.replace(/_/g, ' ')}</p>
                                      </div>
                                      <p style={{ margin: 0, color: '#9ca3af' }}>{new Date(b.booking_date).toLocaleDateString(undefined, { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                  </div>
                                  {b.booking_status === 'completed' && !b.has_review && (
                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #374151', textAlign: 'right' }}>
                                        <button onClick={() => setReviewingBooking(b)} style={{...styles.button as React.CSSProperties, width: 'auto', padding: '0.5rem 1rem'}}>Leave Review</button>
                                    </div>
                                  )}
                              </li>
                          ))}
                      </ul>
                  ) : <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '2rem' }}>You have no past bookings.</p>}
              </div>
          </div>
      </div>
      {reviewingBooking && user && (
        <ReviewModal 
            booking={reviewingBooking} 
            user={user}
            onClose={() => setReviewingBooking(null)}
            onReviewSubmit={fetchUserAndBookings}
        />
      )}
      {cancellingBooking && (
        <ConfirmationModal 
            onConfirm={handleConfirmCancel}
            onCancel={() => setCancellingBooking(null)}
            message="This action cannot be undone. The other party will be notified."
        />
      )}
    </>
  )
}

