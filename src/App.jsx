import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await axios.get('http://localhost:3000/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  return (
    <div className="App">
      <h1>AI Sales Representative Dashboard</h1>
      <div className="conversations">
        {conversations.map((conversation) => (
          <div key={conversation.conversation_id} className="conversation">
            <h3>Conversation ID: {conversation.conversation_id}</h3>
            <p><strong>Transcript:</strong> {conversation.transcript}</p>
            <p><strong>AI Response:</strong> {conversation.ai_response}</p>
            <p><strong>Timestamp:</strong> {new Date(conversation.timestamp).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
