<?php
// HTTP endpoint to push notifications to WebSocket users
header('Content-Type: application/json');

// Simple security
$secret = $_POST['secret'] ?? $_GET['secret'] ?? '';
if ($secret !== 'YOUR_SECRET_KEY') {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$userId = $_POST['user_id'] ?? $_GET['user_id'] ?? null;
$notification = $_POST['notification'] ?? $_GET['notification'] ?? null;

if (!$userId || !$notification) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user_id or notification']);
    exit;
}

// Decode if notification is JSON string
if (is_string($notification)) {
    $notification = json_decode($notification, true);
}

// Try multiple methods to push to WebSocket

// Method 1: File-based queue (simplest for Windows)
$queueFile = __DIR__ . '/websocket_queue.json';

// Read existing queue
$queue = [];
if (file_exists($queueFile)) {
    $queue = json_decode(file_get_contents($queueFile), true) ?: [];
}

// Add new notification to queue
$queue[] = [
    'user_id' => $userId,
    'notification' => $notification,
    'timestamp' => time()
];

// Keep only last 100 items
if (count($queue) > 100) {
    $queue = array_slice($queue, -100);
}

// Save queue
file_put_contents($queueFile, json_encode($queue));

echo json_encode([
    'success' => true,
    'message' => 'Notification queued for WebSocket delivery',
    'method' => 'file_queue'
]);
?>