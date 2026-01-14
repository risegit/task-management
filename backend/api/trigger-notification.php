<?php
// Test script to create and send a notification
header('Content-Type: application/json');

include('../inc/config.php');

$userId = $_GET['user_id'] ?? 2;
$message = $_GET['message'] ?? 'Test notification triggered via PHP';

// Create notification in database (optional)
$sql = "INSERT INTO notifications (message, type, user_id, sender_id, reference_id, is_read, created_date, created_time) 
        VALUES ('$message', 'task_assigned', '$userId', 1, 123, 0, CURDATE(), CURTIME())";
$conn->query($sql);

$notificationId = $conn->insert_id;

// Fetch the notification
$query = "SELECT n.*, u.name as sender_name 
          FROM notifications n 
          LEFT JOIN users u ON n.sender_id = u.id 
          WHERE n.id = $notificationId";
$result = $conn->query($query);
$notification = $result->fetch_assoc();

// Try to send via WebSocket
function sendViaWebSocket($userId, $notification) {
    try {
        $context = stream_context_create([
            'socket' => [
                'bindto' => '0:0',
            ],
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
            ]
        ]);
        
        $fp = stream_socket_client("tcp://127.0.0.1:8080", $errno, $errstr, 5, STREAM_CLIENT_CONNECT, $context);
        
        if (!$fp) {
            return ['success' => false, 'error' => "Failed to connect: $errstr ($errno)"];
        }
        
        // Create WebSocket handshake (simplified)
        $key = base64_encode(random_bytes(16));
        $headers = "GET /?user_id=$userId HTTP/1.1\r\n" .
                   "Host: localhost\r\n" .
                   "Upgrade: websocket\r\n" .
                   "Connection: Upgrade\r\n" .
                   "Sec-WebSocket-Key: $key\r\n" .
                   "Sec-WebSocket-Version: 13\r\n\r\n";
        
        fwrite($fp, $headers);
        fread($fp, 1024); // Read handshake response
        
        // Send notification
        $wsMessage = json_encode([
            'type' => 'notification',
            'data' => $notification
        ]);
        
        fwrite($fp, $wsMessage);
        fclose($fp);
        
        return ['success' => true, 'message' => 'Notification sent via WebSocket'];
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

$result = sendViaWebSocket($userId, $notification);

echo json_encode([
    'success' => true,
    'notification' => $notification,
    'websocket_result' => $result,
    'message' => 'Test notification created'
], JSON_PRETTY_PRINT);
?>