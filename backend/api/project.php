<?php
header("Access-Control-Allow-Origin: *"); // Allow requests from frontend
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include('../inc/config.php');

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$userId = $_GET['user_id'] ?? null;
$userCode = $_GET['user_code'] ?? null;
$emailId = $_GET['email'] ?? null;

if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}

$date = date("Y-m-d");
$time = date("H:i:s");

$data = $_POST;
if (empty($data)) {
    $data = json_decode(file_get_contents("php://input"), true) ?? [];
}

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
        }else if($userId){
            if (!empty($userCode)) {
                if (str_starts_with($userCode, 'ST')) {
                    $whereClause = "WHERE emp_id = '$userId'";
                } elseif (str_starts_with($userCode, 'AD') || str_starts_with($userCode, 'MN')) {
                    $whereClause = '';
                }
            }
            $sql1 = "SELECT c.id AS client_id, c.client_code, c.name AS client_name, c.description, c.start_date, c.status, GROUP_CONCAT( CASE WHEN cu.is_poc = 1 THEN u.name END SEPARATOR ', ' ) AS poc_employee, GROUP_CONCAT( CASE WHEN cu.is_poc = 0 THEN u.name END SEPARATOR ', ' ) AS other_employees FROM clients c INNER JOIN client_users cu ON c.id = cu.client_id INNER JOIN users u ON cu.emp_id = u.id WHERE c.id IN ( SELECT client_id FROM client_users $whereClause ) GROUP BY c.id ORDER BY c.id DESC";
            // echo json_encode(["status" => "success", "message" => $sql1]);
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
        // echo json_encode(["status" => "success", "poc" => $poc]);
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
        $id = trim($data['id'] ?? null);
        $projectId = (int)($data['project_id'] ?? 0);

        if ($projectId <= 0) {
            echo json_encode(["status" => "error", "message" => "Invalid project ID"]);
            exit;
        }

        $projectName = trim($data['projectName'] ?? '');
        $projectDescription = trim($data['projectDescription'] ?? '');
        $startDate = $data['startDate'] ?? '';
        $poc = $data['poc'] ?? null;

        $otherEmployees = [];
        if (!empty($data['otherEmployees'])) {
            $decoded = json_decode($data['otherEmployees'], true);
            if (is_array($decoded)) {
                $otherEmployees = $decoded;
            }
        }

        $conn->begin_transaction();

        try {
            $stmt = $conn->prepare(
                "UPDATE clients SET name=?, description=?, start_date=?, updated_by=?, updated_date=?, updated_time=? WHERE id=?"
            );
            $stmt->bind_param("sssissi", $projectName, $projectDescription, $startDate, $id, $date, $time, $projectId);
            $stmt->execute();

            $stmtDelPOC = $conn->prepare("DELETE FROM client_users WHERE client_id=? AND is_poc=1");
            $stmtDelPOC->bind_param("i", $projectId);
            $stmtDelPOC->execute();

            if ($poc) {
                $stmtPOC = $conn->prepare(
                    "INSERT INTO client_users (client_id, emp_id, is_poc, created_date, created_time)
                     VALUES (?, ?, 1, ?, ?)"
                );
                $stmtPOC->bind_param("iiss", $projectId, $poc, $date, $time);
                $stmtPOC->execute();
            }

            $stmtDelEmp = $conn->prepare("DELETE FROM client_users WHERE client_id=? AND is_poc=0");
            $stmtDelEmp->bind_param("i", $projectId);
            $stmtDelEmp->execute();

            if (!empty($otherEmployees)) {
                $stmtEmp = $conn->prepare(
                    "INSERT INTO client_users (client_id, emp_id, is_poc, created_date, created_time)
                     VALUES (?, ?, 0, ?, ?)"
                );
                foreach ($otherEmployees as $empId) {
                    $stmtEmp->bind_param("iiss", $projectId, $empId, $date, $time);
                    $stmtEmp->execute();
                }
            }

            $conn->commit();

            echo json_encode([
                "status" => "success",
                "message" => "Project updated successfully",
                "project_id" => $projectId
            ]);

        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;



    default:
        echo json_encode(["status" => "error", "message" => "Invalid request method"]);
        break;
}
?>