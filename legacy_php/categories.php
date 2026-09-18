<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $db->query("SELECT * FROM categories ORDER BY id ASC");
        $categories = $stmt->fetchAll();
        echo json_encode(['status' => 'success', 'data' => $categories]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    // Admin creates new category
    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data['name']) || empty($data['slug'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Category name and slug are required']);
        exit;
    }
    try {
        $stmt = $db->prepare("INSERT INTO categories (name, slug, icon, parent_id) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $data['name'],
            $data['slug'],
            $data['icon'] ?? 'fa-folder',
            $data['parent_id'] ?? null
        ]);
        echo json_encode(['status' => 'success', 'id' => $db->lastInsertId(), 'message' => 'Category created successfully']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}
