import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vehicleAPI, bookingAPI, paymentAPI } from '../api/api';
import toast from 'react-hot-toast';
import './Booking.css';

export default function Booking() {
  const { vehicleId } = useParams();
  const nav = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [packages, setPackages] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [step, setStep] = useState(1); // 1=dates, 2=package, 3=review

  const now = new Date();
  const tmr = new Date(now); tmr.setDate(now.getDate() + 1);
  const fmt = d => d.toISOString().slice(0, 16);

  const [form, setForm] = useState({
    startTime: fmt(now),
    endTime: fmt(tmr),
    packageId: '',
    pickupLocationId: '',
    dropLocationId: '',
    specialRequests: '',
    coupon: '',
  });



  useEffect(() => {
    Promise.all([vehicleAPI.get(vehicleId), vehicleAPI.packages(), vehicleAPI.locations()])
      .then(([vr, pr, lr]) => {
        setVehicle(vr.data.vehicle);
        setPackages(pr.data.packages || []);
        setLocations(lr.data.locations || []);
      })
      .catch(() => toast.error('Failed to load vehicle info'))
      .finally(() => setLoading(false));
  }, [vehicleId]);

  const hours = Math.max(1, (new Date(form.endTime) - new Date(form.startTime)) / 3600000);
  const pkg = packages.find(p => p.id === parseInt(form.packageId));
  const basePrice = vehicle
    ? (hours < 24 ? vehicle.price_per_hour * hours : vehicle.price_per_day * Math.ceil(hours / 24))
    : 0;
  const pkgDiscount = pkg ? basePrice * pkg.discount_pct / 100 : 0;
  const couponDiscountAmt = couponDiscount?.discount_amount || 0;
  const totalPrice = Math.max(0, basePrice - pkgDiscount - couponDiscountAmt);

  const validateCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await paymentAPI.validateCoupon({ code: couponInput, amount: basePrice - pkgDiscount });
      if (res.data.valid) {
        setCouponDiscount(res.data);
        setForm(f => ({ ...f, coupon: couponInput }));
        toast.success(res.data.message);
      } else {
        toast.error(res.data.error);
        setCouponDiscount(null);
      }
    } finally { setValidatingCoupon(false); }
  };



  const handleSubmit = async () => {
    if (!form.startTime || !form.endTime) return toast.error('Please select dates');
    if (new Date(form.endTime) <= new Date(form.startTime)) return toast.error('End time must be after start time');
    setSubmitting(true);
    try {
      const res = await bookingAPI.create({
        vehicle_id: parseInt(vehicleId),
        start_time: form.startTime,
        end_time: form.endTime,
        package_id: form.packageId ? parseInt(form.packageId) : null,
        pickup_location_id: form.pickupLocationId ? parseInt(form.pickupLocationId) : null,
        drop_location_id: form.dropLocationId ? parseInt(form.dropLocationId) : null,
        special_requests: form.specialRequests,
        coupon_code: form.coupon,
      });
      toast.success('Booking created! Proceeding to payment...');
      nav(`/payment/${res.data.booking_id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="page-loading" style={{ paddingTop: 68 }}><div className="spinner" /></div>;
  if (!vehicle) return <div className="page-loading" style={{ paddingTop: 68 }}><h3>Vehicle not found</h3></div>;

  const steps = ['Date & Time', 'Package', 'Review & Book'];

  return (
    <div className="booking-page" style={{ paddingTop: 90 }}>
      <div className="container" style={{ maxWidth: 900 }}>
        <button className="btn btn-ghost" onClick={() => nav(`/vehicles/${vehicleId}`)} style={{ marginBottom: 20 }}>← Back to Vehicle</button>

        <h1 style={{ marginBottom: 24 }}>Book <span className="gradient-text">{vehicle.name}</span></h1>

        {/* Progress steps */}
        <div className="booking-steps animate-fade">
          {steps.map((s, i) => (
            <div key={s} className={`booking-step ${i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''}`}>
              <div className="step-circle">{i + 1 < step ? '✓' : i + 1}</div>
              <span>{s}</span>
              {i < steps.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        <div className="booking-layout">
          {/* Main form */}
          <div className="booking-form-area">
            {step === 1 && (
              <div className="card booking-step-card animate-fade">
                <h3>📅 Select Dates & Locations</h3>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Pickup Date & Time</label>
                    <input type="datetime-local" className="form-input"
                      value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Return Date & Time</label>
                    <input type="datetime-local" className="form-input"
                      value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pickup Location</label>
                    <select className="form-input" value={form.pickupLocationId}
                      onChange={e => setForm(f => ({ ...f, pickupLocationId: e.target.value }))}>
                      <option value="">Select pickup point</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.area}, {l.city}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Drop Location</label>
                    <select className="form-input" value={form.dropLocationId}
                      onChange={e => setForm(f => ({ ...f, dropLocationId: e.target.value }))}>
                      <option value="">Same as pickup</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.area}, {l.city}</option>)}
                    </select>
                  </div>
                  

                </div>
                <div className="booking-duration">
                  <span className="badge badge-primary">⏱️ Duration: {hours.toFixed(1)} hours ({Math.ceil(hours / 24)} day{Math.ceil(hours / 24) !== 1 ? 's' : ''})</span>
                </div>
                <button className="btn btn-primary" onClick={() => setStep(2)}>Next: Choose Package →</button>
              </div>
            )}

            {step === 2 && (
              <div className="card booking-step-card animate-fade">
                <h3>📦 Select Package</h3>
                <div className="packages-grid">
                  {packages.map(p => (
                    <div key={p.id}
                      className={`package-card ${form.packageId === String(p.id) ? 'selected' : ''}`}
                      onClick={() => setForm(f => ({ ...f, packageId: String(p.id) }))}>
                      <div className="pkg-name">{p.name}</div>
                      <div className="pkg-desc">{p.description}</div>
                      {p.discount_pct > 0 && <div className="badge badge-success">{p.discount_pct}% OFF</div>}
                    </div>
                  ))}
                  <div className={`package-card ${form.packageId === '' ? 'selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, packageId: '' }))}>
                    <div className="pkg-name">No Package</div>
                    <div className="pkg-desc">Pay the standard hourly rate</div>
                  </div>
                </div>

                {/* Coupon */}
                <div className="coupon-row">
                  <div className="form-input-icon" style={{ flex: 1 }}>
                    <span className="icon">🎟️</span>
                    <input type="text" className="form-input" placeholder="Coupon code (FIRST10, RIDE20...)"
                      value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())}
                      style={{ width: '100%' }} />
                  </div>
                  <button className="btn btn-outline" onClick={validateCoupon} disabled={validatingCoupon}>
                    {validatingCoupon ? '...' : 'Apply'}
                  </button>
                </div>
                {couponDiscount?.valid && (
                  <div className="badge badge-success" style={{ alignSelf: 'flex-start' }}>
                    ✅ {couponDiscount.message}
                  </div>
                )}

                <div className="form-group" style={{ marginTop: 8 }}>
                  <label className="form-label">Special Requests (optional)</label>
                  <textarea className="form-input" rows={2} placeholder="Any special requirements..."
                    value={form.specialRequests}
                    onChange={e => setForm(f => ({ ...f, specialRequests: e.target.value }))} />
                </div>

                <div className="booking-nav">
                  <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn btn-primary" onClick={() => setStep(3)}>Review Booking →</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="card booking-step-card animate-fade">
                <h3>✅ Review & Confirm</h3>
                <div className="review-rows">
                  <div className="review-row"><span>Vehicle</span><strong>{vehicle.name}</strong></div>
                  <div className="review-row"><span>Category</span><strong>{vehicle.category?.replace('_', ' ')}</strong></div>
                  <div className="review-row"><span>Pickup</span><strong>{new Date(form.startTime).toLocaleString()}</strong></div>
                  <div className="review-row"><span>Return</span><strong>{new Date(form.endTime).toLocaleString()}</strong></div>
                  <div className="review-row"><span>Duration</span><strong>{hours.toFixed(1)} hours</strong></div>
                  {pkg && <div className="review-row"><span>Package</span><strong>{pkg.name} ({pkg.discount_pct}% off)</strong></div>}
                  {form.coupon && <div className="review-row"><span>Coupon</span><strong>{form.coupon}</strong></div>}
                  <div className="divider" />
                  <div className="review-row"><span>Base Price</span><strong>₹{Math.round(basePrice).toLocaleString()}</strong></div>
                  {pkgDiscount > 0 && <div className="review-row" style={{ color: 'var(--success)' }}><span>Package Discount</span><strong>-₹{Math.round(pkgDiscount).toLocaleString()}</strong></div>}
                  {couponDiscountAmt > 0 && <div className="review-row" style={{ color: 'var(--success)' }}><span>Coupon Discount</span><strong>-₹{Math.round(couponDiscountAmt).toLocaleString()}</strong></div>}
                  <div className="review-row review-total"><span>Total Amount</span><strong className="gradient-text">₹{Math.round(totalPrice).toLocaleString()}</strong></div>
                </div>
                <div className="booking-nav">
                  <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                  <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <><span className="spinner-sm" /> Processing...</> : '💳 Proceed to Payment →'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar summary */}
          <div className="booking-summary card">
            <div className="bs-vehicle-icon">{vehicle.type_name === 'Bike' ? '🏍️' : '🚗'}</div>
            <h4 className="bs-name">{vehicle.name}</h4>
            <p className="bs-location">📍 {vehicle.location_area}</p>
            <div className="divider" />
            <div className="bs-price-rows">
              <div className="bs-row"><span>Hourly rate</span><span>₹{vehicle.price_per_hour}/hr</span></div>
              <div className="bs-row"><span>Daily rate</span><span>₹{vehicle.price_per_day}/day</span></div>
              <div className="bs-row"><span>Duration</span><span>{hours.toFixed(1)} hrs</span></div>
            </div>
            <div className="divider" />
            <div className="bs-total">
              <span>Estimated Total</span>
              <span className="gradient-text bs-total-price">₹{Math.round(totalPrice).toLocaleString()}</span>
            </div>
            <div className="bs-note">💡 Available coupons: FIRST10, RIDE20, WEEKLY25</div>
          </div>
        </div>
      </div>
    </div>
  );
}
