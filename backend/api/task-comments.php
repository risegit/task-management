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
                    tc.created_at,
                    tc.updated_at,
                    u.id AS user_id,
                    u.name,
                    u.profile_pic
                FROM task_comments tc
                INNER JOIN users u ON tc.user_id = u.id
                WHERE tc.task_id = ?
                ORDER BY tc.created_at ASC";

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

        // $data = json_decode(file_get_contents("php://input"), true);

        $taskId = $_POST['task_id'] ?? null;
        $comment = trim($_POST['comment'] ?? '');
        $parentId = $_POST['parent_id'] ?? null;

        if (!$taskId || !$userId || !$comment) {
            echo json_encode(["status" => "error", "message" => "Invalid data"]);
            exit;
        }

        if (!hasTaskAccess($conn, $taskId, $userId)) {
            echo json_encode(["status" => "error", "message" => "Access denied"]);
            exit;
        }

        $sql = "INSERT into task_comments (task_id, user_id, parent_id, comment, created_at, updated_at)
                VALUES ($taskId, $userId, " . ($parentId ? $parentId : "NULL") . ", '$comment', NOW(), NOW())";
        // $sql = "INSERT INTO task_comments (task_id, user_id, parent_id, comment)
        //         VALUES (?, ?, ?, ?)";

        // $stmt = $conn->prepare($sql);
        // $stmt->bind_param("iiis", $taskId, $userId, $parentId, $comment);
        // $stmt->execute();

        echo json_encode([
            "status" => "success",
            "comment_id" => $sql
        ]);
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

        $sql = "UPDATE task_comments 
                SET comment = ?, updated_at = NOW()
                WHERE id = ? AND user_id = ?";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sii", $comment, $commentId, $userId);
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

        $sql = "DELETE FROM task_comments 
                WHERE id = ? AND user_id = ?";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $commentId, $userId);
        $stmt->execute();

        echo json_encode(["status" => "success"]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Method Not Allowed"]);
}
