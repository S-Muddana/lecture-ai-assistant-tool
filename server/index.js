const express = require('express');
const { YoutubeTranscript } = require('youtube-transcript');
const { OpenAI } = require('openai');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const app = express();
const fs = require('fs');
const path = require('path');
const port = 3001;
const takeScreenshot = require('youtube-screenshot');
const bodyParser = require('body-parser');

app.use(bodyParser.json());

// Disable CORS (Allow all origins)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any origin
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', true); // Allow cookies

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

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

app.post('/take-screenshot', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any origin
    const {timestamp} = req.body;
    const {url} = req.body;

    await takeScreenshot(url, timestamp, './', 'test.png')
        .then(() => console.log('Screenshot taken successfully'))
        .catch(err => console.error(err));

    const imageFilePath = path.resolve('./test.png');
    const imageBuffer = fs.readFileSync(imageFilePath);
    const imageBase64 = imageBuffer.toString('base64');

    const openai = new OpenAI({ apiKey: process.env.REACT_APP_OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
            role: "user",
            content: [
                { type: "text", text: "What’s in this image?" },
                {
                type: "image_url",
                image_url: {
                    "url": `data:image/png;base64,${imageBase64}`,
                },
                },
            ],
            },
        ],
    });

    res.json({ data: response.choices[0].message.content });
    // console.log("OPENAI RESPONSE", response.choices[0].message.content);
});

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
