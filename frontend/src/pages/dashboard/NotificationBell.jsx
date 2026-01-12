import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { showDesktopNotification } from "../../utils/notifications";
import { playNotificationSound } from "@/utils/notificationSound";
import { Bell, Check, Clock, User } from "lucide-react";

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const sseRef = useRef(null);
  const hasSetupSSERef = useRef(false);

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

  /* ---------------- FETCH NOTIFICATIONS ---------------- */
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}api/notifications.php?user_id=${userId}`
      );
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, [userId]);

  /* ---------------- INITIAL FETCH & POLLING ---------------- */
  useEffect(() => {
    if (!userId) return;
    
    // Initial fetch
    fetchNotifications();
    
    // Set up polling every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [userId, fetchNotifications]);

  /* ---------------- REAL-TIME SSE CONNECTION ---------------- */
  useEffect(() => {
    console.log("🔄 SSE useEffect triggered, userId:", userId);
    
    // Skip if no userId or notification permission not granted
    if (!userId || Notification.permission !== "granted") {
      console.log("❌ SSE: Skipping - missing userId or permission");
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
        hasSetupSSERef.current = false;
      }
      return;
    }

    // Prevent multiple SSE connections
    if (hasSetupSSERef.current) {
      console.log("⚠️ SSE: Already initialized, skipping");
      return;
    }

    console.log("🚀 SSE: Creating connection for user:", userId);
    
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}api/notification-stream.php?user_id=${userId}`
    );
    
    sseRef.current = eventSource;
    hasSetupSSERef.current = true;

    eventSource.onopen = () => {
      console.log("✅ SSE: Connection established");
    };

    eventSource.onmessage = (event) => {
      try {
        console.log("📨 SSE: Raw data received:", event.data);
        const notification = JSON.parse(event.data);
        console.log("📊 SSE: Parsed notification:", notification);
        
        // Update notifications list
        setNotifications(prev => [notification, ...prev]);
        
        // Play sound
        playNotificationSound();
        
        // Show desktop notification
        console.log("🔔 SSE: Calling showDesktopNotification");
        showDesktopNotification(notification);
        
      } catch (err) {
        console.error("❌ SSE: Error parsing notification:", err);
      }
    };

    eventSource.onerror = (error) => {
      console.error("⚠️ SSE: Connection error:", error);
      eventSource.close();
      sseRef.current = null;
      hasSetupSSERef.current = false;
      
      // Try to reconnect after 5 seconds
      setTimeout(() => {
        if (userId && Notification.permission === "granted") {
          console.log("🔄 SSE: Attempting to reconnect...");
          hasSetupSSERef.current = false; // Reset flag to allow reconnection
        }
      }, 5000);
    };

    // Cleanup only on unmount
    return () => {
      console.log("🧹 SSE: Component unmounting, closing connection");
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
        hasSetupSSERef.current = false;
      }
    };
  }, [userId]); // Only depend on userId

  /* ---------------- MARK AS READ FUNCTIONS ---------------- */
  const markRead = async (id) => {
    await axios.post(
      `${import.meta.env.VITE_API_URL}api/notifications.php`,
      { action: "mark_read", notification_id: id }
    );
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, is_read: 1 } : n
      )
    );
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

  /* ---------------- RENDER ---------------- */
  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
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
                  key={n.id}
                  style={{
                    padding: "16px 20px",
                    borderBottom: index === notifications.length - 1 ? "none" : "1px solid #f3f4f6",
                    background: n.is_read == 0 ? "#f0f9ff" : "white",
                    cursor: "pointer",
                    transition: "background 0.2s ease",
                    position: "relative",
                    borderLeft: n.is_read == 0 ? "3px solid #3b82f6" : "3px solid transparent"
                  }}
                  onClick={() => markRead(n.id)}
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
                          {n.sender_name}
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
                        </small>
                      </div>
                      <p style={{ 
                        margin: "6px 0 0", 
                        fontSize: "14px", 
                        color: "#374151",
                        lineHeight: "1.4"
                      }}>
                        {n.message}
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