import React, { useState, useEffect } from 'react';
import { Vote, Shield, CheckCircle2, UserCheck, LogOut, GraduationCap, School } from 'lucide-react';
import UnifiedAuthContainer from './components/auth/UnifiedAuthContainer';
import VoterPortal from './components/VoterPortal';
import AdminPortal from './components/AdminPortal';

export default function App() {
  // Authentication state: 'unauthenticated' | 'student' | 'teacher'
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem('adminToken');
      if (!raw || raw === 'undefined' || raw === 'null') return null;
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : null;
    } catch {
      sessionStorage.removeItem('adminToken');
      return null;
    }
  });

  const [authMode, setAuthMode] = useState(() => {
    try {
      const raw = sessionStorage.getItem('adminToken');
      if (!raw || raw === 'undefined' || raw === 'null') return 'unauthenticated';
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return 'teacher';
      sessionStorage.removeItem('adminToken');
      return 'unauthenticated';
    } catch {
      sessionStorage.removeItem('adminToken');
      return 'unauthenticated';
    }
  });

  const [studentData, setStudentData] = useState(null);

  // Handler for student login success via Google SSO
  const handleStudentLoginSuccess = (payload) => {
    setStudentData(payload);
    setAuthMode('student');
  };

  // Handler for teacher/admin login success
  const handleAdminLoginSuccess = (admin) => {
    setAdminUser(admin);
    setAuthMode('teacher');
  };

  // Sign out / return to unified auth container
  const handleSignOut = () => {
    sessionStorage.removeItem('adminToken');
    setStudentData(null);
    setAdminUser(null);
    setAuthMode('unauthenticated');
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  return (
    <div className="app-page-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-body)' }}>
      {/* PERSISTENT STABLE APP HEADER */}
      <header className="app-header">
        <div className="container header-flex">
          <div className="brand" style={{ cursor: 'pointer' }} onClick={() => { if (authMode === 'unauthenticated') handleSignOut(); }}>
            <div className="brand-icon">
              <Vote size={26} />
            </div>
            <div>
              <h1 className="brand-title">Campus Digital Voting System</h1>
              <div className="brand-subtitle">Vite + React + Python FastAPI • Live SQLite Sync</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span className="turnout-pulse">
              <span className="pulse-dot" />
              Live System Active
            </span>

            {/* If authenticated, show user chip & Exit / Log Out button */}
            {authMode === 'student' && studentData?.student && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '0.85rem', 
                  fontWeight: 600, 
                  background: 'var(--primary-light)', 
                  color: 'var(--primary)', 
                  border: '1px solid var(--primary-border)', 
                  padding: '6px 12px', 
                  borderRadius: 'var(--radius-full)' 
                }}>
                  <GraduationCap size={15} />
                  {studentData.student.name} ({studentData.campus || studentData.student.campus})
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSignOut}
                  style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                  title="Sign out of student account"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}

            {authMode === 'teacher' && adminUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '0.85rem', 
                  fontWeight: 600, 
                  background: 'var(--primary-light)', 
                  color: 'var(--primary)', 
                  border: '1px solid var(--primary-border)', 
                  padding: '6px 12px', 
                  borderRadius: 'var(--radius-full)' 
                }}>
                  <School size={15} />
                  {adminUser.name || 'Officer'} ({adminUser.role || 'Admin'})
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSignOut}
                  style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                  title="Log out of election console"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* INDEPENDENTLY SCROLLABLE INNER CONTAINER */}
      <main className="app-main-content">
        <div className="app-content-inner">
          {authMode === 'unauthenticated' && (
            <UnifiedAuthContainer
              onStudentLoginSuccess={handleStudentLoginSuccess}
              onAdminLoginSuccess={handleAdminLoginSuccess}
            />
          )}

          {authMode === 'student' && studentData && (
            <VoterPortal
              initialStudentProfile={studentData.student}
              initialBallotClubs={studentData.ballotClubs}
              onSignOut={handleSignOut}
            />
          )}

          {authMode === 'teacher' && (
            <AdminPortal
              adminUser={adminUser}
              onLogout={handleSignOut}
            />
          )}
        </div>
      </main>

      {/* PERSISTENT NON-SCROLLABLE FOOTER */}
      <footer className="app-footer">
        <div className="container" style={{ padding: '0 1.25rem' }}>
          Secure Multi-Club Campus Election Platform • Verified Google Single Sign-On & Immutable Ballot Auditing
        </div>
      </footer>
    </div>
  );
}
