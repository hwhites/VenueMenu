'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import * as React from 'react'

interface NavOption {
  name: string
  href: string
}

// FIX: Define the shape of the object returned by the 'get_user_conversations' RPC
interface ConversationSummary {
  conversation_id: number;
  other_user_id: string;
  other_user_name: string;
  last_message_body: string;
  last_message_created_at: string;
  has_unread: boolean;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<'artist' | 'venue' | null>(null)
  const [hasUnread, setHasUnread] = useState(false) // State for notification
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Function to determine which links to show based on user role
  const getMenuLinks = (userRole: string | null): NavOption[] => {
    const coreLinks = [
      { name: 'Home', href: '/' },
      { name: 'Inbox', href: '/messages' },
    ]

    if (userRole === 'artist') {
      const artistLinks = [
        { name: 'Availability', href: '/availability' },
        { name: 'Find Venues', href: '/discover-venues' },
      ]
      return [...coreLinks, ...artistLinks]
    } else if (userRole === 'venue') {
      const venueLinks = [
        { name: 'Date Needs', href: '/needs' },
        { name: 'Find Artists', href: '/discover' },
      ]
      return [...coreLinks, ...venueLinks]
    }
    // Links for logged-out users
    return [
      { name: 'Home', href: '/' },
      { name: 'Log In', href: '/login' },
      { name: 'Sign Up', href: '/signup' },
    ]
  }

  // Links for the user's personal dashboard and settings
  const settingsLinks: NavOption[] = [
    { name: 'Dashboard', href: '/account' }, // Renamed for clarity
    { name: 'My Bookings', href: '/bookings' },
  ]

  // Artist-specific settings link
  const artistSettingsLinks: NavOption[] = [
    { name: 'Edit Public Profile', href: '/edit-profile' },
  ]

  const handleLinkClick = () => {
    setIsMenuOpen(false)
  }

  useEffect(() => {
    const fetchUserAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        setRole(profile?.role || null)

        // Check for unread messages
        const { data: convos } = await supabase.rpc('get_user_conversations', { p_user_id: session.user.id })
        // FIX: Explicitly type the parameter 'c' to resolve the 'any' type error
        if (convos && convos.some((c: ConversationSummary) => c.has_unread)) {
          setHasUnread(true)
        } else {
          setHasUnread(false)
        }
      } else {
        setRole(null)
        setHasUnread(false)
      }
    }

    fetchUserAndRole()

    // Listen for auth changes to re-fetch data
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
        fetchUserAndRole();
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const menuLinks = getMenuLinks(role)

  return (
    <header style={{ backgroundColor: '#111827', padding: '1rem', color: '#f9fafb', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <Link href="/" style={{ color: '#f9fafb', fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none' }}>
          VenueMenu
        </Link>

        <div className="flex">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: '#1f2937', border: '1px solid #4b5563', borderRadius: '4px', color: '#f9fafb', fontSize: '1.5rem', cursor: 'pointer', padding: '0.25rem 0.5rem' }}>
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div style={{ backgroundColor: '#1f2937', position: 'absolute', top: '59px', right: 0, width: '100%', maxWidth: '280px', padding: '1rem 0', zIndex: 40, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' } as React.CSSProperties}>
          {/* Core Navigation Links */}
          {menuLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={handleLinkClick}
              style={{ display: 'block', padding: '0.75rem 1rem', color: '#f9fafb', textDecoration: 'none', borderBottom: '1px solid #374151', position: 'relative' }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1f2937')}
            >
              {link.name}
              {/* Notification Dot for Inbox */}
              {link.name === 'Inbox' && hasUnread && (
                <span style={{ position: 'absolute', top: '1rem', right: '1rem', height: '8px', width: '8px', backgroundColor: '#3b82f6', borderRadius: '50%' }}></span>
              )}
            </Link>
          ))}

          {user && (
            <>
              {/* Account, Bookings, and other settings links */}
              {[...settingsLinks, ...(role === 'artist' ? artistSettingsLinks : [])].map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={handleLinkClick}
                  style={{ display: 'block', padding: '0.75rem 1rem', color: '#f9fafb', textDecoration: 'none', borderBottom: '1px solid #374151' }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1f2937')}
                >
                  {link.name}
                </Link>
              ))}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#f87171', padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '1rem' }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1f2937')}
              >
                Log Out
              </button>
            </>
          )}
        </div>
      )}
    </header>
  )
}

