<?php
/**
 * Multimedia Upload Gateway (Cloudinary Integration)
 * Supports Photos (JPG/PNG/WEBP), Videos (MP4/MOV), and Voice Audio (MP3/WAV/AAC)
 */

require_once __DIR__ . '/config.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'No file uploaded or upload error occurred']);
    exit;
}

$file = $_FILES['file'];
$mediaType = $_POST['type'] ?? 'auto'; // 'image', 'video', 'raw', or 'auto'
$timestamp = time();

// Generate Cloudinary Signature
$paramsToSign = "timestamp=" . $timestamp . CLOUDINARY_API_SECRET;
$signature = sha1($paramsToSign);

$cloudinaryUrl = "https://api.cloudinary.com/v1_1/" . CLOUDINARY_CLOUD_NAME . "/auto/upload";

$postData = [
    'file' => new CURLFile($file['tmp_name'], $file['type'], $file['name']),
    'api_key' => CLOUDINARY_API_KEY,
    'timestamp' => $timestamp,
    'signature' => $signature
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $cloudinaryUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($httpCode === 200) {
    $result = json_decode($response, true);
    echo json_encode([
        'status' => 'success',
        'url' => $result['secure_url'] ?? $result['url'],
        'public_id' => $result['public_id'],
        'format' => $result['format'] ?? '',
        'resource_type' => $result['resource_type'] ?? 'image',
        'bytes' => $result['bytes'] ?? 0
    ]);
} else {
    // If Cloudinary server-side upload fails, return clean JSON
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Cloudinary upload failed: ' . ($curlError ?: $response)
    ]);
}
