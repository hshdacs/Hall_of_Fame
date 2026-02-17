import React, { useEffect, useState } from 'react';
import './App.css';
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Dashboard from './pages/Dashboard.jsx';
import AdminQuotaMonitor from './pages/AdminQuotaMonitor.jsx';
import LoginPage from './pages/LoginPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import ProjectsGalleryPage from './pages/ProjectsGalleryPage.jsx';
import ProjectWorkspacePage from './pages/ProjectWorkspacePage.jsx';
import UploadProjectPage from './pages/UploadProjectPage.jsx';
import BuildStatusPage from './pages/BuildStatusPage.jsx';
import { isLoggedIn } from './lib/session';
import { ToastProvider } from './components/ToastProvider.jsx';

const PrivateRoute = ({ element }) => {
  return isLoggedIn() ? element : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const location = useLocation();
  const [routeLoading, setRouteLoading] = useState(true);

  useEffect(() => {
    setRouteLoading(true);
    const timer = setTimeout(() => setRouteLoading(false), 280);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      <div className={`route-loader ${routeLoading ? "show" : ""}`}>
        <div className="route-loader-spinner" />
      </div>
      <div key={location.pathname} className="route-fade">
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/landing" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/projects" element={<ProjectsGalleryPage />} />
          <Route path="/project/:projectId" element={<ProjectWorkspacePage />} />
          <Route path="/build-status/:projectId" element={<PrivateRoute element={<BuildStatusPage />} />} />
          <Route path="/upload" element={<PrivateRoute element={<UploadProjectPage />} />} />
          <Route path="/admin/monitoring" element={<PrivateRoute element={<AdminQuotaMonitor />} />} />
          <Route path="/legacy-dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </>
  );
};

const App = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
