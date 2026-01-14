<?php
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;

require __DIR__ . '/../vendor/autoload.php';

class NotificationServer implements MessageComponentInterface {
    protected $clients;
    protected $userConnections;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->userConnections = [];
    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        
        // Get query parameters
        $queryString = $conn->httpRequest->getUri()->getQuery();
        parse_str($queryString, $queryParams);
        $userId = $queryParams['user_id'] ?? null;
        
        if ($userId) {
            $conn->userId = $userId;
            
            if (!isset($this->userConnections[$userId])) {
                $this->userConnections[$userId] = [];
            }
            $this->userConnections[$userId][] = $conn;
            
            echo "[" . date('Y-m-d H:i:s') . "] User {$userId} connected (ID: {$conn->resourceId})\n";
            
            // Send welcome message
            $conn->send(json_encode([
                'type' => 'connected',
                'message' => 'WebSocket connected successfully',
                'user_id' => $userId,
                'timestamp' => time()
            ]));
        } else {
            echo "[" . date('Y-m-d H:i:s') . "] Anonymous connection rejected (ID: {$conn->resourceId})\n";
            $conn->close();
        }
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        try {
            $data = json_decode($msg, true);
            
            if ($data && isset($data['type'])) {
                switch ($data['type']) {
                    case 'ping':
                        $from->send(json_encode(['type' => 'pong', 'time' => time()]));
                        echo "[" . date('Y-m-d H:i:s') . "] Ping from user {$from->userId}\n";
                        break;
                    case 'mark_read':
                        echo "[" . date('Y-m-d H:i:s') . "] User {$from->userId} marked notification as read\n";
                        break;
                    default:
                        echo "[" . date('Y-m-d H:i:s') . "] Unknown message from user {$from->userId}: {$msg}\n";
                }
            }
        } catch (\Exception $e) {
            echo "[" . date('Y-m-d H:i:s') . "] Error: " . $e->getMessage() . "\n";
        }
    }

    public function onClose(ConnectionInterface $conn) {
        if (isset($conn->userId)) {
            $userId = $conn->userId;
            
            if (isset($this->userConnections[$userId])) {
                $this->userConnections[$userId] = array_filter(
                    $this->userConnections[$userId],
                    function($connection) use ($conn) {
                        return $connection !== $conn;
                    }
                );
                
                if (empty($this->userConnections[$userId])) {
                    unset($this->userConnections[$userId]);
                }
            }
            
            echo "[" . date('Y-m-d H:i:s') . "] User {$userId} disconnected (ID: {$conn->resourceId})\n";
        }
        
        $this->clients->detach($conn);
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "[" . date('Y-m-d H:i:s') . "] Error: " . $e->getMessage() . "\n";
        $conn->close();
    }
}

// Start the server
echo "=========================================\n";
echo "WebSocket Notification Server\n";
echo "=========================================\n";
echo "Starting at: " . date('Y-m-d H:i:s') . "\n";
echo "Listening on: ws://localhost:8080\n";
echo "=========================================\n\n";

$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new NotificationServer()
        )
    ),
    8080,
    '127.0.0.1'  // Listen only on localhost for security
);

$server->run();