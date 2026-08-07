import { useState, useEffect } from 'react';
import { adminAPI } from '../api/api';
import './Admin.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.dashboardStats()
      .then(r => setStats(r.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) return <div className="page-loading" style={{ paddingTop: 68 }}><div className="spinner" /></div>;

  const statCards = [
    { label: 'Total Revenue', value: `₹${Math.round(stats.total_revenue).toLocaleString()}`, icon: '💰' },
    { label: 'Active Bookings', value: stats.active_bookings, icon: '📋' },
    { label: 'Total Vehicles', value: stats.total_vehicles, icon: '🚗' },
    { label: 'Total Users', value: stats.total_users, icon: '👥' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin <span className="gradient-text">Dashboard</span></h1>
        <p style={{ color: 'var(--text-muted)' }}>Overview of your rental platform</p>
      </div>

      <div className="admin-stats">
        {statCards.map((c, i) => (
          <div key={i} className={`stat-card animate-fade stagger-${i + 1}`}>
            <div className="stat-icon">{c.icon}</div>
            <div className="stat-info">
              <div className="stat-val">{c.value}</div>
              <div className="stat-lbl">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-table-wrap card animate-fade stagger-5" style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Recent Bookings (Snapshot)</h3>
        {stats.active_bookings === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No active bookings to show.</p>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg)', borderRadius: 12 }}>
            <span style={{ fontSize: '2rem' }}>📊</span>
            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Go to Manage Bookings to view detailed lists.</p>
          </div>
        )}
      </div>
    </div>
  );
}
