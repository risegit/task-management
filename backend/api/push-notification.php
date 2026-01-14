<?php
// This file will be called when a new notification is created
// It sends the notification to the WebSocket server

include('../inc/config.php');

function sendToWebSocket($userId, $notification) {
    // WebSocket server URL
    $wsUrl = "http://localhost:8081/push"; // We'll create this endpoint
    
    $data = [
        'user_id' => $userId,
        'notification' => $notification,
        'secret' => 'YOUR_SECRET_KEY' // For security
    ];
    
    $options = [
        'http' => [
            'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
            'method'  => 'POST',
            'content' => http_build_query($data),
            'timeout' => 5 // 5 second timeout
        ]
    ];
    
    $context  = stream_context_create($options);
    $result = @file_get_contents($wsUrl, false, $context);
    
    return $result !== false;
}

// Example usage when creating a notification:
// sendToWebSocket($userId, [
//     'id' => $notificationId,
//     'message' => 'You have been assigned a new task',
//     'type' => 'task_assigned',
//     'sender_id' => $senderId,
//     'reference_id' => $taskId,
//     'created_date' => date('Y-m-d'),
//     'created_time' => date('H:i:s')
// ]);
?>