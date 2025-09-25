'use client';

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter, useParams } from 'next/navigation';
import { styles } from '../../../styles/forms';
import { User } from '@supabase/supabase-js';
import * as React from 'react'; 

// --- Type Definitions ---

interface Message {
  id: number;
  conversation_id: string;
  sender_id: string; // FIX: Reverted to sender_id to match your table
  body: string;
  created_at: string;
  system_flags?: { [key: string]: any }; 
}

interface Offer {
  id: number;
  conversation_id: string;
  from_user_id: string; // This remains from_user_id (standard for offers table)
  date: string;
  pay_amount: number;
  set_count: number;
  set_length_min: number;
  other_terms: string;
  status: 'pending' | 'accepted' | 'declined' | 'countered';
  created_at: string;
}

interface OfferDetails {
  date: string;
  pay_amount: string;
  set_count: string;
  set_length_min: string;
  other_terms: string;
}

type ChatItem = Message | Offer;

interface ConversationRPCResult {
  conversation_id: string;
}

// --- Offer Card Component (No changes needed here) ---

const OfferCard = ({ offer, userRole, onAccept, onDecline }: {
    offer: Offer, 
    userRole: string, 
    onAccept: (offer: Offer) => Promise<void>, 
    onDecline: (offer: Offer) => Promise<void>
}) => {
  const isArtist = userRole === 'artist';
  const isPending = offer.status === 'pending';

  const statusStyles: Record<Offer['status'], React.CSSProperties> = {
    pending: { backgroundColor: '#4b5563', color: '#f9fafb' },
    accepted: { backgroundColor: '#16a34a', color: '#f9fafb' },
    declined: { backgroundColor: '#dc2626', color: '#f9fafb' },
    countered: { backgroundColor: '#f59e0b', color: '#f9fafb' }, 
  };

  return (
    <div
      key={`offer-${offer.id}`} 
      style={{
        alignSelf: 'center',
        width: '80%',
        backgroundColor: '#374151',
        padding: '1rem',
        borderRadius: '12px',
        margin: '1rem 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #4b5563',
          paddingBottom: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        <h4 style={{ margin: 0, color: '#f9fafb' }}>Official Offer</h4>
        <span
          style={{
            ...statusStyles[offer.status], 
            padding: '0.25rem 0.75rem',
            borderRadius: '12px',
            fontSize: '0.8rem',
            textTransform: 'capitalize',
          } as React.CSSProperties} 
        >
          {offer.status}
        </span>
      </div>
      <p style={{ margin: '0 0 0.5rem 0' }}>
        <strong>Date:</strong>{' '}
        {new Date(offer.date).toLocaleDateString(undefined, {
          timeZone: 'UTC',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
      <p style={{ margin: '0 0 0.5rem 0' }}>
        <strong>Payment:</strong> ${offer.pay_amount}
      </p>
      <p style={{ margin: '0 0 0.5rem 0' }}>
        <strong>Sets:</strong> {offer.set_count} x {offer.set_length_min} min
      </p>
      {offer.other_terms && (
        <p style={{ margin: 0 }}>
          <strong>Terms:</strong> {offer.other_terms}
        </p>
      )}

      {isArtist && isPending && (
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #4b5563',
          }}
        >
          <button
            onClick={() => onAccept(offer)}
            style={{ ...(styles.button as any), flex: 1, backgroundColor: '#16a34a' }}
          >
            Accept
          </button>
          <button
            onClick={() => onDecline(offer)}
            style={{ ...(styles.button as any), flex: 1, backgroundColor: '#dc2626' }}
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

export default function ConversationPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerDetails, setOfferDetails] = useState<OfferDetails>({ 
    date: '',
    pay_amount: '',
    set_count: '',
    set_length_min: '',
    other_terms: '',
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null); 

  const router = useRouter();
  const params = useParams() as { id: string }; 
  const otherUserId = params.id;

  useEffect(() => {
    const setupConversation = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const currentUser = session.user;
      setUser(currentUser); 

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();
        
      if (!profile) {
        setError('Your profile could not be found.');
        setLoading(false);
        return;
      }
      setUserRole(profile.role);
      
      const artistId =
        profile.role === 'artist' ? currentUser.id : otherUserId;
      const venueId = profile.role === 'venue' ? currentUser.id : otherUserId;

      const { data: convoData, error: rpcError } = await supabase
        .rpc('get_or_create_conversation', {
          p_artist_user_id: artistId,
          p_venue_user_id: venueId,
        })
        .single();

      if (rpcError || !convoData) {
        setError(rpcError?.message || 'Failed to establish conversation thread.');
        setLoading(false);
        return;
      }
      
      const currentConvoId: string = (convoData as ConversationRPCResult).conversation_id; 
      setConversationId(currentConvoId);

      // Fetch Messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', currentConvoId)
        .order('created_at', { ascending: true });
        
      // Fetch Offers
      const { data: offersData } = await supabase
        .from('offers')
        .select('*')
        .eq('conversation_id', currentConvoId)
        .order('created_at', { ascending: true });

      setMessages(messagesData as Message[] || []);
      setOffers(offersData as Offer[] || []);
      setLoading(false);
    };

    if (otherUserId) {
      setupConversation();
    }
  }, [otherUserId, router]);

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, offers]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !user) return; 

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id, // FIX APPLIED: Use sender_id
        body: newMessage,
      } as Partial<Message>) 
      .select('*, sender_id') // FIX APPLIED: Select sender_id for type compatibility
      .single();

    if (error) setError(error.message);
    else {
        setMessages(prev => [...prev, data as Message]);
        setNewMessage('');
    }
  };
  
  const handleSendOffer = async (e: FormEvent) => {
    e.preventDefault();
    if (!conversationId || !user) return; 

    const { data: insertedOffer, error } = await supabase.from('offers').insert({
      conversation_id: conversationId,
      from_user_id: user.id,
      ...offerDetails,
      pay_amount: parseInt(offerDetails.pay_amount, 10),
      set_count: parseInt(offerDetails.set_count, 10),
      set_length_min: parseInt(offerDetails.set_length_min, 10),
    } as Partial<Offer>)
    .select('*')
    .single();

    if (error) {
      setError(error.message);
    } else {
      setIsOfferModalOpen(false);
      
      const { data: insertedMessage } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id, // FIX APPLIED: Use sender_id
        body: `SYSTEM: New Offer for ${offerDetails.date} sent.`,
        created_at: new Date().toISOString(), 
      } as Partial<Message>)
      .select('*, sender_id') // FIX APPLIED: Select sender_id
      .single();
      
      setMessages(prev => [...prev, insertedMessage as Message]);
      setOffers(prev => [...prev, insertedOffer as Offer]);
    }
  };

  const handleAcceptOffer = async (offer: Offer) => {
    if (!conversationId || !user || !userRole) return;
    
    const { error: updateError } = await supabase
      .from('offers')
      .update({ status: 'accepted' })
      .eq('id', offer.id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    
    const { data: convo } = await supabase
      .from('Conversation') 
      .select('artist_user_id, venue_user_id')
      .eq('id', conversationId)
      .single();
      
    if (!convo) {
        setError("Error: Could not retrieve conversation for booking.");
        return;
    }

    const { error: bookingError } = await supabase.from('Booking').insert({
      artist_user_id: convo.artist_user_id,
      venue_user_id: convo.venue_user_id,
      date: offer.date,
      agreed_pay_amount: offer.pay_amount,
      status: 'confirmed', 
    });
    if (bookingError) {
      setError(`Booking Error: ${bookingError.message}`);
      return;
    }

    const { data: newMessageData } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id, // FIX APPLIED: Use sender_id
        body: `SYSTEM: Offer for ${offer.date} accepted. Booking confirmed.`,
        created_at: new Date().toISOString(),
        system_flags: { offer_accepted: true },
      } as Partial<Message>) 
      .select('*, sender_id') // FIX APPLIED: Select sender_id
      .single();

    setOffers(
      offers.map((o) => (o.id === offer.id ? { ...o, status: 'accepted' } : o))
    );
    setMessages(prev => [...prev, newMessageData as Message]);
  };

  const handleDeclineOffer = async (offer: Offer) => {
    if (!conversationId || !user) return;
    
    const { data: updatedOffer, error } = await supabase
      .from('offers')
      .update({ status: 'declined' })
      .eq('id', offer.id)
      .select('*')
      .single();
      
    if (error) {
      setError(error.message);
      return;
    }

    const { data: newMessageData } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id, // FIX APPLIED: Use sender_id
        body: `SYSTEM: Offer for ${offer.date} declined.`,
        created_at: new Date().toISOString(),
      } as Partial<Message>) 
      .select('*, sender_id') // FIX APPLIED: Select sender_id
      .single();

    setOffers(
      offers.map((o) => (o.id === offer.id ? { ...o, status: 'declined' } : o))
    );
    setMessages(prev => [...prev, newMessageData as Message]);
  };

  if (loading)
    return (
      <div>
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>
          Loading Conversation...
        </p>
      </div>
    );
  if (error)
    return (
      <div>
        <p style={{ textAlign: 'center', marginTop: '2rem', color: '#f87171' }}>
          Error: {error}
        </p>
      </div>
    );

  const chatFeed = ([...messages, ...offers] as ChatItem[]).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <>
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
        <div
          style={
            {
              ...(styles.formWrapper as React.CSSProperties),
              maxWidth: '800px',
              display: 'flex',
              flexDirection: 'column',
              height: 'calc(100vh - 150px)',
            } as React.CSSProperties
          }
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h1 style={styles.header as any}>Conversation</h1>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column-reverse', 
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div ref={messagesEndRef} />

            {[...chatFeed].reverse().map((item) => {
              if ('body' in item) { 
                const messageItem = item as Message;
                // FIX APPLIED: Use sender_id for comparison
                const isMyMessage = messageItem.sender_id === user?.id; 
                return (
                  <div
                    key={`msg-${messageItem.id}`}
                    style={{
                      alignSelf: isMyMessage ? 'flex-end' : 'flex-start',
                      backgroundColor: isMyMessage ? '#1d4ed8' : '#374151',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      maxWidth: '70%',
                    }}
                  >
                    <p style={{ margin: 0, color: '#f9fafb' }}>{messageItem.body}</p>
                  </div>
                );
              } else {
                const offerItem = item as Offer;
                return (
                  <OfferCard
                    key={`offer-${offerItem.id}`}
                    offer={offerItem}
                    userRole={userRole || ''} 
                    onAccept={handleAcceptOffer}
                    onDecline={handleDeclineOffer}
                  />
                );
              }
            })}
          </div>

          <div>
            <form
              onSubmit={handleSendMessage}
              style={{ display: 'flex', gap: '10px' }}
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                style={{ ...(styles.input as any), flex: 1 }}
                placeholder="Type your message..."
              />
              <button type="submit" style={{ ...(styles.button as any), width: 'auto' }}>
                Send
              </button>
            </form>
            {userRole === 'venue' && (
              <button
                type="button"
                onClick={() => setIsOfferModalOpen(true)}
                style={{ ...(styles.button as any), width: '100%', marginTop: '10px' }}
              >
                Make Offer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Offer Modal */}
      {isOfferModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div style={{ ...(styles.formWrapper as any), maxWidth: '500px' }}>
            <h1 style={styles.header as any}>Create an Offer</h1>
            <form onSubmit={handleSendOffer}>
              <div style={styles.inputGroup as any}>
                <label style={styles.label as any}>Date</label>
                <input
                  type="date"
                  style={styles.input as any}
                  required
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setOfferDetails({ ...offerDetails, date: e.target.value })
                  }
                />
              </div>
              <div style={styles.inputGroup as any}>
                <label style={styles.label as any}>Payment ($)</label>
                <input
                  type="number"
                  style={styles.input as any}
                  required
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setOfferDetails({
                      ...offerDetails,
                      pay_amount: e.target.value,
                    })
                  }
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={styles.inputGroup as any}>
                  <label style={styles.label as any}>Set Count</label>
                  <input
                    type="number"
                    style={styles.input as any}
                    required
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setOfferDetails({
                        ...offerDetails,
                        set_count: e.target.value,
                      })
                    }
                  />
                </div>
                <div style={styles.inputGroup as any}>
                  <label style={styles.label as any}>Set Length (min)</label>
                  <input
                    type="number"
                    style={styles.input as any}
                    required
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setOfferDetails({
                        ...offerDetails,
                        set_length_min: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div style={styles.inputGroup as any}>
                <label style={styles.label as any}>Other Terms</label>
                <textarea
                  style={styles.textarea as any}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setOfferDetails({
                      ...offerDetails,
                      other_terms: e.target.value,
                    })
                  }
                ></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" style={{ ...(styles.button as any), flex: 1 }}>
                  Send Offer
                </button>
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(false)}
                  style={{
                    ...(styles.button as any),
                    flex: 1,
                    backgroundColor: '#4b5563',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}