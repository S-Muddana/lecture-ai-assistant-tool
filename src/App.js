import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LibraryPage from './pages/LibraryPage';
import VideoPage from './pages/VideoPage';
import GlobalSearchResultsPage from './pages/GlobalSearchResultsPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/video/:id" element={<VideoPage />} />
        <Route path="/search-results" element={<GlobalSearchResultsPage />} />
      </Routes>
    </Router>
  );
};

export default App;
