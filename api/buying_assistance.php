<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Standard service packages & fee map
$packageFees = [
    'Basic Search' => 15.00,
    'Consultation' => 25.00,
    'Seller Contact & Verification' => 35.00,
    'Price Negotiation' => 40.00,
    'Full Buying Assistance' => 60.00,
    'Business Procurement' => 150.00
];

if ($method === 'GET') {
    try {
        if (isset($_GET['id'])) {
            $stmt = $db->prepare("SELECT * FROM buying_requests WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $request = $stmt->fetch();
            if (!$request) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Request not found']);
                exit;
            }
            echo json_encode(['status' => 'success', 'data' => $request]);
            exit;
        }

        $query = "SELECT * FROM buying_requests WHERE 1=1";
        $params = [];

        if (!empty($_GET['status'])) {
            $query .= " AND status = ?";
            $params[] = $_GET['status'];
        }

        if (!empty($_GET['phone'])) {
            $query .= " AND customer_phone = ?";
            $params[] = $_GET['phone'];
        }

        $query .= " ORDER BY id DESC";
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $requests = $stmt->fetchAll();

        echo json_encode([
            'status' => 'success',
            'count' => count($requests),
            'packages' => $packageFees,
            'data' => $requests
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    // Submit new buying assistance request
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['customer_name']) || empty($data['customer_phone']) || empty($data['item_title']) || empty($data['target_country']) || empty($data['target_city'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please provide your name, phone, item details, country and city']);
        exit;
    }

    $packageType = $data['package_type'] ?? 'Full Buying Assistance';
    $serviceFee = isset($packageFees[$packageType]) ? $packageFees[$packageType] : 50.00;

    try {
        $stmt = $db->prepare("INSERT INTO buying_requests 
            (customer_name, customer_phone, customer_email, item_title, category, specifications, quantity, budget_min, budget_max, currency, target_country, target_city, delivery_date, package_type, service_fee, status, assigned_agent, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', 'Assigned to Senior Sourcing Desk', ?)");

        $stmt->execute([
            $data['customer_name'],
            $data['customer_phone'],
            $data['customer_email'] ?? '',
            $data['item_title'],
            $data['category'] ?? 'General Procurement',
            $data['specifications'] ?? '',
            $data['quantity'] ?? '1',
            isset($data['budget_min']) ? (float)$data['budget_min'] : 0,
            isset($data['budget_max']) ? (float)$data['budget_max'] : 0,
            $data['currency'] ?? 'USD',
            $data['target_country'],
            $data['target_city'],
            $data['delivery_date'] ?? date('Y-m-d', strtotime('+7 days')),
            $packageType,
            $serviceFee,
            $data['notes'] ?? 'Initial buying assistance request logged.'
        ]);

        $requestId = $db->lastInsertId();

        echo json_encode([
            'status' => 'success',
            'id' => $requestId,
            'tracking_code' => 'PBA-' . str_pad($requestId, 5, '0', STR_PAD_LEFT),
            'service_fee' => $serviceFee,
            'package_type' => $packageType,
            'message' => 'Buying assistance request successfully submitted. A professional buying agent will review and contact you shortly.'
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
} elseif ($method === 'PATCH' || $method === 'PUT') {
    // Update request status (Staff/Admin)
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['id']) || empty($data['status'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Request ID and new status are required']);
        exit;
    }

    try {
        $stmt = $db->prepare("UPDATE buying_requests SET status = ?, assigned_agent = COALESCE(?, assigned_agent), notes = COALESCE(?, notes) WHERE id = ?");
        $stmt->execute([
            $data['status'],
            $data['assigned_agent'] ?? null,
            $data['notes'] ?? null,
            $data['id']
        ]);

        echo json_encode(['status' => 'success', 'message' => 'Buying assistance request updated successfully']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}
