import React from 'react';
import { PlusCircle, Trash2, Power, PowerOff, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ClubsTab({
  clubs = [],
  onOpenAddClubModal,
  onOpenAddCandidateModal,
  onToggleClubStatus,
  onDeleteClub,
  onDeleteCandidate
}) {
  return (
    <div className="clean-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem' }}>🗳️ Election Clubs & Candidates</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Manage election clubs, toggle their active/connected status for campuses, or remove them.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onOpenAddClubModal}>
            <PlusCircle size={16} /> Add Election Club
          </button>
          <button className="btn btn-emerald" onClick={() => onOpenAddCandidateModal()}>
            <PlusCircle size={16} /> Assign Candidate
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {clubs.length > 0 ? (
          clubs.map(club => {
            const isConnected = club.is_active === 1 || club.is_active === true || club.is_active === undefined;

            return (
              <div 
                key={club.id} 
                style={{ 
                  background: isConnected ? 'var(--bg-surface-subtle)' : '#fbfbfc', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '1.25rem', 
                  border: isConnected ? '1px solid var(--border-subtle)' : '1px dashed var(--border-medium)',
                  opacity: isConnected ? 1 : 0.82
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{club.name}</h4>
                      
                      {/* Connection / Status Badge */}
                      {isConnected ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--success-light)', color: 'var(--success)', border: '1px solid var(--success-border)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700 }}>
                          <CheckCircle2 size={13} /> Connected & Active
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-medium)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600 }}>
                          <AlertCircle size={13} /> Disconnected / Disabled
                        </span>
                      )}
                    </div>
                    
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      📍 Campus: <strong>{club.campus}</strong> • {club.description || 'General Club Election'}
                    </div>
                  </div>

                  {/* Actions Header Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Toggle Active/Connected Button */}
                    <button 
                      className={`btn ${isConnected ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      onClick={() => onToggleClubStatus(club.id, !isConnected, club.name)}
                      title={isConnected ? 'Disable/Disconnect this club from election' : 'Enable/Connect this club to election'}
                    >
                      {isConnected ? <PowerOff size={13} color="var(--danger)" /> : <Power size={13} />}
                      {isConnected ? 'Disconnect' : 'Connect / Enable'}
                    </button>

                    {/* Add Candidate Button */}
                    <button 
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => onOpenAddCandidateModal(club.campus, club.id)}
                    >
                      <PlusCircle size={14} /> Add Candidate
                    </button>

                    {/* Delete Club Button */}
                    <button 
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '4px 8px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      onClick={() => onDeleteClub(club.id, club.name)}
                      title="Delete this club"
                    >
                      <Trash2 size={14} />
                    </button>

                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', background: '#ffffff', padding: '4px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--primary-border)' }}>
                      📊 {club.votes_cast || 0} Votes Cast
                    </span>
                  </div>
                </div>

                {/* Candidate Rosters */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {club.candidates && club.candidates.length > 0 ? (
                    club.candidates.map(cand => (
                      <div key={cand.id} style={{ background: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{cand.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cand.student_id} • {cand.votes} votes</div>
                        </div>
                        <button 
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                          onClick={() => onDeleteCandidate(cand.id, cand.name)}
                          title="Remove candidate"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No candidates running yet. Click "+ Add Candidate" above to assign a student.
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            No election clubs found. Click "+ Add Election Club" above to create one.
          </div>
        )}
      </div>
    </div>
  );
}
