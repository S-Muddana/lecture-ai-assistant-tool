import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LibraryPage = () => {
  const [videos, setVideos] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddVideo = () => {
    const videoId = new URL(videoUrl).searchParams.get('v');
    setVideos([...videos, videoId]);
    setVideoUrl('');
  };

  const filteredVideos = videos.filter(videoId => videoId.includes(searchTerm));

  return (
    <div style={{ padding: '20px' }}>
      <h2>Library</h2>
      <input
        type="text"
        placeholder="Search videos"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div>
        {filteredVideos.map(videoId => (
          <div key={videoId}>
            <Link to={`/video/${videoId}`}>
              <p>{videoId}</p>
            </Link>
          </div>
        ))}
      </div>
      <input
        type="text"
        placeholder="YouTube URL"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
      />
      <button onClick={handleAddVideo}>Add Video</button>
    </div>
  );
};

export default LibraryPage;