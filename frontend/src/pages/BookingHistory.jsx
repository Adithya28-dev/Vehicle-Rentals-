import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingAPI, invoiceAPI, reviewAPI } from '../api/api';
import toast from 'react-hot-toast';
import './BookingHistory.css';

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(null); // { bookingId, vehicleId, rating, comment }

  const fetchBookings = async () => {
    try {
      const res = await bookingAPI.myBookings();
      setBookings(res.data.bookings || []);
    } catch {
      toast.error('Failed to load bookings');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await bookingAPI.cancel(id);
      toast.success('Booking cancelled');
      fetchBookings();
    } catch (err) { toast.error(err.response?.data?.error || 'Cancellation failed'); }
  };

  const handleDownloadInvoice = async (bookingId, invoiceNum) => {
    try {
      const res = await invoiceAPI.download(bookingId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoiceNum || 'invoice'}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Invoice downloaded');
    } catch { toast.error('Failed to download invoice'); }
  };

  const submitReview = async () => {
    if (!reviewModal.rating) return toast.error('Please select a rating');
    try {
      await reviewAPI.submit({
        vehicle_id: reviewModal.vehicleId,
        booking_id: reviewModal.bookingId,
        rating: reviewModal.rating,
        comment: reviewModal.comment
      });
      toast.success('Review submitted successfully! 🌟');
      setReviewModal(null);
      fetchBookings(); // Refresh to hide review button if needed
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    }
  };

  if (loading) return <div className="page-loading" style={{ paddingTop: 68 }}><div className="spinner" /></div>;

  return (
    <div className="bh-page" style={{ paddingTop: 90 }}>
      <div className="container" style={{ maxWidth: 1000 }}>
        <h1 style={{ marginBottom: 28 }}>My <span className="gradient-text">Bookings</span></h1>

        {bookings.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: '3rem' }}>📋</span>
            <h3>No bookings yet</h3>
            <p style={{ color: 'var(--text-muted)' }}>You haven't made any reservations.</p>
            <Link to="/vehicles" className="btn btn-primary mt-4">Browse Vehicles</Link>
          </div>
        ) : (
          <div className="bh-list">
            {bookings.map((b, i) => {
              const start = new Date(b.start_time);
              const end = new Date(b.end_time);
              const isUpcoming = b.status === 'confirmed' && start > new Date();

              return (
                <div key={b.id} className={`card bh-card animate-fade stagger-${(i % 5) + 1}`}>
                  <div className="bh-card-header">
                    <div className="bh-id">booking #{b.id.toString().padStart(4, '0')}</div>
                    <div className={`badge ${b.status === 'confirmed' ? 'badge-primary' : b.status === 'active' ? 'badge-success' : b.status === 'cancelled' ? 'badge-error' : 'badge-warning'}`}>
                      {b.status.toUpperCase()}
                    </div>
                  </div>

                  <div className="bh-card-body">
                    <div className="bh-vehicle-info">
                      <div className="bh-v-icon">{b.vehicle_name.toLowerCase().includes('bike') || b.vehicle_name.toLowerCase().includes('royal') ? '🏍️' : '🚗'}</div>
                      <div>
                        <Link to={`/vehicles/${b.vehicle_id}`} className="bh-v-name">{b.vehicle_name}</Link>
                        <p className="bh-v-loc">📍 {b.pickup_location || 'Standard Location'}</p>
                      </div>
                    </div>

                    <div className="bh-dates">
                      <div className="bh-date-box">
                        <span className="bh-date-lbl">PICKUP</span>
                        <span className="bh-date-val">{start.toLocaleDateString()}</span>
                        <span className="bh-date-time">{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="bh-date-arrow">→</div>
                      <div className="bh-date-box">
                        <span className="bh-date-lbl">RETURN</span>
                        <span className="bh-date-val">{end.toLocaleDateString()}</span>
                        <span className="bh-date-time">{end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="bh-payment">
                      <div className="bh-pay-lbl">TOTAL AMOUNT</div>
                      <div className="bh-pay-val">₹{Math.round(b.total_price).toLocaleString()}</div>
                      <div className={`bh-pay-status ${b.payment_status === 'success' ? 'success' : 'pending'}`}>
                        {b.payment_status === 'success' ? '✅ Paid' : '⏳ Pending Payment'}
                      </div>
                    </div>
                  </div>

                  <div className="bh-card-actions">
                    {/* Action logic based on status and time */}
                    {b.status === 'pending' && b.payment_status !== 'success' && (
                      <Link to={`/payment/${b.id}`} className="btn btn-primary btn-sm">Complete Payment</Link>
                    )}

                    {isUpcoming && b.status !== 'cancelled' && (
                      <button className="btn btn-outline btn-sm btn-error-hover" onClick={() => handleCancel(b.id)}>
                        Cancel Booking
                      </button>
                    )}

                    {b.invoice_number && (
                      <button className="btn btn-outline btn-sm" onClick={() => handleDownloadInvoice(b.id, b.invoice_number)}>
                        📄 Download Invoice
                      </button>
                    )}

                    {b.status === 'completed' && (
                      <button className="btn btn-primary btn-sm" onClick={() => setReviewModal({ bookingId: b.id, vehicleId: b.vehicle_id, rating: 0, comment: '' })}>
                        ⭐ Rate Vehicle
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="modal-backdrop">
          <div className="modal-content card animate-scale" style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: 16 }}>Rate Your Experience</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
              How was your experience with the vehicle? Your feedback helps others!
            </p>

            <div className="review-stars-select" style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  className="btn btn-ghost"
                  style={{ fontSize: '2rem', padding: '0 8px', color: star <= reviewModal.rating ? 'var(--gold)' : 'var(--border)' }}
                  onClick={() => setReviewModal(m => ({ ...m, rating: star }))}
                >
                  ★
                </button>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Comment (optional)</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Tell us what you loved..."
                value={reviewModal.comment}
                onChange={e => setReviewModal(m => ({ ...m, comment: e.target.value }))}
              />
            </div>

            <div className="flex-between mt-4">
              <button className="btn btn-ghost" onClick={() => setReviewModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitReview} disabled={!reviewModal.rating}>
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
