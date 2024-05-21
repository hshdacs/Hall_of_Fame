import React, { useState } from 'react';
import '../styles/ProjectDescription.css';

const ProjectDescription = ({ description }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const toggleExpand = () => setIsExpanded(!isExpanded);

    const shortDescription = description.split(" ").slice(0, 50).join(" ") + "... ";

    return (
            <p className="description_text">
                {isExpanded ? description : shortDescription}
                <span className="toggle-text" onClick={toggleExpand}>
                    {isExpanded ? " Show Less" : " More"}
                </span>
            </p>
    );
};

export default ProjectDescription;
