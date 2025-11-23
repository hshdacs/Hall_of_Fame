import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Typography, Dialog, DialogContent, DialogTitle, IconButton, Box } from '@mui/material';
import { CheckCircleOutline, ErrorOutline, Close } from '@mui/icons-material';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from 'react-responsive-carousel';
import Header from '../components/Header';
import '../styles/ProjectDetails.css';
import { BsArrowLeftCircleFill, BsArrowRightCircleFill } from "react-icons/bs";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBook } from '@fortawesome/free-solid-svg-icons';
import reactIcon from '../assets/react.png';
import nodeIcon from '../assets/node.png';
import mongoIcon from '../assets/mongo.png';
import ProjectDescription from '../components/ProjectDescription';
import axios from 'axios';

const ProjectDetails = () => {
    const [slide, setSlide] = useState(0);
    const { projectId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [project, setProject] = useState(location.state?.project);
    const [isRunning, setIsRunning] = useState(false); // Track if the project is running
    const [timeoutId, setTimeoutId] = useState(null);
    const projectTabRef = useRef(null); // Ref to store the opened project tab

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
useEffect(() => {
  const fetchProject = async () => {
    try {
      const response = await axios.get(`http://localhost:8020/api/project/details/${projectId}`);
      setProject(response.data);
      setIsRunning(response.data.status === "running");
    } catch (error) {
      console.error("Error fetching project data", error);
    }
  };

  if (!project) fetchProject();
}, [projectId, project]);

    const showModal = (message, success) => {
        setModalMessage(message);
        setIsSuccess(success);
        setModalOpen(true);
    };

    if (!project) {
        return (
            <Container>
                <Typography variant="h4">Project Not Found</Typography>
            </Container>
        );
    }

    const nextSlide = () => {
        setSlide((prevSlide) => (prevSlide + 1) % project.images.length);
    };

    const prevSlide = () => {
        setSlide((prevSlide) => (prevSlide - 1 + project.images.length) % project.images.length);
    };

    const setCurrentSlide = (index) => {
        setSlide(index);
    };

    const handleBackToDashboard = () => {
        navigate('/'); // Assuming '/' is the route for the dashboard
    };

const handleRunProject = async (projectId) => {
  try {
    const response = await fetch(`http://localhost:8020/api/project/run/${projectId}`, {
      method: "POST",
    });

    const data = await response.json();

    if (response.ok) {
      const projectTab = window.open(data.url, "_blank");
      showModal("Project started.", true);
      setIsRunning(true);
      projectTabRef.current = projectTab;
    } else {
      showModal(data.error, false);
    }
  } catch (error) {
    console.error("Error:", error);
    showModal("Failed to start project", false);
  }
};

    const stopProject = async (projectId) => {
  try {
    const response = await fetch(`http://localhost:8020/api/project/stop/${projectId}`, {
      method: "POST",
    });

    const data = await response.json();

    if (response.ok) {
      showModal("Project stopped successfully.", true);
      setIsRunning(false);
    } else {
      showModal(data.error, false);
    }

  } catch (error) {
    console.error("Error stopping project:", error);
    showModal("Error stopping the project", false);
  }
};

const handleCloseModal = () => {
    setModalOpen(false);
};

    return (
        <div>
            <Header />
            <FontAwesomeIcon className='left-arrow' icon={faArrowLeft} size="2xl" onClick={handleBackToDashboard} />
            <span className='previous_screen' onClick={handleBackToDashboard}>DASHBOARD</span>
            <div className='box'></div>
            <div>
                <div className="icon-box">
                    <FontAwesomeIcon className='icon-box"' icon={faBook} size="2xl" style={{ color: 'white' }} />
                </div>
                <span className='project_title'>{project.projectTitle}</span>
            </div>
            <Dialog open={modalOpen} onClose={handleCloseModal}>
                <DialogTitle>
                    <Box display="flex" alignItems="center">
                        {isSuccess ? (
                            <CheckCircleOutline color="success" sx={{ mr: 1 }} />
                        ) : (
                            <ErrorOutline color="error" sx={{ mr: 1 }} />
                        )}
                        {isSuccess ? 'Success' : 'Error'}
                        <IconButton onClick={handleCloseModal} sx={{ ml: 'auto' }}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography>{modalMessage}</Typography>
                </DialogContent>
            </Dialog>
            <div className="carousel">
                <BsArrowLeftCircleFill className="arrow arrow-left" onClick={prevSlide} />
                <Carousel selectedItem={slide} showArrows={false} showIndicators={false} showStatus={false} showThumbs={false}>
                    {project.images.map((image, index) => (
                        <div key={index} className={`slide ${slide === index ? '' : 'slide-hidden'}`}>
                            <img src={image} alt={`Project image ${index + 1}`} className="carousel-image" />
                        </div>
                    ))}
                </Carousel>
                <BsArrowRightCircleFill className="arrow arrow-right" onClick={nextSlide} />
                <div className="indicators">
                    {project.images.map((_, index) => (
                        <button
                            key={index}
                            className={`indicator ${slide === index ? 'indicator-active' : 'indicator-inactive'}`}
                            onClick={() => setCurrentSlide(index)}
                        />
                    ))}
                </div>
            </div>
            <div className="container">
                <p className="description">YOU WILL LEARN ABOUT PROJECT</p>
                <span>
                    <button 
                        className="run_btn" 
                        onClick={() => handleRunProject(projectId)} 
                        disabled={isRunning} // Disable the button if the project is running
                    >
                        {isRunning ? "Running" : "Run Project"} {/* Change button label */}
                    </button>
                </span>
            </div>
            <div className="desc_container">
                <ProjectDescription description={project.longDescription} />
            </div>
            <div className="tech_container">
                <p className='tech_title'>Technology Used</p>
                <div className="tech_details">
                    {project.technologiesUsed.includes("React") && (
                        <div className="tech_item">
                            <img src={reactIcon} alt="ReactJS Icon" className="tech_sub_icon" />
                            <Typography variant="h6" sx={{ 'fontWeight': 'bold' }}>ReactJs</Typography>
                        </div>
                    )}
                    {project.technologiesUsed.includes("Node.js") && (
                        <div className="tech_item">
                            <img src={nodeIcon} alt="NodeJS Icon" className="tech_sub_icon" />
                            <Typography variant="h6" sx={{ 'fontWeight': 'bold' }}>NodeJS</Typography>
                        </div>
                    )}
                    {project.technologiesUsed.includes("MongoDB") && (
                        <div className="tech_item">
                            <img src={mongoIcon} alt="MongoDB Icon" className="tech_sub_icon" />
                            <Typography variant="h6" sx={{ 'fontWeight': 'bold' }}>MongoDB</Typography>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;
