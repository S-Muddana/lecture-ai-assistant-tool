import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Chatbot from '../components/Chatbot';

const VideoPage = () => {
  const { id } = useParams();
  const videoUrl = `https://www.youtube.com/embed/${id}`;
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    console.log(`Searching for: ${searchQuery}`);
    // Handle search logic here
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
          <iframe
            width="100%"
            height="400"
            src={videoUrl}
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube Video"
          ></iframe>
        </div>
        <div style={{ flex: 1, paddingLeft: '20px' }}>
          <Chatbot />
        </div>
      </div>
    </div>
  );
};

export default VideoPage;