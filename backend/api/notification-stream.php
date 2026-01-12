<?php
header("Content-Type: text/event-stream");
header("Cache-Control: no-cache");
header("Connection: keep-alive");
header("X-Accel-Buffering: no"); // Important for Nginx

include('../inc/config.php');

$userId = $_GET['user_id'] ?? 0;

if (!$userId) {
    echo "data: " . json_encode(["error" => "Invalid user"]) . "\n\n";
    ob_flush();
    flush();
    exit;
}

// Get the current maximum notification ID for this user
$initQuery = $conn->query("SELECT MAX(id) as max_id FROM notifications WHERE user_id = '$userId'");
$initResult = $initQuery->fetch_assoc();
$lastId = $initResult['max_id'] ?? 0;

// Set a longer timeout for SSE
set_time_limit(300); // 5 minutes

while (true) {
    // Check if client is still connected
    if (connection_aborted()) {
        exit;
    }

    $sql = "SELECT id, message, type, user_id, reference_id, is_read, created_date, created_time 
            FROM notifications 
            WHERE user_id = '$userId' 
            AND is_read = 0 
            AND id > $lastId 
            ORDER BY id ASC"; // Use ASC to get in correct order

    $result = $conn->query($sql);
    
    $newMaxId = $lastId;
    $hasNew = false;
    
    while ($row = $result->fetch_assoc()) {
        $newMaxId = max($newMaxId, $row['id']);
        $hasNew = true;
        
        echo "id: {$row['id']}\n";
        echo "data: " . json_encode($row) . "\n\n";
        ob_flush();
        flush();
    }
    
    // Update lastId whether we found new notifications or not
    $lastId = $newMaxId;
    
    // Only sleep if no new notifications were found
    if (!$hasNew) {
        sleep(2);
    }
    
    // Clear any output buffers
    if (ob_get_level() > 0) {
        ob_end_flush();
    }
}
?>