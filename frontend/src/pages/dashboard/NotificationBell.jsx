import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { showDesktopNotification } from "../../utils/notifications";
import { playNotificationSound } from "@/utils/notificationSound";
import { Bell, Check, Clock, User } from "lucide-react";
import { Navigate,useNavigate } from "react-router-dom";

// Simple function to get websocket instance
const getWebsocket = async () => {
  // Try to get from window first (for testing)
  if (typeof window !== 'undefined' && window.__websocket) {
    console.log('Using window.__websocket instance');
    return window.__websocket;
  }
  
  // Otherwise import it dynamically
  try {
    const module = await import("../../utils/websocket");
    console.log('Dynamically loaded websocket module');
    return module.default;
  } catch (error) {
    console.error('Failed to load websocket module:', error);
    throw error;
  }
};

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const wsInitializedRef = useRef(false);
  const wsListenersRef = useRef([]);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => n.is_read == 0).length;

  // Enhanced time formatting function
  const formatTime = (dateString, timeString) => {
    if (!dateString && !timeString) return "N/A";
    
    const dateTimeStr = `${dateString} ${timeString}`;
    const notificationDate = new Date(dateTimeStr);
    
    if (isNaN(notificationDate.getTime())) {
      return "Invalid date";
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);
    
    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return notificationDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Format date for tooltip or detailed view
  const formatDetailedDateTime = (dateString, timeString) => {
    if (!dateString && !timeString) return "N/A";
    
    const dateTimeStr = `${dateString} ${timeString}`;
    const date = new Date(dateTimeStr);
    
    if (isNaN(date.getTime())) return "Invalid date";
    
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ---------------- WEB SOCKET CONNECTION ---------------- */
  // useEffect(() => {
  //   console.log("🔄 WebSocket useEffect triggered, userId:", userId);
    
  //   if (!userId) {
  //     console.log("❌ WebSocket: No userId provided");
  //     return;
  //   }

  //   const initWebSocket = async () => {
  //     try {
  //       const websocket = await getWebsocket();
  //       console.log('WebSocket instance:', websocket);
  //       console.log('WebSocket connect function exists:', typeof websocket.connect);
        
  //       if (!websocket || typeof websocket.connect !== 'function') {
  //         console.error('❌ Invalid websocket instance:', websocket);
  //         return;
  //       }
        
  //       // Connect WebSocket
  //       websocket.connect(userId);

  //       // Listen for notifications
  //       const unsubscribeNotification = websocket.on('notification', (notification) => {
  //         console.log("📨 WebSocket: Notification received:", notification);
          
  //         // Update notifications list
  //         setNotifications(prev => [notification.data || notification, ...prev]);
          
  //         // Play sound
  //         playNotificationSound();
          
  //         // Show desktop notification
  //         console.log("🔔 WebSocket: Calling showDesktopNotification");
  //         showDesktopNotification(notification.data || notification);
  //       });

  //       // Listen for connection events
  //       const unsubscribeConnected = websocket.on('connected', () => {
  //         console.log("✅ WebSocket: Connected event received");
  //         wsInitializedRef.current = true;
  //       });

  //       const unsubscribeDisconnected = websocket.on('disconnected', () => {
  //         console.log("⚠️ WebSocket: Disconnected event received");
  //         wsInitializedRef.current = false;
  //       });

  //       // Listen for messages (for debugging)
  //       const unsubscribeMessage = websocket.on('message', (data) => {
  //         console.log("📨 WebSocket raw message:", data);
  //       });

  //       // Store unsubscribe functions
  //       wsListenersRef.current = [
  //         unsubscribeNotification,
  //         unsubscribeConnected,
  //         unsubscribeDisconnected,
  //         unsubscribeMessage
  //       ];

  //       console.log('✅ WebSocket initialized successfully');

  //     } catch (error) {
  //       console.error("❌ Failed to initialize WebSocket:", error);
  //     }
  //   };

  //   initWebSocket();

  //   // Cleanup on unmount
  //   return () => {
  //     console.log('🧹 Cleaning up WebSocket listeners');
  //     // Remove all listeners
  //     wsListenersRef.current.forEach(unsubscribe => {
  //       if (typeof unsubscribe === 'function') {
  //         unsubscribe();
  //       }
  //     });
  //     wsListenersRef.current = [];
  //   };
  // }, [userId]);

  /* ---------------- FETCH NOTIFICATIONS (ONLY ON MOUNT) ---------------- */
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}api/notifications.php?user_id=${userId}`
      );
      console.log("notification=", res);
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    // Remove polling - WebSocket will handle real-time updates
  }, [fetchNotifications]);

  /* ---------------- MARK AS READ FUNCTIONS ---------------- */
  const markRead = async (id,reference_id) => {
    await axios.post(
      `${import.meta.env.VITE_API_URL}api/notifications.php`,
      { action: "mark_read", notification_id: id }
    );
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, is_read: 1 } : n
      )
    );
    // navigate(`/dashboard/task-management/edit-task/${id}`);
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => n.is_read == 0).map(n => n.id);
    if (unreadIds.length === 0) return;
    
    await Promise.all(
      unreadIds.map(id => 
        axios.post(
          `${import.meta.env.VITE_API_URL}api/notifications.php`,
          { action: "mark_read", notification_id: id }
        )
      )
    );
    
    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: 1 }))
    );
  };

  /* ---------------- TEST WEBSOCKET FUNCTIONS ---------------- */
  const testWebSocket = async () => {
    try {
      console.log('Testing WebSocket connection...');
      
      // Get websocket instance
      const websocket = await getWebsocket();
      
      if (!websocket) {
        console.error('WebSocket instance not found');
        return;
      }
      
      console.log('WebSocket instance:', websocket);
      console.log('WebSocket isConnected:', websocket.isConnected);
      console.log('WebSocket userId:', websocket.userId);
      
      // Test 1: Send ping
      const pingSent = websocket.send({type: 'ping'});
      console.log('Ping sent:', pingSent);
      
      // Test 2: Send test notification request
      setTimeout(() => {
        websocket.send({type: 'test_notification'});
        console.log('Test notification request sent');
      }, 500);
      
    } catch (error) {
      console.error('Error testing WebSocket:', error);
    }
  };

  // Add a direct test function
  const testDirectWebSocket = () => {
    console.log('Testing direct WebSocket connection...');
    
    const testWs = new WebSocket('ws://localhost:8080?user_id=' + userId);
    
    testWs.onopen = () => {
      console.log('✅ Direct test: WebSocket connected');
      testWs.send(JSON.stringify({type: 'ping'}));
      
      setTimeout(() => {
        testWs.send(JSON.stringify({type: 'test_notification'}));
        console.log('Direct test: Test notification sent');
      }, 1000);
    };
    
    testWs.onmessage = (e) => {
      console.log('✅ Direct test received:', e.data);
    };
    
    testWs.onerror = (e) => {
      console.error('❌ Direct test error:', e);
    };
    
    testWs.onclose = (e) => {
      console.log('Direct test closed:', e.code, e.reason);
    };
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "flex", alignItems: "center", gap: "8px" }}>
      {/* Direct Test Button */}
      {/* <button 
        onClick={testDirectWebSocket}
        style={{
          padding: "6px 12px",
          background: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: "500"
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2563eb"}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#3b82f6"}
        title="Test direct WebSocket connection"
      >
        Test Direct
      </button> */}

      {/* Test WebSocket Button */}
      {/* <button 
        onClick={testWebSocket}
        style={{
          padding: "6px 12px",
          background: "#10b981",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: "500"
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#059669"}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#10b981"}
        title="Test WebSocket connection"
      >
        Test WS
      </button> */}

      {/* Notification Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "relative",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
          backgroundColor: open ? "rgba(59, 130, 246, 0.1)" : "transparent"
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.1)"}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = open ? "rgba(59, 130, 246, 0.1)" : "transparent"}
        title="Notifications"
      >
        <Bell size={22} strokeWidth={1.5} style={{ color: "#4b5563" }} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              background: "#ef4444",
              color: "white",
              fontSize: "12px",
              fontWeight: "bold",
              minWidth: "18px",
              height: "18px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              border: "2px solid white"
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "380px",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 10px rgba(0, 0, 0, 0.06)",
            border: "1px solid #e5e7eb",
            maxHeight: "500px",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
            overflow: "hidden"
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #f3f4f6",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#f9fafb"
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontWeight: 600, fontSize: "16px", color: "#111827" }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#6b7280" }}>
                  {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#3b82f6",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <Check size={14} />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: "#9ca3af" }}>
                <Bell size={48} strokeWidth={1.2} style={{ marginBottom: "12px", opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: 500 }}>No notifications</p>
                <p style={{ margin: "4px 0 0", fontSize: "14px" }}>
                  You're all caught up!
                </p>
              </div>
            ) : (
              notifications.map((n, index) => (
                <div
                  key={n.id || index}
                  style={{
                    padding: "16px 20px",
                    borderBottom: index === notifications.length - 1 ? "none" : "1px solid #f3f4f6",
                    background: n.is_read == 0 ? "#f0f9ff" : "white",
                    cursor: "pointer",
                    transition: "background 0.2s ease",
                    position: "relative",
                    borderLeft: n.is_read == 0 ? "3px solid #3b82f6" : "3px solid transparent"
                  }}
                  onClick={() => n.id && markRead(n.id,n.reference_id)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = n.is_read == 0 ? "#e0f2fe" : "#f9fafb"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = n.is_read == 0 ? "#f0f9ff" : "white"}
                >
                  {/* Unread indicator */}
                  {n.is_read == 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "18px",
                        left: "8px",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#3b82f6"
                      }}
                    />
                  )}

                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    {/* Avatar/Sender Icon */}
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: n.is_read == 0 ? "#3b82f6" : "#6b7280",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <User size={18} strokeWidth={2} style={{ color: "white" }} />
                    </div>

                    {/* Notification Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <strong style={{ 
                          fontSize: "14px", 
                          color: "#111827",
                          fontWeight: n.is_read == 0 ? 600 : 500
                        }}>
                          {n.sender_name || 'System'}
                        </strong>
                        <small 
                          style={{ 
                            fontSize: "12px", 
                            color: "#9ca3af", 
                            whiteSpace: "nowrap",
                            cursor: "help"
                          }}
                          title={formatDetailedDateTime(n.created_date, n.created_time)}
                        >
                          <Clock size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                          {formatTime(n.created_date, n.created_time)}
                          {/* <br/>{n.reference_id} */}
                        </small>
                      </div>
                      <p style={{ 
                        margin: "6px 0 0", 
                        fontSize: "14px", 
                        color: "#374151",
                        lineHeight: "1.4"
                      }}>
                        {n.message || 'New notification'}
                      </p>
                      
                      {/* Status Badge */}
                      <div style={{ 
                        display: "inline-block", 
                        marginTop: "8px",
                        padding: "2px 8px", 
                        borderRadius: "12px", 
                        fontSize: "12px", 
                        fontWeight: 500,
                        background: n.is_read == 0 ? "#dbeafe" : "#f3f4f6",
                        color: n.is_read == 0 ? "#1e40af" : "#6b7280"
                      }}>
                        {n.is_read == 0 ? "Unread" : "Read"}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid #f3f4f6",
              background: "#f9fafb",
              textAlign: "center"
            }}
          >
            <button
              onClick={fetchNotifications}
              style={{
                background: "transparent",
                border: "none",
                color: "#6b7280",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                padding: "6px 12px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                margin: "0 auto"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e5e7eb"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              Refresh notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}