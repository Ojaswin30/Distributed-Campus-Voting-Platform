import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';

export default function AddCandidateModal({
  isOpen,
  onClose,
  campuses = [],
  students = [],
  clubs = [],
  defaultCampus = 'Bengaluru Campus',
  defaultClubId = '',
  onAddCandidate
}) {
  const [selectedCampus, setSelectedCampus] = useState('');
  const [studentId, setStudentId] = useState('');
  const [clubId, setClubId] = useState('');

  // Sync selected campus on open or when defaultCampus / campuses update
  useEffect(() => {
    if (isOpen) {
      let matchedCampus = '';
      if (defaultCampus && campuses.some(c => c.name.toLowerCase() === defaultCampus.toLowerCase())) {
        matchedCampus = campuses.find(c => c.name.toLowerCase() === defaultCampus.toLowerCase()).name;
      } else if (campuses.length > 0) {
        matchedCampus = campuses[0].name;
      } else {
        matchedCampus = defaultCampus || '';
      }
      setSelectedCampus(matchedCampus);
      setStudentId('');
    }
  }, [isOpen, defaultCampus, campuses]);

  // Sync available clubs when selected campus or defaultClubId changes
  useEffect(() => {
    if (selectedCampus) {
      const campusClubs = clubs.filter(c => c.campus.toLowerCase() === selectedCampus.toLowerCase());
      if (defaultClubId && campusClubs.some(c => c.id === defaultClubId)) {
        setClubId(defaultClubId);
      } else if (campusClubs.length > 0) {
        setClubId(campusClubs[0].id);
      } else {
        setClubId('');
      }
    } else {
      setClubId('');
    }
  }, [selectedCampus, defaultClubId, clubs]);

  const campusStudents = students.filter(s => !selectedCampus || s.campus.toLowerCase() === selectedCampus.toLowerCase());
  const campusClubs = clubs.filter(c => !selectedCampus || c.campus.toLowerCase() === selectedCampus.toLowerCase());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!studentId || !clubId) return;
    onAddCandidate(studentId, clubId);
    setStudentId('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="➕ Register Student as Candidate">
      <form onSubmit={handleSubmit}>
        {/* 1. CAMPUS SELECTOR */}
        <div className="form-group">
          <label className="form-label">📍 1. Select Campus *</label>
          <select 
            className="form-control"
            value={selectedCampus}
            onChange={(e) => {
              const selectedCamp = e.target.value;
              setSelectedCampus(selectedCamp);
              setStudentId('');
            }}
            required
          >
            {campuses.length > 0 ? (
              campuses.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.code})
                </option>
              ))
            ) : (
              <option value={selectedCampus || 'Bengaluru Campus'}>{selectedCampus || 'Default Campus'}</option>
            )}
          </select>
        </div>

        {/* 2. STUDENT SELECTOR */}
        <div className="form-group">
          <label className="form-label">
            👤 2. Select Registered Student from {selectedCampus || 'Campus'} *
          </label>
          <select 
            className="form-control" 
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
          >
            <option value="">-- Choose Student ({campusStudents.length} available) --</option>
            {campusStudents.map(s => (
              <option key={s.enrollment_id} value={s.enrollment_id}>
                {s.name} ({s.enrollment_id} - {s.department || 'General'})
              </option>
            ))}
          </select>
          {campusStudents.length === 0 && (
            <small style={{ color: 'var(--danger)', fontSize: '0.8rem', display: 'block', marginTop: '4px' }}>
              ⚠️ No students found for {selectedCampus}. Please add students to this campus in the Students tab first.
            </small>
          )}
        </div>

        {/* 3. ELECTION CLUB SELECTOR */}
        <div className="form-group">
          <label className="form-label">
            🗳️ 3. Election Club ({selectedCampus}) *
          </label>
          <select 
            className="form-control" 
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
            required
          >
            <option value="">-- Choose Election Club ({campusClubs.length} available) --</option>
            {campusClubs.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.campus})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-emerald" disabled={campusStudents.length === 0 || !studentId || !clubId}>
            Register Candidate
          </button>
        </div>
      </form>
    </Modal>
  );
}
