import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Table, Tag, Button, Popconfirm, message, Spin } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { listEquipment, deleteEquipment } from '../../api/equipment';
import type { Equipment } from '../../types';

interface Props {
  configId: string | null;
  search: string;
  onEdit: (equip: Equipment) => void;
  onSelect: (equip: Equipment) => void;
}

const STATUS_TAGS: Record<string, { color: string; text: string }> = {
  approved: { color: 'green', text: '已批准' },
  in_development: { color: 'blue', text: '在研' },
  qualifying: { color: 'orange', text: '鉴定中' },
  discontinued: { color: 'red', text: '停产' },
};

const PAGE_SIZE = 50;

export function EquipmentTable({ configId, search, onEdit, onSelect }: Props) {
  const [data, setData] = useState<Equipment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset and fetch from beginning when configId or search changes
  const fetchInitial = useCallback(async () => {
    if (!configId) return;
    setLoading(true);
    setOffset(0);
    try {
      const result = await listEquipment({
        config_id: configId,
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
  }, [configId, search]);

  useEffect(() => { fetchInitial(); }, [fetchInitial]);

  // Load more
  const loadMore = useCallback(async () => {
    if (!configId || loadingMore || offset >= total) return;
    setLoadingMore(true);
    try {
      const result = await listEquipment({
        config_id: configId,
        search: search || undefined,
        offset,
        limit: PAGE_SIZE,
      });
      setData(prev => [...prev, ...result.items]);
      setOffset(prev => prev + result.items.length);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [configId, search, offset, total, loadingMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
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
    (window as any).__constraintRefresh?.();
  };

  const columns: ColumnsType<Equipment> = [
    { title: 'LIN号', dataIndex: 'lin_number', key: 'lin', width: 120, fixed: 'left',
      render: (v: string | null) => v || '-' },
    { title: '件号', dataIndex: 'part_number', key: 'part_number', width: 150, fixed: 'left' },
    { title: '名称', dataIndex: 'name', key: 'name', width: 180, ellipsis: true, fixed: 'left' },
    { title: 'ATA', dataIndex: 'ata_chapter', key: 'ata', width: 55 },
    { title: '类型', dataIndex: 'equipment_type', key: 'type', width: 70 },
    { title: '英文名称', dataIndex: 'name_en', key: 'name_en', width: 180, ellipsis: true,
      render: (v: string | null) => v || '-' },
    { title: 'DAL', dataIndex: 'dal', key: 'dal', width: 50,
      render: (v: string | null) => v || '-' },
    {
      title: '区域', key: 'zone', width: 130, ellipsis: true,
      render: (_, r) => {
        const zone = r.config_data?.zone_name || '';
        const rack = r.config_data?.rack_position || '';
        if (zone && rack) return `${zone}-${rack}`;
        return zone || rack || '-';
      },
    },
    {
      title: 'STA', key: 'sta', width: 55, align: 'right',
      render: (_, r) => r.config_data?.sta?.toFixed(0) || '-',
    },
    {
      title: 'WL', key: 'wl', width: 55, align: 'right',
      render: (_, r) => r.config_data?.wl?.toFixed(0) || '-',
    },
    {
      title: 'BL', key: 'bl', width: 55, align: 'right',
      render: (_, r) => r.config_data?.bl?.toFixed(0) || '-',
    },
    {
      title: '重量(kg)', key: 'mass', width: 80, align: 'right',
      render: (_, r) => r.weight_balance?.mass_kg?.toFixed(1) || '-',
    },
    { title: '尺寸(mm)', dataIndex: 'dimensions_mm', key: 'dims', width: 120, ellipsis: true,
      render: (v: string | null) => v || '-' },
    { title: '连接器数', dataIndex: 'connector_count', key: 'connector', width: 75, align: 'right',
      render: (v: number | null) => v ?? '-' },
    { title: '电压范围(V)', dataIndex: 'voltage_range', key: 'voltage', width: 110, ellipsis: true,
      render: (v: string | null) => v || '-' },
    {
      title: '壳体金属', dataIndex: 'is_metal_shell', key: 'metal', width: 75,
      render: (v: boolean | null) => v === true ? '是' : v === false ? '否' : '-',
    },
    { title: '接地方式', dataIndex: 'shell_grounding_method', key: 'grounding', width: 90, ellipsis: true,
      render: (v: string | null) => v || '-' },
    {
      title: '安装方式', key: 'install', width: 110, ellipsis: true,
      render: (_, r) => r.config_data?.install_method || '-',
    },
    {
      title: '电搭接方式', key: 'bond_method', width: 90, ellipsis: true,
      render: (_, r) => r.config_data?.bonding_method || '-',
    },
    {
      title: '电搭接类型', key: 'bond_type', width: 100, ellipsis: true,
      render: (_, r) => r.config_data?.bonding_type || '-',
    },
    {
      title: 'EICD', dataIndex: 'has_eicd', key: 'eicd', width: 55,
      render: (v: boolean | null) => v === true ? '有' : v === false ? '无' : '-',
    },
    {
      title: '母线', key: 'bus', width: 100, ellipsis: true,
      render: (_, r) => r.config_data?.bus_name || '-',
    },
    {
      title: '功耗(kVA)', key: 'power', width: 80, align: 'right',
      render: (_, r) => r.electrical_load?.power_kva_normal?.toFixed(1) || '-',
    },
    { title: '供电电压', dataIndex: 'power_voltage', key: 'pv', width: 80, ellipsis: true,
      render: (v: string | null) => v || '-' },
    { title: '供电余度', dataIndex: 'power_redundancy', key: 'pr', width: 80, ellipsis: true,
      render: (v: string | null) => v || '-' },
    { title: '负责人', dataIndex: 'responsible_person', key: 'person', width: 80, ellipsis: true,
      render: (v: string | null) => v || '-' },
    { title: '温度鉴定等级', dataIndex: 'do160_temp_qual_level', key: 'temp_level', width: 120, ellipsis: true,
      render: (v: string | null) => v || '-' },
    { title: '正常工作温度', dataIndex: 'normal_operating_temp', key: 'normal_temp', width: 110, ellipsis: true,
      render: (v: string | null) => v || '-' },
    {
      title: '供应商', key: 'supplier', width: 120, ellipsis: true,
      render: (_, r) => r.supplier_name || '-',
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 70,
      render: (s: string) => {
        const cfg = STATUS_TAGS[s] || { color: 'default', text: s };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '', key: 'action', width: 40, fixed: 'right',
      render: (_, record) => (
        <Popconfirm title="确认删除?" onConfirm={(e) => handleDelete(record.id, e as any)} onCancel={(e) => e?.stopPropagation()}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 8, color: '#999', fontSize: 12 }}>
        共 {total} 台设备{data.length < total ? `，已加载 ${data.length} 台` : ''}
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={false}
        scroll={{ x: 3200 }}
        onRow={(record) => ({
          onClick: () => onSelect(record),
          style: { cursor: 'pointer' },
        })}
      />
      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} style={{ height: 1 }} />
      {loadingMore && (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <Spin size="small" />
        </div>
      )}
      {offset >= total && total > 0 && (
        <div style={{ textAlign: 'center', padding: 12, color: '#ccc', fontSize: 12 }}>
          — 全部 {total} 台设备 —
        </div>
      )}
    </div>
  );
}
