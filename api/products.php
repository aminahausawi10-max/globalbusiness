<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        if (isset($_GET['id'])) {
            $stmt = $db->prepare("SELECT p.*, b.name AS business_name, b.country, b.city, b.area, b.phone, b.whatsapp, b.verified AS business_verified 
                                  FROM products p 
                                  JOIN businesses b ON p.business_id = b.id 
                                  WHERE p.id = ?");
            $stmt->execute([$_GET['id']]);
            $product = $stmt->fetch();

            if (!$product) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Product not found']);
                exit;
            }

            // Increment views
            $db->prepare("UPDATE products SET views = views + 1 WHERE id = ?")->execute([$_GET['id']]);

            echo json_encode(['status' => 'success', 'data' => $product]);
            exit;
        }

        $query = "SELECT p.*, b.name AS business_name, b.country, b.city, b.area, b.phone, b.whatsapp, b.verified AS business_verified 
                  FROM products p 
                  JOIN businesses b ON p.business_id = b.id 
                  WHERE 1=1";
        $params = [];

        if (!empty($_GET['q'])) {
            $q = '%' . trim($_GET['q']) . '%';
            $query .= " AND (p.title LIKE ? OR p.description LIKE ? OR p.brand LIKE ? OR b.city LIKE ? OR b.country LIKE ?)";
            $params[] = $q;
            $params[] = $q;
            $params[] = $q;
            $params[] = $q;
            $params[] = $q;
        }

        if (!empty($_GET['category_id'])) {
            $query .= " AND p.category_id = ?";
            $params[] = $_GET['category_id'];
        }

        if (!empty($_GET['business_id'])) {
            $query .= " AND p.business_id = ?";
            $params[] = $_GET['business_id'];
        }

        if (isset($_GET['is_service']) && $_GET['is_service'] !== '') {
            $query .= " AND p.is_service = ?";
            $params[] = (int)$_GET['is_service'];
        }

        if (!empty($_GET['max_price'])) {
            $query .= " AND p.price <= ?";
            $params[] = (float)$_GET['max_price'];
        }

        if (!empty($_GET['country'])) {
            $query .= " AND LOWER(b.country) = LOWER(?)";
            $params[] = trim($_GET['country']);
        }

        if (!empty($_GET['city'])) {
            $query .= " AND LOWER(b.city) = LOWER(?)";
            $params[] = trim($_GET['city']);
        }

        $query .= " ORDER BY p.id DESC";

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $products = $stmt->fetchAll();

        echo json_encode(['status' => 'success', 'count' => count($products), 'data' => $products]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    // Add product or service with multimedia (photo, video, audio)
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['business_id']) || empty($data['title']) || !isset($data['price'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please fill in product title, price, and select your business']);
        exit;
    }

    try {
        // Fetch business category
        $bStmt = $db->prepare("SELECT category_id FROM businesses WHERE id = ?");
        $bStmt->execute([$data['business_id']]);
        $b = $bStmt->fetch();
        $categoryId = $b ? $b['category_id'] : ($data['category_id'] ?? 1);

        $stmt = $db->prepare("INSERT INTO products 
            (business_id, category_id, title, description, price, currency, is_service, stock_status, size, color, brand, photo_url, video_url, audio_url, delivery_info)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt->execute([
            $data['business_id'],
            $categoryId,
            $data['title'],
            $data['description'] ?? '',
            (float)$data['price'],
            $data['currency'] ?? 'USD',
            isset($data['is_service']) ? (int)$data['is_service'] : 0,
            $data['stock_status'] ?? 'In Stock',
            $data['size'] ?? '',
            $data['color'] ?? '',
            $data['brand'] ?? '',
            $data['photo_url'] ?? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
            $data['video_url'] ?? '',
            $data['audio_url'] ?? '',
            $data['delivery_info'] ?? 'Standard delivery available'
        ]);

        $newId = $db->lastInsertId();
        echo json_encode([
            'status' => 'success',
            'id' => $newId,
            'message' => 'Product/Service successfully published with multimedia assets'
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}
