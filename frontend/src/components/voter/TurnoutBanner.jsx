import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function TurnoutBanner({ totalVotesCast, allClubsCount }) {
  const benchmarkCapacity = Math.max(50, totalVotesCast + 10);
  const turnoutPercent = Math.min(100, (totalVotesCast / benchmarkCapacity) * 100).toFixed(1);

  return (
    <div className="turnout-banner">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '46px', height: '46px', background: 'var(--primary-light)', border: '1px solid var(--primary-border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <BarChart3 size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Live Election Turnout</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Real-time campus election participation and verified student voting.
            </p>
          </div>
        </div>

        <div className="turnout-metrics">
          <div className="turnout-item">
            <span className="turnout-val" style={{ color: 'var(--primary)' }}>{totalVotesCast}</span>
            <span className="turnout-lbl">Total Ballots Cast</span>
          </div>
          <div style={{ width: '1px', height: '36px', background: 'var(--border-subtle)' }} />
          <div className="turnout-item">
            <span className="turnout-val" style={{ color: 'var(--success)' }}>{allClubsCount}</span>
            <span className="turnout-lbl">Campus Elections</span>
          </div>
        </div>
      </div>

      {/* Live Participation Progress */}
      <div style={{ width: '100%', marginTop: '1.1rem', paddingTop: '0.9rem', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Live Campus Participation</span>
          <span style={{ color: 'var(--primary)' }}>{turnoutPercent}% ({totalVotesCast} / {benchmarkCapacity} Voters)</span>
        </div>
        <div style={{ width: '100%', height: '10px', background: 'var(--bg-body)', border: '1px solid var(--border-medium)', borderRadius: '99px', overflow: 'hidden' }}>
          <div 
            style={{ 
              width: `${Math.max(5, turnoutPercent)}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--primary), var(--success))', 
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)', 
              borderRadius: '99px' 
            }} 
          />
        </div>
      </div>
    </div>
  );
}
