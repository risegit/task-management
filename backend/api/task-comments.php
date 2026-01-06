<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include('../inc/config.php');

$method = $_SERVER['REQUEST_METHOD'];
$userId = $_GET['id'] ?? null;
$taskId = $_GET['task_id'] ?? null;

if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}

$date = date("Y-m-d");
$time = date("H:i:s");

/**
 * CHECK USER ACCESS TO TASK
 */
function hasTaskAccess($conn, $taskId, $userId) {
    $sql = "SELECT 1
            FROM tasks t
            LEFT JOIN task_assignees ta ON t.id = ta.task_id
            WHERE t.id = ?
              AND (t.created_by = ? OR ta.user_id = ?)
            LIMIT 1";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iii", $taskId, $userId, $userId);
    $stmt->execute();
    return $stmt->get_result()->num_rows > 0;
}

/**
 * BROADCAST TO WEBSOCKET
 */
function broadcastToWebSocket($data) {
    try {
        // Create WebSocket client to send message to WebSocket server
        $wsHost = '127.0.0.1';
        $wsPort = 8080;
        
        // Create a socket connection to the WebSocket server
        $socket = @socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
        if ($socket === false) {
            return false;
        }
        
        $result = @socket_connect($socket, $wsHost, $wsPort);
        if ($result === false) {
            socket_close($socket);
            return false;
        }
        
        // Send the message
        $message = json_encode($data);
        socket_write($socket, $message, strlen($message));
        socket_close($socket);
        
        return true;
    } catch (Exception $e) {
        error_log("WebSocket broadcast failed: " . $e->getMessage());
        return false;
    }
}

/**
 * SEND COMMENT NOTIFICATION VIA WEBSOCKET
 */
function sendCommentNotification($taskId, $commentId, $userId, $userName, $commentText, $parentId = null) {
    $data = [
        'type' => 'api_notification',
        'taskId' => $taskId,
        'comment' => [
            'id' => $commentId,
            'userId' => $userId,
            'userName' => $userName,
            'text' => $commentText,
            'timestamp' => date('c')
        ],
        'parentId' => $parentId
    ];
    
    broadcastToWebSocket($data);
}

/**
 * SEND COMMENT UPDATE NOTIFICATION
 */
function sendCommentUpdateNotification($taskId, $commentId, $newText) {
    $data = [
        'type' => 'api_comment_update',
        'taskId' => $taskId,
        'comment' => [
            'id' => $commentId,
            'text' => $newText
        ]
    ];
    
    broadcastToWebSocket($data);
}

/**
 * SEND COMMENT DELETE NOTIFICATION
 */
function sendCommentDeleteNotification($taskId, $commentId) {
    $data = [
        'type' => 'api_comment_delete',
        'taskId' => $taskId,
        'commentId' => $commentId
    ];
    
    broadcastToWebSocket($data);
}

