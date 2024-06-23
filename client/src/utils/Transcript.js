async function fetchTranscript(videoId) {
    try {
        const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/transcript/${videoId}`); // Replace with your localtunnel URL
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const transcript = await response.json();
        // console.log('Transcript:', transcript);
        return transcript;
    } catch (error) {
        console.error('Error fetching transcript:', error);
        return null;
    }
}

module.exports = { fetchTranscript };