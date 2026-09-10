import React, { useState, useRef, useEffect } from 'react';

export default function VoiceInput({ onTranscript, placeholder = "Voice Input" }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Clean up recognition instance on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      
      recognition.onend = () => setIsListening(false);

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        
        if (currentText.trim() && typeof onTranscript === 'function') {
          // Pass the updated voice string to the parent input component
          onTranscript(currentText.trim());
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
      aria-label={isListening ? "Stop listening" : "Start voice input"}
      style={{
        padding: '6px 14px',
        borderRadius: '20px',
        border: isListening ? '1px solid #ef4444' : '1px solid #cbd5e1',
        cursor: 'pointer',
        background: isListening ? '#ef4444' : '#f8fafc',
        color: isListening ? '#ffffff' : '#334155',
        fontSize: '12px',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s ease-in-out',
        boxShadow: isListening ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none'
      }}
    >
      <span style={{ display: 'inline-block', animation: isListening ? 'pulse 1.5s infinite' : 'none' }}>
        {isListening ? '🔴' : '🎤'}
      </span>
      <span>{isListening ? 'Listening...' : placeholder}</span>
    </button>
  );
}