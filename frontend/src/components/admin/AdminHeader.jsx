import React from 'react';
import { RefreshCw, LogOut } from 'lucide-react';

export default function AdminHeader({ adminUser, onSync, onLogout }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Admin Operations Console</h2>
          <span style={{ fontSize: '0.75rem', background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary-border)', padding: '3px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
            Officer: {adminUser?.id || 'ADM-OFFICER-01'}
          </span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Multi-Campus Election Management & Live SQLite Audit Registry
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={onSync} style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}>
          <RefreshCw size={15} /> Sync
        </button>
        <button className="btn btn-secondary" onClick={onLogout} style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem', color: 'var(--danger)' }}>
          <LogOut size={15} /> Log Out
        </button>
      </div>
    </div>
  );
}
