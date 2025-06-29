// src/components/ChatBubble.jsx
import React from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import ReadReceiptIndicator from './ReadReceiptIndicator'

dayjs.extend(relativeTime)

function getUserInitials(username) {
  return username ? username.substring(0, 2).toUpperCase() : 'UN'
}

function formatMessageTime(timestamp) {
  const messageTime = dayjs(timestamp)
  const now = dayjs()
  
  if (now.diff(messageTime, 'day') === 0) {
    return messageTime.format('HH:mm')
  } else if (now.diff(messageTime, 'day') === 1) {
    return `Yesterday ${messageTime.format('HH:mm')}`
  } else {
    return messageTime.format('MMM DD, HH:mm')
  }
}

export default function ChatBubble({ message, isOwn, seenBy, readReceipts, messageEls }) {
  return (
    <div
      className={`message-bubble ${isOwn ? 'outbound' : 'inbound'}`}
      ref={el => { if (el) messageEls.current[message.id] = el }}
      data-msg-id={message.id}
    >
      <div className="message-avatar">
        {getUserInitials(message.sender)}
      </div>
      
      <div className="message-content">
        <div className="message-header">
          <span className="sender-name">{message.sender}</span>
          <span className="message-time">
            {formatMessageTime(message.created_at)}
          </span>
        </div>
        
        {message.structured ? (
          <>
            <div className="message-body">
              <p className="message-text">Sent structured data</p>
            </div>
            <div className="structured-message">
              <div className="structured-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18"/>
                  <path d="m19 9-5 5-4-4-3 3"/>
                </svg>
                Structured Data
              </div>
              <div className="structured-data">
                <pre>{JSON.stringify(message.structured, null, 2)}</pre>
              </div>
            </div>
          </>
        ) : (
          <div className="message-body">
            <p className="message-text">{message.content}</p>
          </div>
        )}
        
        <ReadReceiptIndicator
          readReceipts={readReceipts || []}
          readBy={seenBy || []}
          readCount={seenBy?.length || 0}
          showAvatars={seenBy?.length > 0 && seenBy.length <= 5}
          status={seenBy?.length > 0 ? 'read' : 'delivered'}
          className={isOwn ? 'own-message' : ''}
        />
      </div>
    </div>
  )
}
