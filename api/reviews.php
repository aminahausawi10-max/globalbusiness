<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        if (!empty($_GET['business_id'])) {
            $stmt = $db->prepare("SELECT * FROM reviews WHERE business_id = ? ORDER BY id DESC");
            $stmt->execute([$_GET['business_id']]);
            $reviews = $stmt->fetchAll();
            echo json_encode(['status' => 'success', 'data' => $reviews]);
        } else {
            $stmt = $db->query("SELECT r.*, b.name AS business_name FROM reviews r JOIN businesses b ON r.business_id = b.id ORDER BY r.id DESC LIMIT 50");
            $reviews = $stmt->fetchAll();
            echo json_encode(['status' => 'success', 'data' => $reviews]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['business_id']) || empty($data['customer_name']) || empty($data['rating'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please provide business ID, customer name, and rating (1-5)']);
        exit;
    }

    try {
        $stmt = $db->prepare("INSERT INTO reviews (business_id, customer_name, rating, comment) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $data['business_id'],
            $data['customer_name'],
            (int)$data['rating'],
            $data['comment'] ?? ''
        ]);

        // Recalculate average rating for business
        $avgStmt = $db->prepare("SELECT AVG(rating) as avg_rating, COUNT(id) as count FROM reviews WHERE business_id = ?");
        $avgStmt->execute([$data['business_id']]);
        $stats = $avgStmt->fetch();

        $updateStmt = $db->prepare("UPDATE businesses SET rating = ?, reviews_count = ? WHERE id = ?");
        $updateStmt->execute([
            round((float)$stats['avg_rating'], 1),
            (int)$stats['count'],
            $data['business_id']
        ]);

        echo json_encode(['status' => 'success', 'message' => 'Review submitted successfully']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}
