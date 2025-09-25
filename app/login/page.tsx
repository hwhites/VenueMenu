'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { styles } from '../../styles/forms';
import Link from 'next/link';
import * as React from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      // FIX APPLIED: Use hard browser redirect to guarantee session update across server/client components.
      window.location.href = '/'; 
    }
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  
  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <div
      style={
        {
          ...(styles.container as React.CSSProperties),
          minHeight: 'calc(100vh - 120px)',
          backgroundColor: 'transparent',
          padding: '1rem',
        } as React.CSSProperties
      }
    >
      <div style={styles.formWrapper as any}>
        <h1 style={styles.header as any}>Log In to VenueMenu</h1>
        <form onSubmit={handleLogin}>
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
              style={styles.input as any}
            />
          </div>
          <button type="submit" style={styles.button as any}>
            Log In
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
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: '#3b82f6' }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}