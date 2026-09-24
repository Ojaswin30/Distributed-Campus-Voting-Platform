import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import { parseStudentCsv } from '../../../utils/csvParser';

export default function BulkUploadModal({
  isOpen,
  onClose,
  campuses = [],
  defaultCampus = 'Bengaluru Campus',
  onBulkUpload,
  loading
}) {
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkDefaultCampus, setBulkDefaultCampus] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (defaultCampus && campuses.some(c => c.name.toLowerCase() === defaultCampus.toLowerCase())) {
        const matched = campuses.find(c => c.name.toLowerCase() === defaultCampus.toLowerCase());
        setBulkDefaultCampus(matched.name);
      } else if (campuses.length > 0) {
        setBulkDefaultCampus(campuses[0].name);
      } else {
        setBulkDefaultCampus(defaultCampus || '');
      }
    }
  }, [isOpen, defaultCampus, campuses]);

  const handleCsvFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBulkCsvText(event.target.result || '');
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bulkCsvText.trim()) return;

    const students = parseStudentCsv(bulkCsvText, bulkDefaultCampus);
    if (students.length === 0) {
      alert('No valid student records found in input.');
      return;
    }

    onBulkUpload(students);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📥 Bulk Upload Students (CSV)" maxWidth="640px">
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Upload a <code>.csv</code> file or paste CSV rows below. Columns: <strong>Enrollment ID, Name, Email, Department, Campus</strong>.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label">Default Campus (for rows without campus specified):</label>
          <select 
            className="form-control"
            value={bulkDefaultCampus}
            onChange={(e) => setBulkDefaultCampus(e.target.value)}
          >
            {campuses.length > 0 ? (
              campuses.map(c => (
                <option key={c.id} value={c.name}>{c.name} ({c.code})</option>
              ))
            ) : (
              <option value={bulkDefaultCampus || 'Bengaluru Campus'}>{bulkDefaultCampus || 'Default Campus'}</option>
            )}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label">Option A: Choose CSV File</label>
          <input 
            type="file" 
            accept=".csv,text/csv" 
            className="form-control"
            onChange={handleCsvFileSelect}
            style={{ fontSize: '0.85rem' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label className="form-label" style={{ margin: 0 }}>Option B: Paste CSV Content</label>
            <button 
              type="button" 
              className="btn btn-secondary"
              style={{ fontSize: '0.72rem', padding: '2px 6px' }}
              onClick={() => {
                const sampleCamp = bulkDefaultCampus || 'Bengaluru Campus';
                setBulkCsvText(`enrollment_id,name,email,department,campus
0801CS221001,Aarav Patel,aarav.patel@campus.edu,Computer Science,${sampleCamp}
0801CS221002,Ishaan Sharma,ishaan.sharma@campus.edu,Electronics,${sampleCamp}
0801CS221003,Diya Sengupta,diya.sengupta@campus.edu,Artificial Intelligence,${sampleCamp}`);
              }}
            >
              Load Sample Template
            </button>
          </div>
          <textarea 
            className="form-control" 
            rows={7}
            placeholder={`enrollment_id,name,email,department,campus\n0801CS221001,Aarav Patel,aarav@campus.edu,Computer Science,Bengaluru Campus\n0801CS221002,Ishaan Sharma,ishaan@campus.edu,Electronics,Noida Campus`}
            value={bulkCsvText}
            onChange={(e) => setBulkCsvText(e.target.value)}
            style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading || !bulkCsvText.trim()}>
            {loading ? 'Importing Students...' : 'Upload & Register All Students ➔'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
