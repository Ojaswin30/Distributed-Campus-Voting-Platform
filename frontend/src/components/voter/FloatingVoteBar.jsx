import React from 'react';
import { Vote } from 'lucide-react';

export default function FloatingVoteBar({
  studentProfile,
  selectedCount,
  totalVotableClubs,
  loading,
  onClear,
  onReview
}) {
  if (!totalVotableClubs || totalVotableClubs === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#ffffff',
      borderTop: '1px solid var(--border-medium)',
      padding: '1rem 1.5rem',
      boxShadow: 'var(--shadow-float)',
      zIndex: 90
    }}>
      <div className="container" style={{ padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Vote size={20} color="var(--primary)" />
            <span>Ballot Status: <strong>{selectedCount} of {totalVotableClubs}</strong> clubs selected</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Campus: <strong>{studentProfile.campus}</strong> • All votes will be recorded together atomically.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onClear}
            disabled={selectedCount === 0 || loading}
            style={{ fontSize: '0.9rem' }}
          >
            Clear Choices
          </button>
          <button 
            type="button" 
            className="btn btn-emerald"
            disabled={selectedCount === 0 || loading}
            onClick={onReview}
            style={{ fontSize: '1rem', padding: '0.75rem 1.8rem' }}
          >
            <Vote size={18} /> Review & Cast All Votes ({selectedCount}) ➔
          </button>
        </div>
      </div>
    </div>
  );
}
