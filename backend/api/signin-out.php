<?php
header("Access-Control-Allow-Origin: *"); // Allow requests from frontend
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include('../inc/config.php');
require_once('../lib/src/JWT.php');
require_once('../lib/src/Key.php');

$method = $_SERVER['REQUEST_METHOD'];
$userId = $_GET['id'] ?? null;
$emailId = $_GET['email'] ?? null;

if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}
date_default_timezone_set('Asia/Kolkata');
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
        $singinout=$_POST['signin'] ?? '';
        // echo json_encode(["status" => "success","message" => $singinout ]);
        if($singinout=='signup'){
            // echo json_encode(["status" => "success","message" => 'first' ]);
            $department = $_POST['department'] ?? '';
            $name = $_POST['username'] ?? '';
            $email = $_POST['email'] ?? '';
            $password = $_POST['password'] ?? '';
            $role = strtolower(trim($_POST['role']));
            $prefix = '';
            $password_hash = password_hash($password, PASSWORD_DEFAULT);
                
            $sql1 = "SELECT * FROM users WHERE email = '$email'";
            $result=$conn->query($sql1);
            
            if ($result->num_rows == 0) {
                $sql2 = "INSERT INTO `users`(`name`, `email`, `password`, `role`, `status`, `created_date`, `created_time`,`department_id`) VALUES ('$name','$email','$password_hash','$role','inactive','$date','$time','$department')";
                echo json_encode(["status" => "success", "message" => $sql2 ]);
                
                if($conn->query($sql2)){
                    $user_id = $conn->insert_id;
                    if ($role === 'admin') $prefix = 'AD';
                    elseif ($role === 'manager') $prefix = 'MN';
                    elseif ($role === 'staff') $prefix = 'ST';
                    else $prefix = 'OT';
                    $user_code = $prefix . str_pad($user_id, 4, '0', STR_PAD_LEFT);
                    $conn->query("UPDATE users SET user_code = '$user_code' WHERE id = '$user_id'");
echo json_encode(["status" => "success", "message" => $sql2 ]);
                    // echo json_encode(["status" => "success", "message" => "Your Account Created successfully! Now wait for admin to activate this account."]);
                }
                echo json_encode(["status" => "success", "message" => $sql2 ]);
            }else{
                echo json_encode(["status" => "error", "message" => "This user already registered with us"]);
                break;
            }
        }else{
            // echo json_encode(["status" => "success","message" => 'second' ]);
            $name = $_POST['username'] ?? '';
            $password = $_POST['password'] ?? '';
            $password_hash = password_hash($password, PASSWORD_DEFAULT);

            // Step 1: Check if user exists
            $sql1 = "SELECT id, user_code, name, role, status, password FROM users WHERE email = '$name' || user_code = '$name' LIMIT 1";
            $result = $conn->query($sql1);

            // $row = $result->fetch_assoc();
            // echo json_encode(["status" => "success","data" => $sql]);
            if ($result && $result->num_rows > 0) {
                $row = $result->fetch_assoc();
                
                if (!password_verify($password, $row['password'])) {
                    echo json_encode(["status" => "error","message" => "Invalid username or password"]);
                    break;
                }
                if($row['status']=='inactive'){
                    echo json_encode(["status" => "error","message" => "Your account still inactive"]);
                    break;
                }

                unset($row['password']);

                // Generate JWT
                $payload = [
                    'iss' => 'task-management-app',
                    'iat' => time(),
                    'exp' => time() + (24 * 60 * 60), // 24 hours
                    'user' => $row
                ];
                $token = \Firebase\JWT\JWT::encode($payload, $jwt_secret, 'HS256');

                // Save token in DB (optional, for logout)
                $sql2 = "UPDATE users SET token='$token', login_status='active' WHERE id='{$row['id']}'";
                $conn->query($sql2);

                echo json_encode([
                    "status" => "success",
                    "data" => $row,
                    "token" => $token
                ]);
            }else{
                echo json_encode(["status" => "error","message" => "User Not Found"]);
                break;
            }
            
            
        }
// echo json_encode(["status" => "error","message" => "User Not Found"]);
        break;


    default:
        echo json_encode(["status" => "error", "message" => "Invalid request method"]);
        break;
}
?>