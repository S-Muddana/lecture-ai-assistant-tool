import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Chatbot from '../components/Chatbot';
import AdditionalResources from '../components/AdditionalResources';
import supabase from '../supabaseClient';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const VideoPage = () => {
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [player, setPlayer] = useState(null);
  const [quizData, setQuizData] = useState([]);
  const [resources, setResources] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    console.log(`Searching for: ${searchQuery}`);
    // Handle search logic here
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
          setQuizData(data.questions.questions || []);
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
    <div className="h-full" style={{ padding: '20px' }}>
      <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>

        <div className='flex flex-row'>
          <label className="input input-bordered flex items-center gap-2 w-4/5">
            <input 
              type="text" 
              className="grow" 
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-70"><path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clipRule="evenodd" /></svg>
          </label>
          <button className="btn btn-primary w-1/8 ml-5" type="submit">Search</button>
        </div>
        
      </form>
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <div id="player-container" style={{ position: 'relative', width: '100%', height: '400px' }}>
            <div id="player"></div>
          </div>
          <div style={{ paddingTop: '10px' }}>
            <p>Current Time: {currentTime} seconds</p>
          </div>
        </div>
        <div className="h-full" style={{ flex: 1, paddingLeft: '20px' }}>
          <Chatbot currentTime={currentTime} />
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
    </div>
  );
};

export default VideoPage;