import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './SupportChat.css';

const API_BASE_URL = 'http://localhost:5001/api';

export default function SupportChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      scrollToBottom();
      // Start polling for new messages every 5 seconds
      pollingRef.current = setInterval(fetchHistory, 5000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => clearInterval(pollingRef.current);
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/support/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/support/send`, { message: input }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInput('');
      fetchHistory();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role === 'admin') return null;

  return (
    <div className="support-chat-wrapper">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>
          <span className="chat-icon">💬</span>
          <span className="chat-label">Support</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window animate-slide-up">
          <div className="chat-header">
            <div className="chat-header-info">
              <span className="online-indicator" />
              <h4>Customer Support</h4>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <p>👋 Hello! How can we help you today?</p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`message-bubble ${m.sender_id === user.id ? 'user' : 'support'}`}>
                  <p>{m.message}</p>
                  <span className="message-time">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              className="chat-send-btn" 
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
