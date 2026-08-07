import { useNavigate } from 'react-router-dom';
import { resolveImageUrl } from '../utils/imageHelper';
import './VehicleDisplay.css';

export default function VehicleDisplay({ vehicle }) {
  const nav = useNavigate();

  if (!vehicle) return (
    <div className="vd-root vd-empty">
      <div className="vd-car-icon animate-float">🚗</div>
      <p>No vehicles available</p>
    </div>
  );

  const indicators = vehicle.type_name === 'Bike'
    ? ['Ride', 'Sport', 'Fast', 'Fun']
    : ['Luxury', 'Safe', 'Fast', 'Best'];

  return (
    <div className="vd-root card animate-scale">
      {/* Background glow */}
      <div className="vd-glow" />

      <div className="vd-content">
        {/* Left — info */}
        <div className="vd-info">
          <div className="vd-badge-row">
            <span className="badge badge-primary">{vehicle.category?.replace('_', ' ')}</span>
            <span className={`badge ${vehicle.status === 'available' ? 'badge-success' : 'badge-warning'}`}>
              {vehicle.status}
            </span>
          </div>
          <h2 className="vd-name">{vehicle.name}</h2>
          <p className="vd-subtitle">{vehicle.brand} {vehicle.model} · {vehicle.year}</p>
          <p className="vd-desc">{vehicle.description || 'Premium vehicle available for rent in Hyderabad'}</p>

          {/* Indicators */}
          <div className="vd-indicators">
            {indicators.map(ind => (
              <div key={ind} className="vd-ind">
                <div className="vd-ind-dot" />
                <span>{ind}</span>
              </div>
            ))}
          </div>

          {/* Specs row */}
          <div className="vd-specs">
            <div className="vd-spec"><span>⛽</span><span>{vehicle.fuel_type}</span></div>
            <div className="vd-spec"><span>⚙️</span><span>{vehicle.transmission}</span></div>
            <div className="vd-spec"><span>💺</span><span>{vehicle.seats} Seats</span></div>
            {vehicle.ac ? <div className="vd-spec"><span>❄️</span><span>AC</span></div> : null}
          </div>

          <div className="vd-price-row">
            <div>
              <span className="vd-price">₹{vehicle.price_per_hour}</span>
              <span className="vd-price-unit">/hour</span>
            </div>
            <div>
              <span className="vd-price" style={{ fontSize: '1rem' }}>₹{vehicle.price_per_day}</span>
              <span className="vd-price-unit">/day</span>
            </div>
            <div>
              <span className="vd-rating">⭐ {vehicle.rating > 0 ? vehicle.rating.toFixed(1) : '4.5'}</span>
              <span className="vd-price-unit">({vehicle.review_count || 0} reviews)</span>
            </div>
          </div>

          <div className="vd-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => nav(`/booking/${vehicle.id}`)}
            >
              🚗 Book This Vehicle
            </button>
            <button
              className="btn btn-outline"
              onClick={() => nav(`/vehicles/${vehicle.id}`)}
            >
              View Details
            </button>
          </div>
        </div>

        {/* Right — car image */}
        <div className="vd-visual">
            <div className="vd-car-display">
              {vehicle.image_url ? (
                <img 
                  src={resolveImageUrl(vehicle.image_url)} 
                  alt={vehicle.name} 
                  className="vd-car-photo animate-float"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }}
                />
              ) : (
                <div className="vd-car-emoji animate-float">
                  {vehicle.type_name === 'Bike' ? '🏍️' : '🚗'}
                </div>
              )}
              <div className="vd-car-shadow" />
            </div>
          <div className="vd-location">
            <span>📍</span>
            <span>{vehicle.location_area}, {vehicle.location_city}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
