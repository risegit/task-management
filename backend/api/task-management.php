<?php
header("Access-Control-Allow-Origin: *"); // Allow requests from frontend
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include('../inc/config.php');

// include('send-notification.php');


$method = $_SERVER['REQUEST_METHOD'];
$userId = $_GET['id'] ?? null;
$taskId = $_GET['task_id'] ?? null;
$userCode = $_GET['user_code'] ?? null;
$editTask = $_GET['edit-task'] ?? null;
$viewTask = $_GET['view_task'] ?? null;
$dashboardTask = $_GET['dashboard_task'] ?? null;
$project_id = isset($_GET['project_id']) ? intval($_GET['project_id']) : 0;

if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}
date_default_timezone_set('Asia/Kolkata');
$date = date("Y-m-d");
$time = date("H:i:s");

function pushNotification(array $notification) {

    // Send FULL notification directly (no nesting)
    $payload = json_encode($notification);

    $context = stream_context_create([
        'http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: application/json\r\n",
            'content' => $payload,
            'timeout' => 2
        ]
    ]);

    @file_get_contents('http://127.0.0.1:8090', false, $context);
}



switch ($method) { 

    case 'GET':
        if($editTask){
            $userId = $_GET['user_id'] ?? null;
            // $sql1 = "SELECT t.id, t.client_id, t.task_name, c.name client_name, t.remarks, t.deadline, t.created_by, cb.name AS assigned_by_name, GROUP_CONCAT(DISTINCT ta.user_id ORDER BY ta.user_id SEPARATOR ', ') AS assigned_to_ids, GROUP_CONCAT(DISTINCT u.name ORDER BY u.name SEPARATOR ', ') AS assigned_to_names, GROUP_CONCAT(DISTINCT ta.status ORDER BY ta.status SEPARATOR ', ') AS task_status FROM tasks t INNER JOIN task_assignees ta ON t.id = ta.task_id INNER JOIN users u ON ta.user_id = u.id INNER JOIN users cb ON t.created_by = cb.id INNER JOIN clients c ON c.id=t.client_id WHERE t.id IN ( SELECT DISTINCT t2.id FROM tasks t2 LEFT JOIN task_assignees ta2 ON t2.id = ta2.task_id WHERE t2.created_by = '$userId' OR ta2.user_id = '$userId' ) GROUP BY t.id ORDER BY t.id DESC;";
            // $sql1 = "SELECT t.client_id,t.task_name,t.remarks,t.deadline,t.priority,t.status,t.created_date,t.created_by assigned_by,c.name FROM tasks t INNER JOIN clients c ON t.client_id=c.id WHERE t.id='$taskId';";
            if (!str_starts_with($userCode, 'AD') && !str_starts_with($userCode, 'MN')) {
                // Check if user is either task creator OR assigned to the task
                $authCheckSql = "SELECT COUNT(*) as count FROM tasks t 
                            LEFT JOIN task_assignees ta ON t.id = ta.task_id 
                            WHERE t.id = '$taskId' 
                            AND (t.created_by = '$userId' OR ta.user_id = '$userId')";
                $authResult = $conn->query($authCheckSql);
                $authRow = $authResult->fetch_assoc();
                
                if ($authRow['count'] < 1) {
                    echo json_encode(["status" => "error", "message" => "Not Authorised To Access the data"]);
                    exit;
                }
            }
            
            $sql1 = "SELECT t.client_id,t.task_name,t.remarks,t.deadline,t.priority,t.status,t.created_date,t.created_by assigned_by,c.name, CASE WHEN SUM(ta.status = 'in-progress') > 0 THEN 'in-progress' WHEN SUM(ta.status = 'acknowledge') > 0 THEN 'acknowledge' WHEN SUM(ta.status = 'not-acknowledge') > 0 THEN 'not-acknowledge' WHEN SUM(ta.status = 'completed') = COUNT(*) THEN 'completed' ELSE 'pending' END AS task_status FROM tasks t INNER JOIN clients c ON t.client_id=c.id INNER JOIN task_assignees ta ON t.id=ta.task_id WHERE t.id='$taskId'";
            // echo json_encode(["status" => "success","query" => $sql1]);
            $result = $conn->query($sql1);
            $data = [];
            $clientId='';
            while ($row = $result->fetch_assoc()) {
                $clientId = $row['client_id'];
                $data[] = $row;
            }

            $sql2 = "SELECT ta.task_id,ta.user_id,u.name,ta.status,ta.graphic_creative_type,ta.time,d.name dept_name FROM task_assignees ta INNER JOIN users u ON ta.user_id=u.id INNER JOIN departments d ON d.id=u.department_id  WHERE task_id='$taskId'";
            // echo json_encode(["status" => "success","query" => $sql1]);
            $result2 = $conn->query($sql2);
            $assignedTo = [];
            while ($row = $result2->fetch_assoc()) {
                $assignedTo[] = $row;
            }

            $sql3 = "SELECT cu.client_id,cu.emp_id,cu.is_poc,u.name,d.name dept_name FROM client_users cu INNER JOIN users u ON u.id=cu.emp_id INNER JOIN departments d ON d.id=u.department_id WHERE cu.client_id='$clientId'";
            // echo json_encode(["status" => "success","query" => $sql1]);
            $result3 = $conn->query($sql3);
            $userBelongsToProject = [];
            while ($row = $result3->fetch_assoc()) {
                $userBelongsToProject[] = $row;
            }

            echo json_encode(["status" => "success","data" => $data, "assignedTo" => $assignedTo, "userBelongsToProject" => $userBelongsToProject]);            
            
        }else if($viewTask){
            if (!empty($userCode)) {
                // if (str_starts_with($userCode, 'ST')) {
                //     // $taskStatusCond = "MAX(CASE WHEN ta.user_id = '$userId' THEN ta.status END)";
                //     $taskStatusCond = "CASE WHEN t.created_by = '$userId' THEN CASE WHEN SUM(ta.status = 'completed') = COUNT(*) AND COUNT(*) > 0 THEN 'completed' WHEN SUM(ta.status = 'in-progress') > 0 THEN 'in-progress' WHEN SUM(ta.status = 'acknowledge') > 0 THEN 'acknowledge' WHEN SUM(ta.status = 'not-acknowledge') > 0 THEN 'not-acknowledge' ELSE 'pending' END ELSE MAX(CASE WHEN ta.user_id = '$userId' THEN ta.status END) END";
                //     $whereClause = "WHERE t2.created_by = '$userId' OR ta2.user_id = '$userId'";
                // } elseif (str_starts_with($userCode, 'AD') || str_starts_with($userCode, 'MN')) {
                //     $taskStatusCond = "CASE WHEN SUM(ta.status = 'completed') = COUNT(*) AND COUNT(*) > 0 THEN 'completed' WHEN SUM(ta.status = 'in-progress') > 0 THEN 'in-progress' WHEN SUM(ta.status = 'acknowledge') > 0 THEN 'acknowledge' WHEN SUM(ta.status = 'not-acknowledge') > 0 THEN 'not-acknowledge' ELSE 'pending' END";
                //     $whereClause = '';
                // }
                if (str_starts_with($userCode, 'ST')) {
                    // $taskStatusCond = "MAX(CASE WHEN ta.user_id = '$userId' THEN ta.status END)";
                    $sqlDept = "SELECT * FROM client_users cu INNER JOIN users u ON u.id=cu.emp_id WHERE u.id='$userId' and cu.is_poc=1";
                    $resultPOC = $conn->query($sqlDept);
                    
                    if($resultPOC->num_rows > 0){
                        // $pocData = $resultPOC->fetch_assoc();
                        // $empId=$pocData['emp_id'];
                        $taskStatusCond = "CASE WHEN t.created_by = '$userId' THEN CASE WHEN SUM(ta.status = 'completed') = COUNT(*) AND COUNT(*) > 0 THEN 'completed' WHEN SUM(ta.status = 'in-progress') > 0 THEN 'in-progress' WHEN SUM(ta.status = 'acknowledge') > 0 THEN 'acknowledge' WHEN SUM(ta.status = 'not-acknowledge') > 0 THEN 'not-acknowledge' ELSE 'pending' END ELSE MAX(CASE WHEN ta.user_id = '$userId' THEN ta.status END) END";
                        $whereClause = "LEFT JOIN client_users cu ON cu.client_id = t.client_id AND cu.emp_id = '$userId' AND cu.is_poc = 1 WHERE ( t.created_by = '$userId' OR ta.user_id = '$userId' OR cu.emp_id IS NOT NULL )";
                    }else{
                        $taskStatusCond = "CASE WHEN t.created_by = '$userId' THEN CASE WHEN SUM(ta.status = 'completed') = COUNT(*) AND COUNT(*) > 0 THEN 'completed' WHEN SUM(ta.status = 'in-progress') > 0 THEN 'in-progress' WHEN SUM(ta.status = 'acknowledge') > 0 THEN 'acknowledge' WHEN SUM(ta.status = 'not-acknowledge') > 0 THEN 'not-acknowledge' ELSE 'pending' END ELSE MAX(CASE WHEN ta.user_id = '$userId' THEN ta.status END) END";
                        $whereClause = "WHERE t.id IN (SELECT DISTINCT t2.id FROM tasks t2 LEFT JOIN task_assignees ta2 ON t2.id = ta2.task_id WHERE t2.created_by = '$userId' OR ta2.user_id = '$userId')";
                    }
                } 
                // else if (str_starts_with($userCode, 'MN')) {
                //     $taskStatusCond = "CASE WHEN t.created_by = '$userId' THEN CASE WHEN SUM(ta.status = 'completed') = COUNT(*) AND COUNT(*) > 0 THEN 'completed' WHEN SUM(ta.status = 'in-progress') > 0 THEN 'in-progress' WHEN SUM(ta.status = 'acknowledge') > 0 THEN 'acknowledge' WHEN SUM(ta.status = 'not-acknowledge') > 0 THEN 'not-acknowledge' ELSE 'pending' END ELSE MAX(CASE WHEN ta.user_id = '$userId' THEN ta.status END) END";
                //     $whereClause = "WHERE t.id IN (SELECT DISTINCT t2.id FROM tasks t2 LEFT JOIN task_assignees ta2 ON t2.id = ta2.task_id WHERE t2.created_by = '$userId' OR ta2.user_id = '$userId')";
                // } 
                elseif (str_starts_with($userCode, 'MN')) {
                    $sqlDept = "SELECT d.id dept_id,d.name,u.id,u.name from users u INNER JOIN departments d ON d.id=u.department_id WHERE u.id='$userId'";
                    $resultDept = $conn->query($sqlDept);
                    $deptData = $resultDept->fetch_assoc();
                    $deptId=$deptData['dept_id'];
                    $taskStatusCond = "GROUP_CONCAT(DISTINCT u.department_id ORDER BY u.department_id SEPARATOR ', ') AS assigned_to_departments, CASE WHEN SUM(ta.status = 'completed') = COUNT(*) AND COUNT(*) > 0 THEN 'completed' WHEN SUM(ta.status = 'in-progress') > 0 THEN 'in-progress' WHEN SUM(ta.status = 'acknowledge') > 0 THEN 'acknowledge' WHEN SUM(ta.status = 'not-acknowledge') > 0 THEN 'not-acknowledge' ELSE 'pending' END";
                    // $whereClause = "WHERE ( cb.department_id = '$deptId' OR EXISTS ( SELECT 1 FROM task_assignees ta2 INNER JOIN users u2 ON ta2.user_id = u2.id WHERE ta2.task_id = t.id AND u2.department_id = '$deptId' ) )";
                    $whereClause = "LEFT JOIN client_users cu ON cu.client_id = t.client_id AND cu.emp_id = '$userId' AND cu.is_poc = 1 WHERE (cb.department_id = '$deptId' OR EXISTS ( SELECT 1 FROM task_assignees ta2 INNER JOIN users u2 ON ta2.user_id = u2.id WHERE ta2.task_id = t.id AND u2.department_id = '$deptId' )  OR cu.emp_id IS NOT NULL )";
                } 
                elseif (str_starts_with($userCode, 'AD')) {
                    $taskStatusCond = "CASE WHEN SUM(ta.status = 'completed') = COUNT(*) AND COUNT(*) > 0 THEN 'completed' WHEN SUM(ta.status = 'in-progress') > 0 THEN 'in-progress' WHEN SUM(ta.status = 'acknowledge') > 0 THEN 'acknowledge' WHEN SUM(ta.status = 'not-acknowledge') > 0 THEN 'not-acknowledge' ELSE 'pending' END";
                    $whereClause = 'WHERE t.id IN (SELECT DISTINCT t2.id FROM tasks t2 LEFT JOIN task_assignees ta2 ON t2.id = ta2.task_id)';
                }
            }
            // $sql1 = "SELECT t.id, t.client_id, t.task_name, c.name AS client_name, t.remarks, t.deadline, t.created_by, cb.name AS assigned_by_name, GROUP_CONCAT(DISTINCT ta.user_id ORDER BY ta.user_id SEPARATOR ', ') AS assigned_to_ids, GROUP_CONCAT(DISTINCT u.name ORDER BY u.name SEPARATOR ', ') AS assigned_to_names, ta.time, $taskStatusCond AS task_status FROM tasks t INNER JOIN task_assignees ta ON t.id = ta.task_id INNER JOIN users u ON ta.user_id = u.id INNER JOIN users cb ON t.created_by = cb.id INNER JOIN clients c ON c.id = t.client_id WHERE t.id IN (SELECT DISTINCT t2.id FROM tasks t2 LEFT JOIN task_assignees ta2 ON t2.id = ta2.task_id $whereClause) GROUP BY t.id ORDER BY t.id DESC";

            $sql1 = "SELECT t.id, t.client_id, t.task_name, c.name AS client_name, t.remarks, t.deadline, t.created_by, cb.name AS assigned_by_name, GROUP_CONCAT(DISTINCT ta.user_id ORDER BY ta.user_id SEPARATOR ', ') AS assigned_to_ids, GROUP_CONCAT(DISTINCT u.name ORDER BY u.name SEPARATOR ', ') AS assigned_to_names, ta.time, GROUP_CONCAT(DISTINCT u.department_id ORDER BY u.department_id SEPARATOR ', ') AS assigned_to_departments, $taskStatusCond AS task_status FROM tasks t INNER JOIN task_assignees ta ON t.id = ta.task_id INNER JOIN users u ON ta.user_id = u.id INNER JOIN users cb ON t.created_by = cb.id INNER JOIN clients c ON c.id = t.client_id $whereClause GROUP BY t.id ORDER BY t.id DESC";

            // $sql1 = "SELECT t.id, t.client_id, t.task_name, c.name AS client_name, t.remarks, t.deadline, t.created_by, cb.name AS assigned_by_name, GROUP_CONCAT(DISTINCT ta.user_id ORDER BY ta.user_id SEPARATOR ', ') AS assigned_to_ids, GROUP_CONCAT(DISTINCT u.name ORDER BY u.name SEPARATOR ', ') AS assigned_to_names, ta.time, GROUP_CONCAT(DISTINCT u.department_id ORDER BY u.department_id SEPARATOR ', ') AS assigned_to_departments, $taskStatusCond AS task_status FROM tasks t INNER JOIN task_assignees ta ON t.id = ta.task_id INNER JOIN users u ON ta.user_id = u.id INNER JOIN users cb ON t.created_by = cb.id INNER JOIN clients c ON c.id = t.client_id $whereClause GROUP BY t.id ORDER BY t.id DESC;";

            // echo json_encode(["status" => "success","query" => $sql1]);
            $result = $conn->query($sql1);
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }

            echo json_encode(["status" => "success","data123" => $data]);

        }else if($dashboardTask){
            if (!empty($userCode)) {
                if (str_starts_with($userCode, 'ST')) {
                    // $countCond = "CASE WHEN ta.status IN ('not-acknowledge', 'acknowledge') THEN 'acknowledge' ELSE ta.status END AS status, GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') AS clients, GROUP_CONCAT(DISTINCT t.task_name ORDER BY t.task_name SEPARATOR ', ') AS task_name, COUNT(t.id) AS count_tasks";
                    // $whereClause = "WHERE ta.user_id = '$userId' AND ( ta.status IN ('not-acknowledge', 'acknowledge') OR ( ta.status IN ('in-progress', 'completed') AND ta.updated_date = CURDATE())) GROUP BY u.id, status Order By count_tasks DESC";
                    
                    // $sql1 = "SELECT u.name, u.id AS user_id, t.client_id, t.priority, CASE WHEN t.deadline < CURDATE() AND ta.status IN ('not-acknowledge', 'acknowledge', 'in-progress') THEN 'overdue' WHEN ta.status IN ('not-acknowledge', 'acknowledge') THEN 'acknowledge' ELSE ta.status END AS status, GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') AS clients, GROUP_CONCAT(DISTINCT t.task_name ORDER BY t.task_name SEPARATOR ', ') AS task_name, COUNT(t.id) AS count_tasks FROM tasks t INNER JOIN task_assignees ta ON t.id = ta.task_id INNER JOIN users u ON ta.user_id = u.id INNER JOIN clients c ON c.id = t.client_id WHERE ( ta.status IN ('not-acknowledge', 'acknowledge') OR ( ta.status IN ('in-progress', 'completed') AND ta.updated_date = CURDATE() ) ) AND u.id = '$userId' GROUP BY u.id, CASE WHEN t.deadline < CURDATE() AND ta.status IN ('not-acknowledge', 'acknowledge', 'in-progress') THEN 'overdue' WHEN ta.status IN ('not-acknowledge', 'acknowledge') THEN 'acknowledge' ELSE ta.status END ORDER BY count_tasks DESC;";

                    $sql1 = "SELECT u.name AS name, u.id AS user_id, t.client_id, t.priority, t.id AS task_id, ta.id AS ta_id, t.deadline, CASE WHEN t.deadline < CURDATE() AND ta.status IN ('not-acknowledge', 'acknowledge', 'in-progress') THEN 'overdue' WHEN ta.status IN ('not-acknowledge', 'acknowledge') THEN 'acknowledge' ELSE ta.status END AS status, c.name AS clients, t.task_name FROM tasks t INNER JOIN task_assignees ta ON t.id = ta.task_id INNER JOIN users u ON ta.user_id = u.id INNER JOIN clients c ON c.id = t.client_id WHERE ( ( t.deadline < CURDATE() AND ta.status IN ('not-acknowledge', 'acknowledge', 'in-progress') ) OR ta.status IN ('not-acknowledge', 'acknowledge') OR ( ta.status IN ('in-progress', 'completed') AND ta.updated_date = CURDATE() ) ) AND ta.user_id = '$userId' ORDER BY CASE WHEN t.deadline < CURDATE() AND ta.status IN ('not-acknowledge', 'acknowledge', 'in-progress') THEN 1 ELSE 2 END, t.deadline DESC";

                } elseif (str_starts_with($userCode, 'AD') || str_starts_with($userCode, 'MN')) {
                    // $countCond = "CASE WHEN t.deadline < CURDATE() AND ta.status IN ('not-acknowledge', 'acknowledge') THEN 'acknowledge' ELSE ta.status END AS status, GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') AS clients, GROUP_CONCAT(DISTINCT t.task_name ORDER BY t.task_name SEPARATOR ', ') AS task_name, COUNT(t.id) AS count_tasks";
                    // $whereClause = "INNER JOIN clients c ON c.id = t.client_id WHERE ( ta.status IN ('not-acknowledge', 'acknowledge') OR ( ta.status IN ('in-progress', 'completed') AND ta.updated_date = CURDATE())) GROUP BY u.id, status ORDER BY count_tasks DESC";
                    // $whereClause = "WHERE (ta.status IN ('not-acknowledge', 'acknowledge')OR (ta.status IN ('in-progress', 'completed')AND ta.updated_date = CURDATE())) GROUP BY u.id, CASE WHEN t.deadline < CURDATE() AND ta.status IN ('not-acknowledge', 'acknowledge', 'in-progress') THEN 'overdue' WHEN ta.status IN ('not-acknowledge', 'acknowledge') THEN 'acknowledge' ELSE ta.status END ORDER BY count_tasks DESC;";

                    $sql1 = "SELECT u.name,u.id user_id,t.client_id,t.task_name,t.priority, CASE WHEN t.deadline < CURDATE() AND ta.status IN ('not-acknowledge', 'acknowledge', 'in-progress') THEN 'overdue' WHEN ta.status IN ('not-acknowledge', 'acknowledge') THEN 'acknowledge' ELSE ta.status END AS status, GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') AS clients, GROUP_CONCAT(DISTINCT t.task_name ORDER BY t.task_name SEPARATOR ', ') AS task_name, COUNT(t.id) AS count_tasks FROM tasks t INNER JOIN task_assignees ta ON t.id = ta.task_id INNER JOIN users u ON ta.user_id = u.id INNER JOIN clients c ON c.id = t.client_id WHERE ( ta.status IN ('not-acknowledge', 'acknowledge') OR ( ta.status IN ('in-progress', 'completed') AND ta.updated_date = CURDATE() ) ) GROUP BY u.id, CASE WHEN t.deadline < CURDATE() AND ta.status IN ('not-acknowledge', 'acknowledge', 'in-progress') THEN 'overdue' WHEN ta.status IN ('not-acknowledge', 'acknowledge') THEN 'acknowledge' ELSE ta.status END ORDER BY count_tasks DESC";
                }
            }
            // $sql1 = "SELECT u.name,u.id user_id,t.client_id,t.task_name,t.priority, CASE WHEN ta.status IN ('not-acknowledge', 'acknowledge') THEN 'acknowledge' ELSE ta.status END AS status, $countCond FROM tasks t INNER JOIN task_assignees ta ON t.id=ta.task_id INNER JOIN users u ON ta.user_id=u.id $whereClause";
            // $sql1 = "SELECT u.name,u.id user_id,t.client_id,t.task_name,t.priority, $countCond FROM tasks t INNER JOIN task_assignees ta ON t.id=ta.task_id INNER JOIN users u ON ta.user_id=u.id INNER JOIN clients c ON c.id = t.client_id $whereClause";
            // echo json_encode(["status" => "success","query" => $sql1]);
            $result = $conn->query($sql1);
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }

            echo json_encode(["status" => "success","data" => $data]);

        }else if($project_id){
            $sql1 = "SELECT u.name,cu.emp_id,cu.is_poc,d.name dept_name FROM clients c INNER JOIN client_users cu ON c.id=cu.client_id INNER JOIN users u ON u.id=cu.emp_id INNER JOIN departments d ON d.id=u.department_id WHERE c.id='$project_id'";
            $result = $conn->query($sql1);
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }

            echo json_encode(["status" => "success","data" => $data]);

        }else{
            if (!empty($userCode)) {
                if (str_starts_with($userCode, 'ST')) {
                    $whereClause = "cu.emp_id='$userId' and";
                } elseif (str_starts_with($userCode, 'AD') || str_starts_with($userCode, 'MN')) {
                    $whereClause = '';
                }
            }

            $sql1 = "SELECT c.id,c.name,c.status FROM clients c INNER JOIN client_users cu ON c.id=cu.client_id WHERE $whereClause c.status='active' GROUP BY cu.client_id";
            // echo json_encode(["status" => "success","query" => $sql1]);
            $result = $conn->query($sql1);
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }

            echo json_encode(["status" => "success","data" => $data]);
        }
        break;
    
    case 'POST':

        $clientId  = $_POST['project_id'] ?? '';
        $taskName  = $_POST['task_name'] ?? '';
        $timeSlot  = $_POST['time_slot'] ?? '';
        $graphicCreativeType = $_POST['graphic_type'] ?? '';
        $assignedBy = $_POST['assignedBy'] ?? '';
        $email     = $_POST['email'] ?? '';
        $deadline  = $_POST['deadline'] ?? '';
        $remarks   = $_POST['remarks'] ?? '';
        $priority  = $_POST['priority'] ?? '';

        // Decode assignedTo JSON
        $jsonAssignedTo = $_POST['assignedTo'] ?? '[]';
        $assignedTos = json_decode($jsonAssignedTo, true);

        if (!is_array($assignedTos)) {
            echo json_encode([
                "status" => "error",
                "message" => "Invalid assignedTo data"
            ]);
            exit;
        }

        /* -------------------------------
        1️⃣ Insert into tasks table
        -------------------------------- */
        $stmtTask = $conn->prepare("
            INSERT INTO tasks
            (client_id, task_name, deadline, remarks, priority, created_by, created_date, created_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmtTask->bind_param(
            "ssssssss",
            $clientId,
            $taskName,
            $deadline,
            $remarks,
            $priority,
            $userId,
            $date,
            $time
        );

        if ($stmtTask->execute()) {

            $taskId = $stmtTask->insert_id;

            /* -------------------------------
            2️⃣ Prepare task_assignees insert
            -------------------------------- */
            $stmtAssignee = $conn->prepare("
                INSERT INTO task_assignees
                (task_id, user_id, graphic_creative_type, time, created_date, created_time)
                VALUES (?, ?, ?, ?, ?, ?)
            ");

            /* -------------------------------
            3️⃣ Prepare notifications insert
            -------------------------------- */
            $stmtNotify = $conn->prepare("
                INSERT INTO notifications
                (user_id, sender_id, type, reference_id, message, created_date, created_time)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");

            $msg  = "You have been assigned a new task";
            $type = "task_assigned";

            foreach ($assignedTos as $assigned) {

                $userIdAssigned = $assigned['user_id'] ?? null;
                $deptName = $assigned['dept_name'] ?? '';

                if (!$userIdAssigned) {
                    continue;
                }

                $creative_type = (stripos($deptName, 'Graphic Design') !== false)
                    ? $graphicCreativeType
                    : '';

                $timeSlotData = (stripos($deptName, 'Graphic Design') !== false)
                    ? $timeSlot
                    : '';

                // 🔹 Insert into task_assignees
                $stmtAssignee->bind_param(
                    "iissss",
                    $taskId,
                    $userIdAssigned,
                    $creative_type,
                    $timeSlotData,
                    $date,
                    $time
                );
                $stmtAssignee->execute();

                // 🔔 Insert notification
                $stmtNotify->bind_param(
                    "iisisss",
                    $userIdAssigned,
                    $userId,
                    $type,
                    $taskId,
                    $msg,
                    $date,
                    $time
                );
                $stmtNotify->execute();
            }

            echo json_encode([
                "status" => "success",
                "message" => "Task created successfully!"
            ]);

        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Failed to create task"
            ]);
        }

        break;

case 'PUT':

    $userId   = (int)($_GET['id'] ?? 0);
    $assignedBy = (int)($_POST['assignedBy'] ?? 0);

    if($userId === $assignedBy){
        $taskId   = (int)($_POST['taskId'] ?? 0);
        
        $userName  = $_POST['userName'] ?? '';
        $taskName = trim($_POST['taskName'] ?? '');
        $graphicCreativeType = $_POST['graphic_type'] ?? '';
        $timeSlot  = $_POST['time_slot'] ?? '';
        $deadline = $_POST['deadline'] ?? '';
        $remarks  = $_POST['remarks'] ?? '';
        $priority = $_POST['priority'] ?? '';
        $status   = $_POST['status'] ?? '';
        $clientId = $_POST['client_id'] ?? '';
        
        // Decode assignedTo JSON (new format)
        $jsonAssignedTo = $_POST['assignedTo'] ?? '[]';
        $assignedTos = json_decode($jsonAssignedTo, true);

        if (!is_array($assignedTos)) {
            echo json_encode([
                "status" => "error",
                "message" => "Invalid assignedTo data"
            ]);
            exit;
        }

        if ($taskId <= 0) {
            echo json_encode(["status" => "error", "message" => "Invalid task"]);
            exit;
        }

        $conn->begin_transaction();

        try {

            /* -------------------------
            UPDATE TASK
            --------------------------*/
            $stmt = $conn->prepare("UPDATE tasks SET task_name=?, deadline=?, remarks=?, priority=?, updated_date=?, updated_time=? WHERE id=?");
            
            $stmt->bind_param(
                "ssssssi",
                $taskName,
                $deadline,
                $remarks,
                $priority,
                $date,
                $time,
                $taskId
            );

            $stmt->execute();

            // Extract user IDs from the JSON array
            $newAssigneeIds = [];
            foreach ($assignedTos as $assigned) {
                if (isset($assigned['user_id'])) {
                    $newAssigneeIds[] = (int)$assigned['user_id'];
                }
            }

            // Existing assignees
            $existing = [];
            $res = $conn->query("SELECT user_id FROM task_assignees WHERE task_id='$taskId'");
            while ($row = $res->fetch_assoc()) {
                $existing[] = $row['user_id'];
            }

            // Add new assignees (default = not-acknowledge)
            foreach ($assignedTos as $assigned) {
                $assigneeId = (int)($assigned['user_id'] ?? 0);
                $deptName = $assigned['dept_name'] ?? '';
                
                if ($assigneeId > 0 && !in_array($assigneeId, $existing)) {
                    // Set graphic_creative_type and time based on department
                    $creative_type = (stripos($deptName, 'Graphic Design') !== false)
                        ? $graphicCreativeType
                        : '';
                    
                    $timeSlotData = (stripos($deptName, 'Graphic Design') !== false)
                        ? $timeSlot
                        : '';
                    
                    $stmt = $conn->prepare("
                        INSERT INTO task_assignees 
                        (task_id, user_id, status, graphic_creative_type, time, created_date, created_time)
                        VALUES (?, ?, 'not-acknowledge', ?, ?, ?, ?)
                    ");
                    $stmt->bind_param("iissss", $taskId, $assigneeId, $creative_type, $timeSlotData, $date, $time);
                    $stmt->execute();
                }
                
                // Update existing assignees for graphic design fields if needed
                if ($assigneeId > 0 && in_array($assigneeId, $existing)) {
                    $creative_type = (stripos($deptName, 'Graphic Design') !== false)
                        ? $graphicCreativeType
                        : '';
                    
                    $timeSlotData = (stripos($deptName, 'Graphic Design') !== false)
                        ? $timeSlot
                        : '';
                    
                    // Update graphic_creative_type and time for existing assignees
                    $stmtUpdate = $conn->prepare("
                        UPDATE task_assignees 
                        SET graphic_creative_type = ?, time = ?
                        WHERE task_id = ? AND user_id = ?
                    ");
                    $stmtUpdate->bind_param("ssii", $creative_type, $timeSlotData, $taskId, $assigneeId);
                    $stmtUpdate->execute();
                }
            }

            // Remove unassigned users
            if (!empty($existing) && !empty($newAssigneeIds)) {
                $ids = implode(',', array_map('intval', $newAssigneeIds));
                $conn->query("
                    DELETE FROM task_assignees 
                    WHERE task_id='$taskId' 
                    AND user_id NOT IN ($ids)
                ");
            }

            /* ---------------------------
            DERIVE TASK STATUS
            ----------------------------*/
            $stmt = $conn->prepare("
                SELECT
                    SUM(status='completed')       AS completed,
                    SUM(status='in-progress')     AS in_progress,
                    SUM(status='acknowledge')     AS acknowledge,
                    SUM(status='not-acknowledge') AS not_ack,
                    COUNT(*)                      AS total
                FROM task_assignees
                WHERE task_id=?
            ");
            $stmt->bind_param("i", $taskId);
            $stmt->execute();
            $statusRow = $stmt->get_result()->fetch_assoc();

            // Update only THIS user's status
            $stmt = $conn->prepare("UPDATE task_assignees SET status=?, updated_date=?, updated_time=? WHERE task_id=? AND user_id=?");
            $stmt->bind_param("sssii", $status, $date, $time, $taskId, $userId);
            $stmt->execute();

            if ($statusRow['completed'] == $statusRow['total'] && $statusRow['total'] > 0) {
                $taskStatus = 'completed';
            } elseif ($statusRow['in_progress'] > 0) {
                $taskStatus = 'in-progress';
            } elseif ($statusRow['acknowledge'] > 0) {
                $taskStatus = 'acknowledged';
            } else {
                $taskStatus = 'pending';
            }

            $stmt = $conn->prepare("
                UPDATE tasks SET status=? WHERE id=?
            ");
            
            $stmt->bind_param("si", $taskStatus, $taskId);
            $stmt->execute();
            
            $rtvSenderIdResult = $conn->query("SELECT created_by FROM tasks WHERE id='$taskId'");
            $row = $rtvSenderIdResult->fetch_assoc();
            $rtvSenderId = $row['created_by'] ?? 0;

            $msg = $userName." updated task status to ".$status;
            $sqlNotify = "INSERT INTO notifications (user_id, sender_id, type, reference_id, message, created_date, created_time) VALUES('$rtvSenderId', '$userId', 'task_updated', '$taskId', '$msg', '$date', '$time');";
            $conn->query($sqlNotify);

            /* ---------------------------
            COMMIT
            ----------------------------*/
            $conn->commit();

            echo json_encode([
                "status" => "success",
                "message" => "Task updated successfully",
                "task_status" => $taskStatus
            ]);

        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode([
                "status" => "error",
                "message" => $e->getMessage()
            ]);
        }
    }else{
        $taskId     = (int)($_POST['taskId'] ?? 0);
        $userId     = (int)($_POST['userId'] ?? 0);
        $userName  = $_POST['userName'] ?? '';
        $newStatus  = $_POST['status'] ?? '';

        $allowedStatus = [
            'not-acknowledge',
            'acknowledge',
            'in-progress',
            'completed'
        ];

        if ($taskId <= 0 || $userId <= 0 || !in_array($newStatus, $allowedStatus)) {
            echo json_encode(["status" => "error", "message" => "Invalid input"]);
            exit;
        }

        $conn->begin_transaction();

        try {

            $stmt = $conn->prepare("
                UPDATE task_assignees
                SET status=?, updated_date=?, updated_time=?
                WHERE task_id=? AND user_id=?
            ");

            $stmt->bind_param("sssii", $newStatus, $date, $time, $taskId, $userId);
            $stmt->execute();

            if ($stmt->affected_rows === 0) {
                throw new Exception("No rows updated");
            }

            $rtvSenderIdResult = $conn->query("SELECT created_by FROM tasks WHERE id='$taskId'");
            $row = $rtvSenderIdResult->fetch_assoc();
            $rtvSenderId = $row['created_by'] ?? 0;

            $msg = $userName." updated task status to ".$newStatus;
            $sqlNotify = "INSERT INTO notifications (user_id, sender_id, type, reference_id, message, created_date, created_time) VALUES('$rtvSenderId', '$userId', 'task_updated', '$taskId', '$msg', '$date', '$time');";

            $conn->query($sqlNotify);

            $conn->commit();

            echo json_encode([
                "status" => "success",
                "message" => "Task status updated successfully"
            ]);

        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode([
                "status" => "error",
                "message" => $e->getMessage()
            ]);
        }

    }

    break;


    default:
        echo json_encode(["status" => "error", "message" => "Invalid request method"]);
        break;
}
?>