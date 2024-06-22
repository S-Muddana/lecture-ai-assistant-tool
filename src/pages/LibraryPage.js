import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../supabaseClient';

const LibraryPage = () => {
  const [videos, setVideos] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const uploadToSupabase = async () => {
    const { data, error } = await supabase
      .from('lectures')
      .insert([
        { url: videoUrl, transcript: 'transcript goes here', title: videoTitle }
      ]);
  };

  const extractVideoId = (url) => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname === 'youtu.be') {
        return parsedUrl.pathname.slice(1);
      } else if (parsedUrl.hostname === 'www.youtube.com' || parsedUrl.hostname === 'youtube.com') {
        return parsedUrl.searchParams.get('v');
      } else {
        throw new Error('Invalid YouTube URL');
      }
    } catch {
      return null;
    }
  };

  const handleAddVideo = () => {
    const videoId = extractVideoId(videoUrl);
    if (videoId && videoTitle) {
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      setVideos([...videos, { videoId, thumbnailUrl, title: videoTitle }]);
      uploadToSupabase();
      setVideoUrl('');
      setVideoTitle('');
    } else {
      alert('Please enter a valid YouTube URL and title.');
    }
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '20px' }}>
      <h2>Library</h2>
      <input
        type="text"
        placeholder="Search videos"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: '20px' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {filteredVideos.map(video => (
          <div key={video.videoId} style={{ marginBottom: '20px' }}>
            <Link
              to={{
                pathname: `/video/${video.videoId}`,
                state: { title: video.title }
              }}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                overflow: 'hidden',
                width: '200px',
                textAlign: 'center'
              }}>
                <img
                  src={video.thumbnailUrl}
                  alt={`Thumbnail for ${video.title}`}
                  style={{ width: '100%', height: 'auto' }}
                />
                <p>{video.title}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
      <input
        type="text"
        placeholder="YouTube URL"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        style={{ marginRight: '10px' }}
      />
      <input
        type="text"
        placeholder="Video Title"
        value={videoTitle}
        onChange={(e) => setVideoTitle(e.target.value)}
        style={{ marginRight: '10px', marginLeft: '10px' }}
      />
      <button onClick={handleAddVideo}>Add Video</button>
    </div>
  );
};

export default LibraryPage;
