import React from 'react';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';

export default function CampusesTab({
  campuses = [],
  onOpenAddModal,
  onOpenEditModal,
  onDeleteCampus
}) {
  return (
    <div className="clean-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem' }}>🏛️ University Campuses Registry</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Manage campus branches, geographical divisions, and their associated students and elections.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenAddModal}>
          <PlusCircle size={18} /> Add New Campus
        </button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Campus Code</th>
              <th>Campus Name</th>
              <th>Location / Zone</th>
              <th>Description</th>
              <th>Students</th>
              <th>Clubs</th>
              <th>Votes Cast</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campuses.map(campus => (
              <tr key={campus.id}>
                <td>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                    {campus.code}
                  </span>
                </td>
                <td><strong>{campus.name}</strong></td>
                <td style={{ color: 'var(--text-secondary)' }}>📍 {campus.location || '—'}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: '240px' }}>{campus.description || '—'}</td>
                <td><strong>{campus.students_count || 0}</strong></td>
                <td><strong>{campus.clubs_count || 0}</strong></td>
                <td><span style={{ color: 'var(--success)', fontWeight: 700 }}>{campus.votes_count || 0}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', color: 'var(--primary)' }}
                      onClick={() => onOpenEditModal(campus)}
                      title="Edit Campus"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button 
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', color: 'var(--danger)' }}
                      onClick={() => onDeleteCampus(campus.id, campus.name)}
                      title="Delete Campus"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
