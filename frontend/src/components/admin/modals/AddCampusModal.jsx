import React, { useState } from 'react';
import Modal from '../../common/Modal';

export default function AddCampusModal({ isOpen, onClose, onAddCampus }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddCampus({ name, code, location, description });
    setName('');
    setCode('');
    setLocation('');
    setDescription('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🏛️ Register New Campus">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Campus Name *</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. East Innovation Campus"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Campus Code * (Short Identifier)</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. EAST"
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
            placeholder="e.g. Sector 12, Technology Corridor"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea 
            className="form-control" 
            rows={2} 
            placeholder="Campus academic departments and details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save Campus
          </button>
        </div>
      </form>
    </Modal>
  );
}
