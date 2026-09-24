import React from 'react';
import { MapPin, LogOut } from 'lucide-react';

export default function StudentProfileHeader({ studentProfile, onSignOut }) {
  if (!studentProfile) return null;

  return (
    <div className="clean-card" style={{ padding: '1.25rem 1.75rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="auth-avatar" style={{ width: '48px', height: '48px', fontSize: '1.2rem', background: 'var(--primary-light)', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
            {studentProfile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{studentProfile.name}</h3>
              <span style={{ fontSize: '0.78rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                ID: {studentProfile.enrollment_id}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
              <span>📧 {studentProfile.email}</span>
              <span>•</span>
              <span>🎓 {studentProfile.department || 'Academic Division'}</span>
            </div>
          </div>
        </div>

        {/* Campus Restriction Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--primary-light)', border: '1.5px solid var(--primary-border)', borderRadius: 'var(--radius-md)', padding: '6px 14px', textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', fontWeight: 700 }}>
              Assigned Campus Ballot
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={16} color="var(--primary)" /> {studentProfile.campus}
            </div>
          </div>

          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
            onClick={onSignOut}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
