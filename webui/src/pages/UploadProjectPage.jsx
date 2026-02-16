import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import SrhNavbar from "../components/SrhNavbar";
import { getToken, getUserProfile } from "../lib/session";
import { useToast } from "../components/ToastProvider";
import "../styles/UploadProjectPage.css";

const STACKS = [
  "React", "Next.js", "Angular", "Vue", "Node.js", "Express", "FastAPI",
  "Django", "Spring Boot", "Flask", "MongoDB", "PostgreSQL", "MySQL",
  "Redis", "Docker", "Kubernetes", "TensorFlow", "PyTorch", "OpenCV", "Java"
];
const PROJECT_TAGS = [
  "AI",
  "Web",
  "Mobile",
  "Data Science",
  "Cloud",
  "Cybersecurity",
  "IoT",
  "Robotics",
  "General",
];

const UploadProjectPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const buildError = location.state?.buildError || "";
  const profile = getUserProfile();
  const [form, setForm] = useState({
    projectTag: "AI",
    projectTitle: "",
    description: "",
    githubUrl: "",
  });
  const [zipFile, setZipFile] = useState(null);
  const [images, setImages] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [resourceDocs, setResourceDocs] = useState([]);
  const [resourceLinksText, setResourceLinksText] = useState("");
  const [documentation, setDocumentation] = useState("");
  const [students, setStudents] = useState([]);
  const [teammates, setTeammates] = useState([]);
  const [selectedTeammateEmail, setSelectedTeammateEmail] = useState("");
  const [techStack, setTechStack] = useState([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const imagePreviews = useMemo(
    () => images.map((file) => ({ file, src: URL.createObjectURL(file) })),
    [images]
  );

  const toggleStack = (item) => {
    setTechStack((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  useEffect(() => {
    const loadStudents = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await axios.get("http://localhost:8020/api/auth/users/basic", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudents(res.data || []);
      } catch (_err) {
        setStudents([]);
      }
    };
    loadStudents();
  }, []);

  const addTeammateByEmail = () => {
    if (!selectedTeammateEmail) return;
    const match = students.find((s) => s.email === selectedTeammateEmail);
    if (!match) return;
    const alreadyAdded = teammates.some((t) => t.email === match.email);
    const isSelf = String(match.email).toLowerCase() === String(profile.email || "").toLowerCase();
    if (alreadyAdded || isSelf) return;

    setTeammates((prev) => [
      ...prev,
      {
        userId: match._id,
        name: match.name || "",
        email: match.email || "",
        regNumber: match.regNumber || "",
        course: match.course || "",
      },
    ]);
    setSelectedTeammateEmail("");
  };

  const removeTeammate = (email) => {
    setTeammates((prev) => prev.filter((item) => item.email !== email));
  };

  const onSubmit = async () => {
    const token = getToken();
    if (!token) {
      toast("Please login first.", "error");
      navigate("/login");
      return;
    }

    if (!form.githubUrl.trim() && !zipFile) {
      toast("Provide GitHub URL or ZIP file.", "error");
      return;
    }

    if (form.githubUrl.trim() && zipFile) {
      toast("Use only one source: GitHub URL or ZIP.", "error");
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      data.append("documentation", documentation);
      data.append("resourceLinks", resourceLinksText);
      data.append("teamMembers", JSON.stringify(teammates));
      data.append("technologiesUsed", techStack.join(","));
      if (zipFile) data.append("file", zipFile);
      images.forEach((image) => data.append("projectImages", image));
      if (videoFile) data.append("projectVideo", videoFile);
      resourceDocs.forEach((doc) => data.append("resourceDocs", doc));

      const res = await axios.post("http://localhost:8020/api/project/upload", data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate(`/build-status/${res.data.projectId}`);
    } catch (err) {
      toast(err?.response?.data?.error || "Upload failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="upload-page">
      <SrhNavbar />
      {saving && (
        <div className="submit-overlay" role="status" aria-live="polite" aria-label="Submitting project">
          <div className="submit-overlay-card">
            <div className="submit-spinner" />
            <h3>Submitting project...</h3>
            <p>Please wait while we upload files and queue your build.</p>
          </div>
        </div>
      )}
      <div className="upload-layout">
        <aside className="upload-sidebar">
          <h3>Submission Progress</h3>
          <div className="step done">General Info</div>
          <div className="step done">Assets & Media</div>
          <div className="step">Review & Submit</div>
        </aside>

        <main className="upload-main">
          <h1>Write Project Documentation</h1>
          <p>Provide details, assets, and deployment source.</p>
          {buildError && (
            <div className="upload-error-box">
              <h4>Previous build failed</h4>
              <pre>{buildError}</pre>
              <p>Fix the issue and upload again.</p>
            </div>
          )}

          <section className="panel">
            <div className="grid-two">
              <input placeholder="Student Name" value={profile.name || ""} readOnly disabled={saving} />
              <input placeholder="Registration Number" value={profile.regNumber || ""} readOnly disabled={saving} />
              <input placeholder="Batch" value={profile.batch || ""} readOnly disabled={saving} />
              <input placeholder="Course" value={profile.course || ""} readOnly disabled={saving} />
              <select value={form.projectTag} onChange={(e) => setForm({ ...form, projectTag: e.target.value })} disabled={saving}>
                {PROJECT_TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              <input className="full" placeholder="Project Title" value={form.projectTitle} onChange={(e) => setForm({ ...form, projectTitle: e.target.value })} disabled={saving} />
              <textarea className="full" placeholder="Project Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={saving} />
              <input className="full" placeholder="GitHub URL (optional if ZIP used)" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} disabled={saving} />
              <input className="full" type="file" accept=".zip" onChange={(e) => setZipFile(e.target.files?.[0] || null)} disabled={saving} />
            </div>
          </section>

          <section className="panel">
            <h3>Image Gallery</h3>
            <input type="file" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files || []))} disabled={saving} />
            <div className="preview-grid">
              {imagePreviews.map((image, index) => (
                <img key={index} src={image.src} alt={`preview-${index}`} />
              ))}
            </div>
            <div className="video-upload">
              <h4>Project Demo Video (optional)</h4>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                disabled={saving}
              />
              {videoFile && <p>{videoFile.name}</p>}
            </div>
          </section>

          <section className="panel">
            <h3>Team</h3>
            <div className="team-selector-row">
              <select
                value={selectedTeammateEmail}
                onChange={(e) => setSelectedTeammateEmail(e.target.value)}
                disabled={saving}
              >
                <option value="">Select teammate</option>
                {students.map((student) => (
                  <option key={student._id} value={student.email}>
                    {student.name} ({student.email})
                  </option>
                ))}
              </select>
              <button type="button" onClick={addTeammateByEmail} disabled={saving}>
                Add Teammate
              </button>
            </div>
            <div className="team-list">
              {teammates.length === 0 && <p>No teammates added (solo by default).</p>}
              {teammates.map((member) => (
                <div key={member.email} className="team-item">
                  <span>
                    {member.name} - {member.email}
                  </span>
                  <button type="button" onClick={() => removeTeammate(member.email)} disabled={saving}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <h3>Documentation</h3>
            <textarea
              className="doc-textarea"
              placeholder="Write project documentation, architecture notes, setup steps..."
              value={documentation}
              onChange={(e) => setDocumentation(e.target.value)}
              disabled={saving}
            />
          </section>

          <section className="panel">
            <h3>Resources</h3>
            <textarea
              className="doc-textarea"
              placeholder="Paste reference links, one per line"
              value={resourceLinksText}
              onChange={(e) => setResourceLinksText(e.target.value)}
              disabled={saving}
            />
            <div className="resource-docs">
              <h4>Reference PDFs / Notes (optional)</h4>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                multiple
                onChange={(e) => setResourceDocs(Array.from(e.target.files || []))}
                disabled={saving}
              />
              {resourceDocs.length > 0 && (
                <ul>
                  {resourceDocs.map((doc) => (
                    <li key={doc.name}>{doc.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="panel">
            <h3>Technology Stack</h3>
            <div className="stack-pick">
              {STACKS.map((item) => (
                <button
                  key={item}
                  className={techStack.includes(item) ? "active" : ""}
                  onClick={() => toggleStack(item)}
                  type="button"
                  disabled={saving}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <div className="submit-row">
            <button onClick={onSubmit} disabled={saving}>
              {saving ? "Submitting..." : "Final Review & Submit"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UploadProjectPage;
