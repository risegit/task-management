<?php
header("Access-Control-Allow-Origin: *"); // Allow requests from frontend
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include('../inc/config.php');

$method = $_SERVER['REQUEST_METHOD'];
$userId = $_GET['id'] ?? null;
$viewTask = $_GET['view-task'] ?? null;

if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}

$date = date("Y-m-d");
$time = date("H:i:s");

switch ($method) { 

    case 'GET':
        if($viewTask){
            $sql1 = "SELECT t.id,t.task_name, u1.name AS assignedby, u2.name AS assignedto, t.deadline, t.remarks, t.status FROM tasks t INNER JOIN users u1 ON t.assigned_by = u1.id INNER JOIN users u2 ON t.assigned_to = u2.id;";
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
            $sql1 = "SELECT * FROM users WHERE status='active'";
            $result = $conn->query($sql1);
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }

            echo json_encode(["status" => "success","data" => $userId ? ($data[0] ?? null) : $data]);
        }
        break;
    
    case 'POST':
        $taskName=$_POST['task_name'] ?? '';
        $assignedBy = $_POST['assignedBy'] ?? '';
        $email = $_POST['email'] ?? '';
        $deadline = $_POST['deadline'] ?? '';
        $remarks = $_POST['remarks'] ?? '';
        
        $jsonAssignedTo = isset($_POST['assignedTo']) ? $_POST['assignedTo'] : '';
        $assignedTos = json_decode($jsonAssignedTo, true);
            
        foreach ($assignedTos as $assignedTo) {
            $sql1 = "INSERT INTO `tasks`(`task_name`, `assigned_by`, `assigned_to`, `deadline`, `remarks`, `updated_by`, `created_date`, `created_time`) VALUES ('$taskName','$assignedBy','$assignedTo','$deadline','$remarks','$userId','$date','$time')";
            $conn->query($sql1);
            
        }
        echo json_encode(["status" => "success", "message" => "Task created successfully!"]);
        
        
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
        $sql1 = "SELECT * From tasks where id='$taskID'";
        $result1 = $conn->query($sql1);
        if($result1 && $result1->num_rows > 0){
            foreach ($assignedTos as $assignedTo) {
                $sql1 = "UPDATE `tasks` SET `task_name`='$taskName',`assigned_to`='$assignedTo',`deadline`='$deadline',`status`='$status',`remarks`='$remarks',`updated_by`='$userId',`updated_date`='$date',`updated_time`='$time' WHERE ";
                $conn->query($sql1);
            }
            echo json_encode(["status" => "success", "message" => "Task updated successfully!"]);
        }else{
            echo json_encode(["status" => "error", "message" => "Task not valid"]);    
        }

    default:
        echo json_encode(["status" => "error", "message" => "Invalid request method"]);
        break;
}
?>