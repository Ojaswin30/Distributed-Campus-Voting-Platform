import React from 'react';
import { PlusCircle, Trash2, Search, MapPin } from 'lucide-react';

export default function StudentsTab({
  students = [],
  studentSearch,
  setStudentSearch,
  onOpenBulkModal,
  onOpenAddModal,
  onClearStudents,
  onDeleteStudent
}) {
  const filteredStudents = students.filter(s => {
    const q = studentSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || 
           s.enrollment_id.toLowerCase().includes(q) || 
           (s.email && s.email.toLowerCase().includes(q)) || 
           s.campus.toLowerCase().includes(q);
  });

  return (
    <div className="clean-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem' }}>👥 Authorized Students Registry</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Pre-register eligible student accounts and assign their voting campus.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="form-control"
              placeholder="Search students..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <button className="btn btn-secondary" onClick={onOpenBulkModal}>
            📥 Bulk Import CSV
          </button>
          <button className="btn btn-primary" onClick={onOpenAddModal}>
            <PlusCircle size={16} /> Register Student
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
            onClick={onClearStudents}
            title="Delete all student records"
          >
            <Trash2 size={16} /> Clear All Students
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Enrollment ID</th>
              <th>Student Name</th>
              <th>Email ID (Gmail / Campus)</th>
              <th>Department</th>
              <th>Assigned Campus</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map(s => (
                <tr key={s.enrollment_id}>
                  <td><strong>{s.enrollment_id}</strong></td>
                  <td>{s.name}</td>
                  <td><code style={{ color: 'var(--primary)' }}>{s.email || '—'}</code></td>
                  <td>{s.department || '—'}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.82rem' }}>
                      <MapPin size={12} /> {s.campus}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', color: 'var(--danger)' }}
                      onClick={() => onDeleteStudent(s.enrollment_id, s.name)}
                      title="Delete Student"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No students found. Use "📥 Bulk Import CSV" or "➕ Register Student" above to add students.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
