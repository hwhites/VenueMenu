'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { styles } from '../../styles/forms';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('artist');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setMessage('');

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
      // On successful signup, redirect to the login page
      setMessage('Success! Redirecting you to log in...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <h1 style={styles.header}>Join VenueMenu</h1>
        <p style={styles.subHeader}>Create your account to get started.</p>
        <form onSubmit={handleSignUp}>
          <div style={styles.inputGroup}>
            <label htmlFor="role" style={styles.label}>
              I am an:
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={styles.select}
            >
              <option value="artist">Artist</option>
              <option value="venue">Venue</option>
            </select>
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={styles.input}
            />
          </div>
          <button type="submit" style={styles.button}>
            Sign Up
          </button>
        </form>
        {message && (
          <p
            style={{
              ...styles.message,
              color: message.startsWith('Error') ? '#f87171' : '#34d399',
            }}
          >
            {message}
          </p>
        )}
        <p style={styles.link}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#3b82f6' }}>
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
