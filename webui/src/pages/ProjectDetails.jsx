// import React, { useState, useEffect, useRef } from "react";
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import {
//     Container,
//     Typography,
//     Dialog,
//     DialogContent,
//     DialogTitle,
//     IconButton,
//     Box
// } from "@mui/material";
// import { CheckCircleOutline, ErrorOutline, Close } from "@mui/icons-material";
// import { Carousel } from "react-responsive-carousel";

// import Header from "../components/Header";
// import "../styles/ProjectDetails.css";

// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faArrowLeft, faBook } from "@fortawesome/free-solid-svg-icons";
// import axios from "axios";

// const MAX_LENGTH = 500;

// const ProjectDetails = () => {
//     const { projectId } = useParams();
//     const navigate = useNavigate();
//     const location = useLocation();

//     const [project, setProject] = useState(location.state?.project);
//     const [isRunning, setIsRunning] = useState(false);
//     const [expanded, setExpanded] = useState(false);

//     const projectTabRef = useRef(null);

//     const [modalOpen, setModalOpen] = useState(false);
//     const [modalMessage, setModalMessage] = useState("");
//     const [isSuccess, setIsSuccess] = useState(false);

//     useEffect(() => {
//         if (!project) {
//             axios.get(`http://localhost:8020/api/project/details/${projectId}`)
//                 .then((res) => {
//                     setProject(res.data);
//                     setIsRunning(res.data.status === "running");
//                 })
//                 .catch(console.error);
//         }
//     }, [project, projectId]);

//     const showModal = (msg, success) => {
//         setModalMessage(msg);
//         setIsSuccess(success);
//         setModalOpen(true);
//     };

//     const closeModal = () => setModalOpen(false);

//     const startProject = async () => {
//         try {
//             const res = await axios.post(`http://localhost:8020/api/project/run/${projectId}`);
//             if (res.data.url) {
//                 const tab = window.open(res.data.url, "_blank");
//                 projectTabRef.current = tab;
//             }
//             setIsRunning(true);
//             showModal("Project started successfully!", true);
//         } catch {
//             showModal("Failed to start project", false);
//         }
//     };

//     const stopProject = async () => {
//         try {
//             await axios.post(`http://localhost:8020/api/project/stop/${projectId}`);
//             if (projectTabRef.current) projectTabRef.current.close();
//             setIsRunning(false);
//             showModal("Project stopped successfully!", true);
//         } catch {
//             showModal("Failed to stop project", false);
//         }
//     };

//     if (!project) return <Container><Typography>Project Not Found</Typography></Container>;

//     const longDesc = project.longDescription || "";
//     const shortDesc = longDesc.substring(0, MAX_LENGTH);
//     const needsMore = longDesc.length > MAX_LENGTH;

//     return (
//         <div className="appContainer1">
//             <Header />

//             {/* BACK */}
//             <FontAwesomeIcon
//                 className="left-arrow"
//                 icon={faArrowLeft}
//                 size="2xl"
//                 onClick={() => navigate("/")}
//             />
//             <span className="previous_screen" onClick={() => navigate("/")}>
//                 DASHBOARD
//             </span>

//             <div className="box"></div>

//             {/* TITLE */}
//             <div>
//                 <div className="icon-box">
//                     <FontAwesomeIcon icon={faBook} size="2xl" color="white" />
//                 </div>
//                 <span className="project_title">{project.projectTitle}</span>
//             </div>

//             {/* MODAL */}
//             <Dialog open={modalOpen} onClose={closeModal}>
//                 <DialogTitle>
//                     <Box display="flex">
//                         {isSuccess ? <CheckCircleOutline color="success" /> : <ErrorOutline color="error" />}
//                         <Typography sx={{ marginLeft: 1 }}>
//                             {isSuccess ? "Success" : "Error"}
//                         </Typography>
//                         <IconButton sx={{ marginLeft: "auto" }} onClick={closeModal}>
//                             <Close />
//                         </IconButton>
//                     </Box>
//                 </DialogTitle>
//                 <DialogContent>
//                     <Typography>{modalMessage}</Typography>
//                 </DialogContent>
//             </Dialog>

//             {/* CAROUSEL */}
//             <div className="carousel">
//                 <Carousel showThumbs={false} showStatus={false} infiniteLoop={true}>
//                     {project.images.map((img, idx) => (
//                         <div key={idx}>
//                             <img src={img} className="carousel-image" alt="project" />
//                         </div>
//                     ))}
//                 </Carousel>
//             </div>

//             {/* LEARN + BUTTONS */}
//             <div className="container">
//                 <p className="description"> ABOUT PROJECT</p>

//                 {!isRunning && (
//                     <button className="run_btn" onClick={startProject}>Start Project</button>
//                 )}

//                 {isRunning && (
//                     <>
//                         <button className="run_btn" disabled>Running</button>
//                         <button className="run_btn stop_btn" onClick={stopProject}>Stop</button>
//                     </>
//                 )}
//             </div>

//             {/* DESCRIPTION */}
//             <div className="desc_container">
//                 {needsMore ? (
//                     <>
//                         {expanded ? longDesc : shortDesc + "… "}
//                         {!expanded && (
//                             <span
//                                 style={{ color: "#DF4807", fontWeight: "bold", cursor: "pointer" }}
//                                 onClick={() => setExpanded(true)}
//                             >
//                                 More
//                             </span>
//                         )}
//                     </>
//                 ) : longDesc}
//             </div>

//             {/* TECH */}
//             <div className="tech_container">
//                 <p className="tech_title">Technology Used</p>
//                 <div className="tech_details">
//                     {project.technologiesUsed.map((tech, index) => (
//                         <div className="tech_item" key={index}>{tech}</div>
//                     ))}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ProjectDetails;

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
    Container,
    Typography,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Box
} from "@mui/material";
import { CheckCircleOutline, ErrorOutline, Close } from "@mui/icons-material";
import { Carousel } from "react-responsive-carousel";

