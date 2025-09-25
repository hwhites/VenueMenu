'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js'; 
import Link from 'next/link';
import * as React from 'react';

interface NavOption {
    name: string;
    href: string;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null); 
  const [role, setRole] = useState<'artist' | 'venue' | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const getMenuLinks = (userRole: string | null): NavOption[] => {
    const coreLinks = [
        { name: 'Home', href: '/' },
        { name: 'Inbox', href: '/messages' },
    ];

    if (userRole === 'artist') {
      const artistLinks = [
        { name: 'Availability', href: '/availability' },
        { name: 'Find Venues', href: '/discover-venues' },
      ];
      return [...coreLinks, ...artistLinks];
    } else if (userRole === 'venue') {
      const venueLinks = [
        { name: 'Date Needs', href: '/needs' },
        { name: 'Find Artists', href: '/discover' },
      ];
      return [...coreLinks, ...venueLinks];
    }
    return [
        { name: 'Home', href: '/' },
        { name: 'Log In', href: '/login' },
        { name: 'Sign Up', href: '/signup' },
    ];
  };

  const settingsLinks: NavOption[] = [
    { name: 'My Profile', href: '/account' }, 
  ];

  const handleLinkClick = () => {
    setIsMenuOpen(false);
    setIsSettingsOpen(false);
  };
  
  useEffect(() => {
    const fetchUserAndRole = async () => {
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
        
        setRole(profile?.role || null); 
      } else {
        setRole(null);
      }
    };
    
    fetchUserAndRole();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; 
  };


  const menuLinks = getMenuLinks(role);

  return (
    <header style={{ 
        backgroundColor: '#111827', 
        padding: '1rem', 
        color: '#f9fafb',
        position: 'sticky', 
        top: 0, 
        zIndex: 100 
    }}>
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

        {/* Hamburger Button (ALWAYS visible) */}
        <div className="flex">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{ 
                background: '#1f2937', 
                border: '1px solid #4b5563', 
                borderRadius: '4px',
                color: '#f9fafb', 
                fontSize: '1.5rem', 
                cursor: 'pointer',
                padding: '0.25rem 0.5rem'
            }}
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown (Now serves as the only navigation) */}
      {isMenuOpen && (
        <div 
            style={{ 
                backgroundColor: '#1f2937', 
                position: 'absolute', 
                top: '59px', 
                // FIX APPLIED: Anchor to the RIGHT and limit the width
                right: 0, 
                width: '100%', 
                maxWidth: '280px', // Limit width for better alignment on large screens
                padding: '1rem 0', 
                zIndex: 40,
                // FIX: Add box shadow to make it pop against content
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            } as React.CSSProperties}
        >
            {/* Core Navigation Links */}
          {menuLinks.map((link) => (
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
          
          {user && (
            <>
                {/* Account/Profile Link */}
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
                
                {/* Logout Button */}
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