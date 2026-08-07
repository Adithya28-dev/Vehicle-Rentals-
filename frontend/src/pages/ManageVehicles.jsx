import { useState, useEffect } from 'react';
import { adminAPI, vehicleAPI } from '../api/api';
import toast from 'react-hot-toast';
import ImageUpload from '../components/ImageUpload';
import { resolveImageUrl } from '../utils/imageHelper';
import './Admin.css';

export default function ManageVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const defaults = {
    name: '', brand: '', model: '', year: new Date().getFullYear(), type_id: '',
    category: 'self_drive', location_id: '', price_per_hour: '', price_per_day: '',
    price_per_week: '', price_per_month: '', status: 'available', transmission: 'Manual',
    fuel_type: 'Petrol', seats: 4, ac: true, image_url: '', image_url2: '', image_url3: '',
    description: '', lat: '', lng: ''
  };
  const [form, setForm] = useState(defaults);

  const fetchData = async () => {
    try {
      const [vr, lr, tr] = await Promise.all([adminAPI.vehicles(), vehicleAPI.locations(), vehicleAPI.types()]);
      setVehicles(vr.data.vehicles || []);
      setLocations(lr.data.locations || []);
      setTypes(tr.data.types || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpen = (v = null) => {
    if (v) {
      setEditingId(v.id);
      setForm({
        name: v.name, brand: v.brand, model: v.model, year: v.year, type_id: v.type_id,
        category: v.category, location_id: v.location_id, price_per_hour: v.price_per_hour,
        price_per_day: v.price_per_day, price_per_week: v.price_per_week || '',
        price_per_month: v.price_per_month || '', status: v.status,
        transmission: v.transmission, fuel_type: v.fuel_type, seats: v.seats, ac: v.ac === 1,
        image_url: v.image_url || '', image_url2: v.image_url2 || '', image_url3: v.image_url3 || '',
        description: v.description || '', lat: v.lat || '', lng: v.lng || ''
      });
    } else {
      setEditingId(null); setForm(defaults);
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        year: parseInt(form.year),
        type_id: parseInt(form.type_id),
        location_id: parseInt(form.location_id),
        price_per_hour: parseFloat(form.price_per_hour),
        price_per_day: parseFloat(form.price_per_day),
        price_per_week: form.price_per_week ? parseFloat(form.price_per_week) : null,
        price_per_month: form.price_per_month ? parseFloat(form.price_per_month) : null,
        seats: parseInt(form.seats),
        ac: form.ac ? 1 : 0
      };
      if (editingId) await adminAPI.updateVehicle(editingId, payload);
      else await adminAPI.createVehicle(payload);
      toast.success(`Vehicle ${editingId ? 'updated' : 'added'}!`);
      setModalOpen(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle?')) return;
    try { await adminAPI.deleteVehicle(id); toast.success('Deleted'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.error || 'Delete failed'); }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Manage <span className="gradient-text">Vehicles</span></h1>
        <button className="btn btn-primary" onClick={() => handleOpen()}>+ Add Vehicle</button>
      </div>

      <div className="admin-table-wrap animate-fade">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th><th>Photo</th><th>Vehicle</th><th>Type & Loc</th><th>Pricing</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(v => (
              <tr key={v.id}>
                <td style={{ fontFamily: 'monospace', color: 'var(--text-dim)' }}>#{v.id}</td>
                <td>
                  <div style={{ width: 60, height: 40, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.1)' }}>
                    {v.image_url ? (
                      <img src={resolveImageUrl(v.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--text-dim)' }}>No Image</div>
                    )}
                  </div>
                </td>
                <td>
                  <strong>{v.name}</strong><br />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.brand} {v.model} ({v.year})</span>
                </td>
                <td>
                  <span className="badge badge-primary">{v.type_name}</span><br />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'inline-block' }}>📍 {v.location_area}</span>
                </td>
                <td>
                  <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>₹{v.price_per_hour}/hr</span><br />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>₹{v.price_per_day}/day</span>
                </td>
                <td>
                  <span className={`badge ${v.status === 'available' ? 'badge-success' : 'badge-warning'}`}>{v.status}</span>
                </td>
                <td>
                  <div className="td-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpen(v)}>✏️</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDelete(v.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content admin-modal-content card animate-scale">
            <h3 style={{ marginBottom: 20 }}>{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
            <form onSubmit={handleSave}>
              <div className="admin-modal-grid">
                <div className="form-group"><label className="form-label">Vehicle Name</label><input required className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Brand</label><input required className="form-input" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Model</label><input required className="form-input" value={form.model} onChange={e => setForm({...form, model: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Year</label><input required type="number" className="form-input" value={form.year} onChange={e => setForm({...form, year: e.target.value})} /></div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select required className="form-input" value={form.type_id} onChange={e => setForm({...form, type_id: e.target.value})}>
                    <option value="">Select Type</option>{types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select required className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option value="self_drive">Self Drive</option><option value="with_driver">With Driver</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <select required className="form-input" value={form.location_id} onChange={e => setForm({...form, location_id: e.target.value})}>
                    <option value="">Select Location</option>{locations.map(l => <option key={l.id} value={l.id}>{l.area}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Status</label><select className="form-input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option value="available">Available</option><option value="maintenance">Maintenance</option><option value="booked">Booked</option></select></div>
                
                <div className="form-group"><label className="form-label">Price / Hour (₹)</label><input required type="number" className="form-input" value={form.price_per_hour} onChange={e => setForm({...form, price_per_hour: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Price / Day (₹)</label><input required type="number" className="form-input" value={form.price_per_day} onChange={e => setForm({...form, price_per_day: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Price / Week (₹)</label><input type="number" className="form-input" value={form.price_per_week} onChange={e => setForm({...form, price_per_week: e.target.value})} placeholder="Optional override" /></div>
                <div className="form-group"><label className="form-label">Price / Month (₹)</label><input type="number" className="form-input" value={form.price_per_month} onChange={e => setForm({...form, price_per_month: e.target.value})} placeholder="Optional override" /></div>

                <div className="form-group"><label className="form-label">Transmission</label><select className="form-input" value={form.transmission} onChange={e => setForm({...form, transmission: e.target.value})}><option value="Manual">Manual</option><option value="Automatic">Automatic</option></select></div>
                <div className="form-group"><label className="form-label">Fuel</label><select className="form-input" value={form.fuel_type} onChange={e => setForm({...form, fuel_type: e.target.value})}><option value="Petrol">Petrol</option><option value="Diesel">Diesel</option><option value="Electric">Electric</option></select></div>
                <div className="form-group"><label className="form-label">Seats</label><input required type="number" className="form-input" value={form.seats} onChange={e => setForm({...form, seats: e.target.value})} /></div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}>
                  <label style={{ display: 'flex', gap: 8, cursor: 'pointer', color: 'var(--text)' }}><input type="checkbox" checked={form.ac} onChange={e => setForm({...form, ac: e.target.checked})} /> AC Included</label>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <div className="admin-modal-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 15, marginTop: 0 }}>
                    <ImageUpload 
                      label="Main Image" 
                      value={form.image_url} 
                      onChange={url => setForm({...form, image_url: url})} 
                    />
                    <ImageUpload 
                      label="Gallery Image 2" 
                      value={form.image_url2} 
                      onChange={url => setForm({...form, image_url2: url})} 
                    />
                    <ImageUpload 
                      label="Gallery Image 3" 
                      value={form.image_url3} 
                      onChange={url => setForm({...form, image_url3: url})} 
                    />
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Detailed vehicle info..." />
                </div>
                
                <div className="form-group"><label className="form-label">Latitude</label><input type="number" step="any" className="form-input" value={form.lat} onChange={e => setForm({...form, lat: e.target.value})} placeholder="Map coordination" /></div>
                <div className="form-group"><label className="form-label">Longitude</label><input type="number" step="any" className="form-input" value={form.lng} onChange={e => setForm({...form, lng: e.target.value})} placeholder="Map coordination" /></div>
              </div>
              <div className="flex-between mt-4 mt-20">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
