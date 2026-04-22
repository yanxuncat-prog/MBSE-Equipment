import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table, Tag, Card, Select, Checkbox, Drawer, Button, DatePicker, Input, message, Typography, Space, Badge,
} from 'antd';
import { EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useConfigStore } from '../store/configStore';
import { listEquipment } from '../api/equipment';
import client from '../api/client';
import type { Equipment } from '../types';

const { Text } = Typography;
const { TextArea } = Input;

/* ───── Status definitions ───── */
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  inquiry:    { label: '询价',   color: '#5AC8FA' },
  contracted: { label: '合同',   color: '#007AFF' },
  producing:  { label: '生产中', color: '#FF9500' },
  inspecting: { label: '检验',   color: '#AF52DE' },
  shipping:   { label: '在途',   color: '#34C759' },
  delivered:  { label: '已到货', color: '#52C41A' },
};

const NOT_STARTED_COLOR = '#8E8E93';
const OVERDUE_COLOR = '#FF3B30';

const STATUS_OPTIONS = Object.entries(STATUS_MAP).map(([value, { label }]) => ({ value, label }));

const LOCATION_OPTIONS = ['北京', '上海', '成都', '西安', '沈阳', '大场', '其他'].map(v => ({ value: v, label: v }));

/* ───── Helpers ───── */
function getOverdueDays(item: Equipment): number {
  const planned = item.config_data?.planned_delivery_date;
  const status = item.config_data?.procurement_status;
  if (!planned || status === 'delivered') return 0;
  const diff = dayjs().startOf('day').diff(dayjs(planned), 'day');
  return diff > 0 ? diff : 0;
}

function getStatusLabel(status: string | null | undefined): string {
  if (!status) return '未启动';
  return STATUS_MAP[status]?.label ?? status;
}

function getStatusColor(status: string | null | undefined): string {
  if (!status) return NOT_STARTED_COLOR;
  return STATUS_MAP[status]?.color ?? NOT_STARTED_COLOR;
}

