// src/components/TypingIndicator.jsx
import React from 'react'

export default function TypingIndicator({ users }) {
  if (!users || users.length === 0) return null

  const userText = users.length === 1 
    ? `${users[0]} is typing` 
    : users.length === 2 
    ? `${users.join(' and ')} are typing`
    : `${users.slice(0, -1).join(', ')} and ${users[users.length - 1]} are typing`

  return (
    <div className="typing-indicator">
      <div className="typing-dots">
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
      </div>
      <span>{userText}...</span>
    </div>
  )
}