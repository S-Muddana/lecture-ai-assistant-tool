import React, { useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone } from '@fortawesome/free-solid-svg-icons';

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';

const SpeechRecognitionComponent = ({ onTextChange, onFinalText }) => {
  const [listening, setListening] = useState(false);

  const handleListen = () => {
    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      recognition.start();
      setListening(true);
    }

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      onTextChange(interimTranscript);
      if (finalTranscript) {
        onFinalText(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error(event.error);
      setListening(false);
    };
  };

  return (
      <button onClick={handleListen} style={{ padding: '10px', borderRadius: '5px', border: 'none', background: listening ? '#0056b3' : '#007bff', color: '#fff', marginLeft: '5px' }}>
        <FontAwesomeIcon icon={faMicrophone} />
      </button>
  );
};

export default SpeechRecognitionComponent;
