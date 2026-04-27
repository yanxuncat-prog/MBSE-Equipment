#!/bin/bash
# 从 data/aeroequip_dump.sql 恢复数据库
set -e

echo "正在恢复数据库..."
docker compose exec -T db psql -U aeroequip -f /docker-entrypoint-initdb.d/01-restore.sql > /dev/null 2>&1

count=$(docker compose exec -T db psql -U aeroequip -t -c "SELECT count(*) FROM equipment;")
echo "恢复完成 — 设备数: $count"
