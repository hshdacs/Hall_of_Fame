import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SrhNavbar from "../components/SrhNavbar";
import "../styles/ProjectsGalleryPage.css";

const ProjectsGalleryPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("ALL");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get("http://localhost:8020/api/project/all");
        setProjects(Array.isArray(res.data) ? res.data : []);
      } catch (_err) {
        setProjects([]);
      }
    };
    fetchProjects();
  }, []);

  const filtered = useMemo(() => {
    return projects.filter((project) => {
      const term = search.toLowerCase();
      const textMatch =
        (project.projectTitle || "").toLowerCase().includes(term) ||
        (project.studentName || "").toLowerCase().includes(term) ||
        (project.longDescription || "").toLowerCase().includes(term);

      const normalizedCourse = (project.course || "").toUpperCase();
      const courseMatch = course === "ALL" ? true : normalizedCourse === course;
      return textMatch && courseMatch;
    });
  }, [projects, search, course]);

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
