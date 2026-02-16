import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import SrhNavbar from "../components/SrhNavbar";
import { getToken } from "../lib/session";
import { useToast } from "../components/ToastProvider";
import "../styles/ProjectWorkspacePage.css";

const ProjectWorkspacePage = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const loadProject = async () => {
    try {
      const res = await axios.get(`http://localhost:8020/api/project/details/${projectId}`);
      setProject(res.data);
    } catch (_err) {
      setError("Unable to load project details.");
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const images = useMemo(() => {
    if (project?.images?.length) return project.images;
    return [];
  }, [project]);
  const isRunning = project?.status === "running";

  const callRunStop = async (type) => {
    const token = getToken();
    if (!token) {
      toast("Please login first.", "error");
      return;
    }
    setBusy(true);
    try {
      await axios.post(
        `http://localhost:8020/api/project/${type}/${projectId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadProject();
      toast(
        type === "run" ? "Project started successfully." : "Project stopped successfully.",
        "success"
      );
    } catch (err) {
      toast(err?.response?.data?.error || `Failed to ${type} project`, "error");
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div>
        <SrhNavbar />
        <p className="workspace-error">{error}</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        <SrhNavbar />
        <p className="workspace-error">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="workspace-page">
      <SrhNavbar />
      <main className="workspace-grid">
        <section className="workspace-main">
          <h1>{project.projectTitle}</h1>
          <div className="meta-row">
            <span>{project.studentName || "Unknown"}</span>
            <span>{project.course || "NA"}</span>
            <span>{project.projectTag || "General"}</span>
            <span className={`status status-${project.status}`}>{project.status}</span>
          </div>

          {images.length > 0 ? (
            <Carousel showThumbs={images.length > 1} showStatus={false} infiniteLoop>
              {images.map((image, index) => (
                <div key={index}>
                  <img src={image} alt={`Project ${index + 1}`} className="workspace-image" />
                </div>
              ))}
            </Carousel>
          ) : (
            <div className="no-image">No project images uploaded</div>
          )}

          <article className="workspace-section">
            <h3>Project Overview</h3>
            <p>{project.longDescription || "No description provided."}</p>
          </article>

          {project.demoVideo && (
            <article className="workspace-section">
              <h3>Demo Video</h3>
              <video controls style={{ width: "100%", borderRadius: "10px" }}>
                <source src={project.demoVideo} />
                Your browser does not support embedded video playback.
              </video>
            </article>
          )}

          <article className="workspace-section">
            <h3>Tech Stack</h3>
            <div className="stack-list">
              {(project.technologiesUsed || []).map((tech) => (
                <span key={tech}>{tech}</span>
              ))}
            </div>
          </article>
        </section>

        <aside className="workspace-side">
          <div className="side-card">
            <h3>Run Controls</h3>
            <button
              className={isRunning ? "stop" : ""}
              disabled={busy}
              onClick={() => callRunStop(isRunning ? "stop" : "run")}
            >
              {busy ? (
                <span className="btn-loading">
                  <span className="btn-spinner" />
                  {isRunning ? "Stopping..." : "Starting..."}
                </span>
              ) : isRunning ? (
                "Stop Project"
              ) : (
                "Start Project"
              )}
            </button>

            <div className="runtime-meta">
              <div className={`runtime-status ${isRunning ? "active" : ""}`}>
                <span className="status-dot" />
                {isRunning ? "Running" : "Not running"}
              </div>
              {isRunning && project.url && project.url !== "docker-compose" && (
                <a href={project.url} target="_blank" rel="noreferrer">
                  Open Live URL
                </a>
              )}
            </div>
          </div>

          <div className="side-card">
            <h3>Evaluation Panel</h3>
            <p>Faculty scoring and feedback tools can be wired here.</p>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default ProjectWorkspacePage;
