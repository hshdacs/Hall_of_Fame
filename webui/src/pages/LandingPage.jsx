import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SrhNavbar from "../components/SrhNavbar";
import SrhFooter from "../components/SrhFooter";
import { getLanguage, onLanguageChange, t } from "../lib/preferences";
import "../styles/LandingPage.css";

const VISIBLE_PROJECT_STATUSES = new Set(["ready", "running", "stopped"]);

const LandingPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("All");
  const [language, setLanguage] = useState(getLanguage());

  useEffect(() => onLanguageChange(setLanguage), []);

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

  const getTeamSummaryLabel = (project) => {
    const members = Array.isArray(project?.teamMembers) ? project.teamMembers : [];
    const names = members
      .map((member) => String(member?.name || "").trim())
      .filter(Boolean);
    const uniqueNames = [...new Set(names)];
    if (uniqueNames.length === 0) {
      return `${t(language, "teamLabel")}: ${project?.studentName || t(language, "unknownStudent")}`;
    }
    if (uniqueNames.length <= 2) {
      return `${t(language, "teamLabel")}: ${uniqueNames.join(", ")}`;
    }
    return `${t(language, "teamLabel")}: ${uniqueNames[0]}, ${uniqueNames[1]} +${uniqueNames.length - 2}`;
  };

  return (
    <div className="landing-page">
      <SrhNavbar />

      <section className="hero-block">
        <div className="hero">
        <h1>
          {t(language, "landingHeadlineTop")}
          <br />
          <span>{t(language, "landingHeadlineBottom")}</span>
        </h1>
        <p>{t(language, "landingSubtitle")}</p>
        <div className="hero-search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(language, "landingSearchPlaceholder")}
          />
          <select value={tag} onChange={(e) => setTag(e.target.value)}>
            {tags.map((item) => (
              <option value={item} key={item}>
                {item === "All" ? t(language, "all") : item}
              </option>
            ))}
          </select>
          <button onClick={onExplore}>{t(language, "explore")}</button>
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
          <h3>{t(language, "forStudents")}</h3>
          <p>{t(language, "forStudentsText")}</p>
        </article>
        <article>
          <h3>{t(language, "forFaculty")}</h3>
          <p>{t(language, "forFacultyText")}</p>
        </article>
        <article>
          <h3>{t(language, "forCommunity")}</h3>
          <p>{t(language, "forCommunityText")}</p>
        </article>
      </section>

      <section className="latest-wrap">
        <div className="latest-head">
          <h2>{t(language, "latestProjects")}</h2>
          <button onClick={() => navigate("/projects")}>{t(language, "viewAllProjects")}</button>
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
                <div className="latest-placeholder">{t(language, "noImage")}</div>
              )}
              <div className="latest-body">
                <span>{project.projectTag || t(language, "general")}</span>
                <h3>{project.projectTitle}</h3>
                <p>{project.studentName || t(language, "unknownStudent")}</p>
                <p>{getTeamSummaryLabel(project)}</p>
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
