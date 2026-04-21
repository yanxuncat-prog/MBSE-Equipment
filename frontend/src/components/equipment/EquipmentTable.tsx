import React, { useEffect, useState, useCallback } from 'react';
import { Table, Input, Space, Tag, Button, Popconfirm, message } from 'antd';
import { PlusOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { listEquipment, deleteEquipment } from '../../api/equipment';
import type { Equipment } from '../../types';

interface Props {
  configId: string | null;
  onAdd: () => void;
  onEdit: (equip: Equipment) => void;
  onSelect: (equip: Equipment) => void;
}

const STATUS_TAGS: Record<string, { color: string; text: string }> = {
  approved: { color: 'green', text: '已批准' },
  in_development: { color: 'blue', text: '在研' },
  qualifying: { color: 'orange', text: '鉴定中' },
  discontinued: { color: 'red', text: '停产' },
};

export function EquipmentTable({ configId, onAdd, onEdit, onSelect }: Props) {
  const [data, setData] = useState<Equipment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    if (!configId) return;
    setLoading(true);
    try {
      const offset = (pagination.current - 1) * pagination.pageSize;
      const result = await listEquipment({
        config_id: configId,
        search: search || undefined,
        offset,
        limit: pagination.pageSize,
      });
      setData(result.items);
      setTotal(result.total);
    } catch {
      message.error('加载设备列表失败');
    } finally {
      setLoading(false);
    }
  }, [configId, pagination.current, pagination.pageSize, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    await deleteEquipment(id);
    message.success('已删除');
    fetchData();
    (window as any).__constraintRefresh?.();
  };

  const columns: ColumnsType<Equipment> = [
    { title: '件号', dataIndex: 'part_number', key: 'part_number', width: 120, fixed: 'left' },
    { title: '名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: 'ATA', dataIndex: 'ata_chapter', key: 'ata', width: 80 },
    { title: '类型', dataIndex: 'equipment_type', key: 'type', width: 80 },
    {
      title: '重量(kg)', key: 'mass', width: 90, align: 'right',
      render: (_, r) => r.weight_balance?.mass_kg?.toFixed(1) || '-',
    },
    {
      title: '母线', key: 'bus', width: 100,
      render: (_, r) => r.electrical_load ? '已分配' : '-',
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: string) => {
        const cfg = STATUS_TAGS[s] || { color: 'default', text: s };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '操作', key: 'action', width: 80, fixed: 'right',
      render: (_, record) => (
        <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
          <Button type="link" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>添加设备</Button>
        <Input
          placeholder="搜索件号/名称"
          prefix={<SearchOutlined />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onPressEnter={() => { setPagination(p => ({ ...p, current: 1 })); }}
          style={{ width: 240 }}
          allowClear
        />
      </Space>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        size="small"
        scroll={{ x: 900 }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 台设备`,
        }}
        onChange={(p: TablePaginationConfig) => setPagination({ current: p.current || 1, pageSize: p.pageSize || 20 })}
        onRow={(record) => ({
          onClick: () => onSelect(record),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  );
}
