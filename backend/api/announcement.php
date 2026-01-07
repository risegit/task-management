<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include('../inc/config.php');

$method = $_SERVER['REQUEST_METHOD'];
$userId = $_GET['id'] ?? null;
$emailId = $_GET['email'] ?? null;

// Handle method override
if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}

$date = date("Y-m-d");
$time = date("H:i:s");

switch ($method) { 
    case 'GET':
        if($userId){
            $stmt = $conn->prepare("SELECT * FROM announcement WHERE id=?");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $stmt = $conn->prepare("SELECT * FROM announcement ORDER BY id DESC LIMIT 1");
            $stmt->execute();
            $result = $stmt->get_result();
        }
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        
        echo json_encode([
            "status" => "success",
            "data" => $data
        ]);
        
        if(isset($stmt)) $stmt->close();
        break;
    
    case 'POST':
        // Parse JSON input for POST requests
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input && $_POST) {
            $input = $_POST;
        }
        
        $name = $input['name'] ?? '';
        $description = $input['description'] ?? '';
        $status = $input['status'] ?? '';
        
        $stmt = $conn->prepare("INSERT INTO `announcement`(`name`, `description`, `status`, `updated_by`, `created_date`, `created_time`) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssiss", $name, $description, $status, $userId, $date, $time);
        
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Announcement Created Successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => $conn->error]);
        }
        
        $stmt->close();
        break;

    case 'PUT':
        // Parse JSON input for PUT requests
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input && $_POST) {
            $input = $_POST;
        }
        
        $id = $input['id'] ?? ''; 
        $name = $input['name'] ?? '';
        $description = $input['description'] ?? '';
        $status = $input['status'] ?? '';
        $userstatus = filter_var($status, FILTER_VALIDATE_BOOLEAN) ? 'active' : 'inactive';

        $stmt = $conn->prepare("UPDATE `announcement` SET `name`=?, `description`=?, `status`=?, `updated_by`=?, `created_date`=?, `created_time`=? WHERE id=?");
        $stmt->bind_param("sssissi", $name, $description, $userstatus, $userId, $date, $time, $id);
        
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Announcement Updated Successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => $conn->error]);
        }
        
        $stmt->close();
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Invalid request method"]);
        break;
}

$conn->close();
?>