import React, { useState, useEffect, useRef } from 'react';
import { Shield, GraduationCap, School, CheckCircle2, Lock, Sparkles, Send, FileText, ExternalLink, Loader2, Globe } from 'lucide-react';
import { voterApi } from '../../api/voterApi';
import { adminApi } from '../../api/adminApi';
import { superadminApi } from '../../api/superadminApi';
import { parseGoogleJwt } from '../../utils/jwtHelper';
import AlertBanner from '../common/AlertBanner';

export default function UnifiedAuthContainer({ onStudentLoginSuccess, onAdminLoginSuccess }) {
  // Active role tab: 'student' | 'teacher'
  const [role, setRole] = useState('student');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Browser OAuth Loopback Flow State
  const [browserAuthActive, setBrowserAuthActive] = useState(false);
  const [browserAuthState, setBrowserAuthState] = useState(null);
  const [browserAuthUrl, setBrowserAuthUrl] = useState('');

  // Access Request Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqEmail, setReqEmail] = useState('');
  const [reqName, setReqName] = useState('');
  const [reqDept, setReqDept] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

  // Direct Email Fallback Input State
  const [directEmail, setDirectEmail] = useState('');

  // Google OAuth Client ID
  const [googleClientId, setGoogleClientId] = useState(() => {
    try {
      return (
        import.meta.env.VITE_GOOGLE_CLIENT_ID ||
        localStorage.getItem('google_client_id') ||
        ''
      );
    } catch {
      return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    }
  });
  const googleBtnRef = useRef(null);

  // ============================================================================
  // POLLING FOR DESKTOP BROWSER OAUTH LOOPBACK COMPLETION
  // ============================================================================
  useEffect(() => {
    let pollTimer = null;
    if (browserAuthActive && browserAuthState) {
      pollTimer = setInterval(async () => {
        try {
          const res = await fetch(`/api/auth/desktop/status?state=${encodeURIComponent(browserAuthState)}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data.status === 'completed' && data.result) {
            setBrowserAuthActive(false);
            setBrowserAuthState(null);
            setBrowserAuthUrl('');
            if (role === 'student') {
              setSuccessMsg(`✓ Verified via Google: ${data.result.student?.name || 'Student'} (${data.result.campus})`);
              setTimeout(() => {
                if (onStudentLoginSuccess) {
                  onStudentLoginSuccess({
                    student: data.result.student,
                    ballotClubs: data.result.ballot_clubs || [],
                    campus: data.result.campus,
                  });
                }
              }, 350);
            } else {
              const adminData = data.result.admin;
              sessionStorage.setItem('adminToken', JSON.stringify(adminData));
              setSuccessMsg(`✓ Verified Officer: ${adminData.full_name || adminData.email}`);
              setTimeout(() => {
                if (onAdminLoginSuccess) {
                  onAdminLoginSuccess(adminData);
                }
              }, 350);
            }
          } else if (data.status === 'error') {
            setBrowserAuthActive(false);
            setBrowserAuthState(null);
            setBrowserAuthUrl('');
            setErrorMsg(data.error || 'Authentication rejected by election server.');
          }
        } catch (err) {
          console.warn('Polling error:', err);
        }
      }, 800);
    }

    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [browserAuthActive, browserAuthState, role]);

  // Initiate External Browser OAuth Sign-In
  const startBrowserGoogleLogin = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/desktop/start-google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, client_id: googleClientId })
      });

      const data = await res.json();
      if (data.success && data.state) {
        setBrowserAuthState(data.state);
        setBrowserAuthUrl(data.browser_url || '');
        setBrowserAuthActive(true);
      } else {
        setErrorMsg(data.detail || 'Could not initiate browser sign-in.');
      }
    } catch (e) {
      setErrorMsg('Failed to connect to local authentication loopback server.');
    } finally {
      setLoading(false);
    }
  };

  const cancelBrowserGoogleLogin = async () => {
    if (browserAuthState) {
      try {
        await fetch(`/api/auth/desktop/cancel?state=${encodeURIComponent(browserAuthState)}`, { method: 'POST' });
      } catch {}
    }
    setBrowserAuthActive(false);
    setBrowserAuthState(null);
    setBrowserAuthUrl('');
  };

  // Initialize Google Identity Services button on active tab change
  useEffect(() => {
    let checkInterval = null;
    const renderGoogleButton = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
            context: 'signin',
            use_fedcm_for_prompt: false,
            itp_support: true,
          });

          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_blue',
            size: 'large',
            shape: 'rectangular',
            text: 'signin_with',
            logo_alignment: 'left',
            width: 280,
          });
          if (checkInterval) clearInterval(checkInterval);
        } catch (e) {
          console.warn('Google Identity Services warning:', e);
        }
      }
    };

    renderGoogleButton();
    checkInterval = setInterval(renderGoogleButton, 300);
    const timeout = setTimeout(() => { if (checkInterval) clearInterval(checkInterval); }, 5000);
    return () => {
      if (checkInterval) clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [role, googleClientId]);

  // Handle Response from Google OAuth Popup
  const handleGoogleResponse = async (response) => {
    if (!response?.credential) {
      setErrorMsg('Google authentication was cancelled or returned no credential.');
      return;
    }
    if (role === 'student') {
      await verifyStudentGoogleToken(response.credential);
    } else {
      await verifyAdminGoogleToken(response.credential);
    }
  };

  // Direct Registered Email Authentication (Instant, Zero Popup)
  const handleDirectEmailLogin = async (e) => {
    e.preventDefault();
    if (!directEmail.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    const cleanEmail = directEmail.trim().toLowerCase();
    if (role === 'student') {
      await verifyStudentGoogleToken(`dev:${cleanEmail}`);
    } else {
      await verifyAdminGoogleToken(`dev:${cleanEmail}`);
    }
  };

  // Student Google Login Verification
  const verifyStudentGoogleToken = async (idToken) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    let tokenToSend = idToken;
    const parsed = parseGoogleJwt(idToken);
    if (parsed?.email && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      tokenToSend = `dev:${parsed.email}`;
    }

    try {
      const data = await voterApi.googleLogin(tokenToSend);
      if (!data.success) {
        setErrorMsg(data.detail || 'Google student verification failed.');
        setLoading(false);
        return;
      }

      setSuccessMsg(`✓ Verified via Google: ${data.student.name} (${data.campus})`);
      setTimeout(() => {
        if (onStudentLoginSuccess) {
          onStudentLoginSuccess({
            student: data.student,
            ballotClubs: data.ballot_clubs || [],
            campus: data.campus,
          });
        }
      }, 350);
    } catch (err) {
      setErrorMsg(err.message || 'Network error communicating with authentication server.');
    } finally {
      setLoading(false);
    }
  };

  // Teacher / Admin Google Login Verification
  const verifyAdminGoogleToken = async (idToken) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    let tokenToSend = idToken;
    const parsed = parseGoogleJwt(idToken);
    if (parsed?.email) {
      setReqEmail(parsed.email);
      setReqName(parsed.name || parsed.email.split('@')[0].replace('.', ' '));
    }
    if (parsed?.email && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      tokenToSend = `dev:${parsed.email}`;
    }

    try {
      const data = await adminApi.googleLogin(tokenToSend);
      if (!data.success) {
        setErrorMsg(data.detail || 'Google administrator verification failed.');
        setLoading(false);
        return;
      }

      sessionStorage.setItem('adminToken', JSON.stringify(data.admin));
      setSuccessMsg(`✓ Verified Officer: ${data.admin.full_name || data.admin.email}`);
      setTimeout(() => {
        if (onAdminLoginSuccess) {
          onAdminLoginSuccess(data.admin);
        }
      }, 350);
    } catch (err) {
      setErrorMsg(err.message || 'Google account is not authorized as an Election Administrator.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Admin Access Request Ticket
  const handleSubmitAccessRequest = async (e) => {
    e.preventDefault();
    if (!reqEmail.trim() || !reqName.trim()) {
      setErrorMsg('Google Email and Full Name are required.');
      return;
    }

    setSubmittingReq(true);
    try {
      const res = await superadminApi.createRequest({
        email: reqEmail.trim(),
        name: reqName.trim(),
        department: reqDept.trim() || undefined,
        reason: reqReason.trim() || undefined
      });

      if (res.success) {
        setShowRequestModal(false);
        setSuccessMsg(`✓ Access request ticket submitted (${res.ticket?.id || 'Pending'}). Superadmin can approve it from the Admin Management Portal on port 5174.`);
      } else {
        setErrorMsg(res.detail || 'Failed to submit access request.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error submitting access ticket.');
    } finally {
      setSubmittingReq(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '1rem auto', width: '100%' }}>
      {/* Role Toggle Switcher Header */}
      <div 
        style={{
          display: 'flex',
          background: 'var(--bg-surface)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-subtle)',
          marginBottom: '0.85rem',
          gap: '4px'
        }}
      >
        <button
          type="button"
          onClick={() => { setRole('student'); setErrorMsg(''); setSuccessMsg(''); cancelBrowserGoogleLogin(); }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: role === 'student' ? 'var(--primary)' : 'transparent',
            color: role === 'student' ? '#ffffff' : 'var(--text-secondary)',
            boxShadow: role === 'student' ? '0 2px 6px rgba(37, 99, 235, 0.2)' : 'none'
          }}
        >
          <GraduationCap size={15} />
          <span>Student / Voter</span>
        </button>

        <button
          type="button"
          onClick={() => { setRole('teacher'); setErrorMsg(''); setSuccessMsg(''); cancelBrowserGoogleLogin(); }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: role === 'teacher' ? 'var(--primary)' : 'transparent',
            color: role === 'teacher' ? '#ffffff' : 'var(--text-secondary)',
            boxShadow: role === 'teacher' ? '0 2px 6px rgba(37, 99, 235, 0.2)' : 'none'
          }}
        >
          <School size={15} />
          <span>Teacher / Admin</span>
        </button>
      </div>

      {/* Alerts */}
      <AlertBanner type="error" message={errorMsg} />
      <AlertBanner type="success" message={successMsg} />

      {/* MAIN INNER CONTAINER */}
      <div className="clean-card" style={{ padding: '1.5rem 1.4rem', position: 'relative', overflow: 'hidden' }}>
        
        {/* ================= STUDENT VIEW ================= */}
        {role === 'student' && (
          <div style={{ textAlign: 'center' }}>
            
            {/* Login Icons Container */}
            <div 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'linear-gradient(135deg, var(--bg-surface-subtle) 0%, var(--primary-light) 100%)',
                border: '1px solid var(--primary-border)',
                borderRadius: 'var(--radius-full)',
                marginBottom: '0.85rem',
                boxShadow: '0 1px 4px rgba(37, 99, 235, 0.06)'
              }}
            >
              <div style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>

              <div style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', color: '#ffffff', borderRadius: '50%' }}>
                <Shield size={14} />
              </div>

              <div style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--success)', color: '#ffffff', borderRadius: '50%' }}>
                <CheckCircle2 size={14} />
              </div>
            </div>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              Student Election Sign In
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.15rem', lineHeight: '1.4' }}>
              Sign in with your registered campus Google account to unlock your ballot.
            </p>

            {/* 1-Click External Browser Google Sign-In */}
            {browserAuthActive ? (
              <div 
                style={{
                  padding: '1.1rem',
                  background: 'rgba(59, 130, 246, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '0.4rem' }}>
                  <Loader2 size={16} className="spin" color="var(--primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary)' }}>
                    Browser Sign-In In Progress...
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.65rem', lineHeight: '1.4' }}>
                  Please complete the Google authentication in the opened browser window. This app will automatically proceed once approved.
                </p>
                {browserAuthUrl && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <a 
                      href={browserAuthUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Globe size={12} /> Didn't open? Click here to open sign-in portal
                    </a>
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelBrowserGoogleLogin}
                  style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startBrowserGoogleLogin}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '9px 16px',
                  background: '#ffffff',
                  color: '#1f2937',
                  border: '1px solid #d1d5db',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s ease',
                  marginBottom: '0.75rem'
                }}
                onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'; e.currentTarget.style.background = '#f9fafb'; }}
                onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'; e.currentTarget.style.background = '#ffffff'; }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Sign In with Google (Browser)</span>
                <ExternalLink size={13} color="#6b7280" />
              </button>
            )}

            {/* Embedded Google Identity Services Button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '38px', margin: '0.4rem 0 0.5rem', width: '100%' }}>
              <div 
                ref={googleBtnRef} 
                style={{ minHeight: '38px', display: 'flex', justifyContent: 'center', width: '100%' }} 
              />
            </div>

            {/* Direct Email Verification Form */}
            <div style={{ margin: '0.85rem 0', padding: '0.85rem', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                ── OR SIGN IN WITH REGISTERED EMAIL ──
              </div>
              <form onSubmit={handleDirectEmailLogin} style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. student.email@campus.edu"
                  value={directEmail}
                  onChange={(e) => setDirectEmail(e.target.value)}
                  style={{ fontSize: '0.82rem', padding: '7px 10px', flex: 1 }}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ fontSize: '0.82rem', padding: '7px 12px', whiteSpace: 'nowrap' }}
                >
                  {loading ? 'Verifying...' : 'Continue ➔'}
                </button>
              </form>
            </div>

            {/* Feature Pills */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '1.15rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-surface-subtle)', padding: '2px 8px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={11} color="var(--primary)" /> 1-Click Multi-Club
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-surface-subtle)', padding: '2px 8px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Shield size={11} color="var(--success)" /> Verified Ballot
              </span>
            </div>
          </div>
        )}

        {/* ================= TEACHER / ADMIN VIEW (GOOGLE AUTH ONLY) ================= */}
        {role === 'teacher' && (
          <div style={{ textAlign: 'center' }}>
            {/* Teacher Icon Container */}
            <div 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'linear-gradient(135deg, var(--bg-surface-subtle) 0%, var(--primary-light) 100%)',
                border: '1px solid var(--primary-border)',
                borderRadius: 'var(--radius-full)',
                marginBottom: '0.85rem',
                boxShadow: '0 1px 4px rgba(37, 99, 235, 0.06)'
              }}
            >
              <div style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
              <div style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', color: '#ffffff', borderRadius: '50%' }}>
                <Lock size={14} />
              </div>
            </div>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              Election Admin Portal
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.15rem', lineHeight: '1.4' }}>
              Sign in with your authorized administrator Google account. Access is restricted to registered election staff.
            </p>

            {/* 1-Click External Browser Google Sign-In */}
            {browserAuthActive ? (
              <div 
                style={{
                  padding: '1.1rem',
                  background: 'rgba(59, 130, 246, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '0.4rem' }}>
                  <Loader2 size={16} className="spin" color="var(--primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary)' }}>
                    Browser Sign-In In Progress...
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.65rem', lineHeight: '1.4' }}>
                  Please complete the administrator Google authentication in your browser. This window will automatically refresh once authorized.
                </p>
                {browserAuthUrl && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <a 
                      href={browserAuthUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Globe size={12} /> Didn't open? Click here to open sign-in portal
                    </a>
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelBrowserGoogleLogin}
                  style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startBrowserGoogleLogin}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '9px 16px',
                  background: '#ffffff',
                  color: '#1f2937',
                  border: '1px solid #d1d5db',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s ease',
                  marginBottom: '0.75rem'
                }}
                onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'; e.currentTarget.style.background = '#f9fafb'; }}
                onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'; e.currentTarget.style.background = '#ffffff'; }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Sign In with Google (Browser)</span>
                <ExternalLink size={13} color="#6b7280" />
              </button>
            )}

            {/* Embedded Google Identity Services Button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '38px', margin: '0.4rem 0 0.5rem', width: '100%' }}>
              <div 
                ref={googleBtnRef} 
                style={{ minHeight: '38px', display: 'flex', justifyContent: 'center', width: '100%' }} 
              />
            </div>

            {/* Direct Officer Email Verification Form */}
            <div style={{ margin: '0.85rem 0', padding: '0.85rem', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                ── OR SIGN IN WITH AUTHORIZED OFFICER EMAIL ──
              </div>
              <form onSubmit={handleDirectEmailLogin} style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. officer.email@campus.edu"
                  value={directEmail}
                  onChange={(e) => setDirectEmail(e.target.value)}
                  style={{ fontSize: '0.82rem', padding: '7px 10px', flex: 1 }}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ fontSize: '0.82rem', padding: '7px 12px', whiteSpace: 'nowrap' }}
                >
                  {loading ? 'Verifying...' : 'Login ➔'}
                </button>
              </form>
            </div>

            {/* Raise Access Request Action Box */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Need administrator access or taking charge of elections?
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setShowRequestModal(true); setErrorMsg(''); setSuccessMsg(''); cancelBrowserGoogleLogin(); }}
                style={{ fontSize: '0.8rem', padding: '6px 14px', width: '100%', maxWidth: '260px' }}
              >
                <Send size={13} color="var(--primary)" /> Raise Admin Access Request
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ================= MODAL: RAISE ADMIN ACCESS REQUEST TICKET ================= */}
      {showRequestModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Raise Admin Access Request</h3>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowRequestModal(false)}
                style={{ padding: '2px 8px', fontSize: '0.8rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Submit your details to request administrator privileges. A Superadmin will review your application from the management portal on port 5174.
            </p>

            <form onSubmit={handleSubmitAccessRequest}>
              <div className="form-group">
                <label className="form-label" htmlFor="reqEmail">Your Google Account Email *</label>
                <input
                  type="email"
                  id="reqEmail"
                  className="form-control"
                  placeholder="e.g. professor.adams@campus.edu"
                  value={reqEmail}
                  onChange={(e) => setReqEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reqName">Full Name / Title *</label>
                <input
                  type="text"
                  id="reqName"
                  className="form-control"
                  placeholder="e.g. Prof. Sarah Adams"
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reqDept">Department / Campus</label>
                <input
                  type="text"
                  id="reqDept"
                  className="form-control"
                  placeholder="e.g. Department of Computer Science & Engineering"
                  value={reqDept}
                  onChange={(e) => setReqDept(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reqReason">Reason for Admin Access</label>
                <textarea
                  id="reqReason"
                  className="form-control"
                  rows={2}
                  placeholder="e.g. Appointed as Chief Returning Officer for 2026 Student Elections"
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRequestModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingReq}
                >
                  <Send size={13} /> {submittingReq ? 'Submitting...' : 'Submit Request Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
