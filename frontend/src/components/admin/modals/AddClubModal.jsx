import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';

export default function AddClubModal({
  isOpen,
  onClose,
  campuses = [],
  defaultCampus = 'Bengaluru Campus',
  onAddClub
}) {
  const [name, setName] = useState('');
  const [campus, setCampus] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (defaultCampus && campuses.some(c => c.name.toLowerCase() === defaultCampus.toLowerCase())) {
        const matched = campuses.find(c => c.name.toLowerCase() === defaultCampus.toLowerCase());
        setCampus(matched.name);
      } else if (campuses.length > 0) {
        setCampus(campuses[0].name);
      } else {
        setCampus(defaultCampus || '');
      }
    }
  }, [isOpen, defaultCampus, campuses]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!campus) {
      alert('Please select or specify a campus.');
      return;
    }
    onAddClub({ name, campus, description });
    setName('');
    setDescription('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="➕ Create New Election Club">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Club Name *</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. Data Science & AI Society"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Assign to Campus *</label>
          <select 
            className="form-control"
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            required
          >
            {campuses.length > 0 ? (
              campuses.map(c => (
                <option key={c.id} value={c.name}>{c.name} ({c.code})</option>
              ))
            ) : (
              <option value={campus || 'Bengaluru Campus'}>{campus || 'Default Campus'}</option>
            )}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea 
            className="form-control" 
            rows={3} 
            placeholder="Club mandate and election description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save Club
          </button>
        </div>
      </form>
    </Modal>
  );
}
