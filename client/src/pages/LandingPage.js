import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import PlaceholdersAndVanishInput from "../components/ui/placeholders-and-vanish-input";

const LandingPage = () => {
  const words = ["about lectures", "to generate quizes", "to explain topics", "to explore content", "make learning FUN"];
  const [currentWord, setCurrentWord] = useState(0);
  const [inputValue, setInputValue] = useState(""); // State for input value
  const inputRef = useRef(null); // Ref for the input field
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length);
    }, 1500); // Increased interval to ensure transition is visible

    return () => clearInterval(interval);
  }, [words.length]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    console.log("submitted", inputValue);
    
    // Extract video ID and construct a standardized YouTube URL
    const videoId = extractVideoId(inputValue);
    if (videoId) {
      const standardizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
      navigate("/library", { state: { videoUrl: standardizedUrl } });
    } else {
      console.error("Invalid YouTube URL");
    }
  };

  const handlePasteClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      console.log("Pasted text:", text);
      setInputValue(text);
      inputRef.current.focus();
    } catch (err) {
      console.error("Failed to read clipboard contents:", err);
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

  return (
    <div style={{ textAlign: "center", padding: "50px", backgroundColor: "black", minHeight: "100vh" }}>
      <div className="h-[40rem] flex flex-col justify-center items-center px-4">
        <h2 className="text-white text-2xl md:text-6xl font-bold text-center mb-10">
          Ask Athena{" "}
          <span className="inline-block relative">
            <AnimatePresence mode="wait">
              <motion.span
                key={words[currentWord]}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="inline-block"
                style={{ color: '#7480ff' }}
              >
                {words[currentWord]}
              </motion.span>
            </AnimatePresence>
          </span>
        </h2>
        <div className="flex items-center w-full max-w-xl">
          <PlaceholdersAndVanishInput
            ref={inputRef} // Attach ref to the input field
            placeholder="Add YouTube Link to start..."
            value={inputValue}
            onChange={handleChange}
            onSubmit={onSubmit}
          />
          <button
            onClick={handlePasteClick}
            className="ml-4 px-4 py-2 transition duration-200 rounded-lg text-white"
            style={{ marginLeft: '10px', backgroundColor: '#7480ff'}}

          >
            Paste
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
