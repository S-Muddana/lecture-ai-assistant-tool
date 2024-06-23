import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Chatbot from '../components/Chatbot';
import { retrieveAndGenerate } from '../utils/uploadToS3';
import supabase from '../supabaseClient';

const VideoPage = () => {
  const quizData = [
    {
      "question": "What is the capital of France?",
      "answers": [
        "London",
        "Paris",
        "Berlin",
        "Rome"
      ],
      "correct_answer": "Paris",
      "timestamp": 30
    },
    {
      "question": "Who painted the Mona Lisa?",
      "answers": [
        "Leonardo da Vinci",
        "Pablo Picasso",
        "Vincent van Gogh",
        "Claude Monet"
      ],
      "correct_answer": "Leonardo da Vinci",
      "timestamp": 60
    },
    // Add more questions as needed
  ];
  const { id } = useParams();
  const location = useLocation();
  const { seconds = 0, response } = location.state || {};
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [player, setPlayer] = useState(null); // State to hold the player instance
  const navigate = useNavigate();

  const handleSearch = async () => {
    // e.preventDefault();
    setIsSearching(true);
    try {
      console.log('Search query:', searchQuery);
      const results = await retrieveAndGenerate(searchQuery);
      console.log('Search results:', results);
      navigate('/search-results', { state: { results: results.output.text, citations: results.citations } });
    } catch (error) {
      console.error('Error during search:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    // Load the YouTube IFrame Player API code asynchronously.
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    console.log(id);
    console.log(seconds);



    let playerInstance;
    const onYouTubeIframeAPIReady = () => {
      playerInstance = new window.YT.Player("player", {
        videoId: id,
        height: "400",
        width: "100%",
        events: {
          onReady: () => onPlayerReady(playerInstance)
        }
      });
      setPlayer(playerInstance); // Store player instance in state
    };

    const onPlayerReady = (player) => {
      console.log(seconds, "seconds");
      player.seekTo(seconds, true);
      player.playVideo();
      const iframeWindow = player.getIframe().contentWindow;
      let lastTimeUpdate = 0;

      const messageListener = (event) => {
        if (event.source === iframeWindow) {
          const data = JSON.parse(event.data);
          if (data.event === "infoDelivery" && data.info && data.info.currentTime) {
            const time = Math.floor(data.info.currentTime);
            if (time !== lastTimeUpdate) {
              lastTimeUpdate = time;
              setCurrentTime(time); // Update state with the current time
              const questionIndex = quizData.findIndex(item => item.timestamp === time);
              if (questionIndex !== -1 && questionIndex !== currentQuestionIndex) {
                player.pauseVideo();
                setCurrentQuestionIndex(questionIndex);
                setSelectedAnswer(null);
                setFeedbackMessage('');
                console.log("Quiz Time!");
              } else if (currentQuestionIndex !== -1 && quizData[currentQuestionIndex].timestamp < time) {
                setCurrentQuestionIndex(-1);
                player.playVideo();
              }
            }
          }
        }
      };

      window.addEventListener("message", messageListener);

      // Cleanup
      return () => {
        window.removeEventListener("message", messageListener);
        if (player) {
          player.destroy();
        }
      };
    };

    // Check if the YouTube IFrame Player API script is already loaded
    if (window.YT && window.YT.Player) {
      onYouTubeIframeAPIReady();
    } else {
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    }

  }, [id]);

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    if (answer === quizData[currentQuestionIndex].correct_answer) {
      setFeedbackMessage('Correct answer! Resuming video...');
      setTimeout(() => {
        setCurrentQuestionIndex(-1);
        setFeedbackMessage('');
        if (player) {
          player.playVideo();
        }
      }, 1500);
    } else {
      setFeedbackMessage('Incorrect answer. Please try again.');
    }
  };

  const handleSkipQuestion = () => {
    setCurrentQuestionIndex(-1);
    setSelectedAnswer(null);
    setFeedbackMessage('');
    if (player) {
      player.playVideo();
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}> */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          onKeyPress={(e) => { if (e.key === 'Enter') handleSearch(); }}
          style={{ width: '80%', padding: '10px', fontSize: '16px', marginBottom: '20px'}}
        />
        <button onClick={handleSearch} type="submit" style={{ padding: '10px 20px', fontSize: '16px' }}>
          Search
        </button>
      {/* </form> */}
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <div id="player-container" style={{ position: 'relative', width: '100%', height: '400px' }}>
            <div id="player"></div>
          </div>
          <div style={{ paddingTop: '10px' }}>
            <p>Current Time: {currentTime} seconds</p>
            {/* <p>{seconds} seconds</p>
            <p>{title} title</p> */}
          </div>
        </div>
        <div style={{ flex: 1, paddingLeft: '20px' }}>
          <Chatbot initialResponse={response}/>
        </div>
      </div>
      {currentQuestionIndex !== -1 && (
        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '5px', background: '#f9f9f9' }}>
          <h3>{quizData[currentQuestionIndex].question}</h3>
          {quizData[currentQuestionIndex].answers.map((answer, index) => (
            <div
              key={index}
              onClick={() => handleAnswerSelect(answer)}
              style={{
                padding: '10px',
                margin: '5px 0',
                borderRadius: '5px',
                border: selectedAnswer === answer ? '2px solid red' : '1px solid #ccc',
                background: selectedAnswer === answer ? '#f8d7da' : '#fff',
                cursor: 'pointer'
              }}
            >
              {answer}
            </div>
          ))}
          {feedbackMessage && <div style={{ marginTop: '10px', color: selectedAnswer === quizData[currentQuestionIndex].correct_answer ? 'green' : 'red' }}>{feedbackMessage}</div>}
          <button onClick={handleSkipQuestion} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '5px', border: 'none', background: '#007bff', color: '#fff', cursor: 'pointer' }}>
            Skip
          </button>
        </div>
      )}
      {isSearching && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)', // Translucent overlay
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000, // Ensure it's above other elements
          }}
        >
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <span className="loading loading-spinner loading-lg" style={{ marginBottom: '20px' }}></span>
            <h2 style={{ marginBottom: '10px' }}>Loading...</h2>
            <p>Please wait while we fetch the search results.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPage;