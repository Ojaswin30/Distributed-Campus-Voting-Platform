import React from 'react';
import { Lock, AlertCircle } from 'lucide-react';

export default function AdminLogin({
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  loginError,
  loading,
  onLogin
}) {
  return (
    <div className="clean-card" style={{ maxWidth: '460px', margin: '3rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ width: '56px', height: '56px', background: 'var(--primary-light)', border: '1.5px solid var(--primary-border)', borderRadius: 'var(--radius-md)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <Lock size={28} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Admin Console Sign In</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Authorized Election Officers & System Administrators Only. Students have no access to this portal.
        </p>
      </div>

      {loginError && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{loginError}</span>
        </div>
      )}

      <form onSubmit={onLogin}>
        <div className="form-group">
          <label className="form-label" htmlFor="adminUser">Admin ID / Officer Username *</label>
          <input 
            type="text" 
            id="adminUser"
            className="form-control"
            placeholder="e.g. ADM-OFFICER-01 or admin"
            value={loginUsername}
            onChange={(e) => setLoginUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="adminPass">Admin Password *</label>
          <input 
            type="password" 
            id="adminPass"
            className="form-control"
            placeholder="Enter admin password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
          disabled={loading}
        >
          {loading ? 'Authenticating Officer...' : 'Authenticate & Open Dashboard ➔'}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <div>Default Officer ID: <code>ADM-OFFICER-01</code> (Pass: <code>admin123</code>)</div>
        <div>Superadmin ID: <code>ADM-SUPER-01</code> (Pass: <code>supersecret123</code>)</div>
      </div>
    </div>
  );
}
