#!/bin/bash

# Analytics Service API Test Script
# Base URL: http://localhost:9004

BASE_URL="http://localhost:9004"

echo "=========================================="
echo "Analytics Service API Test"
echo "=========================================="
echo ""

# Test UUIDs (thay đổi theo dữ liệu thực tế của bạn)
TEST_EXAM_ID="550e8400-e29b-41d4-a716-446655440000"
TEST_USER_ID="550e8400-e29b-41d4-a716-446655440001"
TEST_SUBMISSION_ID="550e8400-e29b-41d4-a716-446655440002"

echo "1. Testing GET /analytics/exam-results (no parameters)"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/analytics/exam-results" \
  -H "Content-Type: application/json" \
  | jq '.'
echo ""
echo ""

echo "2. Testing GET /analytics/exam-results?examId=${TEST_EXAM_ID}"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/analytics/exam-results?examId=${TEST_EXAM_ID}" \
  -H "Content-Type: application/json" \
  | jq '.'
echo ""
echo ""

echo "3. Testing GET /analytics/exam-results?userId=${TEST_USER_ID}"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/analytics/exam-results?userId=${TEST_USER_ID}" \
  -H "Content-Type: application/json" \
  | jq '.'
echo ""
echo ""

echo "4. Testing GET /analytics/exam-results?examId=${TEST_EXAM_ID}&userId=${TEST_USER_ID}"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/analytics/exam-results?examId=${TEST_EXAM_ID}&userId=${TEST_USER_ID}" \
  -H "Content-Type: application/json" \
  | jq '.'
echo ""
echo ""

echo "5. Testing GET /analytics/cheating-stats?examId=${TEST_EXAM_ID}"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/analytics/cheating-stats?examId=${TEST_EXAM_ID}" \
  -H "Content-Type: application/json" \
  | jq '.'
echo ""
echo ""

echo "6. Testing GET /analytics/dashboards?userId=${TEST_USER_ID}"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/analytics/dashboards?userId=${TEST_USER_ID}" \
  -H "Content-Type: application/json" \
  | jq '.'
echo ""
echo ""

echo "7. Testing GET /analytics/recommendations?userId=${TEST_USER_ID}"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/analytics/recommendations?userId=${TEST_USER_ID}" \
  -H "Content-Type: application/json" \
  | jq '.'
echo ""
echo ""

echo "=========================================="
echo "API Test Completed"
echo "=========================================="

