import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Grid, Typography } from '@mui/material';
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from 'react-responsive-carousel';
import Header from '../components/Header';
import '../styles/ProjectDetails.css';
import { BsArrowLeftCircleFill, BsArrowRightCircleFill } from "react-icons/bs";

const ProjectDetails = ({ projectData }) => {
    const [slide, setSlide] = useState(0);
    console.log("slide--------->",slide);
    // Get the project ID from the URL params
    const { projectId } = useParams();

    // Find the project details based on the project ID
    const project = projectData.find((project) => project.id === projectId);

    // If project is not found, display a message
    if (!project) {
        return (
            <Container>
                <Typography variant="h4">Project Not Found</Typography>
            </Container>
        );
    }

   const nextSlide = () => {
    console.log("next slide")
        setSlide((prevSlide) => (prevSlide + 1) % project.images.length);
    };

    const prevSlide = () => {
        console.log("prev slide")
        setSlide((prevSlide) => (prevSlide - 1 + project.images.length) % project.images.length);
    };
    return (
        <div>
            <Header />
            <div className='appContainer1'>
                <Typography variant="h4" sx={{ fontWeight: 'bold', marginLeft: '35px', marginTop: '10px' }}>{project.projectTitle}</Typography>
                {/* Display multiple project images */}
           
                <div className='carousel'>
                    <BsArrowLeftCircleFill onClick={prevSlide} className="arrow arrow-left" />
                    {project.images.map((imageSrc, idx) => (
                        <img
                            src={imageSrc}
                            alt={`Project Image ${idx + 1}`}
                            key={idx}
                            className={slide === idx ? "slide" : "slide slide-hidden"}
                        />
                    ))}
                    <BsArrowRightCircleFill
                        onClick={nextSlide}
                        className="arrow arrow-right"
                    />
                    <span className="indicators">
                        {project.images.map((_, idx) => (
                            <button
                                key={idx}
                                className={slide === idx ? "indicator" : "indicator indicator-inactive"}
                                onClick={() => setSlide(idx)}
                            ></button>
                        ))}
                    </span>
                   
                </div>
                <div className='button-container'>
                    <button className='button'>Run Project</button>
                </div>
                 <Typography variant="body1" sx={{ marginLeft: '35px', fontWeight:'bold',marginTop:'15px'}} gutterBottom>{project.longDescription}</Typography>
                 <Typography variant="subtitle1" sx={{ marginLeft: '35px', fontWeight:'bold',marginTop:'15px'}} >Team: {project.teamName}</Typography>
      <Typography variant="subtitle1" sx={{ marginLeft: '35px', fontWeight:'bold',marginTop:'15px'}} >Status: {project.status}</Typography>
      <Typography variant="subtitle1" sx={{ marginLeft: '35px', fontWeight:'bold',marginTop:'15px'}} >Labels: {project.labels.join(',')}</Typography>
      <Typography variant="subtitle1" sx={{ marginLeft: '35px', fontWeight:'bold',marginTop:'15px'}} >Technologies Used: {project.technologiesUsed.join(', ')}</Typography>
      <Typography variant="subtitle1" sx={{ marginLeft: '35px', fontWeight:'bold',marginTop:'15px'}} >GitHub URL: <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">{project.githubUrl}</a></Typography>
      <Typography variant="subtitle1" sx={{ marginLeft: '35px', fontWeight:'bold',marginTop:'15px'}} >Docker Image URL: <a href={project.dockerImageUrl} target="_blank" rel="noopener noreferrer">{project.dockerImageUrl}</a></Typography>
            </div>
        </div>
    );
};

export default ProjectDetails;


//project.images.map