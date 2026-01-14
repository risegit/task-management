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

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->userConnections = [];
        $this->queueFile = __DIR__ . '/websocket_queue.json';
        
        // Create queue file if it doesn't exist
        if (!file_exists($this->queueFile)) {
            file_put_contents($this->queueFile, '[]');
        }
    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        
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
            
            // Send welcome
            $conn->send(json_encode([
                'type' => 'connected',
                'message' => 'WebSocket connected successfully',
                'user_id' => $userId
            ]));
            
            // Check for pending notifications for this user
            $this->sendPendingNotifications($userId, $conn);
        } else {
            echo "[" . date('Y-m-d H:i:s') . "] Anonymous connection rejected\n";
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
                        break;
                    case 'get_pending':
                        $this->sendPendingNotifications($from->userId, $from);
                        break;
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
            
            echo "[" . date('Y-m-d H:i:s') . "] User {$userId} disconnected\n";
        }
        
        $this->clients->detach($conn);
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "[" . date('Y-m-d H:i:s') . "] Error: " . $e->getMessage() . "\n";
        $conn->close();
    }

    protected function sendPendingNotifications($userId, $conn) {
        if (!file_exists($this->queueFile)) {
            return;
        }
        
        $queue = json_decode(file_get_contents($this->queueFile), true) ?: [];
        $newQueue = [];
        $sentCount = 0;
        
        foreach ($queue as $item) {
            if ($item['user_id'] == $userId) {
                // Send notification
                $conn->send(json_encode([
                    'type' => 'notification',
                    'data' => $item['notification'],
                    'queued' => true,
                    'original_timestamp' => $item['timestamp']
                ]));
                $sentCount++;
            } else {
                // Keep in queue for other users
                $newQueue[] = $item;
            }
        }
        
        if ($sentCount > 0) {
            echo "[" . date('Y-m-d H:i:s') . "] Sent {$sentCount} queued notifications to user {$userId}\n";
            file_put_contents($this->queueFile, json_encode($newQueue));
        }
    }

    // Method to process queue periodically
    public function processQueue() {
        if (!file_exists($this->queueFile)) {
            return;
        }
        
        $queue = json_decode(file_get_contents($this->queueFile), true) ?: [];
        if (empty($queue)) {
            return;
        }
        
        $newQueue = [];
        $sentCount = 0;
        $now = time();
        
        foreach ($queue as $item) {
            $userId = $item['user_id'];
            
            // Remove old items (older than 1 hour)
            if ($now - $item['timestamp'] > 3600) {
                continue;
            }
            
            // Check if user is connected
            if (isset($this->userConnections[$userId])) {
                foreach ($this->userConnections[$userId] as $client) {
                    $client->send(json_encode([
                        'type' => 'notification',
                        'data' => $item['notification']
                    ]));
                }
                $sentCount++;
            } else {
                // Keep in queue
                $newQueue[] = $item;
            }
        }
        
        if ($sentCount > 0) {
            echo "[" . date('Y-m-d H:i:s') . "] Processed queue: sent {$sentCount} notifications\n";
            file_put_contents($this->queueFile, json_encode($newQueue));
        }
    }
}

// Create server instance
$server = new NotificationServer();

// Create periodic timer using ReactPHP EventLoop (optional)
$loop = \React\EventLoop\Factory::create();

// Process queue every 5 seconds
$loop->addPeriodicTimer(5, function() use ($server) {
    $server->processQueue();
});

echo "=========================================\n";
echo "WebSocket Notification Server\n";
echo "=========================================\n";
echo "Starting at: " . date('Y-m-d H:i:s') . "\n";
echo "Listening on: ws://localhost:8080\n";
echo "Queue processing: Every 5 seconds\n";
echo "=========================================\n\n";

// Create Ratchet server with ReactPHP loop
$socket = new \React\Socket\Server('127.0.0.1:8080', $loop);
$wsServer = new WsServer($server);
$httpServer = new HttpServer($wsServer);

$ioServer = new IoServer($httpServer, $socket, $loop);
$loop->run();
?>