import React, { useMemo, useState } from "react";
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
      data.append("technologiesUsed", techStack.join(","));
      if (zipFile) data.append("file", zipFile);
      images.forEach((image) => data.append("projectImages", image));

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
              <input placeholder="Student Name" value={profile.name || ""} readOnly />
              <input placeholder="Registration Number" value={profile.regNumber || ""} readOnly />
              <input placeholder="Batch" value={profile.batch || ""} readOnly />
              <input placeholder="Course" value={profile.course || ""} readOnly />
              <select value={form.projectTag} onChange={(e) => setForm({ ...form, projectTag: e.target.value })}>
                {PROJECT_TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              <input className="full" placeholder="Project Title" value={form.projectTitle} onChange={(e) => setForm({ ...form, projectTitle: e.target.value })} />
              <textarea className="full" placeholder="Project Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <input className="full" placeholder="GitHub URL (optional if ZIP used)" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} />
              <input className="full" type="file" accept=".zip" onChange={(e) => setZipFile(e.target.files?.[0] || null)} />
            </div>
          </section>

          <section className="panel">
            <h3>Image Gallery</h3>
            <input type="file" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files || []))} />
            <div className="preview-grid">
              {imagePreviews.map((image, index) => (
                <img key={index} src={image.src} alt={`preview-${index}`} />
              ))}
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
