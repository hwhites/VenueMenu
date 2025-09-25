'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { styles } from '../../styles/forms';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    // This container div provides the vertical centering and "framed" look.
    <div
      style={{
        ...styles.container,
        minHeight: 'calc(100vh - 120px)',
        backgroundColor: 'transparent',
        padding: '1rem',
      }}
    >
      <div style={styles.formWrapper}>
        <h1 style={styles.header}>Log In to VenueMenu</h1>
        <form onSubmit={handleLogin}>
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
              style={styles.input}
            />
          </div>
          <button type="submit" style={styles.button}>
            Log In
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
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: '#3b82f6' }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
