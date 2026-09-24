import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';

// Sub-components
import AdminLogin from './admin/AdminLogin';
import AdminHeader from './admin/AdminHeader';
import AdminStatsGrid from './admin/AdminStatsGrid';
import AdminNavigation from './admin/AdminNavigation';
import AlertBanner from './common/AlertBanner';

// Tabs
import OverviewTab from './admin/tabs/OverviewTab';
import CampusesTab from './admin/tabs/CampusesTab';
import ClubsTab from './admin/tabs/ClubsTab';
import StudentsTab from './admin/tabs/StudentsTab';
import AuditLogsTab from './admin/tabs/AuditLogsTab';

// Modals
import AddCampusModal from './admin/modals/AddCampusModal';
import EditCampusModal from './admin/modals/EditCampusModal';
import AddClubModal from './admin/modals/AddClubModal';
import AddCandidateModal from './admin/modals/AddCandidateModal';
import AddStudentModal from './admin/modals/AddStudentModal';
import BulkUploadModal from './admin/modals/BulkUploadModal';

export default function AdminPortal() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return Boolean(sessionStorage.getItem('adminToken'));
  });

  const [adminUser, setAdminUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('adminToken')) || null;
    } catch {
      return null;
    }
  });

  // Login form state
  const [loginUsername, setLoginUsername] = useState('ADM-OFFICER-01');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');

  // Active Admin Sub-tab
  const [adminTab, setAdminTab] = useState('overview');

  // Campus Filter
  const [selectedCampusFilter, setSelectedCampusFilter] = useState('');

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState({
    total_votes: 0,
    total_campuses: 0,
    total_students: 0,
    total_clubs: 0,
    campuses: [],
    clubs: [],
    students: [],
    voter_logs: []
  });

  const [selectedClubId, setSelectedClubId] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Search queries
  const [studentSearch, setStudentSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');

  // Modals state
  const [showAddCampusModal, setShowAddCampusModal] = useState(false);
  const [showEditCampusModal, setShowEditCampusModal] = useState(false);
  const [editingCampus, setEditingCampus] = useState(null);
  const [showAddClubModal, setShowAddClubModal] = useState(false);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [candidatePrefillCampus, setCandidatePrefillCampus] = useState('');
  const [candidatePrefillClubId, setCandidatePrefillClubId] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

  // Helper list getters
  const activeCampusList = dashboardData.all_campuses && dashboardData.all_campuses.length > 0
    ? dashboardData.all_campuses
    : dashboardData.campuses;
  const currentDefaultCampus = selectedCampusFilter || (activeCampusList[0]?.name || 'Bengaluru Campus');

  // Fetch Dashboard Data
  const fetchDashboardData = async () => {
    try {
      const data = await adminApi.getDashboardData(selectedCampusFilter);
      if (data.success) {
        setDashboardData(data);
        if (data.clubs.length > 0 && (!selectedClubId || !data.clubs.some(c => c.id === selectedClubId))) {
          setSelectedClubId(data.clubs[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 4000);
      return () => clearInterval(interval);
    }
  }, [isAdminLoggedIn, selectedCampusFilter]);

  // Alert trigger
  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const data = await adminApi.login(loginUsername.trim(), loginPassword.trim());
      if (!data.success) {
        setLoginError(data.detail || 'Invalid Admin ID or password.');
        setLoading(false);
        return;
      }

      sessionStorage.setItem('adminToken', JSON.stringify(data.admin));
      setAdminUser(data.admin);
      setIsAdminLoggedIn(true);
    } catch (err) {
      setLoginError(err.message || 'Error connecting to backend API.');
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    setAdminUser(null);
    setIsAdminLoggedIn(false);
  };

  // Campus handlers
  const handleAddCampus = async (campusData) => {
    try {
      const data = await adminApi.addCampus(campusData);
      if (data.success) {
        triggerAlert('success', `Campus '${data.campus.name}' (${data.campus.code}) created!`);
        setShowAddCampusModal(false);
        fetchDashboardData();
      } else {
        triggerAlert('error', data.detail || 'Failed to add campus.');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Error creating campus.');
    }
  };

  const handleOpenEditCampus = (campus) => {
    setEditingCampus(campus);
    setShowEditCampusModal(true);
  };

  const handleUpdateCampus = async (campusId, updateData) => {
    try {
      const data = await adminApi.updateCampus(campusId, updateData);
      if (data.success) {
        triggerAlert('success', `✓ Campus '${data.campus.name}' updated successfully!`);
        setShowEditCampusModal(false);
        fetchDashboardData();
      } else {
        triggerAlert('error', data.detail || 'Failed to update campus.');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Error updating campus.');
    }
  };

  const handleDeleteCampus = async (campusId, campusName) => {
    if (!window.confirm(`Are you sure you want to delete campus '${campusName}'?\nThis will remove the campus and its associated club elections.`)) return;

    try {
      const data = await adminApi.deleteCampus(campusId);
      if (data.success) {
        triggerAlert('success', `✓ Campus '${campusName}' and its associated clubs removed.`);
        fetchDashboardData();
      } else {
        triggerAlert('error', data.detail || 'Failed to delete campus.');
      }
    } catch (err) {
      // If error mentions students still assigned, offer force delete
      if (err.message && err.message.includes('registered students are assigned')) {
        if (window.confirm(`⚠️ ${err.message}\n\nDo you want to FORCE DELETE campus '${campusName}' along with all its students and clubs?`)) {
          try {
            const forceData = await adminApi.deleteCampus(campusId, true);
            if (forceData.success) {
              triggerAlert('success', `✓ Campus '${campusName}' force-deleted.`);
              fetchDashboardData();
            }
          } catch (forceErr) {
            triggerAlert('error', forceErr.message || 'Force delete failed.');
          }
        }
      } else {
        triggerAlert('error', err.message || 'Error deleting campus.');
      }
    }
  };

  // Club handlers
  const handleAddClub = async (clubData) => {
    try {
      const data = await adminApi.addClub(clubData);
      if (data.success) {
        triggerAlert('success', `Club '${data.club.name}' created for ${data.club.campus}!`);
        setShowAddClubModal(false);
        fetchDashboardData();
      } else {
        triggerAlert('error', data.detail || 'Failed to add club.');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Error creating club.');
    }
  };

  const handleToggleClubStatus = async (clubId, newActiveStatus, clubName) => {
    try {
      const data = await adminApi.toggleClubStatus(clubId, newActiveStatus);
      if (data.success) {
        triggerAlert('success', `✓ ${data.message}`);
        fetchDashboardData();
      } else {
        triggerAlert('error', data.detail || 'Failed to update club status.');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Error toggling club status.');
    }
  };

  const handleDeleteClub = async (clubId, clubName) => {
    if (!window.confirm(`Are you sure you want to delete club '${clubName}'?\nAll candidate associations for this club will be removed.`)) return;

    try {
      const data = await adminApi.deleteClub(clubId);
      if (data.success) {
        triggerAlert('success', `✓ Club '${clubName}' deleted successfully.`);
        fetchDashboardData();
      } else {
        triggerAlert('error', data.detail || 'Failed to delete club.');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Error deleting club.');
    }
  };

  // Candidate handlers
  const handleOpenAddCandidate = (prefillCampus = '', prefillClubId = '') => {
    setCandidatePrefillCampus(prefillCampus || currentDefaultCampus);
    setCandidatePrefillClubId(prefillClubId);
    setShowAddCandidateModal(true);
  };

  const handleAddCandidate = async (studentId, clubId) => {
    try {
      const data = await adminApi.addCandidate(studentId, clubId);
      if (data.success) {
        triggerAlert('success', `Candidate '${data.candidate.student_name}' registered successfully!`);
        setShowAddCandidateModal(false);
        fetchDashboardData();
      } else {
        triggerAlert('error', data.detail || 'Failed to register candidate.');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Error adding candidate.');
    }
  };

  const handleDeleteCandidate = async (candId, candName) => {
    if (!window.confirm(`Are you sure you want to remove candidate '${candName}'?`)) return;

    try {
      const data = await adminApi.deleteCandidate(candId);
      if (data.success) {
        triggerAlert('success', 'Candidate removed.');
        fetchDashboardData();
      } else {
        triggerAlert('error', data.detail || 'Failed to delete candidate.');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Error deleting candidate.');
    }
  };

  // Student handlers
  const handleAddStudent = async (studentData) => {
    try {
      const data = await adminApi.addStudent(studentData);
      if (data.success) {
        triggerAlert('success', `Student '${data.student.name}' registered for ${data.student.campus}.`);
        setShowAddStudentModal(false);
        fetchDashboardData();
      } else {
        triggerAlert('error', data.detail || 'Failed to add student.');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Error adding student.');
    }
  };

  const handleBulkUpload = async (students) => {
    setLoading(true);
    try {
      const data = await adminApi.bulkUploadStudents(students);
      if (data.success) {
        triggerAlert('success', `✓ ${data.message}`);
        setShowBulkUploadModal(false);
        fetchDashboardData();
      } else {
        triggerAlert('error', data.detail || 'Failed to process bulk upload.');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Network error during bulk student upload.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (enrollmentId, name) => {
    if (!window.confirm(`Are you sure you want to delete student '${name}' (${enrollmentId})?`)) return;

    try {
      const data = await adminApi.deleteStudent(enrollmentId);
      if (data.success) {
        triggerAlert('success', `Student '${name}' deleted.`);
        fetchDashboardData();
      } else {
        triggerAlert('error', data.detail || 'Failed to delete student.');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Error deleting student.');
    }
  };

  const handleClearAllStudents = async () => {
    const campusMsg = selectedCampusFilter ? `for ${selectedCampusFilter}` : 'across ALL campuses';
    if (!window.confirm(`⚠️ DANGER: Are you sure you want to delete all students ${campusMsg}? This action cannot be undone.`)) return;

    try {
      const data = await adminApi.clearStudents(selectedCampusFilter);
      if (data.success) {
        triggerAlert('success', `✓ ${data.message}`);
        fetchDashboardData();
      } else {
        triggerAlert('error', data.detail || 'Failed to clear students.');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Error clearing students.');
    }
  };

  // If not logged in -> Show login view
  if (!isAdminLoggedIn) {
    return (
      <AdminLogin
        loginUsername={loginUsername}
        setLoginUsername={setLoginUsername}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        loginError={loginError}
        loading={loading}
        onLogin={handleLogin}
      />
    );
  }

  const selectedClub = dashboardData.clubs.find(c => c.id === selectedClubId) || dashboardData.clubs[0];

  return (
    <div>
      {/* Top Header Controls */}
      <AdminHeader
        adminUser={adminUser}
        onSync={fetchDashboardData}
        onLogout={handleLogout}
      />

      {/* Alert Banner */}
      <AlertBanner alert={alert} />

      {/* Metrics Stats Grid */}
      <AdminStatsGrid
        totalVotes={dashboardData.total_votes}
        totalCampuses={dashboardData.total_campuses}
        totalClubs={dashboardData.total_clubs}
        totalStudents={dashboardData.total_students}
      />

      {/* Admin Navigation Sub-Tabs & Campus Filter */}
      <AdminNavigation
        adminTab={adminTab}
        setAdminTab={setAdminTab}
        selectedCampusFilter={selectedCampusFilter}
        setSelectedCampusFilter={setSelectedCampusFilter}
        campuses={dashboardData.campuses}
        totalCampuses={dashboardData.total_campuses}
        totalLogs={dashboardData.voter_logs.length}
      />

      {/* TAB CONTENT */}
      {adminTab === 'overview' && (
        <OverviewTab
          clubs={dashboardData.clubs}
          selectedClubId={selectedClubId}
          setSelectedClubId={setSelectedClubId}
          selectedClub={selectedClub}
          onDeleteCandidate={handleDeleteCandidate}
        />
      )}

      {adminTab === 'campuses' && (
        <CampusesTab
          campuses={dashboardData.campuses}
          onOpenAddModal={() => setShowAddCampusModal(true)}
          onOpenEditModal={handleOpenEditCampus}
          onDeleteCampus={handleDeleteCampus}
        />
      )}

      {adminTab === 'clubs' && (
        <ClubsTab
          clubs={dashboardData.clubs}
          onOpenAddClubModal={() => setShowAddClubModal(true)}
          onOpenAddCandidateModal={handleOpenAddCandidate}
          onToggleClubStatus={handleToggleClubStatus}
          onDeleteClub={handleDeleteClub}
          onDeleteCandidate={handleDeleteCandidate}
        />
      )}

      {adminTab === 'students' && (
        <StudentsTab
          students={dashboardData.students}
          studentSearch={studentSearch}
          setStudentSearch={setStudentSearch}
          onOpenBulkModal={() => setShowBulkUploadModal(true)}
          onOpenAddModal={() => setShowAddStudentModal(true)}
          onClearStudents={handleClearAllStudents}
          onDeleteStudent={handleDeleteStudent}
        />
      )}

      {adminTab === 'audit' && (
        <AuditLogsTab
          voterLogs={dashboardData.voter_logs}
          logSearch={logSearch}
          setLogSearch={setLogSearch}
        />
      )}

      {/* MODALS */}
      <AddCampusModal
        isOpen={showAddCampusModal}
        onClose={() => setShowAddCampusModal(false)}
        onAddCampus={handleAddCampus}
      />

      <EditCampusModal
        isOpen={showEditCampusModal}
        onClose={() => setShowEditCampusModal(false)}
        campus={editingCampus}
        onUpdateCampus={handleUpdateCampus}
      />

      <AddClubModal
        isOpen={showAddClubModal}
        onClose={() => setShowAddClubModal(false)}
        campuses={activeCampusList}
        defaultCampus={currentDefaultCampus}
        onAddClub={handleAddClub}
      />

      <AddCandidateModal
        isOpen={showAddCandidateModal}
        onClose={() => setShowAddCandidateModal(false)}
        campuses={activeCampusList}
        students={dashboardData.all_students || dashboardData.students || []}
        clubs={dashboardData.all_clubs || dashboardData.clubs || []}
        defaultCampus={candidatePrefillCampus || currentDefaultCampus}
        defaultClubId={candidatePrefillClubId}
        onAddCandidate={handleAddCandidate}
      />

      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        campuses={activeCampusList}
        defaultCampus={currentDefaultCampus}
        onAddStudent={handleAddStudent}
      />

      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        campuses={activeCampusList}
        defaultCampus={currentDefaultCampus}
        onBulkUpload={handleBulkUpload}
        loading={loading}
      />
    </div>
  );
}
