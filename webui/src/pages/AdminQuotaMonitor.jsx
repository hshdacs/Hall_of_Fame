import React, { useMemo, useState } from "react";
import axios from "axios";
import Header from "../components/Header";
import "../styles/AdminQuotaMonitor.css";

function pct(used, limit) {
  if (limit === null || !Number.isFinite(limit) || limit <= 0) return 0;
  return Math.min((used / limit) * 100, 100);
}

const AdminQuotaMonitor = () => {
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [overview, setOverview] = useState(null);
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    if (!token.trim()) {
      setError("Enter admin JWT token.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      localStorage.setItem("adminToken", token.trim());
      const headers = { Authorization: `Bearer ${token.trim()}` };
      const [overviewRes, limitsRes] = await Promise.all([
        axios.get("http://localhost:8020/api/admin/quotas/overview?courses=ACS,ADS", { headers }),
        axios.get("http://localhost:8020/api/admin/quotas/limits", { headers }),
      ]);
      setOverview(overviewRes.data);
      setLimits(limitsRes.data);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load monitoring data.");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (!overview?.users) {
      return {
        users: 0,
        queued: 0,
        running: 0,
      };
    }

    return overview.users.reduce(
      (acc, item) => {
        acc.users += 1;
        acc.queued += item.usage.queuedOrBuilding || 0;
        acc.running += item.usage.runningProjects || 0;
        return acc;
      },
      { users: 0, queued: 0, running: 0 }
    );
  }, [overview]);

  const riskyUsers = useMemo(() => {
    if (!overview?.users || !limits) return [];

    return [...overview.users]
      .map((item) => {
        const roleLimits = limits[item.user.role] || limits.student;
        const runningPercent = pct(item.usage.runningProjects, roleLimits.runningProjects);
        const queuePercent = pct(item.usage.queuedOrBuilding, roleLimits.queuedBuilds);
        const uploadPercent = pct(item.usage.uploadsLast24h, roleLimits.uploadsPerDay);
        const risk = Math.max(runningPercent, queuePercent, uploadPercent);
        return { ...item, risk, runningPercent, queuePercent, uploadPercent };
      })
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 10);
  }, [overview, limits]);

  return (
    <div className="quota-page">
      <Header />
      <div className="quota-shell">
        <aside className="quota-sidebar">
          <div className="quota-brand">Ops Monitor</div>
          <div className="quota-sub">Applied Sciences</div>
          <div className="quota-courses">
            <span className="course-pill">ACS</span>
            <span className="course-pill">ADS</span>
          </div>
          <p className="sidebar-note">
            Use an admin token to load live quota metrics.
          </p>
        </aside>

        <main className="quota-main">
          <div className="token-bar">
            <input
              className="token-input"
              type="password"
              placeholder="Paste admin JWT token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <button className="load-btn" onClick={fetchData} disabled={loading}>
              {loading ? "Loading..." : "Load Monitor"}
            </button>
          </div>

          {error && <div className="error-box">{error}</div>}

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Tracked Users</div>
              <div className="stat-value">{stats.users}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Queued/Building</div>
              <div className="stat-value">{stats.queued}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Running Projects</div>
              <div className="stat-value">{stats.running}</div>
            </div>
          </section>

          <section className="panel">
            <h3>Course Quota Health (ACS / ADS)</h3>
            <div className="course-list">
              {(overview?.courses || []).map((course) => {
                const total = Math.max(course.totalProjects, 1);
                const runningRatio = (course.runningProjects / total) * 100;
                return (
                  <div key={course.course} className="course-row">
                    <div className="course-name">{course.course}</div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${runningRatio}%` }}
                      />
                    </div>
                    <div className="course-meta">
                      {course.runningProjects}/{course.totalProjects} running
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <h3>User Quota Risk Table</h3>
            <div className="risk-table">
              <div className="risk-head">User</div>
              <div className="risk-head">Role</div>
              <div className="risk-head">Uploads 24h</div>
              <div className="risk-head">Queue Load</div>
              <div className="risk-head">Running</div>
              <div className="risk-head">Risk</div>

              {riskyUsers.map((item) => (
                <React.Fragment key={item.user.id}>
                  <div className="risk-cell">{item.user.email}</div>
                  <div className="risk-cell">{item.user.role}</div>
                  <div className="risk-cell">{item.usage.uploadsLast24h}</div>
                  <div className="risk-cell">{item.usage.queuedOrBuilding}</div>
                  <div className="risk-cell">{item.usage.runningProjects}</div>
                  <div className={`risk-cell risk-${item.risk > 85 ? "high" : item.risk > 60 ? "mid" : "low"}`}>
                    {item.risk.toFixed(0)}%
                  </div>
                </React.Fragment>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default AdminQuotaMonitor;
