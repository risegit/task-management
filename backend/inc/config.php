<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

$servername = "v3t.com";
$username = "one_suite_user";
$password = "~sl4ew&U[#I3";
$database = "one-suite"; 

$conn = new mysqli($servername, $username, $password, $database);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    // test
    exit; 
}
?>
