import React, { useState } from 'react';
import { Vote, Shield, CheckCircle2 } from 'lucide-react';
import VoterPortal from './components/VoterPortal';
import AdminPortal from './components/AdminPortal';

export default function App() {
  const [activeTab, setActiveTab] = useState('voter'); // 'voter' | 'admin'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* APP HEADER */}
      <header className="app-header">
        <div className="container header-flex">
          <div className="brand">
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

            {/* Navigation Tabs */}
            <div className="nav-tabs">
              <button 
                className={`nav-tab-btn ${activeTab === 'voter' ? 'active' : ''}`}
                onClick={() => setActiveTab('voter')}
              >
                <Vote size={16} /> Voter Portal
              </button>
              <button 
                className={`nav-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                <Shield size={16} /> Admin Console
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="container" style={{ flex: 1, marginTop: '0.5rem' }}>
        {activeTab === 'voter' ? (
          <VoterPortal />
        ) : (
          <AdminPortal />
        )}
      </main>

      {/* APP FOOTER */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid var(--border-subtle)', padding: '1.25rem 0', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <div className="container">
          Secure Multi-Club Election Portal • Powered by Vite, React & Python FastAPI
        </div>
      </footer>
    </div>
  );
}
