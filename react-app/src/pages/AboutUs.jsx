import React from 'react';
import '../styles/AboutUs.css';



const About = () => {
  return (
    <div className="about-section">
      <h1>About Us Page</h1>

      <h2>Our Team</h2>
      <div className="team-section">
        <div className="team-card">
          <img src="https://i.ibb.co/qs0Zwc0/2-A1-DEA05-9292-497-C-8-ACD-1-E11-AB6393-EA.jpg" alt="Team member 1" />
          <div className="container">
            <h2>Adith Adithya</h2>
            <p className="titleAboutUs">Frontend Developer</p>
          </div>
        </div>

        <div className="team-card">
          <img src="https://i.ibb.co/Jj8ZLML/B5-E4718-F-2618-44-FF-8114-8-E34-F6-B41727-1-201-a.jpg" alt="Team member 2" />
          <div className="container">
            <h2>Alan K Mathew</h2>
            <p className="titleAboutUs">Frontend Developer</p>
          </div>
        </div>

        <div className="team-card">
          <img src="https://i.ibb.co/GWjh9ky/Mahesh-Professional-Photo-Copy.jpg" alt="Team member 3" />
          <div className="container">
            <h2> Mahesh Nidugala</h2>
            <p className="titleAboutUs">Backend Developer</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;