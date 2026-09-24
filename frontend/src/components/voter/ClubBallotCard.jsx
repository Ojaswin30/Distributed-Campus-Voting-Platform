import React from 'react';
import { CheckCircle2, Check } from 'lucide-react';
import CandidateCard from './CandidateCard';

export default function ClubBallotCard({ club, index, chosenCandidateId, onSelectCandidate }) {
  const alreadyVoted = club.has_voted;

  return (
    <div 
      className="clean-card"
      style={{ 
        margin: 0,
        borderLeft: alreadyVoted 
          ? '6px solid var(--border-medium)' 
          : chosenCandidateId 
            ? '6px solid var(--primary)' 
            : '6px solid var(--border-subtle)',
        background: alreadyVoted ? 'var(--bg-surface-subtle)' : '#ffffff'
      }}
    >
      {/* Club Title & Status Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
              Club #{index + 1}
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{club.name}</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            {club.description || 'Campus student club election.'}
          </p>
        </div>

        <div>
          {alreadyVoted ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700 }}>
              <CheckCircle2 size={16} /> Ballot Already Cast
            </span>
          ) : chosenCandidateId ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--primary-light)', border: '1px solid var(--primary-border)', color: 'var(--primary)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700 }}>
              <Check size={16} /> Candidate Selected
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--warning-light)', border: '1px solid var(--warning-border)', color: 'var(--warning)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600 }}>
              Selection Pending
            </span>
          )}
        </div>
      </div>

      {/* Candidate Cards Grid */}
      {alreadyVoted ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', background: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-medium)' }}>
          🔒 You have already cast your vote in <strong>{club.name}</strong>. Multiple voting in the same club is restricted.
        </div>
      ) : (
        <div className="candidate-grid" style={{ margin: 0 }}>
          {club.candidates && club.candidates.length > 0 ? (
            club.candidates.map(candidate => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                isSelected={chosenCandidateId === candidate.id}
                onSelect={() => onSelectCandidate(club.id, candidate.id)}
              />
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No candidates running for this club election yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
