'use client';

// FIX: Importing all necessary types
import { useState, FormEvent, ChangeEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { styles } from '../../styles/forms';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';

export default function SignupPage() {
  // FIX: Explicitly type state variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'artist' | 'venue'>('artist'); // Enforce role types
  const [message, setMessage] = useState('');
  const router = useRouter();

  // FIX: Explicitly type 'e' as FormEvent
  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');

    // FIX: Supabase requires a password column on the 'users' table
    // The data object passes the role to the auth.users table, which is then
    // automatically copied by a trigger to the 'profiles' table on new user creation.
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          role: role,
        },
      },
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else if (data.user) {
      setMessage('Success! Redirecting you to log in...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  // FIX: Explicitly type all change handlers
  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleRoleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as 'artist' | 'venue'); // Cast value to type
  };

  // FIX: Apply casting to all external style objects to bypass build errors
  return (
    <div style={styles.container as any}>
      <div style={styles.formWrapper as any}>
        <h1 style={styles.header as any}>Join VenueMenu</h1>
        <p style={styles.subHeader as any}>Create your account to get started.</p>
        <form onSubmit={handleSignUp}>
          <div style={styles.inputGroup as any}>
            <label htmlFor="role" style={styles.label as any}>
              I am an:
            </label>
            <select
              id="role"
              value={role}
              onChange={handleRoleChange}
              style={styles.select as any}
            >
              <option value="artist">Artist</option>
              <option value="venue">Venue</option>
            </select>
          </div>
          <div style={styles.inputGroup as any}>
            <label htmlFor="email" style={styles.label as any}>
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              required
              style={styles.input as any}
            />
          </div>
          <div style={styles.inputGroup as any}>
            <label htmlFor="password" style={styles.label as any}>
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              required
              minLength={6}
              style={styles.input as any}
            />
          </div>
          <button type="submit" style={styles.button as any}>
            Sign Up
          </button>
        </form>
        {message && (
          <p
            style={
              {
                ...(styles.message as any),
                color: message.startsWith('Error') ? '#f87171' : '#34d399',
              } as React.CSSProperties
            }
          >
            {message}
          </p>
        )}
        <p style={styles.link as any}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#3b82f6' }}>
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}