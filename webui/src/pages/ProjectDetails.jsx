import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography } from '@mui/material';
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from 'react-responsive-carousel';
import Header from '../components/Header';
import '../styles/ProjectDetails.css';
import { BsArrowLeftCircleFill, BsArrowRightCircleFill } from "react-icons/bs";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBook } from '@fortawesome/free-solid-svg-icons';
import appLogo from '../assets/card-image 1.png';
import ProjectDescription from '../components/ProjectDescription';

const ProjectDetails = ({ projectData }) => {
    const [slide, setSlide] = useState(0);
    const { projectId } = useParams();

    const project = projectData.find((project) => project.id === projectId);

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

    return (
        <div>
            <Header />
            <FontAwesomeIcon className='left-arrow' icon={faArrowLeft} size="2xl" />
            <span className='previous_screen'>DASHBOARD</span>
            <div className='box'></div>
                <div>
                    <div className="icon-box">
                        <FontAwesomeIcon className='icon-box"' icon={faBook} size="2xl" style={{ color: 'white' }} />

                    </div>
                    <span className='project_title'>{project.projectTitle}</span>
                </div>
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
                <p className="description">YOU    WILL    LEARN     ABOUT    PROJECT</p>
                <span><button className="run_btn">Run Project</button></span>
            </div>
            <div className="desc_container">
            <ProjectDescription description={project.longDescription} />
        </div>
        <div className="tech_container">
           <p className='tech_title'>Technology Used</p>
        </div>
        </div>
    );
};

export default ProjectDetails;
