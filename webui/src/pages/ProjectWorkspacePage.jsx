import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import SrhNavbar from "../components/SrhNavbar";
import { getRole, getToken, getUserProfile } from "../lib/session";
import { getLanguage, onLanguageChange, t } from "../lib/preferences";
import { useToast } from "../components/ToastProvider";
import "../styles/ProjectWorkspacePage.css";

const ProjectWorkspacePage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
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
  const [language, setLanguage] = useState(getLanguage());
  const { toast } = useToast();

  useEffect(() => onLanguageChange(setLanguage), []);

  const loadProject = async () => {
    try {
      const res = await axios.get(`http://localhost:8020/api/project/details/${projectId}`);
      setProject(res.data);
    } catch (_err) {
      setError("Projektdetails konnten nicht geladen werden.");
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
  const teamMembers = useMemo(() => {
    const fromProject = Array.isArray(project?.teamMembers) ? project.teamMembers : [];
    const deduped = [];
    const seen = new Set();
    fromProject.forEach((member) => {
      const emailKey = String(member?.email || "").toLowerCase().trim();
      const idKey = String(member?.userId || "").trim();
      const key = emailKey || idKey || `${member?.name || ""}-${member?.regNumber || ""}`;
      if (!key || seen.has(key)) return;
      seen.add(key);
      deduped.push(member);
    });

    if (deduped.length > 0) return deduped;
    return [
      {
        userId: project?.ownerUserId || "",
        name: project?.studentName || "Project Owner",
        email: "",
        regNumber: project?.regNumber || "",
        batch: project?.batch || "",
        course: project?.course || "",
      },
    ];
  }, [project]);
  const resourceLinks = Array.isArray(project?.resourceLinks) ? project.resourceLinks : [];
  const resourceFiles = Array.isArray(project?.resourceFiles) ? project.resourceFiles : [];
  const translatedStatus =
    {
      running: "LÄUFT",
      stopped: "GESTOPPT",
      build_failed: "BUILD FEHLGESCHLAGEN",
      failed: "FEHLGESCHLAGEN",
      queued: "IN WARTESCHLANGE",
      building: "WIRD GEBAUT",
      ready: "BEREIT",
    }[String(project?.status || "").toLowerCase()] || String(project?.status || "").toUpperCase();

  const callRunStop = async (type) => {
    setBusy(true);
    try {
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      await axios.post(
        `http://localhost:8020/api/project/${type}/${projectId}`,
        {},
        config
      );
      await loadProject();
      toast(type === "run" ? "Projekt erfolgreich gestartet." : "Projekt erfolgreich gestoppt.", "success");
    } catch (err) {
      toast(err?.response?.data?.error || `Failed to ${type} project`, "error");
    } finally {
      setBusy(false);
    }
  };

  const submitRemark = async () => {
    if (!remarkText.trim()) {
      toast("Bitte zuerst eine Bemerkung eingeben.", "error");
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
      toast("Bemerkung gespeichert.", "success");
    } catch (err) {
      toast(err?.response?.data?.error || "Bemerkung konnte nicht gespeichert werden.", "error");
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
      toast("Sichtbarkeit der Bemerkung aktualisiert.", "success");
    } catch (err) {
      toast(err?.response?.data?.error || "Sichtbarkeit konnte nicht aktualisiert werden.", "error");
    } finally {
      setRemarkBusy(false);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) {
      toast("Bitte zuerst einen Kommentar eingeben.", "error");
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
      toast("Kommentar gesendet.", "success");
    } catch (err) {
      toast(err?.response?.data?.error || "Kommentar konnte nicht gesendet werden.", "error");
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
      toast("Projektlink wurde kopiert.", "success");
    } catch (_err) {
      toast("Link konnte nicht kopiert werden.", "error");
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
        <p className="workspace-error">Projekt wird geladen...</p>
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
              {t(language, "description")}
            </button>
            <button
              type="button"
              className={activePanel === "team" ? "active" : ""}
              onClick={() => setActivePanel("team")}
            >
              {t(language, "team")}
            </button>
            <button
              type="button"
              className={activePanel === "documentation" ? "active" : ""}
              onClick={() => setActivePanel("documentation")}
            >
              {t(language, "documentation")}
            </button>
            <button
              type="button"
              className={activePanel === "resources" ? "active" : ""}
              onClick={() => setActivePanel("resources")}
            >
              {t(language, "resources")}
            </button>
            <button
              type="button"
              className={activePanel === "comments" ? "active" : ""}
              onClick={() => setActivePanel("comments")}
            >
              {t(language, "comments")}
            </button>
            {canSeeBuildLogs && (
              <button
                type="button"
                className={activePanel === "buildlogs" ? "active" : ""}
                onClick={() => setActivePanel("buildlogs")}
              >
                {t(language, "buildLogs")}
              </button>
            )}
          </nav>
        </aside>

        <section className="workspace-main">
          <div className="workspace-title-row">
            <button
              type="button"
              className="workspace-back-btn"
              onClick={() => navigate("/projects")}
              aria-label={t(language, "back")}
              title={t(language, "back")}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M19 12H6m6-6-6 6 6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <h1>{project.projectTitle}</h1>
          </div>
          <div className="meta-row">
            <span className="meta-badge">{project.studentName || t(language, "unknown")}</span>
            <span className="meta-badge">{project.course || "NA"}</span>
            <span className="meta-badge">{project.projectTag || t(language, "general")}</span>
            <span className="meta-badge">
              {teamMembers.length > 1 ? `Team ${teamMembers.length}` : t(language, "solo")}
            </span>
            <span className={`status status-${project.status}`}>{translatedStatus}</span>
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
            <div className="no-image">{t(language, "noImages")}</div>
          )}

          <div className="content-tabs-layout">
            <div className="content-tabs-panel">
              {activePanel === "description" && (
                <article className="workspace-section">
                  <h3>{t(language, "projectOverview")}</h3>
                  <p>{project.longDescription || t(language, "noDescription")}</p>

                  {project.demoVideo && (
                    <div style={{ marginTop: "12px" }}>
                      <h3>{t(language, "demoVideo")}</h3>
                      <video controls style={{ width: "100%", borderRadius: "10px" }}>
                        <source src={project.demoVideo} />
                        {t(language, "browserNoVideo")}
                      </video>
                    </div>
                  )}

                  <div style={{ marginTop: "12px" }}>
                    <h3>{t(language, "techStack")}</h3>
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
                  <h3>{t(language, "teamMembers")}</h3>
                  {teamMembers.length === 0 ? (
                    <p className="comment-empty">{t(language, "noTeammates")}</p>
                  ) : (
                    <div className="team-list project-team-list">
                      {teamMembers.map((member, index) => (
                        <div key={`${member.email}-${index}`} className="team-item">
                          <span className="team-item-main">
                            {member.name || "Mitglied"} {member.email ? `- ${member.email}` : ""}
                          </span>
                          <span className="team-item-meta">
                            {member.regNumber || "NA"} | {member.course || "NA"} | {member.batch || "NA"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              )}

              {activePanel === "documentation" && (
                <article className="workspace-section">
                  <h3>{t(language, "documentation")}</h3>
                  <p>{project.documentation || "Noch keine Dokumentation hinzugefügt."}</p>
                </article>
              )}

              {activePanel === "resources" && (
                <article className="workspace-section">
                  <h3>{t(language, "referenceLinks")}</h3>
                  {resourceLinks.length === 0 ? (
                    <p className="comment-empty">{t(language, "noResourceLinks")}</p>
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

                  <h3 style={{ marginTop: "12px" }}>{t(language, "resourceFiles")}</h3>
                  {resourceFiles.length === 0 ? (
                    <p className="comment-empty">{t(language, "noFilesAdded")}</p>
                  ) : (
                    <ul className="resource-links-list">
                      {resourceFiles.map((fileUrl, index) => (
                        <li key={`${fileUrl}-${index}`}>
                          <a href={fileUrl} target="_blank" rel="noreferrer">
                            {t(language, "openResourceFile")} {index + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              )}

              {activePanel === "comments" && (
                <article className="workspace-section">
                  <h3>{t(language, "projectComments")}</h3>
                  <div className="comment-list">
                    {comments.length === 0 && <p className="comment-empty">{t(language, "noComments")}</p>}
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
                        placeholder={t(language, "addComment")}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        disabled={commentBusy}
                      />
                      <button type="button" onClick={submitComment} disabled={commentBusy}>
                        {commentBusy ? t(language, "posting") : t(language, "postComment")}
                      </button>
                    </div>
                  ) : (
                    <p className="comment-empty">{t(language, "loginToComment")}</p>
                  )}
                </article>
              )}

              {activePanel === "buildlogs" && canSeeBuildLogs && (
                <article className="workspace-section">
                  <h3>{t(language, "buildLogs")}</h3>
                  <div className="build-logs-history">
                    <details open>
                      <summary>{t(language, "buildLog")}</summary>
                      <pre>{project?.logs?.build || t(language, "noBuildLogs")}</pre>
                    </details>
                    <details>
                      <summary>{t(language, "deployLog")}</summary>
                      <pre>{project?.logs?.deploy || t(language, "noDeployLogs")}</pre>
                    </details>
                  </div>
                </article>
              )}
            </div>
          </div>
        </section>

        <aside className="workspace-side">
          <div className="side-card">
            <h3>{t(language, "runControls")}</h3>
            <button
              className={isRunning ? "stop" : ""}
              disabled={busy}
              onClick={() => callRunStop(isRunning ? "stop" : "run")}
            >
              {busy ? (
                <span className="btn-loading">
                  <span className="btn-spinner" />
                  {isRunning ? t(language, "stopping") : t(language, "starting")}
                </span>
              ) : isRunning ? (
                t(language, "stopProject")
              ) : (
                t(language, "startProject")
              )}
            </button>

            <div className="runtime-meta">
              <div className={`runtime-status ${isRunning ? "active" : ""}`}>
                <span className="status-dot" />
                {isRunning ? t(language, "running") : t(language, "notRunning")}
              </div>
              {isRunning && project.url && project.url !== "docker-compose" && (
                <a href={project.url} target="_blank" rel="noreferrer">
                  {t(language, "openLiveUrl")}
                </a>
              )}
            </div>

            <div className="share-actions">
              <button type="button" onClick={shareProject}>
                {t(language, "shareProject")}
              </button>
            </div>
          </div>

          {canSeeEvaluationPanel && (
            <div className="side-card">
              <h3>{t(language, "evaluationPanel")}</h3>
              {canCreateRemarks && (
                <div className="remark-form">
                  <textarea
                    placeholder={t(language, "addTeacherRemark")}
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
                    {t(language, "publishToStudent")}
                  </label>
                  <button type="button" onClick={submitRemark} disabled={remarkBusy}>
                    {remarkBusy ? t(language, "saving") : t(language, "saveRemark")}
                  </button>
                </div>
              )}

              <div className="remark-list">
                {remarks.length === 0 && <p>{t(language, "noRemarks")}</p>}
                {remarks.map((item) => {
                  const isCreator = String(item.teacherUserId) === String(currentUserId);
                  const canToggle = role === "admin" || (canCreateRemarks && isCreator);
                  return (
                    <div key={item._id} className="remark-item">
                      <div className="remark-head">
                        <strong>{item.teacherName}</strong>
                        <span className={item.isPublished ? "published" : "draft"}>
                          {item.isPublished ? t(language, "published") : t(language, "draft")}
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
                          {item.isPublished ? t(language, "unpublish") : t(language, "publish")}
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
