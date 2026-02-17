import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import SrhNavbar from "../components/SrhNavbar";
import "../styles/ProjectsGalleryPage.css";

const VISIBLE_PROJECT_STATUSES = new Set(["ready", "running", "stopped"]);
const ITEMS_PER_PAGE = 12;

const getTeamSummary = (project) => {
  const members = Array.isArray(project?.teamMembers) ? project.teamMembers : [];
  const names = members
    .map((member) => String(member?.name || "").trim())
    .filter(Boolean);
  const uniqueNames = [...new Set(names)];
  if (uniqueNames.length === 0) return `Team: ${project?.studentName || "Unknown"}`;
  if (uniqueNames.length <= 2) return `Team: ${uniqueNames.join(", ")}`;
  return `Team: ${uniqueNames[0]}, ${uniqueNames[1]} +${uniqueNames.length - 2}`;
};

const ProjectsGalleryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("ALL");
  const [tag, setTag] = useState("ALL");
  const [page, setPage] = useState(1);

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

  useEffect(() => {
    setPage(1);
  }, [search, course, tag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pagedProjects = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const goToPage = (target) => {
    const next = Math.min(Math.max(target, 1), totalPages);
    setPage(next);
  };

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
        {pagedProjects.map((project) => {
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
                <p className="team-summary">{getTeamSummary(project)}</p>
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && <p className="no-projects-msg">No projects found.</p>}

      {filtered.length > ITEMS_PER_PAGE && (
        <div className="pagination-wrap">
          <button type="button" onClick={() => goToPage(page - 1)} disabled={page === 1}>
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button type="button" onClick={() => goToPage(page + 1)} disabled={page === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectsGalleryPage;
