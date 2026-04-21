import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Table, Tag, Button, Input, Popconfirm, message, Spin, Drawer, Descriptions, Divider, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { listEquipment, deleteEquipment } from '../api/equipment';
import { EquipmentForm } from '../components/equipment/EquipmentForm';
import type { Equipment } from '../types';

const { Text } = Typography;

const STATUS_TAGS: Record<string, { color: string; text: string }> = {
  approved: { color: 'green', text: '已批准' },
  in_development: { color: 'blue', text: '在研' },
  qualifying: { color: 'orange', text: '鉴定中' },
  discontinued: { color: 'red', text: '停产' },
};

const PAGE_SIZE = 50;

/**
 * Equipment Definition page — manages device-intrinsic properties.
 * No configuration context needed. Shows ALL equipment in the system.
 */
export function EquipmentDefPage() {
  const [data, setData] = useState<Equipment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editEquip, setEditEquip] = useState<Equipment | null>(null);
  const [detailEquip, setDetailEquip] = useState<Equipment | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    setOffset(0);
    try {
      // No config_id — fetch ALL equipment
      const result = await listEquipment({
        search: search || undefined,
        offset: 0,
        limit: PAGE_SIZE,
      });
      setData(result.items);
      setTotal(result.total);
      setOffset(result.items.length);
    } catch {
      message.error('加载设备列表失败');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchInitial(); }, [fetchInitial]);

  const loadMore = useCallback(async () => {
    if (loadingMore || offset >= total) return;
    setLoadingMore(true);
    try {
      const result = await listEquipment({
        search: search || undefined,
        offset,
        limit: PAGE_SIZE,
      });
      setData(prev => [...prev, ...result.items]);
      setOffset(prev => prev + result.items.length);
    } catch { /* silent */ } finally {
      setLoadingMore(false);
    }
  }, [search, offset, total, loadingMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteEquipment(id);
    message.success('已删除');
    fetchInitial();
  };

  const handleSave = async (values: any) => {
    try {
      if (editEquip) {
        const { updateEquipment } = await import('../api/equipment');
        await updateEquipment(editEquip.id, values);
        message.success('更新成功');
      } else {
        const { createEquipment } = await import('../api/equipment');
        await createEquipment(values);
        message.success('创建成功');
      }
      setFormOpen(false);
      fetchInitial();
    } catch {
      message.error('保存失败');
    }
  };

  const columns: ColumnsType<Equipment> = [
    { title: 'LIN号', dataIndex: 'lin_number', key: 'lin', width: 120, fixed: 'left',
      render: (v: string | null) => v || '-' },
    { title: '名称', dataIndex: 'name', key: 'name', width: 180, ellipsis: true, fixed: 'left' },
    { title: '件号', dataIndex: 'part_number', key: 'pn', width: 150 },
    { title: 'ATA', dataIndex: 'ata_chapter', key: 'ata', width: 55 },
    { title: '类型', dataIndex: 'equipment_type', key: 'type', width: 70 },
    { title: '英文名称', dataIndex: 'name_en', key: 'name_en', width: 180, ellipsis: true,
      render: (v: string | null) => v || '-' },
    { title: 'DAL', dataIndex: 'dal', key: 'dal', width: 50,
      render: (v: string | null) => v || '-' },
    { title: '重量(kg)', key: 'mass', width: 80, align: 'right',
      render: (_, r) => r.weight_balance?.mass_kg?.toFixed(1) || '-' },
    { title: '尺寸(mm)', dataIndex: 'dimensions_mm', key: 'dims', width: 120, ellipsis: true,
      render: (v: string | null) => v || '-' },
    { title: '连接器数', dataIndex: 'connector_count', key: 'conn', width: 75, align: 'right',
      render: (v: number | null) => v ?? '-' },
    { title: '电压范围(V)', dataIndex: 'voltage_range', key: 'volt', width: 110, ellipsis: true,
      render: (v: string | null) => v || '-' },
    { title: '壳体金属', dataIndex: 'is_metal_shell', key: 'metal', width: 75,
      render: (v: boolean | null) => v === true ? '是' : v === false ? '否' : '-' },
    { title: '接地方式', dataIndex: 'shell_grounding_method', key: 'gnd', width: 90, ellipsis: true,
      render: (v: string | null) => v || '-' },
    { title: '功耗(kVA)', key: 'power', width: 80, align: 'right',
      render: (_, r) => r.electrical_load?.power_kva_normal?.toFixed(1) || '-' },
    { title: 'EICD', dataIndex: 'has_eicd', key: 'eicd', width: 55,
      render: (v: boolean | null) => v === true ? '有' : v === false ? '无' : '-' },
    { title: '供应商', key: 'supplier', width: 120, ellipsis: true,
      render: (_, r) => r.supplier_name || '-' },
    { title: '负责人', dataIndex: 'responsible_person', key: 'person', width: 80, ellipsis: true,
      render: (v: string | null) => v || '-' },
    { title: '温度鉴定等级', dataIndex: 'do160_temp_qual_level', key: 'temp', width: 120, ellipsis: true,
      render: (v: string | null) => v || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 70,
      render: (s: string) => {
        const cfg = STATUS_TAGS[s] || { color: 'default', text: s };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    { title: '', key: 'action', width: 40, fixed: 'right',
      render: (_, record) => (
        <Popconfirm title="确认删除?" onConfirm={(e) => handleDelete(record.id, e as any)} onCancel={(e) => e?.stopPropagation()}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
        <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => { setEditEquip(null); setFormOpen(true); }}>
          新建设备
        </Button>
        <Input
          placeholder="搜索LIN号/件号/名称"
          prefix={<SearchOutlined />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
          size="small"
          style={{ width: 240 }}
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          共 {total} 台设备{data.length < total ? `，已加载 ${data.length}` : ''}
          （设备固有属性，不依赖构型）
        </Text>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={false}
        scroll={{ x: 2400 }}
        onRow={(record) => ({
          onClick: () => setDetailEquip(record),
          style: { cursor: 'pointer' },
        })}
      />
      <div ref={sentinelRef} style={{ height: 1 }} />
      {loadingMore && <div style={{ textAlign: 'center', padding: 16 }}><Spin size="small" /></div>}
      {offset >= total && total > 0 && (
        <div style={{ textAlign: 'center', padding: 12, color: '#ccc', fontSize: 12 }}>— 全部 {total} 台设备 —</div>
      )}

      {/* Create/Edit form */}
      <EquipmentForm open={formOpen} equipment={editEquip} onSave={handleSave} onCancel={() => setFormOpen(false)} />

      {/* Detail drawer */}
      <Drawer
        title={detailEquip ? `${detailEquip.lin_number || detailEquip.part_number} — ${detailEquip.name}` : ''}
        open={!!detailEquip}
        onClose={() => setDetailEquip(null)}
        width={520}
      >
        {detailEquip && (
          <>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="LIN号">{detailEquip.lin_number || '-'}</Descriptions.Item>
              <Descriptions.Item label="件号">{detailEquip.part_number}</Descriptions.Item>
              <Descriptions.Item label="名称" span={2}>{detailEquip.name}</Descriptions.Item>
              <Descriptions.Item label="英文名称" span={2}>{detailEquip.name_en || '-'}</Descriptions.Item>
              <Descriptions.Item label="ATA">{detailEquip.ata_chapter}</Descriptions.Item>
              <Descriptions.Item label="类型">{detailEquip.equipment_type}</Descriptions.Item>
              <Descriptions.Item label="DAL">{detailEquip.dal || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag>{detailEquip.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="供应商">{detailEquip.supplier_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="负责人">{detailEquip.responsible_person || '-'}</Descriptions.Item>
            </Descriptions>

            {detailEquip.weight_balance && (
              <>
                <Divider orientation="left">重量</Divider>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="重量">{detailEquip.weight_balance.mass_kg} kg</Descriptions.Item>
                </Descriptions>
              </>
            )}

            <Divider orientation="left">物理特性</Divider>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="尺寸">{detailEquip.dimensions_mm || '-'}</Descriptions.Item>
              <Descriptions.Item label="连接器数">{detailEquip.connector_count ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="壳体金属">{detailEquip.is_metal_shell === true ? '是' : detailEquip.is_metal_shell === false ? '否' : '-'}</Descriptions.Item>
              <Descriptions.Item label="电压范围">{detailEquip.voltage_range || '-'}</Descriptions.Item>
              <Descriptions.Item label="接地方式" span={2}>{detailEquip.shell_grounding_method || '-'}</Descriptions.Item>
              <Descriptions.Item label="物理特性" span={2}>{detailEquip.physical_characteristics || '-'}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">电气</Divider>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="是否电设备">{detailEquip.is_electrical === true ? '是' : detailEquip.is_electrical === false ? '否' : '-'}</Descriptions.Item>
              <Descriptions.Item label="EICD">{detailEquip.has_eicd === true ? '有' : detailEquip.has_eicd === false ? '无' : '-'}</Descriptions.Item>
              <Descriptions.Item label="功耗">{detailEquip.electrical_load?.power_kva_normal?.toFixed(2) || '-'} kVA</Descriptions.Item>
              <Descriptions.Item label="供电余度">{detailEquip.power_redundancy || '-'}</Descriptions.Item>
            </Descriptions>

            {detailEquip.do160_temp_qual_level && (
              <>
                <Divider orientation="left">DO-160 温度鉴定</Divider>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="鉴定等级">{detailEquip.do160_temp_qual_level || '-'}</Descriptions.Item>
                  <Descriptions.Item label="正常工作温度">{detailEquip.normal_operating_temp || '-'}</Descriptions.Item>
                  <Descriptions.Item label="鉴定报告号">{detailEquip.qual_report_number || '-'}</Descriptions.Item>
                </Descriptions>
              </>
            )}

            <div style={{ marginTop: 16 }}>
              <Button type="primary" size="small" onClick={() => { setDetailEquip(null); setEditEquip(detailEquip); setFormOpen(true); }}>
                编辑设备
              </Button>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
