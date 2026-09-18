<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $action = $_GET['action'] ?? 'overview';

    try {
        if ($action === 'overview') {
            $businessesCount = (int)$db->query("SELECT COUNT(*) FROM businesses")->fetchColumn();
            $verifiedCount = (int)$db->query("SELECT COUNT(*) FROM businesses WHERE verified = 1")->fetchColumn();
            $productsCount = (int)$db->query("SELECT COUNT(*) FROM products")->fetchColumn();
            $servicesCount = (int)$db->query("SELECT COUNT(*) FROM products WHERE is_service = 1")->fetchColumn();
            $buyingRequestsCount = (int)$db->query("SELECT COUNT(*) FROM buying_requests")->fetchColumn();
            $activeAssistance = (int)$db->query("SELECT COUNT(*) FROM buying_requests WHERE status NOT IN ('Completed', 'Cancelled')")->fetchColumn();
            $revenueEstimate = (float)$db->query("SELECT COALESCE(SUM(service_fee), 0) FROM buying_requests")->fetchColumn();

            $recentBusinesses = $db->query("SELECT * FROM businesses ORDER BY id DESC LIMIT 5")->fetchAll();
            $recentRequests = $db->query("SELECT * FROM buying_requests ORDER BY id DESC LIMIT 5")->fetchAll();

            echo json_encode([
                'status' => 'success',
                'stats' => [
                    'total_businesses' => $businessesCount,
                    'verified_businesses' => $verifiedCount,
                    'total_products' => $productsCount,
                    'total_services' => $servicesCount,
                    'total_buying_requests' => $buyingRequestsCount,
                    'active_assistance_cases' => $activeAssistance,
                    'estimated_revenue' => $revenueEstimate
                ],
                'recent_businesses' => $recentBusinesses,
                'recent_requests' => $recentRequests
            ]);
        } elseif ($action === 'businesses') {
            $stmt = $db->query("SELECT * FROM businesses ORDER BY id DESC");
            echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
        } elseif ($action === 'products') {
            $stmt = $db->query("SELECT p.*, b.name AS business_name FROM products p JOIN businesses b ON p.business_id = b.id ORDER BY p.id DESC");
            echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
        } elseif ($action === 'buying_requests') {
            $stmt = $db->query("SELECT * FROM buying_requests ORDER BY id DESC");
            echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
        } elseif ($action === 'categories') {
            $stmt = $db->query("SELECT * FROM categories ORDER BY id ASC");
            echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
        } elseif ($action === 'reviews') {
            $stmt = $db->query("SELECT r.*, b.name AS business_name FROM reviews r JOIN businesses b ON r.business_id = b.id ORDER BY r.id DESC");
            echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid action parameter']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    try {
        if ($action === 'verify_business') {
            $stmt = $db->prepare("UPDATE businesses SET verified = ? WHERE id = ?");
            $stmt->execute([(int)$data['verified'], $data['id']]);
            echo json_encode(['status' => 'success', 'message' => 'Business verification badge updated']);
        } elseif ($action === 'toggle_featured_business') {
            $stmt = $db->prepare("UPDATE businesses SET featured = ? WHERE id = ?");
            $stmt->execute([(int)$data['featured'], $data['id']]);
            echo json_encode(['status' => 'success', 'message' => 'Business featured status updated']);
        } elseif ($action === 'delete_business') {
            $stmt = $db->prepare("DELETE FROM businesses WHERE id = ?");
            $stmt->execute([$data['id']]);
            echo json_encode(['status' => 'success', 'message' => 'Business removed']);
        } elseif ($action === 'delete_product') {
            $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$data['id']]);
            echo json_encode(['status' => 'success', 'message' => 'Listing removed']);
        } elseif ($action === 'update_buying_request') {
            $stmt = $db->prepare("UPDATE buying_requests SET status = ?, assigned_agent = ?, notes = ?, service_fee = ? WHERE id = ?");
            $stmt->execute([
                $data['status'],
                $data['assigned_agent'] ?? 'Senior Sourcing Desk',
                $data['notes'] ?? '',
                isset($data['service_fee']) ? (float)$data['service_fee'] : 60.0,
                $data['id']
            ]);
            echo json_encode(['status' => 'success', 'message' => 'Buying assistance ticket updated']);
        } elseif ($action === 'create_category') {
            if (empty($data['name']) || empty($data['slug'])) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Category name and slug are required']);
                exit;
            }
            $stmt = $db->prepare("INSERT INTO categories (name, slug, icon, parent_id) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $data['name'],
                $data['slug'],
                $data['icon'] ?? 'fa-folder',
                $data['parent_id'] ?? null
            ]);
            echo json_encode(['status' => 'success', 'id' => $db->lastInsertId(), 'message' => 'Category created successfully']);
        } elseif ($action === 'delete_category') {
            $stmt = $db->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$data['id']]);
            echo json_encode(['status' => 'success', 'message' => 'Category removed']);
        } elseif ($action === 'delete_review') {
            $stmt = $db->prepare("DELETE FROM reviews WHERE id = ?");
            $stmt->execute([$data['id']]);
            echo json_encode(['status' => 'success', 'message' => 'Review deleted']);
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Unknown admin action']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}

