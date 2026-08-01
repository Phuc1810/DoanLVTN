import { useState, useEffect, useRef } from 'react'
import { Bell, Check, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import notificationApi from '../../api/notificationApi'

function timeAgo(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const seconds = Math.floor((new Date() - date) / 1000)
  
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + ' năm trước'
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + ' tháng trước'
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + ' ngày trước'
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + ' giờ trước'
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + ' phút trước'
  return Math.floor(seconds) + ' giây trước'
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getNotifications()
      if (res && res.notifications) {
        setNotifications(res.notifications || [])
        setUnreadCount(res.unread_count || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation()
    try {
      await notificationApi.markAllAsRead()
      setUnreadCount(0)
      setNotifications(notifications.map(n => ({ ...n, read_at: new Date().toISOString() })))
    } catch (error) {
      console.error('Failed to mark all as read', error)
    }
  }

  const handleNotificationClick = async (notification) => {
    setIsOpen(false)
    if (!notification.read_at) {
      try {
        await notificationApi.markAsRead(notification.id)
        setUnreadCount(prev => Math.max(0, prev - 1))
        setNotifications(notifications.map(n => 
          n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
        ))
      } catch (error) {
        console.error('Failed to mark as read', error)
      }
    }
    
    // Navigate based on data link
    if (notification.data?.link) {
      navigate(notification.data.link)
    }
  }

  return (
    <div className="notification-dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        className={`action-btn ${unreadCount > 0 ? 'has-dot' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative' }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-menu">
          <div className="notification-header">
            <h3>Thông báo</h3>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
                <Check size={16} style={{ marginRight: '4px' }} /> Đánh dấu đã đọc
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">Không có thông báo nào.</div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.read_at
                return (
                  <div 
                    key={notif.id} 
                    className={`notification-item ${isUnread ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="notif-content">
                      <div className="notif-title">{notif.data.title}</div>
                      <div className="notif-message">{notif.data.message}</div>
                      <div className="notif-time">
                        <Clock size={12} style={{ marginRight: '4px' }} />
                        {timeAgo(notif.created_at)}
                      </div>
                    </div>
                    {isUnread && <div className="notif-unread-dot"></div>}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      <style>{`
        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 5px;
          border-radius: 10px;
          border: 2px solid #fff;
          line-height: 1;
        }
        .notification-dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 10px;
          width: 360px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          z-index: 1000;
          overflow: hidden;
          border: 1px solid #eee;
        }
        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #f0f0f0;
        }
        .notification-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
        }
        .mark-all-btn {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .mark-all-btn:hover {
          background: #eff6ff;
        }
        .notification-list {
          max-height: 320px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .notification-list::-webkit-scrollbar {
          width: 6px;
        }
        .notification-list::-webkit-scrollbar-track {
          background: transparent;
        }
        .notification-list::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
        .notification-empty {
          padding: 30px;
          text-align: center;
          color: #888;
          font-size: 14px;
        }
        .notification-item {
          display: flex;
          align-items: flex-start;
          padding: 12px 16px;
          border-bottom: 1px solid #f5f5f5;
          cursor: pointer;
          transition: background 0.2s;
        }
        .notification-item:hover {
          background: #f9f9f9;
        }
        .notification-item.unread {
          background: #f0f7ff;
        }
        .notification-item.unread:hover {
          background: #e6f0fa;
        }
        .notif-content {
          flex: 1;
        }
        .notif-title {
          font-weight: 600;
          font-size: 14px;
          color: #1a1a1a;
          margin-bottom: 4px;
        }
        .notif-message {
          font-size: 13px;
          color: #4b5563;
          margin-bottom: 6px;
          line-height: 1.4;
        }
        .notif-time {
          display: flex;
          align-items: center;
          font-size: 12px;
          color: #3b82f6;
          font-weight: 500;
        }
        .notif-unread-dot {
          width: 10px;
          height: 10px;
          background: #3b82f6;
          border-radius: 50%;
          margin-left: 12px;
          margin-top: 4px;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  )
}
