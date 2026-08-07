import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer animate-fade">
      <div className="container footer-content">
        <div className="footer-brand">
          <Link to="/dashboard" className="footer-logo">
            <div className="fl-icon">⬡</div>
            <div className="fl-text">
              <span className="fl-title">KARZONE</span>
              <span className="fl-subtitle">PREMIUM RENTALS</span>
            </div>
          </Link>
          <p className="footer-desc">
            Experience luxury and performance with our premium fleet of vehicles. 
            Book your next ride in seconds.
          </p>
        </div>

        <div className="footer-links">
          <div className="fl-group">
            <h4>Platform</h4>
            <Link to="/vehicles">Browse Fleet</Link>
            <Link to="/dashboard">My Dashboard</Link>
            <Link to="/bookings">Booking History</Link>
          </div>
          <div className="fl-group">
            <h4>Support</h4>
            <a href="#">Help Center</a>
            <a href="#">Terms of Service</a>
            <a href="#">Privacy Policy</a>
          </div>
          <div className="fl-group">
            <h4>Contact</h4>
            <a href="mailto:support@carrentalshyd.com">support@carrentalshyd.com</a>
            <a href="tel:+919000000000">+91 9000 000 000</a>
            <div className="social-links">
              <a href="#">𝕏</a>
              <a href="#">📸</a>
              <a href="#">💼</a>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container flex-between">
          <p>&copy; {new Date().getFullYear()} Car Rentals HYD. All rights reserved.</p>
          <div className="fb-trust">
            <span>🔒 Secured Payments</span>
            <span>⭐ 4.9/5 Rating</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
