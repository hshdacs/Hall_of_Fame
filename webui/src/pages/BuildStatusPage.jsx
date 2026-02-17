import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import SrhNavbar from "../components/SrhNavbar";
import "../styles/BuildStatusPage.css";

const POLL_MS = 2500;

const BuildStatusPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const uploadDraft = location.state?.uploadDraft || null;
  const [project, setProject] = useState(null);
  const [error, setError] = useState("");
  const [wsState, setWsState] = useState("connecting");
  const [liveBuildLog, setLiveBuildLog] = useState("");
  const [liveDeployLog, setLiveDeployLog] = useState("");
  const [completed, setCompleted] = useState(false);
  const [failedReason, setFailedReason] = useState("");

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8031/?projectId=${projectId}`);
    ws.onopen = () => setWsState("connected");
    ws.onerror = () => setWsState("error");
    ws.onclose = () => setWsState("closed");
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "log") {
          if (payload.stream === "deploy") {
            setLiveDeployLog((prev) => `${prev}${payload.message || ""}`);
          } else {
            setLiveBuildLog((prev) => `${prev}${payload.message || ""}`);
          }
        }
        if (payload.type === "completed") {
          setCompleted(true);
        }
      } catch (_err) {
        // ignore malformed frames
      }
    };

    return () => ws.close();
  }, [projectId]);

  useEffect(() => {
    let timer = null;
    let mounted = true;

    const load = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8020/api/project/details/${projectId}`
        );
        if (!mounted) return;
        const data = res.data;
        setProject(data);

        if (data.status === "running" || data.status === "ready") {
          setCompleted(true);
          setFailedReason("");
          return;
        }

        if (data.status === "build_failed" || data.status === "failed") {
          const reason =
            data?.logs?.build ||
            data?.buildHistory?.[data.buildHistory.length - 1]?.message ||
            "Build failed";
          setFailedReason(reason);
          return;
        }
      } catch (err) {
        if (!mounted) return;
        setError(
          err?.response?.data?.error ||
            "Unable to fetch build status. Please retry."
        );
      } finally {
        if (mounted) {
          timer = setTimeout(load, POLL_MS);
        }
      }
    };

    load();
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [navigate, projectId]);

  const statusText = useMemo(() => {
    if (!project) return "Loading build status...";
    if (project.status === "queued") return "Build is queued...";
    if (project.status === "building") return "Build in progress...";
    if (project.status === "ready") return "Build completed. Project is ready to start.";
    return `Current status: ${project.status}`;
  }, [project]);

  const openProjectWithProjectsBack = () => {
    navigate("/projects", { replace: true });
    setTimeout(() => {
      navigate(`/project/${projectId}`);
    }, 0);
  };

  return (
    <div className="build-status-page">
      <SrhNavbar />
      <div className="build-status-card">
        <h1>Build Logs</h1>
        <p className="status-line">{statusText}</p>
        <p className="ws-line">Live stream: {wsState}</p>
        {error && <p className="build-error">{error}</p>}
        {failedReason && (
          <div className="build-failed-box">
            <span>Build failed. Review logs and update your upload.</span>
            <button
              onClick={() =>
                navigate("/upload", {
                  state: {
                    buildError: failedReason,
                    failedProjectId: projectId,
                    uploadDraft,
                  },
                })
              }
            >
              Back To Upload
            </button>
          </div>
        )}
        {completed && (
          <div className="build-success">
            Build completed successfully.
            <button onClick={openProjectWithProjectsBack}>
              Open Project
            </button>
          </div>
        )}

        <div className="log-box">
          <h3>Build Log</h3>
          <pre>{liveBuildLog || project?.logs?.build || "No logs yet..."}</pre>
        </div>

        <div className="log-box">
          <h3>Deploy Log</h3>
          <pre>{liveDeployLog || project?.logs?.deploy || "No deploy logs yet..."}</pre>
        </div>
      </div>
    </div>
  );
};

export default BuildStatusPage;
