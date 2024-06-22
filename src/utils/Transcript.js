const { YoutubeTranscript } = require('youtube-transcript');

async function fetchTranscript(videoId) {
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        console.log('Transcript:', transcript);
    } catch (error) {
        console.error('Error fetching transcript:', error);
    }
}

fetchTranscript(videoId);
