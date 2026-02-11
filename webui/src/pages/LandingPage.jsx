import React from "react";
import { useNavigate } from "react-router-dom";
import SrhNavbar from "../components/SrhNavbar";
import "../styles/LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <SrhNavbar />

      <section className="hero">
        <h1>
          Showcase Your Innovation.
          <br />
          <span>Shape Your Future.</span>
        </h1>
        <p>
          A collaborative platform for SRH ACS and ADS students to upload,
          deploy, review, and present impactful academic projects.
        </p>
        <div className="hero-actions">
          <button onClick={() => navigate("/projects")}>Browse Projects</button>
          <button className="outline" onClick={() => navigate("/upload")}>
            Submit Project
          </button>
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
    </div>
  );
};

export default LandingPage;
