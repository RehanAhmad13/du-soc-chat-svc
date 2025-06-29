// src/hooks/useReadReceipts.js
import { useEffect, useRef, useCallback } from 'react'
import { debounce } from '../utils/chatUtils'

export function useReadReceipts(messages, readReceipts, user, wsRef, initialMessageIds, messageEls) {
  const observer = useRef(null)
  const pendingReads = useRef(new Set())
  const lastBatchSent = useRef(0)

  // Debounced function to send batched read receipts
  const sendBatchedReads = useCallback(
    debounce(() => {
      if (pendingReads.current.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
        const messageIds = Array.from(pendingReads.current)
        
        // Send individual read receipts for real-time updates
        messageIds.forEach(msgId => {
          wsRef.current.send(JSON.stringify({ 
            type: 'read', 
            message_id: parseInt(msgId),
            timestamp: Date.now()
          }))
        })
        
        pendingReads.current.clear()
        lastBatchSent.current = Date.now()
      }
    }, 300),
    [wsRef]
  )

  const shouldMarkAsRead = useCallback((msgId) => {
    if (!msgId) return false
    
    const message = messages.find(m => String(m.id) === msgId)
    if (!message) return false
    
    return (
      document.visibilityState === 'visible' &&
      !initialMessageIds.current.has(parseInt(msgId)) &&
      message.sender !== user.username &&
      !readReceipts[msgId]?.includes(user.username) &&
      !pendingReads.current.has(msgId)
    )
  }, [messages, readReceipts, user, initialMessageIds])

  useEffect(() => {
    if (!observer.current) {
      observer.current = new IntersectionObserver(entries => {
        const newReads = []
        
        entries.forEach(entry => {
          const msgId = entry.target.dataset.msgId
          
          if (entry.isIntersecting && shouldMarkAsRead(msgId)) {
            pendingReads.current.add(msgId)
            newReads.push(msgId)
          }
          
          // Keep observing for performance - don't unobserve immediately
        })
        
        if (newReads.length > 0) {
          sendBatchedReads()
        }
      }, { 
        threshold: 0.6, // Slightly higher threshold for better accuracy
        rootMargin: '0px 0px -10px 0px' // Small bottom margin
      })
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Re-observe all message elements when page becomes visible
        Object.values(messageEls.current).forEach(el => {
          if (el && observer.current) {
            observer.current.observe(el)
          }
        })
        
        // Send any pending reads immediately when page becomes visible
        if (pendingReads.current.size > 0) {
          sendBatchedReads.flush?.() || sendBatchedReads()
        }
      }
    }

    const onBeforeUnload = () => {
      // Send final batch before page unload
      if (pendingReads.current.size > 0) {
        sendBatchedReads.flush?.() || sendBatchedReads()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('beforeunload', onBeforeUnload)

    // Initial observation of existing elements
    onVisibilityChange()

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('beforeunload', onBeforeUnload)
      
      if (observer.current) {
        observer.current.disconnect()
        observer.current = null
      }
      
      // Send final batch on cleanup
      if (pendingReads.current.size > 0) {
        sendBatchedReads.flush?.() || sendBatchedReads()
      }
    }
  }, [sendBatchedReads, shouldMarkAsRead, messageEls])

  // Update observations when messages change
  useEffect(() => {
    if (observer.current && messageEls.current) {
      Object.values(messageEls.current).forEach(el => {
        if (el) {
          observer.current.observe(el)
        }
      })
    }
  }, [messages])

  return {
    pendingReads: pendingReads.current,
    observer: observer.current
  }
}