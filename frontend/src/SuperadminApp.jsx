import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  UserPlus, 
  Mail, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Clock, 
  UserCheck, 
  AlertCircle,
  Sparkles,
  Edit2,
  Lock,
  Search,
  Settings,
  Key,
  Save,
  Globe,
  Sliders
} from 'lucide-react';
import { superadminApi } from './api/superadminApi';
import AlertBanner from './components/common/AlertBanner';

const DEFAULT_CLIENT_ID = '374708726653-rl5217itnoic8sdm0ql2952ggqpn7qtv.apps.googleusercontent.com';

export default function SuperadminApp() {
  const [activeTab, setActiveTab] = useState('admins'); // 'admins' | 'requests' | 'settings'
  const [admins, setAdmins] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Search & Filter state
  const [adminSearch, setAdminSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('admin');

  // Edit Admin Modal State
  const [editingAdmin, setEditingAdmin] = useState(null);

  // Google OAuth Settings State
  const [googleClientId, setGoogleClientId] = useState(() => {
    try {
      return localStorage.getItem('google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
    } catch {
      return import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
    }
  });

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (!googleClientId.trim()) {
      triggerAlert('error', 'Google Client ID cannot be empty.');
      return;
    }
    try {
      localStorage.setItem('google_client_id', googleClientId.trim());
      triggerAlert('success', '✓ Google OAuth 2.0 Client ID updated successfully.');
    } catch (err) {
      triggerAlert('error', 'Failed to save settings to localStorage.');
    }
  };

  const handleResetClientId = () => {
    setGoogleClientId(DEFAULT_CLIENT_ID);
    try {
      localStorage.setItem('google_client_id', DEFAULT_CLIENT_ID);
      triggerAlert('success', '✓ Reset Google OAuth Client ID to default.');
    } catch {}
  };

  // Fetch all admins and request tickets
  const loadData = async () => {
    setLoading(true);
    try {
      const [adminsRes, requestsRes] = await Promise.all([
        superadminApi.getAdmins(),
        superadminApi.getRequests()
      ]);

      if (adminsRes.success) {
        setAdmins(adminsRes.admins || []);
      }
      if (requestsRes.success) {
        setRequests(requestsRes.tickets || []);
      }
    } catch (err) {
      console.error('Error fetching superadmin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Add Admin Handler
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) {
      triggerAlert('error', 'Google Email is required.');
      return;
    }

    try {
      const data = await superadminApi.addAdmin({
        email: newAdminEmail.trim(),
        full_name: newAdminName.trim() || undefined,
        role: newAdminRole
      });

      if (data.success) {
        triggerAlert('success', `✓ Administrator '${data.admin.email}' authorized successfully!`);
        setShowAddModal(false);
        setNewAdminEmail('');
        setNewAdminName('');
        setNewAdminRole('admin');
        loadData();
      } else {
        triggerAlert('error', data.detail || 'Failed to add administrator.');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Error creating administrator.');
    }
  };

  // Toggle Admin Status
  const handleToggleAdminStatus = async (admin) => {
    const newStatus = admin.is_active === 1 ? 0 : 1;
    try {
      const data = await superadminApi.updateAdmin(admin.id, { is_active: newStatus });
      if (data.success) {
        triggerAlert('success', `✓ Administrator status updated.`);
        loadData();
      } else {
        triggerAlert('error', data.detail || 'Failed to update status.');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Error updating administrator.');
    }
  };

  // Delete Admin Handler
  const handleDeleteAdmin = async (adminId, email) => {
    if (!window.confirm(`Are you sure you want to revoke admin access for '${email}'?`)) return;

    try {
      const data = await superadminApi.deleteAdmin(adminId);
      if (data.success) {
        triggerAlert('success', `✓ Admin access revoked for '${email}'.`);
        loadData();
      } else {
        triggerAlert('error', data.detail || 'Failed to remove admin.');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Error deleting admin.');
    }
  };

  // Approve Ticket Handler
  const handleApproveTicket = async (ticketId, email) => {
    try {
      const data = await superadminApi.approveRequest(ticketId);
      if (data.success) {
        triggerAlert('success', `✓ Granted admin access to '${email}'!`);
        loadData();
      } else {
        triggerAlert('error', data.detail || 'Failed to approve request.');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Error approving ticket.');
    }
  };

  // Reject Ticket Handler
  const handleRejectTicket = async (ticketId) => {
    try {
      const data = await superadminApi.rejectRequest(ticketId);
      if (data.success) {
        triggerAlert('warning', `Ticket marked as rejected.`);
        loadData();
      } else {
        triggerAlert('error', data.detail || 'Failed to reject request.');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Error rejecting ticket.');
    }
  };

  // Delete Ticket Handler
  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;
    try {
      const data = await superadminApi.deleteRequest(ticketId);
      if (data.success) {
        triggerAlert('success', 'Ticket deleted.');
        loadData();
      } else {
        triggerAlert('error', data.detail || 'Failed to delete ticket.');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Error deleting ticket.');
    }
  };

  // Filtered lists with robust null safety
  const filteredAdmins = admins.filter(a => {
    const email = a?.email || '';
    const fullName = a?.full_name || '';
    const search = (adminSearch || '').toLowerCase();
    return email.toLowerCase().includes(search) || fullName.toLowerCase().includes(search);
  });

  const pendingRequestsCount = requests.filter(r => (r?.status || '').toLowerCase() === 'pending').length;

  const filteredRequests = requests.filter(r => {
    if (ticketStatusFilter === 'all') return true;
    return (r?.status || '').toLowerCase() === ticketStatusFilter.toLowerCase();
  });

  return (
    <div className="app-page-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-body)' }}>
      {/* SUPERADMIN PORTAL HEADER */}
      <header className="app-header">
        <div className="container header-flex">
          <div className="brand">
            <div className="brand-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Shield size={22} />
            </div>
            <div>
              <h1 className="brand-title">Superadmin Management Portal</h1>
              <div className="brand-subtitle">Standalone Port 5174 • Master Admin Email Registry & Access Request Desk</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-full)', border: '1px solid var(--primary-border)' }}>
              🔒 Standalone Node
            </span>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={loadData}
              disabled={loading}
              style={{ fontSize: '0.8rem', padding: '5px 10px' }}
              title="Refresh database records"
            >
              <RefreshCw size={13} className={loading ? 'pulse-dot' : ''} /> Refresh
            </button>
          </div>
        </div>
      </header>

      {/* MAIN SCROLLABLE CONTENT AREA */}
      <main className="app-main-content">
        <div className="app-content-inner">
          <AlertBanner alert={alert} />

          {/* Top Quick Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-title">Authorized Admin Google Accounts</div>
              <div className="stat-value" style={{ color: 'var(--primary)' }}>{admins.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Pending Access Tickets</div>
              <div className="stat-value" style={{ color: pendingRequestsCount > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                {pendingRequestsCount}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Total Requests Processed</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{requests.length}</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem' }}>
            <div className="nav-tabs">
              <button 
                type="button"
                className={`nav-tab-btn ${activeTab === 'admins' ? 'active' : ''}`}
                onClick={() => setActiveTab('admins')}
              >
                <UserCheck size={15} /> Authorized Admins ({admins.length})
              </button>
              <button 
                type="button"
                className={`nav-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                <Mail size={15} /> Access Request Tickets {pendingRequestsCount > 0 && <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '0.7rem' }}>{pendingRequestsCount}</span>}
              </button>
              <button 
                type="button"
                className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <Settings size={15} /> ⚙️ Google OAuth Settings
              </button>
            </div>

            {activeTab === 'admins' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <UserPlus size={15} /> + Add Authorized Admin Email
              </button>
            )}
          </div>

          {/* ================= TAB 1: AUTHORIZED ADMINS TABLE ================= */}
          {activeTab === 'admins' && (
            <div className="clean-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Authorized Administrator Google Accounts</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Admins listed below can sign in to the main election portal directly using Google OAuth.
                  </p>
                </div>

                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '8px', top: '9px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by email or name..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    style={{ paddingLeft: '28px', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Admin ID</th>
                      <th>Google Email Address</th>
                      <th>Full Name / Faculty</th>
                      <th>Role</th>
                      <th>Access Status</th>
                      <th>Created</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdmins.length > 0 ? (
                      filteredAdmins.map((admin) => (
                        <tr key={admin.id}>
                          <td><code>{admin.id}</code></td>
                          <td>
                            <strong>{admin.email || 'No email registered'}</strong>
                          </td>
                          <td>{admin.full_name || '—'}</td>
                          <td>
                            <span style={{ 
                              fontSize: '0.72rem', 
                              padding: '2px 8px', 
                              borderRadius: 'var(--radius-full)', 
                              background: admin.role === 'superadmin' ? 'var(--primary-light)' : 'var(--bg-surface-subtle)',
                              color: admin.role === 'superadmin' ? 'var(--primary)' : 'var(--text-secondary)',
                              fontWeight: 600,
                              textTransform: 'uppercase'
                            }}>
                              {admin.role || 'admin'}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleToggleAdminStatus(admin)}
                              style={{
                                border: 'none',
                                background: admin.is_active === 1 ? 'var(--success-light)' : 'var(--danger-light)',
                                color: admin.is_active === 1 ? 'var(--success)' : 'var(--danger)',
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="Click to toggle active status"
                            >
                              {admin.is_active === 1 ? '● Active' : '○ Disabled'}
                            </button>
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => handleDeleteAdmin(admin.id, admin.email || admin.id)}
                              style={{ padding: '3px 8px', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
                              title="Delete Admin"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No authorized administrator accounts found. Add one above or approve a request.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 2: ACCESS REQUEST TICKETS ================= */}
          {activeTab === 'requests' && (
            <div className="clean-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Admin Onboarding & Access Request Tickets</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Review access requests submitted by university faculty and election staff.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {['all', 'pending', 'approved', 'rejected'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setTicketStatusFilter(status)}
                      style={{
                        padding: '3px 9px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        border: '1px solid var(--border-subtle)',
                        background: ticketStatusFilter === status ? 'var(--primary)' : 'var(--bg-surface)',
                        color: ticketStatusFilter === status ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Google Email</th>
                      <th>Requester Name</th>
                      <th>Department</th>
                      <th>Reason / Note</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.length > 0 ? (
                      filteredRequests.map(ticket => (
                        <tr key={ticket.id}>
                          <td><code>{ticket.id}</code></td>
                          <td><strong>{ticket.email}</strong></td>
                          <td>{ticket.name}</td>
                          <td>{ticket.department || '—'}</td>
                          <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ticket.reason}>
                            {ticket.reason || '—'}
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              background: ticket.status === 'pending' ? 'var(--warning-light)' : ticket.status === 'approved' ? 'var(--success-light)' : 'var(--danger-light)',
                              color: ticket.status === 'pending' ? 'var(--warning)' : ticket.status === 'approved' ? 'var(--success)' : 'var(--danger)',
                              textTransform: 'capitalize'
                            }}>
                              {ticket.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '4px' }}>
                              {ticket.status === 'pending' && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-emerald"
                                    onClick={() => handleApproveTicket(ticket.id, ticket.email)}
                                    style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                    title="Approve & Grant Admin Access"
                                  >
                                    <CheckCircle size={12} /> Approve
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => handleRejectTicket(ticket.id)}
                                    style={{ padding: '3px 8px', fontSize: '0.72rem', color: 'var(--danger)' }}
                                    title="Reject Request"
                                  >
                                    <XCircle size={12} /> Reject
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => handleDeleteTicket(ticket.id)}
                                style={{ padding: '3px 6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}
                                title="Delete Ticket"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No request tickets found for status '{ticketStatusFilter}'.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 3: GOOGLE OAUTH & SYSTEM SETTINGS ================= */}
          {activeTab === 'settings' && (
            <div className="clean-card" style={{ padding: '1.5rem', maxWidth: '750px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Key size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Google OAuth 2.0 Client Configuration</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Configure the shared Google Client ID used by the Voter Portal and Admin Sign-In.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveSettings}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" htmlFor="googleClientIdInput" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    Google OAuth 2.0 Web Client ID *
                  </label>
                  <input
                    type="text"
                    id="googleClientIdInput"
                    className="form-control"
                    value={googleClientId}
                    onChange={(e) => setGoogleClientId(e.target.value)}
                    placeholder="e.g. 374708726653-rl5217itnoic8sdm0ql2952ggqpn7qtv.apps.googleusercontent.com"
                    style={{ fontSize: '0.85rem', fontFamily: 'monospace', padding: '8px 12px' }}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                    Obtained from Google Cloud Console &rarr; APIs & Services &rarr; Credentials &rarr; OAuth 2.0 Client IDs.
                  </small>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>
                    <Save size={14} /> Save Configuration
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleResetClientId}
                    style={{ padding: '8px 14px' }}
                    title="Reset to default project Client ID"
                  >
                    Reset to Default
                  </button>
                </div>
              </form>

              {/* Authorized Origins & URI Guidance */}
              <div style={{ background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', padding: '1.15rem', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  <Globe size={15} color="var(--primary)" /> Required Authorized JavaScript Origins (Google Cloud Console):
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Ensure your Google OAuth 2.0 Client credentials authorize the following origins in the Google Cloud Console:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <code>http://localhost:5173</code>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Main Election App (Voter & Admin)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <code>http://localhost:5174</code>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Superadmin Portal</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <code>http://127.0.0.1:8000</code>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>FastAPI Backend API</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= MODAL: ADD ADMIN EMAIL ================= */}
          {showAddModal && (
            <div className="modal-overlay">
              <div className="modal-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Add Authorized Admin Google Account</h3>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowAddModal(false)}
                    style={{ padding: '2px 8px', fontSize: '0.8rem' }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddAdmin}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="adminEmail">Google Account Email *</label>
                    <input
                      type="email"
                      id="adminEmail"
                      className="form-control"
                      placeholder="e.g. officer.john@campus.edu"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', marginTop: '3px' }}>
                      The administrator will sign in with this exact Google account.
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="adminFullName">Full Name / Title (Optional)</label>
                    <input
                      type="text"
                      id="adminFullName"
                      className="form-control"
                      placeholder="e.g. Dr. John Smith (Dean of Students)"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="adminRoleSelect">Role</label>
                    <select
                      id="adminRoleSelect"
                      className="form-control"
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value)}
                    >
                      <option value="admin">Election Administrator (admin)</option>
                      <option value="superadmin">Super Administrator (superadmin)</option>
                      <option value="officer">Election Officer (officer)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.25rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowAddModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      <CheckCircle size={14} /> Authorize Admin Email
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* SUPERADMIN PORTAL FOOTER */}
      <footer className="app-footer">
        <div className="container" style={{ padding: '0 1rem' }}>
          Campus Election Superadmin Portal • Isolated Port 5174 • Master Node Database Operations
        </div>
      </footer>
    </div>
  );
}
