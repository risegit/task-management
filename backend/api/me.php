<?php
include('../inc/config.php');
require_once('../lib/src/JWT.php');
require_once('../lib/src/Key.php');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    echo json_encode(["status" => "error", "message" => "Not authenticated"]);
    exit;
}

$token = $matches[1];

try {
    $payload = \Firebase\JWT\JWT::decode($token, new \Firebase\JWT\Key($jwt_secret, 'HS256'));
    $userId = $payload->user->id;

    $sql = "SELECT id, name, role, status FROM users WHERE id='$userId' LIMIT 1";
    $result = $conn->query($sql);
    $user = $result->fetch_assoc();

    echo json_encode(["status" => "success", "user" => $user]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Invalid token"]);
}
