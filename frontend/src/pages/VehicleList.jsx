import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { vehicleAPI } from '../api/api';
import { resolveImageUrl } from '../utils/imageHelper';
import './VehicleList.css';

export default function VehicleList() {
  const nav = useNavigate();
  const location = useLocation();
  const [vehicles, setVehicles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Parse query params
  const queryParams = new URLSearchParams(location.search);
  const initialLocation = queryParams.get('location_id') || '';

  const [filters, setFilters] = useState({ 
    search: '', 
    location_id: initialLocation, 
    type_id: '', 
    category: '' 
  });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.location_id) params.location_id = filters.location_id;
      if (filters.type_id) params.type_id = filters.type_id;
      if (filters.category) params.category = filters.category;
      const res = await vehicleAPI.list(params);
      setVehicles(res.data.vehicles || []);
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => {
    Promise.all([vehicleAPI.locations(), vehicleAPI.types()])
      .then(([l, t]) => { setLocations(l.data.locations || []); setTypes(t.data.types || []); });
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  return (
    <div className="vl-root" style={{ paddingTop: 100 }}>
      <div className="container">
        <div className="vl-header animate-fade">
          <div>
            <h1>Browse Vehicles <span className="gradient-text">in Hyderabad</span></h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
              {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="vl-filters card animate-fade stagger-1">
          <div className="form-input-icon" style={{ flex: 2 }}>
            <span className="icon">🔍</span>
            <input className="form-input" style={{ width: '100%' }}
              placeholder="Search by name, brand, or area..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <select className="form-input" value={filters.location_id}
            onChange={e => setFilter('location_id', e.target.value)}>
            <option value="">📍 All Locations</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.area}</option>)}
          </select>
          <select className="form-input" value={filters.type_id}
            onChange={e => setFilter('type_id', e.target.value)}>
            <option value="">🚗 Vehicle Type</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className="form-input" value={filters.category}
            onChange={e => setFilter('category', e.target.value)}>
            <option value="">🎯 Category</option>
            <option value="self_drive">Self Drive</option>
            <option value="with_driver">With Driver</option>
          </select>
          <button className="btn btn-ghost" onClick={() => { setSearchTerm(''); setFilters({ search: '', location_id: '', type_id: '', category: '' }); }}>
            Reset
          </button>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex-center" style={{ padding: '60px', flexDirection: 'column', gap: 16 }}>
            <div className="spinner" />
            <p style={{ color: 'var(--text-muted)' }}>Searching vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="vl-empty animate-fade">
            <span>🔍</span>
            <h3>No vehicles found</h3>
            <p>Try adjusting your filters</p>
            <button className="btn btn-outline" onClick={() => setFilters({ search: '', location_id: '', type_id: '', category: '' })}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="vl-grid">
            {vehicles.map((v, i) => (
              <div key={v.id} className={`vl-card card animate-fade stagger-${(i % 4) + 1}`}
                onClick={() => nav(`/vehicles/${v.id}`)}>
                <div className="vl-card-img">
                  {v.image_url ? (
                    <img
                      src={resolveImageUrl(v.image_url)}
                      alt={v.name}
                      className="vl-car-photo"
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div className="vl-car-icon" style={{ display: v.image_url ? 'none' : 'flex' }}>
                    {v.type_name === 'Bike' ? '🏍️' : '🚗'}
                  </div>
                  <div className="vl-card-badges">
                    <span className={`badge ${v.category === 'with_driver' ? 'badge-warning' : 'badge-primary'}`}>
                      {v.category === 'with_driver' ? '👨‍✈️ With Driver' : '🔑 Self Drive'}
                    </span>
                    <span className={`badge ${v.status === 'available' ? 'badge-success' : 'badge-error'}`}>
                      {v.status}
                    </span>
                  </div>
                </div>
                <div className="vl-card-body">
                  <div className="vl-card-top">
                    <div>
                      <h3 className="vl-vehicle-name">{v.name}</h3>
                      <p className="vl-vehicle-sub">{v.brand} · {v.year}</p>
                    </div>
                    <div className="vl-rating">
                      ⭐ {v.rating > 0 ? v.rating.toFixed(1) : '4.5'}
                      <span>({v.review_count})</span>
                    </div>
                  </div>
                  <p className="vl-location">📍 {v.location_area}, {v.location_city}</p>
                  <div className="vl-specs">
                    <span>⛽ {v.fuel_type}</span>
                    <span>⚙️ {v.transmission}</span>
                    <span>💺 {v.seats} seats</span>
                    {v.ac ? <span>❄️ AC</span> : null}
                  </div>
                  <div className="vl-price-row">
                    <div className="vl-prices">
                      <span className="vl-price">₹{v.price_per_hour}<small>/hr</small></span>
                      <span className="vl-price-day">₹{v.price_per_day}<small>/day</small></span>
                    </div>
                    <button className="btn btn-primary btn-sm"
                      onClick={e => { e.stopPropagation(); nav(`/booking/${v.id}`); }}>
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
