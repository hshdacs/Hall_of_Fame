import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import SrhNavbar from "../components/SrhNavbar";
import { getToken, getUserProfile } from "../lib/session";
import { useToast } from "../components/ToastProvider";
import "../styles/UploadProjectPage.css";

const STACKS = [
  "React",
  "Next.js",
  "Angular",
  "Vue",
  "Node.js",
  "Express",
  "FastAPI",
  "Django",
  "Spring Boot",
  "Flask",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "Redis",
  "Docker",
  "Kubernetes",
  "TensorFlow",
  "PyTorch",
  "OpenCV",
  "Java",
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

const UPLOAD_DRAFT_KEY = "hof_upload_project_draft_v1";

const readUploadDraft = () => {
  try {
    const raw = localStorage.getItem(UPLOAD_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_err) {
    return null;
  }
};

const isValidGithubRepoUrl = (value) => {
  if (!value) return false;
  try {
    const parsed = new URL(value.trim());
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (!["http:", "https:"].includes(parsed.protocol) || host !== "github.com") {
      return false;
    }
    if (parsed.search || parsed.hash) return false;

    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length !== 2) return false;

    const [owner, rawRepo] = segments;
    const repo = rawRepo.endsWith(".git") ? rawRepo.slice(0, -4) : rawRepo;
    const partRegex = /^[A-Za-z0-9._-]+$/;
    return Boolean(owner && repo && partRegex.test(owner) && partRegex.test(repo));
  } catch (_err) {
    return false;
  }
};

const UploadProjectPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const buildError = location.state?.buildError || "";
  const uploadDraft = location.state?.uploadDraft || null;
  const profile = getUserProfile();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    projectTag: "AI",
    projectTitle: "",
    description: "",
    githubUrl: "",
  });
  const [zipFile, setZipFile] = useState(null);
  const [zipFileName, setZipFileName] = useState("");
  const [images, setImages] = useState([]);
  const [imageFileNames, setImageFileNames] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [videoFileName, setVideoFileName] = useState("");
  const [resourceDocs, setResourceDocs] = useState([]);
  const [resourceDocNames, setResourceDocNames] = useState([]);
  const [resourceLinksText, setResourceLinksText] = useState("");
  const [documentation, setDocumentation] = useState("");
  const [students, setStudents] = useState([]);
  const [teammates, setTeammates] = useState([]);
  const [selectedTeammateEmail, setSelectedTeammateEmail] = useState("");
  const [techStack, setTechStack] = useState([]);
  const [saving, setSaving] = useState(false);
  const hydratedRef = useRef(false);

  const imagePreviews = useMemo(
    () => images.map((file) => ({ file, src: URL.createObjectURL(file) })),
    [images]
  );

  const resourceLinks = useMemo(
    () =>
      resourceLinksText
        .split("\n")
        .map((link) => link.trim())
        .filter(Boolean),
    [resourceLinksText]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.src));
    };
  }, [imagePreviews]);

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

  useEffect(() => {
    const persistedDraft = readUploadDraft();
    const draftSource = uploadDraft || persistedDraft;
    if (draftSource) {
      setForm((prev) => ({ ...prev, ...(draftSource.form || {}) }));
      setZipFile(draftSource.zipFile || null);
      setZipFileName(draftSource.zipFileName || draftSource.zipFile?.name || "");
      setImages(Array.isArray(draftSource.images) ? draftSource.images : []);
      setImageFileNames(
        Array.isArray(draftSource.imageFileNames)
          ? draftSource.imageFileNames
          : Array.isArray(draftSource.images)
            ? draftSource.images.map((file) => file?.name).filter(Boolean)
            : []
      );
      setVideoFile(draftSource.videoFile || null);
      setVideoFileName(draftSource.videoFileName || draftSource.videoFile?.name || "");
      setResourceDocs(Array.isArray(draftSource.resourceDocs) ? draftSource.resourceDocs : []);
      setResourceDocNames(
        Array.isArray(draftSource.resourceDocNames)
          ? draftSource.resourceDocNames
          : Array.isArray(draftSource.resourceDocs)
            ? draftSource.resourceDocs.map((file) => file?.name).filter(Boolean)
            : []
      );
      setResourceLinksText(draftSource.resourceLinksText || "");
      setDocumentation(draftSource.documentation || "");
      setTeammates(Array.isArray(draftSource.teammates) ? draftSource.teammates : []);
      setTechStack(Array.isArray(draftSource.techStack) ? draftSource.techStack : []);
      setStep(draftSource.step || 1);
    }
  }, [uploadDraft]);

  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }

    const draft = {
      step,
      form,
      zipFileName: zipFile?.name || zipFileName,
      imageFileNames: images.length > 0 ? images.map((file) => file.name) : imageFileNames,
      videoFileName: videoFile?.name || videoFileName,
      resourceDocNames:
        resourceDocs.length > 0 ? resourceDocs.map((file) => file.name) : resourceDocNames,
      resourceLinksText,
      documentation,
      teammates,
      techStack,
    };
    localStorage.setItem(UPLOAD_DRAFT_KEY, JSON.stringify(draft));
  }, [
    step,
    form,
    zipFile,
    zipFileName,
    images,
    imageFileNames,
    videoFile,
    videoFileName,
    resourceDocs,
    resourceDocNames,
    resourceLinksText,
    documentation,
    teammates,
    techStack,
  ]);

  const handleZipChange = (e) => {
    const file = e.target.files?.[0] || null;
    setZipFile(file);
    setZipFileName(file?.name || "");
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
    setImageFileNames(files.map((file) => file.name));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setVideoFile(file);
    setVideoFileName(file?.name || "");
  };

  const handleResourceDocsChange = (e) => {
    const files = Array.from(e.target.files || []);
    setResourceDocs(files);
    setResourceDocNames(files.map((file) => file.name));
  };

  const toggleStack = (item) => {
    setTechStack((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const addTeammateByEmail = () => {
    if (!selectedTeammateEmail) return;
    const match = students.find((s) => s.email === selectedTeammateEmail);
    if (!match) return;
    const alreadyAdded = teammates.some((t) => t.email === match.email);
    const isSelf =
      String(match.email).toLowerCase() === String(profile.email || "").toLowerCase();
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

  const validateStepOne = () => {
    if (!form.projectTitle.trim()) {
      toast("Please enter project title.", "error");
      return false;
    }
    if (!form.description.trim()) {
      toast("Please enter project description.", "error");
      return false;
    }
    if (!form.githubUrl.trim() && !zipFile) {
      toast("Provide GitHub URL or ZIP file.", "error");
      return false;
    }
    if (form.githubUrl.trim() && zipFile) {
      toast("Use only one source: GitHub URL or ZIP.", "error");
      return false;
    }
    if (form.githubUrl.trim() && !isValidGithubRepoUrl(form.githubUrl)) {
      toast("Enter a valid GitHub repo URL (example: https://github.com/owner/repo).", "error");
      return false;
    }
    if (techStack.length === 0) {
      toast("Select at least one technology.", "error");
      return false;
    }
    return true;
  };

  const onNext = () => {
    if (step === 1 && !validateStepOne()) return;
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const onBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async () => {
    const token = getToken();
    if (!token) {
      toast("Please login first.", "error");
      navigate("/login");
      return;
    }

    if (!validateStepOne()) return;

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

      const currentDraft = {
        step,
        form,
        zipFile,
        zipFileName: zipFile?.name || zipFileName,
        images,
        imageFileNames: images.map((file) => file.name),
        videoFile,
        videoFileName: videoFile?.name || videoFileName,
        resourceDocs,
        resourceDocNames: resourceDocs.map((file) => file.name),
        resourceLinksText,
        documentation,
        teammates,
        techStack,
      };

      const res = await axios.post("http://localhost:8020/api/project/upload", data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate(`/build-status/${res.data.projectId}`, {
        state: { uploadDraft: currentDraft },
      });
    } catch (err) {
      toast(err?.response?.data?.error || "Upload failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const stepClass = (targetStep) => {
    if (step === targetStep) return "step active";
    if (step > targetStep) return "step done";
    return "step";
  };

  return (
    <div className="upload-page">
      <SrhNavbar />
      {saving && (
        <div
          className="submit-overlay"
          role="status"
          aria-live="polite"
          aria-label="Submitting project"
        >
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
          <div className={stepClass(1)}>1. General Info</div>
          <div className={stepClass(2)}>2. Assets & Media</div>
          <div className={stepClass(3)}>3. Review & Submit</div>
        </aside>

        <main className="upload-main">
          <h1>Write Project Documentation</h1>
          <p>Step {step} of 3</p>
          {buildError && (
            <div className="upload-error-box">
              <h4>Previous build failed</h4>
              <pre>{buildError}</pre>
              <p>Fix the issue and upload again.</p>
            </div>
          )}

          {step === 1 && (
            <>
              <section className="panel">
                <h3>General Info</h3>
                <div className="grid-two">
                  <input
                    placeholder="Student Name"
                    value={profile.name || ""}
                    readOnly
                    disabled={saving}
                  />
                  <input
                    placeholder="Registration Number"
                    value={profile.regNumber || ""}
                    readOnly
                    disabled={saving}
                  />
                  <input
                    placeholder="Batch"
                    value={profile.batch || ""}
                    readOnly
                    disabled={saving}
                  />
                  <input
                    placeholder="Course"
                    value={profile.course || ""}
                    readOnly
                    disabled={saving}
                  />
                  <select
                    value={form.projectTag}
                    onChange={(e) => setForm({ ...form, projectTag: e.target.value })}
                    disabled={saving}
                  >
                    {PROJECT_TAGS.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                  <input
                    className="full"
                    placeholder="Project Title"
                    value={form.projectTitle}
                    onChange={(e) => setForm({ ...form, projectTitle: e.target.value })}
                    disabled={saving}
                  />
                  <textarea
                    className="full"
                    placeholder="Project Description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    disabled={saving}
                  />
                  <input
                    className="full"
                    placeholder="GitHub URL (optional if ZIP used)"
                    value={form.githubUrl}
                    onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                    disabled={saving}
                  />
                  <input
                    className="full"
                    type="file"
                    accept=".zip"
                    onChange={handleZipChange}
                    disabled={saving}
                  />
                  {zipFileName && <p className="comment-empty">Selected ZIP: {zipFileName}</p>}
                </div>
              </section>

              <section className="panel">
                <h3>Select Team Mates</h3>
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
                      <button
                        type="button"
                        onClick={() => removeTeammate(member.email)}
                        disabled={saving}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel">
                <h3>Tech Stack</h3>
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
            </>
          )}

          {step === 2 && (
            <>
              <section className="panel">
                <h3>Assets & Media</h3>
                <label className="field-label">Image Gallery</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  disabled={saving}
                />
                <div className="preview-grid">
                  {imagePreviews.map((image, index) => (
                    <img key={index} src={image.src} alt={`preview-${index}`} />
                  ))}
                </div>
                {imagePreviews.length === 0 && imageFileNames.length > 0 && (
                  <p className="comment-empty">Selected images: {imageFileNames.join(", ")}</p>
                )}

                <div className="video-upload">
                  <h4>Project Demo Video (optional)</h4>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    disabled={saving}
                  />
                  {(videoFile?.name || videoFileName) && <p>{videoFile?.name || videoFileName}</p>}
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
                    onChange={handleResourceDocsChange}
                    disabled={saving}
                  />
                  {(resourceDocs.length > 0 || resourceDocNames.length > 0) && (
                    <ul>
                      {(resourceDocs.length > 0
                        ? resourceDocs.map((doc) => doc.name)
                        : resourceDocNames
                      ).map((docName) => (
                        <li key={docName}>{docName}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </>
          )}

          {step === 3 && (
            <>
              <section className="panel">
                <div className="review-top-actions">
                  <button type="button" onClick={() => setStep(1)} disabled={saving}>
                    Edit General Info
                  </button>
                  <button type="button" onClick={() => setStep(2)} disabled={saving}>
                    Edit Assets & Media
                  </button>
                </div>
                <h3>Final Review</h3>

                <div className="review-block">
                  <h4>General Info</h4>
                  <p>
                    <strong>Title:</strong> {form.projectTitle || "-"}
                  </p>
                  <p>
                    <strong>Tag:</strong> {form.projectTag}
                  </p>
                  <p>
                    <strong>Description:</strong> {form.description || "-"}
                  </p>
                  <p>
                    <strong>Source:</strong>{" "}
                    {form.githubUrl.trim() ? form.githubUrl.trim() : zipFile?.name || zipFileName || "-"}
                  </p>
                </div>

                <div className="review-block">
                  <h4>Team</h4>
                  {teammates.length === 0 && <p>Solo project</p>}
                  {teammates.length > 0 && (
                    <ul>
                      {teammates.map((member) => (
                        <li key={member.email}>
                          {member.name} ({member.email})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="review-block">
                  <h4>Tech Stack</h4>
                  {techStack.length === 0 ? <p>-</p> : <p>{techStack.join(", ")}</p>}
                </div>

                <div className="review-block">
                  <h4>Assets & Media</h4>
                  <p>
                    <strong>Images:</strong>{" "}
                    {images.length > 0 ? images.length : imageFileNames.length}
                  </p>
                  <p>
                    <strong>Video:</strong>{" "}
                    {videoFile?.name || videoFileName || "Not added"}
                  </p>
                </div>

                <div className="review-block">
                  <h4>Documentation</h4>
                  <p>{documentation || "-"}</p>
                </div>

                <div className="review-block">
                  <h4>Resources</h4>
                  {resourceLinks.length === 0 &&
                    resourceDocs.length === 0 &&
                    resourceDocNames.length === 0 && <p>-</p>}
                  {resourceLinks.length > 0 && (
                    <>
                      <p>
                        <strong>Links</strong>
                      </p>
                      <ul>
                        {resourceLinks.map((link) => (
                          <li key={link}>{link}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {(resourceDocs.length > 0 || resourceDocNames.length > 0) && (
                    <>
                      <p>
                        <strong>Files</strong>
                      </p>
                      <ul>
                        {(resourceDocs.length > 0
                          ? resourceDocs.map((doc) => doc.name)
                          : resourceDocNames
                        ).map((docName) => (
                          <li key={docName}>{docName}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </section>
            </>
          )}

          <div className="submit-row wizard-actions">
            {step > 1 && (
              <button className="btn-secondary" type="button" onClick={onBack} disabled={saving}>
                Back
              </button>
            )}
            {step < 3 && (
              <button type="button" onClick={onNext} disabled={saving}>
                Next
              </button>
            )}
            {step === 3 && (
              <button type="button" onClick={onSubmit} disabled={saving}>
                {saving ? "Submitting..." : "Submit Project"}
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UploadProjectPage;
