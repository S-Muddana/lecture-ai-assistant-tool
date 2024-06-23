import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Chatbot from '../components/Chatbot';
import { retrieveAndGenerate } from '../utils/uploadToS3';
import AdditionalResources from '../components/AdditionalResources';
import supabase from '../supabaseClient';
import OpenAI from 'openai';
import NavBar from "../components/navBar";


const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const VideoPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const { seconds = 0, response } = location.state || {};
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [player, setPlayer] = useState(null);
  const [quizData, setQuizData] = useState([]);
  const [quizTimestamps, setQuizTimestamps] = useState([]);
  const [resources, setResources] = useState('');
  const navigate = useNavigate();

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };
  

  const handleSearch = async () => {
    setIsSearching(true);
    try {
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
    const fetchQuizData = async () => {
        try {
          const { data, error } = await supabase
            .from('lectures')
            .select('questions')
            .eq('url', `https://www.youtube.com/watch?v=${id}`)
            .single();

          if (error) {
            throw new Error(error.message);
          }
          console.log(data.questions.questions);
          const questions = data.questions.questions || [];
          setQuizData(questions);
          
          // Extract timestamps
          const timestamps = questions.map(item => formatTime(item.timestamp));
          setQuizTimestamps(timestamps);

        } catch (error) {
            console.error('Error fetching quiz data:', error);
        }
    };
  
    fetchQuizData();
  }, [id]);

  useEffect(() => {
    const fetchResources = async () => {
      const response = await supabase
        .from('lectures')
        .select('transcript')
        .eq('url', `https://www.youtube.com/watch?v=${id}`)

      // console.log(response.data[0].transcript);
      const resource = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{"role":"user", "content": "The following is a transcript of a YouTube Video. Please find me additional learning material and resources relating to this content: " + JSON.stringify(response.data[0].transcript)}],
      });
      
      setResources(resource.choices[0].message.content);
    };
    fetchResources();
  }, []);

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
              console.log(quizData);
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

  }, [id, quizData, currentQuestionIndex]);

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
    <div style={{backgroundColor: 'black', minHeight: "100vh"}}>
    <NavBar />
    <div style={{ padding: "0px", paddingLeft: '20px', paddingRight: '20px', paddingBottom: '20px' }}>
      {/* <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}> */}

        <div className='flex flex-row' style={{ marginBottom: '20px' }}>
          <label className="input input-bordered flex items-center gap-2 w-4/5">
            <input 
              type="text" 
              className="grow" 
              placeholder="Search through all your videos..."
              value={searchQuery}
              onKeyPress={(e) => { if (e.key === 'Enter') handleSearch(); }}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-70"><path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clipRule="evenodd" /></svg>
          </label>
          <button onClick={handleSearch} className="btn btn-primary w-1/8 ml-5" type="submit">Search</button>
          {/* <svg 
    className="w-6 h-6 text-gray-800 dark:text-white" 
    aria-hidden="true" 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    fill="currentColor" 
    viewBox="0 0 24 24"
    onClick={() => navigate('/library')}
    style={{ width: '50px', height: '50px', marginLeft: '30px', cursor: 'pointer' }} // Adjusted size and margin
  >
    <path fillRule="evenodd" d="M11.293 3.293a1 1 0 0 1 1.414 0l6 6 2 2a1 1 0 0 1-1.414 1.414L19 12.414V19a2 2 0 0 1-2 2h-3a1 1 0 0 1-1-1v-3h-2v3a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2v-6.586l-.293.293a1 1 0 0 1-1.414-1.414l2-2 6-6Z" clipRule="evenodd"/>
  </svg> */}
        </div>
        
      {/* </form> */}
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <div id="player-container" style={{ position: 'relative', width: '100%', height: '400px' }}>
            <div id="player"></div>
          </div>
          <div style={{ paddingTop: '10px' }}>
            <p>Current Time: {currentTime} seconds</p>
            <p>Timestamps: [{quizTimestamps.join(', ')}]</p>
            {/* <p>{seconds} seconds</p>
            <p>{title} title</p> */}
          </div>
        </div>
        <div style={{ flex: 1, paddingLeft: '20px' }}>
          <Chatbot currentTime={currentTime} initialResponse={response}/>
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
      <div className="flex flex-row justify-end w-full">
        <AdditionalResources resources={resources}/>
      </div>
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
    </div>
  );
};

export default VideoPage;