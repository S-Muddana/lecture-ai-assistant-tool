import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import supabase from '../supabaseClient';
import { useParams } from 'react-router-dom';
import SpeechRecognitionComponent from '../utils/SpeechRecog';

// Configure the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const Chatbot = () => {
  const { id } = useParams();
  const videoUrl = `https://www.youtube.com/watch?v=${id}`;
  const [messages, setMessages] = useState([{ sender: 'bot', text: 'Hi! How can I help you today?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [interimInput, setInterimInput] = useState('');
  const messagesEndRef = useRef(null);

  const [prompt, setPrompt] = useState('');
  const conversationHistory = useRef([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchTranscript();
  }, [])

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchTranscript = async () => {
    const { data, error } = await supabase
      .from('lectures')
      .select()
      .eq('url', videoUrl);

    const initialPrompt = 'The following is a transcript of a YouTube Video. From now on, I will ask you questions regarding information that may be in this video. Please refer to this transcript as necessary in order to answer my questions accurately.';
    conversationHistory.current.push({"role": "user", "content": initialPrompt + '\n' + JSON.stringify(data[0].transcript)});
    console.log(conversationHistory.current);
  }

  const handleSend = async (e) => {
    e.preventDefault();
    if (input.trim()) {
      const userMessage = { sender: 'user', text: input };
      conversationHistory.current.push({"role": "user", "content":input});
      setMessages([...messages, userMessage]);
      setInput('');
      setLoading(true);

      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: conversationHistory.current,
        });

        const botMessage = {
          sender: 'bot',
          text: response.choices[0].message.content.trim(),
        };
        setMessages([...messages, userMessage, botMessage]);

        conversationHistory.current.push({"role": "assistant", "content":response.choices[0].message.content.trim()});

      } catch (error) {
        console.error('Error fetching response:', error);
        const botMessage = { sender: 'bot', text: 'Sorry, something went wrong.' };
        setMessages([...messages, userMessage, botMessage]);
      }

      setLoading(false);
    }
  };

  const handleVoiceInput = (interimText) => {
    setInterimInput(interimText);
  };

  const handleFinalVoiceInput = (finalText) => {
    setInput((prev) => prev + finalText);
    setInterimInput('');
  };

  return (
    <div className="rounded-md" style={{ boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)', padding: '10px', height: '400px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}>
        {messages.map((message, index) => (
          <div key={index} style={{ textAlign: message.sender === 'bot' ? 'left' : 'right' }}>
            <div className="font-mono" style={{ display: 'inline-block', padding: '10px', borderRadius: '5px', margin: '5px 0', background: message.sender === 'bot' ? '#7380FF' : '#7380FF', color: message.sender === 'bot' ? '#000' : '#fff' }}>
              {message.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'inline-block', padding: '10px', borderRadius: '5px', margin: '5px 0', background: '#f1f1f1', color: '#000' }}>
              <img src="https://i.gifer.com/ZZ5H.gif" alt="Loading..." style={{ width: '20px', height: '20px' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} style={{ display: 'flex' }}>
        <div className='flex flex-row w-full justify-between'>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..." 
            className="input input-bordered w-5/6" 
          />
          <div className='flex flex-row justify-end'>
            <SpeechRecognitionComponent onTextChange={handleVoiceInput} onFinalText={handleFinalVoiceInput}/>
            <button className="font-mono" type="submit" style={{ padding: '10px', borderRadius: '5px', border: 'none', background: '#00B29F', color: '#fff', marginLeft: '5px' }}>
              Send
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Chatbot;