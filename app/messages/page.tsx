'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { styles } from '../../styles/forms'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import * as React from 'react'

// Type Definition for conversation summaries
interface ConversationSummary {
  conversation_id: number
  other_user_id: string
  other_user_name: string
  last_message_body: string
  has_unread: boolean
}

export default function InboxPage() {
  const [user, setUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  // FIX: Wrap fetch function in useCallback to create a stable reference
  const fetchUserAndConversations = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    setUser(session.user)

    const { data, error: rpcError } = await supabase.rpc('get_user_conversations', { p_user_id: session.user.id })
    
    if (rpcError) {
      setError(rpcError.message)
    } else {
      setConversations(data || [])
    }
    setLoading(false)
  }, [router]); // router is a stable dependency

  // FIX: Add the stable fetchUserAndConversations function to the dependency array
  useEffect(() => {
    fetchUserAndConversations()
  }, [fetchUserAndConversations])

  const handleDeleteConversation = async (conversationId: number) => {
    if (!user) return;
    
    if (window.confirm('Are you sure you want to delete this entire conversation? This cannot be undone.')) {
        const { error: deleteError } = await supabase.rpc('delete_conversation', {
            p_conversation_id: conversationId,
            p_user_id: user.id
        });

        if (deleteError) {
            setError(deleteError.message);
        } else {
            setConversations(conversations.filter(c => c.conversation_id !== conversationId));
        }
    }
  }

  if (loading) {
    return <div><p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading Inbox...</p></div>
  }

  if (error) {
    return <div><p style={{ textAlign: 'center', marginTop: '2rem', color: '#f87171' }}>Error: {error}</p></div>
  }

  return (
    <div style={{...styles.container as React.CSSProperties, minHeight: 'calc(100vh - 120px)', backgroundColor: 'transparent', padding: '1rem', alignItems: 'flex-start' }}>
        <div style={{...styles.formWrapper as React.CSSProperties, maxWidth: '800px'}}>
            <h1 style={styles.header as React.CSSProperties}>My Inbox</h1>
            <p style={styles.subHeader as React.CSSProperties}>Here are all of your conversations.</p>

            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                {conversations.length > 0 ? (
                    conversations.map(convo => (
                        <div key={convo.conversation_id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            backgroundColor: '#374151',
                            padding: '1rem',
                            borderRadius: '8px',
                        }}>
                            <Link href={`/messages/${convo.other_user_id}`} style={{ flex: 1, textDecoration: 'none', color: '#f9fafb', position: 'relative' }}>
                                {convo.has_unread && (
                                    <span style={{ position: 'absolute', top: '0.25rem', right: '0', height: '10px', width: '10px', backgroundColor: '#3b82f6', borderRadius: '50%' }}></span>
                                )}
                                <h3 style={{margin: '0 0 0.5rem 0'}}>{convo.other_user_name}</h3>
                                <p style={{ margin: 0, color: convo.has_unread ? '#f9fafb' : '#9ca3af', fontWeight: convo.has_unread ? 'bold' : 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {convo.last_message_body || 'No messages yet.'}
                                </p>
                            </Link>
                            <button 
                                onClick={() => handleDeleteConversation(convo.conversation_id)}
                                style={{
                                    background: 'none',
                                    border: '1px solid #dc2626',
                                    color: '#dc2626',
                                    borderRadius: '4px',
                                    padding: '0.5rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    ))
                ) : (
                    <p style={{ color: '#9ca3af', textAlign: 'center' }}>You have no conversations.</p>
                )}
            </div>
        </div>
    </div>
  )
}

