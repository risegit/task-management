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

$date = date("Y-m-d");
$time = date("H:i:s");

switch ($method) { 

    case 'GET':
        if($id){
            $sql1 = "SELECT client_code,name,description,start_date,status FROM clients WHERE id='$id'";
            $result = $conn->query($sql1);
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }

            $sql2 = "SELECT u.id,u.name,u.role,u.email,u.status,dept.name dept_name FROM users u INNER JOIN departments dept ON u.department_id = dept.id order by u.id desc;";
            $result2 = $conn->query($sql2);
            $employee = [];
            while ($row = $result2->fetch_assoc()) {
                $employee[] = $row;
            }

            $sql3 = "SELECT * FROM client_users WHERE client_id='$id'";
            $result3 = $conn->query($sql3);
            $assigned_emp = [];
            while ($row = $result3->fetch_assoc()) {
                $assigned_emp[] = $row;
            }

            echo json_encode([
                "status" => "success",
                "data" => $data,
                "employee" => $employee,
                "assigned_emp" => $assigned_emp
            ]);
        }else{
            $sql1 = "SELECT c.id AS client_id, c.client_code, c.name AS client_name, c.description, c.start_date, c.status, GROUP_CONCAT( CASE WHEN cu.is_poc = 1 THEN u.name END SEPARATOR ', ' ) AS poc_employee, GROUP_CONCAT( CASE WHEN cu.is_poc = 0 THEN u.name END SEPARATOR ', ' ) AS other_employees FROM clients c LEFT JOIN client_users cu ON c.id = cu.client_id LEFT JOIN users u ON cu.emp_id = u.id GROUP BY c.id ORDER BY c.id DESC";
            $result = $conn->query($sql1);
            $project = [];
            while ($row = $result->fetch_assoc()) {
                $project[] = $row;
            }

            echo json_encode([
                "status" => "success",
                "project" => $project

            ]);
        }
        break;
    
    case 'POST':
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

            // echo json_encode(["status" => "success", "message" => $sqlProject.'='.$projectName.'-'.$projectDescription.'-'.$startDate.'-'.$id.'-'.$date.'-'.$time]);

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