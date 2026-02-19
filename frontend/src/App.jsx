import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { ToastProvider } from './components/Toast';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';

function PageWrapper({ title, children }) {
  return (
    <div className="main-content">
      <header className="topbar">
        <span className="topbar-title">{title}</span>
        <span className="topbar-meta">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </header>
      {children}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="app-layout">
          <Sidebar />
          <Routes>
            <Route path="/" element={
              <PageWrapper title="Dashboard">
                <Dashboard />
              </PageWrapper>
            } />
            <Route path="/employees" element={
              <PageWrapper title="Employee Management">
                <Employees />
              </PageWrapper>
            } />
            <Route path="/attendance" element={
              <PageWrapper title="Attendance Tracking">
                <Attendance />
              </PageWrapper>
            } />
          </Routes>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
