import React from 'react';
import { Filter } from 'lucide-react';

export default function AdminNavigation({
  adminTab,
  setAdminTab,
  selectedCampusFilter,
  setSelectedCampusFilter,
  campuses = [],
  totalCampuses = 0,
  totalLogs = 0
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button 
          className={`btn ${adminTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}
          onClick={() => setAdminTab('overview')}
        >
          📊 Live Overview
        </button>
        <button 
          className={`btn ${adminTab === 'campuses' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}
          onClick={() => setAdminTab('campuses')}
        >
          🏛️ Campuses ({totalCampuses})
        </button>
        <button 
          className={`btn ${adminTab === 'clubs' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}
          onClick={() => setAdminTab('clubs')}
        >
          🗳️ Clubs & Candidates
        </button>
        <button 
          className={`btn ${adminTab === 'students' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}
          onClick={() => setAdminTab('students')}
        >
          👥 Students Registry
        </button>
        <button 
          className={`btn ${adminTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}
          onClick={() => setAdminTab('audit')}
        >
          🪪 Audit Logs ({totalLogs})
        </button>
      </div>

      {/* Global Campus Filter dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Filter size={16} color="var(--text-muted)" />
        <select 
          className="form-control"
          value={selectedCampusFilter}
          onChange={(e) => setSelectedCampusFilter(e.target.value)}
          style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
        >
          <option value="">🌐 All Campuses</option>
          {campuses.map(c => (
            <option key={c.id} value={c.name}>{c.name} ({c.code})</option>
          ))}
        </select>
      </div>
    </div>
  );
}
