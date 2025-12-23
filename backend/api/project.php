<?php
header("Access-Control-Allow-Origin: *"); // Allow requests from frontend
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include('../inc/config.php');

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$userCode = $_GET['user_code'] ?? null;
$emailId = $_GET['email'] ?? null;

if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}

$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    echo json_encode(["status" => "error", "message" => "Invalid JSON data"]);
    exit;
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
        $data = json_decode(file_get_contents("php://input"), true);

        if (!$data) {
            echo json_encode(["status" => "error", "message" => "Invalid JSON"]);
            exit;
        }
        $projectName = trim($data['projectName'] ?? '');
        $projectDescription = trim($data['projectDescription'] ?? '');
        $startDate = $data['startDate'] ?? '';
        $poc = $data['poc'] ?? null; // single ID
        $otherEmployees = $data['otherEmployees'] ?? [];

        $conn->begin_transaction();
        try {
            /* -----------------------------
            INSERT PROJECT (clients)
            ------------------------------*/
            $sqlProject = "INSERT INTO clients (name, description, start_date, created_by, created_date, created_time) VALUES (?, ?, ?, ?, ?, ?)";

            $stmtProject = $conn->prepare($sqlProject);
            $stmtProject->bind_param("sssiss", $projectName, $projectDescription, $startDate, $id,$date, $time);
            $stmtProject->execute();

            $clientId = $conn->insert_id;
            $prefix = "CC";
            $client_code = $prefix . str_pad($clientId, 4, '0', STR_PAD_LEFT);
            $sqlUpdateCode = "UPDATE clients SET client_code = ? WHERE id = ?";
            $stmtUpdate = $conn->prepare($sqlUpdateCode);
            $stmtUpdate->bind_param("si", $client_code, $clientId);

            if (!$stmtUpdate->execute()) {
            throw new Exception($stmtUpdate->error);
            }

            /* -----------------------------
            INSERT POC
            ------------------------------*/
            $sqlPOC = "INSERT INTO client_users (client_id, emp_id, is_poc, created_date, created_time) VALUES (?, ?, '1', ?, ?)";

            $stmtPOC = $conn->prepare($sqlPOC);
            $stmtPOC->bind_param("iiss", $clientId, $poc, $date, $time);

            if (!$stmtPOC->execute()) {
                throw new Exception($stmtPOC->error);
            }

            /* -----------------------------
            INSERT OTHER EMPLOYEES
            ------------------------------*/
            if (!empty($otherEmployees)) {
                $sqlEmp = "INSERT INTO client_users (client_id, emp_id, is_poc, created_date, created_time) VALUES (?, ?, '', ?, ?)";

                $stmtEmp = $conn->prepare($sqlEmp);

                foreach ($otherEmployees as $empId) {
                    $stmtEmp->bind_param("iiss", $clientId, $empId, $date, $time);
                    if (!$stmtEmp->execute()) {
                        throw new Exception($stmtEmp->error);
                    }
                }
            }

            /* -----------------------------
            COMMIT TRANSACTION
            ------------------------------*/
            $conn->commit();

            echo json_encode([
                "status" => "success",
                "message" => "Project created successfully",
                "project_id" => $clientId
            ]);

        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode([
                "status" => "error",
                "message" => $e->getMessage()
            ]);
        }
        // echo json_encode(["status" => "success", "message" => $sqlPOC.'='.$clientId.'-'.$poc.'-'.$date.'-'.$time]);
        // echo json_encode(["status" => "success", "message" => $sqlProject.'='.$projectName.'-'.$projectDescription.'-'.$startDate.'-'.$date.'-'.$time]);

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