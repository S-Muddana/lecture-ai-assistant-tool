import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';

// Configure the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const Chatbot = () => {
  const [messages, setMessages] = useState([{ sender: 'bot', text: 'Hi! How can I help you today?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (input.trim()) {
      const userMessage = { sender: 'user', text: input };
      setMessages([...messages, userMessage]);
      setInput('');
      setLoading(true);

      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: input }],
        });

        const botMessage = {
          sender: 'bot',
          text: response.choices[0].message.content.trim(),
        };
        setMessages([...messages, userMessage, botMessage]);
      } catch (error) {
        console.error('Error fetching response:', error);
        const botMessage = { sender: 'bot', text: 'Sorry, something went wrong.' };
        setMessages([...messages, userMessage, botMessage]);
      }

      setLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '5px', padding: '10px', height: '400px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}>
        {messages.map((message, index) => (
          <div key={index} style={{ textAlign: message.sender === 'bot' ? 'left' : 'right' }}>
            <div style={{ display: 'inline-block', padding: '10px', borderRadius: '5px', margin: '5px 0', background: message.sender === 'bot' ? '#f1f1f1' : '#007bff', color: message.sender === 'bot' ? '#000' : '#fff' }}>
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
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '10px', borderRadius: '5px', border: 'none', background: '#007bff', color: '#fff', marginLeft: '5px' }}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chatbot;