<?php
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use React\EventLoop\Factory;
use React\Socket\Server as Reactor;
use React\Http\Server as HttpServerReact;
use React\Http\Response;
use Psr\Http\Message\ServerRequestInterface;

require __DIR__ . '/../vendor/autoload.php';

class NotificationServer implements MessageComponentInterface {
    protected $clients;
    protected $userConnections; // Store user_id -> connections mapping

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->userConnections = [];
    }

    public function onOpen(ConnectionInterface $conn) {
        // Store the new connection
        $this->clients->attach($conn);
        
        // Parse query string to get user_id
        $queryString = $conn->httpRequest->getUri()->getQuery();
        parse_str($queryString, $queryParams);
        
        $userId = $queryParams['user_id'] ?? null;
        
        if ($userId) {
            // Map user_id to this connection
            $conn->userId = $userId;
            
            if (!isset($this->userConnections[$userId])) {
                $this->userConnections[$userId] = [];
            }
            $this->userConnections[$userId][] = $conn;
            
            echo "New connection for user {$userId} (ID: {$conn->resourceId})\n";
        } else {
            echo "New connection (ID: {$conn->resourceId}) - No user ID\n";
        }
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        // Parse incoming message (if any from client)
        $data = json_decode($msg, true);
        
        if ($data && isset($data['type'])) {
            switch ($data['type']) {
                case 'ping':
                    // Send pong response
                    $from->send(json_encode(['type' => 'pong']));
                    break;
                    
                case 'mark_read':
                    // Handle mark as read from client
                    // You can forward this to your main PHP app via HTTP
                    break;
            }
        }
    }

    public function onClose(ConnectionInterface $conn) {
        // Remove connection
        $this->clients->detach($conn);
        
        // Remove from user connections mapping
        if (isset($conn->userId)) {
            $userId = $conn->userId;
            
            if (isset($this->userConnections[$userId])) {
                $this->userConnections[$userId] = array_filter(
                    $this->userConnections[$userId],
                    function($connection) use ($conn) {
                        return $connection !== $conn;
                    }
                );
                
                // If no connections left for this user, remove the entry
                if (empty($this->userConnections[$userId])) {
                    unset($this->userConnections[$userId]);
                }
            }
        }
        
        echo "Connection {$conn->resourceId} has disconnected\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}\n";
        $conn->close();
    }

    // Public method to send notification to specific user
    public function sendToUser($userId, $notification) {
        if (isset($this->userConnections[$userId])) {
            $message = json_encode([
                'type' => 'notification',
                'data' => $notification
            ]);
            
            foreach ($this->userConnections[$userId] as $client) {
                $client->send($message);
            }
            
            return true;
        }
        return false;
    }
}

// Create event loop
$loop = Factory::create();

// Create WebSocket server
$webSocket = new WsServer(new NotificationServer());
$webSocket->enableKeepAlive($loop, 30); // 30 second keep-alive

// Create HTTP server for WebSocket
$webSocketServer = new HttpServer($webSocket);
$socket = new Reactor('0.0.0.0:8080', $loop);
$server = new IoServer($webSocketServer, $socket, $loop);

// Create separate HTTP server for push notifications
$httpServer = new HttpServerReact(function (ServerRequestInterface $request) use ($server) {
    $path = $request->getUri()->getPath();
    
    if ($path === '/push' && $request->getMethod() === 'POST') {
        // Parse POST data
        $content = $request->getBody()->getContents();
        parse_str($content, $postData);
        
        // Verify secret
        if (($postData['secret'] ?? '') !== 'YOUR_SECRET_KEY') {
            return new Response(403, ['Content-Type' => 'application/json'], 
                json_encode(['error' => 'Unauthorized']));
        }
        
        $userId = $postData['user_id'] ?? null;
        $notification = json_decode($postData['notification'] ?? '{}', true);
        
        if ($userId && $notification) {
            // In a real implementation, you would access the NotificationServer instance
            // This requires shared state - for simplicity, we'll use a global variable
            // In production, use React\EventLoop\Timer or database
            return new Response(200, ['Content-Type' => 'application/json'], 
                json_encode(['success' => true, 'message' => 'Notification queued']));
        }
        
        return new Response(400, ['Content-Type' => 'application/json'], 
            json_encode(['error' => 'Invalid data']));
    }
    
    return new Response(404, ['Content-Type' => 'text/plain'], 'Not Found');
});

// Listen on port 8081 for HTTP push requests
$httpSocket = new Reactor('0.0.0.0:8081', $loop);
$httpServer->listen($httpSocket);

echo "WebSocket server running on ws://0.0.0.0:8080\n";
echo "HTTP push endpoint on http://0.0.0.0:8081/push\n";

$loop->run();
?>