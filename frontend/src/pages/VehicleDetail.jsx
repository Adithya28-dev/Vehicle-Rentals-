import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vehicleAPI, reviewAPI } from '../api/api';
import toast from 'react-hot-toast';
import { resolveImageUrl } from '../utils/imageHelper';
import './VehicleDetail.css';

export default function VehicleDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    Promise.all([vehicleAPI.get(id), reviewAPI.get(id)])
      .then(([vr, rr]) => { setVehicle(vr.data.vehicle); setReviews(rr.data.reviews || []); })
      .catch(() => toast.error('Vehicle not found'))
      .finally(() => setLoading(false));
  }, [id]);



  if (loading) return <div className="page-loading" style={{ paddingTop: 68 }}><div className="spinner" /></div>;
  if (!vehicle) return <div className="page-loading" style={{ paddingTop: 68 }}><h3>Vehicle not found</h3></div>;

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '4.5';
  const images = [vehicle.image_url, vehicle.image_url2, vehicle.image_url3].filter(Boolean);

  return (
    <div className="vd-page" style={{ paddingTop: 90 }}>
      <div className="container">
        <button className="btn btn-ghost" onClick={() => nav('/vehicles')} style={{ marginBottom: 20 }}>← Back to Vehicles</button>

        <div className="vdp-grid">
          {/* Left — image + info */}
          <div className="vdp-left">
            <div className="vdp-img-card card">
              <div className="vdp-car-img" style={{ position: 'relative' }}>
                {images.length > 0 ? (
                  <img src={resolveImageUrl(images[activeImg])} alt={vehicle.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  <span>{vehicle.type_name === 'Bike' ? '🏍️' : '🚗'}</span>
                )}
              </div>
              {images.length > 1 && (
                <div className="vdp-img-thumbs">
                  {images.map((img, i) => (
                    <img key={i} src={resolveImageUrl(img)} className={activeImg === i ? 'active' : ''} onClick={() => setActiveImg(i)} alt="thumb" />
                  ))}
                </div>
              )}
              <div className="vdp-img-badges">
                <span className={`badge ${vehicle.status === 'available' ? 'badge-success' : 'badge-error'}`}>
                  {vehicle.status === 'available' ? '✅ Available Now' : '❌ Not Available'}
                </span>
                <span className="badge badge-primary">{vehicle.category?.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Specs card */}
            <div className="card vdp-specs-card">
              <h3>Vehicle Specifications</h3>
              <div className="vdp-specs-grid">
                {[
                  ['Brand', vehicle.brand],
                  ['Model', vehicle.model],
                  ['Year', vehicle.year],
                  ['Type', vehicle.type_name],
                  ['Fuel', vehicle.fuel_type],
                  ['Transmission', vehicle.transmission],
                  ['Seats', vehicle.seats],
                  ['AC', vehicle.ac ? 'Yes' : 'No'],
                ].map(([k, v]) => (
                  <div key={k} className="vdp-spec-item">
                    <span className="vdp-spec-key">{k}</span>
                    <span className="vdp-spec-val">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="card vdp-location-card">
              <h3>📍 Pickup Location</h3>
              <p>{vehicle.location_area}, {vehicle.location_city}</p>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{vehicle.location_address}</p>
              <div className="vdp-map-wrap">
                <iframe
                  title="Pickup Location"
                  width="100%"
                  height="250"
                  frameBorder="0" style={{ border: 0, borderRadius: 12 }}
                  src={`https://www.google.com/maps?q=${vehicle.lat || vehicle.location_lat || 17.3850},${vehicle.lng || vehicle.location_lng || 78.4867}&hl=es;z=14&output=embed`}
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>

          {/* Right — info + booking */}
          <div className="vdp-right">
            <div className="vdp-info-card card">
              <div className="vdp-badges">
                <span className="badge badge-primary">{vehicle.type_name}</span>
              </div>
              <h1 className="vdp-name">{vehicle.name}</h1>
              <div className="vdp-rating-row">
                <span>⭐ {avgRating}</span>
                <span>({reviews.length} reviews)</span>
                <span>·</span>
                <span>📍 {vehicle.location_area}</span>
              </div>
              <p className="vdp-desc">{vehicle.description}</p>

              {/* Pricing */}
              <div className="vdp-pricing">
                <h3>Pricing</h3>
                <div className="vdp-prices">
                  {[
                    ['⏰ Hourly', `₹${vehicle.price_per_hour}`, '/hour'],
                    ['📅 Daily', `₹${vehicle.price_per_day}`, '/day'],
                    ['📆 Weekly', `₹${vehicle.price_per_week || vehicle.price_per_day * 7}`, '/week'],
                    ['🗓️ Monthly', `₹${vehicle.price_per_month || vehicle.price_per_day * 30}`, '/month'],
                  ].map(([label, price, unit]) => (
                    <div key={label} className="vdp-price-item">
                      <span className="vdp-price-label">{label}</span>
                      <span className="vdp-price-val">{price}</span>
                      <span className="vdp-price-unit">{unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={vehicle.status !== 'available'}
                onClick={() => nav(`/booking/${vehicle.id}`)}
              >
                {vehicle.status === 'available' ? '🚗 Book This Vehicle' : '⏰ Currently Unavailable'}
              </button>
            </div>

            {/* Reviews */}
            <div className="card vdp-reviews">
              <div className="flex-between" style={{ marginBottom: 16 }}>
                <h3>Reviews ({reviews.length})</h3>
                <span style={{ color: 'var(--gold)', fontWeight: 700 }}>⭐ {avgRating}</span>
              </div>
              {reviews.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No reviews yet. Be the first to review!</p>
              ) : (
                reviews.slice(0, 5).map(r => (
                  <div key={r.id} className="vdp-review-item">
                    <div className="flex-between">
                      <strong style={{ fontSize: '0.9rem' }}>{r.user_name}</strong>
                      <div className="stars">
                        {[1, 2, 3, 4, 5].map(s => (
                          <span key={s} className={`star ${s <= r.rating ? 'filled' : ''}`}>★</span>
                        ))}
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginTop: 4 }}>{r.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
