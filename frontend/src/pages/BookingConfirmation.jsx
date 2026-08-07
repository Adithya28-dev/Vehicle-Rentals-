import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingAPI, invoiceAPI } from '../api/api';
import toast from 'react-hot-toast';

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    bookingAPI.getBooking(bookingId)
      .then(r => setBooking(r.data.booking))
      .catch(() => toast.error('Booking not found'))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const downloadInvoice = async () => {
    setDownloading(true);
    try {
      const res = await invoiceAPI.download(bookingId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${booking.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Invoice downloaded!');
    } catch {
      toast.error('Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="page-loading" style={{ paddingTop: 68 }}><div className="spinner" /></div>;
  if (!booking) return <div className="page-loading" style={{ paddingTop: 68 }}><h3>Booking not found</h3></div>;

  return (
    <div className="container" style={{ paddingTop: 120, maxWidth: 600 }}>
      <div className="card animate-scale" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 20 }}>🎉</div>
        <h1 style={{ marginBottom: 12 }}>Booking Confirmed!</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 30 }}>
          Your {booking.vehicle_name} is ready for pickup. An email confirmation has been sent.
        </p>

        <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 12, border: '1px solid var(--border)', textAlign: 'left', marginBottom: 30 }}>
          <div className="flex-between" style={{ marginBottom: 10 }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Booking ID</span>
            <strong style={{ fontFamily: 'monospace' }}>#{booking.id.toString().padStart(4, '0')}</strong>
          </div>
          <div className="flex-between" style={{ marginBottom: 10 }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Vehicle</span>
            <strong>{booking.vehicle_name}</strong>
          </div>
          <div className="flex-between" style={{ marginBottom: 10 }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Pickup Time</span>
            <strong>{new Date(booking.start_time).toLocaleString()}</strong>
          </div>
          <div className="flex-between">
            <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Total Paid</span>
            <strong className="gradient-text">₹{Math.round(booking.total_price).toLocaleString()}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="btn btn-primary btn-lg" onClick={downloadInvoice} disabled={downloading}>
            {downloading ? 'Generating PDF...' : '📄 Download PDF Invoice'}
          </button>
          <Link to="/bookings" className="btn btn-outline btn-lg">View My Bookings</Link>
          <Link to="/dashboard" className="btn btn-ghost">← Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
