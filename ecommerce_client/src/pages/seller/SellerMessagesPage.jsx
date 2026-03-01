import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { sellerAPI } from '../../services/api.service';

const SellerMessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await sellerAPI.getMessages();
      const messagesData = response.data?.messages || response.messages || [];
      setMessages(messagesData);
      if (messagesData.length > 0) {
        setSelectedMessage(messagesData[0]);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    try {
      await sellerAPI.replyToMessage(selectedMessage.id || selectedMessage._id, replyText);
      toast.success('Reply sent successfully');
      setReplyText('');
      fetchMessages();
    } catch (err) {
      console.error('Error sending reply:', err);
    }
  };

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <span style={{ fontSize: '3em' }}>⚠️</span>
        <h2 style={{ color: '#0F1111', marginTop: '20px' }}>Failed to load messages</h2>
        <p style={{ color: '#565959', marginBottom: '20px' }}>{error}</p>
        <button onClick={fetchMessages} style={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Customer Messages</h1>
      <p style={styles.subtitle}>Communicate with your customers</p>

      <div style={styles.messagesLayout}>
        {/* Message List */}
        <div style={styles.messageList}>
          {messages.length > 0 ? (
            messages.map((message) => (
              <div
                key={message.id || message._id}
                style={{
                  ...styles.messageItem,
                  ...(message.unread ? styles.messageItemUnread : {}),
                  ...(selectedMessage?.id === message.id || selectedMessage?._id === message._id ? styles.messageItemActive : {})
                }}
                onClick={() => setSelectedMessage(message)}
              >
                <div style={{ fontWeight: 'bold' }}>{message.customer || message.customerName}</div>
                <div style={styles.messagePreview}>{message.preview || message.lastMessage}</div>
                <div style={styles.messageTime}>{message.time || new Date(message.createdAt).toLocaleString()}</div>
              </div>
            ))
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#565959' }}>
              No messages found
            </div>
          )}
        </div>

        {/* Message Detail */}
        {selectedMessage && (
          <div style={styles.messageDetail}>
            <div style={styles.messageHeader}>
              <h2>Conversation with {selectedMessage.customer}</h2>
              <div style={{ color: '#565959' }}>Order {selectedMessage.orderId}</div>
            </div>

            <div style={styles.messageThread}>
              {selectedMessage.thread.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.messageBubble,
                    ...(msg.from === 'customer' ? styles.messageFromCustomer : styles.messageFromSeller)
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    {msg.from === 'customer' ? selectedMessage.customer : 'You (TechStore Pro)'}
                  </div>
                  <div>{msg.text}</div>
                  <div style={styles.messageTimestamp}>{msg.timestamp}</div>
                </div>
              ))}
            </div>

            <div style={styles.replyBox}>
              <textarea
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                style={styles.replyTextarea}
              />
              <button onClick={handleSendReply} style={styles.primaryButton}>
                Send Reply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '30px'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px'
  },
  spinner: {
    fontSize: '1.2em',
    color: '#565959'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    padding: '40px'
  },
  retryButton: {
    background: '#FF9900',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1em'
  },
  title: {
    fontSize: '2em',
    marginBottom: '10px',
    color: '#0F1111'
  },
  subtitle: {
    color: '#565959',
    marginBottom: '30px'
  },
  messagesLayout: {
    display: 'grid',
    gridTemplateColumns: '350px 1fr',
    gap: '20px',
    height: 'calc(100vh - 200px)'
  },
  messageList: {
    background: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #D5D9D9',
    overflowY: 'auto'
  },
  messageItem: {
    padding: '15px',
    borderBottom: '1px solid #D5D9D9',
    cursor: 'pointer'
  },
  messageItemUnread: {
    background: '#F0F8FF',
    fontWeight: 'bold'
  },
  messageItemActive: {
    background: '#FFF4E5',
    borderLeft: '3px solid #FF9900'
  },
  messagePreview: {
    fontSize: '0.9em',
    color: '#565959',
    marginTop: '5px'
  },
  messageTime: {
    fontSize: '0.8em',
    color: '#565959',
    marginTop: '5px'
  },
  messageDetail: {
    background: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #D5D9D9',
    padding: '25px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column'
  },
  messageHeader: {
    borderBottom: '2px solid #F7F8F8',
    paddingBottom: '15px',
    marginBottom: '20px'
  },
  messageThread: {
    flex: 1,
    marginBottom: '20px',
    overflowY: 'auto'
  },
  messageBubble: {
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
    maxWidth: '70%'
  },
  messageFromCustomer: {
    background: '#F7F8F8'
  },
  messageFromSeller: {
    background: '#E7F3FF',
    marginLeft: 'auto'
  },
  messageTimestamp: {
    fontSize: '0.8em',
    color: '#565959',
    marginTop: '8px'
  },
  replyBox: {
    borderTop: '2px solid #F7F8F8',
    paddingTop: '20px'
  },
  replyTextarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #D5D9D9',
    borderRadius: '4px',
    minHeight: '100px',
    fontFamily: 'inherit',
    fontSize: '1em',
    resize: 'vertical'
  },
  primaryButton: {
    background: '#FF9900',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '10px'
  }
};

export default SellerMessagesPage;
