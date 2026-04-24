import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bell, X, MessageSquare, Calendar, CheckCircle, Info } from 'lucide-react';

const NotificationCenter = ({ token, username, onTaskClick, lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const API_URL = 'http://127.0.0.1:5001/api';

  const fetchNotifications = React.useCallback(async () => {
    if (!token || !username) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/notifications`, {
        params: { recipient: username },
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.notifications.filter(n => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [token, username]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (isMounted) {
        await fetchNotifications();
      }
    };
    loadData();
    const handleWsNotify = () => fetchNotifications();
    window.addEventListener('ws-notification', handleWsNotify);
    return () => {
      isMounted = false;
      window.removeEventListener('ws-notification', handleWsNotify);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'comment': return <MessageSquare size={14} className="text-primary" />;
      case 'assignment': return <Calendar size={14} className="text-warning" />;
      case 'status': return <CheckCircle size={14} className="text-success" />;
      default: return <Info size={14} className="text-muted" />;
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return lang === 'tr' ? 'Az önce' : 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + (lang === 'tr' ? ' dk önce' : 'm ago');
    if (diff < 86400) return Math.floor(diff / 3600) + (lang === 'tr' ? ' sa önce' : 'h ago');
    return date.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US');
  };

  return (
    <div className="notification-center-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      <div className="toolbar-btn" onClick={toggleDropdown} style={{ position: 'relative' }}>
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-badge" style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            backgroundColor: 'var(--danger)',
            color: 'white',
            fontSize: '9px',
            fontWeight: 'bold',
            borderRadius: '50%',
            width: '14px',
            height: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--bg-topbar)'
          }}>
            {unreadCount}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="notification-dropdown" style={{
          position: 'absolute',
          top: '40px',
          right: '0',
          width: '320px',
          maxHeight: '450px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div className="dropdown-header" style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: '700', fontSize: '13px' }}>{lang === 'tr' ? 'Bildirimler' : 'Notifications'}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}>{lang === 'tr' ? 'Tümünü okundu işaretle' : 'Mark all as read'}</span>
          </div>

          <div className="dropdown-body" style={{ overflowY: 'auto', flex: 1 }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                {lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                <Bell size={32} style={{ marginBottom: '12px', opacity: 0.2 }} />
                <p>{lang === 'tr' ? 'Henüz bildirim yok' : 'No notifications yet'}</p>
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n._id} 
                  className={`notification-item ${!n.read ? 'unread' : ''}`}
                  onClick={() => {
                    if (n.taskId) onTaskClick({ id: n.taskId, title: n.taskTitle });
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '12px',
                    transition: 'background 0.2s',
                    backgroundColor: n.read ? 'transparent' : 'rgba(123, 104, 238, 0.05)'
                  }}
                >
                  <div className="notif-icon" style={{ marginTop: '2px' }}>
                    {getIcon(n.type)}
                  </div>
                  <div className="notif-content" style={{ flex: 1 }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: '4px', lineHeight: '1.4' }}>{n.message}</p>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{formatTime(n.createdAt)}</span>
                  </div>
                  {!n.read && (
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary)', marginTop: '6px' }} />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="dropdown-footer" style={{
            padding: '10px',
            textAlign: 'center',
            borderTop: '1px solid var(--border-muted)',
            background: 'rgba(0,0,0,0.1)'
          }}>
             <button style={{ 
               background: 'none', 
               border: 'none', 
               color: 'var(--primary)', 
               fontSize: '11px', 
               fontWeight: '600', 
               cursor: 'pointer' 
             }}>
               {lang === 'tr' ? 'Tümünü Gör' : 'View All'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
