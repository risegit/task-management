<?php
/**
 * Simple WebSocket + HTTP Bridge Server for Windows
 * Run: php websocket-simple-win.php
 */

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use React\EventLoop\Factory;
use React\Socket\SocketServer;
use React\Http\HttpServer as ReactHttpServer;
use React\Http\Message\Response;
use Psr\Http\Message\ServerRequestInterface;

require __DIR__ . '/../vendor/autoload.php';

class SimpleNotificationServer implements MessageComponentInterface {

    protected $clients;
    protected $userConnections = [];

    public function __construct() {
        $this->clients = new \SplObjectStorage();
        echo "WebSocket Server initialized\n";
    }

    /* -------------------- WS EVENTS -------------------- */

    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);

        parse_str($conn->httpRequest->getUri()->getQuery(), $params);
        $userId = $params['user_id'] ?? null;

        if (!$userId) {
            $conn->close();
            return;
        }

        $conn->userId = (string)$userId;

        // ✅ allow ONLY ONE connection per user
        if (isset($this->userConnections[$conn->userId])) {
            $this->userConnections[$conn->userId]->close();
        }

        $this->userConnections[$conn->userId] = $conn;

        echo "[" . date('H:i:s') . "] User {$conn->userId} connected\n";

        $conn->send(json_encode([
            "type" => "connected",
            "user_id" => $conn->userId
        ]));
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        echo "[" . date('H:i:s') . "] Message from user {$from->userId}: {$msg}\n";

        $data = json_decode($msg, true);

        if (($data['type'] ?? '') === 'ping') {
            $from->send(json_encode(["type" => "pong"]));
        }

        if (($data['type'] ?? '') === 'test_notification') {
            $this->sendToUser($from->userId, [
                "message" => "This is a WebSocket test",
                "url" => "/dashboard"
            ]);
        }
    }

    public function onClose(ConnectionInterface $conn) {
        $this->clients->detach($conn);

        if (isset($conn->userId) && isset($this->userConnections[$conn->userId])) {
            unset($this->userConnections[$conn->userId]);
            echo "[" . date('H:i:s') . "] User {$conn->userId} disconnected\n";
        }
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "Error: {$e->getMessage()}\n";
        $conn->close();
    }

    /* -------------------- SEND TO USER -------------------- */

    public function sendToUser($userId, array $payload) {
        $userId = (string)$userId;

        if (!isset($this->userConnections[$userId])) {
            echo "User {$userId} not connected\n";
            return;
        }

        $this->userConnections[$userId]->send(json_encode([
            "type" => "notification",
            "data" => $payload
        ]));

        echo "[" . date('H:i:s') . "] Notification sent to user {$userId}\n";
    }
}

/* ================== BOOTSTRAP ================== */

$loop = Factory::create();
$wsServer = new SimpleNotificationServer();

/* ---------- WebSocket ---------- */
$webSock = new SocketServer('127.0.0.1:8080', [], $loop);

new IoServer(
    new HttpServer(new WsServer($wsServer)),
    $webSock,
    $loop
);

/* ---------- HTTP Bridge (PHP → WS) ---------- */
$httpServer = new ReactHttpServer(function (ServerRequestInterface $request) use ($wsServer) {

    if ($request->getMethod() !== 'POST') {
        return new Response(405, [], 'Only POST allowed');
    }

    $data = json_decode((string)$request->getBody(), true);

    if (!$data || empty($data['user_id'])) {
        return new Response(400, [], 'Invalid payload');
    }

    // ✅ SEND FULL PAYLOAD (no overwriting)
    $wsServer->sendToUser($data['user_id'], $data);

    return new Response(200, [], 'OK');
});

$httpSock = new SocketServer('127.0.0.1:8090', [], $loop);
$httpServer->listen($httpSock);

/* ---------- START ---------- */

echo "=========================================\n";
echo "WebSocket Server: ws://localhost:8080\n";
echo "HTTP Bridge:      http://localhost:8090\n";
echo "Started at:       " . date('Y-m-d H:i:s') . "\n";
echo "=========================================\n";

$loop->run();
