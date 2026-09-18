<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Calculate distance in KM using Haversine formula
function haversineGreatCircleDistance($latitudeFrom, $longitudeFrom, $latitudeTo, $longitudeTo, $earthRadius = 6371) {
    $latFrom = deg2rad($latitudeFrom);
    $lonFrom = deg2rad($longitudeFrom);
    $latTo = deg2rad($latitudeTo);
    $lonTo = deg2rad($longitudeTo);

    $latDelta = $latTo - $latFrom;
    $lonDelta = $lonTo - $lonFrom;

    $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
        cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
    return $angle * $earthRadius;
}

if ($method === 'GET') {
    try {
        if (isset($_GET['id'])) {
            $stmt = $db->prepare("SELECT * FROM businesses WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $business = $stmt->fetch();
            
            if (!$business) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Business not found']);
                exit;
            }

            // Get business products
            $prodStmt = $db->prepare("SELECT * FROM products WHERE business_id = ? ORDER BY id DESC");
            $prodStmt->execute([$business['id']]);
            $business['products'] = $prodStmt->fetchAll();

            // Get business reviews
            $revStmt = $db->prepare("SELECT * FROM reviews WHERE business_id = ? ORDER BY id DESC");
            $revStmt->execute([$business['id']]);
            $business['reviews'] = $revStmt->fetchAll();

            echo json_encode(['status' => 'success', 'data' => $business]);
            exit;
        }

        $query = "SELECT * FROM businesses WHERE 1=1";
        $params = [];

        if (!empty($_GET['q'])) {
            $q = '%' . trim($_GET['q']) . '%';
            $query .= " AND (name LIKE ? OR description LIKE ? OR city LIKE ? OR area LIKE ? OR category_name LIKE ?)";
            $params[] = $q;
            $params[] = $q;
            $params[] = $q;
            $params[] = $q;
            $params[] = $q;
        }

        if (!empty($_GET['category_id'])) {
            $query .= " AND category_id = ?";
            $params[] = $_GET['category_id'];
        }

        if (!empty($_GET['country'])) {
            $query .= " AND LOWER(country) = LOWER(?)";
            $params[] = trim($_GET['country']);
        }

        if (!empty($_GET['city'])) {
            $query .= " AND LOWER(city) = LOWER(?)";
            $params[] = trim($_GET['city']);
        }

        if (isset($_GET['verified']) && $_GET['verified'] !== '') {
            $query .= " AND verified = ?";
            $params[] = (int)$_GET['verified'];
        }

        $query .= " ORDER BY featured DESC, verified DESC, rating DESC, id DESC";

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $businesses = $stmt->fetchAll();

        // Calculate distance if lat and lng provided
        if (isset($_GET['lat']) && isset($_GET['lng']) && is_numeric($_GET['lat']) && is_numeric($_GET['lng'])) {
            $userLat = (float)$_GET['lat'];
            $userLng = (float)$_GET['lng'];
            $maxRadius = isset($_GET['radius']) ? (float)$_GET['radius'] : 50.0;

            foreach ($businesses as &$b) {
                if ($b['latitude'] != 0 && $b['longitude'] != 0) {
                    $b['distance_km'] = round(haversineGreatCircleDistance($userLat, $userLng, (float)$b['latitude'], (float)$b['longitude']), 2);
                } else {
                    $b['distance_km'] = null;
                }
            }
            unset($b);

            // Filter by radius if requested
            if (!empty($_GET['near_me'])) {
                $businesses = array_filter($businesses, function($b) use ($maxRadius) {
                    return $b['distance_km'] !== null && $b['distance_km'] <= $maxRadius;
                });
                usort($businesses, function($a, $b) {
                    return $a['distance_km'] <=> $b['distance_km'];
                });
            }
        }

        echo json_encode(['status' => 'success', 'count' => count($businesses), 'data' => array_values($businesses)]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    // Register new business
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['name']) || empty($data['category_id']) || empty($data['country']) || empty($data['city']) || empty($data['phone'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please provide all required business details']);
        exit;
    }

    try {
        // Fetch category name
        $catStmt = $db->prepare("SELECT name FROM categories WHERE id = ?");
        $catStmt->execute([$data['category_id']]);
        $cat = $catStmt->fetch();
        $categoryName = $cat ? $cat['name'] : ($data['category_name'] ?? 'General');

        $stmt = $db->prepare("INSERT INTO businesses 
            (name, category_id, category_name, description, country, state_province, city, area, address, latitude, longitude, phone, whatsapp, email, opening_hours, delivery_available, verified, rating, reviews_count, logo_url, banner_url, featured)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 5.0, 0, ?, ?, 0)");

        $stmt->execute([
            $data['name'],
            $data['category_id'],
            $categoryName,
            $data['description'] ?? '',
            $data['country'],
            $data['state_province'] ?? '',
            $data['city'],
            $data['area'] ?? '',
            $data['address'] ?? '',
            $data['latitude'] ?? 0.0,
            $data['longitude'] ?? 0.0,
            $data['phone'],
            $data['whatsapp'] ?? $data['phone'],
            $data['email'] ?? '',
            $data['opening_hours'] ?? '8:00 AM - 6:00 PM',
            isset($data['delivery_available']) ? (int)$data['delivery_available'] : 1,
            $data['logo_url'] ?? 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&auto=format&fit=crop&q=80',
            $data['banner_url'] ?? 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80'
        ]);

        $newId = $db->lastInsertId();
        echo json_encode([
            'status' => 'success',
            'id' => $newId,
            'message' => 'Business registered successfully and placed under ' . $categoryName
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}
