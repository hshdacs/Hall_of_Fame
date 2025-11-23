import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import ProjectCards from '../components/Cards';
import { Container } from '@mui/material';
import SearchBar from '../components/Search';
import '../styles/Dashboard.css';
import Filter from '../components/Filter';

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('http://localhost:8020/api/project/all');
        setProjects(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching project data", error);
        setProjects([]);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((p) =>
    p.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <Header />
      <h1 className='header-text'>Explore All Projects Here!</h1>

      <Container className='appContainer'>
        <div className='filter'>
          <SearchBar searchTerm={searchTerm} onSearchChange={(e) => setSearchTerm(e.target.value)} />
          <Filter />
        </div>

        <ProjectCards
          projects={filteredProjects}
          page={currentPage}
          onPageChange={setCurrentPage}
          onCardClick={(projectId) => navigate(`/project/${projectId}`)}
        />
      </Container>
    </div>
  );
};

export default Dashboard;
