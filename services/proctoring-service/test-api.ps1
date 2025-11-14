# Test script cho Proctoring Service

$GATEWAY_URL = "http://localhost:8080"
$DIRECT_URL = "http://localhost:8082"

Write-Host "=== TESTING PROCTORING SERVICE ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health check qua Gateway
Write-Host "1. Testing root endpoint via Gateway..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$GATEWAY_URL/api/proctoring/test" -Method GET
    Write-Host "✅ Gateway test endpoint: " -NoNewline
    Write-Host $response.message -ForegroundColor Green
} catch {
    Write-Host "❌ Gateway test failed: $_" -ForegroundColor Red
}

# Test 2: Health check trực tiếp
Write-Host "2. Testing root endpoint directly..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$DIRECT_URL/" -Method GET
    Write-Host "✅ Direct service: " -NoNewline
    Write-Host $response.status -ForegroundColor Green
} catch {
    Write-Host "❌ Direct test failed: $_" -ForegroundColor Red
}

# Test 3: Test endpoint qua Gateway
Write-Host "3. Testing /test endpoint via Gateway..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$GATEWAY_URL/api/proctoring/test" -Method GET
    Write-Host "✅ Test endpoint works!" -ForegroundColor Green
    Write-Host "   Message: $($response.message)" -ForegroundColor Gray
    Write-Host "   Timestamp: $($response.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Test endpoint failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "To test analyze-frame endpoint:" -ForegroundColor Yellow
Write-Host "  POST $GATEWAY_URL/api/proctoring/analyze-frame" -ForegroundColor Gray
Write-Host "  Body: { `"image`": `"base64_string`", `"examId`": `"123`", `"studentId`": `"456`" }" -ForegroundColor Gray
Write-Host ""
Write-Host "To test start-monitoring (requires JWT token):" -ForegroundColor Yellow
Write-Host "  POST $GATEWAY_URL/api/proctoring/sessions/start-monitoring" -ForegroundColor Gray
Write-Host "  Headers: Authorization: Bearer <token>" -ForegroundColor Gray
Write-Host "  Body: { `"examId`": `"123`", `"userId`": `"456`" }" -ForegroundColor Gray

