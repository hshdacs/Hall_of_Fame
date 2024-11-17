import React from 'react';
import { Grid, Card, CardActionArea, CardContent, Typography, Box } from '@mui/material';
import '../../styles/Home/JobCards.css';

const JobCards = ({ jobs, page, onPageChange }) => {
  const itemsPerPage = 12;


  const startIndex = (page - 1) * itemsPerPage;
  const currentJobs = jobs.slice(startIndex, startIndex + itemsPerPage);

  const totalPages = Math.ceil(jobs.length / itemsPerPage);

  return (
    <>
      <Grid container spacing={3}>
        {currentJobs.map((job, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card className="job-card">
              <CardActionArea href={job.url} target="_blank" className="card-action-area">
                <CardContent>
                  <Typography gutterBottom variant="h5" component="h2">
                    {job.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" component="p">
                    {job.company_name}
                  </Typography>
                  <Typography variant="body2" component="p">
                    Location: {job.location}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" my={4}>
          {[...Array(totalPages).keys()].map((num) => (
            <button key={num} onClick={() => onPageChange(num + 1)} className={`pagination-button ${page === num + 1 ? 'active' : ''}`}>
              {num + 1}
            </button>
          ))}
        </Box>
      )}
    </>
  );
};

export default JobCards;
