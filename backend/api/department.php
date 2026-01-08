<?php
header("Access-Control-Allow-Origin: *"); // Allow requests from frontend
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include('../inc/config.php');

$method = $_SERVER['REQUEST_METHOD'];
$userId = $_GET['id'] ?? null;
$emailId = $_GET['email'] ?? null;
$status = $_GET['status'] ?? null;

if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}
date_default_timezone_set('Asia/Kolkata');
$date = date("Y-m-d");
$time = date("H:i:s");

switch ($method) { 

    case 'GET':
        if($userId){
            $sql1 = "SELECT * FROM departments WHERE id='$userId'";
            $result = $conn->query($sql1);
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }

            echo json_encode([
                "status" => "success",
                "data" => $data
            ]);
        }else{
            $allDept = $_GET['all_dept'] ?? null;
            if(!empty($allDept)){
                $where = "WHERE status='active'";
            }else{
                $where = !empty($status) ? "WHERE status='$status'" : "";
            }

            $sql1 = "SELECT * FROM departments $where order by id desc";
            $result = $conn->query($sql1);
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }

            echo json_encode([
                "status" => "success",
                "data" => $data
            ]);
        }
        break;
    
    case 'POST':
        $name = trim($_POST['name'] ?? '');
        $description = $_POST['description'] ?? '';
        $status = $_POST['status'] ?? '';

        $sql = "SELECT name FROM departments WHERE name='$name'";
        $result = $conn->query($sql); 
        if($result->num_rows > 0){
            echo json_encode(["status" => "error", "message" => "Department Name Already Exists"]);
            exit;
        }       
        $sql = "INSERT INTO `departments`(`name`, `description`, `status`, `updated_by`, `created_date`, `created_time`) VALUES ('$name','$description','$status','$userId','$date','$time')";
        if ($conn->query($sql)) {
        echo json_encode(["status" => "success", "message" => "Department Created Successfully"]);
        }else{
        echo json_encode(["status" => "error", "message" => $conn->error]);
        }

        break;

    case 'PUT':
        $id = $_POST['id'] ?? ''; 
        $name = trim($_POST['name'] ?? '');
        $description = $_POST['description'] ?? '';
        $status = $_POST['status'] ?? '';
        $userstatus = filter_var($status, FILTER_VALIDATE_BOOLEAN) ? 'active' : 'inactive';

        $sql = "SELECT name FROM departments WHERE name='$name' and id !='$id'";
        $result = $conn->query($sql); 
        if($result->num_rows > 0){
            echo json_encode(["status" => "error", "message" => "Department Name Already Exists"]);
            exit;
        }
        $sql = "UPDATE `departments` SET `name`='$name', `description`='$description', `status`='$userstatus', `updated_by`='$userId', `created_date`='$date', `created_time`='$time' WHERE id='$id'";
        if ($conn->query($sql)) {
        echo json_encode(["status" => "success", "message" => "Department Updated Successfully".$sql]);
        }else{
        echo json_encode(["status" => "error", "message" => $conn->error."===".$sql]);
        }

        break;


    default:
        echo json_encode(["status" => "error", "message" => "Invalid request method"]);
        break;
}
?>