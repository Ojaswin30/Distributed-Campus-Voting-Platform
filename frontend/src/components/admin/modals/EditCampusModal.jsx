import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';

export default function EditCampusModal({ isOpen, onClose, campus, onUpdateCampus }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(1);

  useEffect(() => {
    if (campus) {
      setName(campus.name || '');
      setCode(campus.code || '');
      setLocation(campus.location || '');
      setDescription(campus.description || '');
      setIsActive(campus.is_active !== undefined ? campus.is_active : 1);
    }
  }, [campus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!campus) return;
    onUpdateCampus(campus.id, {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      location: location.trim() || null,
      description: description.trim() || null,
      is_active: isActive ? 1 : 0
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="✏️ Edit Campus Details">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Campus Name *</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. Pune Campus"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', marginTop: '4px' }}>
            Renaming will automatically update all existing students and clubs linked to this campus.
          </small>
        </div>

        <div className="form-group">
          <label className="form-label">Campus Code * (Short Identifier)</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. PUN"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Location / Address</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. Hinjewadi Tech Park, Pune"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea 
            className="form-control" 
            rows={2} 
            placeholder="Campus academic details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
