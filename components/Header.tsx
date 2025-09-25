'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { styles } from '../styles/layout';

export default function Header() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setRole(profile.role);
        }

        // Fetch conversations to check for unread messages
        const { data: convos } = await supabase.rpc('get_user_conversations', {
          p_user_id: session.user.id,
        });
        if (convos && convos.some((c) => c.has_unread)) {
          setHasUnread(true);
        } else {
          setHasUnread(false);
        }
      } else {
        setRole(null);
        setHasUnread(false);
      }
    };

    fetchSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        fetchSessionAndProfile();
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    router.push('/login');
  };

  return (
    <>
      <header style={styles.header}>
        <div style={styles.headerContainer}>
          <Link href="/" style={styles.logo}>
            VenueMenu
          </Link>
          <nav style={styles.navDesktop}>
            {user ? (
              <>
                {role === 'artist' && (
                  <Link href="/discover-venues" style={styles.navLink}>
                    Find Venues
                  </Link>
                )}
                {role === 'venue' && (
                  <Link href="/discover" style={styles.navLink}>
                    Find Artists
                  </Link>
                )}
                <Link href="/account" style={styles.navLink}>
                  My Dashboard
                </Link>
                <Link
                  href="/messages"
                  style={{ ...styles.navLink, position: 'relative' }}
                >
                  Messages
                  {hasUnread && <span style={styles.notificationDot}></span>}
                </Link>
                <button
                  onClick={handleSignOut}
                  style={{
                    ...styles.navLink,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#f87171',
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" style={styles.navLink}>
                  Login
                </Link>
                <Link href="/signup" style={styles.navLinkPrimary}>
                  Sign Up
                </Link>
              </>
            )}
          </nav>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={styles.hamburger}
          >
            <div style={styles.hamburgerLine}></div>
            <div style={styles.hamburgerLine}></div>
            <div style={styles.hamburgerLine}></div>
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div style={styles.mobileMenu}>
          <button
            onClick={() => setIsMenuOpen(false)}
            style={styles.closeButton}
          >
            &times;
          </button>
          <nav style={styles.navMobile}>
            {user ? (
              <>
                <Link
                  href="/account"
                  style={styles.navLinkMobile}
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Dashboard
                </Link>
                <Link
                  href="/messages"
                  style={{ ...styles.navLinkMobile, position: 'relative' }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Messages
                  {hasUnread && <span style={styles.notificationDot}></span>}
                </Link>
                {role === 'artist' && (
                  <>
                    <Link
                      href="/discover-venues"
                      style={styles.navLinkMobile}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Find Venues
                    </Link>
                    <Link
                      href="/availability"
                      style={styles.navLinkMobile}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Availability
                    </Link>
                  </>
                )}
                {role === 'venue' && (
                  <>
                    <Link
                      href="/discover"
                      style={styles.navLinkMobile}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Find Artists
                    </Link>
                    <Link
                      href="/needs"
                      style={styles.navLinkMobile}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Date Needs
                    </Link>
                  </>
                )}
                <a
                  onClick={handleSignOut}
                  style={{
                    ...styles.navLinkMobile,
                    color: '#f87171',
                    cursor: 'pointer',
                  }}
                >
                  Sign Out
                </a>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  style={styles.navLinkMobile}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  style={styles.navLinkMobile}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
