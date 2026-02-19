import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { attendanceAPI, employeeAPI } from '../services/api';
import { LoadingState, EmptyState, ErrorState, StatusBadge } from '../components/UI';
import MarkAttendanceModal from '../components/MarkAttendanceModal';
import { useToast } from '../components/Toast';

const today = new Date().toISOString().split('T')[0];

export default function Attendance() {
  const [searchParams] = useSearchParams();
  const preEmployee = searchParams.get('employee') || '';

  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMark, setShowMark] = useState(false);

  const [filters, setFilters] = useState({
    employee_id: preEmployee,
    date: '',
  });

  const [summaries, setSummaries] = useState({});
  const toast = useToast();

  useEffect(() => {
    employeeAPI.getAll().then((res) => setEmployees(res.data || [])).catch(() => {});
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.employee_id) params.employee_id = filters.employee_id;
      if (filters.date) params.date = filters.date;
      const res = await attendanceAPI.getAll(params);
      setRecords(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // Compute summaries from records
  useEffect(() => {
    const s = {};
    records.forEach((r) => {
      if (!s[r.employee_id]) s[r.employee_id] = { present: 0, absent: 0 };
      if (r.status === 'Present') s[r.employee_id].present++;
      else s[r.employee_id].absent++;
    });
    setSummaries(s);
  }, [records]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((f) => ({ ...f, [name]: value }));
  };

  const handleUpdateStatus = async (record, newStatus) => {
    try {
      await attendanceAPI.update(record.employee_id, record.date, { status: newStatus });
      toast.success('Attendance updated.');
      fetchRecords();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (record) => {
    if (!window.confirm('Delete this attendance record?')) return;
    try {
      await attendanceAPI.delete(record.employee_id, record.date);
      toast.success('Record deleted.');
      fetchRecords();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const presentCount = records.filter((r) => r.status === 'Present').length;
  const absentCount = records.filter((r) => r.status === 'Absent').length;

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">{records.length} record{records.length !== 1 ? 's' : ''} shown</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowMark(true)}>
          + Mark Attendance
        </button>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <SummaryChip label="Present" count={presentCount} color="var(--green)" bg="var(--green-dim)" />
        <SummaryChip label="Absent" count={absentCount} color="var(--red)" bg="var(--red-dim)" />
        <SummaryChip label="Total" count={records.length} color="var(--text-secondary)" bg="var(--bg-elevated)" />
      </div>

      {/* Filters */}
      <div className="search-bar">
        <select
          className="form-control"
          style={{ width: 'auto', minWidth: 200 }}
          name="employee_id"
          value={filters.employee_id}
          onChange={handleFilterChange}
        >
          <option value="">All Employees</option>
          {employees.map((e) => (
            <option key={e.employee_id} value={e.employee_id}>
              {e.employee_id} — {e.full_name}
            </option>
          ))}
        </select>
        <input
          className="form-control"
          type="date"
          name="date"
          value={filters.date}
          onChange={handleFilterChange}
          style={{ width: 'auto' }}
          max={today}
        />
        {(filters.employee_id || filters.date) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ employee_id: '', date: '' })}>
            Clear filters
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <LoadingState message="Loading attendance records..." />
        ) : error ? (
          <div style={{ padding: 24 }}>
            <ErrorState message={error} onRetry={fetchRecords} />
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon="◷"
            title="No attendance records"
            description={
              filters.employee_id || filters.date
                ? 'No records match the current filters.'
                : 'Mark attendance for employees to see records here.'
            }
            action={
              <button className="btn btn-primary" onClick={() => setShowMark(true)}>
                + Mark Attendance
              </button>
            }
          />
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 'var(--radius-lg)' }}>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Marked At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id}>
                    <td className="td-primary">{rec.employee_name}</td>
                    <td>
                      <span className="employee-id-chip">{rec.employee_id}</span>
                    </td>
                    <td>{rec.date}</td>
                    <td>
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {rec.marked_at ? new Date(rec.marked_at).toLocaleString() : '—'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleUpdateStatus(rec, rec.status === 'Present' ? 'Absent' : 'Present')}
                          title="Toggle status"
                        >
                          ⇄ Toggle
                        </button>
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => handleDelete(rec)}
                          title="Delete record"
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

      {/* Per-employee summary (shown when filtering by employee) */}
      {filters.employee_id && !loading && records.length > 0 && (
        <EmployeeSummaryCard
          employeeId={filters.employee_id}
          employeeName={records[0]?.employee_name}
          summary={summaries[filters.employee_id] || { present: 0, absent: 0 }}
          total={records.length}
        />
      )}

      <MarkAttendanceModal
        isOpen={showMark}
        onClose={() => setShowMark(false)}
        onSuccess={fetchRecords}
        preselectedEmployee={filters.employee_id || undefined}
      />
    </div>
  );
}

function SummaryChip({ label, count, color, bg }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 14px',
      background: bg,
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border)',
    }}>
      <span style={{ fontWeight: 800, fontSize: '1.1rem', color, fontFamily: 'var(--font-display)' }}>{count}</span>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function EmployeeSummaryCard({ employeeId, employeeName, summary, total }) {
  const rate = total > 0 ? Math.round((summary.present / total) * 100) : 0;
  return (
    <div className="card mt-6">
      <div className="card-header">
        <div>
          <div className="card-title">{employeeName} — Attendance Summary</div>
          <div className="card-subtitle">{employeeId} · {total} total records</div>
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.8rem',
          fontWeight: 800,
          color: rate >= 75 ? 'var(--green)' : rate >= 50 ? 'var(--amber)' : 'var(--red)',
        }}>
          {rate}%
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{
          background: 'var(--green-dim)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
            {summary.present}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Days Present</div>
        </div>
        <div style={{
          background: 'var(--red-dim)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--red)', fontFamily: 'var(--font-display)' }}>
            {summary.absent}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Days Absent</div>
        </div>
      </div>
    </div>
  );
}
