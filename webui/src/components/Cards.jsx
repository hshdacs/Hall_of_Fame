import React from 'react';
import { Grid, CardActionArea, Box } from '@mui/material';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { red } from '@mui/material/colors';
import { useNavigate } from 'react-router-dom';

const ProjectCards = ({ projects, page, onPageChange }) => {
    const itemsPerPage = 12;
    const startIndex = (page - 1) * itemsPerPage;
    const currentProjects = projects.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(projects.length / itemsPerPage);
    const navigate = useNavigate();

    const handleCardClick = (projectId) => {
        navigate(`/project/${projectId}`);
    };

    return (
        <>
            <Grid container spacing={2}>
                {currentProjects.map((project, index) => (
              
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <CardActionArea onClick={() => handleCardClick(project._id)}>
                            <Card className="job-card" sx={{ maxWidth: 400 }}>
                                <CardHeader
                                    avatar={
                                        <Avatar sx={{ bgcolor: red[500] }} aria-label="project">
                                            {project.projectTitle.charAt(0)}
                                        </Avatar>
                                    }
                                    title={project.projectTitle}
                                    subheader={new Date(project.createdDate).toLocaleDateString()}
                                />
                                <CardMedia
                                    component="img"
                                    height="194"
                                    image={project.images && project.images[0] ? `${project.images[0]}` : '/images/jobpilot.png'}
                                    alt="Project Image"
                                />
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                        {project.longDescription}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </CardActionArea>
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

export default ProjectCards;
