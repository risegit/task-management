<?php
header("Access-Control-Allow-Origin: *"); // Allow requests from frontend
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include('../inc/config.php');

$method = $_SERVER['REQUEST_METHOD'];
$userId = $_GET['id'] ?? null;
$emailId = $_GET['email'] ?? null;
$allEmp = $_GET['all_emp'] ?? null;

if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}

$date = date("Y-m-d");
$time = date("H:i:s");

switch ($method) { 

    case 'GET':
        if($userId){
            $sql1 = "SELECT u.id,u.name,u.phone,u.role,u.email,u.status,dept.name dept_name FROM users u INNER JOIN departments dept ON u.department_id = dept.id WHERE u.id='$userId' order by u.id desc";
            $result = $conn->query($sql1);
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }

            $sql2 = "SELECT * FROM departments";
            $result2 = $conn->query($sql2);
            $department = [];
            while ($row = $result2->fetch_assoc()) {
                $department[] = $row;
            }

            echo json_encode([
                "status" => "success",
                "data" => $data,
                "departments" => $department
            ]);
        }else{
            $sql1 = "SELECT u.id,u.name,u.role,u.email,u.status,dept.name dept_name FROM users u INNER JOIN departments dept ON u.department_id = dept.id order by u.id desc;";
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

        $sql = "INSERT INTO `users`(`name`, `email`, `phone`, `password`, `role`, `department_id`) VALUES ('$name','$email','$phone','$password_hash','$role','$department_id')";

        if ($conn->query($sql)) {
            $user_id = $conn->insert_id;
            $roleLower = strtolower(trim($_POST['role'])); 
            $prefix = '';

            if ($roleLower === 'manager') $prefix = 'MN';
            elseif ($roleLower === 'admin') $prefix = 'AD';
            elseif ($roleLower === 'staff') $prefix = 'ST';
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

        case 'POST':
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $department_id = $_POST['department'] ?? '';
    $phone = $_POST['phone'] ?? '';
    $password = $_POST['password'] ?? '';
    $role = $_POST['role'] ?? '';
    $status = $_POST['status'] ?? 'active'; // Default to 'active' if not provided
    
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

    // Add status to the INSERT query
    $sql = "INSERT INTO `users`(`name`, `email`, `phone`, `password`, `role`, `department_id`, `status`) VALUES ('$name','$email','$phone','$password_hash','$role','$department_id','$status')";

    if ($conn->query($sql)) {
        $user_id = $conn->insert_id;
        $roleLower = strtolower(trim($role)); 
        $prefix = '';

        if ($roleLower === 'manager') $prefix = 'MN';
        elseif ($roleLower === 'admin') $prefix = 'AD';
        elseif ($roleLower === 'staff') $prefix = 'ST';
        else $prefix = 'OT'; // default prefix
        
        $user_code = $prefix . str_pad($user_id, 4, '0', STR_PAD_LEFT);
        
        $sql1 = "UPDATE users SET user_code = '$user_code' WHERE id = '$user_id'";
        if ($conn->query($sql1)) {
            echo json_encode(["status" => "success", "message" => "Employee Added Successfully"]);
        }else{
            echo json_encode(["status" => "error", "message" => $conn->error]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => $conn->error]);
    }
    break;

    case 'PUT':
        $user_id = $_POST['id'] ?? null;
        $name = $_POST['name'] ?? '';
        $email = $_POST['email'] ?? '';
        $department_id = $_POST['department'] ?? '';
        $phone = $_POST['phone'] ?? '';
        $password = $_POST['password'] ?? '';
        $role = $_POST['role'] ?? '';
        $status = $_POST['status'] ?? '';
        
        // Start building the SET clause dynamically
        $setClauses = array();
        
        // Add fields to SET clause only if they are provided and not empty
        if (!empty($name)) {
            $setClauses[] = "`name` = '" . $conn->real_escape_string($name) . "'";
        }
        
        if (!empty($email)) {
            $setClauses[] = "`email` = '" . $conn->real_escape_string($email) . "'";
        }
        
        if (!empty($department_id)) {
            $setClauses[] = "`department_id` = '" . $conn->real_escape_string($department_id) . "'";
        }
        
        if (!empty($phone)) {
            $setClauses[] = "`phone` = '" . $conn->real_escape_string($phone) . "'";
        }
        
        if (!empty($password)) {
            $password_hash = password_hash($password, PASSWORD_DEFAULT);
            $setClauses[] = "`password` = '" . $conn->real_escape_string($password_hash) . "'";
        }
        
        if (!empty($role)) {
            $setClauses[] = "`role` = '" . $conn->real_escape_string($role) . "'";
        }
        
        if (!empty($status)) {
            $userstatus = filter_var($status, FILTER_VALIDATE_BOOLEAN) ? 'active' : 'inactive';
            $setClauses[] = "`status` = '" . $conn->real_escape_string($userstatus) . "'";
        }
        
        // Always update the timestamp fields
        $setClauses[] = "`updated_date` = '$date'";
        $setClauses[] = "`updated_time` = '$time'";
        
        // If no fields to update (except timestamps), return error
        if (count($setClauses) <= 2) { // Only timestamps
            echo json_encode(["status" => "error", "message" => "No data provided to update"]);
            exit;
        }
        
        // Build the final SQL query
        $setClause = implode(', ', $setClauses);
        $sql = "UPDATE `users` SET $setClause WHERE id='$user_id'";
        
        if ($conn->query($sql)) {
            echo json_encode(["status" => "success", "message" => "Employee Updated Successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => $conn->error]);
        }
        break;


    default:
        echo json_encode(["status" => "error", "message" => "Invalid request method"]);
        break;
}
?>
