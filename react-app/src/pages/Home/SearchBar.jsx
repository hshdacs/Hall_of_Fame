import React from 'react';
import { Paper, InputBase, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import '../../styles/Home/SearchBar.css';

const SearchBar = ({ searchTerm, onSearchChange, onSearchExecute }) => {
  return (
    <div className="search-container">
      <Paper
        component="form"
        className="search-bar"
        elevation={3}
        onSubmit={onSearchExecute}
      >
        <InputBase
          className="search-input"
          placeholder="Search here"
          inputProps={{ 'aria-label': 'search jobs' }}
          onChange={onSearchChange}
          value={searchTerm}
        />
        <IconButton type="submit" className="search-icon-button" aria-label="search">
          <SearchIcon />
        </IconButton>
      </Paper>
    </div>
  );
};

export default SearchBar;
