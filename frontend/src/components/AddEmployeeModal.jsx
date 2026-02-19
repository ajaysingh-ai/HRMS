import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { employeeAPI, departmentAPI } from '../services/api';
import { useToast } from './Toast';

const INITIAL_FORM = { employee_id: '', full_name: '', email: '', department: '' };

export default function AddEmployeeModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const toast = useToast();

  useEffect(() => {
    departmentAPI.getAll().then((res) => setDepartments(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setForm(INITIAL_FORM);
      setErrors({});
    }
  }, [isOpen]);

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
      await employeeAPI.create(form);
      toast.success(`Employee ${form.full_name} added successfully!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      if (err.fields) {
        setErrors(err.fields);
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
      title="Add New Employee"
      subtitle="Fill in the details below to create an employee record."
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Employee ID *</label>
              <input
                className={`form-control ${errors.employee_id ? 'error' : ''}`}
                name="employee_id"
                value={form.employee_id}
                onChange={handleChange}
                placeholder="e.g. EMP001"
                autoFocus
              />
              {errors.employee_id && <span className="form-error">⚠ {errors.employee_id}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                className={`form-control ${errors.department ? 'error' : ''}`}
                name="department"
                value={form.department}
                onChange={handleChange}
              >
                <option value="">Select department</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.department && <span className="form-error">⚠ {errors.department}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              className={`form-control ${errors.full_name ? 'error' : ''}`}
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="e.g. Jane Smith"
            />
            {errors.full_name && <span className="form-error">⚠ {errors.full_name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              className={`form-control ${errors.email ? 'error' : ''}`}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. jane@company.com"
            />
            {errors.email && <span className="form-error">⚠ {errors.email}</span>}
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Adding...</> : '+ Add Employee'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
