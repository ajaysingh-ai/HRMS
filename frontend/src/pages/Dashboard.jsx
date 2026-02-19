import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { LoadingState, ErrorState } from '../components/UI';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardAPI.getSummary();
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your HR operations at a glance.</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchDashboard}>↻ Refresh</button>
      </div>

      {loading && <LoadingState message="Loading dashboard..." />}
      {error && <ErrorState message={error} onRetry={fetchDashboard} />}

      {data && !loading && (
        <>
          <div className="stat-grid">
            <StatCard
              icon="◈"
              value={data.total_employees}
              label="Total Employees"
              color="accent"
              onClick={() => navigate('/employees')}
            />
            <StatCard
              icon="✓"
              value={data.today.present}
              label="Present Today"
              color="green"
              onClick={() => navigate('/attendance')}
            />
            <StatCard
              icon="✕"
              value={data.today.absent}
              label="Absent Today"
              color="red"
              onClick={() => navigate('/attendance')}
            />
            <StatCard
              icon="◷"
              value={data.today.not_marked}
              label="Not Marked Today"
              color="amber"
              onClick={() => navigate('/attendance')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Department Breakdown */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Headcount by Department</div>
                  <div className="card-subtitle">{data.total_employees} employees across {data.department_breakdown.length} departments</div>
                </div>
              </div>
              {data.department_breakdown.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No employees yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.department_breakdown.map((d) => {
                    const pct = data.total_employees > 0
                      ? Math.round((d.count / data.total_employees) * 100)
                      : 0;
                    return (
                      <div key={d.department}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{d.department}</span>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{d.count}</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: 'var(--accent)',
                            borderRadius: 2,
                            transition: 'width 1s ease',
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Today Summary */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Today's Attendance</div>
                  <div className="card-subtitle">{data.today.date}</div>
                </div>
              </div>

              {data.total_employees === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Add employees to track attendance.</p>
              ) : (
                <>
                  <AttendancePie
                    present={data.today.present}
                    absent={data.today.absent}
                    notMarked={data.today.not_marked}
                    total={data.total_employees}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 20 }}>
                    <MiniStat label="Present" value={data.today.present} color="var(--green)" />
                    <MiniStat label="Absent" value={data.today.absent} color="var(--red)" />
                    <MiniStat label="Unmarked" value={data.today.not_marked} color="var(--text-muted)" />
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, value, label, color, onClick }) {
  return (
    <div className={`stat-card ${color}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function AttendancePie({ present, absent, notMarked, total }) {
  if (total === 0) return null;
  const presentPct = (present / total) * 100;
  const absentPct = (absent / total) * 100;
  const notMarkedPct = (notMarked / total) * 100;

  // Gauge bar visualization
  return (
    <div>
      <div style={{
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
        background: 'var(--bg-elevated)',
        display: 'flex',
      }}>
        <div style={{ width: `${presentPct}%`, background: 'var(--green)', transition: 'width 1s ease' }} />
        <div style={{ width: `${absentPct}%`, background: 'var(--red)', transition: 'width 1s ease' }} />
        <div style={{ width: `${notMarkedPct}%`, background: 'var(--bg-hover)', transition: 'width 1s ease' }} />
      </div>
      <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        {total > 0 && `${Math.round(presentPct)}% attendance rate today`}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      borderRadius: 'var(--radius-md)',
      padding: '12px',
      textAlign: 'center',
      border: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
    </div>
  );
}