/* ───── Simple Donut (city distribution) ───── */
function SimpleDonut({ data, total }: { data: { name: string; count: number }[]; total: number }) {
  const COLORS = ['#5ac8fa', '#34c759', '#ff9500', '#ff6b6b', '#af52de', '#007aff', '#ffcc00', '#636366'];
  const radius = 50;
  const cx = 65, cy = 65;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = data.map((item, i) => {
    const pct = total > 0 ? item.count / total : 0;
    const dash = pct * circumference;
    const seg = { ...item, dash, offset, color: COLORS[i % COLORS.length], pct };
    offset += dash;
    return seg;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <svg width={130} height={130} viewBox="0 0 130 130">
        {total === 0 ? (
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f0f0f0" strokeWidth={16} />
        ) : (
          segments.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={radius} fill="none"
              stroke={s.color} strokeWidth={16}
              strokeDasharray={`${s.dash} ${circumference}`}
              strokeDashoffset={-s.offset}
              transform={`rotate(-90, ${cx}, ${cy})`}
            />
          ))
        )}
        <text x={cx} y={cy - 2} textAnchor="middle" fill="#333" fontSize={16} fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#999" fontSize={9}>台</text>
      </svg>
      <div>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#666' }}>{s.name} ({s.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───── Horizontal Bar (supplier delivered count) ───── */
function HorizontalBar({ data }: { data: { name: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const COLORS = ['#52C41A', '#34C759', '#5ac8fa', '#007aff', '#af52de', '#ff9500'];
  return (
    <div>
      {data.map((item, i) => (
        <div key={item.name} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ width: 80, fontSize: 11, textAlign: 'right', marginRight: 8, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.name || '-'}
          </Text>
          <div style={{ flex: 1, height: 14, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${(item.count / max) * 100}%`,
              height: '100%',
              background: COLORS[i % COLORS.length],
              borderRadius: 3,
              minWidth: item.count > 0 ? 4 : 0,
            }} />
          </div>
          <Text style={{ width: 30, fontSize: 11, marginLeft: 6, color: '#333', fontWeight: 600 }}>{item.count}</Text>
        </div>
      ))}
      {data.length === 0 && <Text type="secondary" style={{ fontSize: 12 }}>暂无数据</Text>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════ */
export function ProcurementPage() {
  const { activeConfigId } = useConfigStore();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);

  /* Filters */
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterLocation, setFilterLocation] = useState<string | null>(null);
  const [filterSupplier, setFilterSupplier] = useState<string | null>(null);
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  /* Drawer */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [formStatus, setFormStatus] = useState<string | undefined>(undefined);
  const [formLocation, setFormLocation] = useState<string | undefined>(undefined);
  const [formPlannedDate, setFormPlannedDate] = useState<dayjs.Dayjs | null>(null);
  const [formEstimatedDate, setFormEstimatedDate] = useState<dayjs.Dayjs | null>(null);
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  /* ── Load data ── */
  const loadData = useCallback(async () => {
    if (!activeConfigId) { setEquipment([]); return; }
    setLoading(true);
    try {
      const result = await listEquipment({ config_id: activeConfigId, limit: 2000 });
      setEquipment(result.items);
    } catch {
      message.error('加载设备数据失败');
    } finally {
      setLoading(false);
    }
  }, [activeConfigId]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Derived data ── */
  const enriched = useMemo(() => equipment.map(e => ({
    ...e,
    _overdueDays: getOverdueDays(e),
    _status: e.config_data?.procurement_status ?? null,
    _location: e.config_data?.procurement_location ?? null,
  })), [equipment]);

  /* Status summary counts */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { _all: 0, _not_started: 0, _overdue: 0 };
    Object.keys(STATUS_MAP).forEach(k => { counts[k] = 0; });
    enriched.forEach(e => {
      counts._all++;
      if (!e._status) { counts._not_started++; }
      else { counts[e._status] = (counts[e._status] || 0) + 1; }
      if (e._overdueDays > 0) counts._overdue++;
    });
    return counts;
  }, [enriched]);

  /* Filtered list */
  const filtered = useMemo(() => {
    let list = enriched;
    if (filterStatus === '_not_started') {
      list = list.filter(e => !e._status);
    } else if (filterStatus === '_overdue') {
      list = list.filter(e => e._overdueDays > 0);
    } else if (filterStatus) {
      list = list.filter(e => e._status === filterStatus);
    }
    if (filterLocation) {
      list = list.filter(e => e._location === filterLocation);
    }
    if (filterSupplier) {
      list = list.filter(e => e.supplier_name === filterSupplier);
    }
    if (onlyOverdue) {
      list = list.filter(e => e._overdueDays > 0);
    }
    return list;
  }, [enriched, filterStatus, filterLocation, filterSupplier, onlyOverdue]);

  /* Unique suppliers */
  const suppliers = useMemo(() => {
    const set = new Set<string>();
    equipment.forEach(e => { if (e.supplier_name) set.add(e.supplier_name); });
    return Array.from(set).sort();
  }, [equipment]);

  /* Unique locations */
  const locations = useMemo(() => {
    const set = new Set<string>();
    equipment.forEach(e => { if (e.config_data?.procurement_location) set.add(e.config_data.procurement_location); });
    return Array.from(set).sort();
  }, [equipment]);

  /* ── Right-panel analytics ── */
  const cityDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach(e => {
      const loc = e._location || '未指定';
      map[loc] = (map[loc] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [enriched]);

  const overdueUrgent = useMemo(() => {
    return enriched
      .filter(e => e._overdueDays > 0)
      .sort((a, b) => b._overdueDays - a._overdueDays)
      .slice(0, 8);
  }, [enriched]);

  const supplierDelivered = useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach(e => {
      if (e._status === 'delivered') {
        const s = e.supplier_name || '未知';
        map[s] = (map[s] || 0) + 1;
      }
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [enriched]);

  /* ── Open edit drawer ── */
  const openEdit = (item: Equipment) => {
    setEditingItem(item);
    const cd = item.config_data;
    setFormStatus(cd?.procurement_status ?? undefined);
    setFormLocation(cd?.procurement_location ?? undefined);
    setFormPlannedDate(cd?.planned_delivery_date ? dayjs(cd.planned_delivery_date) : null);
    setFormEstimatedDate(cd?.estimated_delivery_date ? dayjs(cd.estimated_delivery_date) : null);
    setFormNotes(cd?.procurement_notes ?? '');
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!editingItem || !activeConfigId) return;
    setSaving(true);
    try {
      await client.put(`/configurations/${activeConfigId}/equipment/${editingItem.id}/procurement`, {
        procurement_status: formStatus ?? null,
        procurement_location: formLocation ?? null,
        planned_delivery_date: formPlannedDate ? formPlannedDate.format('YYYY-MM-DD') : null,
        estimated_delivery_date: formEstimatedDate ? formEstimatedDate.format('YYYY-MM-DD') : null,
        procurement_notes: formNotes || null,
      });
      message.success('保存成功');
      setDrawerOpen(false);
      loadData();
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  /* ── No config selected ── */
  if (!activeConfigId) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Text type="secondary">请先在顶部选择构型</Text></div>;
  }

  /* ── Table columns ── */
  const columns = [
    {
      title: 'LIN号',
      dataIndex: 'lin_number',
      key: 'lin_number',
      width: 100,
      fixed: 'left' as const,
      render: (v: string | null) => v || '-',
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 160,
      fixed: 'left' as const,
      ellipsis: true,
    },
    {
      title: '供应商',
      dataIndex: 'supplier_name',
      key: 'supplier_name',
      width: 120,
      ellipsis: true,
      render: (v: string | null) => v || '-',
    },
    {
      title: '状态',
      key: 'status',
      width: 140,
      render: (_: any, record: any) => {
        const st = record._status;
        const overdue = record._overdueDays;
        return (
          <Space size={4}>
            <Tag color={getStatusColor(st)} style={{ color: '#fff', border: 'none' }}>
              {getStatusLabel(st)}
            </Tag>
            {overdue > 0 && (
              <span style={{ color: OVERDUE_COLOR, fontSize: 11, fontWeight: 600 }}>
                逾期{overdue}天
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: '位置',
      key: 'location',
      width: 90,
      render: (_: any, record: any) => record._location || '-',
    },
    {
      title: '计划交付',
      key: 'planned',
      width: 110,
      render: (_: any, record: any) => record.config_data?.planned_delivery_date || '-',
    },
    {
      title: '预计/实际',
      key: 'estimated',
      width: 110,
      render: (_: any, record: any) => record.config_data?.estimated_delivery_date || '-',
    },
    {
      title: '逾期天数',
      key: 'overdue',
      width: 80,
      sorter: (a: any, b: any) => a._overdueDays - b._overdueDays,
      render: (_: any, record: any) => {
        const d = record._overdueDays;
        if (d > 0) return <span style={{ color: OVERDUE_COLOR, fontWeight: 700 }}>{d}</span>;
        return '-';
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 70,
      render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  const rowClassName = (record: any) => {
    if (record._overdueDays > 0) return 'procurement-row-overdue';
    if (record._status === 'delivered') return 'procurement-row-delivered';
    if (!record._status) return 'procurement-row-notstarted';
    return '';
  };

  /* ═══════════ Render ═══════════ */
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* Inline styles for row classes */}
      <style>{`
        .procurement-row-overdue td { background: #FFF1F0 !important; }
        .procurement-row-delivered td { opacity: 0.6; }
        .procurement-row-notstarted td { opacity: 0.4; }
      `}</style>

      {/* ── Main area ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Status summary bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <Tag
            style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 13, border: filterStatus === null ? '2px solid #1677ff' : '1px solid #d9d9d9', background: '#fff' }}
            onClick={() => setFilterStatus(null)}
          >
            全部 <b>{statusCounts._all}</b>
          </Tag>
          <Tag
            style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 13, background: filterStatus === '_not_started' ? NOT_STARTED_COLOR : '#fff', color: filterStatus === '_not_started' ? '#fff' : NOT_STARTED_COLOR, border: `1px solid ${NOT_STARTED_COLOR}` }}
            onClick={() => setFilterStatus(filterStatus === '_not_started' ? null : '_not_started')}
          >
            未启动 <b>{statusCounts._not_started}</b>
          </Tag>
          {Object.entries(STATUS_MAP).map(([key, { label, color }]) => (
            <Tag
              key={key}
              style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 13, background: filterStatus === key ? color : '#fff', color: filterStatus === key ? '#fff' : color, border: `1px solid ${color}` }}
              onClick={() => setFilterStatus(filterStatus === key ? null : key)}
            >
              {label} <b>{statusCounts[key] || 0}</b>
            </Tag>
          ))}
          <Tag
            style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 13, background: filterStatus === '_overdue' ? OVERDUE_COLOR : '#fff', color: filterStatus === '_overdue' ? '#fff' : OVERDUE_COLOR, border: `1px solid ${OVERDUE_COLOR}` }}
            onClick={() => setFilterStatus(filterStatus === '_overdue' ? null : '_overdue')}
          >
            逾期 <b>{statusCounts._overdue}</b>
          </Tag>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 130 }}
            size="small"
            value={filterStatus}
            onChange={(v) => setFilterStatus(v ?? null)}
            options={[
              { value: '_not_started', label: '未启动' },
              ...STATUS_OPTIONS,
              { value: '_overdue', label: '逾期' },
            ]}
          />
          <Select
            placeholder="筛选位置"
            allowClear
            style={{ width: 120 }}
            size="small"
            value={filterLocation}
            onChange={(v) => setFilterLocation(v ?? null)}
            options={locations.map(l => ({ value: l, label: l }))}
          />
          <Select
            placeholder="筛选供应商"
            allowClear
            style={{ width: 150 }}
            size="small"
            value={filterSupplier}
            onChange={(v) => setFilterSupplier(v ?? null)}
            options={suppliers.map(s => ({ value: s, label: s }))}
          />
          <Checkbox checked={onlyOverdue} onChange={(e) => setOnlyOverdue(e.target.checked)}>
            <span style={{ fontSize: 13 }}>只看逾期</span>
          </Checkbox>
        </div>

        {/* Table */}
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          size="small"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 50, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['20', '50', '100'] }}
          rowClassName={rowClassName}
        />
      </div>

      {/* ── Right panel ── */}
      <div style={{ width: 280, flexShrink: 0 }}>
        <Card size="small" title="城市分布" style={{ marginBottom: 12 }}>
          <SimpleDonut data={cityDistribution} total={enriched.length} />
        </Card>
        <Card size="small" title="逾期紧急" style={{ marginBottom: 12 }}>
          {overdueUrgent.length === 0 ? (
            <Text type="secondary" style={{ fontSize: 12 }}>无逾期设备</Text>
          ) : (
            <div>
              {overdueUrgent.map((e) => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 12, display: 'block' }} ellipsis>{e.name}</Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>{e.supplier_name || '-'}</Text>
                  </div>
                  <Badge
                    count={`${e._overdueDays}天`}
                    style={{ backgroundColor: OVERDUE_COLOR, fontSize: 10 }}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card size="small" title="供应商交付">
          <HorizontalBar data={supplierDelivered} />
        </Card>
      </div>

      {/* ── Edit Drawer ── */}
      <Drawer
        title={`采购信息 - ${editingItem?.name || ''}`}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={400}
        extra={
          <Button type="primary" size="small" loading={saving} onClick={handleSave}>
            保存
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>状态</Text>
            <Select
              value={formStatus}
              onChange={setFormStatus}
              placeholder="选择状态"
              allowClear
              style={{ width: '100%' }}
              options={STATUS_OPTIONS}
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>位置</Text>
            <Select
              value={formLocation}
              onChange={setFormLocation}
              placeholder="选择位置"
              allowClear
              style={{ width: '100%' }}
              options={LOCATION_OPTIONS}
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>计划交付日期</Text>
            <DatePicker
              value={formPlannedDate}
              onChange={setFormPlannedDate}
              style={{ width: '100%' }}
              placeholder="选择日期"
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>预计/实际交付日期</Text>
            <DatePicker
              value={formEstimatedDate}
              onChange={setFormEstimatedDate}
              style={{ width: '100%' }}
              placeholder="选择日期"
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>备注</Text>
            <TextArea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={4}
              placeholder="采购备注"
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
