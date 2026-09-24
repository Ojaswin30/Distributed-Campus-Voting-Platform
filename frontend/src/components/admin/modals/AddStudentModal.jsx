import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';

export default function AddStudentModal({
  isOpen,
  onClose,
  campuses = [],
  defaultCampus = 'Bengaluru Campus',
  onAddStudent
}) {
  const [enrollmentId, setEnrollmentId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [campus, setCampus] = useState('');

  // Synchronize campus value whenever modal opens or campuses list / defaultCampus updates
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
    onAddStudent({
      enrollment_id: enrollmentId.trim(),
      name: name.trim(),
      email: email.trim(),
      department: department.trim(),
      campus: campus.trim()
    });
    setEnrollmentId('');
    setName('');
    setEmail('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="➕ Register New Student">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Enrollment ID / Student ID *</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. 0801CS211050"
            value={enrollmentId}
            onChange={(e) => setEnrollmentId(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. Alex Turner"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email ID (Gmail / College ID)</label>
          <input 
            type="email" 
            className="form-control" 
            placeholder="e.g. alex@campus.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Department</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. Mechanical Engineering"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Campus Assignment *</label>
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
          {campuses.length === 0 && (
            <small style={{ color: 'var(--warning)', fontSize: '0.78rem', display: 'block', marginTop: '4px' }}>
              ⚠️ No registered campuses found. You can add campuses in the Campuses tab.
            </small>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save Student
          </button>
        </div>
      </form>
    </Modal>
  );
}
