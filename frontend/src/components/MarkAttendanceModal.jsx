import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { attendanceAPI, employeeAPI } from '../services/api';
import { useToast } from './Toast';

const today = new Date().toISOString().split('T')[0];

export default function MarkAttendanceModal({ isOpen, onClose, onSuccess, preselectedEmployee }) {
  const [form, setForm] = useState({ employee_id: '', date: today, status: 'Present' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const toast = useToast();

  useEffect(() => {
    employeeAPI.getAll().then((res) => setEmployees(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setForm({ employee_id: preselectedEmployee || '', date: today, status: 'Present' });
      setErrors({});
    } else if (preselectedEmployee) {
      setForm((f) => ({ ...f, employee_id: preselectedEmployee }));
    }
  }, [isOpen, preselectedEmployee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await attendanceAPI.mark(form);
      toast.success('Attendance marked successfully!');
      onSuccess?.();
      onClose();
    } catch (err) {
      if (err.fields) {
        setErrors(err.fields);
      } else if (err.status === 409) {
        toast.error(err.message);
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mark Attendance"
      subtitle="Record attendance status for an employee."
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Employee *</label>
            <select
              className={`form-control ${errors.employee_id ? 'error' : ''}`}
              name="employee_id"
              value={form.employee_id}
              onChange={handleChange}
              disabled={!!preselectedEmployee}
            >
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.employee_id} value={e.employee_id}>
                  {e.employee_id} — {e.full_name}
                </option>
              ))}
            </select>
            {errors.employee_id && <span className="form-error">⚠ {errors.employee_id}</span>}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                className={`form-control ${errors.date ? 'error' : ''}`}
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                max={today}
              />
              {errors.date && <span className="form-error">⚠ {errors.date}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Status *</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                {['Present', 'Absent'].map((s) => (
                  <label
                    key={s}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${form.status === s
                        ? s === 'Present' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'
                        : 'var(--border)'}`,
                      background: form.status === s
                        ? s === 'Present' ? 'var(--green-dim)' : 'var(--red-dim)'
                        : 'var(--bg-elevated)',
                      color: form.status === s
                        ? s === 'Present' ? 'var(--green)' : 'var(--red)'
                        : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={form.status === s}
                      onChange={handleChange}
                      style={{ display: 'none' }}
                    />
                    {s === 'Present' ? '✓' : '✕'} {s}
                  </label>
                ))}
              </div>
              {errors.status && <span className="form-error">⚠ {errors.status}</span>}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : 'Mark Attendance'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
