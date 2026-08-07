import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import './Dashboard.css'; // Reuse dashboard styles for consistency

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="dashboard-root">
      <Sidebar />
      <main className="dashboard-main animate-fade">
        <div className="dash-header">
          <div>
            <h1 className="dash-welcome">User <span className="gradient-text">Profile</span></h1>
            <p className="dash-subtitle">Manage your account and personal information</p>
          </div>
        </div>

        <div className="card animate-fade stagger-1" style={{ maxWidth: 600, marginTop: 30 }}>
          <div className="profile-top" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 30 }}>
            <div className="profile-avatar" style={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem'
            }}>
              {user?.name?.[0] || 'U'}
            </div>
            <div>
              <h2 style={{ margin: 0 }}>{user?.name}</h2>
              <p style={{ color: 'var(--text-muted)', margin: '5px 0' }}>{user?.email}</p>
              <span className="badge badge-primary">{user?.role}</span>
            </div>
          </div>

          <div className="profile-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="info-group">
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 5 }}>Full Name</label>
              <input type="text" className="form-control" defaultValue={user?.name} readOnly />
            </div>
            <div className="info-group">
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 5 }}>Email Address</label>
              <input type="text" className="form-control" defaultValue={user?.email} readOnly />
            </div>
            <div className="info-group">
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 5 }}>Member Since</label>
              <input type="text" className="form-control" defaultValue="March 2026" readOnly />
            </div>
            <div className="info-group">
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 5 }}>Account Status</label>
              <input type="text" className="form-control" defaultValue="Active" readOnly />
            </div>
          </div>

          <button className="btn btn-primary" style={{ marginTop: 30, width: '100%' }}>Update Profile</button>
        </div>
      </main>
    </div>
  );
}
