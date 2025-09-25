'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter, useParams } from 'next/navigation';
import { styles } from '../../../styles/forms';

// Offer Card Component
const OfferCard = ({ offer, userRole, onAccept, onDecline }) => {
  const isArtist = userRole === 'artist';
  const isPending = offer.status === 'pending';

  const statusStyles = {
    pending: { backgroundColor: '#4b5563', color: '#f9fafb' },
    accepted: { backgroundColor: '#16a34a', color: '#f9fafb' },
    declined: { backgroundColor: '#dc2626', color: '#f9fafb' },
  };

  return (
    <div
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
          }}
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
            style={{ ...styles.button, flex: 1, backgroundColor: '#16a34a' }}
          >
            Accept
          </button>
          <button
            onClick={() => onDecline(offer)}
            style={{ ...styles.button, flex: 1, backgroundColor: '#dc2626' }}
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
};

export default function ConversationPage() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [offers, setOffers] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerDetails, setOfferDetails] = useState({
    date: '',
    pay_amount: '',
    set_count: '',
    set_length_min: '',
    other_terms: '',
  });

  const router = useRouter();
  const params = useParams();
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
      setUser(session.user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (!profile) {
        setError('Your profile could not be found.');
        setLoading(false);
        return;
      }
      setUserRole(profile.role);

      const artistId =
        profile.role === 'artist' ? session.user.id : otherUserId;
      const venueId = profile.role === 'venue' ? session.user.id : otherUserId;

      const { data: convoData, error: rpcError } = await supabase
        .rpc('get_or_create_conversation', {
          p_artist_user_id: artistId,
          p_venue_user_id: venueId,
        })
        .single();

      if (rpcError) {
        setError(rpcError.message);
        setLoading(false);
        return;
      }

      const currentConvoId = convoData.conversation_id;
      setConversationId(currentConvoId);

      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', currentConvoId)
        .order('created_at', { ascending: true });
      const { data: offersData } = await supabase
        .from('offers')
        .select('*')
        .eq('conversation_id', currentConvoId)
        .order('created_at', { ascending: true });

      setMessages(messagesData || []);
      setOffers(offersData || []);
      setLoading(false);
    };

    if (otherUserId) {
      setupConversation();
    }
  }, [otherUserId, router]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: newMessage,
      });
    if (error) setError(error.message);
    else setNewMessage('');
  };

  const handleSendOffer = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('offers').insert({
      conversation_id: conversationId,
      from_user_id: user.id,
      ...offerDetails,
      pay_amount: parseInt(offerDetails.pay_amount),
      set_count: parseInt(offerDetails.set_count),
      set_length_min: parseInt(offerDetails.set_length_min),
    });

    if (error) {
      setError(error.message);
    } else {
      setIsOfferModalOpen(false);
      // You might want to refresh offers here or rely on polling/realtime
    }
  };

  const handleAcceptOffer = async (offer) => {
    // 1. Update offer status
    const { error: updateError } = await supabase
      .from('offers')
      .update({ status: 'accepted' })
      .eq('id', offer.id);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    // 2. Create booking
    const { data: convo } = await supabase
      .from('conversations')
      .select('artist_user_id, venue_user_id')
      .eq('id', conversationId)
      .single();
    const { error: bookingError } = await supabase.from('bookings').insert({
      offer_id: offer.id,
      artist_user_id: convo.artist_user_id,
      venue_user_id: convo.venue_user_id,
      date: offer.date,
      agreed_pay_amount: offer.pay_amount,
    });
    if (bookingError) {
      setError(bookingError.message);
      return;
    }

    // 3. (Optional) Add system message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: `SYSTEM: Offer for ${offer.date} accepted.`,
      });

    // Refresh local state
    setOffers(
      offers.map((o) => (o.id === offer.id ? { ...o, status: 'accepted' } : o))
    );
  };

  const handleDeclineOffer = async (offer) => {
    const { error } = await supabase
      .from('offers')
      .update({ status: 'declined' })
      .eq('id', offer.id);
    if (error) {
      setError(error.message);
      return;
    }
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: `SYSTEM: Offer for ${offer.date} declined.`,
      });
    setOffers(
      offers.map((o) => (o.id === offer.id ? { ...o, status: 'declined' } : o))
    );
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
  const chatFeed = [...messages, ...offers].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  return (
    <>
      <div
        style={{
          ...styles.container,
          minHeight: 'calc(100vh - 120px)',
          backgroundColor: 'transparent',
          padding: '1rem',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            ...styles.formWrapper,
            maxWidth: '800px',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 150px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h1 style={styles.header}>Conversation</h1>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column-reverse', // This is the key change
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            {/* We now map over a reversed copy of the chat feed */}
            {[...chatFeed].reverse().map((item) =>
              item.body ? ( // It's a message
                <div
                  key={`msg-${item.id}`}
                  style={{
                    alignSelf:
                      item.sender_id === user.id ? 'flex-end' : 'flex-start',
                    backgroundColor:
                      item.sender_id === user.id ? '#1d4ed8' : '#374151',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    maxWidth: '70%',
                  }}
                >
                  <p style={{ margin: 0, color: '#f9fafb' }}>{item.body}</p>
                </div>
              ) : (
                // It's an offer
                <OfferCard
                  key={`offer-${item.id}`}
                  offer={item}
                  userRole={userRole}
                  onAccept={handleAcceptOffer}
                  onDecline={handleDeclineOffer}
                />
              )
            )}
          </div>

          <div>
            <form
              onSubmit={handleSendMessage}
              style={{ display: 'flex', gap: '10px' }}
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                style={{ ...styles.input, flex: 1 }}
                placeholder="Type your message..."
              />
              <button type="submit" style={{ ...styles.button, width: 'auto' }}>
                Send
              </button>
            </form>
            {userRole === 'venue' && (
              <button
                type="button"
                onClick={() => setIsOfferModalOpen(true)}
                style={{ ...styles.button, width: '100%', marginTop: '10px' }}
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
          <div style={{ ...styles.formWrapper, maxWidth: '500px' }}>
            <h1 style={styles.header}>Create an Offer</h1>
            <form onSubmit={handleSendOffer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Date</label>
                <input
                  type="date"
                  style={styles.input}
                  required
                  onChange={(e) =>
                    setOfferDetails({ ...offerDetails, date: e.target.value })
                  }
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Payment ($)</label>
                <input
                  type="number"
                  style={styles.input}
                  required
                  onChange={(e) =>
                    setOfferDetails({
                      ...offerDetails,
                      pay_amount: e.target.value,
                    })
                  }
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Set Count</label>
                  <input
                    type="number"
                    style={styles.input}
                    required
                    onChange={(e) =>
                      setOfferDetails({
                        ...offerDetails,
                        set_count: e.target.value,
                      })
                    }
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Set Length (min)</label>
                  <input
                    type="number"
                    style={styles.input}
                    required
                    onChange={(e) =>
                      setOfferDetails({
                        ...offerDetails,
                        set_length_min: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Other Terms</label>
                <textarea
                  style={styles.textarea}
                  onChange={(e) =>
                    setOfferDetails({
                      ...offerDetails,
                      other_terms: e.target.value,
                    })
                  }
                ></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" style={{ ...styles.button, flex: 1 }}>
                  Send Offer
                </button>
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(false)}
                  style={{
                    ...styles.button,
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
