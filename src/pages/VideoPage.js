import React from 'react';
import { useParams } from 'react-router-dom';
import Chatbot from '../components/Chatbot';

const VideoPage = () => {
  const { id } = useParams();
  const videoUrl = `https://www.youtube.com/embed/${id}`;

  return (
    <div style={{ display: 'flex', padding: '20px' }}>
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
  );
};

export default VideoPage;