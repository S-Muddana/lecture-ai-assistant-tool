import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Lecture Assistant</h1>
      <Link to="/lecture-ai-assistant-tool/library">
        <button>Go to Library</button>
      </Link>
    </div>
  );
};

export default LandingPage;