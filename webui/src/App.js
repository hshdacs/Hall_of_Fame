import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom"; // Import useLocation from react-router-dom
import Dashboard from './pages/Dashboard.jsx';
import ProjectDetails from './pages/ProjectDetails.jsx';
import appLogo from './assets/card-image 1.png';

const projectData = [
  {
      "id": "PROJECT-1234",
      "projectTitle": "Next Generation AI Development",
      "createdDate": "2024-05-16T10:30:00Z",
      "longDescription": "This project aims to develop the next generation of AI models that are more efficient and accurate. The project includes various stages such as data collection, model training, and deployment.This project aims to develop the next generation of AI models that are more efficient and accurate. The project includes various stages such as data collection, model training, and deployment.This project aims to develop the next generation of AI models that are more efficient and accurate. The project includes various stages such as data collection, model training, and deployment.This project aims to develop the next generation of AI models that are more efficient and accurate. The project includes various stages such as data collection, model training, and deployment.This project aims to develop the next generation of AI models that are more efficient and accurate. The project includes various stages such as data collection, model training, and deployment.This project aims to develop the next generation of AI models that are more efficient and accurate. The project includes various stages such as data collection, model training, and deployment.This project aims to develop the next generation of AI models that are more efficient and accurate. The project includes various stages such as data collection, model training, and deployment.This project aims to develop the next generation of AI models that are more efficient and accurate. The project includes various stages such as data collection, model training, and deployment.This project aims to develop the next generation of AI models that are more efficient and accurate. The project includes various stages such as data collection, model training, and deployment.This project aims to develop the next generation of AI models that are more efficient and accurate. The project includes various stages such as data collection, model training, and deployment.",
      "images": [
        appLogo,
        appLogo,
        appLogo,
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
    }
];

const App = () => {
  return (
    <BrowserRouter>
      <AppContent /> {/* Render AppContent within BrowserRouter */}
    </BrowserRouter>
  );
};

const AppContent = () => {
 
  return (
    <Routes>
      <Route path="/" element={ <Dashboard />} /> 
      <Route path="/project/:projectId" element={<ProjectDetails projectData={projectData} />} /> {/* Add route for ProjectDetails */}
    </Routes>
  );
};

export default App;
