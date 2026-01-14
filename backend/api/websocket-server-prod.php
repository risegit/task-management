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
    protected $queueFile;
    protected $logFile;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->userConnections = [];
        $this->queueFile = __DIR__ . '/websocket-queue.json';
        $this->logFile = __DIR__ . '/websocket.log';
        
        // Create queue file if it doesn't exist
        if (!file_exists($this->queueFile)) {
            file_put_contents($this->queueFile, '[]');
        }
        
        $this->log("========================================");
        $this->log("WebSocket Notification Server Started");
        $this->log("Time: " . date('Y-m-d H:i:s'));
        $this->log("PID: " . getmypid());
        $this->log("========================================");
    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        
        $query = $conn->httpRequest->getUri()->getQuery();
        parse_str($query, $params);
        $userId = $params['user_id'] ?? null;
        
        if ($userId) {
            $conn->userId = $userId;
            
            if (!isset($this->userConnections[$userId])) {
                $this->userConnections[$userId] = [];
            }
            $this->userConnections[$userId][] = $conn;
            
            $this->log("User {$userId} connected (ID: {$conn->resourceId})");
            
            // Send welcome
            $conn->send(json_encode([
                'type' => 'connected',
                'message' => 'Connected to notification server',
                'user_id' => $userId
            ]));
            
            // Send queued notifications
            $this->sendQueuedNotifications($userId, $conn);
        }
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        try {
            $data = json_decode($msg, true);
            
            if ($data && isset($data['type'])) {
                switch ($data['type']) {
                    case 'ping':
                        $from->send(json_encode(['type' => 'pong', 'time' => time()]));
                        break;
                    case 'mark_read':
                        $this->log("User {$from->userId} marked notification as read");
                        break;
                }
            }
        } catch (\Exception $e) {
            $this->log("Error processing message: " . $e->getMessage());
        }
    }

    public function onClose(ConnectionInterface $conn) {
        if (isset($conn->userId)) {
            $userId = $conn->userId;
            
            if (isset($this->userConnections[$userId])) {
                $this->userConnections[$userId] = array_filter(
                    $this->userConnections[$userId],
                    function($c) use ($conn) { return $c !== $conn; }
                );
                
                if (empty($this->userConnections[$userId])) {
                    unset($this->userConnections[$userId]);
                }
            }
            
            $this->log("User {$userId} disconnected");
        }
        
        $this->clients->detach($conn);
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        $this->log("Error for connection {$conn->resourceId}: " . $e->getMessage());
        $conn->close();
    }

    protected function sendQueuedNotifications($userId, $conn) {
        if (!file_exists($this->queueFile)) return;
        
        $queue = json_decode(file_get_contents($this->queueFile), true) ?: [];
        $newQueue = [];
        $sentCount = 0;
        
        foreach ($queue as $item) {
            if ($item['user_id'] == $userId) {
                $conn->send(json_encode([
                    'type' => 'notification',
                    'data' => $item['notification']
                ]));
                $sentCount++;
            } else {
                $newQueue[] = $item;
            }
        }
        
        if ($sentCount > 0) {
            file_put_contents($this->queueFile, json_encode($newQueue));
            $this->log("Sent {$sentCount} queued notifications to user {$userId}");
        }
    }

    protected function log($message) {
        $logMessage = "[" . date('Y-m-d H:i:s') . "] " . $message . "\n";
        file_put_contents($this->logFile, $logMessage, FILE_APPEND);
        echo $logMessage;
    }
}

// Start server
$port = 8080; // Default port
$host = '0.0.0.0'; // Listen on all interfaces

// Check for custom port in environment
if (getenv('WS_PORT')) {
    $port = (int) getenv('WS_PORT');
}

$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new NotificationServer()
        )
    ),
    $port,
    $host
);

$server->run();
?>