class WebSocketManager {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.isConnected = false;
    this.heartbeatInterval = null;
  }

  connect(userId) {
    if (!userId) {
      console.error('WebSocket: User ID required');
      return;
    }

    // Check if already connected to same user
    if (this.socket && this.userId === userId) {
      const state = this.socket.readyState;
      const states = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
      
      console.log(`WebSocket: Already connected to user ${userId}, state: ${states[state]}`);
      
      if (state === WebSocket.OPEN) {
        return; // Already connected and open
      } else if (state === WebSocket.CONNECTING) {
        console.log('WebSocket: Still connecting, waiting...');
        return;
      }
      // If closing or closed, continue to create new connection
    }

    // Close existing connection if different user
    if (this.socket && this.userId !== userId) {
      console.log(`WebSocket: Switching from user ${this.userId} to ${userId}`);
      this.disconnect();
    }

    this.userId = userId;
    
    // Try different ports if 8080 doesn't work
    const ports = [8080, 8082, 8083, 8085];
    let connected = false;
    
    for (const port of ports) {
      if (connected) break;
      
      const wsUrl = `ws://localhost:${port}?user_id=${userId}`;
      console.log(`WebSocket: Trying ${wsUrl}`);
      
      try {
        this.socket = new WebSocket(wsUrl);
        connected = true;
        
        this.socket.onopen = () => {
          console.log(`✅ WebSocket: Connected successfully on port ${port}`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connected');
          
          // Send initial ping
          setTimeout(() => {
            this.send({ type: 'ping' });
          }, 1000);
        };
        
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 WebSocket received:', data);
            
            if (data.type === 'pong') {
              // Heartbeat response, do nothing
              return;
            }
            
            if (data.type === 'notification') {
              this.emit('notification', data.data || data);
            }
            
            // Forward all messages
            this.emit('message', data);
          } catch (error) {
            console.error('WebSocket: Error parsing message:', error);
          }
        };
        
        this.socket.onerror = (error) => {
          console.error('❌ WebSocket: Connection error:', error);
          this.emit('error', error);
        };
        
        this.socket.onclose = (event) => {
          console.log(`⚠️ WebSocket: Disconnected (code: ${event.code}, reason: ${event.reason || 'No reason'})`);
          this.isConnected = false;
          this.stopHeartbeat();
          this.emit('disconnected', event);
          
          // Attempt reconnection
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts);
            console.log(`WebSocket: Reconnecting in ${Math.round(delay/1000)}s (attempt ${this.reconnectAttempts + 1})`);
            
            setTimeout(() => {
              this.reconnectAttempts++;
              this.connect(this.userId);
            }, delay);
          }
        };
        
      } catch (error) {
        console.log(`WebSocket: Port ${port} failed: ${error.message}`);
        continue;
      }
    }
    
    if (!connected) {
      console.error('WebSocket: Could not connect on any port');
      this.emit('error', new Error('Connection failed on all ports'));
    }
  }

  startHeartbeat() {
    // Clear existing interval
    this.stopHeartbeat();
    
    // Send ping every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
        console.log('💓 WebSocket: Heartbeat ping sent');
      }
    }, 30000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        const jsonData = JSON.stringify(data);
        this.socket.send(jsonData);
        console.log('📤 WebSocket sent:', data);
        return true;
      } catch (error) {
        console.error('WebSocket: Error sending data:', error);
        return false;
      }
    }
    console.warn('WebSocket: Cannot send - connection not open');
    return false;
  }

  disconnect() {
    this.stopHeartbeat();
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.userId = null;
    console.log('WebSocket: Disconnected');
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`WebSocket: Error in ${event} listener:`, error);
        }
      });
    }
  }
}

// ✅ CREATE THE INSTANCE HERE - This was missing!
const websocket = new WebSocketManager();

// Export for debugging in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Assign immediately and also set up a delayed assignment for safety
  window.__websocket = websocket;
  
  // Also set up a delayed assignment in case components load before this
  setTimeout(() => {
    window.__websocket = websocket;
    console.log('🌐 WebSocket instance available globally as window.__websocket');
  }, 100);
}

export default websocket;