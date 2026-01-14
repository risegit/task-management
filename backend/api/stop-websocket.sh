#!/bin/bash

# WebSocket Server Stop Script

DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$DIR/websocket.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "PID file not found. Is the server running?"
    exit 1
fi

PID=$(cat "$PID_FILE")

if ps -p $PID > /dev/null 2>&1; then
    echo "Stopping WebSocket server (PID: $PID)..."
    kill $PID
    sleep 2
    
    if ps -p $PID > /dev/null 2>&1; then
        echo "Force stopping..."
        kill -9 $PID
    fi
    
    rm -f "$PID_FILE"
    echo "WebSocket server stopped"
else
    echo "No running process found with PID: $PID"
    rm -f "$PID_FILE"
fi