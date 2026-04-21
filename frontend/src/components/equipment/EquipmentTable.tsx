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
    { title: '件号', dataIndex: 'part_number', key: 'part_number', width: 160 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 200, ellipsis: true },
    { title: 'ATA', dataIndex: 'ata_chapter', key: 'ata', width: 60 },
    { title: '类型', dataIndex: 'equipment_type', key: 'type', width: 80 },
    {
      title: '重量(kg)', key: 'mass', width: 90, align: 'right',
      render: (_, r) => r.weight_balance?.mass_kg?.toFixed(1) || '-',
    },
    {
      title: '区域', key: 'zone', width: 120, ellipsis: true,
      render: (_, r) => r.installation?.rack_position || '-',
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: string) => {
        const cfg = STATUS_TAGS[s] || { color: 'default', text: s };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '', key: 'action', width: 40,
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
        scroll={{ x: 800 }}
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
