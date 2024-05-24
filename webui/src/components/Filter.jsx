// src/components/Filter.js
import React, { useState } from 'react';
import { Menu, MenuItem, IconButton, Button, Box } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';

const Filter = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [subMenuAnchorEl, setSubMenuAnchorEl] = useState({});
  const [showFilters, setShowFilters] = useState(false); // State to manage visibility of filter buttons

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
            <MenuItem onClick={handleMenuClose}>Bachelor's Degree</MenuItem>
            <MenuItem onClick={handleMenuClose}>Master's Degree</MenuItem>
          </Menu>

          <Button onClick={(e) => handleMenuClick(e, 'programme')}>Study Programme</Button>
          <Menu
            anchorEl={subMenuAnchorEl.programme}
            open={Boolean(subMenuAnchorEl.programme)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>Programme 1</MenuItem>
            <MenuItem onClick={handleMenuClose}>Programme 2</MenuItem>
            <MenuItem onClick={handleMenuClose}>Programme 3</MenuItem>
            <MenuItem onClick={handleMenuClose}>Programme 4</MenuItem>
            <MenuItem onClick={handleMenuClose}>Programme 5</MenuItem>
          </Menu>

          <Button onClick={(e) => handleMenuClick(e, 'year')}>Year of Batch</Button>
          <Menu
            anchorEl={subMenuAnchorEl.year}
            open={Boolean(subMenuAnchorEl.year)}
            onClose={handleMenuClose}
          >
            {[...Array(15).keys()].map(year => (
              <MenuItem key={year} onClick={handleMenuClose}>{2024 - year}</MenuItem>
            ))}
          </Menu>

          <Button onClick={(e) => handleMenuClick(e, 'faculty')}>Faculty</Button>
          <Menu
            anchorEl={subMenuAnchorEl.faculty}
            open={Boolean(subMenuAnchorEl.faculty)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>Faculty 1</MenuItem>
            <MenuItem onClick={handleMenuClose}>Faculty 2</MenuItem>
            <MenuItem onClick={handleMenuClose}>Faculty 3</MenuItem>
            <MenuItem onClick={handleMenuClose}>Faculty 4</MenuItem>
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
