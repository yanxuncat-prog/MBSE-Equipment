#!/usr/bin/env python3
"""轻量级设备数据库查看器 - 零依赖，仅用 Python 标准库"""

import sqlite3
import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

DB_DIR = os.path.dirname(__file__)
DB_MAP = {
    "X号构型": os.path.join(DB_DIR, "equipment_X号构型.db"),
    "1&2号构型": os.path.join(DB_DIR, "equipment_1&2号构型.db"),
}
PORT = 8899

def get_db(config="X号构型"):
    db_path = DB_MAP.get(config, DB_MAP["X号构型"])
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def get_table_data(table="设备", config_filter="", db_config="X号构型"):
    conn = get_db(db_config)
    cur = conn.cursor()

    # 获取列信息
    cur.execute(f'PRAGMA table_info("{table}")')
    columns = [row[1] for row in cur.fetchall()]

    # 获取数据
    if table == "构型设备" and config_filter:
        cur.execute(f'SELECT * FROM 构型设备 WHERE 构型名称 = ?', (config_filter,))
    else:
        cur.execute(f'SELECT * FROM "{table}"')
    rows = [dict(row) for row in cur.fetchall()]

    # 获取统计
    total = len(rows)

    # 统计每列的非空值数
    col_stats = {}
    for col in columns:
        if table == "构型设备" and config_filter:
            cur.execute(f'SELECT COUNT(*) FROM 构型设备 WHERE 构型名称 = ? AND "{col}" IS NOT NULL AND "{col}" != ""', (config_filter,))
        else:
            cur.execute(f'SELECT COUNT(*) FROM "{table}" WHERE "{col}" IS NOT NULL AND "{col}" != ""')
        col_stats[col] = cur.fetchone()[0]

    # 获取导入日志
    cur.execute("SELECT * FROM 导入日志 ORDER BY 导入时间 DESC")
    logs = [dict(row) for row in cur.fetchall()]

    # 获取构型列表
    configs = []
    try:
        cur.execute("SELECT DISTINCT 构型名称 FROM 构型设备 ORDER BY 构型名称")
        configs = [row[0] for row in cur.fetchall()]
    except:
        pass

    # 获取所有子表名
    tables = []
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN ('设备','导入日志','构型设备')")
    tables = [row[0] for row in cur.fetchall()]

    # 主表统计
    cur.execute("SELECT COUNT(*) FROM 设备")
    main_total = cur.fetchone()[0]

    conn.close()
    # 可用的构型列表
    db_configs = list(DB_MAP.keys())

    return {"columns": columns, "rows": rows, "total": total, "col_stats": col_stats, "logs": logs, "configs": configs, "main_total": main_total, "tables": tables, "db_configs": db_configs, "current_config": db_config}


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == "/api/data":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            params = parse_qs(parsed.query)
            table = params.get("table", ["设备"])[0]
            config_filter = params.get("config", [""])[0]
            db_config = params.get("db", ["X号构型"])[0]
            data = get_table_data(table, config_filter, db_config)
            self.wfile.write(json.dumps(data, ensure_ascii=False, default=str).encode("utf-8"))

        elif parsed.path == "/" or parsed.path == "/index.html":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            html_path = os.path.join(os.path.dirname(__file__), "index.html")
            with open(html_path, "r", encoding="utf-8") as f:
                self.wfile.write(f.read().encode("utf-8"))
        else:
            super().do_GET()

    def log_message(self, format, *args):
        pass  # 静默日志


if __name__ == "__main__":
    print(f"🚀 设备数据库查看器已启动: http://localhost:{PORT}")
    print(f"📂 数据库目录: {DB_DIR}")
    print(f"按 Ctrl+C 停止\n")
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止")
