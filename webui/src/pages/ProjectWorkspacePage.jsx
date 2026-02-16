import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import SrhNavbar from "../components/SrhNavbar";
import { getRole, getToken, getUserProfile } from "../lib/session";
import { useToast } from "../components/ToastProvider";
import "../styles/ProjectWorkspacePage.css";

const ProjectWorkspacePage = () => {
  const { projectId } = useParams();
  const token = getToken();
  const role = getRole();
  const profile = getUserProfile();
  const [project, setProject] = useState(null);
  const [remarks, setRemarks] = useState([]);
  const [comments, setComments] = useState([]);
  const [remarkText, setRemarkText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [publishNow, setPublishNow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [remarkBusy, setRemarkBusy] = useState(false);
  const [commentBusy, setCommentBusy] = useState(false);
  const [activePanel, setActivePanel] = useState("description");
  const { toast } = useToast();

  const loadProject = async () => {
    try {
      const res = await axios.get(`http://localhost:8020/api/project/details/${projectId}`);
      setProject(res.data);
    } catch (_err) {
      setError("Unable to load project details.");
    }
  };

  const loadRemarks = async () => {
    if (!token) {
      setRemarks([]);
      return;
    }
    try {
      const res = await axios.get(`http://localhost:8020/api/project/${projectId}/remarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRemarks(res.data || []);
    } catch (_err) {
      setRemarks([]);
    }
  };

  const loadComments = async () => {
    try {
      const res = await axios.get(`http://localhost:8020/api/project/${projectId}/comments`);
      setComments(res.data || []);
    } catch (_err) {
      setComments([]);
    }
  };

  useEffect(() => {
    loadProject();
    loadRemarks();
    loadComments();
  }, [projectId]);

  const images = useMemo(() => {
    if (project?.images?.length) return project.images;
    return [];
  }, [project]);
  const isRunning = project?.status === "running";
  const canCreateRemarks = role === "faculty" || role === "admin";
  const canComment = Boolean(token);
  const currentUserId = profile?.id || profile?._id;
  const isOwnerStudent =
    role === "student" &&
    project?.ownerUserId &&
    String(project.ownerUserId) === String(currentUserId);
  const canSeeEvaluationPanel = canCreateRemarks || isOwnerStudent;
  const canSeeBuildLogs = canCreateRemarks || isOwnerStudent;
  const teamMembers = Array.isArray(project?.teamMembers) ? project.teamMembers : [];
  const resourceLinks = Array.isArray(project?.resourceLinks) ? project.resourceLinks : [];
  const resourceFiles = Array.isArray(project?.resourceFiles) ? project.resourceFiles : [];

  const callRunStop = async (type) => {
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

  const submitRemark = async () => {
    if (!remarkText.trim()) {
      toast("Enter a remark first.", "error");
      return;
    }
    setRemarkBusy(true);
    try {
      await axios.post(
        `http://localhost:8020/api/project/${projectId}/remarks`,
        { remark: remarkText.trim(), isPublished: publishNow },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRemarkText("");
      setPublishNow(false);
      await loadRemarks();
      toast("Remark saved.", "success");
    } catch (err) {
      toast(err?.response?.data?.error || "Failed to save remark", "error");
    } finally {
      setRemarkBusy(false);
    }
  };

  const toggleRemarkPublish = async (remark) => {
    setRemarkBusy(true);
    try {
      await axios.patch(
        `http://localhost:8020/api/project/remarks/${remark._id}/publish`,
        { isPublished: !remark.isPublished },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadRemarks();
      toast("Remark visibility updated.", "success");
    } catch (err) {
      toast(err?.response?.data?.error || "Failed to update visibility", "error");
    } finally {
      setRemarkBusy(false);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) {
      toast("Enter a comment first.", "error");
      return;
    }
    setCommentBusy(true);
    try {
      await axios.post(
        `http://localhost:8020/api/project/${projectId}/comments`,
        { comment: commentText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommentText("");
      await loadComments();
      toast("Comment posted.", "success");
    } catch (err) {
      toast(err?.response?.data?.error || "Failed to post comment", "error");
    } finally {
      setCommentBusy(false);
    }
  };

  const shareProject = async () => {
    const shareUrl = window.location.href;
    const shareText = `Check out this project: ${project?.projectTitle || "Project"}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: project?.projectTitle, text: shareText, url: shareUrl });
        return;
      } catch (_err) {}
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("Project link copied.", "success");
    } catch (_err) {
      toast("Unable to copy link.", "error");
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
        <aside className="workspace-left-nav">
          <nav className="content-tabs-nav">
            <button
              type="button"
              className={activePanel === "description" ? "active" : ""}
              onClick={() => setActivePanel("description")}
            >
              Description
            </button>
            <button
              type="button"
              className={activePanel === "team" ? "active" : ""}
              onClick={() => setActivePanel("team")}
            >
              Team
            </button>
            <button
              type="button"
              className={activePanel === "documentation" ? "active" : ""}
              onClick={() => setActivePanel("documentation")}
            >
              Documentation
            </button>
            <button
              type="button"
              className={activePanel === "resources" ? "active" : ""}
              onClick={() => setActivePanel("resources")}
            >
              Resources
            </button>
            <button
              type="button"
              className={activePanel === "comments" ? "active" : ""}
              onClick={() => setActivePanel("comments")}
            >
              Comments
            </button>
            {canSeeBuildLogs && (
              <button
                type="button"
                className={activePanel === "buildlogs" ? "active" : ""}
                onClick={() => setActivePanel("buildlogs")}
              >
                Build Logs
              </button>
            )}
          </nav>
        </aside>

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

          <div className="content-tabs-layout">
            <div className="content-tabs-panel">
              {activePanel === "description" && (
                <article className="workspace-section">
                  <h3>Project Overview</h3>
                  <p>{project.longDescription || "No description provided."}</p>

                  {project.demoVideo && (
                    <div style={{ marginTop: "12px" }}>
                      <h3>Demo Video</h3>
                      <video controls style={{ width: "100%", borderRadius: "10px" }}>
                        <source src={project.demoVideo} />
                        Your browser does not support embedded video playback.
                      </video>
                    </div>
                  )}

                  <div style={{ marginTop: "12px" }}>
                    <h3>Tech Stack</h3>
                    <div className="stack-list">
                      {(project.technologiesUsed || []).map((tech) => (
                        <span key={tech}>{tech}</span>
                      ))}
                    </div>
                  </div>
                </article>
              )}

              {activePanel === "team" && (
                <article className="workspace-section">
                  <h3>Team Members</h3>
                  {teamMembers.length === 0 ? (
                    <p className="comment-empty">No teammates listed.</p>
                  ) : (
                    <div className="team-list project-team-list">
                      {teamMembers.map((member, index) => (
                        <div key={`${member.email}-${index}`} className="team-item">
                          <span>
                            {member.name || "Member"} - {member.email || "N/A"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              )}

              {activePanel === "documentation" && (
                <article className="workspace-section">
                  <h3>Documentation</h3>
                  <p>{project.documentation || "No documentation added yet."}</p>
                </article>
              )}

              {activePanel === "resources" && (
                <article className="workspace-section">
                  <h3>Reference Links</h3>
                  {resourceLinks.length === 0 ? (
                    <p className="comment-empty">No resource links added.</p>
                  ) : (
                    <ul className="resource-links-list">
                      {resourceLinks.map((link, index) => (
                        <li key={`${link}-${index}`}>
                          <a href={link} target="_blank" rel="noreferrer">
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}

                  <h3 style={{ marginTop: "12px" }}>Resource Files</h3>
                  {resourceFiles.length === 0 ? (
                    <p className="comment-empty">No files added.</p>
                  ) : (
                    <ul className="resource-links-list">
                      {resourceFiles.map((fileUrl, index) => (
                        <li key={`${fileUrl}-${index}`}>
                          <a href={fileUrl} target="_blank" rel="noreferrer">
                            Open resource file {index + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              )}

              {activePanel === "comments" && (
                <article className="workspace-section">
                  <h3>Project Comments</h3>
                  <div className="comment-list">
                    {comments.length === 0 && <p className="comment-empty">No comments yet.</p>}
                    {comments.map((item) => (
                      <div key={item._id} className="comment-item">
                        <div className="comment-head">
                          <strong>{item.authorName}</strong>
                          <span>{item.authorRole}</span>
                        </div>
                        <p>{item.comment}</p>
                      </div>
                    ))}
                  </div>
                  {canComment ? (
                    <div className="comment-form">
                      <textarea
                        placeholder="Add your comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        disabled={commentBusy}
                      />
                      <button type="button" onClick={submitComment} disabled={commentBusy}>
                        {commentBusy ? "Posting..." : "Post Comment"}
                      </button>
                    </div>
                  ) : (
                    <p className="comment-empty">Login to add a comment.</p>
                  )}
                </article>
              )}

              {activePanel === "buildlogs" && canSeeBuildLogs && (
                <article className="workspace-section">
                  <h3>Build Logs</h3>
                  <div className="build-logs-history">
                    <details open>
                      <summary>Build Log</summary>
                      <pre>{project?.logs?.build || "No build logs available."}</pre>
                    </details>
                    <details>
                      <summary>Deploy Log</summary>
                      <pre>{project?.logs?.deploy || "No deploy logs available."}</pre>
                    </details>
                  </div>
                </article>
              )}
            </div>
          </div>
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

            <div className="share-actions">
              <button type="button" onClick={shareProject}>
                Share Project
              </button>
            </div>
          </div>

          {canSeeEvaluationPanel && (
            <div className="side-card">
              <h3>Evaluation Panel</h3>
              {canCreateRemarks && (
                <div className="remark-form">
                  <textarea
                    placeholder="Add teacher remark..."
                    value={remarkText}
                    onChange={(e) => setRemarkText(e.target.value)}
                    disabled={remarkBusy}
                  />
                  <label className="publish-toggle">
                    <input
                      type="checkbox"
                      checked={publishNow}
                      onChange={(e) => setPublishNow(e.target.checked)}
                      disabled={remarkBusy}
                    />
                    Publish to student now
                  </label>
                  <button type="button" onClick={submitRemark} disabled={remarkBusy}>
                    {remarkBusy ? "Saving..." : "Save Remark"}
                  </button>
                </div>
              )}

              <div className="remark-list">
                {remarks.length === 0 && <p>No remarks yet.</p>}
                {remarks.map((item) => {
                  const isCreator = String(item.teacherUserId) === String(currentUserId);
                  const canToggle = role === "admin" || (canCreateRemarks && isCreator);
                  return (
                    <div key={item._id} className="remark-item">
                      <div className="remark-head">
                        <strong>{item.teacherName}</strong>
                        <span className={item.isPublished ? "published" : "draft"}>
                          {item.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>
                      <p>{item.remark}</p>
                      {canToggle && (
                        <button
                          type="button"
                          className="remark-toggle-btn"
                          onClick={() => toggleRemarkPublish(item)}
                          disabled={remarkBusy}
                        >
                          {item.isPublished ? "Unpublish" : "Publish"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
};

export default ProjectWorkspacePage;
