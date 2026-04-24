/**
 * 8核服务器 API 读取示范脚本
 * 用供应商组账户读取 CE-25A X号机 的设备/连接器/针孔/信号数据
 *
 * 用法: node api_read_demo.cjs
 */

const http = require('http');

const BASE = 'http://36.212.172.150:8090';
const USERNAME = 'supplier_test';  // ← 改成你创建的供应商组账户
const PASSWORD = 'supplier_test';  // ← 改成对应密码
const PROJECT_ID = 45;             // CE-25A X号机

function api(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const data = body ? JSON.stringify(body) : null;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);

    const req = http.request({
      hostname: url.hostname, port: url.port,
      path: url.pathname + url.search,
      method, headers
    }, res => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode, data: chunks.slice(0, 500) }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log('=== 登录 ===');
  const login = await api('POST', '/api/auth/login', { username: USERNAME, password: PASSWORD });
  if (login.status !== 200 || !login.data.token) {
    console.log('登录失败:', login.status, login.data);
    return;
  }
  const token = login.data.token;
  console.log('登录成功, 用户:', login.data.user?.display_name || USERNAME);

  // ── 1. 设备列表 ──
  console.log('\n=== 设备列表（前5台） ===');
  const devRes = await api('GET', `/api/devices?projectId=${PROJECT_ID}&limit=10`, null, token);
  console.log(`状态: ${devRes.status}, 返回 ${devRes.data.devices?.length || 0} 台`);
  (devRes.data.devices || []).forEach(d => {
    console.log(`  ${d.设备编号} | ${d.设备中文名称 || ''} | status=${d.status}`);
  });

  // ── 2. 某台设备的连接器 ──
  if (devRes.data.devices?.[0]) {
    const devId = devRes.data.devices[0].id;
    console.log(`\n=== 设备 ${devRes.data.devices[0].设备编号} 的连接器 ===`);
    const connRes = await api('GET', `/api/devices/${devId}/connectors`, null, token);
    const conns = connRes.data.connectors || connRes.data || [];
    console.log(`状态: ${connRes.status}, 返回 ${conns.length} 个连接器`);
    conns.slice(0, 3).forEach(c => {
      console.log(`  ${c.设备端元器件编号} | ${c.设备端元器件名称及类型 || ''}`);
    });

    // ── 3. 某个连接器的针孔 ──
    if (conns[0]) {
      const connId = conns[0].id;
      console.log(`\n=== 连接器 ${conns[0].设备端元器件编号} 的针孔 ===`);
      const pinRes = await api('GET', `/api/devices/${devId}/connectors/${connId}/pins`, null, token);
      const pins = pinRes.data.pins || pinRes.data || [];
      console.log(`状态: ${pinRes.status}, 返回 ${pins.length} 个针孔`);
      pins.slice(0, 5).forEach(p => {
        console.log(`  针孔号=${p.针孔号} | 端接尺寸=${p.端接尺寸 || ''} | 屏蔽类型=${p.屏蔽类型 || ''}`);
      });
    }
  }

  // ── 4. 信号列表 ──
  console.log('\n=== 信号列表（前5条） ===');
  const sigRes = await api('GET', `/api/signals?projectId=${PROJECT_ID}&limit=5`, null, token);
  console.log(`状态: ${sigRes.status}, 返回 ${sigRes.data.signals?.length || 0} 条, 总计 ${sigRes.data.total || '?'} 条`);
  (sigRes.data.signals || []).forEach(s => {
    console.log(`  ${s.unique_id} | ${s.连接类型 || ''} | ${s.协议标识 || ''} | 分组=${s.signal_group || '无'}`);
  });

  // ── 5. 信号详情（含端点） ──
  if (sigRes.data.signals?.[0]) {
    const sigId = sigRes.data.signals[0].id;
    console.log(`\n=== 信号 ${sigRes.data.signals[0].unique_id} 详情 ===`);
    const detailRes = await api('GET', `/api/signals/${sigId}`, null, token);
    const sig = detailRes.data.signal || detailRes.data;
    console.log(`状态: ${detailRes.status}`);
    if (sig.endpoints) {
      console.log(`  端点数: ${sig.endpoints.length}`);
      sig.endpoints.forEach((ep, i) => {
        console.log(`  端点${i}: ${ep.设备编号} / ${ep.设备端元器件编号} / 针孔${ep.针孔号} | ${ep.信号名称 || ''}`);
      });
    }
  }

  // ── 6. 信号分组 ──
  console.log('\n=== 信号分组（前5个） ===');
  const grpRes = await api('GET', `/api/signals/groups?project_id=${PROJECT_ID}`, null, token);
  console.log(`状态: ${grpRes.status}, 返回 ${grpRes.data.groups?.length || 0} 个分组`);
  (grpRes.data.groups || []).slice(0, 5).forEach(g => {
    console.log(`  ${g.name} | 连接类型=${g.conn_type || ''} | 信号数=${g.signal_ids?.length || 0}`);
  });

  console.log('\n=== 完成 ===');
}

main().catch(e => console.error('错误:', e.message));