import Header from "../components/Header";
import "../styles/ProjectDetails.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBook } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const MAX_LENGTH = 500;

const ProjectDetails = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [project, setProject] = useState(location.state?.project);
    const [isRunning, setIsRunning] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const [services, setServices] = useState([]);
    const [loadingStatus, setLoadingStatus] = useState(true);

    const projectTabRef = useRef(null);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    // Fetch base project
    useEffect(() => {
        if (!project) {
            axios.get(`http://localhost:8020/api/project/details/${projectId}`)
                .then((res) => {
                    setProject(res.data);
                    setIsRunning(res.data.status === "running");
                })
                .catch(console.error);
        }
    }, [project, projectId]);

    // Fetch running container info
    useEffect(() => {
        axios.get(`http://localhost:8020/api/project/status/${projectId}`)
            .then((res) => {
                setServices(res.data.services);
                setLoadingStatus(false);
            })
            .catch(() => setLoadingStatus(false));
    }, [projectId, isRunning]);

    const showModal = (msg, success) => {
        setModalMessage(msg);
        setIsSuccess(success);
        setModalOpen(true);
    };

    const closeModal = () => setModalOpen(false);

    const startProject = async () => {
        try {
            const res = await axios.post(`http://localhost:8020/api/project/run/${projectId}`);

            // Only open tab for Dockerfile / direct URL projects
            if (res.data.url && res.data.url !== "docker-compose") {
                const tab = window.open(res.data.url, "_blank");
                projectTabRef.current = tab;
            }

            setIsRunning(true);
            showModal("Project started successfully!", true);
        } catch {
            showModal("Failed to start project", false);
        }
    };

    const stopProject = async () => {
        try {
            await axios.post(`http://localhost:8020/api/project/stop/${projectId}`);

            if (projectTabRef.current) projectTabRef.current.close();

            setIsRunning(false);
            showModal("Project stopped successfully!", true);
        } catch {
            showModal("Failed to stop project", false);
        }
    };

    if (!project)
        return (
            <Container>
                <Typography>Project Not Found</Typography>
            </Container>
        );

    const longDesc = project.longDescription || "";
    const shortDesc = longDesc.substring(0, MAX_LENGTH);
    const needsMore = longDesc.length > MAX_LENGTH;

    return (
        <div className="appContainer1">
            <Header />

            {/* BACK BUTTON */}
            <FontAwesomeIcon
                className="left-arrow"
                icon={faArrowLeft}
                size="2xl"
                onClick={() => navigate("/")}
            />
            <span className="previous_screen" onClick={() => navigate("/")}>
                DASHBOARD
            </span>

            <div className="box"></div>

            {/* TITLE */}
            <div>
                <div className="icon-box">
                    <FontAwesomeIcon icon={faBook} size="2xl" color="white" />
                </div>
                <span className="project_title">{project.projectTitle}</span>
            </div>

            {/* MODAL */}
            <Dialog open={modalOpen} onClose={closeModal}>
                <DialogTitle>
                    <Box display="flex">
                        {isSuccess ? (
                            <CheckCircleOutline color="success" />
                        ) : (
                            <ErrorOutline color="error" />
                        )}
                        <Typography sx={{ marginLeft: 1 }}>
                            {isSuccess ? "Success" : "Error"}
                        </Typography>
                        <IconButton sx={{ marginLeft: "auto" }} onClick={closeModal}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography>{modalMessage}</Typography>
                </DialogContent>
            </Dialog>

            {/* CAROUSEL */}
            <div className="carousel">
                <Carousel showThumbs={false} showStatus={false} infiniteLoop>
                    {project.images.map((img, idx) => (
                        <div key={idx}>
                            <img src={img} className="carousel-image" alt="project" />
                        </div>
                    ))}
                </Carousel>
            </div>

            {/* RUN / STOP + ABOUT */}
            <div className="container">
                <p className="description"> ABOUT PROJECT</p>

                {!isRunning && (
                    <button className="run_btn" onClick={startProject}>
                        Start Project
                    </button>
                )}

                {isRunning && (
                    <>
                        <button className="run_btn" disabled>
                            Running
                        </button>
                        <button className="run_btn stop_btn" onClick={stopProject}>
                            Stop
                        </button>
                    </>
                )}
            </div>

            {/* =========================== */}
            {/*   DEPLOYMENT DETAILS BOX    */}
            {/* =========================== */}
            <div className="project-details-box">
                <p className="details-title">Deployment Details</p>

                {/* Dockerfile Deployment */}
                {project.hostPort && (
                    <div className="detail-row">
                        <span>Frontend URL:</span>
                        <a
                            href={project.url}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {project.url}
                        </a>
                    </div>
                )}

                {/* docker-compose frontend detection */}
                {project.frontendPort && (
                    <>
                        <div className="detail-row">
                            <span>Frontend Service:</span> {project.frontendService}
                        </div>
                        <div className="detail-row">
                            <span>Frontend URL:</span>
                            <a
                                href={`http://localhost:${project.frontendPort}`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                http://localhost:{project.frontendPort}
                            </a>
                        </div>
                    </>
                )}

                {/* Internal + Host Port */}
                {project.internalPort && project.hostPort && (
                    <div className="detail-row">
                        <span>Internal Port:</span> {project.internalPort}
                        <span> → Mapped To:</span> {project.hostPort}
                    </div>
                )}
            </div>

            {/* =========================== */}
            {/*   RUNNING CONTAINERS TABLE  */}
            {/* =========================== */}
            <div className="services-container">
                <p className="details-title">Running Containers</p>

                {loadingStatus && <p>Loading containers…</p>}

                {!loadingStatus && services.length === 0 && (
                    <p>No running containers.</p>
                )}

                {services.map((s, idx) => (
                    <div key={idx} className="service-row">
                        <div><b>{s.name}</b></div>
                        <div>Image: {s.image}</div>
                        <div>Ports: {s.ports}</div>
                    </div>
                ))}
            </div>

            {/* DESCRIPTION */}
            <div className="desc_container">
                {needsMore ? (
                    <>
                        {expanded ? longDesc : shortDesc + "… "}
                        {!expanded && (
                            <span
                                style={{
                                    color: "#DF4807",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                }}
                                onClick={() => setExpanded(true)}
                            >
                                More
                            </span>
                        )}
                    </>
                ) : (
                    longDesc
                )}
            </div>

            {/* TECHNOLOGIES */}
            <div className="tech_container">
                <p className="tech_title">Technology Used</p>
                <div className="tech_details">
                    {project.technologiesUsed.map((tech, index) => (
                        <div className="tech_item" key={index}>
                            {tech}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;
