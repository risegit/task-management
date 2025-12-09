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
            $sql1 = "SELECT t.id,t.task_name,t.remarks,t.deadline,t.status, ab.name assignedby, at.name assignedto FROM tasks t INNER JOIN task_assignees ta ON t.id=ta.task_id INNER JOIN users at ON ta.user_id=at.id INNER JOIN users ab ON t.created_by=ab.id ORDER BY t.id DESC";
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
        $query1='';
        $query2='';
        $sql1 = "INSERT INTO `tasks`(`task_name`, `deadline`, `remarks`, `created_by`, `created_date`, `created_time`) VALUES ('$taskName','$deadline','$remarks','$userId','$date','$time')";
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
        
        $sql1 = "SELECT * From tasks where id='$taskID'";
        $result1 = $conn->query($sql1);
        $query1 = '';
        $query2 = '';
        if($result1 && $result1->num_rows > 0){
            $sql3 = "UPDATE `tasks` SET `task_name`='$taskName',`deadline`='$deadline',`status`='$status',`remarks`='$remarks',`created_by`='$userId',`updated_date`='$date',`updated_time`='$time' WHERE id='$taskID'";
            if($conn->query($sql3)){
                // $query1 .= $sql3;
                $assignedByData = $result1->fetch_assoc();
                
                foreach ($assignedTos as $assignedTo) {
                    $sql2 = "SELECT * From task_assignees where task_id='$taskID' and user_id='$assignedTo'";
                    $query1 .= $sql2;
                    $result2 = $conn->query($sql2);
                    if($result2 && $result2->num_rows < 1){
                        $sql3 = "INSERT INTO `task_assignees`(`task_id`, `user_id`, `created_date`, `created_time`) VALUES ('$taskID','$assignedTo','$date','$time')";
                        $query2 .= $sql3;
                        $conn->query($sql3);
                    }
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