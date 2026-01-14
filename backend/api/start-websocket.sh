#!/bin/bash

# WebSocket Server Startup Script
# Place this in your backend/api directory

DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$DIR/websocket.log"
PID_FILE="$DIR/websocket.pid"
PHP_BIN="/usr/bin/php"  # Change this to your PHP path
PORT=8080
HOST="0.0.0.0"

# Get PHP path if not set
if ! command -v php &> /dev/null; then
    PHP_BIN="/usr/local/bin/php"
fi

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo "WebSocket server is already running (PID: $PID)"
        exit 1
    else
        echo "Removing stale PID file"
        rm -f "$PID_FILE"
    fi
fi

# Start server
echo "Starting WebSocket server on $HOST:$PORT..."
echo "Log file: $LOG_FILE"
echo "PID file: $PID_FILE"

nohup $PHP_BIN "$DIR/websocket-server-prod.php" >> "$LOG_FILE" 2>&1 &
WS_PID=$!

echo $WS_PID > "$PID_FILE"
echo "WebSocket server started with PID: $WS_PID"
echo "To stop: ./stop-websocket.sh"