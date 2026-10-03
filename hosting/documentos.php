<?php
// Install in the document root of media.inmobiliariaalbertoalfaro.com.pe.
// Keep configuration and documents OUTSIDE every public document root.
ini_set('display_errors', '0');
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');
function fail_request($status) { http_response_code($status); exit; }
$configPath = '/home5/inmobi16/documentos-config.php';
if (!is_file($configPath)) fail_request(503);
$config = require $configPath;
$token = $config['token'] ?? '';
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (strlen($token) < 32 || !hash_equals('Bearer ' . $token, $auth)) fail_request(401);
$path = $_GET['path'] ?? '';
if (!is_string($path) || strlen($path) > 1000 || !preg_match('#^inmuebles/(posicion-[1-9][0-9]*|sin-posicion)/inmueble-[1-9][0-9]*/[a-z-]+/[a-zA-Z0-9._-]+\.(pdf|doc|docx|xls|xlsx)$#D', $path)) fail_request(400);
$root = $config['directory'] ?? '';
if (!$root || !is_dir($root) || is_link($root)) fail_request(503);
$root = realpath($root);
$file = $root . '/' . $path;
// Reject symlinks anywhere in the relative path.
$cursor = $root;
foreach (explode('/', $path) as $part) { $cursor .= '/' . $part; if (is_link($cursor)) fail_request(400); }
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'PUT') {
    $input = fopen('php://input', 'rb');
    $bytes = stream_get_contents($input, 4 * 1024 * 1024 + 1);
    fclose($input);
    if ($bytes === false || strlen($bytes) === 0 || strlen($bytes) > 4 * 1024 * 1024) fail_request(413);
    $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    if ($extension === 'pdf' && substr($bytes, 0, 5) !== '%PDF-') fail_request(400);
    if (in_array($extension, ['doc', 'xls'], true) && substr($bytes, 0, 8) !== hex2bin('d0cf11e0a1b11ae1')) fail_request(400);
    if (in_array($extension, ['docx', 'xlsx'], true) && substr($bytes, 0, 2) !== 'PK') fail_request(400);
    $directory = dirname($file);
    if (!is_dir($directory) && !mkdir($directory, 0700, true)) fail_request(500);
    $output = @fopen($file, 'xb');
    if (!$output) fail_request(409);
    chmod($file, 0600);
    $written = fwrite($output, $bytes);
    fclose($output);
    if ($written !== strlen($bytes)) { unlink($file); fail_request(500); }
    http_response_code(201);
    header('Content-Type: application/json');
    echo '{"ok":true}';
} elseif ($method === 'GET') {
    if (!is_file($file)) fail_request(404);
    header('Content-Type: application/octet-stream');
    header('Content-Length: ' . filesize($file));
    readfile($file);
} elseif ($method === 'DELETE') {
    if (is_file($file) && !unlink($file)) fail_request(500);
    http_response_code(204);
} else {
    header('Allow: PUT, GET, DELETE');
    fail_request(405);
}
