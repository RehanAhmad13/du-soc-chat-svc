// src/components/TextInput.jsx
import React from 'react'

export default function TextInput({ textValue, onChange, onStructuredClick }) {
  return (
    <div className="text-input-container">
      <textarea
        value={textValue}
        onChange={onChange}
        className="chat-input"
        placeholder="Type your message here..."
        rows={1}
        onInput={(e) => {
          e.target.style.height = 'auto'
          e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
        }}
      />
      <div className="input-actions">
        <button
          type="button"
          className="chat-toggle-btn"
          onClick={onStructuredClick}
          title="Send structured data"
        >
          📊 Form
        </button>
        <button 
          type="submit" 
          className="chat-send-btn"
          disabled={!textValue.trim()}
          title="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22,2 15,22 11,13 2,9 22,2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}