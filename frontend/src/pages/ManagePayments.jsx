import { useState, useEffect } from 'react';
import { adminAPI, invoiceAPI } from '../api/api';
import toast from 'react-hot-toast';
import './Admin.css';

export default function ManagePayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await adminAPI.payments();
      setPayments(res.data.payments || []);
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
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

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Manage <span className="gradient-text">Payments</span></h1>
      </div>

      <div className="admin-table-wrap animate-fade">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th><th>User</th><th>Booking</th><th>Invoice</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id}>
                <td style={{ fontFamily: 'monospace', color: 'var(--text-dim)' }}>#{p.id}</td>
                <td>
                  <strong>{p.user_name}</strong><br />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.user_email}</span>
                </td>
                <td><span style={{ fontFamily: 'monospace', color: 'var(--text-dim)' }}>#{p.booking_id}</span></td>
                <td>
                  {p.invoice_number ? (
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDownloadInvoice(p.booking_id, p.invoice_number)}>
                      📄 {p.invoice_number}
                    </button>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
                  )}
                </td>
                <td>
                  <span className="badge badge-primary">{p.payment_method?.toUpperCase()}</span>
                </td>
                <td>
                  <strong style={{ color: 'var(--success)' }}>₹{Math.round(p.amount).toLocaleString()}</strong>
                </td>
                <td>
                  <span className={`badge ${p.status === 'success' ? 'badge-success' : 'badge-warning'}`}>
                    {p.status}
                  </span>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(p.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No payments found.</div>}
      </div>
    </div>
  );
}
