import React from 'react';

export default function CandidateCard({ candidate, isSelected, onSelect }) {
  return (
    <div 
      className={`candidate-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      style={{ minHeight: '130px', cursor: 'pointer' }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            ID: {candidate.student_id}
          </span>
          <div style={{ 
            width: '20px', 
            height: '20px', 
            borderRadius: '50%', 
            border: isSelected ? '6px solid var(--primary)' : '2px solid var(--border-medium)',
            background: '#ffffff',
            transition: 'var(--transition)'
          }} />
        </div>

        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '2px', color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
          {candidate.name}
        </h4>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          🏛️ {candidate.department || 'General'}
        </p>
      </div>

      <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {candidate.email}
        </span>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}>
          {isSelected ? '✓ Choice' : 'Click to Pick'}
        </span>
      </div>
    </div>
  );
}
