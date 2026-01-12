<?php
header("Access-Control-Allow-Origin: *"); // Allow requests from frontend
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include('../inc/config.php');

$method = $_SERVER['REQUEST_METHOD'];
$userId = $_GET['id'] ?? null;
$emailId = $_GET['email'] ?? null;
$profile = $_GET['profile'] ?? null;

if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}
date_default_timezone_set('Asia/Kolkata');
$date = date("Y-m-d");
$time = date("H:i:s");

switch ($method) { 

    case 'GET':
        if($profile){
            $userId = $_GET['empId'];
            $sql = "SELECT u.id,u.name,u.phone,u.role,u.email,u.status,dept.name dept_name,ud.designation,ud.dob,ud.gender,ud.joining_date FROM users u INNER JOIN departments dept ON u.department_id = dept.id INNER JOIN users_details ud ON u.id=ud.user_id WHERE u.id='$userId' order by u.id desc";
            $result = $conn->query($sql);
            if($result->num_rows > 0){
                $data = [];
                while ($row = $result->fetch_assoc()) {
                    $data[] = $row;
                }
            }else{
                $sql = "SELECT u.name,u.email,u.phone,d.name dept_name FROM users u INNER JOIN departments d ON u.department_id=d.id WHERE u.id='$userId' LIMIT 1";
                $result = $conn->query($sql);
                if($result->num_rows > 0){
                    $data = [];
                    while ($row = $result->fetch_assoc()) {
                        $data[] = $row;
                    }
                }
            }


            echo json_encode([
                "status" => "success",
                "data" => $data,
                "sql" => $sql
            ]);
        }else{
            $sql1 = "SELECT * FROM users WHERE status='active'";
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
       

        break;

    case 'PUT':
        $user_id = $_POST['id'] ?? null;
        $name = $_POST['name'] ?? '';
        $email = $_POST['email'] ?? '';
        $department_id = $_POST['department'] ?? '';
        $phone = $_POST['phone'] ?? '';
        $designation = $_POST['designation'] ?? '';
        $password = $_POST['password'] ?? '';
        $gender = $_POST['gender'] ?? '';
        $dob = $_POST['dob'] ?? '';
        $joining_date = $_POST['joining_date'] ?? '';
        $role = $_POST['role'] ?? '';
        $status = $_POST['status'] ?? '';
        
        // Start building the SET clause dynamically
        $setClauses1 = array();
        $setClauses2 = array();

        $checkEmail = $conn->query("SELECT id FROM users WHERE (email = '$email' or phone = '$phone') and id != '$user_id' LIMIT 1");
        if ($checkEmail->num_rows > 0) {
            echo json_encode([
                "status" => "error",
                "message" => "Email or Phone already exists"
            ]);
            exit;
        }
        
        // Add fields to SET clause only if they are provided and not empty
        if (!empty($name)) {
            $setClauses1[] = "`name` = '" . $conn->real_escape_string($name) . "'";
        }
        
        if (!empty($email)) {
            $setClauses1[] = "`email` = '" . $conn->real_escape_string($email) . "'";
        }
        
        if (!empty($phone)) {
            $setClauses1[] = "`phone` = '" . $conn->real_escape_string($phone) . "'";
        }
        
        if (!empty($password)) {
            $password_hash = password_hash($password, PASSWORD_DEFAULT);
            $setClauses1[] = "`password` = '" . $conn->real_escape_string($password_hash) . "'";
        }
        if (!empty($designation)) {
            $setClauses2[] = "`designation` = '" . $conn->real_escape_string($designation) . "'";
        }
        if (!empty($dob)) {
            $setClauses2[] = "`dob` = '" . $conn->real_escape_string($dob) . "'";
        }
        if (!empty($gender)) {
            $setClauses2[] = "`gender` = '" . $conn->real_escape_string($gender) . "'";
        }
        if (!empty($joining_date)) {
            $setClauses2[] = "`joining_date` = '" . $conn->real_escape_string($joining_date) . "'";
        }
        
        // Always update the timestamp fields
        $setClauses1[] = "`updated_date` = '$date'";
        $setClauses1[] = "`updated_time` = '$time'";
        
        // If no fields to update (except timestamps), return error
        if (count($setClauses1) <= 2) { // Only timestamps
            echo json_encode(["status" => "error", "message" => "No data provided to update"]);
            exit;
        }
        
        // Build the final SQL query
        $setClause1 = implode(', ', $setClauses1);
        $setClause2 = implode(', ', $setClauses2);
        $sql1 = "UPDATE `users` SET $setClause1 WHERE id='$user_id'";
        $sql2 = "SELECT COUNT(*) as count FROM `users_details` WHERE user_id='$user_id'";
        $result2 = $conn->query($sql2);
        $row2 = $result2->fetch_assoc();
        if ($row2['count'] == 0) {
            $sql2 = "INSERT INTO `users_details` (user_id, designation, dob, gender, joining_date) VALUES ('$user_id', '" . $conn->real_escape_string($designation) . "', '" . $conn->real_escape_string($dob) . "', '" . $conn->real_escape_string($gender) . "', '" . $conn->real_escape_string($joining_date) . "')";
        } else {
            $sql2 = "UPDATE `users_details` SET $setClause2 WHERE user_id='$user_id'";
        }
        // echo json_encode([
        //     "status" => "success",
        //     "sql1" => $sql1,
        //     "sql2" => $sql2
        // ]);
        if ($conn->query($sql1) && $conn->query($sql2)) {
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
