// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import Header from "../components/Header";
// import ProjectCards from "../components/Cards";
// import { Container, Dialog, DialogContent, DialogTitle, Button } from "@mui/material";
// import SearchBar from "../components/Search";
// import "../styles/Dashboard.css";
// import Filter from "../components/Filter";

// const Dashboard = () => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [projects, setProjects] = useState([]);
//   const [uploadModalOpen, setUploadModalOpen] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchProjects = async () => {
//       try {
//         const response = await axios.get("http://localhost:8020/api/project/all");
//         setProjects(Array.isArray(response.data) ? response.data : []);
//       } catch (error) {
//         console.error("Error fetching project data", error);
//         setProjects([]);
//       }
//     };

//     fetchProjects();
//   }, []);

//   const filteredProjects = projects.filter((p) =>
//     p.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const handleUpload = async () => {
//     const formData = new FormData();
//     formData.append("studentName", document.getElementById("studentName").value);
//     formData.append("regNumber", document.getElementById("regNumber").value);
//     formData.append("projectTitle", document.getElementById("projectTitle").value);
//     formData.append("description", document.getElementById("description").value);
//     formData.append("technologiesUsed", document.getElementById("technologiesUsed").value);

//     const githubUrl = document.getElementById("githubUrl").value;
//     const zipFile = document.getElementById("zipFile").files[0];

//     if (githubUrl) formData.append("githubUrl", githubUrl);
//     if (zipFile) formData.append("file", zipFile);

//     try {
//       await axios.post("http://localhost:8020/api/project/upload", formData);
//       alert("Project Uploaded Successfully!");
//       setUploadModalOpen(false);
//     } catch (error) {
//       console.error(error);
//       alert("Error uploading project!");
//     }
//   };

//   return (
//     <div>
//       <Header />
//       <h1 className="header-text">Explore All Projects Here!</h1>

//       <Container className="appContainer">
        
//         {/* 🔹 TOP BAR → SEARCH LEFT, FILTER + UPLOAD RIGHT */}
//         <div className="dashboard-top">
          
//           {/* LEFT SIDE */}
//           <div className="left-side">
//             <SearchBar 
//               searchTerm={searchTerm}
//               onSearchChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>

//           {/* RIGHT SIDE */}
//           <div className="right-side">
//             <Filter />
//             <Button
//               variant="contained"
//               className="upload-btn"
//               onClick={() => setUploadModalOpen(true)}
//             >
//               Upload Project
//             </Button>
//           </div>

//         </div>

//         {/* PROJECT CARDS */}
//         <ProjectCards
//           projects={filteredProjects}
//           page={currentPage}
//           onPageChange={setCurrentPage}
//           onCardClick={(projectId) => navigate(`/project/${projectId}`)}
//         />
//       </Container>

//       {/* UPLOAD MODAL */}
//       <Dialog open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} maxWidth="md" fullWidth>
//         <DialogTitle style={{ fontWeight: "bold", color: "#0A2A43" }}>
//           Upload New Project
//         </DialogTitle>

//         <DialogContent>
//           <div className="upload-form">
//             <input type="text" placeholder="Student Name" className="upload-input" id="studentName" />
//             <input type="text" placeholder="Registration Number" className="upload-input" id="regNumber" />
//             <input type="text" placeholder="Project Title" className="upload-input" id="projectTitle" />

//             <textarea placeholder="Project Description" className="upload-textarea" id="description" />

//             <input type="text" placeholder="Technologies Used (comma separated)" className="upload-input" id="technologiesUsed" />

//             <input type="text" placeholder="GitHub Repository URL (optional)" className="upload-input" id="githubUrl" />

//             <p style={{ textAlign: "center", margin: "10px 0" }}>OR</p>

//             <input type="file" id="zipFile" className="upload-input" accept=".zip" />

