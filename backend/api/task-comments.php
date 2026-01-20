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

date_default_timezone_set('Asia/Kolkata');
$date = date("Y-m-d");
$time = date("H:i:s");

/* =======================
   CHECK IF USER IS ADMIN
   ======================= */
function isAdmin($conn, $userId) {
    if (!$userId) return false;
    
    $sql = "SELECT role FROM users WHERE id = ? LIMIT 1";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        return false;
    }
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result && $row = $result->fetch_assoc()) {
        return isset($row['role']) && strtolower($row['role']) === 'admin';
    }
    return false;
}

/* =======================
   CHECK TASK ACCESS - UPDATED FOR POC
   ======================= */
function hasTaskAccess($conn, $taskId, $userId) {
    if (!$taskId || !$userId) {
        return false;
    }

    // ✅ ADMIN CAN ACCESS ANY TASK
    if (isAdmin($conn, $userId)) {
        return true;
    }

    // Check if user is directly assigned to the task or created the task
    $sql = "SELECT 1 FROM tasks t
            LEFT JOIN task_assignees ta ON t.id = ta.task_id
            WHERE t.id = ?
            AND (t.created_by = ? OR ta.user_id = ?)
            LIMIT 1";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        return false;
    }
    
    $stmt->bind_param("iii", $taskId, $userId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result && $result->num_rows > 0) {
        return true;
    }

    // ✅ Check if user is a POC or other employee for the client associated with this task
    // First, get the client_id from the task
    $sql = "SELECT client_id FROM tasks WHERE id = ? LIMIT 1";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        return false;
    }
    
    $stmt->bind_param("i", $taskId);
    $stmt->execute();
    $taskResult = $stmt->get_result();
    
    if (!$taskResult || !($row = $taskResult->fetch_assoc())) {
        return false;
    }
    
    $clientId = $row['client_id'];
    
    if (!$clientId) {
        return false;
    }

    // Check if user is assigned to this client in client_users table
    $sql = "SELECT 1 FROM client_users 
            WHERE client_id = ? 
            AND emp_id = ? 
            LIMIT 1";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        return false;
    }
    
    $stmt->bind_param("ii", $clientId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    return $result && $result->num_rows > 0;
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

        if (!hasTaskAccess($conn, $taskId, $userId)) {
            echo json_encode(["status" => "error", "message" => "Access denied. You don't have permission to view comments for this task."]);
            exit;
        }

        $sql = "SELECT 
                    tc.id,
                    tc.task_id,
                    tc.parent_id,
                    tc.comment,
                    tc.created_date,
                    tc.created_time,
                    tc.updated_date,
                    tc.updated_time,
                    u.id AS user_id,
                    u.name,
                    u.profile_pic,
                    u.role,
                    CASE 
                        WHEN u.id = ? THEN 'you'
                        WHEN u.role = 'admin' THEN 'admin'
                        ELSE 'user'
                    END as user_type
                FROM task_comments tc
                INNER JOIN users u ON tc.user_id = u.id
                WHERE tc.task_id = ?
                ORDER BY tc.created_date ASC, tc.created_time ASC";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            echo json_encode(["status" => "error", "message" => "Database query preparation failed: " . $conn->error]);
            exit;
        }
        
        $stmt->bind_param("ii", $userId, $taskId);
        $stmt->execute();
        
        $result = $stmt->get_result();
        if (!$result) {
            echo json_encode(["status" => "error", "message" => "Failed to fetch comments: " . $stmt->error]);
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

        if (!$taskId || !$userId || empty($comment)) {
            echo json_encode(["status" => "error", "message" => "Invalid data. Task ID, User ID, and Comment are required."]);
            exit;
        }

        if (!hasTaskAccess($conn, $taskId, $userId)) {
            echo json_encode(["status" => "error", "message" => "Access denied. You must be assigned to this task or be a POC/employee for the related client."]);
            exit;
        }

        if ($parentId === null) {
            $sql = "INSERT INTO task_comments 
                    (task_id, user_id, parent_id, comment, created_date, created_time)
                    VALUES (?, ?, NULL, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                echo json_encode(["status" => "error", "message" => "Failed to prepare insert query: " . $conn->error]);
                exit;
            }
            $stmt->bind_param("iisss", $taskId, $userId, $comment, $date, $time);
        } else {
            $sql = "INSERT INTO task_comments 
                    (task_id, user_id, parent_id, comment, created_date, created_time)
                    VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                echo json_encode(["status" => "error", "message" => "Failed to prepare insert query: " . $conn->error]);
                exit;
            }
            $stmt->bind_param("iiisss", $taskId, $userId, $parentId, $comment, $date, $time);
        }

        if ($stmt->execute()) {
            $newCommentId = $stmt->insert_id;
            
            // Get the newly created comment with user details
            $sql = "SELECT 
                        tc.id,
                        tc.task_id,
                        tc.parent_id,
                        tc.comment,
                        tc.created_date,
                        tc.created_time,
                        tc.updated_date,
                        tc.updated_time,
                        u.id AS user_id,
                        u.name,
                        u.profile_pic,
                        u.role,
                        CASE 
                            WHEN u.id = ? THEN 'you'
                            WHEN u.role = 'admin' THEN 'admin'
                            ELSE 'user'
                        END as user_type
                    FROM task_comments tc
                    INNER JOIN users u ON tc.user_id = u.id
                    WHERE tc.id = ?";
            
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                echo json_encode([
                    "status" => "success",
                    "message" => "Comment added but failed to retrieve details",
                    "comment_id" => $newCommentId
                ]);
                exit;
            }
            
            $stmt->bind_param("ii", $userId, $newCommentId);
            $stmt->execute();
            $result = $stmt->get_result();
            $newComment = $result ? $result->fetch_assoc() : null;
            
            echo json_encode([
                "status" => "success",
                "message" => "Comment added successfully",
                "comment" => $newComment,
                "comment_id" => $newCommentId
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Failed to add comment: " . $stmt->error
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

        if (!$commentId || empty($comment)) {
            echo json_encode(["status" => "error", "message" => "Invalid request. Comment ID and text are required."]);
            exit;
        }

        // Get task_id and user_id from comment
        $sql = "SELECT task_id, user_id FROM task_comments WHERE id = ? LIMIT 1";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            echo json_encode(["status" => "error", "message" => "Database error: " . $conn->error]);
            exit;
        }
        
        $stmt->bind_param("i", $commentId);
        $stmt->execute();
        $commentResult = $stmt->get_result();
        
        if (!$commentResult || !($row = $commentResult->fetch_assoc())) {
            echo json_encode(["status" => "error", "message" => "Comment not found"]);
            exit;
        }
        
        $taskIdFromComment = $row['task_id'];
        $commentUserId = $row['user_id'];
        
        // Check if user has access to this task
        if (!hasTaskAccess($conn, $taskIdFromComment, $userId)) {
            echo json_encode(["status" => "error", "message" => "Access denied. You don't have permission to edit this comment."]);
            exit;
        }

        // Admin can edit ANY comment, staff/POC can only edit their own
        if (isAdmin($conn, $userId)) {
            $sql = "UPDATE task_comments 
                    SET comment = ?, updated_date = NOW(), updated_time = TIME(NOW())
                    WHERE id = ?";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                echo json_encode(["status" => "error", "message" => "Database error: " . $conn->error]);
                exit;
            }
            $stmt->bind_param("si", $comment, $commentId);
        } else {
            if ($commentUserId != $userId) {
                echo json_encode(["status" => "error", "message" => "You can only edit your own comments."]);
                exit;
            }
            
            $sql = "UPDATE task_comments 
                    SET comment = ?, updated_date = NOW(), updated_time = TIME(NOW())
                    WHERE id = ? AND user_id = ?";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                echo json_encode(["status" => "error", "message" => "Database error: " . $conn->error]);
                exit;
            }
            $stmt->bind_param("sii", $comment, $commentId, $userId);
        }

        if ($stmt->execute()) {
            echo json_encode([
                "status" => "success",
                "message" => "Comment updated successfully"
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Failed to update comment: " . $stmt->error
            ]);
        }
        break;

    /* =======================
       DELETE COMMENT
       ======================= */
    case 'DELETE':

        $commentId = $_GET['comment_id'] ?? null;

        if (!$commentId) {
            echo json_encode(["status" => "error", "message" => "Comment ID is required"]);
            exit;
        }

        // Get task_id and user_id from comment
        $sql = "SELECT task_id, user_id FROM task_comments WHERE id = ? LIMIT 1";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            echo json_encode(["status" => "error", "message" => "Database error: " . $conn->error]);
            exit;
        }
        
        $stmt->bind_param("i", $commentId);
        $stmt->execute();
        $commentResult = $stmt->get_result();
        
        if (!$commentResult || !($row = $commentResult->fetch_assoc())) {
            echo json_encode(["status" => "error", "message" => "Comment not found"]);
            exit;
        }
        
        $taskIdFromComment = $row['task_id'];
        $commentUserId = $row['user_id'];
        
        // Check if user has access to this task
        if (!hasTaskAccess($conn, $taskIdFromComment, $userId)) {
            echo json_encode(["status" => "error", "message" => "Access denied. You don't have permission to delete this comment."]);
            exit;
        }

        // Admin can delete ANY comment, staff/POC can only delete their own
        if (isAdmin($conn, $userId)) {
            $sql = "DELETE FROM task_comments WHERE id = ?";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                echo json_encode(["status" => "error", "message" => "Database error: " . $conn->error]);
                exit;
            }
            $stmt->bind_param("i", $commentId);
        } else {
            if ($commentUserId != $userId) {
                echo json_encode(["status" => "error", "message" => "You can only delete your own comments."]);
                exit;
            }
            
            $sql = "DELETE FROM task_comments WHERE id = ? AND user_id = ?";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                echo json_encode(["status" => "error", "message" => "Database error: " . $conn->error]);
                exit;
            }
            $stmt->bind_param("ii", $commentId, $userId);
        }

        if ($stmt->execute()) {
            echo json_encode([
                "status" => "success",
                "message" => "Comment deleted successfully"
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Failed to delete comment: " . $stmt->error
            ]);
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Invalid request method"]);
        break;
}

$conn->close();