#!/bin/bash
# Script helper để truy cập PostgreSQL qua Docker
# Usage: ./scripts/psql.sh [command]
# Examples:
#   ./scripts/psql.sh                          # Vào psql shell
#   ./scripts/psql.sh "SELECT version();"     # Chạy query

CONTAINER_NAME="postgres-db"
DB_NAME="multisig_db"
USER="postgres"

# Kiểm tra container có chạy không
if ! docker ps --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
    echo "❌ Container $CONTAINER_NAME chưa chạy. Đang khởi động..."
    docker start $CONTAINER_NAME
    sleep 3
fi

if [ -z "$1" ]; then
    # Vào psql shell
    echo "✅ Đang kết nối đến PostgreSQL trong container $CONTAINER_NAME..."
    echo "Database: $DB_NAME"
    echo "User: $USER"
    echo "Gõ \q để thoát"
    docker exec -it $CONTAINER_NAME psql -U $USER -d $DB_NAME
else
    # Chạy command trực tiếp
    docker exec $CONTAINER_NAME psql -U $USER -d $DB_NAME -c "$1"
fi

