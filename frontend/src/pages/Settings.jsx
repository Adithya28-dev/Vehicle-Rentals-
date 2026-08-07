import Sidebar from '../components/Sidebar';
import './Dashboard.css';

export default function Settings() {
  return (
    <div className="dashboard-root">
      <Sidebar />
      <main className="dashboard-main animate-fade">
        <div className="dash-header">
          <div>
            <h1 className="dash-welcome">App <span className="gradient-text">Settings</span></h1>
            <p className="dash-subtitle">Personalize your experience</p>
          </div>
        </div>

        <div className="card animate-fade stagger-1" style={{ maxWidth: 600, marginTop: 30 }}>
          <div className="settings-section" style={{ marginBottom: 30 }}>
            <h3>Preferences</h3>
            <hr style={{ border: '0', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '15px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <span>Enable Notifications</span>
              <input type="checkbox" defaultChecked />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <span>Dark Mode</span>
              <input type="checkbox" defaultChecked />
            </div>
          </div>

          <div className="settings-section">
            <h3>Support</h3>
            <hr style={{ border: '0', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '15px 0' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Version 1.0.0 (Stable)</p>
            <button className="btn btn-secondary" style={{ width: '100%' }}>Contact Support</button>
          </div>
        </div>
      </main>
    </div>
  );
}
