// notifications.js - Add service worker registration
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return false;
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return false;
  }
};

// Update showDesktopNotification to use service worker
export const showDesktopNotification = async (notification) => {
  // First try regular Notification API
  if (Notification.permission === "granted") {
    try {
      const notif = new Notification("🔔 Task Update", {
        body: notification.message,
        icon: '/favicon.ico',
        requireInteraction: true
      });
      
      notif.onclick = () => {
        window.focus();
        if (notification.reference_id) {
          window.open(
            `${import.meta.env.VITE_FRNT_URL}/dashboard/task-management/edit-task/${notification.reference_id}`,
            '_blank'
          );
        }
      };
      
      return;
    } catch (error) {
      console.log("Regular notification failed, trying service worker...");
    }
  }
  
  // Fallback to service worker
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      notification: {
        title: '🔔 Task Update',
        body: notification.message,
        data: {
          url: notification.reference_id 
            ? `${import.meta.env.VITE_FRNT_URL}/dashboard/task-management/edit-task/${notification.reference_id}`
            : '/'
        }
      }
    });
  }
};