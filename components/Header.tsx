// components/Header.tsx

'use client'; // This component must be a client component to use useState/useEffect

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; 
// FIX: Import User type
import { User } from '@supabase/supabase-js'; 
// FIX: Ensure all necessary types for hooks are imported if missing (e.g., ChangeEvent)
import Link from 'next/link';

// ... other imports

export default function Header() {
  // FIX APPLIED: Explicitly type the user state
  const [user, setUser] = useState<User | null>(null); 
  const [role, setRole] = useState<'artist' | 'venue' | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // ... rest of state

  useEffect(() => {
    const fetchUserAndRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      // FIX APPLIED: The error is fixed by the correct useState typing above.
      // The logic below now safely assigns User | null.
      setUser(session?.user ?? null); 

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        // FIX APPLIED: Safely set the role
        setRole(profile?.role || null); 
      } else {
        setRole(null);
      }
    };
    
    fetchUserAndRole();
  }, []);

  // ... rest of Header component logic and JSX
}