import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { fetchTranscript } from "../utils/Transcript";
import { generateQuizQuestions } from "../utils/QuizGenerator";
import {
  uploadToS3,
  startIngestionJob,
  queryKnowledgeBase,
  retrieveAndGenerate,
  checkIngestionJobStatus,
} from "../utils/uploadToS3";
import "../index.css";

const LibraryPage = () => {
  const [videos, setVideos] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStatus, setIngestionStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchSupabase();
  }, [videos]);

  const fetchVideoTitle = async (videoId) => {
    const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        return data.items[0].snippet.title;
      } else {
        throw new Error("No video found for the given ID");
      }
    } catch (error) {
      console.error("Error fetching video title:", error);
      return null;
    }
  };

  const fetchSupabase = async () => {
    const { data, error } = await supabase.from("lectures").select("*");
    const dummyVideos = [];
    for (let i = 0; i < data.length; i++) {
      dummyVideos.push({
        videoId: extractVideoId(data[i].url),
        thumbnailUrl: data[i].thumbnail,
        title: data[i].title,
      });
    }
    setVideos(dummyVideos);
  };

  const uploadToSupabase = async (
    url,
    transcript,
    title,
    thumbnail,
    questions
  ) => {
    const { data, error } = await supabase
      .from("lectures")
      .insert([
        {
          url: url,
          transcript: transcript,
          title: title,
          thumbnail: thumbnail,
          questions: questions,
        },
      ]);

    if (error) {
      console.error("Error uploading to Supabase:", error);
    }
  };

  const extractVideoId = (url) => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname === "youtu.be") {
        return parsedUrl.pathname.slice(1);
      } else if (
        parsedUrl.hostname === "www.youtube.com" ||
        parsedUrl.hostname === "youtube.com"
      ) {
        return parsedUrl.searchParams.get("v");
      } else {
        throw new Error("Invalid YouTube URL");
      }
    } catch {
      return null;
    }
  };

  const handleAddVideo = async () => {
    const videoId = extractVideoId(videoUrl);
    const videoTitle = await fetchVideoTitle(videoId);
    const curr_transcript = await fetchTranscript(videoId);
    console.log(curr_transcript);
    if (videoId && videoTitle) {
      // Generate quiz questions from the transcript
      const quizQuestions = await generateQuizQuestions(curr_transcript);
      console.log(quizQuestions);
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      const s3Url = await uploadToS3(videoId, curr_transcript);
      if (s3Url) {
        setVideos([...videos, { videoId, thumbnailUrl, title: videoTitle }]);
        await uploadToSupabase(
          videoUrl,
          curr_transcript,
          videoTitle,
          thumbnailUrl,
          quizQuestions
        );
        const ingestionJobId = await startIngestionJob();
        console.log(`Ingestion job started with ID: ${ingestionJobId}`);
        setIsIngesting(true);
        setIngestionStatus("Ingestion job started...");

        // Poll for ingestion status
        let status;
        do {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 seconds
          console.log("Checking ingestion job status...");
          status = await checkIngestionJobStatus(ingestionJobId);
          setIngestionStatus(`Current status: ${status}`);
        } while (status && status !== "COMPLETE");

        if (status === "COMPLETE") {
          console.log("Ingestion job completed successfully.");
          setIngestionStatus("Ingestion job completed successfully.");
          // alert('Ingestion job completed successfully.');
        } else {
          console.error("Ingestion job did not complete successfully.");
          setIngestionStatus("Ingestion job failed.");
        }
        setIsIngesting(false);
      } else {
        alert("Failed to upload transcript to S3.");
      }
      setVideoUrl("");
      setVideoTitle("");
    } else {
      alert("Please enter a valid YouTube URL and title.");
    }
  };

  const handleDeleteVideo = async (url) => {
    const response = await supabase.from("lectures").delete().eq("url", url);
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const results = await retrieveAndGenerate(searchTerm);
      console.log("Search results:", results);
      navigate("/search-results", {
        state: { results: results.output.text, citations: results.citations },
      });
    } catch (error) {
      console.error("Error during search:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div style={{ padding: "50px" }}>
      <div className="flex flex-row justify-between pb-10">
        <h1 className="font-semibold text-5xl font-mono">Lecture Library 📖</h1>
        <label className="input input-bordered flex items-center gap-2 w-2/5">
          <input
            type="text"
            className="grow"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleSearch();
            }} // This line allows submitting with Enter key
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-4 h-4 opacity-70"
            onClick={handleSearch} // This line makes the SVG clickable
            style={{ cursor: "pointer" }} // This line changes the cursor to indicate it's clickable
          >
            <path
              fillRule="evenodd"
              d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
              clipRule="evenodd"
            />
          </svg>
        </label>
      </div>

      <div className="flex flex-row justify-between w-4/5">
        {/* <input type="text" placeholder="Enter Title" className="input input-bordered input-primary w-full max-w-xs" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} /> */}
        <input
          type="text"
          placeholder="Enter URL"
          style={{ flex: 1, marginRight: '20px' }}
          className="input input-bordered input-primary flex-grow"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
        <button className="btn btn-primary w-1/6" onClick={handleAddVideo}>
          Add Video
        </button>
      </div>

      <div
        style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}
        className="flex flex-row justify-center pt-11"
      >
        {videos.map((video) => (
          <div key={video.videoId} style={{ marginBottom: "20px" }}>
            <div
              style={{
                overflow: "hidden",
                width: "300px",
                textAlign: "center",
              }}
            >
              <Link
                to={{
                  pathname: `/video/${video.videoId}`,
                  state: { title: video.title },
                }}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <img
                  src={video.thumbnailUrl}
                  alt={`Thumbnail for ${video.title}`}
                  style={{ width: "100%", height: "auto" }}
                  className="rounded-md"
                />
              </Link>
              <div className="flex flex-row justify-between pt-1">
                <p
                  className="text-lg font-semibold font-mono pl-2"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "250px", // Adjust width as necessary
                  }}
                >
                  {video.title}
                </p>
                <button
                  className="pr-2"
                  onClick={() =>
                    handleDeleteVideo(
                      `https://www.youtube.com/watch?v=${video.videoId}`
                    )
                  }
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {isIngesting && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.8)", // Translucent overlay
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000, // Ensure it's above other elements
          }}
        >
          <div style={{ textAlign: "center", color: "#fff" }}>
            <span
              className="loading loading-spinner loading-lg"
              style={{ marginBottom: "20px" }}
            ></span>
            <h2 style={{ marginBottom: "10px" }}>Ingesting...</h2>
            <p>Please wait while we learn your lecture.</p>
          </div>
        </div>
      )}

      {isSearching && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.8)", // Translucent overlay
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000, // Ensure it's above other elements
          }}
        >
          <div style={{ textAlign: "center", color: "#fff" }}>
            <span
              className="loading loading-spinner loading-lg"
              style={{ marginBottom: "20px" }}
            ></span>
            <h2 style={{ marginBottom: "10px" }}>Loading...</h2>
            <p>Please wait while we fetch the search results.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