switch ($method) {
    /* =======================
       GET TASK COMMENTS
       ======================= */
    case 'GET':
        if (!$taskId || !$userId) {
            echo json_encode(["status" => "error", "message" => "Task ID or User ID missing"]);
            exit;
        }

        if ($conn->connect_error) {
            echo json_encode(["status" => "error", "message" => "Database connection failed: " . $conn->connect_error]);
            exit;
        }

        if (!hasTaskAccess($conn, $taskId, $userId)) {
            echo json_encode(["status" => "error", "message" => "Access denied"]);
            exit;
        }

        $sql = "SELECT 
                    tc.id,
                    tc.task_id,
                    tc.parent_id,
                    tc.comment,
                    tc.created_date,
                    tc.created_time,
                    u.id AS user_id,
                    u.name,
                    u.profile_pic
                FROM task_comments tc
                INNER JOIN users u ON tc.user_id = u.id
                WHERE tc.task_id = ?
                ORDER BY tc.created_date ASC";

        $stmt = $conn->prepare($sql);
        
        if (!$stmt) {
            echo json_encode([
                "status" => "error", 
                "message" => "Database query preparation failed",
                "sql_error" => $conn->error
            ]);
            exit;
        }
        
        if (!$stmt->bind_param("i", $taskId)) {
            echo json_encode(["status" => "error", "message" => "Failed to bind parameters"]);
            exit;
        }
        
        if (!$stmt->execute()) {
            echo json_encode(["status" => "error", "message" => "Failed to execute query"]);
            exit;
        }
        
        $result = $stmt->get_result();
        
        if (!$result) {
            echo json_encode(["status" => "error", "message" => "Failed to get result set"]);
            exit;
        }

        $comments = [];
        while ($row = $result->fetch_assoc()) {
            $comments[] = $row;
        }

        echo json_encode(["status" => "success", "data" => $comments]);
        break;

    /* =======================
       ADD COMMENT / REPLY
       ======================= */
    case 'POST':
        $taskId = (int)($_POST['task_id'] ?? 0);
        $userId = (int)($_POST['user_id'] ?? 0);
        $comment = trim($_POST['comment'] ?? '');
        $parentId = $_POST['parent_id'] ?? null;
        
        if ($parentId === 'null' || $parentId === '' || $parentId === null) {
            $parentId = null;
        } else {
            $parentId = (int)$parentId;
        }
        
        if (!$taskId || !$userId || !$comment) {
            echo json_encode(["status" => "error", "message" => "Invalid data"]);
            exit;
        }

        if (!hasTaskAccess($conn, $taskId, $userId)) {
            echo json_encode(["status" => "error", "message" => "Access denied"]);
            exit;
        }

        // Get user name for notification
        $userSql = "SELECT name FROM users WHERE id = ?";
        $userStmt = $conn->prepare($userSql);
        $userStmt->bind_param("i", $userId);
        $userStmt->execute();
        $userResult = $userStmt->get_result();
        $userRow = $userResult->fetch_assoc();
        $userName = $userRow['name'] ?? 'User';

        if ($parentId === null) {
            $sql = "INSERT INTO task_comments (task_id, user_id, parent_id, comment, created_date, created_time) 
                    VALUES (?, ?, NULL, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("iisss", $taskId, $userId, $comment, $date, $time);
        } else {
            $sql = "INSERT INTO task_comments (task_id, user_id, parent_id, comment, created_date, created_time) 
                    VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("iiisss", $taskId, $userId, $parentId, $comment, $date, $time);
        }
        
        if ($stmt->execute()) {
            $commentId = $stmt->insert_id;
            
            // Send WebSocket notification
            sendCommentNotification($taskId, $commentId, $userId, $userName, $comment, $parentId);
            
            echo json_encode([
                "status" => "success",
                "comment_id" => $commentId
            ]);
        } else {
            echo json_encode([
                "status" => "error", 
                "message" => "Database error: " . $stmt->error
            ]);
        }
        break;

    /* =======================
       EDIT COMMENT
       ======================= */
    case 'PUT':
        parse_str(file_get_contents("php://input"), $putData);
        $commentId = $_GET['comment_id'] ?? null;
        $comment = trim($putData['comment'] ?? '');

        if (!$commentId || !$comment) {
            echo json_encode(["status" => "error", "message" => "Invalid request"]);
            exit;
        }

        // Get task ID and user ID for the comment
        $infoSql = "SELECT task_id, user_id FROM task_comments WHERE id = ?";
        $infoStmt = $conn->prepare($infoSql);
        $infoStmt->bind_param("i", $commentId);
        $infoStmt->execute();
        $infoResult = $infoStmt->get_result();
        $infoRow = $infoResult->fetch_assoc();
        
        if (!$infoRow) {
            echo json_encode(["status" => "error", "message" => "Comment not found"]);
            exit;
        }

        $taskId = $infoRow['task_id'];
        $commentUserId = $infoRow['user_id'];

        // Check if user owns the comment
        if ($commentUserId != $userId) {
            echo json_encode(["status" => "error", "message" => "Access denied"]);
            exit;
        }

        $sql = "UPDATE task_comments 
                SET comment = ?, updated_at = NOW()
                WHERE id = ?";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $comment, $commentId);
        
        if ($stmt->execute()) {
            // Send WebSocket notification
            sendCommentUpdateNotification($taskId, $commentId, $comment);
            
            echo json_encode(["status" => "success"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Update failed"]);
        }
        break;

    /* =======================
       DELETE COMMENT
       ======================= */
    case 'DELETE':
        $commentId = $_GET['comment_id'] ?? null;

        if (!$commentId) {
            echo json_encode(["status" => "error", "message" => "Comment ID missing"]);
            exit;
        }

        // Get task ID for the comment
        $infoSql = "SELECT task_id, user_id FROM task_comments WHERE id = ?";
        $infoStmt = $conn->prepare($infoSql);
        $infoStmt->bind_param("i", $commentId);
        $infoStmt->execute();
        $infoResult = $infoStmt->get_result();
        $infoRow = $infoResult->fetch_assoc();
        
        if (!$infoRow) {
            echo json_encode(["status" => "error", "message" => "Comment not found"]);
            exit;
        }

        $taskId = $infoRow['task_id'];
        $commentUserId = $infoRow['user_id'];

        // Check if user owns the comment
        if ($commentUserId != $userId) {
            echo json_encode(["status" => "error", "message" => "Access denied"]);
            exit;
        }

        $sql = "DELETE FROM task_comments WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $commentId);
        
        if ($stmt->execute()) {
            // Send WebSocket notification
            sendCommentDeleteNotification($taskId, $commentId);
            
            echo json_encode(["status" => "success"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Delete failed"]);
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Invalid request method"]);
        break;
}