import React from 'react';
import { Vote } from 'lucide-react';
import Modal from '../common/Modal';

export default function VoteReviewModal({
  isOpen,
  studentProfile,
  ballotClubs,
  selections,
  loading,
  onClose,
  onConfirm
}) {
  if (!isOpen || !studentProfile) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="580px">
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <div style={{ width: '52px', height: '52px', background: 'var(--primary-light)', border: '1px solid var(--primary-border)', borderRadius: '50%', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
          <Vote size={26} />
        </div>
        <h3 style={{ fontSize: '1.4rem' }}>Confirm Your Campus Ballot</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Please review your selections before committing them to the official database.
        </p>
      </div>

      <div style={{ background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
          <strong>Voter:</strong> {studentProfile.name} ({studentProfile.email}) • 📍 <strong>{studentProfile.campus}</strong>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
          {Object.entries(selections).map(([clubId, candId]) => {
            const club = ballotClubs.find(c => c.id === clubId);
            const cand = club?.candidates.find(c => c.id === candId);

            return (
              <div key={clubId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{club?.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dept: {cand?.department}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.95rem' }}>
                    {cand?.name}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cand?.student_id}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={onClose}
          disabled={loading}
        >
          Back to Edit
        </button>
        <button 
          type="button" 
          className="btn btn-emerald"
          onClick={onConfirm}
          disabled={loading}
          style={{ padding: '0.75rem 1.6rem' }}
        >
          {loading ? 'Committing Votes...' : '✓ Confirm & Cast All Votes'}
        </button>
      </div>
    </Modal>
  );
}
