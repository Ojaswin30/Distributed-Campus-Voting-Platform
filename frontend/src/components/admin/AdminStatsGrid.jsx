import React from 'react';

export default function AdminStatsGrid({
  totalVotes = 0,
  totalCampuses = 0,
  totalClubs = 0,
  totalStudents = 0
}) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-title">Total Ballots Cast</div>
        <div className="stat-value" style={{ color: 'var(--primary)' }}>{totalVotes}</div>
      </div>
      <div className="stat-card">
        <div className="stat-title">Registered Campuses</div>
        <div className="stat-value" style={{ color: 'var(--text-main)' }}>{totalCampuses}</div>
      </div>
      <div className="stat-card">
        <div className="stat-title">Active Club Elections</div>
        <div className="stat-value" style={{ color: 'var(--success)' }}>{totalClubs}</div>
      </div>
      <div className="stat-card">
        <div className="stat-title">Registered Students</div>
        <div className="stat-value" style={{ color: 'var(--warning)' }}>{totalStudents}</div>
      </div>
    </div>
  );
}
