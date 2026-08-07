import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AssistantPanel.css';

const suggestions = [
  { icon: '🗓️', text: 'Book a rent' },
  { icon: '📊', text: 'Analysis' },
  { icon: '🛡️', text: 'Insurance' },
  { icon: '💳', text: 'Payment' },
];

export default function AssistantPanel({ vehicle }) {
  const nav = useNavigate();
  const [input, setInput] = useState(
    vehicle ? `Book ${vehicle.name} for ₹${vehicle.price_per_day}/day` : 'Arrange to rent a vehicle today'
  );
  const [messages, setMessages] = useState([
    { role: 'ai', text: `Hello! I'm your AI rental assistant. ${vehicle ? `I see you're interested in the ${vehicle.name}. ` : ''}How can I help you today?` }
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');

    // Smart responses
    setTimeout(() => {
      let reply = '';
      const lower = userMsg.toLowerCase();
      if (lower.includes('book') || lower.includes('rent')) {
        reply = vehicle
          ? `Great! I'll help you book the ${vehicle.name}. Click "Book Now" to proceed with the booking at ₹${vehicle.price_per_hour}/hour.`
          : 'I can help you book a vehicle! Please browse our vehicles and select one to proceed.';
        if (vehicle) setTimeout(() => nav(`/booking/${vehicle.id}`), 1500);
      } else if (lower.includes('payment') || lower.includes('pay')) {
        reply = 'We accept Credit/Debit cards and UPI payments. All transactions are secured with 256-bit encryption.';
      } else if (lower.includes('price') || lower.includes('cost')) {
        reply = vehicle
          ? `The ${vehicle.name} is priced at ₹${vehicle.price_per_hour}/hour, ₹${vehicle.price_per_day}/day, ₹${vehicle.price_per_week}/week.`
          : 'Our vehicles start from ₹30/hour for bikes to ₹500/hour for luxury cars. Use our search to find the best deal!';
      } else if (lower.includes('insurance')) {
        reply = 'All our vehicles come with basic insurance coverage. Premium insurance add-on is available for ₹200/day.';
      } else if (lower.includes('location')) {
        reply = 'We have 10 pickup locations across Hyderabad including Banjara Hills, Hitech City, Gachibowli, and more!';
      } else {
        reply = 'I can help you with booking, pricing, locations, payment methods, and more. What would you like to know?';
      }
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    }, 800);
  };

  return (
    <div className="ai-panel card animate-slide-right">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-avatar">🤖</div>
        <div>
          <h3 className="ai-title">AI Assistant</h3>
          <p className="ai-sub">How can I help you?</p>
        </div>
        <div className="ai-online"><span /><span>Online</span></div>
      </div>

      {/* Suggestion chips */}
      <div className="ai-suggestions">
        {suggestions.map(s => (
          <button
            key={s.text}
            className="ai-chip"
            onClick={() => { setInput(s.text); }}
          >
            <span>{s.icon}</span> {s.text}
          </button>
        ))}
      </div>

      {/* Chat messages */}
      <div className="ai-messages">
        {messages.map((m, i) => (
          <div key={i} className={`ai-msg ${m.role}`}>
            {m.role === 'ai' && <span className="ai-dot">🤖</span>}
            <p>{m.text}</p>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="ai-input-wrap">
        <input
          type="text"
          className="ai-input"
          placeholder="Ask anything..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button className="ai-send-btn" onClick={handleSend}>
          <span>➤</span>
        </button>
      </div>

      {/* Quick actions */}
      {vehicle && (
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 12 }}
          onClick={() => nav(`/booking/${vehicle.id}`)}
        >
          🚗 Book {vehicle.name?.split(' ')[0]} Now
        </button>
      )}
    </div>
  );
}
