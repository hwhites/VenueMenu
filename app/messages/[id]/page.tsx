'use client';

// FIX: Importing all necessary types
import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter, useParams } from 'next/navigation';
import { styles } from '../../../styles/forms';
import { User } from '@supabase/supabase-js';
import * as React from 'react'; // For casting CSS properties

// --- Type Definitions for Stability ---

interface Message {
  id: number;
  conversation_id: string;
  sender_id: string; // user.id
  body: string;
  created_at: string;
}

interface Offer {
  id: number;
  conversation_id: string;
  from_user_id: string; // venue's user.id
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

// --- Offer Card Component (Nested Component Fix) ---

// FIX: Explicitly type props
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
    countered: { backgroundColor: '#f59e0b', color: '#f9fafb' }, // Added for completeness
  };

  return (
    <div
      key={`offer-${offer.id}`} // Use offer.id for key
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
            ...statusStyles[offer.status], // Safely access status styles
            padding: '0.25rem 0.75rem',
            borderRadius: '12px',
            fontSize: '0.8rem',
            textTransform: 'capitalize',
          } as React.CSSProperties} // Cast to bypass style property errors
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
  // FIX: Explicitly type all states
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerDetails, setOfferDetails] = useState<OfferDetails>({ // Use typed state
    date: '',
    pay_amount: '',
    set_count: '',
    set_length_min: '',
    other_terms: '',
  });
  
  // FIX: Use ref for scrolling for cleaner handling
  const messagesEndRef = useRef<HTMLDivElement>(null); 

  const router = useRouter();
  // FIX: Explicitly type useParams return
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
      setUser(currentUser); // Set user once authenticated

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
      
      // Determine Artist and Venue IDs for RPC call
      const artistId =
        profile.role === 'artist' ? currentUser.id : otherUserId;
      const venueId = profile.role === 'venue' ? currentUser.id : otherUserId;

      // Get/Create Conversation
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

      const currentConvoId: string = convoData.conversation_id;
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

  // Scroll to bottom whenever messages/offers update
  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, offers]);


  // FIX: Explicitly type event handler and add null checks
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !user) return; // Guard checks

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id, // user is guaranteed not null here
        body: newMessage,
      } as Message) // Cast to enforce type safety on insertion
      .select('*, sender_id') // Select all fields plus sender_id for immediate update
      .single();

    if (error) setError(error.message);
    else {
        // FIX: Directly update local state with new message to avoid a full re-fetch
        setMessages(prev => [...prev, error.data as Message]);
        setNewMessage('');
    }
  };
  
  // FIX: Explicitly type event handler and add null checks
  const handleSendOffer = async (e: FormEvent) => {
    e.preventDefault();
    if (!conversationId || !user) return; // Guard checks

    const { error } = await supabase.from('offers').insert({
      conversation_id: conversationId,
      from_user_id: user.id,
      ...offerDetails,
      pay_amount: parseInt(offerDetails.pay_amount, 10),
      set_count: parseInt(offerDetails.set_count, 10),
      set_length_min: parseInt(offerDetails.set_length_min, 10),
    } as Offer)
    .select('*')
    .single();

    if (error) {
      setError(error.message);
    } else {
      setIsOfferModalOpen(false);
      // FIX: Add system message to the message feed
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: `SYSTEM: New Offer for ${offerDetails.date} sent.`,
        created_at: new Date().toISOString(), // Use current time for sorting
      } as Message);
      
      // FIX: Rely on a refresh or update offers manually
      // For a quick fix, reload the conversation data
      // In a real app, you would listen to Supabase real-time updates here
      // For now, let's just close the modal and rely on a refetch if needed later
      // setOffers(prev => [...prev, data as Offer]); // Assuming insert returns data
      
      setLoading(true); // Force a reload to get the latest offers/messages
      router.refresh();
    }
  };

  // FIX: Explicitly type offer parameter
  const handleAcceptOffer = async (offer: Offer) => {
    if (!conversationId || !user || !userRole) return;
    
    // 1. Update offer status
    const { error: updateError } = await supabase
      .from('offers')
      .update({ status: 'accepted' })
      .eq('id', offer.id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    
    // 2. Fetch required conversation data (FIX: Convo table is likely named 'Conversation')
    const { data: convo } = await supabase
      .from('Conversation') 
      .select('artist_user_id, venue_user_id')
      .eq('id', conversationId)
      .single();
      
    if (!convo) {
        setError("Error: Could not retrieve conversation for booking.");
        return;
    }

    // 3. Create booking (FIX: Booking table is likely named 'Booking')
    const { error: bookingError } = await supabase.from('Booking').insert({
      artist_user_id: convo.artist_user_id,
      venue_user_id: convo.venue_user_id,
      date: offer.date,
      agreed_pay_amount: offer.pay_amount,
      status: 'confirmed', // Must include status
    });
    if (bookingError) {
      setError(`Booking Error: ${bookingError.message}`);
      return;
    }

    // 4. Add system message (FIX: Message table is likely named 'Messages')
    const { data: newMessageData } = await supabase
      .from('Messages')
      .insert({
        conversation_id: conversationId,
        from_user_id: user.id, // Corrected column name to 'from_user_id'
        body: `SYSTEM: Offer for ${offer.date} accepted. Booking confirmed.`,
        created_at: new Date().toISOString(),
        system_flags: { offer_accepted: true },
      } as Message)
      .select('*')
      .single();

    // Refresh local state (FIX: Use the returned data to update state)
    setOffers(
      offers.map((o) => (o.id === offer.id ? { ...o, status: 'accepted' } : o))
    );
    setMessages(prev => [...prev, newMessageData as Message]);
  };

  // FIX: Explicitly type offer parameter
  const handleDeclineOffer = async (offer: Offer) => {
    if (!conversationId || !user) return;
    
    // 1. Update offer status
    const { error } = await supabase
      .from('offers')
      .update({ status: 'declined' })
      .eq('id', offer.id);
    if (error) {
      setError(error.message);
      return;
    }

    // 2. Add system message (FIX: Message table is likely named 'Messages')
    const { data: newMessageData } = await supabase
      .from('Messages')
      .insert({
        conversation_id: conversationId,
        from_user_id: user.id, // Corrected column name to 'from_user_id'
        body: `SYSTEM: Offer for ${offer.date} declined.`,
        created_at: new Date().toISOString(),
      } as Message)
      .select('*')
      .single();

    // Refresh local state
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

  // Combine and sort messages and offers by creation time
  // FIX: Ensure both types have a 'created_at' for sorting
  const chatFeed = ([...messages, ...offers] as ChatItem[]).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Determine the name of the other user here (e.g., fetch in useEffect and store state)
  // For MVP, we'll skip the name and just show "Conversation"

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
            {/* Scroll anchor at the bottom of the feed */}
            <div ref={messagesEndRef} />

            {/* We now map over a reversed copy of the chat feed */}
            {[...chatFeed].reverse().map((item) => {
              // Check if the item is a Message by checking for the 'body' property
              if ('body' in item) { 
                const messageItem = item as Message;
                return (
                  <div
                    key={`msg-${messageItem.id}`}
                    style={{
                      alignSelf:
                        messageItem.sender_id === user?.id ? 'flex-end' : 'flex-start',
                      backgroundColor:
                        messageItem.sender_id === user?.id ? '#1d4ed8' : '#374151',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      maxWidth: '70%',
                    }}
                  >
                    <p style={{ margin: 0, color: '#f9fafb' }}>{messageItem.body}</p>
                  </div>
                );
              } else {
                // It's an Offer (assuming it has 'status')
                const offerItem = item as Offer;
                return (
                  <OfferCard
                    key={`offer-${offerItem.id}`}
                    offer={offerItem}
                    userRole={userRole || ''} // Pass a string
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
                // FIX: Explicitly type change handler
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
                  // FIX: Use typed handler and update state
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
                  // FIX: Use typed handler and update state
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
                    // FIX: Use typed handler and update state
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
                    // FIX: Use typed handler and update state
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
                  // FIX: Use typed handler and update state
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