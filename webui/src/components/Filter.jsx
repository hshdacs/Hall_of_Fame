import React, { useState, useEffect } from 'react';
import { Menu, MenuItem, IconButton, Button, Box } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import axios from 'axios';

const Filter = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [subMenuAnchorEl, setSubMenuAnchorEl] = useState({});
  const [showFilters, setShowFilters] = useState(false); // State to manage visibility of filter buttons
  const [filterOptions, setFilterOptions] = useState({
    schools: [],
    studyProgrammes: [],
    yearsOfBatch: [],
    faculties: []
  });

  // State to track selected filter values
  const [selectedSchool, setSelectedSchool] = useState('School');
  const [selectedProgramme, setSelectedProgramme] = useState('Study Programme');
  const [selectedYear, setSelectedYear] = useState('Year of Batch');
  const [selectedFaculty, setSelectedFaculty] = useState('Faculty');

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await axios.get('http://localhost:8020/api/project/filter-options');
        setFilterOptions(response.data);
      } catch (error) {
        console.error('Error fetching filter options', error);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleMenuClick = (event, menu) => {
    setAnchorEl(event.currentTarget);
    setSubMenuAnchorEl({ ...subMenuAnchorEl, [menu]: event.currentTarget });
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSubMenuAnchorEl({});
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Handlers for updating the selected values
  const handleSelectSchool = (school) => {
    setSelectedSchool(school);
    handleMenuClose();
  };

  const handleSelectProgramme = (programme) => {
    setSelectedProgramme(programme);
    handleMenuClose();
  };

  const handleSelectYear = (year) => {
    setSelectedYear(year);
    handleMenuClose();
  };

  const handleSelectFaculty = (faculty) => {
    setSelectedFaculty(faculty);
    handleMenuClose();
  };

  return (
    <Box display="flex" alignItems="center" p={2} position="relative">
      {showFilters && (
        <Box display="flex" position="absolute" right="50px">
          <Button onClick={(e) => handleMenuClick(e, 'school')}>{selectedSchool}</Button>
          <Menu
            anchorEl={subMenuAnchorEl.school}
            open={Boolean(subMenuAnchorEl.school)}
            onClose={handleMenuClose}
          >
            {filterOptions.schools.map((school, index) => (
              <MenuItem key={index} onClick={() => handleSelectSchool(school)}>
                {school}
              </MenuItem>
            ))}
          </Menu>

          <Button onClick={(e) => handleMenuClick(e, 'programme')}>{selectedProgramme}</Button>
          <Menu
            anchorEl={subMenuAnchorEl.programme}
            open={Boolean(subMenuAnchorEl.programme)}
            onClose={handleMenuClose}
          >
            {filterOptions.studyProgrammes.map((programme, index) => (
              <MenuItem key={index} onClick={() => handleSelectProgramme(programme)}>
                {programme}
              </MenuItem>
            ))}
          </Menu>

          <Button onClick={(e) => handleMenuClick(e, 'year')}>{selectedYear}</Button>
          <Menu
            anchorEl={subMenuAnchorEl.year}
            open={Boolean(subMenuAnchorEl.year)}
            onClose={handleMenuClose}
          >
            {filterOptions.yearsOfBatch.map((year, index) => (
              <MenuItem key={index} onClick={() => handleSelectYear(year)}>
                {year}
              </MenuItem>
            ))}
          </Menu>

          <Button onClick={(e) => handleMenuClick(e, 'faculty')}>{selectedFaculty}</Button>
          <Menu
            anchorEl={subMenuAnchorEl.faculty}
            open={Boolean(subMenuAnchorEl.faculty)}
            onClose={handleMenuClose}
          >
            {filterOptions.faculties.map((faculty, index) => (
              <MenuItem key={index} onClick={() => handleSelectFaculty(faculty)}>
                {faculty}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      )}
      <IconButton aria-label="filter" onClick={toggleFilters}>
        <FilterListIcon />
      </IconButton>
    </Box>
  );
};

export default Filter;
