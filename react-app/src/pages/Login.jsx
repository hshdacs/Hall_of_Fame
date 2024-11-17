import React, { useEffect, useState, useCallback } from "react";
import '../styles/loginIndex.css';  // Import the stylesheet
import appLogo from '../assets/logoJobpilot.png'; 
import gmailImage from '../assets/gmail 1.png';
import jobTracker from '../assets/jobTracker.png';
import openAI from '../assets/openAI.png';


const cardItems = [
  {
    id: 1,
    text: "Your Entire Job Search on one Dashboard, Organize your job search Keep track of your applications, interviews, and follow-ups all in one place.",
    image: jobTracker,
    customClass: "jobCard" 
  },
  {
    id: 2,
    text: "Please sign in with Gmail ID which you use to apply job",
    image: gmailImage
  },
  {
    id: 3,
    text: "Search for jobs - AI Chatbot,help you to find your desired job,  It make you ease with your application",
    image: openAI,
    customClass: "openAI" 
  }
 

];

function determineClasses(indexes, cardIndex) {
  if (indexes.currentIndex === cardIndex) {
    return "active";
  } else if (indexes.nextIndex === cardIndex) {
    return "next";
  } else if (indexes.previousIndex === cardIndex) {
    return "prev";
  }
  return "inactive";
}

function Login() {
  const [indexes, setIndexes] = useState({
    previousIndex: 0,
    currentIndex: 0,
    nextIndex: 1
  });

  const handleCardTransition = useCallback(() => {
    // If we've reached the end, start again from the first card,
    // but carry previous value over
    if (indexes.currentIndex >= cardItems.length - 1) {
      setIndexes({
        previousIndex: cardItems.length - 1,
        currentIndex: 0,
        nextIndex: 1
      });
    } else {
      setIndexes(prevState => ({
        previousIndex: prevState.currentIndex,
        currentIndex: prevState.currentIndex + 1,
        nextIndex:
          prevState.currentIndex + 2 === cardItems.length
            ? 0
            : prevState.currentIndex + 2
      }));
    }
  }, [indexes.currentIndex]);

  useEffect(() => {
    const transitionInterval = setInterval(() => {
      handleCardTransition();
    }, 4000);

    return () => clearInterval(transitionInterval);
  }, [handleCardTransition, indexes]);

  const loginwithgoogle = () => {
    console.log("about to open new window")
    window.open("https://online-auth-service-0b73a49cb2ea.herokuapp.com/api/auth/google", "_self")
  }
  return (
    <div className="appContainer">
      <nav className="navbar">
      <img src={appLogo} alt="App Logo" className="app-logo" />
        <div></div>
      </nav>
      <main className="container1">
        <div className="box">
          <p className="title">Welcome to Job Pilot!</p>
          <div className="background-image"></div>
            <ul className="card-carousel">
              {cardItems.map((card, index) => (
                <li
                  key={card.id}
                  className={`card ${determineClasses(indexes, index)}`}
                >
                <img className="card-image" src={card.image} alt={`Card ${card.id}`} />
                {card.text && <p className={`card-text  ${card.customClass}`}>{card.text}</p>}
                </li>
              ))}
            </ul>
            <button className="login-with-google-btn" onClick={loginwithgoogle}>sign in with google</button>
        </div>
      </main>
    </div>
  );
}

export default Login;