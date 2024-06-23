import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../supabaseClient';
import { fetchTranscript } from '../utils/Transcript';
import { uploadToS3, startIngestionJob, queryKnowledgeBase } from '../utils/uploadToS3';

const LibraryPage = () => {
  const [videos, setVideos] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    fetchSupabase();
  }, []);

  const fetchSupabase = async () => {
    const { data, error } = await supabase.from('lectures').select('*');
    const dummyVideos = [];
    for (let i = 0; i < data.length; i++) {
      dummyVideos.push({
        videoId: extractVideoId(data[i].url),
        thumbnailUrl: data[i].thumbnail,
        title: data[i].title
      });
    }
    setVideos(dummyVideos);
  };

  const uploadToSupabase = async (url, s3Url, title, thumbnail) => {
    const { data, error } = await supabase
      .from('lectures')
      .insert([{ url: url, transcript: s3Url, title: title, thumbnail: thumbnail }]);
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

  const handleAddVideo = async () => {
    const videoId = extractVideoId(videoUrl);
    const curr_transcript = await fetchTranscript(videoId);
    setTranscript(curr_transcript);
    console.log(curr_transcript);
    if (videoId && videoTitle) {
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      const s3Url = await uploadToS3(videoId, curr_transcript);

      if (s3Url) {
        setVideos([...videos, { videoId, thumbnailUrl, title: videoTitle }]);
        await uploadToSupabase(videoUrl, s3Url, videoTitle, thumbnailUrl);
        const ingestionJobId = await startIngestionJob();
        console.log(`Ingestion job started with ID: ${ingestionJobId}`);
      } else {
        alert('Failed to upload transcript to S3.');
      }

      setVideoUrl('');
      setVideoTitle('');
    } else {
      alert('Please enter a valid YouTube URL and title.');
    }
  };

  const handleSearch = async () => {
    const results = await queryKnowledgeBase(searchTerm);
    console.log('Search results:', results);
  };


  return (
    <div style={{ padding: '20px' }}>
      <h2>Library</h2>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search videos"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginRight: '10px', flex: 1 }}
        />
        <button onClick={handleSearch} style={{ marginLeft: '10px' }}>
          Search
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {videos.map(video => (
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
