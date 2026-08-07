import { useNavigate, useLocation } from 'react-router-dom';
import { User, Car, ClipboardList, Calendar as CalendarIcon, Settings as SettingsIcon } from 'lucide-react';
import './Sidebar.css';

const icons = [
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Car, label: 'Vehicles', path: '/vehicles' },
  { icon: ClipboardList, label: 'Bookings', path: '/bookings' },
  { icon: CalendarIcon, label: 'Calendar', path: '/calendar' },
  { icon: SettingsIcon, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const nav = useNavigate();
  const loc = useLocation();

  return (
    <aside className="sidebar">
      {icons.map(({ icon: Icon, label, path }) => (
        <button
          key={label}
          className={`sidebar-btn ${loc.pathname === path ? 'active' : ''}`}
          onClick={() => nav(path)}
          title={label}
        >
          <div className="sb-icon-wrapper">
            <Icon size={24} strokeWidth={2.5} />
          </div>
          <span className="sb-label">{label}</span>
        </button>
      ))}
    </aside>
  );
}
