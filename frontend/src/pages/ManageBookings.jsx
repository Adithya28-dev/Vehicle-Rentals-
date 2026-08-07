import { useState, useEffect } from 'react';
import { adminAPI, invoiceAPI } from '../api/api';
import toast from 'react-hot-toast';
import './Admin.css';

export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await adminAPI.bookings();
      setBookings(res.data.bookings || []);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await adminAPI.updateBookingStatus(id, status);
      toast.success(`Booking marked as ${status}`);
      fetchData();
    } catch { toast.error('Failed to update status'); }
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

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Manage <span className="gradient-text">Bookings</span></h1>
      </div>

      <div className="admin-table-wrap animate-fade">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th><th>User</th><th>Vehicle & Dates</th><th>Price</th><th>Invoice</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => {
              const start = new Date(b.start_time);
              const end = new Date(b.end_time);
              return (
                <tr key={b.id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-dim)' }}>#{b.id}</td>
                  <td>
                    <strong>{b.user_name}</strong><br />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.user_email}</span>
                  </td>
                  <td>
                    <strong>{b.vehicle_name}</strong><br />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {start.toLocaleDateString()} to {end.toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>₹{Math.round(b.total_price).toLocaleString()}</span><br />
                    <span style={{ fontSize: '0.7rem' }} className={`badge ${b.payment_status === 'success' ? 'badge-success' : 'badge-warning'}`}>
                      {b.payment_status}
                    </span>
                  </td>
                  <td>
                    {b.invoice_number ? (
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDownloadInvoice(b.id, b.invoice_number)}>
                        📄 {b.invoice_number}
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Not generated</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${b.status === 'confirmed' ? 'badge-primary' : b.status === 'completed' ? 'badge-success' : b.status === 'cancelled' ? 'badge-error' : 'badge-warning'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td>
                    <select
                      className="form-input"
                      style={{ padding: '6px 10px', fontSize: '0.8rem', minWidth: 120 }}
                      value={b.status}
                      onChange={e => updateStatus(b.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {bookings.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No bookings found.</div>}
      </div>
    </div>
  );
}
