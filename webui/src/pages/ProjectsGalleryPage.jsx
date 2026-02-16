import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import SrhNavbar from "../components/SrhNavbar";
import "../styles/ProjectsGalleryPage.css";

const VISIBLE_PROJECT_STATUSES = new Set(["ready", "running", "stopped"]);

const ProjectsGalleryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("ALL");
  const [tag, setTag] = useState("ALL");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get("http://localhost:8020/api/project/all");
        const list = Array.isArray(res.data) ? res.data : [];
        setProjects(
          list.filter((project) =>
            VISIBLE_PROJECT_STATUSES.has(String(project?.status || "").toLowerCase())
          )
        );
      } catch (_err) {
        setProjects([]);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    const tagParam = params.get("tag");
    if (searchParam) setSearch(searchParam);
    if (tagParam) setTag(tagParam);
  }, [location.search]);

  const tags = useMemo(() => {
    const set = new Set(["ALL"]);
    projects.forEach((project) => {
      if (project.projectTag) set.add(project.projectTag);
    });
    return [...set];
  }, [projects]);

  const filtered = useMemo(() => {
    return projects.filter((project) => {
      const term = search.toLowerCase();
      const textMatch =
        (project.projectTitle || "").toLowerCase().includes(term) ||
        (project.studentName || "").toLowerCase().includes(term) ||
        (project.longDescription || "").toLowerCase().includes(term);

      const normalizedCourse = (project.course || "").toUpperCase();
      const courseMatch = course === "ALL" ? true : normalizedCourse === course;
      const tagMatch = tag === "ALL" ? true : (project.projectTag || "General") === tag;
      return textMatch && courseMatch && tagMatch;
    });
  }, [projects, search, course, tag]);

  return (
    <div className="gallery-page">
      <SrhNavbar />

      <div className="gallery-controls">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects, students, or topics"
        />
        <select value={course} onChange={(e) => setCourse(e.target.value)}>
          <option value="ALL">All Departments</option>
          <option value="ACS">ACS</option>
          <option value="ADS">ADS</option>
        </select>
        <select value={tag} onChange={(e) => setTag(e.target.value)}>
          {tags.map((item) => (
            <option value={item} key={item}>
              {item === "ALL" ? "All Tags" : item}
            </option>
          ))}
        </select>
      </div>

      <div className="cards-grid">
        {filtered.map((project) => {
          const image = project.images?.[0];
          return (
            <article key={project._id} className="project-card" onClick={() => navigate(`/project/${project._id}`)}>
              {image ? (
                <img src={image} alt={project.projectTitle} />
              ) : (
                <div className="img-placeholder">No Preview</div>
              )}
              <div className="card-body">
                <span className="tag">{project.course || "NA"}</span>
                <span className="tag tag2">{project.projectTag || "General"}</span>
                <h3>{project.projectTitle}</h3>
                <p>{project.studentName || "Unknown Student"}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectsGalleryPage;
