import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './AdminSupport.css';

const API_BASE_URL = 'http://localhost:5001/api';

export default function AdminSupport() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchHistory(selectedUser.id);
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => fetchHistory(selectedUser.id), 5000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => clearInterval(pollingRef.current);
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/support/admin/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data.conversations);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  const fetchHistory = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/support/admin/history/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedUser || loading) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/support/send`, { 
        message: input,
        receiver_id: selectedUser.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInput('');
      fetchHistory(selectedUser.id);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-support-container">
      <div className="admin-support-sidebar">
        <div className="sidebar-header">
          <h3>Support Inbox</h3>
          <span className="badge badge-primary">{conversations.length}</span>
        </div>
        <div className="conversations-list">
          {conversations.length === 0 ? (
            <p className="empty-text">No active conversations</p>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.id} 
                className={`conversation-item ${selectedUser?.id === conv.id ? 'active' : ''}`}
                onClick={() => setSelectedUser(conv)}
              >
                <div className="conv-avatar">{conv.name[0]}</div>
                <div className="conv-content">
                  <div className="conv-top">
                    <span className="conv-name">{conv.name}</span>
                    {conv.unread_count > 0 && <span className="unread-dot" />}
                  </div>
                  <span className="conv-last-activity">
                    {new Date(conv.last_activity).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="admin-support-main">
        {selectedUser ? (
          <div className="chat-area">
            <div className="chat-area-header">
              <div className="user-info">
                <h4>{selectedUser.name}</h4>
                <span>{selectedUser.email}</span>
              </div>
            </div>

            <div className="chat-area-messages">
              {messages.map((m, i) => (
                <div key={i} className={`admin-msg-bubble ${m.sender_id === selectedUser.id ? 'incoming' : 'outgoing'}`}>
                  <p>{m.message}</p>
                  <span className="msg-time">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-area-input">
              <input
                type="text"
                placeholder={`Reply to ${selectedUser.name}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                className="btn btn-primary" 
                onClick={handleSend}
                disabled={loading || !input.trim()}
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="no-chat-selected">
            <div className="empty-illustration">📬</div>
            <h3>Select a conversation to start chatting</h3>
            <p>Help your customers with their rental queries in real-time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
