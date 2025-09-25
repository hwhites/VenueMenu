'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js'; 
import Link from 'next/link';
import * as React from 'react';

// FIX: Define a type for the settings options array (for theme/account menu)
interface SettingsOption {
    name: string;
    href: string;
}

export default function Header() {
  // FIX: Explicitly type the user state
  const [user, setUser] = useState<User | null>(null); 
  const [role, setRole] = useState<'artist' | 'venue' | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Define Navigation Links based on role
  const getNavLinks = (userRole: string | null): SettingsOption[] => {
    if (userRole === 'artist') {
      return [
        { name: 'Home', href: '/' },
        { name: 'My Availability', href: '/availability' },
        { name: 'Find Venues', href: '/discover-venues' },
        { name: 'Inbox', href: '/messages' },
      ];
    } else if (userRole === 'venue') {
      return [
        { name: 'Home', href: '/' },
        { name: 'My Needs', href: '/needs' },
        { name: 'Find Artists', href: '/discover' },
        { name: 'Inbox', href: '/messages' },
      ];
    }
    return [
        { name: 'Home', href: '/' },
        { name: 'Log In', href: '/login' },
        { name: 'Sign Up', href: '/signup' },
    ];
  };

  // Define Settings Menu Links (always available when logged in)
  const settingsLinks: SettingsOption[] = [
    { name: 'Settings', href: '/settings' },
    { name: 'Account', href: '/account' },
  ];

  // Logic to close the main mobile menu when a link is clicked
  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  // Logic for Authentication/Role fetching
  useEffect(() => {
    const fetchUserAndRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      setUser(session?.user ?? null); 

      if (session?.user) {
        // Fetch role from profiles table (assuming the user is already authenticated)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        setRole(profile?.role || null); 
      } else {
        setRole(null);
      }
    };
    
    fetchUserAndRole();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setIsMenuOpen(false);
    setIsSettingsOpen(false);
    // Force a page refresh to clear client-side state and redirect
    window.location.href = '/'; 
  };


  // --- JSX Structure ---

  // NOTE: Style casting (as any) is used aggressively for stability with external style objects.
  const navLinks = getNavLinks(role);

  return (
    // FIX APPLIED: Component now explicitly returns JSX
    <header style={{ backgroundColor: '#111827', padding: '1rem', color: '#f9fafb' }}>
      <div 
        style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            maxWidth: '1200px', 
            margin: '0 auto' 
        }}
      >
        {/* Logo/Home Link */}
        <Link href="/" style={{ color: '#f9fafb', fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none' }}>
          VenueMenu
        </Link>

        {/* Desktop Navigation (Visible on MD and up) */}
        <nav className="hidden md:flex">
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                style={{ color: '#f9fafb', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#9ca3af')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#f9fafb')}
              >
                {link.name}
              </Link>
            ))}

            {user && (
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        style={{ 
                            background: 'none', 
                            border: '1px solid #4b5563',
                            borderRadius: '4px',
                            color: '#f9fafb', 
                            padding: '0.5rem 1rem',
                            cursor: 'pointer' 
                        }}
                    >
                        Settings ⚙️
                    </button>
                    {isSettingsOpen && (
                        <div 
                            style={{ 
                                position: 'absolute', 
                                top: '100%', 
                                right: 0, 
                                backgroundColor: '#1f2937', 
                                border: '1px solid #4b5563',
                                borderRadius: '4px',
                                marginTop: '8px',
                                minWidth: '150px',
                                zIndex: 50 
                            }}
                            onMouseLeave={() => setIsSettingsOpen(false)}
                        >
                            {settingsLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsSettingsOpen(false)}
                                    style={{ 
                                        display: 'block', 
                                        padding: '0.75rem 1rem', 
                                        color: '#f9fafb', 
                                        textDecoration: 'none',
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
                                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1f2937')}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <button
                                onClick={handleLogout}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    background: 'none',
                                    border: 'none',
                                    borderTop: '1px solid #4b5563',
                                    color: '#f87171',
                                    padding: '0.75rem 1rem',
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
                                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1f2937')}
                            >
                                Log Out
                            </button>
                        </div>
                    )}
                </div>
            )}
          </div>
        </nav>

        {/* Mobile Hamburger Button (Visible on MD and down) */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{ background: 'none', border: 'none', color: '#f9fafb', fontSize: '24px', cursor: 'pointer' }}
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown (Toggle visibility based on isMenuOpen state) */}
      {isMenuOpen && (
        <div 
            className="md:hidden"
            style={{ 
                backgroundColor: '#1f2937', 
                position: 'absolute', 
                top: '64px', // Adjust based on your header height
                left: 0, 
                width: '100%', 
                padding: '1rem', 
                zIndex: 40 
            }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={handleLinkClick} // Close menu after clicking
              style={{ 
                display: 'block', 
                padding: '0.75rem 1rem', 
                color: '#f9fafb', 
                textDecoration: 'none',
                borderBottom: '1px solid #374151'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1f2937')}
            >
              {link.name}
            </Link>
          ))}
          {user && (
            <>
                {settingsLinks.map((link) => (
                    <Link
                        key={link.name}
                        href={link.href}
                        onClick={handleLinkClick} 
                        style={{ 
                            display: 'block', 
                            padding: '0.75rem 1rem', 
                            color: '#f9fafb', 
                            textDecoration: 'none',
                            borderBottom: '1px solid #374151'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1f2937')}
                    >
                        {link.name}
                    </Link>
                ))}
                <button
                    onClick={handleLogout}
                    style={{
                        width: '100%',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        color: '#f87171',
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
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
  );
}