//             <Button
//               variant="contained"
//               style={{
//                 backgroundColor: "#0a2a43",
//                 color: "white",
//                 marginTop: "20px",
//                 width: "100%",
//                 padding: "10px",
//               }}
//               onClick={handleUpload}
//             >
//               Submit
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default Dashboard;
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import ProjectCards from "../components/Cards";
import { Container, Dialog, DialogContent, DialogTitle, Button } from "@mui/material";
import SearchBar from "../components/Search";
import "../styles/Dashboard.css";
import Filter from "../components/Filter";
import { useToast } from "../components/ToastProvider";

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [projects, setProjects] = useState([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { toast } = useToast();

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get("http://localhost:8020/api/project/all");
        setProjects(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching project data", error);
        setProjects([]);
      }
    };

    fetchProjects();
  }, [location]); // auto-refresh whenever returning to dashboard

  const filteredProjects = projects.filter((p) =>
    p.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpload = async () => {
    const githubUrl = document.getElementById("githubUrl").value.trim();
    const zipFile = document.getElementById("zipFile").files[0];

    if (!githubUrl && !zipFile) {
      toast("Please provide either a GitHub URL or a ZIP file.", "error");
      return;
    }

    if (githubUrl && zipFile) {
      toast("Please choose only one source: GitHub URL or ZIP file.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("studentName", document.getElementById("studentName").value);
    formData.append("regNumber", document.getElementById("regNumber").value);
    formData.append("course", document.getElementById("course").value);
    formData.append("projectTitle", document.getElementById("projectTitle").value);
    formData.append("description", document.getElementById("description").value);
    formData.append("technologiesUsed", document.getElementById("technologiesUsed").value);

    if (githubUrl) formData.append("githubUrl", githubUrl);
    if (zipFile) formData.append("file", zipFile);

    try {
      const res = await axios.post("http://localhost:8020/api/project/upload", formData);

      const projectId = res.data.projectId;

      setUploadModalOpen(false);

      // redirect to project details
      navigate(`/project/${projectId}`);

    } catch (error) {
      console.error(error);
      toast("Error uploading project!", "error");
    }
  };

  return (
    <div>
      <Header />
      <h1 className="header-text">Explore All Projects Here!</h1>

      <Container className="appContainer">
        <div className="dashboard-top">
          <div className="left-side">
            <SearchBar 
              searchTerm={searchTerm}
              onSearchChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="right-side">
            <Filter />
            <Button
              variant="outlined"
              className="upload-btn"
              onClick={() => navigate("/admin/monitoring")}
            >
              Quota Monitor
            </Button>
            <Button
              variant="contained"
              className="upload-btn"
              onClick={() => setUploadModalOpen(true)}
            >
              Upload Project
            </Button>
          </div>
        </div>

        <ProjectCards
          projects={filteredProjects}
          page={currentPage}
          onPageChange={setCurrentPage}
          onCardClick={(projectId) => navigate(`/project/${projectId}`)}
        />
      </Container>

      <Dialog open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle style={{ fontWeight: "bold", color: "#0A2A43" }}>
          Upload New Project
        </DialogTitle>

        <DialogContent>
          <div className="upload-form">
            <input type="text" placeholder="Student Name" className="upload-input" id="studentName" />
            <input type="text" placeholder="Registration Number" className="upload-input" id="regNumber" />
            <select className="upload-input" id="course" defaultValue="ACS">
              <option value="ACS">ACS - Applied Computer Science</option>
              <option value="ADS">ADS - Applied Data Science</option>
            </select>
            <input type="text" placeholder="Project Title" className="upload-input" id="projectTitle" />

            <textarea placeholder="Project Description" className="upload-textarea" id="description" />

            <input type="text" placeholder="Technologies Used (comma separated)" className="upload-input" id="technologiesUsed" />

            <input type="text" placeholder="GitHub Repository URL (optional)" className="upload-input" id="githubUrl" />

            <p style={{ textAlign: "center", margin: "10px 0" }}>OR</p>

            <input type="file" id="zipFile" className="upload-input" accept=".zip" />

            <Button
              variant="contained"
              style={{
                backgroundColor: "#0a2a43",
                color: "white",
                marginTop: "20px",
                width: "100%",
                padding: "10px",
              }}
              onClick={handleUpload}
            >
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
