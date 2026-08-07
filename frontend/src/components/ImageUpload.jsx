import toast from 'react-hot-toast';
import { uploadAPI } from '../api/api';
import { resolveImageUrl } from '../utils/imageHelper';
import './ImageUpload.css';

export default function ImageUpload({ label, value, onChange }) {
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const loadingToast = toast.loading(`Uploading ${label}...`);
    try {
      const res = await uploadAPI.uploadFile(file);
      onChange(res.data.url);
      toast.success(`${label} uploaded!`, { id: loadingToast });
    } catch (err) {
      console.error('Upload error:', err);
      const msg = err.response?.data?.error || `Failed to upload ${label}`;
      toast.error(msg, { id: loadingToast });
    }
  };

  return (
    <div className="image-upload-box">
      <label className="form-label">{label}</label>
      <div className="upload-preview-container">
        {value ? (
          <img src={resolveImageUrl(value)} alt="Preview" className="upload-preview" />
        ) : (
          <div className="upload-placeholder">No Image</div>
        )}
        <input type="file" accept="image/*" onChange={handleUpload} id={`file-${label}`} style={{ display: 'none' }} />
        <label htmlFor={`file-${label}`} className="btn btn-ghost btn-sm upload-btn">
          {value ? 'Change' : 'Upload'}
        </label>
      </div>
    </div>
  );
}
