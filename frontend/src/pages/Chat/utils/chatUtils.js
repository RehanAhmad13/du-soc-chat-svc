// src/utils/chatUtils.js
import dayjs from 'dayjs'

export const SLA_HOURS = 24

export function getTimeRemaining(createdAt) {
  const deadline = dayjs(createdAt).add(SLA_HOURS, 'hour')
  const now = dayjs()
  const diff = deadline.diff(now)

  if (diff <= 0) return { text: 'SLA Breached', status: 'breached' }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff / (1000 * 60)) % 60)

  return {
    text: `${hours}h ${minutes}m left`,
    status: hours < 2 ? 'critical' : hours < 6 ? 'warning' : 'good'
  }
}

export function getPriorityInfo(priority) {
  const priorities = {
    high: { label: 'High', color: '#dc3545' },
    medium: { label: 'Medium', color: '#fd7e14' },
    low: { label: 'Low', color: '#28a745' },
  }
  return priorities[priority] || priorities.medium
}

export function getStatusInfo(status) {
  const statuses = {
    active: { label: 'Active', color: '#007bff' },
    waiting: { label: 'Waiting', color: '#ffc107' },
    resolved: { label: 'Resolved', color: '#28a745' },
  }
  return statuses[status] || statuses.active
}

// Utility function for debouncing function calls
export function debounce(func, wait, immediate = false) {
  let timeout
  
  const debounced = function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }
  
  // Add flush method to execute immediately
  debounced.flush = function() {
    if (timeout) {
      clearTimeout(timeout)
      func()
      timeout = null
    }
  }
  
  return debounced
}

// Utility function for throttling function calls
export function throttle(func, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Format read receipt timestamp
export function formatReadTime(timestamp) {
  const now = dayjs()
  const readTime = dayjs(timestamp)
  
  if (now.diff(readTime, 'day') > 0) {
    return readTime.format('MMM D, h:mm A')
  } else if (now.diff(readTime, 'hour') > 0) {
    return readTime.format('h:mm A')
  } else {
    return readTime.fromNow()
  }
}
