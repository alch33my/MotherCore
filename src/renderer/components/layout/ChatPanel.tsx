import React from 'react'
import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';;
import { 
  Send, 
  X, 
  Trash2, 
  Download, 
  User,
  Bot
} from 'lucide-react';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const ChatPanel: FC<ChatPanelProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! How can I assist you with MotherCore today?',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getAssistantResponse(inputValue.trim()),
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const clearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        content: 'Chat history cleared. How can I help you?',
        sender: 'assistant',
        timestamp: new Date()
      }
    ]);
  };

  // Simple response generator
  const getAssistantResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Hello! How can I assist you with MotherCore today?';
    } else if (lowerMessage.includes('help')) {
      return 'I can help you navigate MotherCore, create content, or answer questions about the application. What would you like to know?';
    } else if (lowerMessage.includes('organization') || lowerMessage.includes('project')) {
      return 'You can create organizations and projects from the sidebar. Organizations are the top-level containers, and projects belong to organizations.';
    } else if (lowerMessage.includes('book') || lowerMessage.includes('chapter')) {
      return 'Books are collections of chapters within projects. You can create books from the project view, and chapters from the book view.';
    } else if (lowerMessage.includes('theme') || lowerMessage.includes('color')) {
      return 'MotherCore uses a cyberpunk theme with gold/amber accents. You can adjust the Matrix rain effect in the settings.';
    } else {
      return 'I understand. Is there anything specific about MotherCore you would like to know more about?';
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3 className="chat-title">MotherCore Assistant</h3>
        <div className="chat-actions">
          <button 
            className="chat-action-btn"
            onClick={clearChat}
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button 
            className="chat-action-btn"
            title="Download chat history"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            className="chat-action-btn"
            onClick={onClose}
            title="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`chat-message ${message.sender === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div className="message-avatar">
              {message.sender === 'user' ? (
                <User className="w-5 h-5" />
              ) : (
                <Bot className="w-5 h-5" />
              )}
            </div>
            <div className="message-content">
              <div className="message-text">{message.content}</div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="chat-message assistant-message">
            <div className="message-avatar">
              <Bot className="w-5 h-5" />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container">
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button 
          className="chat-send-btn"
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ChatPanel; 


