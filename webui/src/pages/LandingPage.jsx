import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SrhNavbar from "../components/SrhNavbar";
import SrhFooter from "../components/SrhFooter";
import "../styles/LandingPage.css";

const VISIBLE_PROJECT_STATUSES = new Set(["ready", "running", "stopped"]);

const LandingPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("All");

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

  const latestProjects = useMemo(() => projects.slice(0, 4), [projects]);
  const tags = useMemo(() => {
    const collected = new Set(["All", "AI", "Web", "Data Science", "Cloud"]);
    projects.forEach((project) => {
      if (project.projectTag) collected.add(project.projectTag);
    });
    return [...collected];
  }, [projects]);

  const onExplore = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    if (tag !== "All") params.set("tag", tag);
    navigate(`/projects?${params.toString()}`);
  };

  return (
    <div className="landing-page">
      <SrhNavbar />

      <section className="hero-block">
        <div className="hero">
        <h1>
          Showcase Your Innovation.
          <br />
          <span>Shape Your Future.</span>
        </h1>
        <p>
          A collaborative platform for SRH ACS and ADS students to upload,
          deploy, review, and present impactful academic projects.
        </p>
        <div className="hero-search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by project name, tech, or topic..."
          />
          <select value={tag} onChange={(e) => setTag(e.target.value)}>
            {tags.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
          <button onClick={onExplore}>Explore</button>
        </div>
        <div className="hero-tags">
          {tags.slice(1, 6).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        </div>
      </section>

      <section className="feature-grid">
        <article>
          <h3>For Students</h3>
          <p>Upload your capstone work with GitHub or ZIP and run it live.</p>
        </article>
        <article>
          <h3>For Faculty</h3>
          <p>Review submissions, monitor deployment health, and guide teams.</p>
        </article>
        <article>
          <h3>For Community</h3>
          <p>Discover cross-discipline projects from ACS and ADS cohorts.</p>
        </article>
      </section>

      <section className="latest-wrap">
        <div className="latest-head">
          <h2>Latest Projects</h2>
          <button onClick={() => navigate("/projects")}>View All Projects</button>
        </div>
        <div className="latest-grid">
          {latestProjects.map((project) => (
            <article
              className="latest-card"
              key={project._id}
              onClick={() => navigate(`/project/${project._id}`)}
            >
              {project.images?.[0] ? (
                <img src={project.images[0]} alt={project.projectTitle} />
              ) : (
                <div className="latest-placeholder">No Image</div>
              )}
              <div className="latest-body">
                <span>{project.projectTag || "General"}</span>
                <h3>{project.projectTitle}</h3>
                <p>{project.studentName || "Unknown Student"}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <SrhFooter />
    </div>
  );
};

export default LandingPage;
