import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../services/api';
import { LoadingState, EmptyState, ErrorState, Avatar } from '../components/UI';
import AddEmployeeModal from '../components/AddEmployeeModal';
import { useToast } from '../components/Toast';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (deptFilter) params.department = deptFilter;
      const res = await employeeAPI.getAll(params);
      setEmployees(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter]);

  useEffect(() => {
    const t = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(t);
  }, [fetchEmployees]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await employeeAPI.delete(deleteTarget.employee_id);
      toast.success(`Employee ${deleteTarget.full_name} deleted.`);
      setDeleteTarget(null);
      fetchEmployees();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const departments = [...new Set(employees.map((e) => e.department))].sort();

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">{employees.length} records found</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Add Employee
        </button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap" style={{ maxWidth: 320 }}>
          <span className="search-icon">⊕</span>
          <input
            className="form-control search-input"
            placeholder="Search by name, ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-control"
          style={{ width: 'auto', minWidth: 160 }}
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        {(search || deptFilter) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setDeptFilter(''); }}>
            Clear filters
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <LoadingState message="Loading employees..." />
        ) : error ? (
          <div style={{ padding: 24 }}>
            <ErrorState message={error} onRetry={fetchEmployees} />
          </div>
        ) : employees.length === 0 ? (
          <EmptyState
            icon="◈"
            title="No employees found"
            description={search || deptFilter ? 'Try adjusting your search or filters.' : 'Add your first employee to get started.'}
            action={!search && !deptFilter ? (
              <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Employee</button>
            ) : null}
          />
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 'var(--radius-lg)' }}>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={emp.full_name} />
                        <span className="td-primary">{emp.full_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="employee-id-chip">{emp.employee_id}</span>
                    </td>
                    <td>{emp.email}</td>
                    <td>
                      <span className="badge badge-dept">{emp.department}</span>
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {emp.created_at ? new Date(emp.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => { e.stopPropagation(); navigate(`/attendance?employee=${emp.employee_id}`); }}
                          title="View attendance"
                        >
                          ◷ Attendance
                        </button>
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(emp); }}
                          title="Delete employee"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddEmployeeModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={fetchEmployees}
      />

      {/* Confirm delete modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Employee</h2>
              <p className="modal-subtitle">This action cannot be undone.</p>
            </div>
            <div style={{
              background: 'var(--red-dim)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
            }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.full_name}</strong> ({deleteTarget.employee_id})?
              All their attendance records will also be permanently removed.
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? 'Deleting...' : 'Delete Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
