'use client';

// FIX: Importing necessary types for strict compilation
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { styles } from '../../styles/forms';
import Link from 'next/link';
import { User } from '@supabase/supabase-js'; // FIX: Import User type
import * as React from 'react'; // FIX: Generic React import for style casting

// FIX: Define a type for the data returned by the RPC function
interface Conversation {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  last_message_body: string | null;
  last_message_at: string;
  has_unread: boolean;
}

export default function InboxPage() {
  // FIX: Explicitly type all state variables
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]); // Use defined type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndConversations = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      const currentUser = session.user;
      setUser(currentUser); // FIX: Set User is safe now

      // FIX: Guard against null user before RPC call
      if (!currentUser) {
        setError('Authentication error: User ID is missing.');
        setLoading(false);
        return;
      }

      // FIX: Cast result to the defined type
      const { data, error } = await supabase.rpc('get_user_conversations', {
        p_user_id: currentUser.id,
      });

      if (error) {
        console.error('Error fetching conversations:', error);
        setError(error.message);
      } else {
        setConversations(data as Conversation[]);
      }
      setLoading(false);
    };

    fetchUserAndConversations();
  }, [router]);

  if (loading) {
    return (
      <div>
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>
          Loading Inbox...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <p style={{ textAlign: 'center', marginTop: '2rem', color: '#f87171' }}>
          Error: {error}
        </p>
      </div>
    );
  }

  // FIX: Apply casting to all external style objects to bypass build errors
  return (
    <div
      style={
        {
          ...(styles.container as React.CSSProperties),
          minHeight: 'calc(100vh - 120px)',
          backgroundColor: 'transparent',
          padding: '1rem',
          alignItems: 'flex-start',
        } as React.CSSProperties
      }
    >
      <div style={{ ...(styles.formWrapper as React.CSSProperties), maxWidth: '800px' }}>
        <h1 style={styles.header as any}>My Inbox</h1>
        <p style={styles.subHeader as any}>Here are all of your conversations.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {conversations.length > 0 ? (
            conversations.map((convo) => (
              <Link
                key={convo.conversation_id}
                href={`/messages/${convo.other_user_id}`}
                style={
                    {
                        display: 'block',
                        backgroundColor: '#374151',
                        padding: '1rem',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: '#f9fafb',
                        position: 'relative',
                        transition: 'background-color 0.2s',
                    } as React.CSSProperties
                }
                // Optional: Add hover state for better UX
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
              >
                {convo.has_unread && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      height: '10px',
                      width: '10px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '50%',
                    }}
                  ></span>
                )}
                <h3 style={{ margin: '0 0 0.5rem 0' }}>
                  {convo.other_user_name}
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: convo.has_unread ? '#f9fafb' : '#9ca3af',
                    fontWeight: convo.has_unread ? 'bold' : 'normal',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {convo.last_message_body || 'No messages yet.'}
                </p>
              </Link>
            ))
          ) : (
            <p style={{ color: '#9ca3af', textAlign: 'center' }}>
              You have no conversations.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}