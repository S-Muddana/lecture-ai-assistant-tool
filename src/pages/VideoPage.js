import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Chatbot from '../components/Chatbot';

const VideoPage = () => {
  const { id } = useParams();
  const videoUrl = `https://www.youtube.com/embed/${id}`;
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(0);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log(`Searching for: ${searchQuery}`);
    // Handle search logic here
  };

  useEffect(() => {
    // Load the YouTube IFrame Player API code asynchronously.
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    let player;
    const onYouTubeIframeAPIReady = () => {
      player = new window.YT.Player("player", {
        videoId: id,
        height: "400",
        width: "100%",
        events: {
          onReady: onPlayerReady
        }
      });
    };

    const onPlayerReady = () => {
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
              console.log(time); // You can update the DOM or do something else with the time
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
            <div id="player"></div>
          </div>
          <div style={{ paddingTop: '10px' }}>
            <p>Current Time: {currentTime} seconds</p>
          </div>
        </div>
        <div style={{ flex: 1, paddingLeft: '20px' }}>
          <Chatbot />
        </div>
      </div>
    </div>
  );
};

export default VideoPage;