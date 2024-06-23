import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const GlobalSearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { results, citations } = location.state;

  console.log("Citations:", citations);

  // Ensure citations is an array and has at least one item
  const retrievedReferences = citations?.[0]?.retrievedReferences || [];

  const extractVideoIdFromUri = (uri) => {
    const match = uri.match(/transcripts\/(.*?)\.json/);
    return match ? match[1] : "";
  };

  const extractTimestampInSeconds = (text) => {
    const match = text.match(/"time":"(\d{2}):(\d{2})"/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const totalSeconds = minutes * 60 + seconds;
      console.log("Timestamp in seconds:", totalSeconds);
      return totalSeconds;
    }
    return null;
  };

  const cleanUpText = (text) => {
    const pattern =
      /"time":"(\d{2}:\d{2})"\},{"text":"(.*?)"(?:,|$)/g;
    let match;
    const cleanedData = [];

    while ((match = pattern.exec(text)) !== null) {
      const time = match[1];
      const contentText = match[2];
      cleanedData.push({ time, text: contentText });
    }

    return cleanedData;
  };

  const handleClick = (videoId, timestampInSeconds) => {
    navigate(`/video/${videoId}`, {
      state: {
        response: results,
        seconds: timestampInSeconds,
      },
    });
  };

  return (
    <div style={{ padding: "50px" }}>
      <h1 className="font-semibold text-5xl font-mono">Search Results</h1>
      <div className="result-item">
        <h2 style={{ fontSize: '2rem', margin: '20px 0' }}>Generated Response</h2>
        <p style={{ marginBottom: '30px', fontSize: '1.2rem' }}>{results}</p>
        <div>
          <h4 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>References:</h4>
          {retrievedReferences.map((item, index) => {
            const videoId = extractVideoIdFromUri(item.location?.s3Location?.uri);
            const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            const cleanedData = cleanUpText(item.content.text);
            const timestampInSeconds = extractTimestampInSeconds(item.content.text);

            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "30px",
                  cursor: "pointer",
                  border: "1px solid #888",
                  borderRadius: "10px",
                  padding: "15px",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
                }}
                onClick={() => handleClick(videoId, timestampInSeconds)}
              >
                <img
                  src={thumbnailUrl}
                  alt={`Thumbnail for video ${videoId}`}
                  style={{
                    width: "350px",
                    height: "200px",
                    marginRight: "20px",
                    borderRadius: "15px",
                  }}
                />
                <div>
                  {cleanedData.map((data, idx) => (
                    <p key={idx}>
                      <strong>{data.time}:</strong> {data.text}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchResultsPage;
