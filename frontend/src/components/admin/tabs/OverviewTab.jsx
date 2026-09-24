import React from 'react';
import { Trash2 } from 'lucide-react';

export default function OverviewTab({
  clubs = [],
  selectedClubId,
  setSelectedClubId,
  selectedClub,
  onDeleteCandidate
}) {
  return (
    <div className="clean-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem' }}>📊 Live Leaderboard & Standings</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Real-time vote tallies and candidate rankings by election club.
          </p>
        </div>

        <div>
          <select 
            className="form-control" 
            value={selectedClubId} 
            onChange={(e) => setSelectedClubId(e.target.value)}
            style={{ minWidth: '240px' }}
          >
            {clubs.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.campus})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedClub ? (
        <div>
          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <strong>{selectedClub.name}</strong> • 📍 <span>{selectedClub.campus}</span>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
              🗳️ {selectedClub.votes_cast || 0} Total Votes
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selectedClub.candidates && selectedClub.candidates.length > 0 ? (
              selectedClub.candidates.map(cand => {
                const clubTotalVotes = Math.max(1, selectedClub.votes_cast || 1);
                const pct = ((cand.votes / clubTotalVotes) * 100).toFixed(1);

                return (
                  <div 
                    key={cand.id}
                    style={{ background: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '1.05rem' }}>{cand.name}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
                          ({cand.student_id} • {cand.department})
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>
                          {cand.votes} Votes ({pct}%)
                        </span>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', color: 'var(--danger)' }}
                          onClick={() => onDeleteCandidate(cand.id, cand.name)}
                          title="Remove Candidate"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Vote Progress Bar */}
                    <div style={{ width: '100%', height: '10px', background: 'var(--bg-surface-subtle)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${Math.max(2, pct)}%`, 
                          height: '100%', 
                          background: 'var(--primary)', 
                          borderRadius: '99px',
                          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} 
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No candidates assigned to this election yet.</p>
            )}
          </div>
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)' }}>No active election selected.</p>
      )}
    </div>
  );
}
