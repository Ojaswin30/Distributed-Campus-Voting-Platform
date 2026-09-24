import React from 'react';
import { Search } from 'lucide-react';

export default function AuditLogsTab({
  voterLogs = [],
  logSearch,
  setLogSearch
}) {
  const filteredLogs = voterLogs.filter(l => {
    const q = logSearch.toLowerCase();
    return (l.student_name && l.student_name.toLowerCase().includes(q)) || 
           (l.student_id && l.student_id.toLowerCase().includes(q)) || 
           (l.club_name && l.club_name.toLowerCase().includes(q)) || 
           (l.candidate_name && l.candidate_name.toLowerCase().includes(q)) || 
           (l.student_campus && l.student_campus.toLowerCase().includes(q)) ||
           (l.vote_id && l.vote_id.toLowerCase().includes(q));
  });

  return (
    <div className="clean-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem' }}>🪪 Verified Voter Records & Turnout Log</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Immutable database log of individual ballots with receipt codes, voter IDs, and timestamps.
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <input 
            type="text" 
            className="form-control"
            placeholder="Search audit logs..."
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Receipt Code</th>
              <th>Student ID</th>
              <th>Voter Name</th>
              <th>Campus</th>
              <th>Club Election</th>
              <th>Candidate Chosen</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <tr key={log.vote_id}>
                  <td><code style={{ color: 'var(--success)' }}>{log.vote_id}</code></td>
                  <td><strong>{log.student_id}</strong></td>
                  <td>{log.student_name}</td>
                  <td>📍 {log.student_campus}</td>
                  <td>{log.club_name}</td>
                  <td><span style={{ color: 'var(--primary)', fontWeight: 600 }}>{log.candidate_name}</span></td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{log.voted_at}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No vote records matching query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
