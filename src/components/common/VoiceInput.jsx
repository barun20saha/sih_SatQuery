import React, { useState, useRef } from 'react';

export default function VoiceInput({ onTranscript }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true; // Shows live text while speaking
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          onTranscript(transcript.trim());
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Speech initialization error:', err);
      setIsListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`btn-voice ${isListening ? 'listening' : ''}`}
      style={{
        padding: '6px 12px',
        borderRadius: '20px',
        border: '1px solid #d0d7de',
        cursor: 'pointer',
        background: isListening ? '#d93025' : '#f6f8fa',
        color: isListening ? '#ffffff' : '#24292f',
        fontSize: '12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      <span>{isListening ? '🔴 Listening...' : '🎤 Voice Input'}</span>
    </button>
  );
}