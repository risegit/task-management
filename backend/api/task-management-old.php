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
            $sql1 = "SELECT t.client_id,t.task_name,t.remarks,t.deadline,t.priority,t.status,t.created_date,t.created_by assigned_by,c.name, CASE WHEN SUM(ta.status = 'in-progress') > 0 THEN 'in-progress' WHEN SUM(ta.status = 'acknowledge') > 0 THEN 'acknowledge' WHEN SUM(ta.status = 'not-acknowledge') > 0 THEN 'not-acknowledge' WHEN SUM(ta.status = 'completed') = COUNT(*) THEN 'completed' ELSE 'pending' END AS task_status FROM tasks t INNER JOIN clients c ON t.client_id=c.id INNER JOIN task_assignees ta ON t.id=ta.task_id WHERE t.id='$taskId'";
            // echo json_encode(["status" => "success","query" => $sql1]);
            $result = $conn->query($sql1);
            $data = [];
            $clientId='';
            while ($row = $result->fetch_assoc()) {
                $clientId = $row['client_id'];
                $data[] = $row;
            }

            $sql2 = "SELECT ta.task_id,ta.user_id,u.name,ta.status FROM task_assignees ta INNER JOIN users u ON ta.user_id=u.id WHERE task_id='$taskId'";
            // echo json_encode(["status" => "success","query" => $sql1]);
            $result2 = $conn->query($sql2);
            $assignedTo = [];
            while ($row = $result2->fetch_assoc()) {
                $assignedTo[] = $row;
            }

            $sql3 = "SELECT cu.client_id,cu.emp_id,cu.is_poc,u.name FROM client_users cu INNER JOIN users u ON u.id=cu.emp_id WHERE cu.client_id='$clientId'";
            // echo json_encode(["status" => "success","query" => $sql1]);
            $result3 = $conn->query($sql3);
            $userBelongsToProject = [];
            while ($row = $result3->fetch_assoc()) {
                $userBelongsToProject[] = $row;
            }

            echo json_encode(["status" => "success","data" => $data, "assignedTo" => $assignedTo, "userBelongsToProject" => $userBelongsToProject]);            
            
        }else if($viewTask){
            if (!empty($userCode)) {
                if (str_starts_with($userCode, 'ST')) {
                    // $taskStatusCond = "MAX(CASE WHEN ta.user_id = '$userId' THEN ta.status END)";
                    $taskStatusCond = "CASE WHEN t.created_by = '$userId' THEN CASE WHEN SUM(ta.status = 'completed') = COUNT(*) AND COUNT(*) > 0 THEN 'completed' WHEN SUM(ta.status = 'in-progress') > 0 THEN 'in-progress' WHEN SUM(ta.status = 'acknowledge') > 0 THEN 'acknowledge' WHEN SUM(ta.status = 'not-acknowledge') > 0 THEN 'not-acknowledge' ELSE 'pending' END ELSE MAX(CASE WHEN ta.user_id = '$userId' THEN ta.status END) END";
                    $whereClause = "WHERE t2.created_by = '$userId' OR ta2.user_id = '$userId'";
                } elseif (str_starts_with($userCode, 'AD') || str_starts_with($userCode, 'MN')) {
                    $taskStatusCond = "CASE 
                        WHEN SUM(ta.status = 'completed') = COUNT(*) AND COUNT(*) > 0 THEN 'completed'
                        WHEN SUM(ta.status = 'in-progress') > 0 THEN 'in-progress'
                        WHEN SUM(ta.status = 'acknowledge') > 0 THEN 'acknowledge'
                        WHEN SUM(ta.status = 'not-acknowledge') > 0 THEN 'not-acknowledge'
                        ELSE 'pending'
                    END";
                    $whereClause = '';
                }
            }
            // $sql1 = "SELECT t.id, t.client_id, t.task_name, c.name client_name, t.remarks, t.deadline, t.created_by, cb.name AS assigned_by_name, GROUP_CONCAT(DISTINCT ta.user_id ORDER BY ta.user_id SEPARATOR ', ') AS assigned_to_ids, GROUP_CONCAT(DISTINCT u.name ORDER BY u.name SEPARATOR ', ') AS assigned_to_names, GROUP_CONCAT(DISTINCT ta.status ORDER BY ta.status SEPARATOR ', ') AS task_status FROM tasks t INNER JOIN task_assignees ta ON t.id = ta.task_id INNER JOIN users u ON ta.user_id = u.id INNER JOIN users cb ON t.created_by = cb.id INNER JOIN clients c ON c.id=t.client_id WHERE t.id IN ( SELECT DISTINCT t2.id FROM tasks t2 LEFT JOIN task_assignees ta2 ON t2.id = ta2.task_id $whereClause ) GROUP BY t.id ORDER BY t.id DESC;";
            $sql1 = "SELECT t.id, t.client_id, t.task_name, c.name AS client_name, t.remarks, t.deadline, t.created_by, cb.name AS assigned_by_name, GROUP_CONCAT(DISTINCT ta.user_id ORDER BY ta.user_id SEPARATOR ', ') AS assigned_to_ids, GROUP_CONCAT(DISTINCT u.name ORDER BY u.name SEPARATOR ', ') AS assigned_to_names, $taskStatusCond AS task_status FROM tasks t INNER JOIN task_assignees ta ON t.id = ta.task_id INNER JOIN users u ON ta.user_id = u.id INNER JOIN users cb ON t.created_by = cb.id INNER JOIN clients c ON c.id = t.client_id WHERE t.id IN (SELECT DISTINCT t2.id FROM tasks t2 LEFT JOIN task_assignees ta2 ON t2.id = ta2.task_id $whereClause) GROUP BY t.id ORDER BY t.id DESC";
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
                    $countCond = "GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') AS clients, GROUP_CONCAT(DISTINCT t.task_name ORDER BY t.task_name SEPARATOR ', ') AS task_name, COUNT(t.id) AS count_tasks";
                    $whereClause = "INNER JOIN clients c ON c.id = t.client_id WHERE ta.user_id = '$userId' AND ( ta.status IN ('not-acknowledge', 'acknowledge') OR ( ta.status IN ('in-progress', 'completed') AND ta.updated_date = CURDATE())) GROUP BY u.id, status Order By count_tasks DESC";
                } elseif (str_starts_with($userCode, 'AD') || str_starts_with($userCode, 'MN')) {
                    $countCond = "GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') AS clients, GROUP_CONCAT(DISTINCT t.task_name ORDER BY t.task_name SEPARATOR ', ') AS task_name, COUNT(t.id) AS count_tasks";
                    $whereClause = "INNER JOIN clients c ON c.id = t.client_id WHERE ( ta.status IN ('not-acknowledge', 'acknowledge') OR ( ta.status IN ('in-progress', 'completed') AND ta.updated_date = CURDATE())) GROUP BY u.id, status ORDER BY count_tasks DESC";
                }
            }
            $sql1 = "SELECT u.name,u.id user_id,t.client_id,t.task_name,t.priority, CASE WHEN ta.status IN ('not-acknowledge', 'acknowledge') THEN 'acknowledge' ELSE ta.status END AS status, $countCond FROM tasks t INNER JOIN task_assignees ta ON t.id=ta.task_id INNER JOIN users u ON ta.user_id=u.id $whereClause";
            // echo json_encode(["status" => "success","query" => $sql1]);
            $result = $conn->query($sql1);
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }

            echo json_encode(["status" => "success","data" => $data]);

        }else if($project_id){
            $sql1 = "SELECT u.name,cu.emp_id,cu.is_poc FROM clients c INNER JOIN client_users cu ON c.id=cu.client_id INNER JOIN users u ON u.id=cu.emp_id WHERE c.id='$project_id'";
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
        $clientId=$_POST['project_id'] ?? '';
        $taskName=$_POST['task_name'] ?? '';
        $assignedBy = $_POST['assignedBy'] ?? '';
        $email = $_POST['email'] ?? '';
        $deadline = $_POST['deadline'] ?? '';
        $remarks = $_POST['remarks'] ?? '';
        $priority = $_POST['priority'] ?? '';
        
        $jsonAssignedTo = isset($_POST['assignedTo']) ? $_POST['assignedTo'] : '';
        $assignedTos = json_decode($jsonAssignedTo, true);
        $query1='';
        $query2='';
        $sql1 = "INSERT INTO `tasks`(`client_id`,`task_name`, `deadline`, `remarks`, `priority` , `created_by`, `created_date`, `created_time`) VALUES ('$clientId','$taskName','$deadline','$remarks','$priority','$userId','$date','$time')";
        $taskId=0;
        if($conn->query($sql1)){
            $taskId = $conn->insert_id;
            foreach ($assignedTos as $assignedTo) {
                $sql2 = "INSERT INTO `task_assignees`(`task_id`, `user_id`, `created_date`, `created_time`) VALUES ('$taskId','$assignedTo','$date','$time')";
                $query2 .= $sql2;
                $conn->query($sql2);
            }
        }
        foreach ($assignedTos as $empId) {
            $msg = "You have been assigned a new task";
            $sqlNotify = "
                INSERT INTO notifications
                (user_id, sender_id, type, reference_id, message, created_date, created_time)
                VALUES
                ('$empId', '$userId', 'task_assigned', '$taskId', '$msg', '$date', '$time');
            ";

            $conn->query($sqlNotify);
            $notificationId = $conn->insert_id; // Get the inserted notification ID
            // echo json_encode(["status" => "success","notificationId" => $notificationId]); 
            // Fetch full notification details
            $query = "SELECT n.*, u.name as sender_name 
                    FROM notifications n 
                    LEFT JOIN users u ON n.sender_id = u.id 
                    WHERE n.id = $notificationId";
            $result = $conn->query($query);
            $notification = $result->fetch_assoc();

            // Push to WebSocket
            // sendToWebSocket($notification['user_id'], $notification);
            $notification['url'] = "/tasks/view/".$taskId;
            $notification['title'] = "Task Assigned";
            // pushNotification($notification);
        }
        echo json_encode(["status" => "success", "message" => "Task created successfully!", "query1" => $query1, "query2" => $query2]);
        
        
        break;

case 'PUT':
    if(empty($_POST['update_status'])){
        $taskId   = (int)($_POST['taskId'] ?? 0);
        $userId   = (int)($_GET['id'] ?? 0);
        $userName  = $_POST['userName'] ?? '';
        $taskName = trim($_POST['taskName'] ?? '');
        $deadline = $_POST['deadline'] ?? '';
        $remarks  = $_POST['remarks'] ?? '';
        $priority = $_POST['priority'] ?? '';
        $status   = $_POST['status'] ?? '';
        $assignedBy = (int)($_POST['assignedBy'] ?? 0);

        if ($taskId <= 0) {
            echo json_encode(["status" => "error", "message" => "Invalid task"]);
            exit;
        }

        // assignedTo: "1,2,3"
        $assignedTos = [];
        if (!empty($_POST['assignedTo'])) {
            $assignedTos = explode(',', $_POST['assignedTo']);
        }

        $conn->begin_transaction();

        try {

            /* -------------------------
            UPDATE TASK
            --------------------------*/
            $stmt = $conn->prepare("UPDATE tasks SET task_name=?, deadline=?, remarks=?, priority=?, updated_date=?, updated_time=? WHERE id=?");

            $query1 = "UPDATE tasks SET task_name='$taskName', deadline='$deadline', remarks='$remarks', priority='$priority', updated_date='$date', updated_time='$time' WHERE id='$taskId'"

            echo json_encode(["status" => "success","query1" => $query1]);

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

            // Existing assignees
            $existing = [];
            $res = $conn->query("SELECT user_id FROM task_assignees WHERE task_id='$taskId'");
            while ($row = $res->fetch_assoc()) {
                $existing[] = $row['user_id'];
            }
            $query2 = '';
            // Add new assignees (default = not-acknowledge)
            foreach ($assignedTos as $userId) {
                if (!in_array($userId, $existing)) {
                    $stmt = $conn->prepare("
                        INSERT INTO task_assignees 
                        (task_id, user_id, status, created_date, created_time)
                        VALUES (?, ?, 'not-acknowledge', ?, ?)
                    ");
                    $query2 .="INSERT INTO task_assignees(task_id, user_id, status, created_date, created_time) VALUES ('$taskId', '$userId', 'not-acknowledge', '$date', '$time')";
                    $stmt->bind_param("iiss", $taskId, $userId, $date, $time);
                    $stmt->execute();
                }
            }
            echo json_encode(["status" => "success","query2" => $query2]);

            // Remove unassigned users
            if (!empty($existing)) {
                $ids = implode(',', array_map('intval', $assignedTos));
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
            $query3 = "UPDATE task_assignees SET status='$status', updated_date='$date', updated_time='$time' WHERE task_id='$taskId' AND user_id='$userId'";
            $stmt = $conn->prepare("UPDATE task_assignees SET status=?, updated_date=?, updated_time=? WHERE task_id=? AND user_id=?");
            $stmt->bind_param("sssii", $status, $date, $time, $taskId, $userId);
            $stmt->execute();
            echo json_encode(["status" => "success","query3" => $query3]); 
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

            $query4 = "UPDATE tasks SET status='$taskStatus' WHERE id='$taskId'";
            echo json_encode(["status" => "success","query4" => $query4]);
            
            $rtvSenderIdResult = $conn->query("SELECT created_by FROM tasks WHERE id='$taskId'");
            $row = $rtvSenderIdResult->fetch_assoc();
            $rtvSenderId = $row['created_by'] ?? 0;

            $msg = $userName." updated task status to ".$status;
            $sqlNotify = "INSERT INTO notifications (user_id, sender_id, type, reference_id, message, created_date, created_time) VALUES('$rtvSenderId', '$userId', 'task_updated', '$taskId', '$msg', '$date', '$time');";
            // echo json_encode(["status" => "success","sql1" => $sqlNotify]);
            $conn->query($sqlNotify);
            /* ---------------------------
            COMMIT
            ----------------------------*/
            $conn->commit();

            echo json_encode([
                "status" => "success",
                "message" => "Task updated successfully",
                "task_status1" => $taskStatus
            ]);

            // /* -------------------------
            //    REMOVE OLD ASSIGNEES
            // --------------------------*/
            // $stmtDel = $conn->prepare(
            //     "DELETE FROM task_assignees WHERE task_id=?"
            // );
            // $stmtDel->bind_param("i", $taskId);
            // $stmtDel->execute();

            // /* -------------------------
            //    INSERT NEW ASSIGNEES
            // --------------------------*/
            // if (!empty($assignedTos)) {
            //     $stmtIns = $conn->prepare(
            //         "INSERT INTO task_assignees (task_id, user_id, status, created_date, created_time)
            //          VALUES (?, ?, ?, ?, ?)"
            //     );

            //     foreach ($assignedTos as $userId) {
            //         $stmtIns->bind_param(
            //             "iisss",
            //             $taskID,
            //             $userId,
            //             $status,
            //             $date,
            //             $time
            //         );
            //         $stmtIns->execute();
            //     }
            // }

            // $conn->commit();

            // echo json_encode([
            //     "status" => "success",
            //     "message" => "Task updated successfully"
            // ]);

        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode([
                "status" => "error",
                "message" => $e->getMessage()
            ]);
        }
    }else{
        $taskId     = (int)($_POST['task_id'] ?? 0);
        $userId     = (int)($_POST['userId'] ?? 0);
        $userName  = $_POST['userName'] ?? '';
        $newStatus  = $_POST['task_status'] ?? '';
        $update_status = $_POST['update_status'] ?? '';

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

            // echo json_encode(["status" => "success","sql2" => $sqlNotify]);

            $conn->query($sqlNotify);

            $conn->commit();

            echo json_encode([
                "status" => "success",
                "message1" => "Task status updated successfully"
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