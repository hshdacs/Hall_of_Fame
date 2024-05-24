import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ProjectCards from '../components/Cards';
import { Container } from '@mui/material';
import SearchBar from '../components/Search';
import appLogo from '../assets/card-image 1.png';
import '../styles/Dashboard.css';
import Filter from '../components/Filter'; // Import the Filter component

// Hardcoded project data
const projectData = [
    {
        "id": "PROJECT-1234",
        "projectTitle": "Next Generation AI Development",
        "createdDate": "2024-05-16T10:30:00Z",
        "longDescription": "This project aims to develop the next generation of AI models that are more efficient and accurate. The project includes various stages such as data collection, model training, and deployment.",
        "images": [
            appLogo,
            appLogo,
            appLogo
        ],
        "teamName": "AI Development Team",
        "status": "in progress",
        "labels": ["AI", "development", "machine learning"],
        "priority": "high",
        "technologiesUsed": ["Python", "TensorFlow", "Keras"],
        "githubUrl": "https://github.com/example/next-gen-ai",
        "dockerImageUrl": "https://hub.docker.com/r/example/next-gen-ai"
      },
      {
        "id": "PROJECT-5678",
        "projectTitle": "Web Application Redesign",
        "createdDate": "2024-04-10T08:00:00Z",
        "longDescription": "The goal of this project is to redesign the company's web application to improve user experience and performance. The redesign will focus on updating the UI/UX, enhancing the backend, and adding new features.",
        "images": [
            appLogo,
            appLogo,
            appLogo
        ],
        "teamName": "Web Dev Team",
        "status": "in progress",
        "labels": ["web", "UI/UX", "frontend", "backend"],
        "priority": "medium",
        "technologiesUsed": ["React", "Node.js", "Express"],
        "githubUrl": "https://github.com/example/web-app-redesign",
        "dockerImageUrl": "https://hub.docker.com/r/example/web-app-redesign"
      },
      {
        "id": "PROJECT-1238",
        "projectTitle": "Next Generation AI Development",
        "createdDate": "2024-05-16T10:30:00Z",
        "longDescription": "This project aims to develop the next generation of AI models that are more efficient and accurate. The project includes various stages such as data collection, model training, and deployment.",
        "images": [
            appLogo,
            appLogo,
            appLogo
        ],
        "teamName": "AI Development Team",
        "status": "in progress",
        "labels": ["AI", "development", "machine learning"],
        "priority": "high",
        "technologiesUsed": ["Python", "TensorFlow", "Keras"],
        "githubUrl": "https://github.com/example/next-gen-ai",
        "dockerImageUrl": "https://hub.docker.com/r/example/next-gen-ai"
      },
      {
        "id": "PROJECT-1237",
        "projectTitle": "Next Generation AI Development",
        "createdDate": "2024-05-16T10:30:00Z",
        "longDescription": "This project aims to develop the next generation of AI models that are more efficient and accurate. The project includes various stages such as data collection, model training, and deployment.",
        "images": [
            appLogo,
            appLogo,
            appLogo
        ],
        "teamName": "AI Development Team",
        "status": "in progress",
        "labels": ["AI", "development", "machine learning"],
        "priority": "high",
        "technologiesUsed": ["Python", "TensorFlow", "Keras"],
        "githubUrl": "https://github.com/example/next-gen-ai",
        "dockerImageUrl": "https://hub.docker.com/r/example/next-gen-ai"
      },
];

const Dashboard = () => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };
    const handleSearchExecute = (e) => {
        e.preventDefault();
    };

    const [currentPage, setCurrentPage] = React.useState(1);
    const navigate = useNavigate(); // Initialize useNavigate hook

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    // Filter projects based on search term
    const filteredProjects = projectData.filter((project) =>
        project.projectTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle card click to navigate to project details screen
    const handleCardClick = (projectId) => {
        navigate(`/project/${projectId}`);
    };

    return (
        <div>
            <Header />
            <div>
                <h1 className='header-text'>Explore All Projects Here!</h1>
              
                    <Container className='appContainer'>
                        <div className='filter'>
                        <SearchBar
                            className='search-button'
                            searchTerm={searchTerm}
                            onSearchChange={handleSearchChange}
                            onSearchExecute={handleSearchExecute}
                        />
                         <Filter />
                    </div>
                        <ProjectCards
                            projects={filteredProjects}
                            page={currentPage}
                            onPageChange={handlePageChange}
                            onCardClick={handleCardClick}
                        />
                    </Container>
            </div>
        </div>
    );
};

export default Dashboard;
