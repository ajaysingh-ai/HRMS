import React from 'react';

export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ icon = '◎', title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {description && <p className="empty-desc">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state">
      <span>⚠</span>
      <span>{message}</span>
      {onRetry && (
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function Avatar({ name }) {
  const initials = name
    ? name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?';
  return <div className="avatar">{initials}</div>;
}

export function StatusBadge({ status }) {
  const cls = status === 'Present' ? 'badge-present' : 'badge-absent';
  const dot = status === 'Present' ? '●' : '○';
  return <span className={`badge ${cls}`}>{dot} {status}</span>;
}
