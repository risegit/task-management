<?php
header("Access-Control-Allow-Origin: *"); // Allow requests from frontend
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include('../inc/config.php');

$method = $_SERVER['REQUEST_METHOD'];
$userId = $_GET['id'] ?? null;
$emailId = $_GET['email'] ?? null;

if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}

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
            $sql1 = "SELECT * FROM departments order by id desc";
            $result = $conn->query($sql1);
            $departments = [];
            while ($row = $result->fetch_assoc()) {
                $departments[] = $row;
            }

            echo json_encode([
                "status" => "success",
                "departments" => $departments
            ]);
        }
        break;
    
    case 'POST':
        $name = $_POST['name'] ?? '';
        $email = $_POST['email'] ?? '';
        $department_id = $_POST['department'] ?? '';
        $phone = $_POST['phone'] ?? '';
        $password = $_POST['password'] ?? '';
        $role = $_POST['role'] ?? '';
        // Secure password hashing
        $password_hash = password_hash($password, PASSWORD_DEFAULT);

        $checkEmail = $conn->query("SELECT id FROM users WHERE email = '$email' LIMIT 1");
        if ($checkEmail->num_rows > 0) {
            echo json_encode([
                "status" => "error",
                "message" => "Email already exists"
            ]);
            exit;
        }

        $sql = "INSERT INTO `users`(`name`, `email`, `phone`, `password`, `role`, `date`, `time`, `department_id`) VALUES ('$name','$email','$phone','$password_hash','$role','$date','$time','$department_id')";

        if ($conn->query($sql)) {
            $user_id = $conn->insert_id;
            $roleLower = strtolower(trim($_POST['role'])); 
            $prefix = '';

            if ($roleLower === 'manager') $prefix = 'MN';
            elseif ($roleLower === 'admin') $prefix = 'AD';
            elseif ($roleLower === 'technician') $prefix = 'TC';
            else $prefix = 'OT'; // default prefix
            // 3. Generate user_code (example: MN0023)
            $user_code = $prefix . str_pad($user_id, 4, '0', STR_PAD_LEFT);
            // 4. Update user_code back into users table
            $sql1 = "UPDATE users SET user_code = '$user_code' WHERE id = '$user_id'";
            if ($conn->query($sql1)) {
                echo json_encode(["status" => "success", "message" => "Employee Added Successfully"]);
            }else{
                echo json_encode(["status" => "error", "message" => $conn->error]);
            }
        }

        break;


    default:
        echo json_encode(["status" => "error", "message" => "Invalid request method"]);
        break;
}
?>