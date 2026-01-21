<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST");
header("Content-Type: application/json");

include('../inc/config.php');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {

    $userId = intval($_GET['user_id'] ?? 0);

    if ($userId <= 0) {
        echo json_encode(["status" => "error", "message" => "Invalid user"]);
        exit;
    }

    $sql = "SELECT n.id,n.message,n.type,n.reference_id,n.is_read,n.created_date,n.created_time,u.name AS sender_name FROM notifications n INNER JOIN users u ON u.id = n.sender_id WHERE n.user_id = '$userId' and is_read = 0 ORDER BY n.created_date,n.created_time DESC";

    $res = $conn->query($sql);

    $data = [];
    while ($row = $res->fetch_assoc()) {
        $data[] = $row;
    }
    
    echo json_encode(["status" => "success", "data" => $data]);
    exit;
}

/* ---------------- MARK AS READ ---------------- */

if ($method === 'POST') {

    $input = json_decode(file_get_contents("php://input"), true);

    if (($input['action'] ?? '') === 'mark_read') {

        $id = intval($input['notification_id'] ?? 0);

        if ($id > 0) {
            $conn->query("UPDATE notifications SET is_read = 1 WHERE id = '$id'");
            echo json_encode(["status" => "success"]);
        } else {
            echo json_encode(["status" => "error"]);
        }
        exit;
    }
}

echo json_encode(["status" => "error", "message" => "Invalid request"]);
