import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/api';
import toast from 'react-hot-toast';
import './Login.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await authAPI.register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      login(res.data.token, res.data.user);
      toast.success('Account created! Welcome to Car Rentals HYD 🎉');
      nav('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-bg">
        <div className="login-bg-overlay" />
        <div className="login-bg-car"><div className="car-silhouette">🏎️</div></div>
        {[...Array(6)].map((_, i) => <div key={i} className={`particle particle-${i + 1}`} />)}
      </div>

      <nav className="login-nav">
        <div className="login-nav-logo"><span className="logo-icon">⬡</span><span className="logo-text">KARZONE</span></div>
        <div className="login-nav-links">
          <a href="#">Reservations</a><a href="#">Vehicles</a>
          <a href="#">Locations</a><a href="#">Car Sales</a>
        </div>
        <Link to="/login" className="login-nav-btn">Sign In</Link>
      </nav>

      <div className="login-hero-text animate-slide-left" style={{ maxWidth: 500 }}>
        <p className="hero-sub">Join the Elite Fleet</p>
        <h1 className="hero-title">Start your<br /><span className="hero-accent">journey today.</span></h1>
        <p className="hero-desc">Create your account and unlock exclusive access to premium vehicles, flexible packages, and seamless booking.</p>
        <div className="hero-stats">
          {[['30m', 'Quick Booking'], ['24/7', 'Support'], ['100%', 'Secure']].map(([n, l]) => (
            <div key={l} className="stat"><span className="stat-num">{n}</span><span className="stat-label">{l}</span></div>
          ))}
        </div>
      </div>

      <div className="login-card-wrap animate-slide-right">
        <div className="login-card glass">
          <div className="login-card-header">
            <div className="login-logo-sm"><span>⬡</span></div>
            <h2>Create Account</h2>
            <p>Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="form-input-icon">
                <span className="icon">👤</span>
                <input type="text" className="form-input" placeholder="Your full name"
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="form-input-icon">
                <span className="icon">✉️</span>
                <input type="email" className="form-input" placeholder="your@email.com"
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="form-input-icon">
                <span className="icon">📱</span>
                <input type="tel" className="form-input" placeholder="+91 98765 43210"
                  value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-icon">
                <span className="icon">🔒</span>
                <input type="password" className="form-input" placeholder="Min. 6 characters"
                  value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="form-input-icon">
                <span className="icon">🔐</span>
                <input type="password" className="form-input" placeholder="Re-enter password"
                  value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} required />
              </div>
            </div>
            <button type="submit" className="btn btn-neon btn-lg login-submit" disabled={loading}>
              {loading ? <span className="spinner-sm" /> : null}
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>

          <p className="register-link" style={{marginTop: 20}}>
            Already have an account? <Link to="/login">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
