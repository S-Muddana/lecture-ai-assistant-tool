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

app.use(cors());
app.use(bodyParser.json());

async function fetchTranscript(videoId) {
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId, {lang : 'en'});
        console.log('Transcript:', transcript);

        const filteredTranscript = transcript.map(entry => {
            console.log('Processing entry:', entry);
            return { text: entry.text, offset: entry.offset };
        });

        console.log('Filtered Transcript:', filteredTranscript);
        return filteredTranscript;
        
    } catch (error) {
        console.error('Error fetching transcript:', error);
        return null;
    }
}

app.post('/take-screenshot', async (req, res) => {
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
    const transcript = await fetchTranscript(videoId);
    if (transcript) {
        res.json(transcript);
    } else {
        res.status(500).send('Error fetching transcript');
    }
});

app.listen(port, () => {
    console.log(`Proxy server listening at http://localhost:${port}`);
});