import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { vehicleAPI } from '../api/api';
import Sidebar from '../components/Sidebar';
import VehicleDisplay from '../components/VehicleDisplay';
import AssistantPanel from '../components/AssistantPanel';
import BookingCards from '../components/BookingCards';
import { resolveImageUrl } from '../utils/imageHelper';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');

  const fetchVehicles = (locId) => {
    setLoading(true);
    vehicleAPI.list({ location_id: locId })
      .then(res => {
        const v = res.data.vehicles || [];
        setVehicles(v);
        setFeatured(v[0] || null);
        setFeaturedIdx(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    vehicleAPI.locations().then(res => setLocations(res.data.locations || []));
    fetchVehicles('');
  }, []);

  useEffect(() => {
    if (vehicles.length === 0) return;
    const timer = setInterval(() => {
      setFeaturedIdx(prev => {
        const next = (prev + 1) % Math.min(vehicles.length, 5);
        setFeatured(vehicles[next]);
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [vehicles]);

  const handleLocationChange = (e) => {
    const locId = e.target.value;
    setSelectedLocation(locId);
    fetchVehicles(locId);
  };

  if (loading && vehicles.length === 0) return (
    <div className="page-loading" style={{ paddingTop: 100 }}>
      <div className="spinner" /><p style={{ color: 'var(--text-muted)' }}>Loading your dashboard...</p>
    </div>
  );

  return (
    <div className="dashboard-root">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header bar */}
        <div className="dash-header animate-fade">
          <div>
            <h1 className="dash-welcome">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},
              <span className="gradient-text"> {user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="dash-subtitle">Find your perfect ride for today</p>
          </div>
          <div className="dash-header-actions">
            <div className="location-selector">
              <span>📍</span>
              <select value={selectedLocation} onChange={handleLocationChange}>
                <option value="">All Locations</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.area}</option>)}
              </select>
            </div>
            <Link to={`/vehicles${selectedLocation ? `?location_id=${selectedLocation}` : ''}`} className="btn btn-primary">Browse All Vehicles →</Link>
          </div>
        </div>

        {/* Hero vehicle display */}
        <div className="dash-center">
          <VehicleDisplay vehicle={featured} />

          {/* Vehicle selector dots */}
          <div className="vehicle-dots">
            {vehicles.slice(0, 5).map((v, i) => (
              <button
                key={v.id}
                className={`dot ${i === featuredIdx ? 'active' : ''}`}
                onClick={() => { setFeaturedIdx(i); setFeatured(v); }}
                title={v.name}
              />
            ))}
          </div>
        </div>

        {/* Bottom booking cards */}
        <BookingCards vehicle={featured} locations={locations} />

        {/* Featured vehicles grid */}
        <section className="dash-vehicles-section animate-fade stagger-3">
          <div className="section-header">
            <h2>Featured Vehicles</h2>
            <Link to="/vehicles" className="see-all">See all →</Link>
          </div>
          <div className="vehicles-grid">
            {vehicles.slice(0, 4).map((v, i) => (
              <div
                key={v.id}
                className={`vehicle-mini-card card animate-fade stagger-${i + 1}`}
                onClick={() => nav(`/vehicles/${v.id}`)}
              >
                <div className="vmc-top">
                  {v.image_url ? (
                    <img 
                      src={resolveImageUrl(v.image_url)} 
                      alt={v.name} 
                      className="vmc-img"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="vmc-icon">{v.type_name === 'Bike' ? '🏍️' : '🚗'}</div>
                  )}
                  <div className={`badge ${v.status === 'available' ? 'badge-success' : 'badge-warning'}`}>
                    {v.status}
                  </div>
                </div>
                <h4 className="vmc-name">{v.name}</h4>
                <p className="vmc-location">📍 {v.location_area}</p>
                <div className="vmc-meta">
                  <span>⛽ {v.fuel_type}</span>
                  <span>⚙️ {v.transmission}</span>
                  <span>💺 {v.seats}</span>
                </div>
                <div className="vmc-price-row">
                  <div>
                    <span className="vmc-price">₹{v.price_per_hour}</span>
                    <span className="vmc-price-label">/hr</span>
                  </div>
                  <div className="vmc-rating">
                    ⭐ {v.rating > 0 ? v.rating.toFixed(1) : '4.5'}
                    <span>({v.review_count || 0})</span>
                  </div>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', marginTop: 12 }}
                  onClick={(e) => { e.stopPropagation(); nav(`/booking/${v.id}`); }}
                >
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Right — AI Assistant */}
      <div className="dashboard-right">
        <AssistantPanel key={featured?.id || 'none'} vehicle={featured} />
      </div>
    </div>
  );
}
