<?php
header("Access-Control-Allow-Origin: *"); // Allow requests from frontend
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include('../inc/config.php');

$method = $_SERVER['REQUEST_METHOD'];
$userId = $_GET['id'] ?? null;
$userCode = $_GET['user_code'] ?? null;
$viewTaskOld = $_GET['view_task_old'] ?? null;
$viewTask = $_GET['view_task'] ?? null;
$project_id = isset($_GET['project_id']) ? intval($_GET['project_id']) : 0;

if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}

$date = date("Y-m-d");
$time = date("H:i:s");

switch ($method) { 

    case 'GET':
        if($viewTaskOld){
            if (!empty($userCode)) {
                if (str_starts_with($userCode, 'ST')) {
                    $sql1 = "SELECT t.id, t.task_name, t.remarks, t.deadline, COALESCE(ta.status, ta.status) AS status, t.created_by, ta.user_id AS assigned_to, ab.id AS assignedby, ab.name AS assignedby_name , ua.id AS assignedto, ua.name AS assignedto_name FROM tasks t LEFT JOIN task_assignees ta ON t.id = ta.task_id LEFT JOIN users ab ON t.created_by = ab.id LEFT JOIN users ua ON ta.user_id = ua.id WHERE t.created_by = '$userId' OR ta.user_id = '$userId'";
                } elseif (str_starts_with($userCode, 'AD') || str_starts_with($userCode, 'MN')) {
                    $sql1 = "SELECT t.id,t.task_name,t.remarks,t.deadline, ta.status, ab.id assignedby, ab.name assignedby_name, at.id assignedto, at.name assignedto_name FROM tasks t INNER JOIN task_assignees ta ON t.id=ta.task_id INNER JOIN users at ON ta.user_id=at.id INNER JOIN users ab ON t.created_by=ab.id ORDER BY t.id DESC";
                }
                $result = $conn->query($sql1);
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }

            $sql2 = "SELECT * FROM users WHERE status='active'";
            $result2 = $conn->query($sql2);
            $staff = [];
            while ($row2 = $result2->fetch_assoc()) {
                $staff[] = $row2;
            }

            echo json_encode(["status" => "success","data" => $data, 'staff' => $staff]);
            }else{
                echo json_encode(["status" => "error", "data" => "Something went wrong"]);
            }
                        
            
        }else if($viewTask){
            if (!empty($userCode)) {
                if (str_starts_with($userCode, 'ST')) {
                    $whereClause = "WHERE t2.created_by = '$userId' OR ta2.user_id = '$userId'";
                } elseif (str_starts_with($userCode, 'AD') || str_starts_with($userCode, 'MN')) {
                    $whereClause = '';
                }
            }
            $sql1 = "SELECT t.id, t.client_id, t.task_name, c.name client_name, t.remarks, t.deadline, t.created_by, cb.name AS assigned_by_name, GROUP_CONCAT(DISTINCT ta.user_id ORDER BY ta.user_id SEPARATOR ', ') AS assigned_to_ids, GROUP_CONCAT(DISTINCT u.name ORDER BY u.name SEPARATOR ', ') AS assigned_to_names, GROUP_CONCAT(DISTINCT ta.status ORDER BY ta.status SEPARATOR ', ') AS task_status FROM tasks t INNER JOIN task_assignees ta ON t.id = ta.task_id INNER JOIN users u ON ta.user_id = u.id INNER JOIN users cb ON t.created_by = cb.id INNER JOIN clients c ON c.id=t.client_id WHERE t.id IN ( SELECT DISTINCT t2.id FROM tasks t2 LEFT JOIN task_assignees ta2 ON t2.id = ta2.task_id $whereClause ) GROUP BY t.id ORDER BY t.id DESC;";
            // echo json_encode(["status" => "success","query" => $sql1]);
            $result = $conn->query($sql1);
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }

            echo json_encode(["status" => "success","data123" => $data]);

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
        $sql1 = "INSERT INTO `tasks`(`client_id`,`task_name`, `deadline`, `remarks`, `created_by`, `created_date`, `created_time`) VALUES ('$clientId','$taskName','$deadline','$remarks','$userId','$date','$time')";
        if($conn->query($sql1)){
            $task_id = $conn->insert_id;
            foreach ($assignedTos as $assignedTo) {
                $sql2 = "INSERT INTO `task_assignees`(`task_id`, `user_id`, `created_date`, `created_time`) VALUES ('$task_id','$assignedTo','$date','$time')";
                $query2 .= $sql2;
                $conn->query($sql2);
            }
        }
        echo json_encode(["status" => "success", "message" => "Task created successfully!", "query1" => $query1, "query2" => $query2]);
        
        
        break;

    case 'PUT':
        $taskID=$_POST['task_id'] ?? '';
        $taskName=$_POST['task_name'] ?? '';
        $assignedBy = $_POST['assignedBy'] ?? '';
        $email = $_POST['email'] ?? '';
        $deadline = $_POST['deadline'] ?? '';
        $status = $_POST['status'] ?? '';
        $remarks = $_POST['remarks'] ?? '';
        
        $jsonAssignedTo = isset($_POST['assignedTo']) ? $_POST['assignedTo'] : '';
        $assignedTos = json_decode($jsonAssignedTo, true);
        // $taskvar=var_dump($assignedTos);
        // echo json_encode(["status" => "success", "message" => $taskvar]);
        
        $sql1 = "SELECT * FROM tasks t INNER JOIN task_assignees ta ON t.id=ta.task_id WHERE t.id='$taskID'";
        $result1 = $conn->query($sql1);
        $query1 = '';
        $query2 = '';
        if($result1 && $result1->num_rows > 0){
            $assignedByData = $result1->fetch_assoc();
            $assignedBy = $assignedByData['created_by'];
            $userId = $assignedByData['user_id'];
            // $sql2 = "UPDATE `tasks` SET `task_name`='$taskName',`deadline`='$deadline', `remarks`='$remarks',`created_by`='$assignedBy',`updated_date`='$date',`updated_time`='$time' WHERE id='$taskID'";
            $stmt = $conn->prepare("UPDATE tasks SET task_name=?, deadline=?, remarks=?, created_by=?, updated_date=?, updated_time=? WHERE id=?");

            $stmt->bind_param("ssssssi", 
            $taskName, 
            $deadline, 
            $remarks, 
            $assignedBy, 
            $date, 
            $time, 
            $taskID
            );

            $stmt->execute();


            // $conn->query($sql2);

            $sql3 = "UPDATE `task_assignees` SET `status`='$status',`updated_date`='$date',`updated_time`='$time' WHERE task_id='$taskID' and user_id='$userId'";
            $conn->query($sql3);
            
                $query1 .= $sql3;
                // $assignedByData = $result1->fetch_assoc();
                foreach ($assignedTos as $assignedTo) {
                    $sql4 = "SELECT * From task_assignees where task_id='$taskID' and user_id='$assignedTo'";
                    // $query1 .= $sql3;
                    $query2 .= $sql4;
                    $result4 = $conn->query($sql4);
                    if($result4 && $result4->num_rows < 1){
                        $sql5 = "INSERT INTO `task_assignees`(`task_id`, `user_id`, `created_date`, `created_time`) VALUES ('$taskID','$assignedTo','$date','$time')";
                        
                        $conn->query($sql5);
                    }
                }
            
            echo json_encode(["status" => "success", "message" => "Task Updated Successfully"]);
        }else{
            echo json_encode(["status" => "error", "message" => "Task not valid"]);    
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Invalid request method"]);
        break;
}
?>