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

  return (
    <Box display="flex" alignItems="center" p={2} position="relative">
      {showFilters && (
        <Box display="flex" position="absolute" right="50px">
          <Button onClick={(e) => handleMenuClick(e, 'school')}>School</Button>
          <Menu
            anchorEl={subMenuAnchorEl.school}
            open={Boolean(subMenuAnchorEl.school)}
            onClose={handleMenuClose}
          >
            {filterOptions.schools.map((school, index) => (
              <MenuItem key={index} onClick={handleMenuClose}>{school}</MenuItem>
            ))}
          </Menu>

          <Button onClick={(e) => handleMenuClick(e, 'programme')}>Study Programme</Button>
          <Menu
            anchorEl={subMenuAnchorEl.programme}
            open={Boolean(subMenuAnchorEl.programme)}
            onClose={handleMenuClose}
          >
            {filterOptions.studyProgrammes.map((programme, index) => (
              <MenuItem key={index} onClick={handleMenuClose}>{programme}</MenuItem>
            ))}
          </Menu>

          <Button onClick={(e) => handleMenuClick(e, 'year')}>Year of Batch</Button>
          <Menu
            anchorEl={subMenuAnchorEl.year}
            open={Boolean(subMenuAnchorEl.year)}
            onClose={handleMenuClose}
          >
            {filterOptions.yearsOfBatch.map((year, index) => (
              <MenuItem key={index} onClick={handleMenuClose}>{year}</MenuItem>
            ))}
          </Menu>

          <Button onClick={(e) => handleMenuClick(e, 'faculty')}>Faculty</Button>
          <Menu
            anchorEl={subMenuAnchorEl.faculty}
            open={Boolean(subMenuAnchorEl.faculty)}
            onClose={handleMenuClose}
          >
            {filterOptions.faculties.map((faculty, index) => (
              <MenuItem key={index} onClick={handleMenuClose}>{faculty}</MenuItem>
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
