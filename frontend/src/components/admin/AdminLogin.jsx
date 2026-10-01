import React, { useRef, useEffect, useState } from 'react';
import { Lock, AlertCircle, Shield, Send, FileText } from 'lucide-react';
import { superadminApi } from '../../api/superadminApi';
import { parseGoogleJwt } from '../../utils/jwtHelper';
import AlertBanner from '../common/AlertBanner';

export default function AdminLogin({
  onGoogleAdminLogin,
  loginError,
  loading
}) {
  const googleBtnRef = useRef(null);
  const googleClientId = (() => {
    try {
      return localStorage.getItem('google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    } catch {
      return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    }
  })();

  // Direct Email Fallback Input State
  const [directEmail, setDirectEmail] = useState('');

  // Access Request Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqEmail, setReqEmail] = useState('');
  const [reqName, setReqName] = useState('');
  const [reqDept, setReqDept] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);
  const [alert, setAlert] = useState(null);

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleDirectEmailSubmit = (e) => {
    e.preventDefault();
    if (!directEmail.trim()) {
      triggerAlert('error', 'Please enter your registered officer email.');
      return;
    }
    if (onGoogleAdminLogin) {
      onGoogleAdminLogin(`dev:${directEmail.trim().toLowerCase()}`);
    }
  };

  useEffect(() => {
    if (window.google?.accounts?.id && googleBtnRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (res) => {
            if (res.credential && onGoogleAdminLogin) {
              onGoogleAdminLogin(res.credential);
            }
          },
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
      } catch (e) {
        console.warn('Google Identity Services warning:', e);
      }
    }
  }, [googleClientId]);

  // Submit Admin Access Request Ticket
  const handleSubmitAccessRequest = async (e) => {
    e.preventDefault();
    if (!reqEmail.trim() || !reqName.trim()) {
      triggerAlert('error', 'Google Email and Full Name are required.');
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
        triggerAlert('success', `✓ Access request ticket submitted (${res.ticket?.id || 'Pending'}). A Superadmin can approve it from port 5174.`);
        setReqEmail('');
        setReqName('');
        setReqDept('');
        setReqReason('');
      } else {
        triggerAlert('error', res.detail || 'Failed to submit access request.');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Error submitting access ticket.');
    } finally {
      setSubmittingReq(false);
    }
  };

  return (
    <div className="clean-card" style={{ maxWidth: '420px', margin: '1.5rem auto', padding: '1.5rem', textAlign: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{ width: '42px', height: '42px', background: 'var(--primary-light)', border: '1px solid var(--primary-border)', borderRadius: 'var(--radius-md)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
          <Shield size={20} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Admin Console Sign In</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Authorized Election Officers & Administrators Only. Sign in using your registered Google account.
        </p>
      </div>

      <AlertBanner alert={alert} />

      {loginError && (
        <div className="alert alert-error" style={{ textAlign: 'left', marginBottom: '1rem' }}>
          <AlertCircle size={16} />
          <span>{loginError}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', margin: '1.25rem 0' }}>
        <div ref={googleBtnRef} style={{ minHeight: '38px' }} />
      </div>

      {/* Direct Officer Email Verification Form */}
      <div style={{ margin: '0.85rem 0', padding: '0.85rem', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
          ── OR SIGN IN WITH AUTHORIZED OFFICER EMAIL ──
        </div>
        <form onSubmit={handleDirectEmailSubmit} style={{ display: 'flex', gap: '6px' }}>
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

      <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          Need administrator privileges or election access?
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setShowRequestModal(true)}
          style={{ fontSize: '0.8rem', padding: '6px 14px', width: '100%', maxWidth: '260px' }}
        >
          <Send size={13} color="var(--primary)" /> Request Admin Access
        </button>
      </div>

      {/* ================= MODAL: RAISE ADMIN ACCESS REQUEST TICKET ================= */}
      {showRequestModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Request Admin Access</h3>
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
                <label className="form-label" htmlFor="adminReqEmail">Your Google Account Email *</label>
                <input
                  type="email"
                  id="adminReqEmail"
                  className="form-control"
                  placeholder="e.g. professor.adams@campus.edu"
                  value={reqEmail}
                  onChange={(e) => setReqEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="adminReqName">Full Name / Title *</label>
                <input
                  type="text"
                  id="adminReqName"
                  className="form-control"
                  placeholder="e.g. Prof. Sarah Adams"
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="adminReqDept">Department / Campus</label>
                <input
                  type="text"
                  id="adminReqDept"
                  className="form-control"
                  placeholder="e.g. Department of Computer Science & Engineering"
                  value={reqDept}
                  onChange={(e) => setReqDept(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="adminReqReason">Reason for Admin Access</label>
                <textarea
                  id="adminReqReason"
                  className="form-control"
                  rows={2}
                  placeholder="e.g. Appointed as Returning Officer for 2026 Student Elections"
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
