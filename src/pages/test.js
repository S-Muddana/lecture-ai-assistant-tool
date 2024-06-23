import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Chatbot from '../components/Chatbot';
import supabase from '../supabaseClient'; // Assuming you have supabase configured

const VideoPage = () => {
  const { id } = useParams();
  const videoUrl = `https://www.youtube.com/embed/${id}`;
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [quizData, setQuizData] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Function to fetch quiz data from Supabase
  useEffect(() => {
    const fetchQuizData = async () => {
      let { data: quiz, error } = await supabase
        .from('quiz') // Replace 'quiz' with your Supabase table name
        .select('*')
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching quiz data:', error);
      } else {
        setQuizData(quiz);
      }
    };

    fetchQuizData();
  }, []);

  // Effect to handle video time tracking and quiz display
  useEffect(() => {
    const interval = setInterval(() => {
      const player = document.getElementById('player');
      if (player) {
        const time = Math.floor(player.getCurrentTime());
        setCurrentTime(time);

        const questionIndex = quizData.findIndex(item => item.timestamp === time);
        if (questionIndex !== -1 && questionIndex !== currentQuestionIndex) {
          player.pauseVideo();
          setCurrentQuestionIndex(questionIndex);
          setSelectedAnswer(null);
          setFeedbackMessage('');
        } else if (currentQuestionIndex !== -1 && quizData[currentQuestionIndex].timestamp < time) {
          setCurrentQuestionIndex(-1);
          player.playVideo();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTime, quizData, currentQuestionIndex]);

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    if (answer === quizData[currentQuestionIndex].correct_answer) {
      setFeedbackMessage('Correct answer! Resuming video...');
      setTimeout(() => {
        setCurrentQuestionIndex(-1);
        setFeedbackMessage('');
        const player = document.getElementById('player');
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
    const player = document.getElementById('player');
    if (player) {
      player.playVideo();
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          style={{ width: '80%', padding: '10px', fontSize: '16px' }}
        />
        <button type="submit" style={{ padding: '10px 20px', fontSize: '16px' }}>
          Search
        </button>
      </form>
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <div id="player-container" style={{ position: 'relative', width: '100%', height: '400px' }}>
            <iframe
              id="player"
              width="100%"
              height="100%"
              src={videoUrl}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube Player"
            ></iframe>
          </div>
          <div style={{ paddingTop: '10px' }}>
            <p>Current Time: {currentTime} seconds</p>
          </div>
        </div>
        <div style={{ flex: 1, paddingLeft: '20px' }}>
          <Chatbot />
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
    </div>
  );
};

export default VideoPage;