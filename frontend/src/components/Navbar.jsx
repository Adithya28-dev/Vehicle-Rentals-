import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar({ theme, setTheme }) {
  const { user, logout, isAdmin } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    nav('/login');
  };

  const isActive = (path) => loc.pathname === path || loc.pathname.startsWith(path + '/');

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to={isAdmin ? '/admin' : '/dashboard'} className="navbar-logo">
          <div className="navbar-logo-icon">⬡</div>
          <div className="navbar-logo-text">
            <span className="brand-primary">CAR</span>
            <span className="brand-secondary">RENTALS HYD</span>
          </div>
        </Link>

        {/* Center Nav */}
        <nav className="navbar-links hide-mobile">
          {isAdmin ? (
            <>
              <Link className={`nav-link ${isActive('/admin') && loc.pathname === '/admin' ? 'active' : ''}`} to="/admin">Dashboard</Link>
              <Link className={`nav-link ${isActive('/admin/vehicles') ? 'active' : ''}`} to="/admin/vehicles">Vehicles</Link>
              <Link className={`nav-link ${isActive('/admin/bookings') ? 'active' : ''}`} to="/admin/bookings">Bookings</Link>
              <Link className={`nav-link ${isActive('/admin/payments') ? 'active' : ''}`} to="/admin/payments">Payments</Link>
              <Link className={`nav-link ${isActive('/admin/locations') ? 'active' : ''}`} to="/admin/locations">Locations</Link>
              <Link className={`nav-link ${isActive('/admin/support') ? 'active' : ''}`} to="/admin/support">Support</Link>
            </>
          ) : (
            <>
              <Link className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} to="/dashboard">Home</Link>
              <Link className={`nav-link ${isActive('/vehicles') ? 'active' : ''}`} to="/vehicles">Vehicles</Link>
              <Link className={`nav-link ${isActive('/bookings') ? 'active' : ''}`} to="/bookings">My Bookings</Link>
            </>
          )}
        </nav>

        {/* Right side */}
        <div className="navbar-right">
          {/* Location chip */}
          <div className="location-chip hide-mobile">
            <span>📍</span>
            <span>Hyderabad</span>
          </div>

          {/* Theme toggle */}
          <button
            className="btn btn-icon theme-toggle"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Notifications */}
          <button className="btn btn-icon notif-btn">
            <span>🔔</span>
            <span className="notif-dot" />
          </button>

          {/* User avatar */}
          <div className="user-menu-wrap">
            <button className="user-avatar-btn" onClick={() => setUserMenu(!userMenu)}>
              <div className="user-avatar">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="user-name hide-mobile">{user?.name?.split(' ')[0]}</span>
              <span className="chevron">▾</span>
            </button>

            {userMenu && (
              <div className="user-dropdown animate-scale" onClick={() => setUserMenu(false)}>
                <div className="dropdown-header">
                  <strong>{user?.name}</strong>
                  <span className="badge badge-primary">{user?.role}</span>
                </div>
                <div className="dropdown-email">{user?.email}</div>
                <div className="dropdown-divider" />
                {!isAdmin && (
                  <>
                    <Link to="/dashboard" className="dropdown-item">🏠 Dashboard</Link>
                    <Link to="/vehicles" className="dropdown-item">🚗 Browse Vehicles</Link>
                    <Link to="/bookings" className="dropdown-item">📋 My Bookings</Link>
                  </>
                )}
                {isAdmin && (
                  <>
                    <Link to="/admin" className="dropdown-item">📊 Admin Dashboard</Link>
                    <Link to="/admin/vehicles" className="dropdown-item">🚗 Manage Vehicles</Link>
                    <Link to="/admin/bookings" className="dropdown-item">📋 Manage Bookings</Link>
                    <Link to="/admin/support" className="dropdown-item">💬 Customer Support</Link>
                  </>
                )}
                <div className="dropdown-divider" />
                <button className="dropdown-item dropdown-logout" onClick={handleLogout}>🚪 Sign Out</button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu glass">
          {isAdmin ? (
            <>
              <Link to="/admin" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/admin/vehicles" onClick={() => setMenuOpen(false)}>Vehicles</Link>
              <Link to="/admin/bookings" onClick={() => setMenuOpen(false)}>Bookings</Link>
              <Link to="/admin/payments" onClick={() => setMenuOpen(false)}>Payments</Link>
              <Link to="/admin/support" onClick={() => setMenuOpen(false)}>Support</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link to="/vehicles" onClick={() => setMenuOpen(false)}>Vehicles</Link>
              <Link to="/bookings" onClick={() => setMenuOpen(false)}>My Bookings</Link>
            </>
          )}
          <button onClick={handleLogout} style={{ color: '#EF4444' }}>Sign Out</button>
        </div>
      )}
    </header>
  );
}
