const express = require('express');
const { YoutubeTranscript } = require('youtube-transcript');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = 3001;

app.use(cors());

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