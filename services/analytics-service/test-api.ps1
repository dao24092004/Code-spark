# Analytics Service API Test Script (PowerShell)
# Base URL: http://localhost:9004

$BaseUrl = "http://localhost:9004"

# Test UUIDs (thay đổi theo dữ liệu thực tế của bạn)
$TestExamId = "550e8400-e29b-41d4-a716-446655440000"
$TestUserId = "550e8400-e29b-41d4-a716-446655440001"
$TestSubmissionId = "550e8400-e29b-41d4-a716-446655440002"

Write-Host "=========================================="
Write-Host "Analytics Service API Test"
Write-Host "=========================================="
Write-Host ""

Write-Host "1. Testing GET /analytics/exam-results (no parameters)"
Write-Host "----------------------------------------"
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/analytics/exam-results" -Method Get -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_"
}
Write-Host ""
Write-Host ""

Write-Host "2. Testing GET /analytics/exam-results?examId=$TestExamId"
Write-Host "----------------------------------------"
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/analytics/exam-results?examId=$TestExamId" -Method Get -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_"
}
Write-Host ""
Write-Host ""

Write-Host "3. Testing GET /analytics/exam-results?userId=$TestUserId"
Write-Host "----------------------------------------"
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/analytics/exam-results?userId=$TestUserId" -Method Get -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_"
}
Write-Host ""
Write-Host ""

Write-Host "4. Testing GET /analytics/exam-results?examId=$TestExamId&userId=$TestUserId"
Write-Host "----------------------------------------"
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/analytics/exam-results?examId=$TestExamId&userId=$TestUserId" -Method Get -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_"
}
Write-Host ""
Write-Host ""

Write-Host "5. Testing GET /analytics/cheating-stats?examId=$TestExamId"
Write-Host "----------------------------------------"
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/analytics/cheating-stats?examId=$TestExamId" -Method Get -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_"
}
Write-Host ""
Write-Host ""

Write-Host "6. Testing GET /analytics/dashboards?userId=$TestUserId"
Write-Host "----------------------------------------"
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/analytics/dashboards?userId=$TestUserId" -Method Get -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_"
}
Write-Host ""
Write-Host ""

Write-Host "7. Testing GET /analytics/recommendations?userId=$TestUserId"
Write-Host "----------------------------------------"
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/analytics/recommendations?userId=$TestUserId" -Method Get -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_"
}
Write-Host ""
Write-Host ""

Write-Host "=========================================="
Write-Host "API Test Completed"
Write-Host "=========================================="

