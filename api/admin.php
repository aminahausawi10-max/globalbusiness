<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $businessesCount = $db->query("SELECT COUNT(*) FROM businesses")->fetchColumn();
        $verifiedCount = $db->query("SELECT COUNT(*) FROM businesses WHERE verified = 1")->fetchColumn();
        $productsCount = $db->query("SELECT COUNT(*) FROM products")->fetchColumn();
        $servicesCount = $db->query("SELECT COUNT(*) FROM products WHERE is_service = 1")->fetchColumn();
        $buyingRequestsCount = $db->query("SELECT COUNT(*) FROM buying_requests")->fetchColumn();
        $pendingAssistance = $db->query("SELECT COUNT(*) FROM buying_requests WHERE status = 'New' OR status = 'Sourcing'")->fetchColumn();

        $recentBusinesses = $db->query("SELECT * FROM businesses ORDER BY id DESC LIMIT 5")->fetchAll();
        $recentRequests = $db->query("SELECT * FROM buying_requests ORDER BY id DESC LIMIT 5")->fetchAll();

        echo json_encode([
            'status' => 'success',
            'stats' => [
                'total_businesses' => (int)$businessesCount,
                'verified_businesses' => (int)$verifiedCount,
                'total_products' => (int)$productsCount,
                'total_services' => (int)$servicesCount,
                'total_buying_requests' => (int)$buyingRequestsCount,
                'active_assistance_cases' => (int)$pendingAssistance
            ],
            'recent_businesses' => $recentBusinesses,
            'recent_requests' => $recentRequests
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    // Admin actions like verify business, toggle featured, etc.
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    try {
        if ($action === 'verify_business') {
            $stmt = $db->prepare("UPDATE businesses SET verified = ? WHERE id = ?");
            $stmt->execute([(int)$data['verified'], $data['id']]);
            echo json_encode(['status' => 'success', 'message' => 'Business verification status updated']);
        } elseif ($action === 'toggle_featured') {
            $stmt = $db->prepare("UPDATE businesses SET featured = ? WHERE id = ?");
            $stmt->execute([(int)$data['featured'], $data['id']]);
            echo json_encode(['status' => 'success', 'message' => 'Featured promotion status updated']);
        } elseif ($action === 'delete_business') {
            $stmt = $db->prepare("DELETE FROM businesses WHERE id = ?");
            $stmt->execute([$data['id']]);
            echo json_encode(['status' => 'success', 'message' => 'Business removed']);
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Unknown admin action']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}
