const express = require('express');
const { YoutubeTranscript } = require('youtube-transcript');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = 3001;

app.use(cors());

const convertOffsetToTime = (offset) => {
    const minutes = Math.floor(offset / 60);
    const seconds = Math.floor(offset % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const cleanText = (text) => {
    // Replace common HTML entities with their actual characters
    return text.replace(/&amp;#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
};

const combineTranscriptEntries = (transcript) => {
    const combinedTranscript = [];
    let currentEntry = { text: '', time: '' };
    let count = 0;

    for (let i = 0; i < transcript.length; i++) {
        const entry = transcript[i];
        const cleanedText = cleanText(entry.text);

        if (count === 0) {
            // Start a new entry
            currentEntry = { text: cleanedText, time: convertOffsetToTime(entry.offset), videoId: entry.videoId };
        } else {
            // Append to the current entry
            currentEntry.text += ' ' + cleanedText;
        }

        count++;

        if (count === 3 || i === transcript.length - 1) {
            // Add the combined entry to the transcript array
            combinedTranscript.push(currentEntry);
            count = 0; // Reset count for the next group
        }
    }

    return combinedTranscript;
};

async function fetchTranscriptServer(videoId) {
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId, {lang : 'en'});
        console.log('Transcript:', transcript);

        const cleanedTranscript = transcript.map(entry => {
            return { text: cleanText(entry.text), offset: entry.offset };
        });

        const combinedTranscript = combineTranscriptEntries(cleanedTranscript);

        console.log('Combined Transcript:', combinedTranscript);
        return combinedTranscript;
        
    } catch (error) {
        console.error('Error fetching transcript:', error);
        return null;
    }
}

app.get('/transcript/:videoId', async (req, res) => {
    const videoId = req.params.videoId;
    const transcript = await fetchTranscriptServer(videoId);
    if (transcript) {
        res.json(transcript);
    } else {
        res.status(500).send('Error fetching transcript');
    }
});

app.use("/", (req, res) => {
    res.send("Server is running")
});

app.listen(port, () => {
    console.log(`Proxy server listening on port ${port}`);
});
