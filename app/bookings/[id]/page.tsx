'use client'

import { useState, useEffect, useCallback, FormEvent } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import { styles } from '../../../styles/forms'
import { User } from '@supabase/supabase-js'
import * as React from 'react'
import Link from 'next/link'

// --- Type Definitions ---
interface BookingDetails {
    booking_id: number;
    booking_date: string;
    booking_status: 'confirmed' | 'completed' | 'canceled_by_venue' | 'canceled_by_artist';
    agreed_pay: number;
    artist_id: string;
    artist_name: string;
    venue_id: string;
    venue_name: string;
    set_count?: number;
    set_length?: number;
    other_terms?: string;
}

// --- Reusable Confirmation Modal ---
const ConfirmationModal = ({ onConfirm, onCancel, message }: { onConfirm: () => void, onCancel: () => void, message: string }) => (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
        <div style={{...styles.formWrapper as React.CSSProperties, maxWidth: '400px'}}><h1 style={styles.header as React.CSSProperties}>Are you sure?</h1><p style={styles.subHeader as React.CSSProperties}>{message}</p><div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}><button onClick={onConfirm} style={{...(styles.button as React.CSSProperties), flex: 1, backgroundColor: '#dc2626'}}>Confirm</button><button onClick={onCancel} style={{...(styles.button as React.CSSProperties), flex: 1, backgroundColor: '#4b5563'}}>Cancel</button></div></div>
    </div>
);


export default function BookingDetailPage() {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<'artist' | 'venue' | null>(null)
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCancelling, setIsCancelling] = useState(false); // State for cancel confirmation
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string

  const fetchBookingDetails = useCallback(async (currentUser: User) => {
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc('get_booking_details', { 
        p_booking_id: parseInt(bookingId), 
        p_user_id: currentUser.id 
    }).single();
    
    if (rpcError || !data) {
      setError(rpcError?.message || 'Booking not found or you do not have permission to view it.');
    } else {
      setBooking(data as BookingDetails);
    }
    setLoading(false);
  }, [bookingId]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const currentUser = session.user;
      setUser(currentUser);

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single();
      setUserRole(profile?.role || null);
      
      await fetchBookingDetails(currentUser);
    };
    if(bookingId) {
        fetchUser();
    }
  }, [router, fetchBookingDetails, bookingId]);

  const handleMarkComplete = async () => {
    if (!user || !booking) return;
    const { error: completeError } = await supabase.rpc('mark_booking_complete', { p_booking_id: booking.booking_id, p_user_id: user.id });
    if (completeError) setError(completeError.message);
    else await fetchBookingDetails(user);
  }

  const handleReportNoShow = async () => {
      if (!user || !booking) return;
      setIsCancelling(true); // Re-use the confirmation modal
  }
  
  const handleConfirmCancellation = async (isNoShow: boolean) => {
      if (!user || !booking) return;
      
      setLoading(true);
      let rpcError;

      if (isNoShow) {
          ({ error: rpcError } = await supabase.rpc('report_artist_no_show', { p_booking_id: booking.booking_id, p_venue_id: user.id }));
      } else {
          ({ error: rpcError } = await supabase.rpc('cancel_booking', { p_booking_id: booking.booking_id, p_canceller_id: user.id }));
      }

      if (rpcError) setError(rpcError.message);
      else await fetchBookingDetails(user);
      
      setIsCancelling(false);
      setLoading(false);
  }


  if (loading) return <div><p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading Booking Details...</p></div>
  if (error) return <div><p style={{ textAlign: 'center', marginTop: '2rem', color: '#f87171' }}>Error: {error}</p></div>
  if (!booking) return <div><p style={{ textAlign: 'center', marginTop: '2rem' }}>Booking not found.</p></div>

  const isConfirmed = booking.booking_status === 'confirmed';
  const otherParty = userRole === 'artist' ? { role: 'venue', id: booking.venue_id } : { role: 'artist', id: booking.artist_id };

  return (
    <>
        <div style={{...styles.container as React.CSSProperties, minHeight: 'calc(100vh - 120px)', backgroundColor: 'transparent', padding: '1rem', alignItems: 'flex-start' }}>
            <div style={{...styles.formWrapper as React.CSSProperties, maxWidth: '800px'}}>
                <h1 style={styles.header as React.CSSProperties}>Booking Details</h1>
                
                <div style={{ backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '8px' }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #4b5563'}}>
                        <div>
                            <h2 style={{margin: 0, fontSize: '1.5rem'}}>{booking.artist_name} at {booking.venue_name}</h2>
                            <p style={{margin: '0.25rem 0 0 0', color: '#d1d5db', textTransform: 'capitalize'}}>Status: {booking.booking_status.replace(/_/g, ' ')}</p>
                        </div>
                        <p style={{margin: 0, fontSize: '1.2rem', fontWeight: 'bold'}}>{new Date(booking.booking_date).toLocaleDateString(undefined, { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    
                    <div style={{paddingTop: '1rem'}}>
                        <h3 style={{marginTop: 0}}>Agreed Terms</h3>
                        <p><strong>Payment:</strong> ${booking.agreed_pay}</p>
                        {booking.set_count && <p><strong>Sets:</strong> {booking.set_count} x {booking.set_length} min</p>}
                        {booking.other_terms && <p><strong>Other Terms:</strong> {booking.other_terms}</p>}
                    </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <h3 style={{...styles.header as React.CSSProperties, fontSize: '1.2rem'}}>Actions</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <Link href={`/${otherParty.role}/${otherParty.id}`} style={{...styles.button as React.CSSProperties, textDecoration: 'none', textAlign: 'center', backgroundColor: '#4b5563'}}>View {otherParty.role}'s Profile</Link>
                        <Link href={`/messages/${otherParty.id}`} style={{...styles.button as React.CSSProperties, textDecoration: 'none', textAlign: 'center', backgroundColor: '#4b5563'}}>Contact Regarding Booking</Link>
                        
                        {isConfirmed && (
                            <>
                                <button onClick={handleMarkComplete} style={{...styles.button as React.CSSProperties, backgroundColor: '#16a34a'}}>Mark as Complete</button>
                                {/* ADDITION: Cancel Booking Button */}
                                <button onClick={() => setIsCancelling(true)} style={{...styles.button as React.CSSProperties, backgroundColor: '#dc2626'}}>Cancel Booking</button>
                            </>
                        )}
                        
                        {isConfirmed && userRole === 'venue' && (
                            <button onClick={handleReportNoShow} style={{...styles.button as React.CSSProperties, backgroundColor: '#991b1b'}}>Report Artist No-Show</button>
                        )}
                    </div>
                </div>
                {error && <p style={{ ...(styles.message as React.CSSProperties), color: '#f87171', textAlign: 'center', marginTop: '1rem' }}>{error}</p>}
            </div>
        </div>

        {isCancelling && (
            <ConfirmationModal 
                onConfirm={() => handleConfirmCancellation(userRole === 'venue')}
                onCancel={() => setIsCancelling(false)}
                message={userRole === 'venue' ? "This will mark the booking as 'Canceled by Artist'. Are you sure?" : "This action cannot be undone. The other party will be notified."}
            />
        )}
    </>
  )
}

