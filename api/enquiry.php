<?php
/**
 * Same-origin enquiry proxy for live hosting (Hostinger / PHP).
 * Browser → /api/enquiry.php → https://communication.aaamt.in/api/Email/demo-survey
 * Avoids CORS (the upstream API does not return Access-Control-Allow-Origin).
 */
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-cache");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  header("Access-Control-Allow-Methods: POST, OPTIONS");
  header("Access-Control-Allow-Headers: Content-Type, Accept");
  http_response_code(204);
  exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  http_response_code(405);
  echo json_encode(["message" => "Method not allowed"]);
  exit;
}

$raw = file_get_contents("php://input");
if ($raw === false || trim($raw) === "") {
  http_response_code(400);
  echo json_encode(["message" => "Empty request body"]);
  exit;
}

$payload = json_decode($raw, true);
if (!is_array($payload)) {
  http_response_code(400);
  echo json_encode(["message" => "Invalid JSON body"]);
  exit;
}

$upstreamBody = json_encode([
  "applicationName" => isset($payload["applicationName"]) ? $payload["applicationName"] : "AAAMT Website",
  "fullName" => isset($payload["fullName"]) ? $payload["fullName"] : "",
  "emailId" => isset($payload["emailId"]) ? $payload["emailId"] : "",
  "phoneNumber" => isset($payload["phoneNumber"]) ? $payload["phoneNumber"] : "",
  "companyName" => isset($payload["companyName"]) ? $payload["companyName"] : "",
  "message" => isset($payload["message"]) ? $payload["message"] : "",
]);

$ch = curl_init("https://communication.aaamt.in/api/Email/demo-survey");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    "Content-Type: application/json",
    "Accept: application/json",
  ],
  CURLOPT_POSTFIELDS => $upstreamBody,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 30,
]);

$response = curl_exec($ch);
$errno = curl_errno($ch);
$error = curl_error($ch);
$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($errno) {
  http_response_code(502);
  echo json_encode([
    "message" => "Enquiry proxy failed",
    "detail" => $error,
  ]);
  exit;
}

http_response_code($status > 0 ? $status : 502);
echo $response !== false ? $response : json_encode(["message" => "Empty upstream response"]);
