import React, { useState } from 'react';

export default function StudentLoginStep({
  loading,
  googleClientId,
  setGoogleClientId,
  onTriggerGoogleSignIn,
  googleBtnRef
}) {
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className="clean-card" style={{ maxWidth: '480px', margin: '2rem auto', textAlign: 'center', padding: '2.5rem 2rem' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1.5px solid var(--primary-border)' }}>
        <svg width="32" height="32" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
      </div>

      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>Student Portal Sign In</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '2rem', lineHeight: '1.5' }}>
        Sign in securely with your Google account to access your campus election ballot.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', width: '100%' }}>
        {/* GIS Iframe Button if available */}
        <div 
          ref={googleBtnRef} 
          style={{ minHeight: '44px', display: 'flex', justifyContent: 'center', width: '100%' }} 
        />

        {/* Direct Google Sign In Button */}
        <button
          type="button"
          onClick={onTriggerGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            maxWidth: '280px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '12px 20px',
            fontSize: '0.95rem',
            fontWeight: 600,
            background: '#ffffff',
            color: '#3c4043',
            border: '1px solid #dadce0',
            borderRadius: '6px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
              e.currentTarget.style.borderColor = '#c6c6c6';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
            e.currentTarget.style.borderColor = '#dadce0';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
        </button>
      </div>

      <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', justifyContent: 'center' }}>
        <button 
          type="button" 
          className="btn btn-secondary"
          style={{ fontSize: '0.75rem', padding: '2px 8px', color: 'var(--text-muted)' }}
          onClick={() => setShowConfig(!showConfig)}
        >
          ⚙️ Google Client ID Settings
        </button>
      </div>

      {showConfig && (
        <div style={{ marginTop: '0.75rem', padding: '0.85rem', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', textAlign: 'left' }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>Google OAuth 2.0 Client ID:</label>
          <input 
            type="text" 
            className="form-control" 
            value={googleClientId}
            onChange={(e) => {
              setGoogleClientId(e.target.value);
              try { localStorage.setItem('google_client_id', e.target.value); } catch {}
            }}
            placeholder="e.g. 1008719970978-xxx.apps.googleusercontent.com"
            style={{ fontSize: '0.82rem' }}
          />
        </div>
      )}
    </div>
  );
}
