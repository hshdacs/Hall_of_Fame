import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import ProjectCards from '../components/Cards';
import { Container } from '@mui/material';
import SearchBar from '../components/Search';
import '../styles/Dashboard.css';
import Filter from '../components/Filter'; // Import the Filter component

const Dashboard = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [projects, setProjects] = useState([]);
    const navigate = useNavigate(); // Initialize useNavigate hook

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSearchExecute = (e) => {
        e.preventDefault();
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    // Fetch projects from the API
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await axios.get('http://localhost:8020/api/project/projects');
                setProjects(response.data);
            } catch (error) {
                console.error('Error fetching project data', error);
            }
        };

        fetchProjects();
    }, []);

    // Filter projects based on search term
    const filteredProjects = projects.filter((project) =>
        project.projectTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        onCardClick={(projectId) => navigate(`/project/${projectId}`)}
                    />
                </Container>
            </div>
        </div>
    );
};

export default Dashboard;
