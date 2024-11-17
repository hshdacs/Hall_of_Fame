import React, { useState, useEffect } from 'react';
import { Container } from '@mui/material';
import SearchBar from './SearchBar.jsx'; 
import JobCards from './JobCards.jsx'; 

const JobSearch = () => {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchJobs = async () => {
      const response = await fetch(`https://www.arbeitnow.com/api/job-board-api`);
      const data = await response.json();
      setJobs(data.data);
    };

    fetchJobs();
  }, []);
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSearchExecute = (e) => {
    e.preventDefault();
    setCurrentPage(1); 
  };


  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onSearchExecute={handleSearchExecute}
      />
      <JobCards
        jobs={filteredJobs}
        page={currentPage}
        onPageChange={handlePageChange}
      />
    </Container>
  );
};

export default JobSearch;
