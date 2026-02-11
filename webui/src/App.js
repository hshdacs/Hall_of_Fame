import React from 'react';
import './App.css';
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Dashboard from './pages/Dashboard.jsx';
import AdminQuotaMonitor from './pages/AdminQuotaMonitor.jsx';
import LoginPage from './pages/LoginPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import ProjectsGalleryPage from './pages/ProjectsGalleryPage.jsx';
import ProjectWorkspacePage from './pages/ProjectWorkspacePage.jsx';
import UploadProjectPage from './pages/UploadProjectPage.jsx';
import { isLoggedIn } from './lib/session';

const PrivateRoute = ({ element }) => {
  return isLoggedIn() ? element : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/landing" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/projects" element={<ProjectsGalleryPage />} />
        <Route path="/project/:projectId" element={<ProjectWorkspacePage />} />
        <Route path="/upload" element={<PrivateRoute element={<UploadProjectPage />} />} />
        <Route path="/admin/monitoring" element={<PrivateRoute element={<AdminQuotaMonitor />} />} />
        <Route path="/legacy-dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
