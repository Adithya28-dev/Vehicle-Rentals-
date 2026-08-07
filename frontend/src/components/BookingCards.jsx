import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BookingCards.css';

export default function BookingCards({ vehicle, locations = [] }) {
  const nav = useNavigate();
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const fmt = d => d.toISOString().slice(0, 16);

  const [startTime, setStartTime] = useState(fmt(today));
  const [endTime, setEndTime] = useState(fmt(tomorrow));
  const [locationId, setLocationId] = useState('');
  const [payMethod, setPayMethod] = useState('card');

  const hours = Math.max(1, (new Date(endTime) - new Date(startTime)) / 3600000);
  const estimate = vehicle ? Math.round(vehicle.price_per_hour * hours) : 0;

  return (
    <div className="booking-cards">
      {/* Location Card */}
      <div className="bc-card card">
        <div className="bc-card-icon">📍</div>
        <h4>My Location</h4>
        <select
          value={locationId}
          onChange={e => setLocationId(e.target.value)}
          className="bc-select"
        >
          <option value="">Select pickup location</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.area}</option>
          ))}
        </select>
        <p className="bc-city">Hyderabad, Telangana</p>
        <div className="bc-map-preview">🗺️</div>
      </div>

      {/* Date Card */}
      <div className="bc-card card">
        <div className="bc-card-icon">📅</div>
        <h4>My Dates</h4>
        <div className="bc-date-inputs">
          <div className="bc-date-group">
            <label>Pickup</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="bc-date-input"
            />
          </div>
          <div className="bc-date-group">
            <label>Return</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="bc-date-input"
            />
          </div>
        </div>
        <div className="bc-duration">
          <span>⏱️</span>
          <span>{hours.toFixed(1)} hours</span>
          {vehicle && <span className="bc-est">≈ ₹{estimate.toLocaleString()}</span>}
        </div>
      </div>

      {/* Payment Card */}
      <div className="bc-card card">
        <div className="bc-card-icon">💳</div>
        <h4>Payment Method</h4>
        <div className="bc-pay-methods">
          <button
            className={`bc-pay-btn ${payMethod === 'card' ? 'active' : ''}`}
            onClick={() => setPayMethod('card')}
          >💳 Card</button>
          <button
            className={`bc-pay-btn ${payMethod === 'upi' ? 'active' : ''}`}
            onClick={() => setPayMethod('upi')}
          >📱 UPI</button>
        </div>
        <div className={`bc-card-display ${payMethod === 'upi' ? 'upi' : ''}`}>
          {payMethod === 'card' ? (
            <>
              <div className="credit-card-chip">▬</div>
              <div className="credit-card-num">•••• •••• •••• 4242</div>
              <div className="credit-card-row">
                <span>KARZONE PAY</span>
                <span>12/27</span>
              </div>
            </>
          ) : (
            <div className="upi-display">
              <div className="upi-icon">📱</div>
              <div>UPI Payment Ready</div>
              <div className="upi-id">user@upi</div>
            </div>
          )}
        </div>
        <div className="bc-status"><span className="bc-dot" />Secure Payment Enabled</div>
      </div>

      {/* Book now banner */}
      {vehicle && (
        <div
          className="bc-book-now card"
          onClick={() => nav(`/booking/${vehicle.id}`)}
        >
          <span className="bc-bn-icon">🚗</span>
          <div>
            <p className="bc-bn-label">Ready to go?</p>
            <p className="bc-bn-sub">Book now in 2 minutes</p>
          </div>
          <span className="bc-bn-arrow">→</span>
        </div>
      )}
    </div>
  );
}
