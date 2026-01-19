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
    $sql = "SELECT role FROM users WHERE id = ? LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();

    return isset($result['role']) && strtolower($result['role']) === 'admin';
}

/* =======================
   CHECK TASK ACCESS
   ======================= */
function hasTaskAccess($conn, $taskId, $userId) {

    // ✅ ADMIN CAN ACCESS ANY TASK
    if (isAdmin($conn, $userId)) {
        return true;
    }

    // Staff access rules
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
        $stmt->bind_param("i", $taskId);
        $stmt->execute();

        $result = $stmt->get_result();
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

        if ($parentId === 'null' || $parentId === '') {
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

        if ($parentId === null) {
            $sql = "INSERT INTO task_comments 
                    (task_id, user_id, parent_id, comment, created_date, created_time)
                    VALUES (?, ?, NULL, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("iisss", $taskId, $userId, $comment, $date, $time);
        } else {
            $sql = "INSERT INTO task_comments 
                    (task_id, user_id, parent_id, comment, created_date, created_time)
                    VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("iiisss", $taskId, $userId, $parentId, $comment, $date, $time);
        }

        if ($stmt->execute()) {
            echo json_encode([
                "status" => "success",
                "comment_id" => $stmt->insert_id
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => $stmt->error
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

        // Admin can edit ANY comment, staff only their own
        if (isAdmin($conn, $userId)) {
            $sql = "UPDATE task_comments 
                    SET comment = ?, updated_date = NOW(), updated_time = TIME(NOW())
                    WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("si", $comment, $commentId);
        } else {
            $sql = "UPDATE task_comments 
                    SET comment = ?, updated_date = NOW(), updated_time = TIME(NOW())
                    WHERE id = ? AND user_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("sii", $comment, $commentId, $userId);
        }

        $stmt->execute();
        echo json_encode(["status" => "success"]);
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

        // Admin can delete ANY comment
        if (isAdmin($conn, $userId)) {
            $sql = "DELETE FROM task_comments WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $commentId);
        } else {
            $sql = "DELETE FROM task_comments WHERE id = ? AND user_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $commentId, $userId);
        }

        $stmt->execute();
        echo json_encode(["status" => "success"]);
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Invalid request method"]);
        break;
}
