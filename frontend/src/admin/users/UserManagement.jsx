import { useState } from 'react'
import PendingApprovals from './PendingApprovals'
import UserList from './UserList'
import UserDetailsModal from './UserDetailsModal'
import './UserManagement.css'

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)

  const handleViewUser = (user) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const handleCloseModal = () => {
    setSelectedUser(null)
    setShowUserModal(false)
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h1>User Management</h1>
        <p>Manage user approvals, permissions, and account settings</p>
      </div>

      <div className="user-tabs">
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <span className="tab-icon">⧖</span>
          Pending Approvals
        </button>
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <span className="tab-icon">⚷</span>
          All Users
        </button>
      </div>

      <div className="user-content">
        {activeTab === 'pending' && (
          <PendingApprovals onViewUser={handleViewUser} />
        )}
        {activeTab === 'all' && (
          <UserList onViewUser={handleViewUser} />
        )}
      </div>

      {showUserModal && selectedUser && (
        <UserDetailsModal 
          user={selectedUser}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}