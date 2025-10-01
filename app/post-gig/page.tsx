'use client'

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { styles } from '../../styles/forms';
import { User } from '@supabase/supabase-js';
import * as React from 'react';
import { CalendarModal } from '../../components/CalendarModal'; // Import the calendar component

interface GigDetails {
    date: string;
    pay_amount: string;
    genres: string;
    city: string;
    notes: string;
}

export default function PostGigPage() {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<'artist' | 'venue' | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [gigDetails, setGigDetails] = useState<GigDetails>({
        date: '',
        pay_amount: '',
        genres: '',
        city: '',
        notes: ''
    });
    const router = useRouter();

    // State for the calendar
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [artistAvailability, setArtistAvailability] = useState<string[]>([]);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }
            setUser(session.user);
            
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
            const userRole = profile?.role || null;
            setRole(userRole);

            // If user is an artist, fetch their open dates for the calendar
            if (userRole === 'artist') {
                const { data: availabilityData } = await supabase.rpc('get_artist_availability', { p_artist_id: session.user.id });
                if (availabilityData) {
                    setArtistAvailability(availabilityData.map((d: { available_date: string }) => d.available_date.split('T')[0]));
                }
            }
            
            setLoading(false);
        };
        fetchUser();
    }, [router]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setGigDetails(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !role) return;

        setIsSubmitting(true);
        setMessage('');

        const { error } = await supabase.from('instant_gigs').insert({
            created_by: user.id,
            creator_role: role,
            date: gigDetails.date,
            pay_amount: parseInt(gigDetails.pay_amount, 10),
            genres: gigDetails.genres.split(',').map(g => g.trim()).filter(Boolean),
            city: gigDetails.city,
            notes: gigDetails.notes,
        });

        if (error) {
            setMessage(`Error: ${error.message}`);
        } else {
            setMessage('Success! Your Instant Gig has been posted to the home page.');
            setGigDetails({ date: '', pay_amount: '', genres: '', city: '', notes: '' });
            setTimeout(() => router.push('/'), 2000);
        }
        setIsSubmitting(false);
    };

    if (loading) {
        return <div><p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</p></div>;
    }

    return (
        <>
            <div style={{...styles.container as React.CSSProperties, minHeight: 'calc(100vh - 120px)', backgroundColor: 'transparent', padding: '1rem' }}>
                <div style={{ ...styles.formWrapper as React.CSSProperties, maxWidth: '600px' }}>
                    <h1 style={styles.header as React.CSSProperties}>Post an Instant Gig</h1>
                    <p style={styles.subHeader as React.CSSProperties}>
                        {role === 'artist' 
                            ? 'Post an open date you want to fill. Venues can book you instantly.' 
                            : 'Post an open gig you need filled. Artists can accept your offer instantly.'
                        }
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div style={styles.inputGroup as React.CSSProperties}>
                            <label htmlFor="date" style={styles.label as React.CSSProperties}>Date</label>
                            <input id="date" type="text" style={styles.input as React.CSSProperties} value={gigDetails.date} readOnly placeholder="Select a date..." required />
                            <button type="button" onClick={() => setIsCalendarOpen(true)} style={{...styles.button as React.CSSProperties, width: '100%', marginTop: '0.5rem', backgroundColor: '#4b5563'}}>
                                {role === 'artist' ? 'Select From Your Available Dates' : 'Select a Date'}
                            </button>
                        </div>
                        <div style={styles.inputGroup as React.CSSProperties}>
                            <label htmlFor="pay_amount" style={styles.label as React.CSSProperties}>Pay ($)</label>
                            <input id="pay_amount" type="number" style={styles.input as React.CSSProperties} value={gigDetails.pay_amount} onChange={handleChange} required />
                        </div>
                        <div style={styles.inputGroup as React.CSSProperties}>
                            <label htmlFor="city" style={styles.label as React.CSSProperties}>City</label>
                            <input id="city" type="text" style={styles.input as React.CSSProperties} value={gigDetails.city} onChange={handleChange} required />
                        </div>
                        <div style={styles.inputGroup as React.CSSProperties}>
                            <label htmlFor="genres" style={styles.label as React.CSSProperties}>Genres (comma-separated)</label>
                            <input id="genres" type="text" style={styles.input as React.CSSProperties} value={gigDetails.genres} onChange={handleChange} />
                        </div>
                        <div style={styles.inputGroup as React.CSSProperties}>
                            <label htmlFor="notes" style={styles.label as React.CSSProperties}>Notes (Optional)</label>
                            <textarea id="notes" style={styles.textarea as React.CSSProperties} value={gigDetails.notes} onChange={handleChange} rows={3}></textarea>
                        </div>

                        <button type="submit" style={styles.button as React.CSSProperties} disabled={isSubmitting}>
                            {isSubmitting ? 'Posting...' : 'Post Instant Gig'}
                        </button>
                    </form>
                    {message && <p style={{ ...(styles.message as React.CSSProperties), color: message.startsWith('Error') ? '#f87171' : '#34d399' }}>{message}</p>}
                </div>
            </div>

            {isCalendarOpen && (
                <CalendarModal 
                    availableDates={role === 'artist' ? artistAvailability : []}
                    onClose={() => setIsCalendarOpen(false)}
                    selectable={true}
                    onDateSelect={(date) => {
                        setGigDetails(prev => ({...prev, date}));
                        setIsCalendarOpen(false);
                    }}
                />
            )}
        </>
    );
}

