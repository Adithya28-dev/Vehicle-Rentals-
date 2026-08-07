import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingAPI, paymentAPI } from '../api/api';
import toast from 'react-hot-toast';
import './Payment.css';

export default function Payment() {
  const { bookingId } = useParams();
  const nav = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payMethod, setPayMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState({
    cardName: '', cardNumber: '', cardExpiry: '', cardCvv: '',
    upiId: '',
  });

  useEffect(() => {
    bookingAPI.getBooking(bookingId)
      .then(r => setBooking(r.data.booking))
      .catch(() => toast.error('Booking not found'))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handlePay = async () => {
    if (payMethod === 'card') {
      if (!form.cardNumber || form.cardNumber.replace(/\s/g, '').length < 16) return toast.error('Enter a valid 16-digit card number');
      if (!form.cardExpiry) return toast.error('Enter card expiry');
      if (!form.cardCvv || form.cardCvv.length < 3) return toast.error('Enter valid CVV');
    } else {
      if (!form.upiId || !form.upiId.includes('@')) return toast.error('Enter valid UPI ID (e.g. name@upi)');
    }

    setProcessing(true);
    try {
      const payload = { booking_id: parseInt(bookingId), method: payMethod };
      if (payMethod === 'card') {
        payload.card_number = form.cardNumber.replace(/\s/g, '');
        payload.card_expiry = form.cardExpiry;
        payload.card_cvv = form.cardCvv;
      } else {
        payload.upi_id = form.upiId;
      }
      await paymentAPI.process(payload);
      toast.success('🎉 Payment successful!');
      nav(`/booking-confirmation/${bookingId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally { setProcessing(false); }
  };

  const fmtCard = (v) => v.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);

  if (loading) return <div className="page-loading" style={{ paddingTop: 68 }}><div className="spinner" /></div>;
  if (!booking) return <div className="page-loading" style={{ paddingTop: 68 }}><h3>Booking not found</h3></div>;

  return (
    <div className="payment-page" style={{ paddingTop: 90 }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <button className="btn btn-ghost" onClick={() => nav('/bookings')} style={{ marginBottom: 20 }}>← My Bookings</button>
        <h1 style={{ marginBottom: 28 }}>💳 Complete <span className="gradient-text">Payment</span></h1>

        <div className="payment-layout">
          {/* Payment form */}
          <div className="card pay-card animate-fade">
            <h3 style={{ marginBottom: 20 }}>Choose Payment Method</h3>

            {/* Method tabs */}
            <div className="pay-tabs">
              <button className={`pay-tab ${payMethod === 'card' ? 'active' : ''}`} onClick={() => setPayMethod('card')}>
                <span>💳</span> Credit / Debit Card
              </button>
              <button className={`pay-tab ${payMethod === 'upi' ? 'active' : ''}`} onClick={() => setPayMethod('upi')}>
                <span>📱</span> UPI Payment
              </button>
            </div>

            {payMethod === 'card' && (
              <div className="animate-fade pay-form">
                {/* Card preview */}
                <div className="card-preview">
                  <div className="card-preview-top">
                    <div className="cp-chip">▬</div>
                    <div className="cp-brand">KARZONE PAY</div>
                  </div>
                  <div className="cp-number">{form.cardNumber || '•••• •••• •••• ••••'}</div>
                  <div className="cp-bottom">
                    <div>
                      <div className="cp-label">Card Holder</div>
                      <div className="cp-value">{form.cardName || 'YOUR NAME'}</div>
                    </div>
                    <div>
                      <div className="cp-label">Expires</div>
                      <div className="cp-value">{form.cardExpiry || 'MM/YY'}</div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Cardholder Name</label>
                  <input className="form-input" placeholder="Name on card"
                    value={form.cardName} onChange={e => setForm(f => ({ ...f, cardName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <input className="form-input" placeholder="1234 5678 9012 3456" maxLength={19}
                    value={form.cardNumber}
                    onChange={e => setForm(f => ({ ...f, cardNumber: fmtCard(e.target.value) }))} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input className="form-input" placeholder="MM/YY" maxLength={5}
                      value={form.cardExpiry}
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g, '');
                        if (v.length >= 2) v = v.slice(0,2) + '/' + v.slice(2,4);
                        setForm(f => ({ ...f, cardExpiry: v }));
                      }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVV</label>
                    <input className="form-input" placeholder="•••" maxLength={4} type="password"
                      value={form.cardCvv}
                      onChange={e => setForm(f => ({ ...f, cardCvv: e.target.value.replace(/\D/g, '') }))} />
                  </div>
                </div>
              </div>
            )}

            {payMethod === 'upi' && (
              <div className="animate-fade pay-form">
                <div className="upi-visual">
                  <div className="upi-qr">📱</div>
                  <p>Pay using any UPI app</p>
                  <div className="upi-apps">
                    {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map(a => (
                      <span key={a} className="upi-app-tag">{a}</span>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Your UPI ID</label>
                  <input className="form-input" placeholder="yourname@upi / 9876543210@paytm"
                    value={form.upiId} onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))} />
                </div>
              </div>
            )}

            <div className="pay-security">
              <span>🔒</span><span>256-bit SSL secured · Your payment info is safe</span>
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%' }}
              onClick={handlePay} disabled={processing}>
              {processing ? (
                <><span className="spinner-sm" /> Processing payment...</>
              ) : (
                `Pay ₹${Math.round(booking.total_price).toLocaleString()} Now →`
              )}
            </button>
          </div>

          {/* Order summary */}
          <div className="pay-summary">
            <div className="card pay-order">
              <h4>Order Summary</h4>
              <div className="divider" />
              <div className="po-row"><span>Vehicle</span><strong>{booking.vehicle_name}</strong></div>
              <div className="po-row"><span>Pickup</span><strong>{new Date(booking.start_time).toLocaleDateString()}</strong></div>
              <div className="po-row"><span>Return</span><strong>{new Date(booking.end_time).toLocaleDateString()}</strong></div>
              <div className="po-row"><span>Duration</span><strong>{booking.total_hours?.toFixed(1)} hrs</strong></div>
              {booking.package_name && <div className="po-row"><span>Package</span><strong>{booking.package_name}</strong></div>}
              <div className="divider" />
              {booking.discount_amount > 0 && (
                <div className="po-row" style={{ color: 'var(--success)' }}>
                  <span>Discount</span>
                  <strong>-₹{Math.round(booking.discount_amount).toLocaleString()}</strong>
                </div>
              )}
              <div className="po-total">
                <span>Total</span>
                <span className="gradient-text">₹{Math.round(booking.total_price).toLocaleString()}</span>
              </div>
            </div>

            <div className="card pay-trust">
              <div className="trust-item"><span>✅</span><span>Free cancellation (2hrs)</span></div>
              <div className="trust-item"><span>🛡️</span><span>Basic insurance included</span></div>
              <div className="trust-item"><span>📞</span><span>24/7 roadside assistance</span></div>
              <div className="trust-item"><span>📄</span><span>Instant PDF invoice</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
