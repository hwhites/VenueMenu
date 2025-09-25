'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { styles } from '../../styles/forms';
import Link from 'next/link';

export default function InboxPage() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
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
      setUser(session.user);

      const { data, error } = await supabase.rpc('get_user_conversations', {
        p_user_id: session.user.id,
      });

      if (error) {
        setError(error.message);
      } else {
        setConversations(data);
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

  return (
    <div
      style={{
        ...styles.container,
        minHeight: 'calc(100vh - 120px)',
        backgroundColor: 'transparent',
        padding: '1rem',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ ...styles.formWrapper, maxWidth: '800px' }}>
        <h1 style={styles.header}>My Inbox</h1>
        <p style={styles.subHeader}>Here are all of your conversations.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {conversations.length > 0 ? (
            conversations.map((convo) => (
              <Link
                key={convo.conversation_id}
                href={`/messages/${convo.other_user_id}`}
                style={{
                  display: 'block',
                  backgroundColor: '#374151',
                  padding: '1rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: '#f9fafb',
                  position: 'relative',
                }}
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
