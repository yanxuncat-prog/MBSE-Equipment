#!/bin/bash
# 导出数据库到 data/aeroequip_dump.sql
set -e

echo "正在导出数据库..."
docker compose exec -T db pg_dump -U aeroequip --no-owner --no-privileges --clean --if-exists aeroequip > data/aeroequip_dump.sql

count=$(docker compose exec -T db psql -U aeroequip -t -c "SELECT count(*) FROM equipment;")
echo "导出完成 — 设备数: $count"
echo ""
echo "下一步:"
echo "  git add -f data/aeroequip_dump.sql"
echo "  git commit -m 'chore: update database dump'"
echo "  git push"
