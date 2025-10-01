'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { User, Session } from '@supabase/supabase-js'
import Link from 'next/link'
import * as React from 'react'
import { styles } from '../styles/layout'
// FIX: Import the BellIcon as a component from the heroicons library
import { BellIcon } from '@heroicons/react/24/outline'

// --- Type Definitions ---
interface NavOption {
  name: string
  href: string
}

interface Notification {
    id: number;
    type: 'new_message' | 'offer_received' | 'gig_booked';
    payload: {
        conversation_id?: number;
        offer_id?: number;
        booking_id?: number;
        sender_id?: string;
        booker_id?: string;
    };
    created_at: string;
    actor_name: string;
    actor_id: string;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<'artist' | 'venue' | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const handleAuthStateChange = async (session: Session | null) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (intervalId) clearInterval(intervalId);

        if (currentUser) {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single();
            setRole(profile?.role || null);

            const fetchNotifications = async () => {
                const { data, error } = await supabase.rpc('get_unread_notifications', { p_user_id: currentUser.id });
                if (error) console.error("Error fetching notifications:", error);
                else setNotifications(data || []);
            };
            
            await fetchNotifications();
            intervalId = setInterval(fetchNotifications, 15000);
        } else {
            setRole(null);
            setNotifications([]);
        }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
        handleAuthStateChange(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        handleAuthStateChange(session);
    });

    return () => {
        authListener.subscription.unsubscribe();
        if (intervalId) clearInterval(intervalId);
    };
  }, []);
  
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
              setIsNotificationsOpen(false);
              setIsMenuOpen(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handleBellClick = async () => {
    if (!user) return;
    setIsMenuOpen(false);
    const newOpenState = !isNotificationsOpen;
    setIsNotificationsOpen(newOpenState);

    if (newOpenState && notifications.length > 0) {
      await supabase.rpc('mark_notifications_as_read', { p_user_id: user.id });
      setTimeout(() => setNotifications([]), 3000);
    }
  };
  
  const handleHamburgerClick = () => {
      setIsNotificationsOpen(false);
      setIsMenuOpen(!isMenuOpen);
  }

  const generateNotificationTextAndLink = (n: Notification): { text: string, href: string } => {
      const otherUserId = n.payload.sender_id || n.payload.booker_id || n.actor_id;
      switch (n.type) {
          case 'new_message':
              return { text: `${n.actor_name} sent you a message.`, href: `/messages/${otherUserId}`};
          case 'offer_received':
              return { text: `${n.actor_name} sent you an offer.`, href: `/messages/${otherUserId}`};
          case 'gig_booked':
              return { text: `${n.actor_name} booked your Instant Gig!`, href: '/bookings' };
          default:
              return { text: 'You have a new notification.', href: '/' };
      }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }
  
  const menuLinks = role === 'artist'
    ? [ { name: 'Find Venues', href: '/discover-venues' }, { name: 'My Availability', href: '/availability' } ]
    : role === 'venue'
    ? [ { name: 'Find Artists', href: '/discover' }, { name: 'My Date Needs', href: '/needs' } ]
    : [];
    
  const coreLinks = [
      { name: 'Dashboard', href: '/account' },
      { name: 'My Bookings', href: '/bookings' },
      { name: 'Inbox', href: '/messages' },
      { name: 'Post an Instant Gig', href: '/post-gig' },
  ];
  
  if (role === 'artist') coreLinks.push({ name: 'Edit Public Profile', href: '/edit-profile' });


  return (
    <header ref={headerRef} style={styles.header as React.CSSProperties}>
      <div style={styles.headerContainer as React.CSSProperties}>
        <Link href="/" style={styles.logo as React.CSSProperties}>VenueMenu</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user && (
                <div ref={notificationRef} style={{ position: 'relative' }}>
                    <button onClick={handleBellClick} style={styles.notificationButton as React.CSSProperties}>
                        {/* FIX: Use the imported BellIcon component here */}
                        <BellIcon style={styles.icon as React.CSSProperties} />
                        {notifications.length > 0 && (
                            <span style={styles.notificationCount as React.CSSProperties}>{notifications.length}</span>
                        )}
                    </button>
                    {isNotificationsOpen && (
                        <div style={styles.notificationDropdown as React.CSSProperties}>
                            {notifications.length > 0 ? notifications.map(n => {
                                const { text, href } = generateNotificationTextAndLink(n);
                                return (
                                    <Link key={n.id} href={href} onClick={() => setIsNotificationsOpen(false)} style={styles.notificationItem as React.CSSProperties}>
                                        <p style={{ margin: 0, fontWeight: 'bold' }}>{text}</p>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', opacity: 0.7 }}>
                                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </Link>
                                );
                            }) : <div style={styles.notificationItem as React.CSSProperties}>No new notifications</div>}
                        </div>
                    )}
                </div>
            )}
            <button onClick={handleHamburgerClick} style={styles.hamburgerButton as React.CSSProperties}>
                {isMenuOpen ? '✕' : '☰'}
            </button>
        </div>
      </div>

      {isMenuOpen && (
        <div style={styles.mobileMenu as React.CSSProperties}>
            {user ? (
                <>
                    {[...coreLinks, ...menuLinks].map(link => (
                        <Link key={link.name} href={link.href} onClick={() => setIsMenuOpen(false)} style={styles.mobileMenuItem as React.CSSProperties}>{link.name}</Link>
                    ))}
                    <button onClick={handleLogout} style={{...styles.mobileMenuItem as React.CSSProperties, background: 'none', border: 'none', color: '#f87171', textAlign: 'left', width: '100%', cursor: 'pointer', fontSize: 'inherit' }}>
                        Log Out
                    </button>
                </>
            ) : (
                <>
                    <Link href="/login" onClick={() => setIsMenuOpen(false)} style={styles.mobileMenuItem as React.CSSProperties}>Log In</Link>
                    <Link href="/signup" onClick={() => setIsMenuOpen(false)} style={styles.mobileMenuItem as React.CSSProperties}>Sign Up</Link>
                </>
            )}
        </div>
      )}
    </header>
  )
}

