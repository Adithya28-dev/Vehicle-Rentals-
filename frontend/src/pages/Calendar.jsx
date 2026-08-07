import Sidebar from '../components/Sidebar';
import './Dashboard.css';

export default function Calendar() {
  return (
    <div className="dashboard-root">
      <Sidebar />
      <main className="dashboard-main animate-fade">
        <div className="dash-header">
          <div>
            <h1 className="dash-welcome">Booking <span className="gradient-text">Calendar</span></h1>
            <p className="dash-subtitle">View and manage your upcoming rentals</p>
          </div>
        </div>

        <div className="card animate-fade stagger-1" style={{ marginTop: 30 }}>
          <div className="calendar-placeholder" style={{ 
            height: 400, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            border: '2px dashed rgba(124,58,237,0.2)',
            borderRadius: '12px',
            color: 'var(--text-muted)'
          }}>
            <span style={{ fontSize: '3rem', marginBottom: 20 }}>📅</span>
            <h3>Interactive Calendar Coming Soon</h3>
            <p>We are integrating with major calendar providers.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
