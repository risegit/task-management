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
        $sql1 = "SELECT * FROM users WHERE role!='customer' ORDER BY id DESC";
        $result = $conn->query($sql1);
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }

        echo json_encode([
            "status" => "success",
            "data" => $userId ? ($data[0] ?? null) : $data
        ]);
        break;
    
    case 'POST':
        $singinout=$_POST['singin'] ?? '';
        $name = $_POST['username'] ?? '';
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';
        $role = strtolower(trim($_POST['role']));
        $prefix = '';
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
            
        $sql1 = "SELECT * FROM users WHERE email = '$email'";
        $result=$conn->query($sql1);
        
        if ($result->num_rows == 0) {
            $sql2 = "INSERT INTO `users`(`name`, `email`, `password`, `role`, `status`, `date`, `time`) VALUES ('$name','$email','$password_hash','$role','inactive','$date','$time')";
            // echo json_encode(["status" => "success", "message" => $sql2 ]);
            if($conn->query($sql2)){
                $user_id = $conn->insert_id;
                if ($role === 'admin') $prefix = 'AD';
                elseif ($role === 'manager') $prefix = 'MN';
                elseif ($role === 'staff') $prefix = 'ST';
                else $prefix = 'OT';
                $user_code = $prefix . str_pad($user_id, 4, '0', STR_PAD_LEFT);
                $conn->query("UPDATE users SET user_code = '$user_code' WHERE id = '$user_id'");

                echo json_encode(["status" => "success", "message" => "Your Account Created successfully! Now wait for admin to activate this account."]);
            }
        }else{
            echo json_encode(["status" => "error", "message" => "This user already registered with us"]);
            break;
        }

        break;


    default:
        echo json_encode(["status" => "error", "message" => "Invalid request method"]);
        break;
}
?>