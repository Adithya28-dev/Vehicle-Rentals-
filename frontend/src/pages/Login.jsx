import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/api';
import toast from 'react-hot-toast';
import './Login.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loginAs, setLoginAs] = useState('user');
  const { login } = useAuth();
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login({ email: form.email, password: form.password });
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}! 🚗`);
      nav(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    setLoginAs(role);
    setForm({
      email: role === 'admin' ? 'admin@carrentalshyd.com' : 'user@carrentalshyd.com',
      password: role === 'admin' ? 'Admin@123' : 'User@123',
      remember: false
    });
  };

  return (
    <div className="login-root">
      {/* Background with luxury car */}
      <div className="login-bg">
        <div className="login-bg-overlay" />
        <div className="login-bg-car">
          <div className="car-silhouette">🚗</div>
        </div>
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`} />
        ))}
      </div>

      {/* Top Navigation */}
      <nav className="login-nav">
        <div className="login-nav-logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-text">KARZONE</span>
        </div>
        <div className="login-nav-links">
          <a href="#">Reservations</a>
          <a href="#">Vehicles</a>
          <a href="#">Locations</a>
          <a href="#">Car Sales</a>
          <a href="#">For Business</a>
        </div>
        <Link to="/register" className="login-nav-btn">Contact Us</Link>
      </nav>

      {/* Hero Text */}
      <div className="login-hero-text animate-slide-left">
        <p className="hero-sub">Premium Vehicle Rental</p>
        <h1 className="hero-title">
          Rent the luxury.<br />
          <span className="hero-accent">Own the thrill.</span>
        </h1>
        <p className="hero-desc">
          Hyderabad's finest fleet of cars & bikes available on demand.<br />
          From economy to ultra-luxury — drive your dream.
        </p>
        <div className="hero-stats">
          {[['500+', 'Vehicles'], ['50K+', 'Happy Riders'], ['10+', 'Locations']].map(([n, l]) => (
            <div key={l} className="stat">
              <span className="stat-num">{n}</span>
              <span className="stat-label">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Login Card */}
      <div className="login-card-wrap animate-slide-right">
        <div className="login-card glass">
          <div className="login-card-header">
            <div className="login-logo-sm">
              <span>⬡</span>
            </div>
            <h2>Welcome Back</h2>
            <p>Sign in to your account</p>
          </div>

          {/* Quick login buttons */}
          <div className="quick-login">
            <button
              className={`quick-btn ${loginAs === 'user' ? 'active' : ''}`}
              onClick={() => fillDemo('user')}
              type="button"
            >
              <span>👤</span> User
            </button>
            <button
              className={`quick-btn ${loginAs === 'admin' ? 'active' : ''}`}
              onClick={() => fillDemo('admin')}
              type="button"
            >
              <span>🛡️</span> Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="form-input-icon">
                <span className="icon">✉️</span>
                <input
                  type="email"
                  className="form-input"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-icon">
                <span className="icon">🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowPass(!showPass)}
                >{showPass ? '🙈' : '👁️'}</button>
              </div>
            </div>

            <div className="form-row">
              <label className="checkbox-label">
                <input type="checkbox" checked={form.remember}
                  onChange={e => setForm({ ...form, remember: e.target.checked })} />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>

            <button type="submit" className="btn btn-neon btn-lg login-submit" disabled={loading}>
              {loading ? <span className="spinner-sm" /> : null}
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>

            <div className="divider-text"><span>or continue with</span></div>

            <div className="social-btns">
              <button type="button" className="social-btn">
                <span>G</span> Google
              </button>
              <button type="button" className="social-btn">
                <span>🍎</span> Apple
              </button>
            </div>
          </form>

          <p className="register-link">
            Don't have an account?{' '}
            <Link to="/register">Create account →</Link>
          </p>

          {/* Demo hint */}
          <div className="demo-hint">
            <span>🎯</span>
            <span>Click <strong>User</strong> or <strong>Admin</strong> above for demo credentials</span>
          </div>
        </div>
      </div>
    </div>
  );
}
