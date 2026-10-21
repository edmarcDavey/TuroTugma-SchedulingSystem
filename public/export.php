<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Expose-Headers: Content-Disposition");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$filename = isset($_REQUEST['filename']) ? $_REQUEST['filename'] : 'DepEd_Teacher_Load_Tracker.xlsx';
$cleanFilename = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $filename);
$contentType = isset($_REQUEST['contentType']) ? $_REQUEST['contentType'] : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
$base64 = isset($_POST['base64']) ? $_POST['base64'] : '';
$content = isset($_POST['content']) ? $_POST['content'] : '';

if (!empty($base64)) {
    $payload = base64_decode($base64);
} else {
    $payload = $content;
}

header('Content-Type: ' . $contentType);
header('Content-Disposition: attachment; filename="' . $cleanFilename . '"');
header('Content-Length: ' . strlen($payload));
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

echo $payload;
exit;
