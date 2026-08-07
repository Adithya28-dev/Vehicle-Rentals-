import { useState, useEffect } from 'react';
import { adminAPI, vehicleAPI } from '../api/api';
import toast from 'react-hot-toast';
import './Admin.css';

export default function ManageLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const defaults = { area: '', city: 'Hyderabad', address: '', lat: '', lng: '' };
  const [form, setForm] = useState(defaults);

  const fetchData = async () => {
    try {
      const res = await vehicleAPI.locations();
      setLocations(res.data.locations || []);
    } catch { toast.error('Failed to load locations'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpen = (l = null) => {
    if (l) {
      setEditingId(l.id);
      setForm({ area: l.area, city: l.city, address: l.address, lat: l.lat || '', lng: l.lng || '' });
    } else {
      setEditingId(null); setForm(defaults);
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await adminAPI.updateLocation(editingId, form);
      else await adminAPI.createLocation(form);
      toast.success(`Location ${editingId ? 'updated' : 'added'}!`);
      setModalOpen(false); fetchData();
    } catch { toast.error('Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this location? This may affect vehicles linked to it.')) return;
    try { await adminAPI.deleteLocation(id); toast.success('Deleted'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.error || 'Delete failed'); }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Manage <span className="gradient-text">Locations</span></h1>
        <button className="btn btn-primary" onClick={() => handleOpen()}>+ Add Location</button>
      </div>

      <div className="admin-table-wrap animate-fade">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th><th>Area</th><th>City</th><th>Address</th><th>Coords</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map(l => (
              <tr key={l.id}>
                <td style={{ fontFamily: 'monospace', color: 'var(--text-dim)' }}>#{l.id}</td>
                <td><strong>{l.area}</strong></td>
                <td>{l.city}</td>
                <td style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.address}</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{l.lat}, {l.lng}</td>
                <td>
                  <div className="td-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpen(l)}>✏️</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDelete(l.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {locations.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No locations found.</div>}
      </div>

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content card animate-scale" style={{ maxWidth: 500 }}>
            <h3 style={{ marginBottom: 20 }}>{editingId ? 'Edit Location' : 'Add New Location'}</h3>
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group"><label className="form-label">Area Name</label><input required className="form-input" value={form.area} onChange={e => setForm({...form, area: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">City</label><input required className="form-input" value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Full Address</label><textarea required className="form-input" rows={2} value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">Latitude</label><input type="number" step="any" className="form-input" value={form.lat} onChange={e => setForm({...form, lat: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Longitude</label><input type="number" step="any" className="form-input" value={form.lng} onChange={e => setForm({...form, lng: e.target.value})} /></div>
                </div>
                {form.lat && form.lng && (
                  <div className="form-group">
                    <label className="form-label">Map Preview</label>
                    <div className="map-preview" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <iframe
                        title="Location Preview"
                        width="100%" height="200" frameBorder="0"
                        src={`https://www.google.com/maps?q=${form.lat},${form.lng}&hl=es;z=14&output=embed`}
                      ></iframe>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-between mt-4 mt-20">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Location</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
